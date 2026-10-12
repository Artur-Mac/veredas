# /// script
# requires-python = ">=3.12"
# dependencies = ["duckdb>=1.4", "geopandas>=1.0", "pandas>=2.2", "pyarrow>=17", "pyproj>=3.6"]
# ///
import json

import duckdb
import pandas as pd

from comum import DERIVADOS
from geocodificador import Geocodificador
from ligacao_iptu_edificacoes import ligar_edificios_iptu

AREA_URBANA = DERIVADOS / "area_urbana"
SAIDA = DERIVADOS / "analise"
MIN_UNIDADES_RUAS = 8
MIN_PAVIMENTOS_RUAS = 4
MIN_PREDIOS_POR_RUA = 3
RUAS_LISTADAS = 20
BAIRRO_FOCO = "BOA VIAGEM"
PAVIMENTOS_FOCO = (8, 30)
MIN_UNIDADES_FOCO = 20
ENDERECOS_FOCO = 15
MAXIMO_POR_RUA_FOCO = 2
EXEMPLOS = 5
SEMENTE = 20261012


def edificios_com_pavimentos(geocodificador: Geocodificador) -> pd.DataFrame:
    combinados = ligar_edificios_iptu(geocodificador)
    residenciais = combinados[combinados["unidades_residenciais"] >= MIN_UNIDADES_RUAS]
    print(
        f"endereços do IPTU com {MIN_UNIDADES_RUAS}+ unidades residenciais: {len(residenciais)}; "
        f"com pavimentos do cadastro de edificações: {residenciais['pavimentos'].notna().mean():.1%} "
        f"({residenciais['ligacao'].value_counts().to_dict()})"
    )
    return combinados


def defesa_civil_por_logradouro(geocodificador: Geocodificador) -> pd.DataFrame:
    registros = pd.read_parquet(DERIVADOS / "defesa_civil_2021_2024.parquet")
    pares = registros[["logradouro_texto", "bairro"]].drop_duplicates()
    casamentos = [geocodificador.logradouro_oficial(l, b) for l, b in zip(pares["logradouro_texto"], pares["bairro"])]
    pares["bairro_reconhecido"] = [geocodificador.codigo_bairro(b) is not None for b in pares["bairro"]]
    pares["codigo_logradouro"] = pd.array([c.codigo_logradouro if c else None for c in casamentos], dtype="Int64")
    pares["codigo_bairro"] = pd.array([c.codigo_bairro if c else None for c in casamentos], dtype="Int64")
    pares["nivel_casamento"] = [(c.nivel + ("_bairro_vizinho" if c.bairro_vizinho else "")) if c else None for c in casamentos]
    ligados = registros.merge(pares, on=["logradouro_texto", "bairro"], how="left")
    print(
        f"registros da Defesa Civil com bairro reconhecido: {ligados['bairro_reconhecido'].mean():.1%}; "
        f"com logradouro oficial identificado: {ligados['codigo_logradouro'].notna().mean():.1%} de {len(ligados)}"
    )
    print("níveis de casamento (registros):", ligados["nivel_casamento"].value_counts(dropna=False).to_dict())
    return ligados


def nomes_oficiais() -> pd.DataFrame:
    nomes = pd.read_parquet(AREA_URBANA / "logradouros_por_bairro.parquet")
    return nomes[["codigo_logradouro", "codigo_bairro", "nome_oficial", "nome_bairro"]]


def ruas_com_predios(defesa_civil: pd.DataFrame, edificios: pd.DataFrame) -> pd.DataFrame:
    conexao = duckdb.connect()
    conexao.register("dc", defesa_civil[defesa_civil["codigo_logradouro"].notna()])
    conexao.register("edificios", edificios)
    conexao.register("nomes", nomes_oficiais())
    return conexao.execute(
        f"""
        WITH atendimentos AS (
            SELECT codigo_logradouro, codigo_bairro, count(*) AS registros_defesa_civil,
                   count(*) FILTER (WHERE grau_de_risco IN ('R3', 'R4')) AS registros_r3_r4,
                   string_agg(DISTINCT ano_arquivo::VARCHAR, ',' ORDER BY ano_arquivo::VARCHAR) AS anos
            FROM dc GROUP BY ALL
        ),
        por_ocorrencia AS (
            SELECT codigo_logradouro, codigo_bairro,
                   string_agg(ocorrencia_canonico || ' ' || n, '; ' ORDER BY n DESC) AS por_ocorrencia
            FROM (SELECT codigo_logradouro, codigo_bairro, ocorrencia_canonico, count(*) n FROM dc WHERE ocorrencia_canonico IS NOT NULL GROUP BY ALL)
            GROUP BY ALL
        ),
        por_solicitacao AS (
            SELECT codigo_logradouro, codigo_bairro,
                   string_agg(solicitacao_canonico || ' ' || n, '; ' ORDER BY n DESC) AS por_solicitacao
            FROM (SELECT codigo_logradouro, codigo_bairro, solicitacao_canonico, count(*) n FROM dc WHERE solicitacao_canonico IS NOT NULL GROUP BY ALL)
            GROUP BY ALL
        ),
        predios AS (
            SELECT codigo_logradouro, codigo_bairro, count(*) AS predios,
                   string_agg(numero::VARCHAR, ', ' ORDER BY numero) AS numeros
            FROM edificios
            WHERE unidades_residenciais >= {MIN_UNIDADES_RUAS} AND pavimentos >= {MIN_PAVIMENTOS_RUAS}
            GROUP BY ALL
        )
        SELECT n.nome_oficial AS logradouro, n.nome_bairro AS bairro, a.registros_defesa_civil, a.registros_r3_r4, a.anos,
               coalesce(o.por_ocorrencia, '') AS por_ocorrencia, coalesce(s.por_solicitacao, '') AS por_solicitacao,
               p.predios, p.numeros, a.codigo_logradouro, a.codigo_bairro
        FROM atendimentos a
        JOIN predios p USING (codigo_logradouro, codigo_bairro)
        LEFT JOIN por_ocorrencia o USING (codigo_logradouro, codigo_bairro)
        LEFT JOIN por_solicitacao s USING (codigo_logradouro, codigo_bairro)
        LEFT JOIN nomes n USING (codigo_logradouro, codigo_bairro)
        WHERE p.predios >= {MIN_PREDIOS_POR_RUA}
        ORDER BY a.registros_defesa_civil DESC
        LIMIT {RUAS_LISTADAS}
        """
    ).df()


def enderecos_foco(edificios: pd.DataFrame, defesa_civil: pd.DataFrame, geocodificador: Geocodificador) -> pd.DataFrame:
    codigo_foco = geocodificador.codigo_bairro(BAIRRO_FOCO)
    minimo, maximo = PAVIMENTOS_FOCO
    candidatos = edificios[
        (edificios["codigo_bairro"] == codigo_foco)
        & (edificios["unidades_residenciais"] >= MIN_UNIDADES_FOCO)
        & edificios["pavimentos"].between(minimo, maximo)
    ].copy()
    contagem_rua = (
        defesa_civil[defesa_civil["codigo_bairro"] == codigo_foco].groupby("codigo_logradouro").size().rename("registros_defesa_civil_na_rua")
    )
    candidatos = candidatos.merge(contagem_rua, left_on="codigo_logradouro", right_index=True, how="left")
    candidatos["registros_defesa_civil_na_rua"] = candidatos["registros_defesa_civil_na_rua"].fillna(0).astype(int)
    candidatos = candidatos.sample(frac=1, random_state=SEMENTE).sort_values("registros_defesa_civil_na_rua", ascending=False, kind="stable")
    escolhidos = candidatos.groupby("codigo_logradouro", sort=False).head(MAXIMO_POR_RUA_FOCO).head(ENDERECOS_FOCO)
    print(f"prédios em {BAIRRO_FOCO} com {minimo} a {maximo} pavimentos e {MIN_UNIDADES_FOCO}+ unidades residenciais: {len(candidatos)}")
    return escolhidos[
        ["logradouro", "numero", "pavimentos", "unidades_residenciais", "ano_construcao_mais_comum", "padrao_construcao",
         "registros_defesa_civil_na_rua", "ligacao", "dsqfl", "codigo_logradouro"]
    ]


def exemplos_de_formato() -> dict:
    edificacoes = pd.read_parquet(AREA_URBANA / "edificacoes.parquet", columns=["endereco_oficial", "dsqfl_valido"])
    oficiais = edificacoes[edificacoes["dsqfl_valido"] & edificacoes["endereco_oficial"].notna()]
    unidades = pd.read_parquet(DERIVADOS / "iptu_2026_imoveis.parquet", columns=["logradouro", "numero", "complemento", "bairro"])
    com_complemento = unidades.dropna(subset=["logradouro", "numero", "complemento"])
    return {
        "nmendcomp": oficiais["endereco_oficial"].sample(EXEMPLOS, random_state=SEMENTE).tolist(),
        "iptu": com_complemento.sample(EXEMPLOS, random_state=SEMENTE).astype({"numero": "Int64"}).astype(str).to_dict("records"),
    }


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    geocodificador = Geocodificador()
    edificios = edificios_com_pavimentos(geocodificador)
    defesa_civil = defesa_civil_por_logradouro(geocodificador)
    ruas = ruas_com_predios(defesa_civil, edificios)
    ruas.to_csv(SAIDA / "ruas_defesa_civil_com_predios.csv", index=False)
    foco = enderecos_foco(edificios, defesa_civil, geocodificador)
    foco.to_csv(SAIDA / "boa_viagem_predios_8_a_30_pavimentos.csv", index=False)
    exemplos = exemplos_de_formato()
    (SAIDA / "exemplos_de_endereco.json").write_text(json.dumps(exemplos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with pd.option_context("display.max_colwidth", 120, "display.width", 250):
        print(ruas.drop(columns=["codigo_logradouro", "codigo_bairro"]).to_string(index=False))
        print(foco.drop(columns=["codigo_logradouro"]).to_string(index=False))
    print(json.dumps(exemplos, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
