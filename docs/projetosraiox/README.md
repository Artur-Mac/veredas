# Projetos Raio-X — engenharia reversa de produto

**Data da coleta:** 17/11/2026
**Método:** navegação ao vivo nas páginas oficiais (site, pricing, metodologia, FAQ, docs de API) com o navegador real; extração de texto renderizado e de JSON-LD; leitura de sitemaps e páginas de cidade/bairro. Nenhum dado abaixo foi inventado: quando algo é inferência, está marcado **[inferência]**.

## Aviso sobre as abas

A aba com "as 10 pesquisas de soluções" **não estava compartilhada** com o agente no momento da execução. A única aba acessível era a conversa do Gemini ("Avaliação e Exploração de Projeto"). Portanto:

- As 7 plataformas citadas no notebook do Gemini foram investigadas: Mapa Sossego, Eli Report, CondoScan, Localize.city, First Street/Risk Factor, Walk Score, Place/OSPA.
- A instrução "não se limite àqueles, busque mais e mais" foi cumprida com **23 soluções adicionais** encontradas por conta própria, escolhidas por relevância direta para o VEREDA: Local Logic, HouseCanary, DataZap, Mashvisor, ClimateCheck, Shovels, NeighborhoodScout, HomeWiseDocs, HowLoud, TravelTime, Regrid, Zoneomics, Docket, Mapillary, Winker, ATTOM, Gridics, Symbium, ONR/SREI, Cherre, Jupiter Intelligence, Placer.ai, Ownwell.
- Se a aba das 10 pesquisas for liberada, os itens que não aparecerem aqui devem ser acrescentados como `app31_*`, `app32_*`, sem reescrever estes.

## Índice

| Arquivo | Solução | Eixo | Valor para o VEREDA |
|---|---|---|---|
| `app1_mapa_sossego.md` | Mapa Sossego | Ruído urbano aberto (BR) | Alto — inventário de fontes de ruído e comunicação sem dB |
| `app2_eli_report.md` | Eli Report | Due diligence documental de condomínio | Alto — checklist documental e previsão de rateio |
| `app3_condoscan.md` | CondoScan | Revisão documental com humano no loop | Alto — regras de red flag e garantia comercial |
| `app4_localize_city.md` | Localize.city | Inteligência de endereço (NYC) | Alto — "sua vista pode ser bloqueada" |
| `app5_first_street.md` | First Street / Risk Factor | Risco climático físico por imóvel | Médio — mecânica de editar o edifício |
| `app6_walk_score.md` | Walk Score | Caminhabilidade 0–100 | Alto — fórmula de score a pé e densidade de interseções |
| `app7_place_ospa.md` | Place / OSPA | Gêmeo digital urbano e legislação (BR) | Alto — citação de lei e fonte PE3D |
| `app8_local_logic.md` | Local Logic | Scores de localização 0–10 | Alto — modelo de acesso e canal MCP |
| `app9_housecanary.md` | HouseCanary | AVM e dados de imóvel (EUA) | Baixo — referência negativa de preço |
| `app10_datazap.md` | DataZap (Grupo OLX) | Inteligência de mercado (BR) | Médio — formato de boletim e velocidade de venda |
| `app11_mashvisor.md` | Mashvisor | Investimento em aluguel (EUA) | Médio — registro de regras por edifício |
| `app12_climatecheck.md` | ClimateCheck | Score climático percentílico | Médio — percentil e "o que muda o score" |
| `app13_shovels.md` | Shovels | Licenças e decisões de uso do solo | Alto — camada "decisão antes da licença" |
| `app14_neighborhoodscout.md` | NeighborhoodScout | Micro-vizinhança e busca multicritério | Médio — micro-área e busca não dominada |
| `app15_homewisedocs.md` | HomeWiseDocs | Entrega de documentos de condomínio | Alto — controle de documento faltante/vencido |
| `app16_howloud.md` | HowLoud (Soundscore) | Ruído com nota e sub-scores | Alto — decomposição por fonte sem dB |
| `app17_traveltime.md` | TravelTime | Isócronas e tempo multimodal | Alto — interseção de isócronas e superfície pré-computada |
| `app18_regrid.md` | Regrid | Dado de lote e zoneamento | Alto — vocabulário de ausência (`NZ`) |
| `app19_zoneomics.md` | Zoneomics / Bassett.ai | Zoneamento como dado | Alto — "o que dá para fazer aqui" |
| `app20_docket.md` | Docket | Documentos e certidões (BR) | Alto — delimita o escopo do VEREDA |
| `app21_mapillary.md` | Mapillary | Imagem de rua aberta | Médio — única via para destravar A27 |
| `app22_winker.md` | Winker | ERP de condomínio (BR) | Médio — onde o documento realmente está |
| `app23_attom.md` | ATTOM | Dado imobiliário + MCP (EUA) | Alto — página de inventário de dado e governança de MCP |
| `app24_gridics.md` | Gridics | Zoneamento por lote + 3D | Alto — ordem da tela de lote e simulador de capacidade |
| `app25_symbium.md` | Symbium | Conformidade de código automatizada | Alto — "veredito + fundamento + aritmética" |
| `app26_onr.md` | ONR / SREI | Registro eletrônico e CNM (BR) | Alto — segunda chave do imóvel |
| `app27_cherre.md` | Cherre | Modelo de dado universal | Alto — modelo canônico do VEREDA |
| `app28_jupiter.md` | Jupiter Intelligence | Risco climático de grau decisório | Médio — ficha de método por indicador |
| `app29_placer.md` | Placer.ai | Fluxo de pessoas | Médio — limiar mínimo de amostra |
| `app30_ownwell.md` | Ownwell | Contestação de imposto | Médio — isenção de IPTU e funil de 15 s |

## O que se repete em quase todas

1. **Um número, uma frase, uma fonte.** Toda solução madura entrega um score com rótulo em linguagem comum e uma linha de método. Nenhuma entrega só o número.
2. **Percentil, não valor absoluto.** ClimateCheck, NeighborhoodScout e Local Logic comparam contra a área de cobertura, não contra uma escala universal. O VEREDA já faz isso em "Comparado com o bairro".
3. **Profundidade atrás do toque.** Localize.city e Mapa Sossego mostram a consequência primeiro e o detalhe no segundo toque. É a mesma regra de "A rua" no VEREDA.
4. **Documento com data de validade.** Eli Report, CondoScan e HomeWiseDocs tratam documento como objeto com emissor, data e prazo — não como PDF solto.
5. **Quem paga é quem tem repetição.** Comprador compra uma vez; corretor, advogado, gestor e gestor de fundo compram todo mês. Isso confirma a hipótese V4 do `market-analysis.md`.
6. **A ausência é dado.** Regrid (`NZ`), Zoneomics (Houston com 1 distrito) e Placer (limiar de 50 dispositivos) publicam o que **não** têm. O VEREDA hoje transforma toda lacuna em "sem leitura".
7. **Justificativa citável, não conclusão.** Symbium, Gridics e Zoneomics acompanham cada veredito com artigo, seção e cálculo. É o oposto de "a IA disse".
8. **Documentação de método como produto.** Jupiter vende o `MRM Accelerator`; ATTOM publica a *Table of Data Elements*; Cherre declara o que não treina. O número sem ficha de método não é vendável.
9. **Termo de responsabilidade explícito.** Docket ("não somos órgão do governo") e Mapa ONR ("não nos responsabilizamos pelo dado de terceiro nem pelas decisões") transformaram disclaimer em requisito de produto.

## Restrições do VEREDA que estes dossiês respeitam

- Sem dB(A) por andar/fachada e sem ruído de aproximação de aeroporto (`FEATURE-REGISTER.md`, decisão de 15/11/2026).
- Sem faixa de preço externa e sem avaliação (A21/A31 adiados).
- Sem previsão de alagamento (A30 rejeitado) — só histórico e evento registrado.
- Sem extração por IA de imagem de rua ou de anúncio (A27/A28 adiados).
- Sem telemetria; rotina e perfil ficam no dispositivo.
- Sem correção compartilhada/contas/sync (A36 adiado).
