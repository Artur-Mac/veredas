# Mapa-base: referência (18/11/2026)

Material do planejamento do mapa-base (ruas, quadras, lotes e bairros nos mapas do app). O plano vive no hub: documento "Plano do mapa-base: ruas, quadras e bairros nos mapas (18/11/2026)" e tarefa "Mapa-base: ruas, quadras, lotes e bairros em todos os mapas".

| Arquivo | O que é |
|---|---|
| `PROMPT-SESSAO-NOTURNA.md` | Prompt para a sessão que implementa o plano orquestrando agentes |
| `modelo-visual.html` | Modelo aprovado: hoje × proposta, níveis por zoom, fases, pesos e limitações. Abre no navegador |
| `telas/hoje-*.png` | O app em 18/11/2026 (já com a correção do PR #4), 375 px |
| `telas/modelo-*.png` | A proposta, desenhada com dados reais |
| `recortes/janela-A-gaveta.geojson` | 450 × 400 m em volta do Golden Tower (índice 8001-216), EPSG:4326, propriedade `camada` |
| `recortes/janela-B-por-perto.geojson` | 1,6 × 1,4 km no mesmo centro |
| `pesos.json` | Pesos por camada (Boa Viagem, Torre, cidade) em vários formatos |
| `scripts/janelas.mjs` | Gera os recortes a partir dos GeoJSON do portal e do índice |
| `scripts/pesos.mjs` | Mede peso bruto, gzip e compacto |
| `scripts/qualidade.mjs`, `scripts/cobertura.mjs` | Checagens de qualidade (lote × quadra, quadra sem lote por bairro) |
| `scripts/densidade.cjs`, `scripts/bench.mjs` | Densidade de lotes por quadro e tempo de desenho no Chrome |
| `scripts/modelo.cjs`, `scripts/pagina.cjs` | Geram as vistas SVG e o `modelo-visual.html` |

Fontes: dados abertos da Prefeitura do Recife (dados.recife.pe.gov.br, dataset "Área urbana" e "Parques e praças"), licença ODbL. Os downloads brutos (cerca de 216 MB) não estão no repositório; os IDs dos recursos estão no prompt.

Os scripts são de medição, não do app. `qualidade.mjs`, `cobertura.mjs` e `janelas.mjs` usam `@turf/turf`, que não é dependência do projeto: instale numa pasta temporária para rodá-los. Alguns têm caminhos absolutos da máquina onde foram escritos.
