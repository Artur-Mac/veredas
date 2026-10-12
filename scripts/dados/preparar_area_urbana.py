# /// script
# requires-python = ">=3.12"
# dependencies = ["geopandas>=1.0", "pyogrio>=0.10", "pyarrow>=17", "pandas>=2.2", "shapely>=2.0"]
# ///
import json

import geopandas as gpd
import pandas as pd
import pyogrio
import shapely
from shapely.ops import nearest_points

from comum import BRUTOS, CRS_TRABALHO, DERIVADOS
from enderecos import chave_bairro, chaves_logradouro, decompor_endereco_oficial

PASTA = BRUTOS / "recife" / "area-urbana"
SAIDA = DERIVADOS / "area_urbana"

ARQUIVOS = {
    "bairros": PASTA / "bairros-do-recife.geojson",
    "trechos": PASTA / "trechos-de-logradouros.geojson",
    "quadras": PASTA / "quadras.geojson",
    "edificacoes": PASTA / "edificacoes-lotes.geojson",
    "pavimentos": PASTA / "edificacoes-pavimentos.geojson",
    "lotes": PASTA / "lotes.geojson",
}
LOGRADOUROS_POR_BAIRRO = PASTA / "trechos-de-logradouros-por-bairro.csv"

CAMADAS_EMPILHADAS = {
    "1_Pavimento", "2_Pavimento", "3_Pavimento", "4_Pavimento",
    "1_Pavimento_Parcial", "2_Pavimento_Parcial", "3_Pavimento_Parcial", "4_Pavimento_Parcial",
    "Acima_04_Pav_Parcial",
}
CAMADAS_PRISMA = {"Acima_04_Pav", "Base_de_Predio"}
REGRA_PAVIMENTOS = (
    "Camadas principais: 1_ a 4_Pavimento e suas versões _Parcial, Acima_04_Pav, Acima_04_Pav_Parcial e Base_de_Predio; "
    "excluídas Telheiro, Marquise, Guarita, Quiosque, Ruína, Fundação e Construção*. "
    "pavimentos = maior PAVIMENTO entre as camadas principais. "
    "area_construida_m2 = soma de QTAREA_TIPO das camadas empilhadas (um polígono por pavimento) "
    "+ soma de QTAREA_TIPO × PAVIMENTO de Acima_04_Pav e Base_de_Predio (um polígono para vários pavimentos). "
    "QTAREA_TIPO é a área de projeção do polígono."
)
TOLERANCIA_TRECHO_M = 5.0


def ler_camada(chave: str, colunas: list[str] | None = None) -> gpd.GeoDataFrame:
    camada = gpd.read_file(ARQUIVOS[chave], columns=colunas, engine="pyogrio")
    if camada.crs is None:
        raise ValueError(f"{ARQUIVOS[chave].name} sem CRS declarado")
    return camada.to_crs(CRS_TRABALHO)


def salvar(tabela: pd.DataFrame, nome: str) -> None:
    caminho = SAIDA / f"{nome}.parquet"
    tabela.to_parquet(caminho, index=False)
    print(f"gravado: {caminho.name} ({len(tabela)} linhas)")


def descrever_camadas() -> dict:
    descricao = {}
    for chave, arquivo in ARQUIVOS.items():
        if not arquivo.exists():
            descricao[chave] = {"arquivo": arquivo.name, "disponivel": False}
            continue
        info = pyogrio.read_info(arquivo)
        descricao[chave] = {
            "arquivo": arquivo.name,
            "disponivel": True,
            "crs_declarado": info["crs"],
            "geometria": info["geometry_type"],
            "feicoes": int(info["features"]),
            "campos": list(info["fields"]),
        }
        print(f"{arquivo.name}: CRS {info['crs']}, {info['features']} feições, {info['geometry_type']}")
    return descricao


def preparar_bairros() -> gpd.GeoDataFrame:
    bairros = ler_camada("bairros", ["CBAIRRCODI", "EBAIRRNOME", "EBAIRRNOMEOF"])
    bairros = bairros.rename(columns={"CBAIRRCODI": "codigo_bairro", "EBAIRRNOME": "nome_bairro", "EBAIRRNOMEOF": "nome_oficial"})
    bairros["codigo_bairro"] = bairros["codigo_bairro"].astype(int)
    bairros["chave_bairro"] = bairros["nome_bairro"].map(chave_bairro)
    salvar(bairros, "bairros")
    vizinhos = gpd.sjoin(
        bairros[["codigo_bairro", "geometry"]],
        bairros[["codigo_bairro", "geometry"]].rename(columns={"codigo_bairro": "codigo_vizinho"}),
        predicate="intersects",
    )
    vizinhos = vizinhos[vizinhos["codigo_bairro"] != vizinhos["codigo_vizinho"]][["codigo_bairro", "codigo_vizinho"]]
    salvar(pd.DataFrame(vizinhos).drop_duplicates(), "bairros_vizinhos")
    return bairros


def preparar_logradouros_por_bairro() -> pd.DataFrame:
    tabela = pd.read_csv(LOGRADOUROS_POR_BAIRRO, sep=";", dtype=str, keep_default_na=False)
    tabela = tabela.rename(
        columns={
            "codlogradouro": "codigo_logradouro",
            "nome_logradouro_concatenado": "nome_concatenado",
            "nome_oficial_logradouro": "nome_oficial",
            "nome_logradouro_resumido": "nome_resumido",
            "codbairro": "codigo_bairro",
            "nomeBairro": "nome_bairro",
        }
    )[["codigo_logradouro", "codigo_bairro", "nome_bairro", "nome_concatenado", "nome_oficial", "nome_resumido"]]
    tabela[["codigo_logradouro", "codigo_bairro"]] = tabela[["codigo_logradouro", "codigo_bairro"]].astype(int)
    salvar(tabela, "logradouros_por_bairro")
    linhas = []
    for registro in tabela.itertuples(index=False):
        for nome in {registro.nome_concatenado, registro.nome_oficial, registro.nome_resumido}:
            for nivel, chave in chaves_logradouro(nome).items():
                if chave:
                    linhas.append((registro.codigo_logradouro, registro.codigo_bairro, nivel, chave))
    chaves = pd.DataFrame(linhas, columns=["codigo_logradouro", "codigo_bairro", "nivel", "chave"]).drop_duplicates()
    salvar(chaves, "logradouros_chaves")
    return tabela


def ponto_representativo(linhas: shapely.Geometry) -> shapely.Point:
    return nearest_points(linhas, linhas.centroid)[0]


def preparar_trechos(bairros: gpd.GeoDataFrame) -> None:
    trechos = ler_camada("trechos", ["CLOGRACODI", "NLOGRACONC", "NLGPAVOFIC"])
    trechos = trechos.rename(columns={"CLOGRACODI": "codigo_logradouro", "NLOGRACONC": "nome", "NLGPAVOFIC": "nome_oficial"})
    trechos["codigo_logradouro"] = trechos["codigo_logradouro"].astype(int)
    salvar(trechos, "trechos_logradouros")
    pedacos = gpd.overlay(trechos[["codigo_logradouro", "geometry"]], bairros[["codigo_bairro", "geometry"]], how="intersection", keep_geom_type=True)
    pedacos["comprimento_m"] = pedacos.length
    por_bairro = pedacos.dissolve(by=["codigo_logradouro", "codigo_bairro"], aggfunc={"comprimento_m": "sum"}).reset_index()
    por_bairro = por_bairro[por_bairro["comprimento_m"] >= TOLERANCIA_TRECHO_M].copy()
    salvar(por_bairro, "trechos_por_bairro")
    pontos = por_bairro.geometry.map(ponto_representativo)
    por_bairro["x"] = pontos.map(lambda ponto: round(ponto.x, 1))
    por_bairro["y"] = pontos.map(lambda ponto: round(ponto.y, 1))
    salvar(pd.DataFrame(por_bairro.drop(columns="geometry")), "logradouros_pontos")


def preparar_quadras() -> None:
    quadras = ler_camada("quadras", ["DSQ"]).rename(columns={"DSQ": "dsq"})
    salvar(quadras, "quadras")


def agregar_pavimentos() -> pd.DataFrame:
    pavimentos = pyogrio.read_dataframe(
        ARQUIVOS["pavimentos"], columns=["DSQFL", "LAYER", "PAVIMENTO", "QTAREA_TIPO"], read_geometry=False
    )
    pavimentos = pavimentos[pavimentos["DSQFL"].fillna("").str.fullmatch(r"\d{14}")].copy()
    principal = pavimentos["LAYER"].isin(CAMADAS_EMPILHADAS | CAMADAS_PRISMA)
    multiplicador = pavimentos["LAYER"].isin(CAMADAS_PRISMA).map({True: 1, False: 0})
    pavimentos["area_pavimentos"] = pavimentos["QTAREA_TIPO"].fillna(0) * (
        multiplicador * pavimentos["PAVIMENTO"].fillna(0) + (1 - multiplicador)
    )
    pavimentos["pav_principal"] = pavimentos["PAVIMENTO"].where(principal)
    pavimentos["area_principal"] = pavimentos["area_pavimentos"].where(principal, 0.0)
    agregado = pavimentos.groupby("DSQFL").agg(
        pavimentos=("pav_principal", "max"),
        area_construida_m2=("area_principal", "sum"),
        poligonos=("LAYER", "size"),
        camadas=("LAYER", lambda serie: "|".join(sorted(set(serie)))),
    )
    agregado["em_construcao"] = agregado["camadas"].str.contains("Construção")
    agregado["com_ruina"] = agregado["camadas"].str.contains("Ruína")
    agregado = agregado.reset_index().rename(columns={"DSQFL": "dsqfl"})
    agregado["pavimentos"] = agregado["pavimentos"].astype("Int64")
    agregado["area_construida_m2"] = agregado["area_construida_m2"].round(1)
    salvar(agregado, "pavimentos_por_dsqfl")
    print("regra de agregação:", REGRA_PAVIMENTOS)
    return agregado


def acrescentar_endereco_decomposto(tabela: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    tabela["dsqfl_valido"] = tabela["dsqfl"].fillna("").str.fullmatch(r"\d{14}")
    tabela["endereco_oficial"] = tabela["endereco_oficial"].str.replace(r"\s+", " ", regex=True).str.strip()
    decomposto = tabela["endereco_oficial"].map(decompor_endereco_oficial)
    tabela["logradouro_texto"] = decomposto.str[0]
    tabela["numero"] = decomposto.str[1].astype("Int64")
    tabela["bairro_texto"] = decomposto.str[2]
    tabela["cep"] = decomposto.str[3]
    return tabela


def preparar_edificacoes(pavimentos: pd.DataFrame) -> None:
    edificacoes = ler_camada("edificacoes", ["DSQFL", "NMENDCOMP"]).rename(columns={"DSQFL": "dsqfl", "NMENDCOMP": "endereco_oficial"})
    edificacoes = acrescentar_endereco_decomposto(edificacoes)
    edificacoes["area_projecao_m2"] = edificacoes.area.round(1)
    centroides = edificacoes.geometry.representative_point()
    edificacoes["x"] = centroides.x.round(1)
    edificacoes["y"] = centroides.y.round(1)
    edificacoes = edificacoes.merge(pavimentos, on="dsqfl", how="left")
    salvar(edificacoes, "edificacoes")
    sem_pavimentos = edificacoes["pavimentos"].isna().sum()
    print(f"edificações sem agregação de pavimentos: {sem_pavimentos} de {len(edificacoes)}")


def preparar_lotes(pavimentos: pd.DataFrame) -> None:
    if not ARQUIVOS["lotes"].exists():
        print("lotes.geojson ausente: rode baixar_fontes.py area-urbana --somente lotes.geojson")
        return
    colunas = {
        "DSQFL": "dsqfl",
        "NMENDCOMP": "endereco_oficial",
        "NMEDIFICACAO": "nome_edificacao",
        "NMTIPOEMPRENDIMENTO": "tipo_empreendimento",
        "QTDPAVIMENTOS": "pavimentos_cadastro",
        "QTDUNHAB": "unidades_habitacionais",
        "AREATOTALCONSTRUIDA": "area_construida_cadastro_m2",
        "AREALOTE": "area_lote_m2",
        "TESTADAPRINCIPAL": "testada_m",
        "ANCONSTR": "ano_construcao",
        "SITUACAOIMOVEL": "situacao_imovel",
    }
    lotes = acrescentar_endereco_decomposto(ler_camada("lotes", list(colunas)).rename(columns=colunas))
    for coluna in ("pavimentos_cadastro", "unidades_habitacionais", "ano_construcao"):
        lotes[coluna] = lotes[coluna].round().astype("Int64")
    salvar(lotes, "lotes")
    comparacao = lotes.merge(pavimentos, on="dsqfl", how="inner").dropna(subset=["pavimentos", "pavimentos_cadastro"])
    iguais = (comparacao["pavimentos"] == comparacao["pavimentos_cadastro"]).mean()
    altos = comparacao[comparacao["pavimentos_cadastro"] >= 5]
    ate_um = ((altos["pavimentos"] - altos["pavimentos_cadastro"]).abs() <= 1).mean()
    razao = (altos["area_construida_m2"] / altos["area_construida_cadastro_m2"]).median()
    print(
        f"lotes x pavimentos: {len(comparacao)} dsqfl em comum; pavimentos iguais em {iguais:.1%}; "
        f"nos lotes com 5+ pavimentos, diferença de até 1 em {ate_um:.1%} e razão mediana de área {razao:.2f}"
    )


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    descricao = descrever_camadas()
    descricao["regra_pavimentos"] = REGRA_PAVIMENTOS
    descricao["crs_de_trabalho"] = CRS_TRABALHO
    (SAIDA / "camadas.json").write_text(json.dumps(descricao, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    bairros = preparar_bairros()
    preparar_logradouros_por_bairro()
    preparar_trechos(bairros)
    preparar_quadras()
    pavimentos = agregar_pavimentos()
    preparar_edificacoes(pavimentos)
    preparar_lotes(pavimentos)


if __name__ == "__main__":
    main()
