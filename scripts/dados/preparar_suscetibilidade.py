# /// script
# requires-python = ">=3.12"
# dependencies = ["geopandas>=1.0", "pyogrio>=0.10", "pyarrow>=17", "shapely>=2.0"]
# ///
import geopandas as gpd
import pandas as pd
import shapely

from comum import BRUTOS, CRS_TRABALHO, DERIVADOS

ZIP_SGB = BRUTOS / "sgb" / "sig_recife_pe.zip"
CAMADAS = ("Suscetibilidade/Inundacao_A.shp", "Suscetibilidade/Movimento_de_Massa_A.shp")
SAIDA = DERIVADOS / "suscetibilidade_sgb_2015.parquet"


def ler(camada: str) -> gpd.GeoDataFrame:
    tabela = gpd.read_file(f"/vsizip/{ZIP_SGB.as_posix()}/{camada}", engine="pyogrio", columns=["PROCESSO", "CLASSE"])
    tabela = tabela.to_crs(CRS_TRABALHO)
    tabela["geometry"] = shapely.force_2d(tabela.geometry.values)
    tabela["camada"] = camada.rsplit("/", 1)[-1].removesuffix(".shp")
    return tabela.rename(columns={"PROCESSO": "processo", "CLASSE": "classe"})


def main() -> None:
    DERIVADOS.mkdir(parents=True, exist_ok=True)
    suscetibilidade = gpd.GeoDataFrame(pd.concat([ler(camada) for camada in CAMADAS], ignore_index=True), crs=CRS_TRABALHO)
    suscetibilidade.to_parquet(SAIDA, index=False)
    resumo = suscetibilidade.groupby(["processo", "classe"]).size().to_dict()
    print(f"gravado: {SAIDA.name} ({len(suscetibilidade)} polígonos) {resumo}")


if __name__ == "__main__":
    main()
