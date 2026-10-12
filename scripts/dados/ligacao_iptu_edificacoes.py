import geopandas as gpd
import pandas as pd

from comum import CRS_TRABALHO, DERIVADOS
from geocodificador import Geocodificador

DISTANCIA_MAXIMA_M = 25.0
CHAVE = ["codigo_logradouro", "numero"]
COLUNAS_LIGADAS = ["dsqfl", "pavimentos", "area_construida_m2", "edificacoes_no_endereco", "distancia_m"]


def com_codigo_logradouro(tabela: gpd.GeoDataFrame, geocodificador: Geocodificador) -> gpd.GeoDataFrame:
    tabela = tabela[tabela["dsqfl_valido"]].copy()
    pares = tabela[["logradouro_texto", "bairro_texto"]].dropna(subset=["logradouro_texto"]).drop_duplicates()
    casamentos = [geocodificador.logradouro_oficial(l, b) for l, b in zip(pares["logradouro_texto"], pares["bairro_texto"])]
    pares["codigo_logradouro"] = pd.array([c.codigo_logradouro if c else None for c in casamentos], dtype="Int64")
    return tabela.merge(pares, on=["logradouro_texto", "bairro_texto"], how="left")


def edificacoes_com_logradouro(geocodificador: Geocodificador) -> gpd.GeoDataFrame:
    edificacoes = com_codigo_logradouro(gpd.read_parquet(DERIVADOS / "area_urbana" / "edificacoes.parquet"), geocodificador)
    print(f"edificações com logradouro oficial identificado: {edificacoes['codigo_logradouro'].notna().mean():.1%} de {len(edificacoes)}")
    return edificacoes


def por_endereco(edificacoes: gpd.GeoDataFrame) -> pd.DataFrame:
    com_endereco = edificacoes.dropna(subset=CHAVE)
    resumo = com_endereco.groupby(CHAVE).agg(
        dsqfl=("dsqfl", lambda serie: "|".join(sorted(serie))),
        pavimentos=("pavimentos", "max"),
        area_construida_m2=("area_construida_m2", "sum"),
        edificacoes_no_endereco=("dsqfl", "size"),
    ).reset_index()
    resumo["numero"] = resumo["numero"].astype("Int64")
    resumo["distancia_m"] = 0.0
    return resumo


def por_coordenada(pontos: pd.DataFrame, edificacoes: gpd.GeoDataFrame) -> pd.DataFrame:
    if pontos.empty:
        return pd.DataFrame(columns=CHAVE + COLUNAS_LIGADAS)
    camada = gpd.GeoDataFrame(pontos[CHAVE], geometry=gpd.points_from_xy(pontos["x"], pontos["y"]), crs=CRS_TRABALHO)
    proximos = gpd.sjoin_nearest(
        camada, edificacoes[["dsqfl", "pavimentos", "area_construida_m2", "geometry"]], max_distance=DISTANCIA_MAXIMA_M, distance_col="distancia_m"
    )
    proximos = proximos.sort_values("distancia_m").drop_duplicates(CHAVE)
    proximos["edificacoes_no_endereco"] = 1
    proximos["distancia_m"] = proximos["distancia_m"].round(1)
    return pd.DataFrame(proximos[CHAVE + COLUNAS_LIGADAS])


def aplicar(ligados: pd.DataFrame, encontrados: pd.DataFrame, metodo: str) -> pd.DataFrame:
    encontrados = encontrados.set_index(CHAVE)
    pendentes = ligados["ligacao"].isna() & ligados.set_index(CHAVE).index.isin(encontrados.index)
    chaves = ligados.loc[pendentes].set_index(CHAVE).index
    for coluna in COLUNAS_LIGADAS:
        ligados.loc[pendentes, coluna] = encontrados.loc[chaves, coluna].to_numpy()
    ligados.loc[pendentes, "ligacao"] = metodo
    return ligados


def pontos_cnefe(pendentes: pd.DataFrame, geocodificador: Geocodificador) -> pd.DataFrame:
    resultados = [geocodificador.geocodificar(l, n, b) for l, n, b in zip(pendentes["logradouro"], pendentes["numero"], pendentes["bairro"])]
    pontos = pendentes[CHAVE].copy()
    pontos["x"] = [r.x if r.precisao == "numero" else None for r in resultados]
    pontos["y"] = [r.y if r.precisao == "numero" else None for r in resultados]
    return pontos.dropna(subset=["x"])


def ligar_edificios_iptu(geocodificador: Geocodificador) -> pd.DataFrame:
    edificios = pd.read_parquet(DERIVADOS / "iptu_2026_edificios.parquet")
    edificios[CHAVE] = edificios[CHAVE].astype("Int64")
    edificacoes = edificacoes_com_logradouro(geocodificador)
    ligados = edificios.assign(ligacao=None, **{coluna: None for coluna in COLUNAS_LIGADAS})
    ligados = aplicar(ligados, por_endereco(edificacoes), "endereco")
    pendentes = ligados[ligados["ligacao"].isna() & ligados["x"].notna()]
    ligados = aplicar(ligados, por_coordenada(pendentes[CHAVE + ["x", "y"]], edificacoes), "coordenada_iptu")
    pendentes = ligados[ligados["ligacao"].isna()]
    ligados = aplicar(ligados, por_coordenada(pontos_cnefe(pendentes, geocodificador), edificacoes), "coordenada_cnefe")
    ligados["pavimentos"] = pd.to_numeric(ligados["pavimentos"]).astype("Int64")
    ligados["area_construida_m2"] = pd.to_numeric(ligados["area_construida_m2"])
    print("ligação IPTU → edificação (endereços):", ligados["ligacao"].value_counts(dropna=False).to_dict())
    return ligados
