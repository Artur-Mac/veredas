import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DADOS = RAIZ / "data"
BRUTOS = DADOS / "brutos"
DERIVADOS = DADOS / "derivados"
MANIFESTO = DADOS / "manifesto.json"
FUSO_RECIFE = timezone(timedelta(hours=-3), "America/Recife")
CRS_TRABALHO = "EPSG:31985"


def agora_recife() -> datetime:
    return datetime.now(FUSO_RECIFE)


def caminho_relativo_dados(caminho: Path) -> str:
    return caminho.resolve().relative_to(DADOS.resolve()).as_posix()


def carregar_manifesto() -> dict:
    if MANIFESTO.exists():
        return json.loads(MANIFESTO.read_text(encoding="utf-8"))
    return {"descricao": "Arquivos brutos baixados para o protótipo PropSight", "arquivos": []}


def salvar_manifesto(manifesto: dict) -> None:
    manifesto["arquivos"].sort(key=lambda entrada: entrada["chave"])
    manifesto["atualizado_em"] = agora_recife().isoformat(timespec="seconds")
    MANIFESTO.write_text(json.dumps(manifesto, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sql_texto(valor: str | Path) -> str:
    texto = valor.as_posix() if isinstance(valor, Path) else valor
    return "'" + texto.replace("'", "''") + "'"


def sql_lista(valores: list[str | Path]) -> str:
    return "[" + ", ".join(sql_texto(valor) for valor in valores) + "]"
