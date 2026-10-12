from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path

import pandas as pd
from pyproj import Transformer

from comum import CRS_TRABALHO, DERIVADOS
from enderecos import chave_bairro, chaves_logradouro, numero_principal

NIVEIS = ("exato", "sem_titulos", "nucleo")
DISTANCIA_MAXIMA_ENTRE_CANDIDATOS_M = 150.0
FONTE_NUMERO = "IBGE CNEFE 2022"
FONTE_LOGRADOURO = "Prefeitura do Recife, Trechos de Logradouros"


@dataclass(frozen=True)
class Geocodificacao:
    precisao: str | None
    nivel_casamento: str | None
    bairro_vizinho: bool
    codigo_logradouro: int | None
    codigo_bairro: int | None
    x: float | None
    y: float | None
    lon: float | None
    lat: float | None
    fonte: str | None
    candidatos: int


@dataclass(frozen=True)
class CasamentoLogradouro:
    nivel: str
    codigo_logradouro: int
    codigo_bairro: int
    bairro_vizinho: bool


@dataclass(frozen=True)
class CandidatoNumero:
    codigo_bairro: int | None
    x: float
    y: float
    registros: int


SEM_RESULTADO = Geocodificacao(None, None, False, None, None, None, None, None, None, None, 0)


class Geocodificador:
    def __init__(self, pasta: Path = DERIVADOS):
        area_urbana = pasta / "area_urbana"
        self._bairro_por_chave: dict[str, int] = {}
        for registro in pd.read_parquet(area_urbana / "bairros.parquet", columns=["codigo_bairro", "nome_bairro", "nome_oficial"]).itertuples(index=False):
            self._bairro_por_chave[chave_bairro(registro.nome_bairro)] = int(registro.codigo_bairro)
            self._bairro_por_chave[chave_bairro(registro.nome_oficial)] = int(registro.codigo_bairro)
        self._vizinhos: dict[int, set[int]] = defaultdict(set)
        for registro in pd.read_parquet(area_urbana / "bairros_vizinhos.parquet").itertuples(index=False):
            self._vizinhos[int(registro.codigo_bairro)].add(int(registro.codigo_vizinho))
        self._logradouros: dict[tuple[str, str], set[tuple[int, int]]] = defaultdict(set)
        for registro in pd.read_parquet(area_urbana / "logradouros_chaves.parquet").itertuples(index=False):
            self._logradouros[(registro.nivel, registro.chave)].add((int(registro.codigo_logradouro), int(registro.codigo_bairro)))
        self._pontos_logradouro = {
            (int(registro.codigo_logradouro), int(registro.codigo_bairro)): (registro.x, registro.y)
            for registro in pd.read_parquet(area_urbana / "logradouros_pontos.parquet").itertuples(index=False)
        }
        self._enderecos: dict[tuple[str, str, int], list[CandidatoNumero]] = defaultdict(list)
        self._logradouros_cnefe: set[tuple[str, str]] = set()
        for registro in pd.read_parquet(pasta / "cnefe_enderecos.parquet").itertuples(index=False):
            candidato = CandidatoNumero(
                None if pd.isna(registro.codigo_bairro) else int(registro.codigo_bairro), registro.x, registro.y, int(registro.registros)
            )
            for nivel in NIVEIS:
                chave = getattr(registro, f"chave_{nivel}")
                if chave:
                    self._enderecos[(nivel, chave, int(registro.numero))].append(candidato)
                    self._logradouros_cnefe.add((nivel, chave))
        self._para_wgs84 = Transformer.from_crs(CRS_TRABALHO, "EPSG:4326", always_xy=True)

    def codigo_bairro(self, bairro: object) -> int | None:
        return self._bairro_por_chave.get(chave_bairro(bairro))

    def logradouro_no_cadastro(self, logradouro: object) -> bool:
        return any(self._logradouros.get((nivel, chave)) for nivel, chave in chaves_logradouro(logradouro).items() if chave)

    def logradouro_no_cnefe(self, logradouro: object) -> bool:
        return any((nivel, chave) in self._logradouros_cnefe for nivel, chave in chaves_logradouro(logradouro).items() if chave)

    def logradouro_oficial(self, logradouro: object, bairro: object) -> CasamentoLogradouro | None:
        codigo_bairro = self.codigo_bairro(bairro)
        return None if codigo_bairro is None else self._casar_logradouro(logradouro, codigo_bairro)

    def geocodificar(self, logradouro: object, numero: object = None, bairro: object = None) -> Geocodificacao:
        codigo_bairro = self.codigo_bairro(bairro)
        numero_limpo = numero_principal(numero)
        if numero_limpo is not None:
            resultado = self._por_numero(logradouro, numero_limpo, codigo_bairro)
            if resultado is not None:
                return resultado
        return self._por_logradouro(logradouro, codigo_bairro)

    def geocodificar_tabela(self, tabela: pd.DataFrame, logradouro: str, numero: str | None, bairro: str) -> pd.DataFrame:
        colunas = [logradouro, bairro] + ([numero] if numero else [])
        unicos = tabela[colunas].drop_duplicates().reset_index(drop=True)
        resultados = pd.DataFrame(
            [asdict(self.geocodificar(linha[logradouro], linha[numero] if numero else None, linha[bairro])) for linha in unicos.to_dict("records")]
        )
        return tabela.merge(pd.concat([unicos, resultados], axis=1), on=colunas, how="left")

    def _casar_logradouro(self, logradouro: object, codigo_bairro: int) -> CasamentoLogradouro | None:
        chaves = chaves_logradouro(logradouro)
        for bairros_aceitos, vizinho in (({codigo_bairro}, False), (self._vizinhos[codigo_bairro], True)):
            for nivel, chave in chaves.items():
                if not chave:
                    continue
                trechos = {(codigo, bairro) for codigo, bairro in self._logradouros.get((nivel, chave), ()) if bairro in bairros_aceitos}
                codigos = {codigo for codigo, _ in trechos}
                if len(codigos) > 1:
                    return None
                if len(codigos) == 1:
                    codigo, bairro = min(trechos)
                    return CasamentoLogradouro(nivel, codigo, bairro, vizinho)
        return None

    def _resultado(self, precisao: str, nivel: str, vizinho: bool, codigo_logradouro: int | None, codigo_bairro: int | None,
                   ponto: tuple[float, float] | None, fonte: str, candidatos: int) -> Geocodificacao:
        if ponto is None:
            return Geocodificacao(None, nivel, vizinho, codigo_logradouro, codigo_bairro, None, None, None, None, fonte, candidatos)
        lon, lat = self._para_wgs84.transform(*ponto)
        return Geocodificacao(
            precisao, nivel, vizinho, codigo_logradouro, codigo_bairro, ponto[0], ponto[1], round(lon, 7), round(lat, 7), fonte, candidatos
        )

    def _por_numero(self, logradouro: object, numero: int, codigo_bairro: int | None) -> Geocodificacao | None:
        for nivel, chave in chaves_logradouro(logradouro).items():
            candidatos = [
                candidato
                for candidato in self._enderecos.get((nivel, chave, numero), [])
                if codigo_bairro is None or candidato.codigo_bairro == codigo_bairro
            ]
            if not candidatos:
                continue
            principal = max(candidatos, key=lambda candidato: candidato.registros)
            if any(
                ((candidato.x - principal.x) ** 2 + (candidato.y - principal.y) ** 2) ** 0.5 > DISTANCIA_MAXIMA_ENTRE_CANDIDATOS_M
                for candidato in candidatos
            ):
                return None
            oficial = None if principal.codigo_bairro is None else self._casar_logradouro(logradouro, principal.codigo_bairro)
            return self._resultado(
                "numero", nivel, False, oficial.codigo_logradouro if oficial else None, principal.codigo_bairro,
                (principal.x, principal.y), FONTE_NUMERO, len(candidatos),
            )
        return None

    def _por_logradouro(self, logradouro: object, codigo_bairro: int | None) -> Geocodificacao:
        if codigo_bairro is None:
            return SEM_RESULTADO
        casamento = self._casar_logradouro(logradouro, codigo_bairro)
        if casamento is None:
            return Geocodificacao(None, None, False, None, codigo_bairro, None, None, None, None, None, 0)
        ponto = self._pontos_logradouro.get((casamento.codigo_logradouro, casamento.codigo_bairro))
        return self._resultado(
            "logradouro", casamento.nivel, casamento.bairro_vizinho, casamento.codigo_logradouro, casamento.codigo_bairro,
            ponto, FONTE_LOGRADOURO, 1,
        )
