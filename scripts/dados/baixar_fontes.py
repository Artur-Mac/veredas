# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
import argparse
import csv
import hashlib
import io
import json
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from email.utils import parsedate_to_datetime
from http.client import HTTPException
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from comum import BRUTOS, DADOS, agora_recife, caminho_relativo_dados, carregar_manifesto, salvar_manifesto
from iptu import CAMPOS_DESCARTADOS, CAMPOS_DO_IMOVEL

CKAN = "https://dados.recife.pe.gov.br"
CKAN_PACOTE = CKAN + "/api/3/action/package_show?id={}"
CKAN_PAGINA = CKAN + "/dataset/{}"
CKAN_DATASTORE_TOTAL = CKAN + "/api/3/action/datastore_search?resource_id={}&limit=0"
CKAN_DATASTORE_DUMP = CKAN + "/datastore/dump/{}"
FONTE_RECIFE = "Prefeitura do Recife, Portal de Dados Abertos"
AGENTE = "propsight-dados/0.1"

INTEIRO = "inteiro"
FAIXAS = "faixas"
DATASTORE = "datastore"

TENTATIVAS = 2
TENTATIVAS_ARQUIVO_INTEIRO = 4
TENTATIVAS_METADADOS = 4
TENTATIVAS_BLOCO = 8
DOWNLOADS_SIMULTANEOS = 6
TAMANHO_FAIXA = 8 * 1024 * 1024
FAIXAS_SIMULTANEAS = 4
LINHAS_POR_BLOCO = 5000
BLOCOS_SIMULTANEOS = 3

SELECAO_CKAN = {
    "area-urbana": (
        "recife/area-urbana",
        {
            "edificacoes-lotes.geojson": INTEIRO,
            "edificacoes-pavimentos.geojson": INTEIRO,
            "lotes.geojson": INTEIRO,
            "quadras.geojson": INTEIRO,
            "trechos-de-logradouros.geojson": INTEIRO,
            "trechos-de-logradouros-por-bairro.csv": INTEIRO,
            "bairros-do-recife.geojson": INTEIRO,
            "dicionario-de-dados-edificacoes-lote.json": INTEIRO,
            "dicionario-de-dados-edificacoes-pavimento.json": INTEIRO,
            "dicionario-de-dados-dos-lote.json": INTEIRO,
            "dicionario-de-dados-da-quadra-viaria.json": INTEIRO,
            "dicionario-de-dados-dos-logradouros.json": INTEIRO,
            "dicionario-de-dados-dos-trechos-de-logradouros.pdf": INTEIRO,
        },
    ),
    "imposto-predial-e-territorial-urbano-iptu": (
        "recife/iptu",
        {
            "iptu_2026.csv": DATASTORE,
            "dicionario-de-dados-iptu.json": INTEIRO,
        },
    ),
    "registro-de-atendimentos-da-defesa-civil": (
        "recife/defesa-civil",
        {
            "atendimentos-2021.csv": INTEIRO,
            "atendimentos-2022.csv": INTEIRO,
            "atendimentos-2023.csv": INTEIRO,
            "atendimentos-2024.csv": INTEIRO,
        },
    ),
}

NOME_LOCAL_DATASTORE = {"iptu_2026.csv": "iptu_2026_campos_do_imovel.csv"}

GRUPO_POR_CONJUNTO = {
    "area-urbana": "area-urbana",
    "imposto-predial-e-territorial-urbano-iptu": "iptu",
    "registro-de-atendimentos-da-defesa-civil": "defesa-civil",
}

CNEFE_BASE = (
    "https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/"
    "Censo_Demografico_2022/Arquivos_CNEFE/CSV/"
)
SGB_ITEM = "https://rigeo.sgb.gov.br/handle/doc/15030"
SGB_ITEM_API = "https://rigeo.sgb.gov.br/server/api/core/items/427bc1cc-aff4-4c94-b4cb-24f43bf4eca7"
SGB_BITSTREAM_API = "https://rigeo.sgb.gov.br/server/api/core/bitstreams/21a73b6f-57a0-4620-9113-27b01904aea5"
SGB_DOWNLOAD = SGB_BITSTREAM_API + "/content"


@dataclass(frozen=True)
class Alvo:
    chave: str
    grupo: str
    fonte: str
    recurso: str
    url: str
    pagina: str
    arquivo: Path
    estrategia: str
    atualizado_na_fonte: str | None
    conjunto_atualizado_na_fonte: str | None
    licenca: str | None
    tamanho_informado_bytes: int | None
    md5_informado: str | None
    id_recurso: str | None = None
    campos: tuple[str, ...] = field(default_factory=tuple)


class FalhaDeDownload(RuntimeError):
    pass


def registrar_evento(mensagem: str, erro: bool = False) -> None:
    print(f"{agora_recife():%H:%M:%S} {mensagem}", file=sys.stderr if erro else sys.stdout, flush=True)


def abrir_com_novas_tentativas(requisicao: Request, tempo_limite: int = 60):
    tentativa = 1
    while True:
        try:
            return urlopen(requisicao, timeout=tempo_limite)
        except HTTPError as erro:
            if erro.code < 500 or tentativa >= TENTATIVAS_METADADOS:
                raise
            registrar_evento(f"HTTP {erro.code} em {requisicao.full_url}; nova tentativa", erro=True)
        time.sleep(10 * tentativa)
        tentativa += 1


def requisicao(url: str, **cabecalhos_extras: str) -> Request:
    return Request(url, headers={"User-Agent": AGENTE, **cabecalhos_extras})


def ler_json(url: str) -> dict:
    with abrir_com_novas_tentativas(requisicao(url)) as resposta:
        return json.load(resposta)


def cabecalhos(url: str) -> dict[str, str]:
    pedido = Request(url, method="HEAD", headers={"User-Agent": AGENTE})
    with abrir_com_novas_tentativas(pedido) as resposta:
        return {chave.lower(): valor for chave, valor in resposta.headers.items()}


def nome_do_arquivo(url: str) -> str:
    return url.rstrip("/").rsplit("/", 1)[-1]


def recursos_escolhidos(recursos: list[dict], arquivo: str) -> list[dict]:
    candidatos = [r for r in recursos if nome_do_arquivo(r["url"]) == arquivo]
    if not candidatos:
        raise LookupError(f"recurso {arquivo} não encontrado no conjunto")
    mais_recente_por_tamanho: dict[int | None, dict] = {}
    for recurso in sorted(candidatos, key=lambda r: r.get("last_modified") or ""):
        mais_recente_por_tamanho[recurso.get("size")] = recurso
    return list(mais_recente_por_tamanho.values())


def url_dump(id_recurso: str, campos: tuple[str, ...], deslocamento: int | None = None, limite: int | None = None) -> str:
    parametros = {"format": "csv", "fields": ",".join(campos), "sort": "_id"}
    if deslocamento is not None and limite is not None:
        parametros |= {"offset": deslocamento, "limit": limite}
    return CKAN_DATASTORE_DUMP.format(id_recurso) + "?" + urlencode(parametros)


def alvos_ckan(conjunto: str) -> list[Alvo]:
    pasta, arquivos = SELECAO_CKAN[conjunto]
    pacote = ler_json(CKAN_PACOTE.format(conjunto))["result"]
    alvos = []
    for arquivo, estrategia in arquivos.items():
        escolhidos = recursos_escolhidos(pacote["resources"], arquivo)
        for recurso in escolhidos:
            nome_local = NOME_LOCAL_DATASTORE.get(arquivo, arquivo)
            if len(escolhidos) > 1:
                nome_local = f"{recurso['id'][:8]}_{nome_local}"
            campos = tuple(CAMPOS_DO_IMOVEL) if estrategia == DATASTORE else ()
            alvos.append(
                Alvo(
                    chave=f"{GRUPO_POR_CONJUNTO[conjunto]}/{nome_local}",
                    grupo=GRUPO_POR_CONJUNTO[conjunto],
                    fonte=f"{FONTE_RECIFE}, conjunto {conjunto}",
                    recurso=recurso["name"],
                    url=url_dump(recurso["id"], campos) if estrategia == DATASTORE else recurso["url"].replace(":443/", "/"),
                    pagina=CKAN_PAGINA.format(conjunto),
                    arquivo=BRUTOS / pasta / nome_local,
                    estrategia=estrategia,
                    atualizado_na_fonte=recurso.get("last_modified"),
                    conjunto_atualizado_na_fonte=pacote.get("metadata_modified"),
                    licenca=pacote.get("license_title"),
                    tamanho_informado_bytes=None if estrategia == DATASTORE else recurso.get("size"),
                    md5_informado=None,
                    id_recurso=recurso["id"],
                    campos=campos,
                )
            )
    return alvos


def alvo_http_ibge(caminho: str, recurso: str) -> Alvo:
    url = CNEFE_BASE + caminho
    info = cabecalhos(url)
    modificado = info.get("last-modified")
    return Alvo(
        chave=f"cnefe/{nome_do_arquivo(url)}",
        grupo="cnefe",
        fonte="IBGE, Cadastro Nacional de Endereços para Fins Estatísticos, Censo Demográfico 2022",
        recurso=recurso,
        url=url,
        pagina=CNEFE_BASE,
        arquivo=BRUTOS / "ibge/cnefe" / nome_do_arquivo(url),
        estrategia=INTEIRO,
        atualizado_na_fonte=parsedate_to_datetime(modificado).isoformat() if modificado else None,
        conjunto_atualizado_na_fonte=None,
        licenca=None,
        tamanho_informado_bytes=int(info["content-length"]) if "content-length" in info else None,
        md5_informado=None,
    )


def alvo_sgb() -> Alvo:
    item = ler_json(SGB_ITEM_API)
    bitstream = ler_json(SGB_BITSTREAM_API)
    publicado = [v["value"] for v in item["metadata"].get("dc.date.issued", [])]
    return Alvo(
        chave="sgb/sig_recife_pe.zip",
        grupo="sgb",
        fonte="Serviço Geológico do Brasil (CPRM), RIGeo, Carta de suscetibilidade a movimentos gravitacionais de massa e inundação, Recife - PE",
        recurso=f"{bitstream['name']} (Dados vetoriais SIG; publicação {', '.join(publicado) or 'desconhecida'})",
        url=SGB_DOWNLOAD,
        pagina=SGB_ITEM,
        arquivo=BRUTOS / "sgb" / bitstream["name"],
        estrategia=FAIXAS,
        atualizado_na_fonte=item.get("lastModified"),
        conjunto_atualizado_na_fonte=None,
        licenca=", ".join(v["value"] for v in item["metadata"].get("dc.rights", [])) or None,
        tamanho_informado_bytes=bitstream.get("sizeBytes"),
        md5_informado=bitstream.get("checkSum", {}).get("value"),
    )


def todos_os_alvos(grupos: set[str]) -> list[Alvo]:
    alvos: list[Alvo] = []
    for conjunto, grupo in GRUPO_POR_CONJUNTO.items():
        if grupo in grupos:
            alvos.extend(alvos_ckan(conjunto))
    if "cnefe" in grupos:
        alvos.append(alvo_http_ibge("Municipio/26_PE/2611606_RECIFE.zip", "CNEFE 2022, município 2611606 (Recife)"))
        alvos.append(alvo_http_ibge("Dicionario_CNEFE_Censo_2022.xls", "Dicionário do CNEFE 2022"))
    if "sgb" in grupos:
        alvos.append(alvo_sgb())
    return alvos


def resumo_do_arquivo(caminho: Path) -> tuple[str, str]:
    sha256 = hashlib.sha256()
    md5 = hashlib.md5()
    with caminho.open("rb") as arquivo:
        for bloco in iter(lambda: arquivo.read(1 << 20), b""):
            sha256.update(bloco)
            md5.update(bloco)
    return sha256.hexdigest(), md5.hexdigest()


def baixar_inteiro(alvo: Alvo) -> dict:
    curl = shutil.which("curl.exe") or shutil.which("curl")
    if curl is None:
        raise FalhaDeDownload("curl não encontrado no PATH")
    alvo.arquivo.parent.mkdir(parents=True, exist_ok=True)
    parcial = alvo.arquivo.with_name(alvo.arquivo.name + ".parcial")
    amostra = caminho_da_amostra(alvo)
    erros = []
    for tentativa in range(1, TENTATIVAS_ARQUIVO_INTEIRO + 1):
        comando = [
            curl, "-L", "--fail", "--silent", "--show-error",
            "--connect-timeout", "30", "--max-time", "5400",
            "-A", AGENTE, "-w", "%{size_download} %{time_total}",
            "-o", str(parcial), alvo.url,
        ]
        resultado = subprocess.run(comando, capture_output=True, text=True)
        if resultado.returncode == 0:
            parcial.replace(alvo.arquivo)
            amostra.unlink(missing_ok=True)
            return {"tentativas": tentativa}
        if tamanho_atual(parcial) > tamanho_atual(amostra):
            parcial.replace(amostra)
        parcial.unlink(missing_ok=True)
        recebidos, segundos = (resultado.stdout.split() + ["?", "?"])[:2]
        mensagem = resultado.stderr.strip().splitlines()[-1].split("?")[0] if resultado.stderr.strip() else ""
        erro = f"tentativa {tentativa}: curl {resultado.returncode} após {recebidos} bytes e {segundos} s: {mensagem}"
        erros.append(erro)
        registrar_evento(f"falhou: {alvo.chave}: {erro}", erro=True)
    raise FalhaDeDownload("; ".join(erros))


def caminho_da_amostra(alvo: Alvo) -> Path:
    return alvo.arquivo.with_name(alvo.arquivo.stem + ".amostra-parcial" + alvo.arquivo.suffix)


def tamanho_atual(caminho: Path) -> int:
    return caminho.stat().st_size if caminho.exists() else 0


def completar_faixa(url: str, parte: Path, inicio: int, fim: int) -> None:
    esperado = fim - inicio + 1
    falhas_sem_progresso = 0
    while (atual := tamanho_atual(parte)) < esperado:
        try:
            pedido = requisicao(url, Range=f"bytes={inicio + atual}-{fim}")
            with urlopen(pedido, timeout=120) as resposta:
                if resposta.status != 206:
                    raise FalhaDeDownload(f"servidor respondeu {resposta.status} a um pedido de faixa")
                with parte.open("ab") as saida:
                    for bloco in iter(lambda: resposta.read(1 << 16), b""):
                        saida.write(bloco)
        except (OSError, HTTPException) as erro:
            falhas_sem_progresso = falhas_sem_progresso + 1 if tamanho_atual(parte) == atual else 0
            if falhas_sem_progresso >= TENTATIVAS:
                raise FalhaDeDownload(f"faixa {inicio}-{fim} sem progresso em {TENTATIVAS} tentativas: {erro}") from erro
            time.sleep(5)
    if tamanho_atual(parte) != esperado:
        raise FalhaDeDownload(f"faixa {inicio}-{fim} com {tamanho_atual(parte)} bytes, esperado {esperado}")


def baixar_em_faixas(alvo: Alvo) -> dict:
    if alvo.tamanho_informado_bytes is None:
        raise FalhaDeDownload("tamanho desconhecido; download por faixas exige o tamanho informado pela fonte")
    alvo.arquivo.parent.mkdir(parents=True, exist_ok=True)
    total = alvo.tamanho_informado_bytes
    faixas = [(inicio, min(inicio + TAMANHO_FAIXA, total) - 1) for inicio in range(0, total, TAMANHO_FAIXA)]
    partes = [alvo.arquivo.with_name(f"{alvo.arquivo.name}.faixa{indice:03d}") for indice in range(len(faixas))]
    with ThreadPoolExecutor(max_workers=FAIXAS_SIMULTANEAS) as executor:
        futuros = [executor.submit(completar_faixa, alvo.url, parte, *faixa) for parte, faixa in zip(partes, faixas)]
        for futuro in as_completed(futuros):
            futuro.result()
    with alvo.arquivo.open("wb") as saida:
        for parte in partes:
            with parte.open("rb") as entrada:
                shutil.copyfileobj(entrada, saida)
    for parte in partes:
        parte.unlink()
    return {"metodo": f"faixas HTTP de {TAMANHO_FAIXA} bytes com retomada", "faixas": len(faixas)}


def completar_bloco(alvo: Alvo, destino: Path, deslocamento: int, linhas_esperadas: int) -> None:
    if destino.exists():
        return
    ultimo_erro: Exception | None = None
    for tentativa in range(1, TENTATIVAS_BLOCO + 1):
        try:
            with urlopen(requisicao(url_dump(alvo.id_recurso, alvo.campos, deslocamento, linhas_esperadas)), timeout=180) as resposta:
                texto = resposta.read().decode("utf-8-sig")
            linhas = list(csv.reader(io.StringIO(texto, newline="")))
            cabecalho, registros = linhas[0], linhas[1:]
            if tuple(cabecalho) != alvo.campos:
                raise FalhaDeDownload(f"cabeçalho inesperado no bloco {deslocamento}: {cabecalho}")
            if len(registros) != linhas_esperadas or any(len(r) != len(cabecalho) for r in registros):
                raise FalhaDeDownload(f"bloco {deslocamento} incompleto: {len(registros)} de {linhas_esperadas} linhas")
            temporario = destino.with_suffix(".tmp")
            temporario.write_text(texto if texto.endswith("\n") else texto + "\n", encoding="utf-8", newline="")
            temporario.replace(destino)
            return
        except (OSError, HTTPException, FalhaDeDownload, IndexError) as erro:
            ultimo_erro = erro
            time.sleep(min(60, 5 * tentativa))
    raise FalhaDeDownload(f"bloco {deslocamento} falhou {TENTATIVAS_BLOCO} vezes: {ultimo_erro}")


def baixar_datastore(alvo: Alvo) -> dict:
    proibidos = set(alvo.campos) & set(CAMPOS_DESCARTADOS)
    if proibidos:
        raise FalhaDeDownload(f"campos de contribuinte não podem ser pedidos: {sorted(proibidos)}")
    total = ler_json(CKAN_DATASTORE_TOTAL.format(alvo.id_recurso))["result"]["total"]
    pasta_blocos = alvo.arquivo.with_name(alvo.arquivo.stem + "_blocos")
    pasta_blocos.mkdir(parents=True, exist_ok=True)
    blocos = [
        (pasta_blocos / f"{deslocamento:08d}.csv", deslocamento, min(LINHAS_POR_BLOCO, total - deslocamento))
        for deslocamento in range(0, total, LINHAS_POR_BLOCO)
    ]
    with ThreadPoolExecutor(max_workers=BLOCOS_SIMULTANEOS) as executor:
        futuros = [executor.submit(completar_bloco, alvo, *bloco) for bloco in blocos]
        for futuro in as_completed(futuros):
            futuro.result()
    with alvo.arquivo.open("w", encoding="utf-8", newline="") as saida:
        for indice, (caminho, _, _) in enumerate(blocos):
            texto = caminho.read_text(encoding="utf-8")
            saida.write(texto if indice == 0 else texto.split("\n", 1)[1])
    shutil.rmtree(pasta_blocos)
    return {
        "metodo": f"datastore CKAN (dump CSV) em blocos de {LINHAS_POR_BLOCO} linhas, só com os campos do imóvel",
        "campos_pedidos": list(alvo.campos),
        "campos_nunca_pedidos": list(CAMPOS_DESCARTADOS),
        "linhas": total,
        "id_recurso": alvo.id_recurso,
    }


ESTRATEGIAS = {INTEIRO: baixar_inteiro, FAIXAS: baixar_em_faixas, DATASTORE: baixar_datastore}


def ja_baixado(alvo: Alvo, entrada: dict | None) -> bool:
    if entrada is None or entrada.get("situacao") != "ok":
        return False
    if entrada.get("removido_apos_ingestao"):
        return True
    return alvo.arquivo.exists() and alvo.arquivo.stat().st_size == entrada.get("tamanho_bytes")


def registrar(alvo: Alvo, entrada_anterior: dict | None) -> dict:
    base = {
        "chave": alvo.chave,
        "grupo": alvo.grupo,
        "fonte": alvo.fonte,
        "recurso": alvo.recurso,
        "url": alvo.url,
        "pagina": alvo.pagina,
        "arquivo": caminho_relativo_dados(alvo.arquivo),
        "atualizado_na_fonte": alvo.atualizado_na_fonte,
        "conjunto_atualizado_na_fonte": alvo.conjunto_atualizado_na_fonte,
        "licenca": alvo.licenca,
        "tamanho_informado_bytes": alvo.tamanho_informado_bytes,
    }
    if ja_baixado(alvo, entrada_anterior):
        registrar_evento(f"já baixado: {alvo.chave}")
        return {**entrada_anterior, **base}
    inicio = agora_recife()
    try:
        detalhes = ESTRATEGIAS[alvo.estrategia](alvo)
    except FalhaDeDownload as erro:
        registrar_evento(f"desistiu: {alvo.chave}: {erro}", erro=True)
        amostra = caminho_da_amostra(alvo)
        return {
            **base,
            "baixado_em": None,
            "tamanho_bytes": None,
            "situacao": "falhou",
            "erro": str(erro),
            "amostra_parcial": (
                {"arquivo": caminho_relativo_dados(amostra), "bytes": tamanho_atual(amostra)} if amostra.exists() else None
            ),
            "registrado_em": agora_recife().isoformat(timespec="seconds"),
        }
    sha256, md5 = resumo_do_arquivo(alvo.arquivo)
    tamanho = alvo.arquivo.stat().st_size
    registrar_evento(f"baixado: {alvo.chave} ({tamanho} bytes)")
    return {
        **base,
        **detalhes,
        "baixado_em": inicio.isoformat(timespec="seconds"),
        "concluido_em": agora_recife().isoformat(timespec="seconds"),
        "tamanho_bytes": tamanho,
        "tamanho_confere": None if alvo.tamanho_informado_bytes is None else tamanho == alvo.tamanho_informado_bytes,
        "md5_confere": None if alvo.md5_informado is None else md5 == alvo.md5_informado,
        "sha256": sha256,
        "situacao": "ok",
    }


def main() -> None:
    grupos_validos = ["area-urbana", "iptu", "defesa-civil", "cnefe", "sgb"]
    parser = argparse.ArgumentParser(description="Baixa as fontes públicas do protótipo e atualiza data/manifesto.json")
    parser.add_argument("grupos", nargs="*", choices=grupos_validos, default=grupos_validos)
    parser.add_argument("--somente", nargs="*", default=None, help="limita aos arquivos com estes nomes locais")
    parser.add_argument("--refazer", action="store_true", help="baixa de novo mesmo o que já consta como baixado")
    argumentos = parser.parse_args()
    grupos = set(argumentos.grupos)
    DADOS.mkdir(parents=True, exist_ok=True)
    manifesto = carregar_manifesto()
    selecionados = todos_os_alvos(grupos)
    chaves_selecionadas = {alvo.chave for alvo in selecionados}
    por_chave = {
        entrada["chave"]: entrada
        for entrada in manifesto["arquivos"]
        if entrada["grupo"] not in grupos or entrada["chave"] in chaves_selecionadas
    }
    alvos = [
        alvo
        for alvo in selecionados
        if argumentos.somente is None or alvo.arquivo.name in argumentos.somente
    ]
    alvos.sort(key=lambda alvo: alvo.tamanho_informado_bytes or 0, reverse=True)
    with ThreadPoolExecutor(max_workers=DOWNLOADS_SIMULTANEOS) as executor:
        futuros = [executor.submit(registrar, alvo, None if argumentos.refazer else por_chave.get(alvo.chave)) for alvo in alvos]
        for futuro in as_completed(futuros):
            entrada = futuro.result()
            por_chave[entrada["chave"]] = entrada
            manifesto["arquivos"] = list(por_chave.values())
            salvar_manifesto(manifesto)
    falhas = [e["chave"] for e in por_chave.values() if e.get("situacao") == "falhou"]
    if falhas:
        registrar_evento("falhas registradas no manifesto: " + ", ".join(falhas), erro=True)


if __name__ == "__main__":
    main()
