#!/usr/bin/env python3
"""Recortes solares offline. Fontes em /tmp/vereda-sol-fontes (não embarca arquivos brutos).

python3 scripts/dados/preparar-sol-recife.py [--cache PASTA] [--bairros gracas casa-forte ...]
Download é etapa externa explícita; este preparador só lê arquivos locais.
"""
import subprocess
import argparse
import collections
import hashlib
import json
import math
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--cache', default='/tmp/vereda-sol-fontes')
parser.add_argument('--bairros', nargs='+', default=['gracas', 'casa-forte', 'espinheiro', 'boa-viagem'])
args = parser.parse_args()
indice = re.search(r'"(indice-municipal/[^\"]+)"', (ROOT / 'src/dados/recife/publicacaoGerada.ts').read_text())[1]
out = ROOT / 'src/dados/sol/recortes'
out.mkdir(parents=True, exist_ok=True)
def features(filename):
    for line in (pathlib.Path(args.cache) / filename).open():
        if line.lstrip().startswith('{ "type": "Feature"'):
            yield json.loads(line.strip().rstrip(','))
def inside(p, ring):
    yes = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > p[1]) != (b[1] > p[1]) and p[0] < (b[0]-a[0]) * (p[1]-a[1]) / (b[1]-a[1]) + a[0]:
            yes = not yes
    return yes
def cross(a,b,c): return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
def valid_ring(r):
    if len(r)<4 or r[0]!=r[-1]: return False
    if len(set(map(tuple,r)))<3: return False
    for i in range(len(r)-1):
        for j in range(i+2,len(r)-1):
            if i==0 and j==len(r)-2: continue
            a,b,c,d=r[i],r[i+1],r[j],r[j+1]
            if cross(a,b,c)*cross(a,b,d)<0 and cross(c,d,a)*cross(c,d,b)<0: return False
    return abs(sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(r,r[1:])))>1e-12
def polygons(f):
    g=f.get('geometry') or {}
    return [g['coordinates']] if g.get('type')=='Polygon' else g.get('coordinates',[]) if g.get('type')=='MultiPolygon' else []

all_ed={}
selected={}
for path in (ROOT / 'src/dados/recife' / indice).glob('*.json'):
    if path.name=='meta.json': continue
    es=json.loads(path.read_text()).get('edificios',[])
    for e in es:
        if e.get('dsqfl'): all_ed.setdefault(e['dsqfl'],[]).append(e)
    if path.stem in args.bairros:
        xs=[e['centro'][0] for e in es];ys=[e['centro'][1] for e in es]
        selected[path.stem]={'bbox':[min(xs)-.003,min(ys)-.003,max(xs)+.003,max(ys)+.003], 'volumes':[], 'edificios':es}
stats=collections.Counter()
layers=collections.Counter()
comparisons=[]
cadastro_lotes={}
for f in features('edificacoes-lotes.geojson'):
    stats['edificacoes_lotes_lidas']+=1
    key=str(f['properties'].get('DSQFL',''))
    if not re.fullmatch(r'\d{14}',key): stats['chave_lotes_invalida']+=1
    elif key in all_ed: cadastro_lotes[key]=polygons(f)
for f in features('edificacoes-pavimentos.geojson'):
    p=f['properties'];key=str(p.get('DSQFL',''));n=p.get('PAVIMENTO');layer=p.get('LAYER','')
    stats['pavimentos_lidos']+=1;layers[layer]+=1
    if not re.fullmatch(r'\d{14}',key): stats['chave_pavimentos_invalida']+=1
    for index, poly in enumerate(polygons(f)):
        if not poly or not poly[0]:continue
        xs=[q[0] for q in poly[0]];ys=[q[1] for q in poly[0]]
        bb=[min(xs),min(ys),max(xs),max(ys)]
        groups=[s for s in selected.values() if bb[2]>=s['bbox'][0] and bb[0]<=s['bbox'][2] and bb[3]>=s['bbox'][1] and bb[1]<=s['bbox'][3]]
        if not groups:continue
        if any(len(q)<2 or not (-35.2<q[0]<-34.7 and -8.5<q[1]<-7.8) for ring in poly for q in ring):
            stats['coordenadas_rejeitadas']+=1;continue
        rings=[[[round(q[0],6),round(q[1],6)] for q in ring] for ring in poly]
        if any(not valid_ring(r) for r in rings) or any(not inside(r[0],rings[0]) for r in rings[1:]):
            stats['aneis_invalidos']+=1;continue
        # Classe explicita numero de pavimentos; não conta feições. Construção e anexos sem semântica suficiente ficam sem altura.
        classe=bool(re.fullmatch(r'[1-4]_Pavimento(?:_Parcial)?|Acima_04_Pav(?:_Parcial)?',layer))
        valido=classe and isinstance(n,(int,float)) and n>=1 and n<=80
        owners=all_ed.get(key,[])
        spatial=[e for e in owners if e.get('poligono') and any(inside(q,e['poligono']) for q in rings[0])]
        corresponde=len(spatial)==1 and key in cadastro_lotes and any(any(inside(q,foot[0]) for q in rings[0]) for foot in cadastro_lotes[key])
        if owners and not corresponde: stats['associacao_ambigua_ou_distante']+=1
        altura=round(n*3.1,1) if valido else None
        volume={'id':f"pav-{p['OBJECTID']}-{index}",'dsqfl':key if re.fullmatch(r'\d{14}',key) else '',
            'aneis':rings,'alturaM':altura,'baseM':0,
            'alturaMinM':round(n*2.8,1) if valido else None,'alturaMaxM':round(n*3.4,1) if valido else None,
            'origemAltura':'pavimentos_cadastrais' if valido else 'desconhecida',
            'associacaoValidada':corresponde}
        for s in groups:s['volumes'].append(volume)
        if corresponde and valido and n>=5 and len(comparisons)<12:
            comparisons.append({'dsqfl':key,'classe':layer,'pavimentosGeometria':n,'pavimentosLote':spatial[0].get('pavimentos')})
hashes={n:hashlib.sha256((pathlib.Path(args.cache)/n).read_bytes()).hexdigest() for n in ['edificacoes-lotes.geojson','edificacoes-pavimentos.geojson']}
report={'fontesEm':'2026-03-02','licenca':'ODbL','fontes':[
    'https://dados.recife.pe.gov.br/dataset/area-urbana/resource/76280b81-d3d3-4719-b686-8adb58e57b7f',
    'https://dados.recife.pe.gov.br/dataset/area-urbana/resource/319077bd-4ec7-4e06-8544-c36a5077b47a'],
    'sha256':hashes,'contagens':dict(stats),'classes':dict(layers),'amostraAssociacoes':comparisons,'bairros':{}}
assinatura=''.join(hashes.values())+hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest()
version='recife-20260302-'+hashlib.sha256(assinatura.encode()).hexdigest()[:12]
loaders=[]
for name,s in selected.items():
    lotes=sorted(set(v['dsqfl'] for v in s['volumes']))
    lote_ids={key:i for i,key in enumerate(lotes)}
    # Coordenadas de ~0,11 m, delta inteiro. Só representação: não muda o motor nem transforma lote em torre.
    compactos=[]
    for v in s['volumes']:
        aneis=[[[round((p[0]+35)*1e6),round((p[1]+8)*1e6)] for p in ring] for ring in v['aneis']]
        compactos.append([v['id'],lote_ids[v['dsqfl']],round(v['alturaM']/3.1) if v['alturaM'] else None,1 if v['associacaoValidada'] else 0,aneis])
    data={'formato':1,'origem':[-35,-8],'escala':1000000,'lotes':lotes,'versao':version,'fonteEm':'2026-03-02','bbox':s['bbox'],'cobertura':'cadastral_parcial','volumes':compactos}
    content=json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n'
    (out/(name+'.json')).write_text(content)
    report['bairros'][name]={'volumes':len(s['volumes']),'bytes':len(content.encode()),'associacoesValidadas':sum(v['associacaoValidada'] for v in s['volumes'])}
    loaders.append(f'  "{name}": "sol/recortes/{name}.json",')
(out.parent/'fontesGeradas.ts').write_text('// Gerado por scripts/dados/preparar-sol-recife.py. Carga por área, só quando solicitada.\nexport const ARQUIVOS_SOLARES: Record<string, string> = {\n'+'\n'.join(loaders)+'\n};\n')
# D036: os recortes saem do bundle JS; a publicação copia cada um para public/dados e assets/dados.
subprocess.run(['node', str(ROOT/'scripts/dados/publicar-camadas.cjs')], check=True)
evidence=ROOT/'docs/produto/sol-nas-janelas-2026-10-27/evidencias'
evidence.mkdir(exist_ok=True)
(evidence/'geometrias.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report['bairros'],ensure_ascii=False,indent=2))
