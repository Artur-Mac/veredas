#!/usr/bin/env python3
"""Baixa recursos prioritários do catálogo preservado e registra resultados verificáveis."""
import concurrent.futures, csv, hashlib, json, pathlib, re, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / '.cache/dados-recife/hub-2026-11-15'
OUT.mkdir(parents=True, exist_ok=True)
packages = json.loads((ROOT / 'docs/aplicacao/catalogo-recife-2026-11-15.json').read_text())
def selected(p, r):
    name, fmt = r['name'].lower(), r.get('format', '').lower()
    if 'dicion' in name or 'metadado' in name: return fmt in ('json', 'pdf')
    if fmt != 'csv': return False
    ident = p['id']
    if 'central-de-atendimento' in ident: return any(str(y) in name for y in (2024, 2025, 2026))
    if 'acidentes-de-transito' in ident: return any(str(y) in name for y in (2022, 2023, 2024))
    if 'transmissao-de-bens' in ident or 'territorial-urbano' in ident: return '2026' in name
    if 'defesa-civil' in ident: return '2024' in name or '2025' in name
    return True
jobs = [(p, r) for p in packages for r in p['result']['resources'] if selected(p, r)]
def download(job):
    p, r = job
    dest = OUT / (r['id'] + '.' + r.get('format', 'bin').lower())
    info = {'conjunto': p['id'], 'nome': r['name'], 'resource_id': r['id'], 'url': r['url'], 'arquivo': str(dest.relative_to(ROOT)), 'licenca': p['result'].get('license_title'), 'tamanho_catalogo': r.get('size')}
    try:
        req = urllib.request.Request(r['url'], headers={'User-Agent': 'VEREDA-dados/1.0'})
        with urllib.request.urlopen(req, timeout=120) as response, dest.open('wb') as f:
            while chunk := response.read(1024 * 1024): f.write(chunk)
            info['http'] = response.status
            info['content_type'] = response.headers.get('Content-Type')
        h = hashlib.sha256()
        with dest.open('rb') as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b''): h.update(chunk)
        info['bytes'] = dest.stat().st_size
        info['sha256'] = h.hexdigest()
        if r.get('format', '').lower() == 'csv':
            with dest.open(encoding='utf-8-sig', errors='replace', newline='') as f:
                sample = f.read(8192); f.seek(0)
                try: dialect = csv.Sniffer().sniff(sample, delimiters=',;\t|')
                except csv.Error: dialect = csv.excel
                reader = csv.reader(f, dialect)
                info['colunas'] = next(reader, [])
                info['registros'] = sum(1 for _ in reader)
                info['delimitador'] = dialect.delimiter
        info['estado'] = 'baixado'
    except Exception as exc:
        dest.unlink(missing_ok=True)
        info['estado'] = 'falhou'; info['erro'] = str(exc)
    return info
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(download, jobs))
manifest = ROOT / 'docs/aplicacao/manifesto-extracao-hub-2026-11-15.json'
manifest.write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')
for r in results: print(r['estado'], r['conjunto'], r['nome'], r.get('registros', ''), r.get('erro', ''))
