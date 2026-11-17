"""EDA somente de leitura sobre o cache minimizado do VEREDA. Sem rede ou endereços na saída.

Executar da raiz: python3 docs/produto/refinamento-2026-10-21/evidencias/explorar_cnefe.py
Não altera o índice nem amplia a lista de campos do produto. Contagens são de registros,
não de empresas, portas ou estabelecimentos únicos. Proximidade é exploratória.
"""
from collections import Counter, defaultdict
from pathlib import Path
import gzip
import hashlib
import json
import math
import unicodedata

ROOT = Path(__file__).resolve().parents[4]
CACHE = ROOT / '.cache/dados-recife/cnefe-recife.json.gz'
OUT = Path(__file__).with_name('eda-cnefe.json')
BAIRROS = ('boa-viagem', 'casa-forte', 'espinheiro', 'gracas', 'madalena')

def normalizar(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if not unicodedata.combining(c))
    return '-'.join(s.lower().split())

def resumo(rows, ix):
    especies, niveis, cruzada = Counter(), Counter(), Counter()
    validos = sem_numero = 0
    for row in rows:
        especie, nivel = row[ix['COD_ESPECIE']], row[ix['NV_GEO_COORD']]
        especies[especie or 'ausente'] += 1
        niveis[nivel or 'ausente'] += 1
        cruzada[f'{especie}/{nivel}'] += 1
        if coordenada(row, ix):
            validos += 1
        if not row[ix['NUM_ENDERECO']].strip().isdigit() or int(row[ix['NUM_ENDERECO']] or 0) == 0:
            sem_numero += 1
    return dict(registros=len(rows), especies=dict(sorted(especies.items())),
                niveis_geocodificacao=dict(sorted(niveis.items())),
                especie_por_nivel=dict(sorted(cruzada.items())),
                coordenada_no_retangulo_do_app=validos, numero_nao_inteiro_positivo=sem_numero)

def coordenada(row, ix):
    try:
        lat, lon = (float(row[ix[k]].replace(',', '.')) for k in ('LATITUDE', 'LONGITUDE'))
        return (lon, lat) if -8.35 <= lat <= -7.75 and -35.2 <= lon <= -34.75 else None
    except (ValueError, AttributeError):
        return None

def distancia(a, b):
    lon1, lat1, lon2, lat2 = map(math.radians, (*a, *b))
    h = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 6371000 * 2 * math.asin(min(1, math.sqrt(h)))

with gzip.open(CACHE, 'rt') as f:
    base = json.load(f)
ix = {c: i for i, c in enumerate(base['colunas'])}
rows = base['linhas']
grupos = defaultdict(list)
grid = defaultdict(list)
for row in rows:
    bairro = normalizar(row[ix['DSC_LOCALIDADE']])
    if bairro in BAIRROS:
        grupos[bairro].append(row)
    pos = coordenada(row, ix)
    # Apenas categorias específicas, e nível 1 (coordenada original), para esta simulação.
    # Origem GPS não garante precisão métrica; não se publica esta distância no app.
    if pos and row[ix['NV_GEO_COORD']] == '1' and row[ix['COD_ESPECIE']] in ('4', '5', '8'):
        grid[(math.floor(pos[0]/0.005), math.floor(pos[1]/0.005))].append((pos, row[ix['COD_ESPECIE']]))

bairros = {}
for bairro in BAIRROS:
    path = ROOT / f'src/dados/recife/indice/{bairro}.json'
    raw = path.read_bytes()
    edificios = json.loads(raw)['edificios']
    counts = {str(r): Counter() for r in (150, 300)}
    for e in edificios:
        pos = e['centro']
        x, y = (math.floor(v/0.005) for v in pos)
        vizinhos = [item for dx in (-1, 0, 1) for dy in (-1, 0, 1) for item in grid[(x+dx, y+dy)]]
        distancias = [(distancia(pos, p), especie) for p, especie in vizinhos]
        for raio in (150, 300):
            presentes = {esp for dist, esp in distancias if dist <= raio}
            counts[str(raio)].update(presentes)
            if presentes:
                counts[str(raio)]['qualquer_4_5_8'] += 1
    bairros[bairro] = dict(**resumo(grupos[bairro], ix), edificios_no_indice=len(edificios),
        sha256_indice=hashlib.sha256(raw).hexdigest(),
        edificios_com_registro_nivel1_no_raio={r: dict(sorted(c.items())) for r,c in counts.items()})

result = dict(data_analise='2026-10-21', fonte=base['consulta'],
    modificado_em_no_cache=base.get('modificadoEm'), sha256_cache=hashlib.sha256(CACHE.read_bytes()).hexdigest(),
    metodo='Registros do cache minimizado. Bairro por DSC_LOCALIDADE. Retângulo do app não é limite municipal. '
    'Haversine do centro dos 2688 edifícios a registros de ensino (4), saúde (5) e religiosos (8), nível 1. '
    'Raio não é rota, fachada, ruído ou atividade atual. Um prédio pode entrar em várias categorias. '
    'Índices cobrem cinco bairros; contagens não representam demanda de usuários.',
    recife=resumo(rows, ix), bairros=bairros)
OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(dict(recife=result['recife'], bairros={b:{k:v for k,v in d.items() if k in ('registros','especies','edificios_com_registro_nivel1_no_raio')} for b,d in bairros.items()}), ensure_ascii=False, indent=2))
