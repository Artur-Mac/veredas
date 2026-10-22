"""Validação estrutural local do plano; não executa nem valida o aplicativo."""
from pathlib import Path
import json
import re
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parents[1]
REPORT = BASE / "evidencias" / "validacao.json"
errors = []
files = sorted(BASE.glob("*.md"))
catalogue = (BASE / "01-CATALOGO-E-RASTREABILIDADE.md").read_text()
rows = re.findall(r"^\| (F\d{2}) \|.*?\| ([0-9/]+) \|", catalogue, re.M)
expected_ids = {f"F{i:02}" for i in range(1, 81)}
if len(rows) != 80 or {fid for fid, _ in rows} != expected_ids:
    errors.append("Catálogo não contém exatamente F01–F80 únicos.")

epochs = {}
tasks = []
local_links = 0
for path in files:
    content = path.read_text()
    if len(re.findall(r"^```", content, re.M)) % 2:
        errors.append(f"Bloco de código sem fechamento: {path.name}")
    for target in re.findall(r"\]\(([^\n]+?)\)", content):
        if re.match(r"[a-z]+://", target):
            continue
        target = target.split("#")[0]
        if not target:
            continue
        resolved = (path.parent / target).resolve()
        local_links += 1
        if not resolved.exists() and resolved != REPORT:
            errors.append(f"Link local inexistente: {path.name} → {target}")
    for section in re.split(r"(?=^## Época \d{2} —)", content, flags=re.M)[1:]:
        epoch = re.match(r"## Época (\d{2}) —", section).group(1)
        if epoch in epochs:
            errors.append(f"Época repetida: {epoch}")
        cap_line = re.search(r"\*\*Capacidades:\*\* (.*)", section).group(1)
        # Limitar à frase de capacidades para não capturar IDs de dependências.
        cap_line = cap_line.split(". **")[0]
        caps = set(re.findall(r"F\d{2}", cap_line))
        for start, end in re.findall(r"F(\d{2})[–-]F(\d{2})", cap_line):
            caps.update(f"F{i:02}" for i in range(int(start), int(end) + 1))
        epoch_tasks = re.findall(r"^### (EP\d{2}\.\d{2}) —", section, re.M)
        tasks.extend(epoch_tasks)
        if not epoch_tasks or any(not t.startswith(f"EP{epoch}.") for t in epoch_tasks):
            errors.append(f"Tarefas ausentes/incompatíveis na época {epoch}")
        epochs[epoch] = {"arquivo": path.name, "capacidades": sorted(caps), "unidades": epoch_tasks}

if set(epochs) != {f"{i:02}" for i in range(15)}:
    errors.append("Épocas não cobrem exatamente 00–14.")
if len(set(tasks)) != len(tasks):
    errors.append("IDs de unidades duplicados.")
for fid, epoch_list in rows:
    for epoch in epoch_list.split("/"):
        if fid not in epochs.get(epoch, {}).get("capacidades", []):
            errors.append(f"{fid} não tem destino declarado na época {epoch}.")

report = {
    "verificado_em_utc": datetime.now(timezone.utc).isoformat(),
    "escopo": "estrutura documental; não valida código, fonte externa, UX ou aparelho",
    "documentos": len(files),
    "capacidades": len(rows),
    "epocas": len(epochs),
    "unidades": len(tasks),
    "links_locais_verificados": local_links,
    "cobertura": epochs,
    "erros": errors,
    "resultado": "passou" if not errors else "falhou",
}
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({k: v for k, v in report.items() if k != "cobertura"}, ensure_ascii=False, indent=2))
raise SystemExit(bool(errors))
