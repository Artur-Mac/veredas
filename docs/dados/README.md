# Dados do VEREDA: evidência bruta

Cada dado é um **fato com fonte e data**, nunca um adjetivo.

**O que o app usa não vem daqui.** Os dados publicados são gerados por `scripts/dados/` e gravados em
`src/dados/recife/` (índice cadastral, camadas por prédio, crime por bairro, população do Censo, pista do aeroporto).
O ciclo de atualização está em `docs/aplicacao/RUNBOOK-ATUALIZACAO.md`. Esta pasta guarda evidência: saídas brutas de
coletas, fontes consultadas e pareceres, citadas pelos docs de execução e pela literatura.

## Estrutura (revista em 18/11/2026)

```
docs/dados/
├── raw/                               # saída bruta de coletas (não editar à mão)
│   ├── cadastro-municipal/            # Defesa Civil (CSVs 2021–2025), bairros GeoJSON, limites ESIG
│   ├── transporte/                    # GTFS (o ciclo de dados lê o gtfs.zip daqui)
│   ├── fontes-prioritarias-2026-11-14/ # Ideb, saúde, coleta, preservação, canais, ciclovias, energia, maré…
│   ├── alagamento-2026-11-15/, estrutura-2026-11-15/, preco-registro-2026-11-15/,
│   │   seguranca-2026-11-15/, sombra-2026-11-15/   # evidência das seis perguntas de moradia (15/11)
│   ├── precos/                        # FipeZAP (.xlsx) e ZAP por bairro; aluguel de mercado está adiado no hub
│   └── google-maps/, imoveis/, leiloes/, pesquisa-cientifica/, seguranca/   # do pipeline antigo; citados por docs
├── fontes/fontes.json                 # registro de fontes
├── crivo/CRIVO.md                     # regras de seleção e aceite de dados
├── literatura/                        # pareceres e avaliação do acervo
└── validacao-defesa-civil-gtfs.md
```

O pipeline exploratório de 11/11/2026 (`rodar-tudo.mjs`, scripts 01 a 13, e a pasta `processado/`) foi arquivado em
`ignorar/dados-pipeline-2026-11-11/` em 18/11/2026: o app não lia nada dele e o plano proíbe reaproveitar os resultados.
O cliente HTTP dele virou `scripts/dados/http.mjs`. Ver o `LEIA-ME.md` do arquivo para o que foi apagado.

## Corretas conhecidas

| Fonte | Correção | Motivo |
|---|---|---|
| GTFS Grande Recife | `s.lat - 0.75` | Coordenadas ~0.75° ao norte do real (verificado: "Terminal Residencial Boa Viagem" está em lat=-8.119 no GTFS, bairro real em -8.865) |
| ESIG UTM 19S | SR 31985 é UTM 17S; o real é UTM 19S (CM -33°) | Extent y 9098072–9122720 corresponde a lat ≈ -8.0 a -8.15; nossos bairros estão em -8.85 |
| Defesa Civil CSV | Bairro usa nomes sem acento ("Gracas" não "Graças") | Matching precisa normalizar ou comparar sem acento |
| FipeZAP xlsx | Recife = sheet53 (rId53) | 68 linhas, agregado por cidade — sem quebra por bairro no xlsx |
| Overpass API | overpass-api.de = 406, kumi = 429, mail.ru = 504/200 com dados esparsos | Todos os mirrors com limitação de capacidade ou dados incompletos para Recife |
| Open-Meteo ERA5 | grade de ~25–30 km: os 5 bairros caem na mesma célula → série histórica idêntica | Variação real por bairro só na medição recente (30d); para série histórica por bairro usar INMET ou ERA5-Land 9 km |

## Regras do CRIVO

As regras reais de seleção e aceite para o aplicativo e pipeline estão em [`crivo/CRIVO.md`](crivo/CRIVO.md) (fato com fonte e data, nunca adjetivo; nunca inventar, arredondar para impacto ou atribuir veredito/nota ao imóvel; desconhecido ≠ zero; endereço/unidade nunca expostos como dado pessoal).

> **Nota de separação:** regras visuais de animação e números ilustrativos para roteiro de vídeo aplicam-se **apenas** às peças de apresentação em `motion/` e `docs/pitch/`, nunca aos dados do aplicativo nem às pesquisas de produto.
