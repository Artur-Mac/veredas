# /// script
# requires-python = ">=3.12"
# dependencies = ["geopandas>=1.0", "pandas>=2.2", "pyarrow>=17", "shapely>=2.0"]
# ///
import geopandas as gpd

from comum import DERIVADOS

AREA_URBANA = DERIVADOS / "area_urbana"


def main() -> None:
    bairros = gpd.read_parquet(AREA_URBANA / "bairros.parquet", columns=["codigo_bairro", "nome_oficial", "geometry"])
    edificacoes = gpd.read_parquet(AREA_URBANA / "edificacoes.parquet", columns=["geometry"])
    pontos = edificacoes.set_geometry(edificacoes.geometry.representative_point())
    contagem = gpd.sjoin(pontos, bairros, predicate="within")["codigo_bairro"].value_counts()
    cobertos = bairros[bairros["codigo_bairro"].isin(contagem.index)]
    descobertos = bairros[~bairros["codigo_bairro"].isin(contagem.index)].sort_values("nome_oficial")
    print(f"bairros com ao menos uma edificação na camada Edificações-Lotes: {len(cobertos)} de {len(bairros)}")
    print("bairros sem edificação na camada:", ", ".join(descobertos["nome_oficial"]))


if __name__ == "__main__":
    main()
