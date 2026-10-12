# /// script
# requires-python = ">=3.12"
# dependencies = ["duckdb>=1.4", "geopandas>=1.0", "pyarrow>=17", "pandas>=2.2", "pyproj>=3.6"]
# ///
import csv

import duckdb
import geopandas as gpd
import pandas as pd
from pyproj import Transformer

from comum import (
    BRUTOS,
    CRS_TRABALHO,
    DERIVADOS,
    agora_recife,
    caminho_relativo_dados,
    carregar_manifesto,
    salvar_manifesto,
    sql_texto,
)
from enderecos import chave_bairro, chaves_logradouro
from iptu import CAMPOS_DESCARTADOS, CAMPOS_DO_IMOVEL

CSV_IMOVEIS = BRUTOS / "recife" / "iptu" / "iptu_2026_campos_do_imovel.csv"
CHAVE_MANIFESTO = "iptu/iptu_2026_campos_do_imovel.csv"
BAIRROS = DERIVADOS / "area_urbana" / "bairros.parquet"
SAIDA_UNIDADES = DERIVADOS / "iptu_2026_imoveis.parquet"
SAIDA_EDIFICIOS = DERIVADOS / "iptu_2026_edificios.parquet"
REGIME_INTERDITADO = "Isenção Imóvel Interditado"


def decimal(coluna: str) -> str:
    return f"TRY_CAST(replace(nullif(trim(\"{coluna}\"), ''), ',', '.') AS DOUBLE)"


def inteiro(coluna: str) -> str:
    return f"TRY_CAST(TRY_CAST(nullif(trim(\"{coluna}\"), '') AS DOUBLE) AS INTEGER)"


def texto(coluna: str) -> str:
    return f"nullif(trim(\"{coluna}\"), '')"


def validar_cabecalho() -> None:
    with CSV_IMOVEIS.open(encoding="utf-8", newline="") as arquivo:
        cabecalho = next(csv.reader(arquivo))
    proibidos = set(cabecalho) & set(CAMPOS_DESCARTADOS)
    if proibidos:
        raise ValueError(f"o CSV contém campos de contribuinte e não será processado: {sorted(proibidos)}")
    if tuple(cabecalho) != tuple(CAMPOS_DO_IMOVEL):
        raise ValueError(f"cabeçalho inesperado: {cabecalho}")


def consulta_tipada() -> str:
    return f"""
    SELECT
        {inteiro('_id')} AS registro_datastore,
        {inteiro('ano do exercício')} AS exercicio,
        {texto('logradouro')} AS logradouro,
        nullif({inteiro('numero')}, 0) AS numero,
        {texto('complemento')} AS complemento,
        {texto('bairro')} AS bairro,
        {texto('cidade')} AS cidade,
        {texto('estado')} AS estado,
        lpad({texto('CEP')}, 8, '0') AS cep,
        {inteiro('Código Logradouro')} AS codigo_logradouro,
        {decimal('fração ideal')} AS fracao_ideal,
        {decimal('AREA TERRENO')} AS area_terreno_m2,
        {decimal('AREA CONSTRUIDA')} AS area_construida_m2,
        {decimal('área ocupada')} AS area_ocupada_m2,
        {decimal('valor do m2 do terreno')} AS valor_m2_terreno,
        {decimal('valor do m2 de construção')} AS valor_m2_construcao,
        nullif({inteiro('ano da construção corrigido')}, 0) AS ano_construcao,
        CASE WHEN {inteiro('quantidade de pavimentos')} > 0 THEN {inteiro('quantidade de pavimentos')} END AS pavimentos_da_unidade,
        {texto('tipo de uso do imóvel')} AS tipo_uso,
        {texto('tipo de padrão da construção')} AS padrao_construcao,
        {decimal('fator de obsolescência')} AS fator_obsolescencia,
        {decimal('valor total do imóvel estimado')} AS valor_venal_estimado,
        {decimal('valor cobrado de IPTU')} AS iptu_cobrado,
        {texto('Regime de Tributação do iptu')} AS regime_tributacao_iptu,
        {texto('Regime de Tributação da trsd')} AS regime_tributacao_trsd,
        {texto('Tipo de Construção')} AS tipo_construcao,
        {texto('Tipo de Empreendimento')} AS tipo_empreendimento,
        {texto('Tipo de Estrutura')} AS tipo_estrutura,
        {decimal('latitude')} AS latitude,
        {decimal('longitude')} AS longitude
    FROM read_csv({sql_texto(CSV_IMOVEIS)}, header=true, all_varchar=true)
    """


def acrescentar_chaves_e_coordenadas(unidades: pd.DataFrame) -> pd.DataFrame:
    logradouros = pd.Series(unidades["logradouro"].dropna().unique())
    chaves = pd.DataFrame([chaves_logradouro(nome) for nome in logradouros])
    chaves.columns = ["chave_exato", "chave_sem_titulos", "chave_nucleo"]
    chaves["logradouro"] = logradouros.to_numpy()
    unidades = unidades.merge(chaves, on="logradouro", how="left")
    bairros = gpd.read_parquet(BAIRROS)[["codigo_bairro", "chave_bairro"]]
    unidades["chave_bairro"] = unidades["bairro"].map(chave_bairro, na_action="ignore")
    unidades = unidades.merge(pd.DataFrame(bairros), on="chave_bairro", how="left")
    unidades["codigo_bairro"] = unidades["codigo_bairro"].astype("Int64")
    paraUTM = Transformer.from_crs("EPSG:4326", CRS_TRABALHO, always_xy=True)
    com_coordenada = unidades["latitude"].notna() & unidades["longitude"].notna()
    x, y = paraUTM.transform(unidades.loc[com_coordenada, "longitude"].to_numpy(), unidades.loc[com_coordenada, "latitude"].to_numpy())
    unidades.loc[com_coordenada, "x"] = x.round(1)
    unidades.loc[com_coordenada, "y"] = y.round(1)
    return unidades


CONSULTA_EDIFICIOS = f"""
SELECT
    codigo_logradouro,
    numero,
    mode(logradouro) AS logradouro,
    mode(bairro) AS bairro,
    mode(codigo_bairro) AS codigo_bairro,
    mode(cep) AS cep,
    count(*) AS unidades,
    count(*) FILTER (WHERE tipo_uso = 'RESIDENCIAL') AS unidades_residenciais,
    count(*) FILTER (WHERE tipo_empreendimento = 'Apartamento') AS apartamentos,
    count(*) FILTER (WHERE tipo_construcao LIKE '%> 4 Pavimentos') AS unidades_em_construcao_acima_de_4_pavimentos,
    count(*) FILTER (WHERE regime_tributacao_iptu = '{REGIME_INTERDITADO}') AS unidades_isentas_por_interdicao,
    mode(ano_construcao) AS ano_construcao_mais_comum,
    min(ano_construcao) AS ano_construcao_min,
    max(ano_construcao) AS ano_construcao_max,
    mode(padrao_construcao) AS padrao_construcao,
    mode(tipo_construcao) AS tipo_construcao,
    mode(tipo_estrutura) AS tipo_estrutura,
    round(median(area_construida_m2) FILTER (WHERE tipo_uso = 'RESIDENCIAL'), 1) AS area_construida_mediana_residencial_m2,
    round(sum(area_construida_m2), 1) AS area_construida_total_m2,
    round(median(iptu_cobrado) FILTER (WHERE tipo_uso = 'RESIDENCIAL'), 2) AS iptu_mediano_residencial,
    round(median(valor_venal_estimado) FILTER (WHERE tipo_uso = 'RESIDENCIAL'), 2) AS valor_venal_mediano_residencial,
    count(x) AS unidades_com_coordenada,
    round(median(x), 1) AS x,
    round(median(y), 1) AS y
FROM unidades
WHERE codigo_logradouro IS NOT NULL AND numero IS NOT NULL
GROUP BY codigo_logradouro, numero
"""


def registrar_remocao_no_manifesto() -> None:
    manifesto = carregar_manifesto()
    for entrada in manifesto["arquivos"]:
        if entrada["chave"] == CHAVE_MANIFESTO:
            entrada["removido_apos_ingestao"] = agora_recife().isoformat(timespec="seconds")
            entrada["derivados"] = [caminho_relativo_dados(SAIDA_UNIDADES), caminho_relativo_dados(SAIDA_EDIFICIOS)]
    salvar_manifesto(manifesto)


def main() -> None:
    validar_cabecalho()
    conexao = duckdb.connect()
    unidades = acrescentar_chaves_e_coordenadas(conexao.execute(consulta_tipada()).df())
    unidades.to_parquet(SAIDA_UNIDADES, index=False)
    conexao.register("unidades", unidades)
    edificios = conexao.execute(CONSULTA_EDIFICIOS).df()
    edificios.to_parquet(SAIDA_EDIFICIOS, index=False)
    sem_bairro = unidades["codigo_bairro"].isna().sum()
    print(f"gravado: {SAIDA_UNIDADES.name} ({len(unidades)} unidades; {sem_bairro} sem bairro oficial reconhecido)")
    print(f"gravado: {SAIDA_EDIFICIOS.name} ({len(edificios)} endereços)")
    CSV_IMOVEIS.unlink()
    registrar_remocao_no_manifesto()
    print(f"apagado: {CSV_IMOVEIS.name}")


if __name__ == "__main__":
    main()
