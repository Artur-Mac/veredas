# Infraestrutura de dados VEREDA

Pipeline heterodoxo para o app de evidência de imóveis. Cada dado é um **fato com fonte e data** — nunca um adjetivo.

## Estrutura

```
docs/dados/
├── raw/                    # saída bruta dos scrapers (não editar à mão)
│   ├── google-maps/        # 01 — 100 queries, HTML + JSON por bairro
│   ├── imoveis/            # 02 — Oleo (venda + aluguel, 5 bairros)
│   ├── leiloes/            # 03 — HTML de leiloeiros e bancos
│   ├── cadastro-municipal/ # 04 — Defesa Civil CSVs (2021–2025), bairros GeoJSON, limites ESIG
│   ├── pesquisa-cientifica/# 05 — arXiv + Semantic Scholar papers
│   ├── ruido-aeroporto/    # 06 — cone de ruído + prédios afetados
│   ├── transporte/         # 07 — GTFS (paradas)
│   ├── precos/             # 08 — FipeZAP xlsx (Recife)
│   ├── osm-pois/           # 10 — OpenStreetMap POIs
│   └── temperatura/        # 11 — temperatura por bairro (Open-Meteo)
├── processado/             # consolidado (09-processar.mjs), 8 JSONs
│   ├── alagamento.json
│   ├── transporte.json
│   ├── precos.json
│   ├── entorno.json
│   ├── condominio.json
│   ├── pesquisa.json
│   ├── ruido-aeroporto.json
│   └── temperatura.json
├── fontes/
│   └── fontes.json         # registro de fontes (registrarFonte())
├── crivo/
│   └── CRIVO.md            # 8 regras de seleção + formato de saída
└── infra/scripts/
    ├── http.mjs            # fetch + saveOut
    ├── fontes.mjs          # registrarFonte()
    ├── rodar-tudo.mjs      # roda todos os scrapers em sequência
    ├── 01-google-maps.mjs
    ├── 02-imoveis-oleo.mjs
    ├── 03-leiloes.mjs
    ├── 04-cadastro-municipal.mjs
    ├── 05-pesquisa-cientifica.mjs
    ├── 06-ruido-aeroporto.mjs
    ├── 07-gtfs-transporte.mjs
    ├── 08-fipezap.mjs
    ├── 09-processar.mjs    # consolida raw/ → processado/
    ├── 10-osm-pois.mjs
    └── 11-temperatura.mjs  # temperatura por bairro (Open-Meteo ERA5 + recente)
```

## Como rodar

```bash
# Node (não está no PATH padrão)
export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH"

# Rodar tudo
cd docs/dados/infra/scripts
node rodar-tudo.mjs

# Rodar um scraper específico
node 07-gtfs-transporte.mjs

# Consolidar (após os scrapers)
node 09-processar.mjs
```

## Corretas conhecidas

| Fonte | Correção | Motivo |
|---|---|---|
| GTFS Grande Recife | `s.lat - 0.75` | Coordenadas ~0.75° ao norte do real (verificado: "Terminal Residencial Boa Viagem" está em lat=-8.119 no GTFS, bairro real em -8.865) |
| ESIG UTM 19S | SR 31985 é UTM 17S; o real é UTM 19S (CM -33°) | Extent y 9098072–9122720 corresponde a lat ≈ -8.0 a -8.15; nossos bairros estão em -8.85 |
| Defesa Civil CSV | Bairro usa nomes sem acento ("Gracas" não "Graças") | Matching precisa normalizar ou comparar sem acento |
| FipeZAP xlsx | Recife = sheet53 (rId53) | 68 linhas, agregado por cidade — sem quebra por bairro no xlsx |
| Overpass API | overpass-api.de = 406, kumi = 429, mail.ru = 504/200 com dados esparsos | Todos os mirrors com limitação de capacidade ou dados incompletos para Recife |
| Open-Meteo ERA5 | grade de ~25–30 km: os 5 bairros caem na mesma célula → série histórica idêntica | Variação real por bairro só na medição recente (30d); para série histórica por bairro usar INMET ou ERA5-Land 9 km |

## Regras do CRIVO (Pipeline de Dados)

As regras reais de seleção e aceite para o aplicativo e pipeline estão em [`crivo/CRIVO.md`](crivo/CRIVO.md) (fato com fonte e data, nunca adjetivo; nunca inventar, arredondar para impacto ou atribuir veredito/nota ao imóvel; desconhecido ≠ zero; endereço/unidade nunca expostos como dado pessoal).

> **Nota de separação:** regras visuais de animação e números ilustrativos para roteiro de vídeo aplicam-se **apenas** às peças de apresentação em `motion/` e `docs/pitch/`, nunca aos dados do aplicativo nem às pesquisas de produto.
