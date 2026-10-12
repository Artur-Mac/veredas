# /// script
# requires-python = ">=3.12"
# dependencies = ["geopandas>=1.0", "pyarrow>=17", "pandas>=2.2", "shapely>=2.0", "pyproj>=3.6"]
# ///
import json
import re
import sys
from dataclasses import dataclass

import geopandas as gpd
import pandas as pd
import shapely
from pyproj import Transformer
from shapely.geometry import Point, box
from shapely.ops import linemerge

from comum import CRS_TRABALHO, DERIVADOS, RAIZ, agora_recife
from enderecos import limpar, numero_principal
from geocodificador import CasamentoLogradouro, Geocodificador
from ligacao_iptu_edificacoes import com_codigo_logradouro

ANUNCIOS = RAIZ / "scripts" / "dados" / "anuncios.json"
MATRIZ = RAIZ / "scripts" / "dados" / "matriz_perguntas.json"
FIXTURES = RAIZ / "src" / "fixtures"
AREA_URBANA = DERIVADOS / "area_urbana"

VERSAO_METODO = "0.1.0"
DATA_COLETA = "2026-10-12"
DATA_CONSULTA_RIGEO = "2026-10-11"
DATA_REF_MAPA = "2026-03-02"
RAIO_M = 150
LADO_MAPA_M = 420
TOLERANCIA_SIMPLIFICACAO_M = 0.4
TOLERANCIAS_LOTES_M = (0.4, 0.6, 0.8, 1.0)
LIMITE_MAPA_BYTES = 250_000
LIMIAR_DIFERENCA_AREA = 0.15
LIMIAR_AREA_MENOR = 0.30
DISTANCIA_LIGACAO_M = 25.0
ANOS = (2021, 2022, 2023, 2024)
TIPOS_NO_GRAFICO = 5
MAXIMO_CANDIDATAS = 3
IDS_CANDIDATAS = ("A", "B", "C")
REGIME_INTERDITADO = "Isenção Imóvel Interditado"
OCORRENCIA_DANOS = "Imóveis com Danos / Risco"
SEM_TIPO = "Tipo não informado"
ORDEM_CLASSES = {"Alta": 0, "Média": 1, "Baixa": 2}
PROCESSOS = ("Inundação", "Deslizamento")
DIVERGENCIAS_DE_IDENTIDADE = {"c_endereco", "c_andar"}
AUSENCIA = "Ausência de registro não significa ausência de problema."

URL_AREA_URBANA = "https://dados.recife.pe.gov.br/dataset/area-urbana"
URL_IPTU = "https://dados.recife.pe.gov.br/dataset/imposto-predial-e-territorial-urbano-iptu"
URL_DEFESA_CIVIL = "https://dados.recife.pe.gov.br/dataset/registro-de-atendimentos-da-defesa-civil"
URL_SGB = "https://rigeo.sgb.gov.br/handle/doc/15030"
URL_RIGEO = "https://rigeo.sgb.gov.br"


@dataclass(frozen=True)
class Fonte:
    nome: str
    url: str | None
    data_ref: str | None
    limitacao: str


LIMITACAO_AREA_URBANA = "O cadastro de edificações pode não refletir reformas e ampliações recentes."
LIMITACAO_IPTU = "Área construída fiscal não é área privativa; o cadastro fiscal não é laudo."
LIMITACAO_TRSD = (
    "A base aberta traz o valor do IPTU, mas não o da taxa de coleta de lixo (TRSD), que tem regime próprio no mesmo cadastro; "
    "se o anúncio somou as duas, o valor fica acima do cadastro."
)

FONTE_EDIFICACOES = Fonte(
    "Prefeitura do Recife, Área Urbana (Edificações-Lotes e Edificações-Pavimentos)", URL_AREA_URBANA, "2026-03-02", LIMITACAO_AREA_URBANA
)
FONTE_LOTES = Fonte(
    "Prefeitura do Recife, Área Urbana (Lotes)",
    URL_AREA_URBANA,
    "2026-03-02",
    f"{LIMITACAO_AREA_URBANA} Esta edificação não consta na camada de edificações; pavimentos e área vêm do cadastro de lotes.",
)
FONTE_RUA = Fonte("Prefeitura do Recife, Área Urbana (Lotes) e IPTU 2026", URL_AREA_URBANA, "2026-03-02", LIMITACAO_AREA_URBANA)
FONTE_IPTU = Fonte(
    "Prefeitura do Recife, IPTU por contribuinte e ano, exercício 2026", URL_IPTU, "2026-01-01/2026-12-31", LIMITACAO_IPTU
)
FONTE_ANUNCIO_IPTU = Fonte(
    "Anúncio e Prefeitura do Recife, IPTU 2026", URL_IPTU, "2026-01-01/2026-12-31", f"{LIMITACAO_IPTU} O valor do anúncio foi declarado pelo anunciante."
)
FONTE_DEFESA_CIVIL = Fonte(
    "Prefeitura do Recife, Registro de Atendimentos da Defesa Civil, 2021 a 2024",
    URL_DEFESA_CIVIL,
    "2021-01-01/2024-12-31",
    "Reflete quem acionou a Defesa Civil, não todas as ocorrências. A Prefeitura publica o número do imóvel mascarado, "
    "então cada atendimento conta para a rua inteira dentro do bairro, não para o trecho em frente ao prédio. "
    "Ausência de registro não significa ausência de problema.",
)
FONTE_SGB = Fonte(
    "Serviço Geológico do Brasil, Carta de suscetibilidade a movimentos gravitacionais de massa e inundação, Recife, 2015",
    URL_SGB,
    "2015-01-01",
    "Indica suscetibilidade do terreno, não risco do edifício; a escala 1:45.000 não distingue lotes vizinhos.",
)
FONTE_RIGEO = Fonte(
    "Serviço Geológico do Brasil, repositório RIGeo",
    URL_RIGEO,
    None,
    "Consultamos o repositório RIGeo em 11/10/2026; o portal GeoSGB não foi verificado. Ausência de setorização não significa ausência de risco.",
)
FONTE_MAPA = (
    "Prefeitura do Recife, Área Urbana (Quadras, Edificações-Lotes, Lotes e Trechos de Logradouros) e Registro de Atendimentos "
    "da Defesa Civil; Serviço Geológico do Brasil, carta de suscetibilidade de 2015"
)


class ResolucaoInsuficiente(RuntimeError):
    pass


def numero_br(valor: float, casas: int = 0) -> str:
    inteiro, _, decimal = f"{abs(valor):,.{casas}f}".partition(".")
    sinal = "-" if valor < 0 else ""
    inteiro = inteiro.replace(",", ".")
    return f"{sinal}{inteiro},{decimal}" if casas else f"{sinal}{inteiro}"


def moeda(valor: float) -> str:
    valor = float(valor)
    return "R$ " + numero_br(valor, 0 if valor.is_integer() else 2)


def area(valor: float) -> str:
    arredondado = round(float(valor), 1)
    return numero_br(arredondado, 0 if arredondado.is_integer() else 1) + " m²"


def plural(quantidade: int, singular: str, varios: str) -> str:
    return f"{numero_br(quantidade)} {singular if quantidade == 1 else varios}"


def endereco_curto(endereco_oficial: str) -> str:
    return ", ".join(parte.strip() for parte in endereco_oficial.split(",")[:3] if parte.strip())


@dataclass
class Bases:
    geocodificador: Geocodificador
    edificacoes: gpd.GeoDataFrame
    lotes: gpd.GeoDataFrame
    unidades: pd.DataFrame
    trechos: gpd.GeoDataFrame
    trechos_por_bairro: gpd.GeoDataFrame
    nomes_logradouros: dict[tuple[int, int], str]
    nomes_bairros: dict[int, str]
    quadras: gpd.GeoDataFrame
    suscetibilidade: gpd.GeoDataFrame
    defesa_civil: pd.DataFrame
    concordancia_pavimentos: float


def concordancia_de_pavimentos(edificacoes: gpd.GeoDataFrame, lotes: gpd.GeoDataFrame) -> float:
    pares = edificacoes[["dsqfl", "pavimentos"]].merge(lotes[["dsqfl", "pavimentos_cadastro"]], on="dsqfl").dropna()
    return float((pares["pavimentos"] == pares["pavimentos_cadastro"]).mean())


def ligar_defesa_civil(registros: pd.DataFrame, geocodificador: Geocodificador) -> pd.DataFrame:
    pares = registros[["logradouro_texto", "bairro"]].drop_duplicates()
    casamentos = [geocodificador.logradouro_oficial(l, b) for l, b in zip(pares["logradouro_texto"], pares["bairro"])]
    pares["codigo_logradouro"] = pd.array([c.codigo_logradouro if c else None for c in casamentos], dtype="Int64")
    pares["codigo_bairro"] = pd.array([c.codigo_bairro if c else None for c in casamentos], dtype="Int64")
    return registros.merge(pares, on=["logradouro_texto", "bairro"], how="left")


def carregar_bases() -> Bases:
    geocodificador = Geocodificador()
    nomes = pd.read_parquet(AREA_URBANA / "logradouros_por_bairro.parquet")
    bairros = pd.read_parquet(AREA_URBANA / "bairros.parquet", columns=["codigo_bairro", "nome_oficial"])
    colunas_dc = ["ano_arquivo", "logradouro_texto", "bairro", "ocorrencia_canonico", "solicitacao_canonico"]
    edificacoes = com_codigo_logradouro(gpd.read_parquet(AREA_URBANA / "edificacoes.parquet"), geocodificador)
    lotes = com_codigo_logradouro(gpd.read_parquet(AREA_URBANA / "lotes.parquet"), geocodificador)
    return Bases(
        geocodificador=geocodificador,
        edificacoes=edificacoes,
        lotes=lotes,
        unidades=pd.read_parquet(DERIVADOS / "iptu_2026_imoveis.parquet"),
        trechos=gpd.read_parquet(AREA_URBANA / "trechos_logradouros.parquet"),
        trechos_por_bairro=gpd.read_parquet(AREA_URBANA / "trechos_por_bairro.parquet"),
        nomes_logradouros={
            (int(r.codigo_logradouro), int(r.codigo_bairro)): r.nome_oficial or r.nome_concatenado for r in nomes.itertuples(index=False)
        },
        nomes_bairros={int(r.codigo_bairro): r.nome_oficial for r in bairros.itertuples(index=False)},
        quadras=gpd.read_parquet(AREA_URBANA / "quadras.parquet"),
        suscetibilidade=gpd.read_parquet(DERIVADOS / "suscetibilidade_sgb_2015.parquet"),
        defesa_civil=ligar_defesa_civil(pd.read_parquet(DERIVADOS / "defesa_civil_2021_2024.parquet", columns=colunas_dc), geocodificador),
        concordancia_pavimentos=concordancia_de_pavimentos(edificacoes, lotes),
    )


@dataclass
class Predio:
    id: str
    dsqfl: str
    poligono: shapely.Geometry
    endereco_oficial: str
    pavimentos: int | None
    area_construida_m2: float | None
    fonte_cadastro: Fonte
    unidades: pd.DataFrame
    evidencias: list[str]

    @property
    def ano_construcao(self) -> int | None:
        anos = self.unidades["ano_construcao"].dropna()
        return None if anos.empty else int(anos.mode().iloc[0])

    @property
    def residenciais(self) -> pd.DataFrame:
        return self.unidades[self.unidades["tipo_uso"] == "RESIDENCIAL"]


@dataclass
class Resolucao:
    status: str
    confianca: str
    predios: list[Predio]
    casamento: CasamentoLogradouro | None
    endereco_divergente: bool = False


def ponto_mediano(unidades: pd.DataFrame) -> Point | None:
    com_ponto = unidades.dropna(subset=["x", "y"])
    return None if com_ponto.empty else Point(com_ponto["x"].median(), com_ponto["y"].median())


def no_endereco_ou_no_ponto(camada: gpd.GeoDataFrame, codigo: int, numero: int, ponto: Point | None) -> pd.Series | None:
    no_endereco = camada[(camada["codigo_logradouro"] == codigo) & (camada["numero"] == numero)]
    if not no_endereco.empty:
        return no_endereco.loc[no_endereco.geometry.area.idxmax()]
    if ponto is None:
        return None
    distancias = camada.distance(ponto)
    if distancias.min() > DISTANCIA_LIGACAO_M:
        return None
    return camada.loc[distancias.idxmin()]


def unidades_no_endereco(bases: Bases, codigo: int, numero: int) -> pd.DataFrame:
    return bases.unidades[(bases.unidades["codigo_logradouro"] == codigo) & (bases.unidades["numero"] == numero)]


def predio_no_endereco(bases: Bases, codigo: int, numero: int, identificador: str) -> Predio:
    unidades = unidades_no_endereco(bases, codigo, numero)
    if unidades.empty:
        raise ResolucaoInsuficiente(f"nenhuma unidade no IPTU 2026 para o logradouro {codigo}, número {numero}")
    ponto = ponto_mediano(unidades)
    edificacao = no_endereco_ou_no_ponto(bases.edificacoes, codigo, numero, ponto)
    if edificacao is not None and pd.notna(edificacao["pavimentos"]):
        return Predio(
            identificador, edificacao["dsqfl"], edificacao.geometry, endereco_curto(edificacao["endereco_oficial"]),
            int(edificacao["pavimentos"]), float(edificacao["area_construida_m2"]), FONTE_EDIFICACOES, unidades, [],
        )
    lote = no_endereco_ou_no_ponto(bases.lotes, codigo, numero, ponto)
    if lote is None:
        raise ResolucaoInsuficiente(f"nem edificação nem lote para o logradouro {codigo}, número {numero}")
    return Predio(
        identificador, lote["dsqfl"], lote.geometry, endereco_curto(lote["endereco_oficial"]),
        None if pd.isna(lote["pavimentos_cadastro"]) else int(lote["pavimentos_cadastro"]),
        None if pd.isna(lote["area_construida_cadastro_m2"]) else float(lote["area_construida_cadastro_m2"]),
        FONTE_LOTES, unidades, [],
    )


def numero_do_complemento(complemento: str | None) -> int | None:
    if complemento is None:
        return None
    achado = re.search(r"\d+", complemento)
    return None if achado is None else int(achado.group())


def unidade_declarada(predio: Predio, complemento: str | None) -> pd.Series | None:
    numero = numero_do_complemento(complemento)
    if numero is None:
        return None
    achadas = predio.unidades[predio.unidades["complemento"].fillna("").str.contains(rf"\b0*{numero}\b", regex=True)]
    return achadas.iloc[0] if len(achadas) == 1 else None


def resolver_pelo_nome(bases: Bases, anuncio: dict, casamento: CasamentoLogradouro | None) -> Resolucao:
    campos = anuncio["campos_declarados"]
    nome = limpar(campos["edificio"])
    if not nome:
        raise ResolucaoInsuficiente("endereço declarado sem correspondência no cadastro e sem nome de edifício")
    rua = campos["logradouro"]
    if bases.geocodificador.logradouro_no_cadastro(rua) or bases.geocodificador.logradouro_no_cnefe(rua):
        raise ResolucaoInsuficiente(f"{rua} existe em alguma base, mas sem o número declarado; não há modelo de cartão para esse caso")
    com_nome = bases.unidades[bases.unidades["complemento"].fillna("").map(limpar).str.contains(nome, regex=False)]
    enderecos = com_nome[["codigo_logradouro", "numero"]].dropna().drop_duplicates()
    if len(enderecos) != 1:
        raise ResolucaoInsuficiente(f"o nome declarado do edifício aparece em {len(enderecos)} endereços do IPTU 2026")
    codigo, numero = (int(valor) for valor in enderecos.iloc[0])
    predio = predio_no_endereco(bases, codigo, numero, "alvo")
    if unidade_declarada(predio, campos["complemento"]) is None:
        raise ResolucaoInsuficiente("a unidade declarada não aparece no IPTU 2026 no endereço do edifício")
    predio.evidencias = [
        "O logradouro declarado não consta no cadastro de logradouros nem no CNEFE de Recife.",
        f"O nome declarado do edifício aparece no complemento de {plural(len(com_nome), 'unidade', 'unidades')} do IPTU 2026, "
        f"todas em {predio.endereco_oficial}.",
        f"A unidade declarada ({numero_do_complemento(campos['complemento'])}) consta no IPTU 2026 nesse endereço.",
    ]
    if predio.fonte_cadastro is FONTE_LOTES and predio.pavimentos is not None:
        predio.evidencias.append(f"O cadastro de lotes registra {plural(predio.pavimentos, 'pavimento', 'pavimentos')} nesse lote.")
    return Resolucao("resolvido", "alta", [predio], casamento, endereco_divergente=True)


def resolver_pelo_endereco(bases: Bases, casamento: CasamentoLogradouro, numero: int) -> Resolucao:
    predio = predio_no_endereco(bases, casamento.codigo_logradouro, numero, "alvo")
    predio.evidencias = [
        f"O endereço declarado corresponde ao endereço oficial {predio.endereco_oficial}.",
        f"O IPTU 2026 tem {plural(len(predio.unidades), 'unidade', 'unidades')} nesse endereço.",
    ]
    return Resolucao("resolvido", "alta", [predio], casamento)


def ponto_declarado(anuncio: dict) -> Point | None:
    posicao = anuncio["posicao_declarada"]
    if posicao is None:
        return None
    x, y = Transformer.from_crs("EPSG:4326", CRS_TRABALHO, always_xy=True).transform(posicao["lon"], posicao["lat"])
    return Point(x, y)


def lotes_da_rua(bases: Bases, casamento: CasamentoLogradouro) -> gpd.GeoDataFrame:
    lotes = bases.lotes[bases.lotes["codigo_logradouro"] == casamento.codigo_logradouro]
    no_bairro = [bases.geocodificador.codigo_bairro(bairro) == casamento.codigo_bairro for bairro in lotes["bairro_texto"]]
    return lotes[no_bairro]


def resolver_candidatas(bases: Bases, anuncio: dict, casamento: CasamentoLogradouro) -> Resolucao:
    criterios = anuncio["criterios_candidatas"]
    minimo, maximo = criterios["area_unidade_m2"]
    pavimentos_minimos = criterios["pavimentos_minimos"]
    avaliados = []
    for lote in lotes_da_rua(bases, casamento).itertuples():
        if pd.isna(lote.numero) or unidades_no_endereco(bases, casamento.codigo_logradouro, int(lote.numero)).empty:
            continue
        predio = predio_no_endereco(bases, casamento.codigo_logradouro, int(lote.numero), "")
        na_faixa = predio.residenciais["area_construida_m2"].between(minimo, maximo).sum()
        avaliados.append((predio, int(na_faixa)))
    aprovados = [
        (predio, na_faixa)
        for predio, na_faixa in avaliados
        if na_faixa > 0 and (pavimentos_minimos is None or (predio.pavimentos or 0) >= pavimentos_minimos)
    ]
    if len(aprovados) < 2:
        mais_altos = sorted(avaliados, key=lambda item: -(item[0].pavimentos or 0))[:3]
        resumo = "; ".join(f"{p.endereco_oficial}: {p.pavimentos} pavimentos, {n} unidades de {minimo} a {maximo} m²" for p, n in mais_altos)
        raise ResolucaoInsuficiente(
            f"{len(aprovados)} edificação(ões) da rua passam nos critérios (pavimentos >= {pavimentos_minimos}, "
            f"unidades de {minimo} a {maximo} m²). Mais altas no cadastro: {resumo}"
        )
    declarado = ponto_declarado(anuncio)
    if declarado is not None:
        aprovados.sort(key=lambda item: item[0].poligono.distance(declarado))
    predios = []
    for identificador, (predio, na_faixa) in zip(IDS_CANDIDATAS, aprovados[:MAXIMO_CANDIDATAS]):
        predio.id = identificador
        predio.evidencias = evidencias_da_candidata(predio, na_faixa, (minimo, maximo), anuncio["campos_declarados"]["andar"], declarado)
        predios.append(predio)
    return Resolucao("pendente_confirmacao", "media", predios, casamento)


def evidencias_da_candidata(predio: Predio, na_faixa: int, faixa: tuple[float, float], andar: int | None, declarado: Point | None) -> list[str]:
    if predio.pavimentos is None:
        pavimentos = "Pavimentos não informados no cadastro"
    else:
        pavimentos = f"{plural(predio.pavimentos, 'pavimento', 'pavimentos')} no cadastro"
        if andar is not None and andar > predio.pavimentos:
            pavimentos += f"; o anúncio declara {andar}º andar"
    evidencias = [pavimentos, f"{plural(na_faixa, 'unidade', 'unidades')} de {faixa[0]} a {faixa[1]} m² no IPTU 2026"]
    if declarado is not None:
        recorte = "do lote" if predio.fonte_cadastro is FONTE_LOTES else "da edificação"
        evidencias.append(
            f"A posição aproximada do anúncio cai dentro {recorte}"
            if predio.poligono.contains(declarado)
            else f"A {numero_br(predio.poligono.distance(declarado))} m da posição aproximada do anúncio"
        )
    return evidencias


def resolver(bases: Bases, anuncio: dict) -> Resolucao:
    campos = anuncio["campos_declarados"]
    casamento = bases.geocodificador.logradouro_oficial(campos["logradouro"], campos["bairro"])
    numero = numero_principal(campos["numero"])
    if numero is None:
        if casamento is None:
            raise ResolucaoInsuficiente("anúncio sem número e com logradouro fora do cadastro")
        return resolver_candidatas(bases, anuncio, casamento)
    if casamento is not None and not unidades_no_endereco(bases, casamento.codigo_logradouro, numero).empty:
        return resolver_pelo_endereco(bases, casamento, numero)
    return resolver_pelo_nome(bases, anuncio, casamento)


def cartao(identificador: str, bloco: int, categoria: str, titulo: str, resumo: str, claim: str, fonte: Fonte | str,
           escala: str, metodo: str, limitacao: str, pergunta_id: str, matriz: dict, visual: dict | None = None,
           data_coleta: str = DATA_COLETA, acao: str | None = None) -> dict:
    nome, url, data_ref = (fonte.nome, fonte.url, fonte.data_ref) if isinstance(fonte, Fonte) else (fonte, None, None)
    if len(titulo.split()) > 5 or len(resumo) > 70:
        raise ValueError(f"título ou resumo longo demais no cartão {identificador}: {titulo!r} / {resumo!r}")
    resultado = {
        "id": identificador, "bloco": bloco, "categoria": categoria, "titulo": titulo, "resumo": resumo, "claim": claim,
        "fonte": nome, "url_fonte": url, "data_ref": data_ref, "data_coleta": data_coleta, "escala": escala,
        "metodo": metodo, "limitacao": limitacao, "acao": acao or matriz[pergunta_id]["acao"]["texto"], "pergunta_id": pergunta_id,
    }
    if visual is not None:
        resultado["visual"] = visual
    return resultado


def cartao_edificacao(predio: Predio, matriz: dict) -> dict:
    if predio.fonte_cadastro is FONTE_EDIFICACOES:
        complemento = "de área construída somada"
        metodo = (
            "Endereço oficial da edificação casado com o código do logradouro e o número; pavimentos = maior PAVIMENTO das camadas "
            "principais de Edificações-Pavimentos; área = soma das áreas por pavimento."
        )
    else:
        complemento = "de área construída no cadastro de lotes"
        metodo = (
            "A edificação não consta na camada de edificações; o lote foi encontrado pelo endereço oficial ou pela posição das unidades "
            "do IPTU; pavimentos e área total construída vêm do cadastro de lotes."
        )
    pavimentos = "pavimentos não informados" if predio.pavimentos is None else plural(predio.pavimentos, "pavimento", "pavimentos")
    area_texto = "área não informada" if predio.area_construida_m2 is None else area(round(predio.area_construida_m2))
    if predio.fonte_cadastro is FONTE_EDIFICACOES:
        titulo, sujeito = "Edificação cadastrada", f"A edificação do lote {predio.dsqfl} está cadastrada"
    else:
        titulo, sujeito = "Lote cadastrado", f"O lote {predio.dsqfl} está cadastrado"
    return cartao(
        "c_edificacao", 1, "registro_oficial", titulo, f"{pavimentos}, {area_texto} construídos",
        f"{sujeito} em {predio.endereco_oficial}, com {pavimentos} e {area_texto} {complemento}.",
        predio.fonte_cadastro, "edificio", metodo, predio.fonte_cadastro.limitacao, "q_identidade", matriz,
        acao="Na visita, confira se o número de andares do prédio bate com o cadastro.",
    )


def cartao_fiscal_edificio(predio: Predio, unidade: str | None, matriz: dict) -> dict:
    total = len(predio.unidades)
    ano = predio.ano_construcao
    acao = (
        f"Confirme com o corretor que a unidade anunciada é a {unidade}, achada pelo complemento do anúncio."
        if unidade is not None
        else "Confirme com o corretor o número da unidade anunciada; com ele dá para ler área e IPTU exatos no cadastro."
    )
    return cartao(
        "c_fiscal_edificio", 1, "registro_oficial", "Unidades no cadastro fiscal",
        f"{plural(total, 'unidade', 'unidades')}, construção de {ano}",
        f"No IPTU 2026, este endereço tem {plural(total, 'unidade predial', 'unidades prediais')}, com construção registrada em {ano}.",
        FONTE_IPTU, "edificio",
        "Contagem das unidades do IPTU 2026 com o mesmo código de logradouro e número; ano da construção corrigido mais frequente.",
        "A contagem inclui unidades não residenciais, se houver. O ano vem do campo \"ano da construção corrigido\" do IPTU e pode "
        "não coincidir com a entrega do prédio.",
        "q_identidade", matriz, acao=acao,
    )


def cartao_endereco(anuncio: dict, predio: Predio, matriz: dict) -> dict:
    campos = anuncio["campos_declarados"]
    fonte = Fonte(
        "Anúncio, Prefeitura do Recife (cadastro de logradouros da Área Urbana e IPTU 2026) e IBGE CNEFE 2022",
        URL_AREA_URBANA,
        "2026-03-02",
        "O nome da rua pode estar escrito de outro jeito no anúncio; a busca compara nomes sem acentos, "
        "com abreviações expandidas e também sem títulos.",
    )
    logradouro_e_numero = ", ".join(predio.endereco_oficial.split(", ")[:2])
    return cartao(
        "c_endereco", 1, "inconsistencia", "Endereço divergente", f"Endereço no IPTU: {logradouro_e_numero}",
        f"O anúncio informa {campos['logradouro']}, {campos['numero']}; essa rua não aparece no cadastro de logradouros nem no "
        f"CNEFE de Recife. O nome do edifício e a unidade {numero_do_complemento(campos['complemento'])} aparecem no IPTU 2026 "
        f"em {predio.endereco_oficial}.",
        fonte, "edificio",
        "Busca do logradouro declarado em todos os bairros do cadastro de logradouros e no CNEFE 2022, pelo nome normalizado; "
        "busca do nome do edifício no complemento das unidades do IPTU 2026.",
        fonte.limitacao, "q_identidade", matriz, acao="Confirme o endereço completo com o corretor antes de marcar a visita.",
    )


def cartao_andar(anuncio: dict, predio: Predio, concordancia: float, matriz: dict) -> dict | None:
    andar = anuncio["campos_declarados"]["andar"]
    if andar is None or predio.pavimentos is None or andar <= predio.pavimentos:
        return None
    cadastro = "cadastro de lotes" if predio.fonte_cadastro is FONTE_LOTES else "Edificações-Pavimentos"
    limitacao = (
        f"O andar foi declarado pelo anunciante. Lotes e Edificações-Pavimentos registram o mesmo número de pavimentos em "
        f"{numero_br(concordancia * 100)}% dos lotes presentes nas duas bases."
    )
    fonte = Fonte(f"Anúncio e {predio.fonte_cadastro.nome}", predio.fonte_cadastro.url, predio.fonte_cadastro.data_ref, limitacao)
    return cartao(
        "c_andar", 3, "inconsistencia", "Andar acima do cadastro",
        f"Andar {andar} declarado; {plural(predio.pavimentos, 'pavimento', 'pavimentos')} no cadastro",
        f"O anúncio declara {andar}º andar; o cadastro registra {plural(predio.pavimentos, 'pavimento', 'pavimentos')} para esta edificação.",
        fonte, "edificio", f"Comparação entre o andar declarado no anúncio e o número de pavimentos do {cadastro}.",
        limitacao, "q_identidade", matriz, acao="Confirme o andar e o endereço com o corretor.",
    )


@dataclass
class ReferenciaFiscal:
    unidade: pd.Series | None
    comparaveis: pd.DataFrame
    regra: str

    @property
    def area_referencia(self) -> float:
        return float(self.comparaveis["area_construida_m2"].median())

    @property
    def iptu_anual(self) -> tuple[float, float]:
        valores = self.comparaveis["iptu_cobrado"]
        return float(valores.min()), float(valores.max())


def referencia_fiscal(predio: Predio, anuncio: dict) -> ReferenciaFiscal:
    campos = anuncio["campos_declarados"]
    unidade = unidade_declarada(predio, campos["complemento"]) if predio.id == "alvo" else None
    if unidade is not None:
        return ReferenciaFiscal(unidade, unidade.to_frame().T.infer_objects(), "unidade identificada pelo complemento declarado")
    if anuncio["criterios_candidatas"] is not None:
        minimo, maximo = anuncio["criterios_candidatas"]["area_unidade_m2"]
        regra = f"faixa de {minimo} a {maximo} m² usada para escolher as candidatas"
    else:
        minimo, maximo = campos["area_m2"] * (1 - LIMIAR_DIFERENCA_AREA), campos["area_m2"] * (1 + LIMIAR_DIFERENCA_AREA)
        regra = "área construída a até 15% da área declarada no anúncio"
    comparaveis = predio.residenciais[predio.residenciais["area_construida_m2"].between(minimo, maximo)]
    if comparaveis.empty:
        raise ResolucaoInsuficiente(f"nenhuma unidade comparável em {predio.endereco_oficial} ({regra})")
    return ReferenciaFiscal(None, comparaveis, regra)


def complemento_curto(complemento: str) -> str:
    return re.split(r"\s+EDF\b", complemento)[0].strip()


def cartao_fiscal_unidade(predio: Predio, referencia: ReferenciaFiscal, matriz: dict) -> dict:
    if referencia.unidade is not None:
        unidade = referencia.unidade
        rotulo = complemento_curto(unidade["complemento"])
        return cartao(
            "c_fiscal_unidade", 2, "registro_oficial", "Unidade no cadastro fiscal",
            f"{area(unidade['area_construida_m2'])}, IPTU de {moeda(unidade['iptu_cobrado'])} por ano",
            f"A unidade {rotulo} tem {area(unidade['area_construida_m2'])} de área construída e IPTU de {moeda(unidade['iptu_cobrado'])} cobrado em 2026.",
            FONTE_IPTU, "unidade",
            "Unidade localizada pelo número do complemento declarado no anúncio entre as unidades do endereço no IPTU 2026.",
            LIMITACAO_IPTU, "q_custo_total", matriz,
            acao="Peça o carnê do IPTU 2026 da unidade e compare com este valor.",
        )
    comparaveis = referencia.comparaveis
    minimo, maximo = referencia.iptu_anual
    area_minima, area_maxima = comparaveis["area_construida_m2"].min(), comparaveis["area_construida_m2"].max()
    quantidade = len(comparaveis)
    return cartao(
        "c_fiscal_unidade", 2, "registro_oficial", "Unidades comparáveis no IPTU",
        f"{plural(quantidade, 'unidade', 'unidades')}, IPTU de {moeda(minimo)} a {moeda(maximo)} por ano",
        f"No cadastro fiscal, as {plural(quantidade, 'unidade', 'unidades')} deste prédio com área entre {area(area_minima).removesuffix(' m²')} "
        f"e {area(area_maxima)} têm IPTU 2026 entre {moeda(minimo)} e {moeda(maximo)} por ano.",
        FONTE_IPTU, "edificio",
        f"Unidades residenciais do endereço no IPTU 2026 escolhidas por {referencia.regra}.",
        LIMITACAO_IPTU, "q_custo_total", matriz,
        acao="Pergunte o número da unidade para conferir o IPTU exato no cadastro.",
    )


def cartao_interdicao(predio: Predio, matriz: dict) -> dict:
    total = len(predio.unidades)
    interditadas = int((predio.unidades["regime_tributacao_iptu"] == REGIME_INTERDITADO).sum())
    if interditadas == 0:
        claim = f"Nenhuma das {plural(total, 'unidade', 'unidades')} deste endereço aparece no IPTU 2026 com isenção por imóvel interditado."
        resumo = f"Nenhuma de {plural(total, 'unidade', 'unidades')} com isenção por interdição"
        limitacao = (
            "Só aparece quando a isenção por interdição foi registrada no IPTU; um prédio com problema estrutural pode não ter "
            f"esse registro. O cadastro fiscal não é laudo. {AUSENCIA}"
        )
    else:
        claim = f"{numero_br(interditadas)} das {plural(total, 'unidade', 'unidades')} aparecem com isenção por imóvel interditado."
        resumo = f"{numero_br(interditadas)} de {plural(total, 'unidade', 'unidades')} com isenção por interdição"
        limitacao = "Só aparece quando a isenção por interdição foi registrada no IPTU. O cadastro fiscal não é laudo."
    return cartao(
        "c_interdicao", 2, "registro_oficial", "Isenção por interdição", resumo, claim, FONTE_IPTU, "edificio",
        f"Contagem das unidades do endereço com regime de tributação \"{REGIME_INTERDITADO}\" no IPTU 2026.",
        limitacao, "q_estrutura", matriz,
    )


@dataclass
class Atendimentos:
    total: int
    danos: int
    por_ano: list[dict]
    por_tipo: list[dict]
    ruas: list[dict]
    trechos: dict[str, list[shapely.Geometry]]


def atendimentos_no_raio(bases: Bases, centro: Point) -> Atendimentos:
    perto = bases.trechos_por_bairro[bases.trechos_por_bairro.distance(centro) <= RAIO_M]
    chaves = pd.MultiIndex.from_arrays([perto["codigo_logradouro"].astype("int64"), perto["codigo_bairro"].astype("int64")])
    registros = bases.defesa_civil.dropna(subset=["codigo_logradouro", "codigo_bairro"])
    indice = pd.MultiIndex.from_arrays([registros["codigo_logradouro"].astype("int64"), registros["codigo_bairro"].astype("int64")])
    registros = registros[indice.isin(chaves)]
    tipos = registros["ocorrencia_canonico"].fillna(registros["solicitacao_canonico"]).fillna(SEM_TIPO)
    contagem_tipos = tipos.value_counts()
    contagem_tipos = contagem_tipos.sort_index().sort_values(ascending=False, kind="stable").head(TIPOS_NO_GRAFICO)
    nomes = [bases.nomes_logradouros[(int(c), int(b))].upper() for c, b in zip(registros["codigo_logradouro"], registros["codigo_bairro"])]
    por_rua = pd.Series(nomes, dtype="object").value_counts() if nomes else pd.Series(dtype="int64")
    por_rua = por_rua.sort_index().sort_values(ascending=False, kind="stable")
    circulo = centro.buffer(RAIO_M)
    trechos: dict[str, list[shapely.Geometry]] = {}
    for pedaco in perto.itertuples():
        nome = bases.nomes_logradouros.get((int(pedaco.codigo_logradouro), int(pedaco.codigo_bairro)), "").upper()
        if nome in por_rua.index:
            trechos.setdefault(nome, []).append(pedaco.geometry.intersection(circulo))
    return Atendimentos(
        total=len(registros),
        danos=int((registros["ocorrencia_canonico"] == OCORRENCIA_DANOS).sum()),
        por_ano=[{"ano": ano, "n": int((registros["ano_arquivo"] == ano).sum())} for ano in ANOS],
        por_tipo=[{"tipo": tipo, "n": int(n)} for tipo, n in contagem_tipos.items()],
        ruas=[{"nome": nome, "n": int(n)} for nome, n in por_rua.items()],
        trechos=trechos,
    )


def cartao_defesa_civil(atendimentos: Atendimentos, referencia: str, matriz: dict) -> dict:
    quantidade_ruas = len(atendimentos.ruas)
    if atendimentos.total == 0:
        claim = (
            f"A Defesa Civil não tem atendimento registrado entre 2021 e 2024 nas ruas que passam a até {RAIO_M} m {referencia}. "
            f"{AUSENCIA}"
        )
        resumo = "Nenhum atendimento nas ruas próximas, 2021 a 2024"
    else:
        ruas = "Na única rua" if quantidade_ruas == 1 else f"Nas {numero_br(quantidade_ruas)} ruas"
        claim = (
            f"{ruas} com registro que passam a até {RAIO_M} m {referencia}, a Defesa Civil registrou "
            f"{plural(atendimentos.total, 'atendimento', 'atendimentos')} entre 2021 e 2024, contando cada rua inteira dentro do bairro; "
            f"{numero_br(atendimentos.danos)} foram em imóveis com danos ou risco."
        )
        resumo = (
            f"{plural(atendimentos.total, 'atendimento', 'atendimentos')} em "
            f"{plural(quantidade_ruas, 'rua próxima', 'ruas próximas')}, 2021 a 2024"
        )
    visual = {
        "tipo": "ocorrencias", "total": atendimentos.total, "raio_m": RAIO_M, "periodo": "2021 a 2024",
        "por_ano": atendimentos.por_ano, "por_tipo": atendimentos.por_tipo, "ruas": atendimentos.ruas,
    }
    metodo = (
        "Registros de 2021 a 2024 ligados ao logradouro oficial pelo nome da rua e pelo bairro (ou por bairro vizinho quando o nome só "
        f"existe lá); entram as ruas cujos trechos passam a até {RAIO_M} m {referencia}, no mesmo bairro do trecho. Como o número do "
        "imóvel vem mascarado, cada atendimento conta para a rua inteira dentro do bairro. Ano = ano do arquivo publicado; tipo = "
        "ocorrência e, quando vazia, solicitação."
    )
    return cartao(
        "c_defesa_civil", 2, "registro_oficial", "Atendimentos da Defesa Civil", resumo,
        claim, FONTE_DEFESA_CIVIL, "rua", metodo, FONTE_DEFESA_CIVIL.limitacao, "q_estrutura", matriz, visual,
        acao="Pergunte ao corretor se o prédio já teve vistoria da Defesa Civil e peça o laudo, se houver.",
    )


def classes_de_suscetibilidade(bases: Bases, poligono: shapely.Geometry) -> dict[str, list[str]]:
    tocadas = bases.suscetibilidade[bases.suscetibilidade.intersects(poligono)]
    resultado: dict[str, list[str]] = {}
    for processo, grupo in tocadas.groupby("processo"):
        resultado[processo] = sorted(set(grupo["classe"]), key=lambda classe: ORDEM_CLASSES.get(classe, 9))
    return resultado


def cartao_suscetibilidade(bases: Bases, predio: Predio, matriz: dict) -> dict:
    classes = classes_de_suscetibilidade(bases, predio.poligono)
    processos = [*PROCESSOS, *sorted(p for p in classes if p not in PROCESSOS)]
    partes_claim: list[str] = []
    partes_resumo: list[str] = []
    for processo in processos:
        lista = classes.get(processo, [])
        if lista:
            partes_claim.append(f"em área de suscetibilidade {' e '.join(c.lower() for c in lista)} a {processo.lower()}")
            partes_resumo.append(f"{processo.lower()}: {', '.join(c.lower() for c in lista)}")
        else:
            partes_claim.append(f"fora das áreas de suscetibilidade a {processo.lower()}")
            partes_resumo.append(f"{processo.lower()}: fora das manchas")
    claim = f"Na carta do SGB de 2015, feita na escala 1:45.000, o prédio fica {' e '.join(partes_claim)}."
    resumo = "; ".join(partes_resumo)
    resumo = resumo[0].upper() + resumo[1:]
    completa = all(classes.get(processo) for processo in processos)
    limitacao = FONTE_SGB.limitacao if completa else f"{FONTE_SGB.limitacao} {AUSENCIA}"
    poligono = "da edificação" if predio.fonte_cadastro is FONTE_EDIFICACOES else "do lote"
    return cartao(
        "c_suscetibilidade", 2, "registro_oficial", "Suscetibilidade do terreno", resumo, claim, FONTE_SGB, "microarea",
        f"Interseção do polígono {poligono} com os polígonos de inundação e de deslizamento da carta.",
        limitacao, "q_alagamento", matriz,
    )


def cartao_setorizacao(matriz: dict) -> dict:
    return cartao(
        "c_setorizacao", 2, "desconhecido", "Setorização de risco", "Sem setorização pública do SGB",
        "Não há setorização oficial de risco alto e muito alto para o Recife nas bases públicas do SGB consultadas.",
        FONTE_RIGEO, "municipio", "Busca no repositório RIGeo por setorização de risco alto e muito alto do Recife.",
        FONTE_RIGEO.limitacao, "q_setorizacao", matriz, data_coleta=DATA_CONSULTA_RIGEO,
    )


def parcela(rotulo: str, valor: float | None, origem: str, faixa: list[float] | None = None) -> dict:
    return {"rotulo": rotulo, "valor": valor, "faixa": faixa, "origem": origem}


def parcelas_de_custo(anuncio: dict, referencia: ReferenciaFiscal | None) -> list[dict]:
    campos = anuncio["campos_declarados"]
    aluguel = anuncio["operacao"] == "aluguel"
    parcelas = []
    if aluguel:
        parcelas.append(parcela("Aluguel", campos["preco"], "informado_no_anuncio"))
    condominio = campos["condominio"]
    parcelas.append(parcela("Condomínio", condominio, "nao_informado" if condominio is None else "informado_no_anuncio"))
    if campos["iptu"] is not None and campos["iptu_periodicidade"] is not None:
        mensal = campos["iptu"] if campos["iptu_periodicidade"] == "mensal" else round(campos["iptu"] / 12, 2)
        parcelas.append(parcela("IPTU", mensal, "informado_no_anuncio"))
    elif referencia is not None and referencia.unidade is not None:
        parcelas.append(parcela("IPTU", round(float(referencia.unidade["iptu_cobrado"]) / 12, 2), "do_cadastro_fiscal"))
    elif referencia is not None:
        minimo, maximo = referencia.iptu_anual
        parcelas.append(parcela("IPTU", None, "do_cadastro_fiscal", [round(minimo / 12, 2), round(maximo / 12, 2)]))
    else:
        parcelas.append(parcela("IPTU", None, "nao_informado"))
    for extra in anuncio["parcelas_extras"]:
        parcelas.append(parcela(extra["rotulo"], extra["valor"], "informado_no_anuncio"))
    for rotulo in anuncio["parcelas_nao_informadas"]:
        parcelas.append(parcela(rotulo, None, "nao_informado"))
    return parcelas


def cartao_custo(anuncio: dict, referencia: ReferenciaFiscal | None, matriz: dict) -> dict:
    campos = anuncio["campos_declarados"]
    parcelas = parcelas_de_custo(anuncio, referencia)
    origem_iptu = next(p["origem"] for p in parcelas if p["rotulo"] == "IPTU")
    inicio = (
        f"Aluguel de {moeda(campos['preco'])} informado no anúncio"
        if anuncio["operacao"] == "aluguel"
        else f"Preço de venda de {moeda(campos['preco'])} informado no anúncio"
    )
    condominio = "condomínio não informado" if campos["condominio"] is None else "condomínio informado"
    iptu = {"informado_no_anuncio": "IPTU informado", "do_cadastro_fiscal": "IPTU do cadastro fiscal", "nao_informado": "IPTU não informado"}[origem_iptu]
    metodo = "Parcelas mensais copiadas do anúncio."
    if origem_iptu == "do_cadastro_fiscal":
        metodo += " IPTU anual do cadastro fiscal dividido por 12"
        metodo += " (o anúncio informa o IPTU sem dizer se é por mês ou por ano)." if campos["iptu"] is not None else "."
    limitacao = "Valores declarados pelo anunciante ainda não verificados."
    if origem_iptu == "do_cadastro_fiscal":
        limitacao += " O IPTU vem do cadastro fiscal de 2026, dividido por 12."
    if any(p["origem"] == "nao_informado" for p in parcelas):
        limitacao += " Parcelas não informadas ficam fora do total."
    return cartao(
        "c_custo", 3, "declarado_anunciante", "Custo mensal", f"{inicio.split(' informado')[0]}; {condominio}",
        f"{inicio}; {condominio}; {iptu}.", "Anúncio" if origem_iptu != "do_cadastro_fiscal" else "Anúncio e IPTU 2026",
        "unidade", metodo, limitacao, "q_custo_total", matriz, {"tipo": "custo_mensal", "parcelas": parcelas},
    )


def cartao_area(anuncio: dict, referencia: ReferenciaFiscal, matriz: dict) -> dict:
    declarada = anuncio["campos_declarados"]["area_m2"]
    tipo = anuncio["tipo_de_area"]
    descricao = f"{area(declarada)} de área {tipo}" if tipo else f"{area(declarada)} de área, sem dizer se é útil ou total"
    rotulo_anuncio = f"anúncio, área {tipo}" if tipo else "anúncio"
    if referencia.unidade is not None:
        cadastrada = float(referencia.unidade["area_construida_m2"])
        cadastro_texto = area(cadastrada)
        alvo_texto = f"{area(cadastrada)} de área construída para a unidade"
        itens = [
            {"rotulo": rotulo_anuncio, "valor_m2": declarada, "categoria": "declarado_anunciante"},
            {"rotulo": "cadastro fiscal, unidade", "valor_m2": round(cadastrada, 1), "categoria": "registro_oficial"},
        ]
    else:
        valores = referencia.comparaveis["area_construida_m2"]
        cadastrada = referencia.area_referencia
        if valores.min() == valores.max():
            cadastro_texto = area(valores.min())
            alvo_texto = f"{area(valores.min())} de área construída para as unidades comparáveis"
            itens_cadastro = [{"rotulo": "cadastro fiscal, comparáveis", "valor_m2": round(float(valores.min()), 1), "categoria": "registro_oficial"}]
        else:
            cadastro_texto = f"{area(valores.min()).removesuffix(' m²')} a {area(valores.max())}"
            alvo_texto = f"de {cadastro_texto} de área construída para as unidades comparáveis"
            itens_cadastro = [
                {"rotulo": "cadastro fiscal, menor comparável", "valor_m2": round(float(valores.min()), 1), "categoria": "registro_oficial"},
                {"rotulo": "cadastro fiscal, maior comparável", "valor_m2": round(float(valores.max()), 1), "categoria": "registro_oficial"},
            ]
        itens = [{"rotulo": rotulo_anuncio, "valor_m2": declarada, "categoria": "declarado_anunciante"}, *itens_cadastro]
    razao = declarada / cadastrada
    fora = razao > 1 + LIMIAR_DIFERENCA_AREA or razao < 1 - LIMIAR_AREA_MENOR
    categoria = "inconsistencia" if fora else "registro_oficial"
    titulo = "Área divergente" if categoria == "inconsistencia" else "Área declarada e cadastrada"
    sentido = "acima" if razao > 1 else "abaixo"
    return cartao(
        "c_area", 3, categoria, titulo, f"Anúncio {area(declarada)}; cadastro {cadastro_texto}",
        f"O anúncio informa {descricao}; o cadastro fiscal registra {alvo_texto}.",
        FONTE_ANUNCIO_IPTU, "unidade" if referencia.unidade is not None else "edificio",
        f"Comparação entre a área do anúncio e a área construída fiscal ({referencia.regra}); o anúncio fica "
        f"{numero_br(abs(razao - 1) * 100, 1)}% {sentido} da referência de {area(round(cadastrada, 1))}. Vira inconsistência quando o "
        "anúncio passa do cadastro em mais de 15% ou fica mais de 30% abaixo dele, porque a área construída fiscal costuma ser "
        "maior que a área útil.",
        f"{LIMITACAO_IPTU} A área construída fiscal pode incluir paredes e parte das áreas comuns. A área do anúncio foi declarada "
        "pelo anunciante.",
        "q_area_privativa", matriz, {"tipo": "comparacao_area", "itens": itens},
    )


def cartao_iptu(anuncio: dict, referencia: ReferenciaFiscal, matriz: dict) -> dict:
    campos = anuncio["campos_declarados"]
    valor, periodicidade = campos["iptu"], campos["iptu_periodicidade"]
    minimo, maximo = referencia.iptu_anual
    leituras = {"mensal": [valor * 12], "anual": [valor], None: [valor, valor * 12]}[periodicidade]
    categoria = "registro_oficial" if any(minimo <= leitura <= maximo for leitura in leituras) else "inconsistencia"
    if periodicidade is None:
        declarado = f"IPTU de {moeda(valor)} sem dizer se é por mês ou por ano"
        anunciado = moeda(valor)
    elif periodicidade == "mensal":
        declarado = f"IPTU de {moeda(valor)} por mês ({moeda(valor * 12)} por ano)"
        anunciado = f"{moeda(valor)} por mês"
    else:
        declarado = f"IPTU de {moeda(valor)} por ano"
        anunciado = f"{moeda(valor)} por ano"
    if referencia.unidade is not None:
        rotulo = complemento_curto(referencia.unidade["complemento"])
        cadastro = f"a unidade {rotulo} tem IPTU 2026 cobrado de {moeda(minimo)} por ano"
        faixa = f"{moeda(minimo)} por ano"
        escala = "unidade"
    else:
        cadastro = f"as unidades comparáveis têm IPTU 2026 cobrado de {moeda(minimo)} a {moeda(maximo)} por ano"
        faixa = f"{moeda(minimo)} a {moeda(maximo)} por ano"
        escala = "edificio"
    return cartao(
        "c_iptu", 3, categoria, "IPTU declarado e cadastrado" if categoria == "registro_oficial" else "IPTU divergente",
        f"Anúncio {anunciado}; cadastro {faixa}",
        f"O anúncio informa {declarado}; no cadastro fiscal, {cadastro}.",
        FONTE_ANUNCIO_IPTU, escala,
        f"Comparação do valor do anúncio, nas leituras possíveis, com o IPTU 2026 do cadastro ({referencia.regra}); "
        "vira inconsistência quando nenhuma leitura cabe na faixa do cadastro.",
        f"{FONTE_ANUNCIO_IPTU.limitacao} {LIMITACAO_TRSD}", "q_custo_total", matriz,
        acao="Peça o carnê do IPTU 2026 para confirmar o valor e se ele é mensal ou anual.",
    )


def cartao_rua(bases: Bases, anuncio: dict, casamento: CasamentoLogradouro, matriz: dict) -> dict:
    lotes = lotes_da_rua(bases, casamento)
    edificados = lotes[lotes["area_construida_cadastro_m2"].fillna(0) > 0]
    andar = anuncio["campos_declarados"]["andar"]
    altos = int((edificados["pavimentos_cadastro"].fillna(0) >= andar).sum())
    rua = bases.nomes_logradouros[(casamento.codigo_logradouro, casamento.codigo_bairro)]
    bairro = bases.nomes_bairros[casamento.codigo_bairro]
    if altos == 0:
        altos_texto = f"nenhuma tem {andar} ou mais pavimentos, como pediria o andar declarado"
    else:
        altos_texto = f"{numero_br(altos)} {'tem' if altos == 1 else 'têm'} {andar} ou mais pavimentos, como pede o andar declarado"
    return cartao(
        "c_rua", 1, "registro_oficial", "Edificações na rua",
        f"{plural(len(edificados), 'edificação', 'edificações')}; {numero_br(altos)} com {andar}+ pavimentos",
        f"No trecho da {rua} em {bairro}, o cadastro tem {plural(len(edificados), 'edificação', 'edificações')}; {altos_texto}.",
        FONTE_RUA, "rua", "Lotes do logradouro no bairro com área construída registrada; pavimentos do cadastro de lotes.",
        f"{LIMITACAO_AREA_URBANA} Os pavimentos vêm do cadastro de lotes, que registra o mesmo número que Edificações-Pavimentos em "
        f"{numero_br(bases.concordancia_pavimentos * 100)}% dos lotes presentes nas duas bases.",
        "q_identidade", matriz,
    )


REGRAS_PERGUNTAS = {
    "q_identidade": ("respondida", ["c_rua", "c_edificacao", "c_endereco", "c_andar"], "desconhecida"),
    "q_setorizacao": ("desconhecida", ["c_setorizacao"], None),
    "q_alagamento": ("parcial", ["c_suscetibilidade"], "desconhecida"),
    "q_estrutura": ("parcial", ["c_interdicao", "c_defesa_civil"], "desconhecida"),
    "q_custo_total": ("parcial", ["c_custo"], None),
    "q_area_privativa": ("parcial", ["c_area"], "desconhecida"),
}


def perguntas(itens: list[dict], pendente: bool, cartoes_existentes: set[str], inundacao_mapeada: bool, sem_vaga: bool) -> list[dict]:
    resultado = []
    for item in itens:
        if item["id"] == "q_vaga" and sem_vaga:
            continue
        status, evidencias, status_modo_rua = REGRAS_PERGUNTAS.get(item["id"], ("desconhecida", [], None))
        if item["id"] == "q_identidade" and cartoes_existentes & DIVERGENCIAS_DE_IDENTIDADE:
            status = "parcial"
        if item["id"] == "q_alagamento" and not inundacao_mapeada:
            status = "desconhecida"
        pergunta = {"id": item["id"], "texto": item["texto"], "status": status}
        if pendente and status_modo_rua is not None:
            pergunta["status_modo_rua"] = status_modo_rua
        pergunta |= {
            "evidencias": [evidencia for evidencia in evidencias if evidencia in cartoes_existentes],
            "acao": item["acao"],
            "para_corretor": item["para_corretor"],
        }
        resultado.append(pergunta)
    return resultado


def centro_do_trecho(bases: Bases, casamento: CasamentoLogradouro) -> Point:
    pedaco = bases.trechos_por_bairro[
        (bases.trechos_por_bairro["codigo_logradouro"] == casamento.codigo_logradouro)
        & (bases.trechos_por_bairro["codigo_bairro"] == casamento.codigo_bairro)
    ].geometry.iloc[0]
    linha = pedaco if pedaco.geom_type == "LineString" else linemerge(pedaco)
    return shapely.line_interpolate_point(linha, 0.5, normalized=True) if linha.geom_type == "LineString" else pedaco.representative_point()


def relativo(coordenadas, centro: Point) -> list[list[float]]:
    pontos: list[list[float]] = []
    for x, y in coordenadas:
        ponto = [round(x - centro.x, 1), round(y - centro.y, 1)]
        if not pontos or pontos[-1] != ponto:
            pontos.append(ponto)
    return pontos


def aneis(geometria: shapely.Geometry, centro: Point, tolerancia: float = TOLERANCIA_SIMPLIFICACAO_M) -> list[list[list[float]]]:
    simplificada = shapely.simplify(geometria, tolerancia, preserve_topology=True)
    partes = getattr(simplificada, "geoms", [simplificada])
    resultado = []
    for parte in partes:
        if parte.geom_type != "Polygon" or parte.is_empty:
            continue
        anel = relativo(list(parte.exterior.coords)[:-1], centro)
        if len({tuple(p) for p in anel}) >= 3:
            resultado.append(anel)
    return resultado


def linhas(geometria: shapely.Geometry, centro: Point) -> list[list[list[float]]]:
    simplificada = shapely.simplify(geometria, TOLERANCIA_SIMPLIFICACAO_M)
    partes = getattr(simplificada, "geoms", [simplificada])
    resultado = []
    for parte in partes:
        if parte.geom_type != "LineString" or parte.is_empty:
            continue
        pontos = relativo(parte.coords, centro)
        if len(pontos) >= 2:
            resultado.append(pontos)
    return resultado


def recortar(camada: gpd.GeoDataFrame, quadrado: shapely.Geometry) -> gpd.GeoDataFrame:
    dentro = camada[camada.intersects(quadrado)].copy()
    dentro["geometry"] = dentro.geometry.intersection(quadrado)
    return dentro[~dentro.geometry.is_empty]


def maior_anel(predio: Predio, centro: Point) -> list[list[float]]:
    partes = getattr(predio.poligono, "geoms", [predio.poligono])
    maior = max(partes, key=lambda parte: parte.area)
    return aneis(maior, centro)[0]


def tamanho_em_bytes(mapa: dict) -> int:
    return len(json.dumps(mapa, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))


def mapa_no_limite(dossie_id: str, centro: Point, predios: list[Predio], atendimentos: Atendimentos, bases: Bases) -> dict:
    for tolerancia in TOLERANCIAS_LOTES_M:
        mapa = montar_mapa(dossie_id, centro, predios, atendimentos, bases, tolerancia)
        if tamanho_em_bytes(mapa) <= LIMITE_MAPA_BYTES:
            print(f"mapa {dossie_id}: {tamanho_em_bytes(mapa)} bytes, lotes simplificados a {numero_br(tolerancia, 1)} m")
            return mapa
    raise ValueError(f"mapa {dossie_id} passa de {LIMITE_MAPA_BYTES} bytes mesmo com lotes simplificados a {TOLERANCIAS_LOTES_M[-1]} m")


def montar_mapa(dossie_id: str, centro: Point, predios: list[Predio], atendimentos: Atendimentos, bases: Bases,
                tolerancia_lotes: float) -> dict:
    metade = LADO_MAPA_M / 2
    quadrado = box(centro.x - metade, centro.y - metade, centro.x + metade, centro.y + metade)
    nomes_trechos = bases.trechos["nome_oficial"].fillna(bases.trechos["nome"]).str.upper()
    trechos = recortar(bases.trechos.assign(nome_mapa=nomes_trechos), quadrado)
    suscetibilidade = recortar(bases.suscetibilidade, quadrado)
    lon, lat = Transformer.from_crs(CRS_TRABALHO, "EPSG:4326", always_xy=True).transform(centro.x, centro.y)
    return {
        "dossie_id": dossie_id,
        "crs": CRS_TRABALHO,
        "origem_utm": [round(centro.x, 1), round(centro.y, 1)],
        "origem_wgs84": [round(lon, 7), round(lat, 7)],
        "lado_m": LADO_MAPA_M,
        "fonte": FONTE_MAPA,
        "data_ref": DATA_REF_MAPA,
        "quadras": [anel for geometria in recortar(bases.quadras, quadrado).geometry for anel in aneis(geometria, centro)],
        "lotes": [anel for geometria in recortar(bases.lotes, quadrado).geometry for anel in aneis(geometria, centro, tolerancia_lotes)],
        "edificacoes": [anel for geometria in recortar(bases.edificacoes, quadrado).geometry for anel in aneis(geometria, centro)],
        "logradouros": [
            {"nome": nome, "pontos": pontos}
            for nome, geometria in zip(trechos["nome_mapa"], trechos.geometry)
            for pontos in linhas(geometria, centro)
        ],
        "alvos": [{"id": predio.id, "dsqfl": predio.dsqfl, "pontos": maior_anel(predio, centro)} for predio in predios],
        "ruas_com_ocorrencias": [
            {"nome": rua["nome"], "n": rua["n"], "trechos": [pontos for g in atendimentos.trechos.get(rua["nome"], []) for pontos in linhas(g, centro)]}
            for rua in atendimentos.ruas
            if rua["n"] > 0 and atendimentos.trechos.get(rua["nome"])
        ],
        "centro_raio": [0.0, 0.0],
        "raio_m": RAIO_M,
        "suscetibilidade": [
            {"tipo": processo, "classe": classe, "pontos": anel}
            for processo, classe, geometria in zip(suscetibilidade["processo"], suscetibilidade["classe"], suscetibilidade.geometry)
            for anel in aneis(geometria, centro)
        ],
    }


def edificio_json(predio: Predio) -> dict:
    return {
        "id": predio.id,
        "dsqfl": predio.dsqfl,
        "endereco_oficial": predio.endereco_oficial,
        "pavimentos": predio.pavimentos,
        "area_construida_m2": None if predio.area_construida_m2 is None else round(predio.area_construida_m2, 1),
        "ano_construcao": predio.ano_construcao,
        "unidades": len(predio.unidades),
        "contorno": "edificacao" if predio.fonte_cadastro is FONTE_EDIFICACOES else "lote",
        "evidencias": predio.evidencias,
    }


def cartoes_do_predio(bases: Bases, predio: Predio, anuncio: dict, matriz: dict, com_custo: bool) -> tuple[list[dict], ReferenciaFiscal]:
    referencia = referencia_fiscal(predio, anuncio)
    unidade = None if referencia.unidade is None else complemento_curto(referencia.unidade["complemento"])
    cartoes = [
        cartao_edificacao(predio, matriz),
        cartao_fiscal_edificio(predio, unidade, matriz),
        cartao_fiscal_unidade(predio, referencia, matriz),
        cartao_interdicao(predio, matriz),
        cartao_suscetibilidade(bases, predio, matriz),
        cartao_area(anuncio, referencia, matriz),
    ]
    if anuncio["campos_declarados"]["iptu"] is not None:
        cartoes.append(cartao_iptu(anuncio, referencia, matriz))
    andar = cartao_andar(anuncio, predio, bases.concordancia_pavimentos, matriz)
    if andar is not None:
        cartoes.append(andar)
    if com_custo:
        cartoes.append(cartao_custo(anuncio, referencia, matriz))
    return cartoes, referencia


def montar(bases: Bases, anuncio: dict, matriz: dict) -> tuple[dict, dict]:
    matriz_por_id = {item["id"]: item for item in matriz["comum"] + matriz[anuncio["operacao"]]}
    resolucao = resolver(bases, anuncio)
    if resolucao.status == "resolvido":
        predio = resolucao.predios[0]
        centro = predio.poligono.centroid
        atendimentos = atendimentos_no_raio(bases, centro)
        cartoes_predio, _ = cartoes_do_predio(bases, predio, anuncio, matriz_por_id, com_custo=True)
        endereco = [cartao_endereco(anuncio, predio, matriz_por_id)] if resolucao.endereco_divergente else []
        cartoes = sorted(
            [*endereco, *cartoes_predio, cartao_defesa_civil(atendimentos, "do prédio", matriz_por_id), cartao_setorizacao(matriz_por_id)],
            key=lambda c: c["bloco"],
        )
        por_candidata: dict[str, list[dict]] = {}
        edificio = edificio_json(predio)
        candidatas: list[dict] = []
    else:
        centro = centro_do_trecho(bases, resolucao.casamento)
        atendimentos = atendimentos_no_raio(bases, centro)
        cartoes = [
            cartao_rua(bases, anuncio, resolucao.casamento, matriz_por_id),
            cartao_defesa_civil(atendimentos, "do trecho da rua", matriz_por_id),
            cartao_setorizacao(matriz_por_id),
            cartao_custo(anuncio, None, matriz_por_id),
        ]
        por_candidata = {
            predio.id: sorted(cartoes_do_predio(bases, predio, anuncio, matriz_por_id, com_custo=False)[0], key=lambda c: c["bloco"])
            for predio in resolucao.predios
        }
        edificio = None
        candidatas = [edificio_json(predio) for predio in resolucao.predios]
    pendente = resolucao.status == "pendente_confirmacao"
    itens = matriz["comum"] + matriz[anuncio["operacao"]]
    resumo: dict[str, int] = {}
    for c in cartoes:
        resumo[c["categoria"]] = resumo.get(c["categoria"], 0) + 1
    dossie = {
        "dossie_id": anuncio["id"],
        "gerado_em": agora_recife().isoformat(timespec="seconds"),
        "versao_metodo": VERSAO_METODO,
        "anuncio": {
            "operacao": anuncio["operacao"],
            "codigo_anuncio": anuncio["codigo_anuncio"],
            "coletado_em": anuncio["coletado_em"],
            "campos_declarados": anuncio["campos_declarados"],
            "trechos_descricao": anuncio["trechos_descricao"],
        },
        "identidade": {
            "status": resolucao.status,
            "confianca": resolucao.confianca,
            "origem": None if pendente else "resolvedor",
            "edificio": edificio,
            "candidatas": candidatas,
        },
        "cartoes": cartoes,
        "cartoes_por_candidata": por_candidata,
        "perguntas": perguntas(
            itens,
            pendente,
            {c["id"] for c in cartoes} | {c["id"] for lista in por_candidata.values() for c in lista},
            any("Inundação" in classes_de_suscetibilidade(bases, p.poligono) for p in resolucao.predios),
            anuncio["campos_declarados"]["vagas"] == 0,
        ),
        "resumo": resumo,
    }
    mapa = mapa_no_limite(anuncio["id"], centro, resolucao.predios, atendimentos, bases)
    return dossie, mapa


def nome_de_variavel(prefixo: str, identificador: str) -> str:
    return prefixo + "".join(parte.capitalize() for parte in identificador.split("-"))


def gravar_lista(identificadores: list[str]) -> None:
    importacoes = []
    entradas = []
    for identificador in identificadores:
        dossie, mapa = nome_de_variavel("dossie", identificador), nome_de_variavel("mapa", identificador)
        importacoes += [f"import {dossie} from './dossies/{identificador}.json';", f"import {mapa} from './mapas/{identificador}.json';"]
        entradas.append(f"  {{ arquivo: '{identificador}', dossie: {dossie}, mapa: {mapa} }},")
    conteudo = "\n".join(importacoes) + "\n\nexport const fixturesBrutas: { arquivo: string; dossie: unknown; mapa: unknown }[] = [\n" + "\n".join(entradas) + "\n];\n"
    (FIXTURES / "lista.ts").write_text(conteudo, encoding="utf-8")


def gravar(dossie: dict, mapa: dict) -> None:
    (FIXTURES / "dossies" / f"{dossie['dossie_id']}.json").write_text(json.dumps(dossie, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    texto_mapa = json.dumps(mapa, ensure_ascii=False, separators=(",", ":"))
    (FIXTURES / "mapas" / f"{mapa['dossie_id']}.json").write_text(texto_mapa + "\n", encoding="utf-8")


def main() -> None:
    anuncios = json.loads(ANUNCIOS.read_text(encoding="utf-8"))
    matriz = json.loads(MATRIZ.read_text(encoding="utf-8"))
    bases = carregar_bases()
    gerados, falhas = [], []
    for anuncio in anuncios:
        try:
            dossie, mapa = montar(bases, anuncio, matriz)
        except ResolucaoInsuficiente as erro:
            falhas.append(anuncio["id"])
            print(f"sem fixture para {anuncio['id']}: {erro}", file=sys.stderr)
            for pasta in ("dossies", "mapas"):
                (FIXTURES / pasta / f"{anuncio['id']}.json").unlink(missing_ok=True)
            continue
        gravar(dossie, mapa)
        gerados.append(anuncio["id"])
        quantidade = len(dossie["cartoes"]) + sum(len(c) for c in dossie["cartoes_por_candidata"].values())
        print(f"gravado: {anuncio['id']} ({dossie['identidade']['status']}, {quantidade} cartões, mapa com {len(mapa['edificacoes'])} edificações)")
    gravar_lista(gerados)
    if falhas:
        sys.exit(1)


if __name__ == "__main__":
    main()
