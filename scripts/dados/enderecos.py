import re
import unicodedata

TIPOS_LOGRADOURO = {
    "R": "RUA",
    "RUA": "RUA",
    "RUAS": "RUA",
    "RUARUA": "RUA",
    "RU": "RUA",
    "RAU": "RUA",
    "UA": "RUA",
    "DRUA": "RUA",
    "NARUA": "RUA",
    "AV": "AVENIDA",
    "AVE": "AVENIDA",
    "AVEN": "AVENIDA",
    "AVENIDA": "AVENIDA",
    "TV": "TRAVESSA",
    "TR": "TRAVESSA",
    "TRV": "TRAVESSA",
    "TRAV": "TRAVESSA",
    "TRAVESSA": "TRAVESSA",
    "TAVESSA": "TRAVESSA",
    "PC": "PRACA",
    "PCA": "PRACA",
    "PRC": "PRACA",
    "PRACA": "PRACA",
    "EST": "ESTRADA",
    "ESTR": "ESTRADA",
    "ESTRADA": "ESTRADA",
    "AL": "ALAMEDA",
    "ALA": "ALAMEDA",
    "ALAMEDA": "ALAMEDA",
    "LG": "LARGO",
    "LGO": "LARGO",
    "LARGO": "LARGO",
    "BC": "BECO",
    "BEC": "BECO",
    "BECO": "BECO",
    "VL": "VILA",
    "VIL": "VILA",
    "VILA": "VILA",
    "ROD": "RODOVIA",
    "RODOVIA": "RODOVIA",
    "LAD": "LADEIRA",
    "LADEIRA": "LADEIRA",
    "ESC": "ESCADARIA",
    "ESCADARIA": "ESCADARIA",
    "COR": "CORREGO",
    "CORR": "CORREGO",
    "CORREGO": "CORREGO",
    "SB": "SUBIDA",
    "SUB": "SUBIDA",
    "SUBIDA": "SUBIDA",
    "VD": "VIADUTO",
    "VDO": "VIADUTO",
    "VIADUTO": "VIADUTO",
    "PTE": "PONTE",
    "PONTE": "PONTE",
    "REF": "REFUGIO",
    "REFUGIO": "REFUGIO",
    "ENT": "ENTRADA",
    "ENTRADA": "ENTRADA",
    "PAT": "PATIO",
    "PATIO": "PATIO",
    "CJ": "CONJUNTO",
    "CONJ": "CONJUNTO",
    "CONJUNTO": "CONJUNTO",
    "LOT": "LOTEAMENTO",
    "LOTEAMENTO": "LOTEAMENTO",
    "CAIS": "CAIS",
    "ALTO": "ALTO",
    "VIA": "VIA",
    "VIELA": "VIELA",
    "RUELA": "RUELA",
    "CAMINHO": "CAMINHO",
    "ACESSO": "ACESSO",
    "ESCADA": "ESCADA",
    "PARQUE": "PARQUE",
    "COMUNIDADE": "COMUNIDADE",
    "GIRADOURO": "GIRADOURO",
}

TIPOS_COLADOS_AO_ORDINAL = {"T": "TRAVESSA", "TR": "TRAVESSA", "TRV": "TRAVESSA", "SB": "SUBIDA"}

ORDINAIS_POR_EXTENSO = {
    "PRIMEIRA": "1A",
    "PRIMEIRO": "1A",
    "SEGUNDA": "2A",
    "SEGUNDO": "2A",
    "TERCEIRA": "3A",
    "TERCEIRO": "3A",
    "QUARTA": "4A",
    "QUARTO": "4A",
    "QUINTA": "5A",
    "QUINTO": "5A",
    "SEXTA": "6A",
    "SEXTO": "6A",
    "SETIMA": "7A",
    "SETIMO": "7A",
    "OITAVA": "8A",
    "OITAVO": "8A",
    "NONA": "9A",
    "NONO": "9A",
    "DECIMA": "10A",
    "DECIMO": "10A",
}

TITULOS_ABREVIADOS = {
    "DR": "DOUTOR",
    "DRA": "DOUTORA",
    "PROF": "PROFESSOR",
    "PROFA": "PROFESSORA",
    "PE": "PADRE",
    "ENG": "ENGENHEIRO",
    "CONS": "CONSELHEIRO",
    "VISC": "VISCONDE",
    "STA": "SANTA",
    "STO": "SANTO",
    "GAL": "GENERAL",
    "GEN": "GENERAL",
    "CAP": "CAPITAO",
    "CEL": "CORONEL",
    "TEN": "TENENTE",
    "SGT": "SARGENTO",
    "ALM": "ALMIRANTE",
    "BRIG": "BRIGADEIRO",
    "MAL": "MARECHAL",
    "DES": "DESEMBARGADOR",
    "DESEMB": "DESEMBARGADOR",
    "PRES": "PRESIDENTE",
    "GOV": "GOVERNADOR",
    "SEN": "SENADOR",
    "DEP": "DEPUTADO",
    "VER": "VEREADOR",
    "MONS": "MONSENHOR",
    "FR": "FREI",
    "MIN": "MINISTRO",
    "COMEND": "COMENDADOR",
    "MAJ": "MAJOR",
    "CMTE": "COMANDANTE",
    "JORN": "JORNALISTA",
    "ARQ": "ARQUITETO",
    "EXP": "EXPEDICIONARIO",
    "REV": "REVERENDO",
    "MONSR": "MONSENHOR",
}

TITULOS = {
    "DOUTOR", "DOUTORA", "PROFESSOR", "PROFESSORA", "SAO", "PADRE", "ENGENHEIRO", "CONSELHEIRO",
    "VISCONDE", "VISCONDESSA", "BARAO", "BARONESA", "SANTA", "SANTO", "GENERAL", "CAPITAO",
    "DESEMBARGADOR", "DONA", "DOM", "CORONEL", "JORNALISTA", "CONDE", "CONDESSA", "PRESIDENTE",
    "VEREADOR", "GOVERNADOR", "NOSSA", "SENHORA", "SENHOR", "MARECHAL", "TENENTE", "MARQUES",
    "MAJOR", "FREI", "EXPEDICIONARIO", "DEPUTADO", "SENADOR", "ALMIRANTE", "SARGENTO", "CABO",
    "MINISTRO", "MONSENHOR", "SOLDADO", "COMPOSITOR", "POETA", "POETISA", "ARQUITETO", "ARQUITETA",
    "COMENDADOR", "CONEGO", "PINTOR", "CANTOR", "CANTORA", "IRMA", "PASTOR", "AVIADOR", "ESCRITOR",
    "ESCRITORA", "PRINCIPE", "PRINCESA", "MAESTRO", "MADRE", "BRIGADEIRO", "PREFEITO", "CARDEAL",
    "EMBAIXADOR", "CONSUL", "DUQUE", "REVERENDO", "BISPO", "IMPERADOR", "IMPERATRIZ", "VIGARIO",
    "MESTRE", "DELEGADO", "COMANDANTE", "JUIZ", "ADVOGADO", "MEDICO", "INFANTE",
}

PALAVRAS_DE_LIGACAO = {"DA", "DE", "DO", "DAS", "DOS", "E", "D"}

APELIDOS_DE_BAIRRO = {
    "POCO DA PANELA": "POCO",
    "BAIRRO DO RECIFE": "RECIFE",
    "JD SAO PAULO": "JARDIM SAO PAULO",
    "CASA AMAREAL": "CASA AMARELA",
}

ORDINAL = re.compile(r"^(\d+)[AO]?$")
ORDINAL_COM_TIPO = re.compile(r"^(\d+)(" + "|".join(sorted(TIPOS_COLADOS_AO_ORDINAL, key=len, reverse=True)) + r")$")


def sem_acentos(texto: str) -> str:
    decomposto = unicodedata.normalize("NFKD", texto)
    return "".join(caractere for caractere in decomposto if not unicodedata.combining(caractere))


def limpar(texto: object) -> str:
    if texto is None or texto != texto:
        return ""
    texto = str(texto).replace("ª", "A ").replace("º", "O ").replace("°", "O ")
    texto = sem_acentos(texto).upper()
    texto = re.sub(r"[^A-Z0-9]+", " ", texto)
    return re.sub(r"\s+", " ", texto).strip()


def separar_ordinal_colado(tokens: list[str]) -> list[str]:
    if tokens and (correspondencia := ORDINAL_COM_TIPO.match(tokens[0])):
        numero, abreviacao = correspondencia.groups()
        return [f"{int(numero)}A", TIPOS_COLADOS_AO_ORDINAL[abreviacao], *tokens[1:]]
    if tokens and tokens[0] in ORDINAIS_POR_EXTENSO:
        return [ORDINAIS_POR_EXTENSO[tokens[0]], *tokens[1:]]
    return tokens


def tokens_logradouro(texto: object) -> list[str]:
    tokens = separar_ordinal_colado(limpar(texto).split())
    if not tokens:
        return []
    posicao_tipo = 1 if len(tokens) > 1 and ORDINAL.match(tokens[0]) else 0
    resultado = []
    for posicao, token in enumerate(tokens):
        if posicao < posicao_tipo:
            resultado.append(f"{int(ORDINAL.match(token).group(1))}A")
        elif posicao == posicao_tipo and token in TIPOS_LOGRADOURO:
            resultado.append(TIPOS_LOGRADOURO[token])
        else:
            resultado.append(TITULOS_ABREVIADOS.get(token, token))
    return [token for token in resultado if token not in PALAVRAS_DE_LIGACAO]


def chave_logradouro(texto: object) -> str:
    return " ".join(tokens_logradouro(texto))


def chave_sem_titulos(texto: object) -> str:
    return " ".join(token for token in tokens_logradouro(texto) if token not in TITULOS and len(token) > 1)


def chave_nucleo(texto: object) -> str:
    tipos = set(TIPOS_LOGRADOURO.values())
    tokens = chave_sem_titulos(texto).split()
    inicio = 0
    while inicio < len(tokens) and (tokens[inicio] in tipos or ORDINAL.match(tokens[inicio])):
        inicio += 1
    ordinais = [token for token in tokens[:inicio] if ORDINAL.match(token)]
    nucleo = tokens[inicio:]
    return " ".join(ordinais + nucleo) if nucleo else ""


def chaves_logradouro(texto: object) -> dict[str, str]:
    return {
        "exato": chave_logradouro(texto),
        "sem_titulos": chave_sem_titulos(texto),
        "nucleo": chave_nucleo(texto),
    }


def chave_bairro(texto: object) -> str:
    if not isinstance(texto, str):
        return ""
    chave = limpar(re.split(r"\s{2,}|\s+-\s+", texto.strip())[0])
    return APELIDOS_DE_BAIRRO.get(chave, chave)


def decompor_endereco_oficial(endereco: object) -> tuple[str | None, int | None, str | None, str | None]:
    if not isinstance(endereco, str) or not endereco.strip():
        return None, None, None, None
    partes = [re.sub(r"\s+", " ", parte).strip() for parte in endereco.split(",")]
    if len(partes) != 5:
        return None, None, None, None
    cep = re.sub(r"\D", "", partes[4]) or None
    return partes[0] or None, numero_principal(partes[1]), partes[2] or None, cep


def numero_principal(texto: object) -> int | None:
    if texto is None or texto != texto:
        return None
    if isinstance(texto, (int, float)):
        return int(texto) if int(texto) > 0 else None
    correspondencia = re.match(r"\s*0*(\d+)", str(texto))
    if correspondencia is None:
        return None
    numero = int(correspondencia.group(1))
    return numero if numero > 0 else None
