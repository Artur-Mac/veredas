"""EDA limitada do feed oficial; não publica dados no aplicativo nem afirma licença."""
import csv
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

URL = "https://www.granderecife.pe.gov.br/gtfs/gtfs.zip"
ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache/dados-recife/gtfs-inspecao.zip"
REPORT = ROOT / "docs/plano-recife/execucoes/gtfs-inspecao.json"
report = {"fonte": URL, "consultado_em": datetime.now(timezone.utc).isoformat(),
          "licenca": "não confirmada; não habilitar no app", "integracao": "não realizada"}
try:
    if not CACHE.exists():
        request = urllib.request.Request(URL, headers={"User-Agent": "VEREDA-local-research/1.0"})
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read(100 * 1024 * 1024 + 1)
        if len(data) > 100 * 1024 * 1024:
            raise ValueError("Feed excedeu o limite de download de 100 MB.")
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_bytes(data)
    data = CACHE.read_bytes()
    report["sha256"] = hashlib.sha256(data).hexdigest()
    report["bytes_zip"] = len(data)
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        infos = archive.infolist()
        if len(infos) > 100 or any(".." in Path(i.filename).parts or i.filename.startswith("/") for i in infos):
            raise ValueError("Estrutura do arquivo recusada.")
        report["bytes_expandidos_declarados"] = sum(i.file_size for i in infos)
        report["arquivos"] = {i.filename: i.file_size for i in infos}
        report["tabelas"] = {}
        for name in ("agency.txt", "feed_info.txt", "routes.txt", "stops.txt", "calendar.txt", "calendar_dates.txt"):
            found = next((i for i in infos if i.filename == name), None)
            if not found:
                report["tabelas"][name] = {"ausente": True}
                continue
            if found.file_size > 20 * 1024 * 1024:
                raise ValueError(f"Tabela excedeu limite de 20 MB: {name}")
            content = archive.read(name)
            rows = list(csv.DictReader(io.StringIO(content.decode("utf-8-sig"))))
            table = {"linhas": len(rows), "campos": list(rows[0]) if rows else []}
            if name == "feed_info.txt":
                table["vigencia"] = [{k: r.get(k) for k in ("feed_start_date", "feed_end_date", "feed_version")} for r in rows]
            report["tabelas"][name] = table
        report["resultado"] = "metadados lidos; horários, calendário completo e licença ainda não validados"
except Exception as exc:
    report["resultado"] = "bloqueado na obtenção ou leitura"
    report["erro"] = f"{type(exc).__name__}: {exc}"
REPORT.parent.mkdir(parents=True, exist_ok=True)
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(report, ensure_ascii=False, indent=2))
