# 00 — Síntese e backlog priorizado

**Data:** 17/11/2026 (atualizado após a terceira leva de pesquisa)
**Base:** 30 dossiês em `docs/projetosraiox/`, cruzados com `docs/aplicacao/FEATURE-REGISTER.md`, `docs/aplicacao/VEREDA-APPLICATION-PLAN.md` e `docs/negocio/vereda/01-discovery/market-analysis.md`.

Este arquivo não substitui os dossiês; ele ordena o que fazer com eles. A coluna **ID** usa os identificadores **já existentes no plano** (A20–A40, `DiaADia`, `Entorno`, `MapaDoLote`…) para não criar taxonomia paralela. A coluna **#** é só a numeração desta síntese (R1…R50) e não é um identificador de produto.

## 1. O que os 30 produtos ensinam em conjunto

| Padrão | Quem faz | O VEREDA já tem? |
|---|---|---|
| Número + rótulo em linguagem comum + fonte | Mapa Sossego, Walk Score, Local Logic, HowLoud | parcial (falta o rótulo) |
| Percentil relativo à área, dito como percentil | ClimateCheck, NeighborhoodScout, ATTOM | sim no cálculo, não no texto |
| Consequência primeiro, detalhe no segundo toque | Localize, Mapa Sossego | sim (`FichaViva`, `ARua`) |
| Documento com emissor, data e validade | Eli, CondoScan, HomeWiseDocs, Docket | **não** |
| Score 0–10 em vez de 0–100 | Local Logic, HowLoud | não |
| Decompor a nota por causa | **HowLoud** | **não** |
| "Editar o edifício e ver a consequência" | First Street, Gridics | parcial (`SimuladorDaUnidade`) |
| Decisão antes da licença | Shovels | **não** |
| Ausência confirmada ≠ cobertura faltante | **Regrid (`NZ`)**, Zoneomics, Placer | **não** |
| Escada de relatório (brief → summary → full → certificado) | Zoneomics, Eli, Gridics | só dois degraus |
| Servir o dado ao agente (MCP) | Local Logic, Regrid, ATTOM | **não** |
| Justificativa citável com artigo e cálculo | **Symbium, Gridics** | **não** |
| Inventário público de dado ("o que existe") | **ATTOM, ONR** | **não** |
| Ficha de método por número | **Jupiter, ATTOM** | **não** |
| Duas chaves de identificação do imóvel | **ONR (CNM) + cadastro municipal** | só a municipal |
| Limiar mínimo de amostra declarado | **Placer** | não (mínimo 5, não escrito) |
| Previsão de preço | HouseCanary, DataZap, Mashvisor, NeighborhoodScout, ATTOM | **decisão: não fazer** |

## 2. As quatro conclusões que mudaram com a pesquisa

**1. O bloqueio de ruído tem solução.** O VEREDA parou em "não publicamos dB". HowLoud e Local Logic mostram que o mercado sério **não publica dB e ainda assim entrega a informação**: decompõe a nota por **fonte** (tráfego, local, aéreo) com **rótulo em palavra**. Isso desbloqueia a tela mais pedida do produto sem violar a decisão de 15/11/2026.

**2. A camada operacional de documentos no Brasil já tem dono.** Docket tem **35 mil órgãos conectados**, IA treinada em **100 mil documentos** e clientes bancários. Winker tem o ERP onde a ata e a prestação de contas vivem. Construir isso seria chegar atrás. A posição correta do VEREDA é **depois do documento**: ler, cruzar com o lugar e decidir.

**3. O imóvel tem duas chaves, e o produto tem de dizer qual usou.** O ONR padronizou o **CNM** (nacional, registral) e o Recife usa o **DSQFL** (municipal, fiscal). Nenhuma cobre a outra. Dossiê e pacote que não declaram a chave perdem a discussão de identidade — e é essa linha que cria o gancho para o usuário trazer a matrícula que o `LeitorDeAta` lê.

**4. O método é o produto.** Jupiter vende documentação de validação; ATTOM publica a tabela de elementos de dado; Cherre declara o que não treina; Placer publica o limiar de 50 dispositivos. Nenhum deles vende número solto. O VEREDA vende leitura — e leitura sem ficha de método é opinião.

## 3. Grupo A — sem dado novo, alto valor (fazer primeiro)

| # | Item | De onde veio | ID | Esforço | Por que agora |
|---|---|---|---|---|---|
| R1 | **"Sua vista pode ser bloqueada"**: obra licenciada + altura + cone da fachada | Localize (`app4`), HouseCanary (`app9`) | `Entorno`/`MapaDoLote` | médio | Usa `obras`, `lotes`, `pavimentos` e o simulador que já existem |
| R2 | **Pacote do imóvel com 3 estados** (recebido / faltando / vencido) + validade por tipo | HomeWiseDocs (`app15`), Eli (`app2`), Docket (`app20`) | `A34` | médio | Fecha o buraco operacional do `LeitorDeAta` |
| R3 | **Checklist "o que falta"** e intake de prioridades antes da leitura | Eli (`app2`), CondoScan (`app3`) | `A34` | pequeno | O leitor lê o que veio; não diz o que não veio |
| R4 | **8 regras de red flag** com trecho e página | CondoScan (`app3`) | `A34` | médio | Transforma fato extraído em sinal |
| R5 | **Calculadora de fundo de reserva / rateio** | Eli (`app2`) | `A34` | pequeno | Aritmética sobre documento do usuário, no dispositivo |
| R6 | **Cartão de 6 scores 0–10** (a pé, transporte, tranquilidade, vida na rua, verde, essenciais) | Local Logic (`app8`), Walk Score (`app6`) | `Placar`/`A23` | médio | Escala única comparável sem inventar dado |
| R7 | **Nota a pé 0–100 explicável** com pesos publicados e decaimento em minutos | Walk Score (`app6`) | `DiaADia` | médio | O `DiaADia` já mede; falta normalizar |
| R8 | **Densidade de interseção e comprimento de quadra** como penalidade e como frase | Walk Score (`app6`) | `ARua` | pequeno | Dado de rede já existe |
| R9 | **Ampliar inventário de fontes de ruído** (estádio, terminal, ferrovia, feira, templo, zona industrial) — sem dB | Mapa Sossego (`app1`) | `Noite` | 1 ciclo | OSM já é usado; só amplia a lista |
| R10 | **Decompor o ruído por tipo de fonte, com rótulo em palavra** ("Forte / Moderado / Calmo") | **HowLoud (`app16`)** | `Noite`, `SimuladorDaUnidade` | pequeno | É o que destrava a tela sem dB |
| R11 | **Frase de consequência por face** no simulador (frente vs. fundo), sem dB | Mapa Sossego (`app1`) | `SimuladorDaUnidade` | pequeno | O 3×3 já existe |
| R12 | **Simulador editável** (andar, face, pavimentos, recuo) com recálculo imediato | First Street (`app5`), Symbium (`app25`) | `SimuladorDaUnidade` | pequeno-médio | Transforma ficha em ferramenta |
| R13 | **Modo "com as obras licenciadas"** no `MapaDoLote` 2.5D | Localize (`app4`) | `MapaDoLote` | médio | Mesma cena, volume tracejado |
| R14 | **Nomear o percentil** em todo indicador comparativo | ClimateCheck (`app12`) | `Indicadores` | pequeno | Protege contra leitura de medição |
| R15 | **Decomposição de cada indicador** ao toque | ClimateCheck (`app12`) | `Indicadores` | médio | "Por que este número" |
| R16 | **Comparação por setor censitário** (com N mínimo e fallback para bairro) | NeighborhoodScout (`app14`), ATTOM (`app23`) | `Indicadores` | médio | Censo 2022 já é usado |
| R17 | **Três estados de ausência**: "não se aplica" / "sem leitura publicada" / "sem ocorrência no período" | **Regrid (`NZ`) `app18`, Zoneomics `app19`, Placer `app29`** | `coberturaDasCamadas` | pequeno | Hoje tudo vira "sem leitura"; é impreciso |
| R18 | **Versão do schema e da camada na tela** (data + hash curto) | First Street (`app5`), Cherre (`app27`) | `coberturaDasCamadas` | pequeno | Manifesto já existe |
| R19 | **Tela de camadas** (o que existe, o que não, de quando) | OSPA (`app7`), HowLoud (`app16`) | `coberturaDasCamadas` | pequeno | Responde "por que não tem aqui" |
| R20 | **Linha do tempo unificada do lote** (licença → obra → vistoria → laudo → reparo) | Shovels (`app13`) | `A34` | médio | Hoje está em duas telas |
| R21 | **Tipificação determinística da licença** (10–15 tipos por palavra-chave) | Shovels (`app13`), Symbium (`app25`) | `Entorno` | pequeno-médio | O pino deixa de dizer "obra" |
| R22 | **Score de privacidade geométrico** (distância à janela do vizinho) | HouseCanary (`app9`) | `MapaDoLote` | pequeno | Geometria de lote já existe |
| R23 | **Roteiro de pedido ao síndico — 3 perguntas fechadas** | CondoScan (`app3`), **Winker (`app22`)** | `A34` | pequeno | Lista de 12 documentos o síndico ignora; 3 perguntas ele responde |
| R24 | **Link do pacote por hash** (sem conta, sem servidor) | HomeWiseDocs (`app15`) | `Pacote`/`Sala` | pequeno | Reusa o padrão `#s=` |
| R25 | **Linha do tempo da rua** (alagamento, obras, construção no mesmo eixo) | ClimateCheck (`app12`), Mapillary (`app21`) | `ARua` | pequeno-médio | Dado já no `EPOCH-TRACKER` |
| R26 | **Regra "seção vazia aparece"** explícita no dossiê | NeighborhoodScout (`app14`) | `Dossiê` | pequeno | Já é prática; falta regra escrita |
| R27 | **Radar do pré-contrato** (boletim numerado, sem preço) | DataZap (`app10`) | — | pequeno-médio | Autoridade sem valuation |
| R28 | **Página por bairro** gerada do índice | CondoScan (`app3`), Mapa Sossego (`app1`), ATTOM (`app23`) | — | médio | 72 páginas, dado já existe |
| R29 | **Servidor MCP de leitura** das camadas | Local Logic (`app8`), Regrid (`app18`), **ATTOM (`app23`)** | `A38` adjacente | médio | Canal de distribuição sem app |
| R30 | **Summary Report** de 2–4 páginas (degrau que falta entre dossiê e pacote) | Zoneomics (`app19`) | `Pacote` | pequeno-médio | O produto vendável sem responsável técnico |
| R31 | **Schema de matrícula** no `LeitorDeAta` (restrições, gravames, positivo/negativo, dívida, proprietário, histórico) | **Docket (`app20`)** | `A34` | pequeno-médio | Torna o resultado estruturado e comparável |
| R32 | **Disclaimer fixo de não-vinculação** no dossiê e no pacote | Docket (`app20`), **ONR (`app26`)** | `Pacote` | pequeno | Padrão de compliance do setor |
| R33 | **Interseção de isócronas** (casa A × destino B) | **TravelTime (`app17`)** | `A24` | médio | Resolve "e para ele?" com dado próprio |
| R34 | **Documento pendente ao lado do custo mensal** | Winker (`app22`) | `Custo` | pequeno | Onde o usuário já olha todo mês |
| R35 | **Busca invertida por atributo de lote** (área, gabarito) | Zoneomics (`app19`) | `A23` | médio | Serve a quem quer construir |
| R36 | **Auditoria de escala** (uma escala só, em todo lugar) | HowLoud (`app16`) | `Placar` | pequeno | O próprio HowLoud tem duas escalas no site |
| R37 | **Página `Dados`**: tabela de elementos (camada, granularidade, fonte, data, cobertura) | **ATTOM (`app23`)**, ONR (`app26`) | `coberturaDasCamadas` | pequeno | O VEREDA tem 2,3 GB e nenhum inventário público |
| R38 | **Inverter a ordem da tela de lote**: capacidade → terreno → edificação existente | **Gridics (`app24`)** | `MapaDoLote` | pequeno | Uma linha de código, o maior efeito de leitura |
| R39 | **Área registrada vs. área geométrica, lado a lado com a diferença** | **Gridics (`app24`)** | `MapaDoLote`/`Custo` | pequeno | Resolve a divergência cadastral antes da discussão |
| R40 | **"Lote de esquina" como campo de ficha** | **Gridics (`app24`)** | `MapaDoLote` | pequeno | Muda recuo e testada; o comprador sabe que é esquina |
| R41 | **"Veredito + fundamento + aritmética"** em toda afirmação de zoneamento | **Symbium (`app25`)**, Gridics (`app24`) | `MapaDoLote`, `A34` | pequeno | É redação; substitui "sem leitura" por artigo citado |
| R42 | **Duas chaves na identificação**: DSQFL + CNM/matrícula, com o que cada uma não cobre | **ONR (`app26`)** | `Dossiê`/`Pacote` | pequeno | Impede confusão com certidão e cria gancho para a matrícula |
| R43 | **Modelo canônico de dado** (8 entidades) e **versão de schema** por camada | **Cherre (`app27`)** | `coberturaDasCamadas` | pequeno-médio | Sem isso cada tela inventa vocabulário |
| R44 | **Ficha de método de 6 campos** por indicador | **Jupiter (`app28`)**, ATTOM (`app23`) | `Indicadores` | pequeno-médio | Número sem método é opinião |
| R45 | **Bloco "o que fazer com isso"** (2–3 ações concretas) ao fim de cada consequência | **Jupiter (`app28`)** | `Dossiê` | pequeno | Hoje a maioria das telas para no fato |
| R46 | **Checklist de isenção de IPTU** (fato e documento, sem valuation) | **Ownwell (`app30`)** | `Custo` | pequeno-médio | Valor real e permitido: é direito, não avaliação |
| R47 | **`Custo` em 15 segundos**: um campo, um número, detalhe depois | **Ownwell (`app30`)** | `Custo` | pequeno-médio | Número antes de cadastro e de formulário |
| R48 | **Limiar mínimo de amostra escrito** (10 no caderno, 50 se envolver pessoas) + cláusula "sem conta, sem sync, sem perfil" | **Placer (`app29`)**, Cherre (`app27`) | `Sala`, `Custo` | pequeno | Resolve objeção de privacidade antes de existir |
| R49 | **Vida na rua como proxy declarado** (comércio, mistura, horário, frente ativa, olhos na rua) | **Placer (`app29`)** | `Placar` | médio | Dado aberto, sem painel de dispositivos |
| R50 | **Página de qualidade das leituras** (taxa de acerto por tipo de extração) | **Ownwell (`app30`)** | `A34` | pequeno | Publicar onde o produto erra sustenta a postura |

## 4. Grupo B — exige aquisição de dado novo

| # | Item | Fonte | ID | Esforço | Risco |
|---|---|---|---|---|---|
| B1 | **"Pedido em análise"**: licença requerida, até 18 meses antes da aprovação | DOM Recife, processos, conselhos | `Entorno` | **grande** | Scraping frágil; requer `A37` maduro |
| B2 | **PE3D (MDS e MDT)** para volume construído e gabarito observado | `srhs.pe.gov.br`, público e gratuito | destrava "potencial de vizinho" | **grande** | Volume e processamento |
| B3 | **Leitura determinística da LPUOS por zona** com artigo e parágrafo | texto da lei | `A34`/`Entorno` | médio | Revisão jurídica |
| B4 | **Prazos de validade por tipo de documento** | cartórios, Bombeiros, prática | `A34` | pequeno-médio | Revisão com especialista |
| B5 | **Medir cobertura do Mapillary nas seis áreas** | API Mapillary | `A27` | **pequeno — fazer antes de qualquer plano** | Se < 30%, `A27` continua adiado |
| B6 | **Superfície de tempo pré-computada** por célula/setor e faixa horária | GTFS + rede (já no repo) | `Rotina` | médio-grande | Custo de pipeline; ganho de bateria no aparelho |
| B7 | **Isenções de IPTU por exercício** (critérios, faixa, prazo, formulário) | legislação municipal e portal da prefeitura | `Custo` | pequeno | Muda a cada exercício; precisa de data |
| B8 | **Medir a taxa de acerto das leituras** do `LeitorDeAta` por tipo de campo | amostra rotulada internamente | `A34` | pequeno-médio | Exige conjunto de avaliação; sem ele, R50 é chute |

**B1 continua sendo o item de maior impacto.** É o único que **antecipa** informação — todos os outros organizam o que já se sabe. **B5 é o mais barato de todos e evita trabalho inútil**; deve ser feito antes de qualquer discussão sobre imagem de rua. **B8 é pré-requisito de R50**: sem medir, a página de qualidade seria alegação.

## 5. Grupo C — registrar, não fazer (bloqueado por decisão)

| Item | De onde | Por que não agora |
|---|---|---|
| Regras por edifício agregadas (temporada, animal, obra) | Mashvisor (`app11`) | Depende de `A36` (correções compartilhadas), adiado |
| Benchmark de taxa condominial com base externa | Eli (`app2`), Winker (`app22`) | Base é privada de terceiro; custo e LGPD não se pagam |
| Score de condomínio em anúncio | Eli (`app2`) | Cria incentivo a nota boa e vira veredito |
| Previsão de rateio com projeção | Eli (`app2`) | Só a aritmética sobre documento existente |
| Chat livre sobre legislação | OSPA (`app7`), Zoneomics (`app19`) | Só leitura determinística com citação |
| Tokenização imobiliária | ONR (`app26`) | Sem base jurídica madura para o comprador final |
| Score de vida na rua medido por fluxo | Placer (`app29`) | Exige painel de dispositivos; risco ético e legal |

## 6. Grupo D — rejeitado, com o motivo registrado

| Prática | Quem faz | Motivo |
|---|---|---|
| dB(A) por andar/fachada | Mapa Sossego (`app1`) | Sem medição calibrada no Recife (decisão 15/11/2026) |
| Ruído de corredor de aeroporto | Mapa Sossego, HowLoud | Decisão de produto + caso sensível em Recife |
| Faixa de preço externa / AVM | HouseCanary, DataZap, Mashvisor, NeighborhoodScout, **ATTOM** | `A21`/`A31` adiados; negócio separado |
| Score de risco futuro por imóvel | First Street, ClimateCheck, **Jupiter** | `A30` rejeitado; o produto trabalha com histórico |
| Nota de criminalidade | NeighborhoodScout, HouseCanary, Localize | Viés socioespacial; *branch* fora do main |
| Extração por IA de imagem/anúncio | Localize, HouseCanary, Mapillary | `A27`/`A28` adiados |
| Login, conta, sync | Eli, Localize, NeighborhoodScout, HomeWiseDocs, Cherre | `A36` adiado; privacidade no dispositivo |
| Emissão de certidão e matrícula | Docket (`app20`), ONR (`app26`) | 35 mil órgãos conectados; integração operacional e jurídica |
| ERP ou integração com administradora | Winker (`app22`) | Ciclo de venda longo e dependência de terceiro |
| Carta de zoneamento certificada | Zoneomics (`app19`), **Gridics (`app24`)** | Exige o município como emissor e responsável técnico |
| Emitir licença de obra | **Symbium (`app25`)** | Convênio com prefeitura e responsabilidade legal |
| Contestar IPTU ou avaliação | **Ownwell (`app30`)** | Exige avaliar valor e responder perante o fisco |
| Consulta de indisponibilidade por CPF | **ONR/CNIB (`app26`)** | Dado pessoal; o VEREDA orienta, não intermedeia |
| Painel de dispositivos móveis | **Placer (`app29`)** | Vigilância de localização, ainda que agregada |
| Depender de API de isócrona paga | TravelTime (`app17`) | Custo variável e dependência; o VEREDA calcula offline |
| Publicar imagem de rua como prova | Mapillary (`app21`) | Imagem não é laudo; publicar só o fato derivado |
| Publicar bulk de camada | **ATTOM (`app23`)** | O VEREDA entrega leitura, não dataset |

## 7. Ordem sugerida de execução

**Ciclo 0 — medição (1 dia):** B5 (cobertura Mapillary) e B8 (taxa de acerto atual do `LeitorDeAta`). Baratos e evitam meses de trabalho inútil.

**Ciclo 1 — fechar o dossiê e o vocabulário (Grupo A, itens pequenos):**
R3, R4, R5, R9, R10, R11, R14, R17, R18, R19, R21, R23, R26, R27, R31, R32, R34, R36, **R37, R38, R39, R40, R41, R42, R43, R44, R45, R48, R50**.
Tudo é redação, regra e componente. É o maior ganho por hora de todo o conjunto.
Os quatro de melhor retorno: **R10** (ruído sem dB), **R17** (três estados), **R41** (fundamento + aritmética) e **R44** (ficha de método).

**Ciclo 2 — as features novas de maior valor:** R1 (vista bloqueada), R2 (pacote com validade), R6/R7 (cartão de scores + nota a pé), R47 (custo em 15 s).

**Ciclo 3 — as médias:** R8, R12, R13, R15, R16, R20, R22, R24, R25, R28, R30, R33, R35, R46, R49.

**Ciclo 4 — as apostas:** B1 (pedido em análise), B2 (PE3D), B6 (superfície de tempo).

**Depois:** B3 (LPUOS), B4 (prazos), B7 (isenções), R29 (MCP).

## 8. Verificação

- [ ] Cada item do Grupo A foi conferido contra `FEATURE-REGISTER.md` e não colide com a lista "Not enabled".
- [ ] Nenhum item do Grupo A exige dado pessoal, telemetria ou servidor.
- [ ] Todo item que exibe número tem fonte, data, rótulo em linguagem comum e **ficha de método** (R44).
- [ ] Todo item que exibe documento tem emissor, data e estado de validade.
- [ ] Todo item que exibe ausência usa um dos três estados de R17.
- [ ] Todo item que afirma zoneamento usa o formato de R41 (veredito, artigo, aritmética).
- [ ] Todo item que identifica imóvel declara a chave usada (R42).
- [ ] Nenhum item usa IA generativa em conteúdo exibido ao usuário.
- [ ] Nenhum item depende de emissão de certidão, de ERP de condomínio ou de avaliação de valor.
- [ ] Nenhuma tela nova repete "sem leitura" onde caberia "não se aplica".
- [ ] Toda tela nova passa no critério "zero treinamento" (Symbium): responde o que é, de onde veio e o que fazer agora sem texto de ajuda.
