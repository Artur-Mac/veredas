"""EDA descritiva reprodutível; somente agregados, sem endereços individuais.
Execute da raiz: python3 docs/produto/melhorias-2026-10-20/evidencias/explorar_indice.py
Não estima risco, preço, qualidade ou probabilidade de identificação.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'src/dados/recife/indice'
linhas = []
for path in sorted(BASE.glob('*.json')):
    if path.name == 'meta.json':
        continue
    raw = path.read_bytes()
    d = json.loads(raw)
    es = d['edificios']
    count = lambda fn: sum(bool(fn(e)) for e in es)
    ruas = d['rua']['logradouros']
    linhas.append({
        'bairro': d['bairro'], 'geradoEm': d['geradoEm'],
        'sha256': hashlib.sha256(raw).hexdigest(), 'bytes_json': len(raw),
        'edificios': len(es), 'unidades_cadastrais': sum(e['unidades'] for e in es),
        'com_poligono': count(lambda e: e.get('poligono')),
        'com_quartis_itbi_unidade': count(lambda e: e.get('itbi') and e['itbi'].get('valorUnidade')),
        'com_setor': count(lambda e: e.get('rua') and e['rua'][0] is not None),
        'com_pedido_drenagem_150m': count(lambda e: e.get('rua') and e['rua'][1] > 0),
        'com_sinistro_com_vitima_150m': count(lambda e: e.get('rua') and e['rua'][7] > 0),
        'com_obra_relevante_24m_150m': count(lambda e: e['obras150m']['relevantes24m'] > 0),
        'compativeis_so_area_70m2': count(lambda e: any(abs(t['area'] - 70) <= max(1.5, 70 * .03) for t in e['tipologias'])),
        'logradouros_no_indice': len(ruas),
        'logradouros_com_defesa_civil': sum(bool(r.get('defesaCivil')) for r in ruas.values()),
    })
saida = {'metodo': 'Contagem de edifícios que possuem atributos; áreas usam tolerância do buscador. Contagens espaciais sobrepostas não são eventos únicos. Não é amostra representativa do Recife.', 'bairros': linhas}
dest = Path(__file__).with_name('eda-indice.json')
dest.write_text(json.dumps(saida, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(saida, ensure_ascii=False, indent=2))
