#!/usr/bin/env python3
"""Registra os resultados do catálogo para temas adicionais do produto."""
import json, pathlib, urllib.parse, urllib.request
root = pathlib.Path(__file__).resolve().parents[2]
terms = ['calçadas', 'ciclovias', 'paraciclos', 'equipamentos culturais', 'equipamentos educação', 'saúde unidades', 'alagamento', 'drenagem', 'semáforos', 'iluminação pública', 'áreas verdes', 'transporte']
results = []
for term in terms:
    url = 'https://dados.recife.pe.gov.br/api/3/action/package_search?' + urllib.parse.urlencode({'q': term, 'rows': 20})
    try:
        with urllib.request.urlopen(url, timeout=40) as res: data = json.load(res)
        results.append({'termo': term, 'url': url, 'total': data['result']['count'], 'conjuntos': [{'id': p['name'], 'titulo': p['title'], 'licenca': p.get('license_title'), 'recursos': [{'nome': r['name'], 'formato': r['format'], 'url': r['url'], 'id': r['id']} for r in p['resources']]} for p in data['result']['results']]})
    except Exception as exc: results.append({'termo': term, 'url': url, 'erro': str(exc)})
    print(term, results[-1].get('total'), results[-1].get('erro', ''), flush=True)
(root / 'docs/aplicacao/busca-catalogo-hub-2026-11-15.json').write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')
