# /// script
# requires-python = ">=3.12"
# dependencies = ["duckdb>=1.4", "geopandas>=1.0", "pyarrow>=17", "pandas>=2.2", "pyproj>=3.6"]
# ///
import zipfile

import duckdb
import geopandas as gpd
import pandas as pd
from pyproj import Transformer

from comum import BRUTOS, CRS_TRABALHO, DERIVADOS, sql_texto
from enderecos import chaves_logradouro

PASTA = BRUTOS / "ibge" / "cnefe"
ZIP_RECIFE = PASTA / "2611606_RECIFE.zip"
CSV_RECIFE = PASTA / "2611606_RECIFE.csv"
BAIRROS = DERIVADOS / "area_urbana" / "bairros.parquet"
SAIDA = DERIVADOS / "cnefe_enderecos.parquet"
CRS_CNEFE = "EPSG:4674"
NIVEIS_DE_ENDERECO = ("1", "2", "3")

CONSULTA_REGISTROS = """
CREATE TABLE registros AS
SELECT
    NOM_TIPO_SEGLOGR AS tipo,
    NOM_TITULO_SEGLOGR AS titulo,
    NOM_SEGLOGR AS nome,
    TRY_CAST(NUM_ENDERECO AS INTEGER) AS numero,
    DSC_LOCALIDADE AS localidade,
    CEP AS cep,
    NV_GEO_COORD AS nivel_geo,
    COD_ESPECIE AS especie,
    COD_TIPO_ESPECI AS tipo_especie,
    TRY_CAST(LATITUDE AS DOUBLE) AS lat,
    TRY_CAST(LONGITUDE AS DOUBLE) AS lon
FROM read_csv({arquivo}, delim=';', header=true, all_varchar=true)
"""

CONSULTA_AGREGADA = """
SELECT
    tipo, titulo, nome, numero, localidade,
    mode(cep) AS cep,
    count(*) AS registros,
    count(*) FILTER (WHERE especie = '1') AS domicilios_particulares,
    count(*) FILTER (WHERE tipo_especie = '103') AS apartamentos,
    count(*) FILTER (WHERE especie IN ('4', '5', '6', '8')) AS estabelecimentos,
    count(*) FILTER (WHERE especie = '7') AS em_construcao_ou_reforma,
    min(nivel_geo) AS nivel_geo,
    median(lat) FILTER (WHERE nivel_geo IN {niveis}) AS lat,
    median(lon) FILTER (WHERE nivel_geo IN {niveis}) AS lon
FROM registros
WHERE numero > 0
GROUP BY tipo, titulo, nome, numero, localidade
"""


def garantir_csv() -> None:
    if not CSV_RECIFE.exists():
        with zipfile.ZipFile(ZIP_RECIFE) as arquivo_zip:
            arquivo_zip.extract(CSV_RECIFE.name, PASTA)


def nome_composto(tipo: object, titulo: object, nome: object) -> str:
    return " ".join(parte for parte in (tipo, titulo, nome) if isinstance(parte, str) and parte)


def main() -> None:
    garantir_csv()
    conexao = duckdb.connect()
    conexao.execute(CONSULTA_REGISTROS.format(arquivo=sql_texto(CSV_RECIFE)))
    niveis = "(" + ", ".join(f"'{nivel}'" for nivel in NIVEIS_DE_ENDERECO) + ")"
    enderecos = conexao.execute(CONSULTA_AGREGADA.format(niveis=niveis)).df()
    enderecos["logradouro_cnefe"] = [
        nome_composto(tipo, titulo, nome) for tipo, titulo, nome in zip(enderecos["tipo"], enderecos["titulo"], enderecos["nome"])
    ]
    chaves = pd.DataFrame([chaves_logradouro(nome) for nome in enderecos["logradouro_cnefe"]], index=enderecos.index)
    enderecos[["chave_exato", "chave_sem_titulos", "chave_nucleo"]] = chaves[["exato", "sem_titulos", "nucleo"]]
    enderecos = enderecos.dropna(subset=["lat", "lon"]).copy()
    paraUTM = Transformer.from_crs(CRS_CNEFE, CRS_TRABALHO, always_xy=True)
    enderecos["x"], enderecos["y"] = paraUTM.transform(enderecos["lon"].to_numpy(), enderecos["lat"].to_numpy())
    enderecos[["x", "y"]] = enderecos[["x", "y"]].round(1)
    pontos = gpd.GeoDataFrame(enderecos, geometry=gpd.points_from_xy(enderecos["x"], enderecos["y"]), crs=CRS_TRABALHO)
    bairros = gpd.read_parquet(BAIRROS)[["codigo_bairro", "nome_bairro", "geometry"]]
    com_bairro = gpd.sjoin(pontos, bairros, how="left", predicate="within").drop(columns=["geometry", "index_right"])
    colunas = [
        "logradouro_cnefe", "chave_exato", "chave_sem_titulos", "chave_nucleo", "numero", "localidade",
        "codigo_bairro", "nome_bairro", "cep", "registros", "domicilios_particulares", "apartamentos",
        "estabelecimentos", "em_construcao_ou_reforma", "nivel_geo", "lon", "lat", "x", "y",
    ]
    resultado = pd.DataFrame(com_bairro[colunas])
    resultado["codigo_bairro"] = resultado["codigo_bairro"].astype("Int64")
    resultado.to_parquet(SAIDA, index=False)
    print(f"gravado: {SAIDA.name} ({len(resultado)} endereços com número; {resultado['codigo_bairro'].isna().sum()} fora dos bairros)")


if __name__ == "__main__":
    main()
