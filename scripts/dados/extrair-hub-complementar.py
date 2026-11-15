#!/usr/bin/env python3
"""Baixa recursos adicionais selecionados na busca do catálogo."""
import concurrent.futures, csv, hashlib, json, pathlib, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / '.cache/dados-recife/hub-2026-11-15'
OUT.mkdir(parents=True, exist_ok=True)
ids = {'calcadas-dos-corredores-de-transporte-metropolitano','calcadas-recuperadas-da-cidade-do-recife','paraciclos-do-recife','malha-cicloviaria-do-recife','ciclovias-ciclofaixas-estacoes-de-aluguel-de-bikes-e-rotas','equipamentos-culturais','rede-de-saude-municipal','localizacao-dos-semaforos','registro-de-chamados-atendidos-pela-cttu','faixas-e-corredores-de-onibus','unidade-conservacao-da-natureza'}
packages = {}
for q in json.loads((ROOT / 'docs/aplicacao/busca-catalogo-hub-2026-11-15.json').read_text()):
    for p in q.get('conjuntos', []):
        if p['id'] in ids: packages[p['id']] = p
jobs = [(p, r) for p in packages.values() for r in p['recursos'] if r.get('formato', '').lower() in ('csv', 'json', 'geojson', 'pdf')]
def download(job):
    p, r = job
    dest = OUT / (r['id'] + '.' + r['formato'].lower())
    d = {'conjunto': p['id'], 'nome': r['nome'], 'resource_id': r['id'], 'url': r['url'], 'arquivo': str(dest.relative_to(ROOT)), 'licenca': p['licenca']}
    try:
        with urllib.request.urlopen(urllib.request.Request(r['url'], headers={'User-Agent': 'VEREDA-dados/1.0'}), timeout=120) as response, dest.open('wb') as f:
            while chunk := response.read(1048576): f.write(chunk)
            d['http'] = response.status; d['content_type'] = response.headers.get('Content-Type')
        b = dest.read_bytes(); d['bytes'] = len(b); d['sha256'] = hashlib.sha256(b).hexdigest()
        if r['formato'].lower() == 'csv':
            with dest.open(encoding='utf-8-sig', errors='replace', newline='') as f:
                sample = f.read(8192); f.seek(0)
                try: dialect = csv.Sniffer().sniff(sample, delimiters=',;\t|')
                except csv.Error: dialect = csv.excel
                reader = csv.reader(f, dialect); d['colunas'] = next(reader, []); d['registros'] = sum(1 for _ in reader); d['delimitador'] = dialect.delimiter
        elif r['formato'].lower() == 'geojson':
            obj = json.loads(b); d['registros'] = len(obj.get('features', [])); d['geojson_tipo'] = obj.get('type')
        d['estado'] = 'baixado'
    except Exception as exc:
        dest.unlink(missing_ok=True); d['estado'] = 'falhou'; d['erro'] = str(exc)
    return d
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: results = list(pool.map(download, jobs))
(ROOT / 'docs/aplicacao/manifesto-extracao-complementar-2026-11-15.json').write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')
for r in results: print(r['estado'], r['conjunto'], r['nome'], r.get('registros', ''), r.get('erro', ''))
