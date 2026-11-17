# Blueprint B2C — Inovação, Ciência Urbana, UX e Prompt de Evolução do VEREDA

**Data:** 15/11/2026  
**Escopo:** Teste profundo da primeira hipótese B2C do VEREDA, assimilação crítica de benchmarks vivos (Mapa Sossego, MySide, Eli Report, HowLoud, ClimateCheck, OpenIgloo e referências globais), descoberta de novos dados e modelos de ciência urbana aplicáveis no Recife, redesenho da experiência anti-"dossiê estático" e **especificação técnica executável (prompt pronto)** para implementação no repositório `veredas/`.

**Premissas fixadas para este ciclo (cohorte inicial de testers):**
1. **Espinha dorsal preservada:** manter o núcleo construído — busca poderosa da localidade e histórico do prédio/imóvel para fazer quem busca ou chega em um lugar *"virar local em segundos"* — assimilando da filosofia *Buyer's Agent* (MySide / EUA) apenas o que multiplica valor B2C direto, sem inchar o app.
2. **Modo de jornada escolhido:** **Co-piloto digital guiado completo** (da triagem do anúncio/endereço -> leitura instantânea do prédio/rua -> visita ao vivo no imóvel -> comparação com contradições/custo real -> argumentos de contraproposta) **+ pacote exportável para especialista externo** (advogado imobiliário, vistoriador/engenheiro ou consultor humano) quando o usuário quiser segunda opinião.
3. **Sem atrito de monetização agora:** ignorar login, paywall, créditos e custos por enquanto; otimizar 100% para valor real, encantamento, clareza e retenção em testes com usuários reais. Criatividade acima de bloqueios regulatórios neste ciclo (notas de adaptação jurídica ficam separadas ao final).
4. **Identidade e regra epistêmica do VEREDA:** preservar os tokens da marca (`#F2EBDD`, `#FFFFFF`, `#171717`, `#F47745`, `#B94E36`, `#2E5A85`; Fraunces, Plus Jakarta Sans, JetBrains Mono), o princípio `Desconhecido ≠ zero` e a regra anti-nota arbitrária (`src/dados/dossie/sintesesDaRua.ts`: zero score opaco 0–100, zero adjetivo/veredito sobre imóvel; traduzir toda escala comparativa em **unidades físicas reais, percentis transparentes, intervalos e fatos literais**).

---

## 1. Teste Profundo da Primeira Hipótese & Por Que o App Hoje Cansa

### 1.1 O estado atual verificado no código e métricas
- **Base atual (`docs/produto/status-vereda-2026-11-15.md`):** 6 bairros piloto (`Boa Viagem`, `Casa Forte`, `Graças`, `Espinheiro`, `Madalena` e Torre parcial), `2.825` edifícios piloto (de `7.206` em `72` bairros no índice municipal), bundle reduzido para `3,45 MB`, `1.593` testes Jest, `0` sessões de busca ativa pós-pivô.
- **Pivô vigente (`docs/negocio/01-PRODUTO-TESE-E-ESTADO-ATUAL.md`):** "A Comparação como centro", local-first, sem backend obrigatório.
- **Telas e módulos reais:**
  - `Explorar` ([`src/app/(abas)/index.tsx`](file:///home/v/Documents/vereda/veredas/src/app/(abas)/index.tsx))
  - `Dossiê` ([`src/app/(abas)/dossie.tsx`](file:///home/v/Documents/vereda/veredas/src/app/(abas)/dossie.tsx)): sub-abas `destaques`, `entorno`, `edificio`.
  - `Comparar` ([`src/app/(abas)/comparar.tsx`](file:///home/v/Documents/vereda/veredas/src/app/(abas)/comparar.tsx)): sub-abas `Custo`, `Espaço`, `Entorno`, `Rotina`, com `ResumoDaDecisao` e `PlacarDoPar` ([`src/componentes/comparar/placar.ts`](file:///home/v/Documents/vereda/veredas/src/componentes/comparar/placar.ts)).
  - `Visita` ([`src/app/(abas)/visita.tsx`](file:///home/v/Documents/vereda/veredas/src/app/(abas)/visita.tsx)): sub-abas `preparar`, `campo` ([`NoImovel.tsx`](file:///home/v/Documents/vereda/veredas/src/componentes/visita-v1/NoImovel.tsx)), `resumo`.
  - Módulos prontos e subaproveitados/órfãos: [`src/dados/estrutura/linhaDoTempo.ts`](file:///home/v/Documents/vereda/veredas/src/dados/estrutura/linhaDoTempo.ts) (`lerLinhaDoTempo`, **0 imports em UI**), [`src/dados/tiposDeValor.ts`](file:///home/v/Documents/vereda/veredas/src/dados/tiposDeValor.ts) (**órfão**), [`src/dados/negociacao.ts`](file:///home/v/Documents/vereda/veredas/src/dados/negociacao.ts).

### 1.2 Onde a primeira hipótese acerta e onde quebra para um usuário B2C real
A tese original — *eliminar assimetria de informação entre corretor/anúncio e comprador/inquilino* — é fortíssima. Mas **a execução atual falha na primeira impressão e na cadência de uso**:

1. **Cold-start na porta de entrada (`Explorar`):** Ao abrir [`index.tsx`](file:///home/v/Documents/vereda/veredas/src/app/(abas)/index.tsx#L114-L178), o usuário dá de cara com `"Auditar novo anúncio"` e uma caixa vazia pedindo para colar um link do ZAP/VivaReal/QuintoAndar/OLX (ou preencher manualmente). Quem está na rua olhando um prédio com placa na portaria, ou quem quer primeiro testar o poder do app no seu bairro atual ou no prédio de um amigo, **não tem como buscar por endereço, nome do edifício ou mapa em 1 toque**. Sem exemplo vivo clicável no primeiro segundo, a taxa de abandono antes do primeiro dossiê dispara.
2. **Dados mais impressionantes presos em gavetas fechadas (`Entorno.tsx`):**
   - `camadas-ambientais.json` (`308 KB`: calor de superfície Landsat 100m, áreas verdes/árvores tombadas, Copernicus DEM + canais/rios, arboviroses 2023–2025, ruído de corredores) e `censo-renda-setores.json` (`111 KB`) estão enterrados em sub-seções de [`Entorno.tsx`](file:///home/v/Documents/vereda/veredas/src/componentes/dossie-v1/Entorno.tsx#L393-L406) — e o retrato do Censo exige clicar em `"Ver renda e perfil do setor (Censo)"` (`verRenda = false` por padrão).
   - **Mais grave:** nada de calor, ruído dia/noite, alagamento ou risco arboviral entra ainda no resumo rápido do topo do Dossiê nem no [`placarDoPar`](file:///home/v/Documents/vereda/veredas/src/componentes/comparar/placar.ts) do `Comparar` (exceto pontos de atenção agregados de rua).
3. **Serviços sem nome e distância em linha reta:** `servicos-cnefe.json` (`152 KB`) só expõe Ensino, Saúde e Religioso dentro de acordeões fechados em `Servicos.tsx`, omitindo o `DSC_ESTABELECIMENTO` real e usando linha reta — ignorando o que de fato muda a vida na quadra no Recife (um bar/adega de calçada colado no prédio, uma oficina, uma farmácia 24h a 3 min andando pela calçada).
4. **"Onde mais procurar" chega tarde demais:** [`procura.ts`](file:///home/v/Documents/vereda/veredas/src/dados/recife/procura.ts) só aparece dentro de `Comparar -> Rotina -> ParaDecidir` **depois** de o usuário já ter cadastrado destino e comparado 2 imóveis. Para quem tem 1 alvo ou quer explorar ruas similares mais baratas/silenciosas, o recurso está invisível.
5. **Postura passiva ("enciclopédia estática" vs. "aliado ativo"):** O app entrega fatos honestos, mas **não encena o impacto na vida cotidiana** nem conduz o usuário até a mesa de negociação com fluidez emocional:
   - Na aba `Visita`, [`NoImovel.tsx`](file:///home/v/Documents/vereda/veredas/src/componentes/visita-v1/NoImovel.tsx#L73-L76) ainda diz *"É a sua percepção: o Vereda não mede decibéis"* em vez de aproveitar o microfone do navegador/celular na hora da visita ou contrastar com estimativa dia/noite;
   - Não existe espaço compartilhado para **decisão em casal/família** (hoje as pessoas tiram print e discutem num caos de mensagens no WhatsApp);
   - A história estrutural e documental do prédio ([`linhaDoTempo.ts`](file:///home/v/Documents/vereda/veredas/src/dados/estrutura/linhaDoTempo.ts)) existe pronta no código, testada, mas completamente desconectada da tela;
   - E não há **saída limpa de co-piloto**: montar uma leitura de atas/balancete (PDF do condomínio que o corretor manda pelo WhatsApp) nem gerar um **Dossiê Exportável para Especialista** (advogado/vistoriador).

---

## 2. O Que Assimilar da Filosofia *Buyer's Agent* (MySide) e dos Benchmarks Vivos

As sessões diretas no navegador (Vivaldi via DevTools MCP) sobre **Mapa Sossego** (testado ao vivo em *Avenida Boa Viagem, Recife - PE*), **MySide**, **Eli Report**, **HowLoud**, **ClimateCheck** e **OpenIgloo**, somadas a referências globais (**HouseSigma**, **RealScout**, **Redfin Tour Insights**, **Homebot**, **CondoBlackBook**), revelam exatamente o que gera valor B2C imediato — e o que o VEREDA deve evitar copiar às cegas.

### 2.1 Matriz de Assimilação Seletiva (com adaptação às regras do VEREDA)

| Referência observada | Mecânica vencedora observada na tela | Por que gera valor / prende o usuário | Como o VEREDA deve assimilar (sem quebrar zero-score / foco) |
| :--- | :--- | :--- | :--- |
| **Mapa Sossego** *(teste ao vivo em Av. Boa Viagem, Recife)* | **Simulador interativo "Seu Imóvel"** (`Casa / Apartamento` + seletor de `Andar` + `Rosa dos Ventos 3×3` de orientação das janelas); **DIA vs. NOITE** lado a lado vs. referência `ABNT NBR 10151` (`55 / 50 dB(A)`); **Fontes nominais com distância exata** (`Av. Boa Viagem 0 m`, `Aeroporto 1,9 km`, `bar 180 m`, `168 hab/ha`); **Feedback 1-clique** *"A nota bate com a realidade?" (`Bate / Não bate`)*. | Transforma um número estático num brinquedo útil em 5 segundos: o comprador testa *"e se o apê for no 12º andar de fundos (face Oeste) em vez do 1º andar de frente?"* e entende a física (`-12 dB` na fachada oposta). | Criar o **"Simulador da Unidade" (Andar × Orientação 3×3)** no topo do Dossiê unindo **Ruído estimado em dB(A) (Dia/Noite vs. NBR 10151)** + **Sol nas fachadas** + **Brisa Alísia SE (110°–160°)**. Em vez de um score `24/100`, exibir os números físicos diretos (`~77 dB(A) dia · ~70 dB(A) noite · +22 dB acima da NBR 10151`) e o botão anônimo `Bate com a realidade? (Sim / Não)` para calibrar os dados de rua do Recife. |
| **MySide** *(`/sobre-nos`, fichas e ferramentas)* | Enquadramento explícito **"Do seu lado vs. Corretor tradicional"** (*Chefe: VOCÊ*); triagem em 1 toque direto no card (**`ignorar / favoritar / anotar`**); alerta **`Avise-me se o preço mudar`**; calculadoras práticas de custo de compra (**ITBI + escritura + cartório**, fluxo de pagamento/financiamento); distâncias concretas a âncoras reais (*"600 m da Beira-Mar"*). | Dá alívio emocional (*"não estão tentando me empurrar o imóvel que paga maior comissão"*) e transforma pesquisa solta em funil organizado. **Ponto cego da MySide descoberto no FAQ:** ela é registrada com CRECI e ganha ~5% da construtora/vendedor, limitando o foco a imóveis novos/na planta. | O VEREDA supera a MySide porque é **realmente agnóstico** (audita qualquer imóvel usado ou novo, inclusive apontando quando o preço está acima do ITBI histórico do prédio ou quando há risco construtivo/alagamento). Incorporar a **triagem rápida (`Favoritar / Anotar / Descartar`)** na Home, o **simulador completo de Custo de Entrada + Cartório + ITBI** e o **alerta local de alteração de preço/anúncio** + linguagem clara *"0% comissão de venda"*. |
| **Eli Report** *(`/products`, `/pricing-plans`, `/widget`)* | **Ingestão de PDFs chatos do condomínio** (atas de AGO/AGE, balancete, convenção, regimento interno) -> **Red Flags** automáticos (vazamentos, processos, rateios/obras votadas, inadimplência) + **Resumo de Regras de Vida** (pets, Airbnb, reformas) + **Revisão *Split-Screen*** (resumo à esquerda, página original grifada à direita) + **Projeção de Cota Extra** + postura jurídica *"Extraio fatos literais (verbatim), não emito pareceres"*. | Resolve o maior ponto cego brasileiro na compra de usados: descobrir *depois de assinar* que o prédio tem rateio de R$ 2.000/mês de fachada ou proibição de pets/short-stay. A extração literal blinda juridicamente o app. | Evoluir [`PropostasBalancete`](file:///home/v/Documents/vereda/veredas/src/dados/propostasBalancete.ts) e [`DocumentosDoEdificio`](file:///home/v/Documents/vereda/veredas/src/app/detalhes.tsx) para um **Leitor de Atas e Balancete (PDF/Texto colado)** usando o padrão **Fato Literal + Página/Trecho de Origem (*Split-Screen*)**: extrair automaticamente (a) regra de pets/Airbnb/obra, (b) rateios extras e ações trabalhistas/cíveis citadas em ata, (c) taxa condominial/m² vs. edifícios da mesma idade e porte no bairro (**Bomba-Relógio Condominial**). |
| **ClimateCheck** *(`/report` Miami Beach)* | **Anéis visuais em grade** no primeiro dobra (zero muro de texto) + **Tradução temporal concreta** (*"Em 1990: ~7 dias/ano >33°C -> Em 2050: ~88 dias/ano"* e *"120 dias/ano de alagamento por maré alta"*). | O cérebro humano ignora "risco 0,78", mas reage na hora quando lê quantos dias por ano a garagem ou a rua sofre com maré alta + chuva. | Sem criar nota 1–100 opaca, adotar a **tradução temporal e física concreta no Recife**: ex. *"Cota +1,8 m · 4 ocorrências da Defesa Civil a 250 m · abaixo da maré de sizígia máxima (2,7 m) em chuva forte"* e *"Calor de superfície +2,6 °C acima da média do bairro"*, organizados em micro-cartões escaneáveis no topo. |
| **OpenIgloo** *(`/unit/...` NYC)* | Card fixo **"About the building"** no topo da ficha com **5 micro-fatos públicos escaneáveis** (`34 unidades · 7 andares · 2 violações · 1 litígio · histórico de preço`) antes da descrição longa. | Faz o endereço virar uma **entidade permanente de reputação pública**, não um anúncio descartável que some quando o corretor pausa o link. | Tornar cada um dos **2.825 edifícios piloto (e 7.206 no índice municipal)** uma **Ficha Viva do Prédio** acessível direto pela Home — com linha do tempo estrutural ([`linhaDoTempo.ts`](file:///home/v/Documents/vereda/veredas/src/dados/estrutura/linhaDoTempo.ts)), transações históricas de ITBI no prédio, idade, unidades e relatos verificáveis. |
| **HowLoud / HouseSigma / RealScout / Redfin / Homebot** | - **HowLoud:** separar explicitamente fontes (`Trânsito`, `Aeroportos`, `Locais`, `Relatos`) no mapa.<br>- **HouseSigma:** mostrar preço de venda real registrado vs. pedido do anúncio.<br>- **RealScout:** espaço compartilhado de decisão para co-compradores/casal.<br>- **Redfin Tour Insights:** captura guiada no imóvel.<br>- **Homebot:** radar contínuo do endereço após o salvamento. | Aumenta drasticamente o retorno ao app (ciclo de busca no Brasil dura 3–9 meses) e torna a contraproposta irrefutável com base em registros reais. | - **ITBI Real vs. Pedido:** exibir transações reais do próprio prédio (`ITBI 2016–2026`, já indexado no repo!) junto ao preço anunciado.<br>- **Sala de Decisão Compartilhada:** exportar/sincronizar link/QR local-first do `Comparar` onde cônjuge/sócio vota e comenta em 2 imóveis.<br>- **Radar do Endereço / Modo Morador:** checar se saiu licença de obra grande no lote vizinho ou alerta de chuva/maré na rua salva. |

---

## 3. Auditoria dos Dados: O Que Já Existe (Subexplorado), Lições Negativas e Nova Ciência Urbana no Recife

### 3.1 Respeitando os Aprendizados Negativos do Repositório (Não Repetir Erros)
O documento [`01-PRODUTO-TESE-E-ESTADO-ATUAL.md`](file:///home/v/Documents/vereda/veredas/docs/negocio/01-PRODUTO-TESE-E-ESTADO-ATUAL.md) e [`status-vereda-2026-11-15.md`](file:///home/v/Documents/vereda/veredas/docs/produto/status-vereda-2026-11-15.md) registram 4 falhas empíricas já testadas que **qualquer evolução precisa respeitar**:
1. **5G por edifício (Anatel Mosaico):** `48/48` pontos testados no Recife caíram na mesma faixa `-90/-110 dBm`, logo **não discrimina prédios**. Uso válido: **azimute/distância até ERBs mais próximas** apenas como contexto complementar, mantendo o teste real em campo por cômodo em [`ConectividadeNoLocal`](file:///home/v/Documents/vereda/veredas/src/dados/conectividade.ts) + consulta de fibra.
2. **CoolWalk (rotas sombreadas automáticas `VE07`):** derrubado (`6/80` comparações robustas e `0/204` em Graças/Espinheiro) por falta de mapeamento completo de copas de árvores e marquises na rua. Não reintroduzir rota sombreada automática sem LiDAR `MDE - MDT` validado em campo.
3. **ML de alagamento `VE14` anterior (`7/17`):** perdeu para a regra histórica simples porque **faltavam um Modelo Digital de Terreno `bare-earth` (sem altura de prédios/árvores), a rede de drenagem real e séries pareadas de chuva + maré**. Como resolvemos abaixo, o **PE3D LiDAR 1 m** ataca exatamente essa lacuna técnica!
4. **GTFS é programado (`v2026.10.26`, `87.678` viagens):** não há GPS em tempo real do CTM/Grande Recife. Sempre rotular como *"horário programado / previsto em tabela"* nunca *"tempo real"* — e só usar velocidade real onde houver histórico (ex.: **CTTU**).

### 3.2 Mina de Ouro Já Dentro do Repo Hoje Escondida da UX
Antes de baixar qualquer byte externo, o app já possui dados capazes de transformar o valor B2C imediato:
- `src/dados/recife/camadas-ambientais.json` (`308 KB`): temperatura de superfície `Landsat 8/9 100m`, árvores tombadas/áreas verdes, Copernicus DEM + canais/rios ESIG, SINAN arboviroses (2023–2025), ruído de corredores. **Ação:** promover seus principais deltas para o topo do Dossiê e para o `Comparar`.
- `src/dados/recife/censo-renda-setores.json` (`111 KB`) + `censo_amostra` (`%` alugados no setor): destravar da opção oculta `verRenda = false` em `Entorno.tsx`, exibindo perfil de ocupação (ex.: proporção moradores proprietários vs. inquilinos — ótimo proxy de rotatividade da rua) e faixa de renda do entorno sem adjetivos.
- `src/dados/recife/servicos-cnefe.json` (`152 KB`) + base CNEFE (`737.511` endereços): hoje esconde `DSC_ESTABELECIMENTO` e usa distância em linha reta. Ao expor nomes reais e calcular distância real pela malha viária OSM/ESIG, revela exatamente *qual* mercado, farmácia ou padaria atende a pé.
- `ITBI 2016–2026` (`144.576` transações), `IPTU 2026` (`413.750` imóveis), `Licenciamento` (`39.067` processos), `Defesa Civil` (`886.263`), `Central 156` (`175.878`), `CTTU Sinistros` (`12.016`), `Iluminação` (`111.666`), `LUSE` (`49.924`): todos já indexados no ecossistema de pipelines de `veredas/`.
- `src/dados/recife/procura/*.json`: matriz de tempo de transporte público entre ruas piloto e bairros — hoje enterrada no fim da comparação, quando deveria ser uma **ferramenta de descoberta ativa logo na Home ("Onde mais procurar com seu trajeto")**.
- `src/dados/estrutura/linhaDoTempo.ts`: motor pronto para histórico estrutural (`chamado`, `vistoria`, `laudo_art_rrt`, `interdicao`, `reparo`, `liberacao`, `desabamento`) — ainda sem ligação na UI do Dossiê nem na Ficha do Prédio!

### 3.3 Novas Fontes Abertas Gratuitas para Recife (Baixo Esforço / Alto Poder Discriminante)
1. **PE3D (`pe3d.pe.gov.br` — Governo de PE):** Levantamento LiDAR aéreo gratuito de **1 m de resolução** cobrindo toda a RMR com **`MDT` (`bare-earth` real sem construções)** + **`MDS/MDE` (superfície com topos de edifícios e copas de árvores)** + ortofotos. É a chave mestra que resolve de uma só vez ventilação, sombra real, altura da vizinhança e a falha `bare-earth` que derrubou o `VE14`!
2. **ESIG Recife + SEDUL (`ZoneamentoRecife` LPUOS Lei 19.426/2025 + Outorga Onerosa + IEPs):** Coeficientes de aproveitamento máximo (`CA_max`), gabaritos, Imóveis Especiais de Preservação (IEPs) e processos recentes de Outorga Onerosa — mostra **onde ainda pode subir um espigão de 30 andares na quadra da frente**.
3. **Marinha do Brasil (CHM/DHN — Tábua de Marés do Porto do Recife) + CEMADEN PED API + INMET A301 + SEDEC Demandas Vivas (atraso 15 min):** Permite cruzar cota física do prédio com a **maré astronômica de sizígia (2,3 m a 2,8 m)** + volume de chuva recente e chamados reais da Defesa Civil.
4. **CNEFE 2022 completo (IBGE) filtrado por espécies 6 e 7:**
   - `COD_ESPECIE = 6` + `DSC_ESTABELECIMENTO` filtrando **estabelecimentos com potencial de ruído/fluxo noturno** (bares, distribuidoras/adegas, oficinas mecânicas, igrejas/templos, casas de shows, supermercados com doca) vs. conveniência diurna;
   - `COD_ESPECIE = 7`: imóveis **em construção ou reforma** no setor.
5. **CTTU Velocidade das Vias (intervalos de 15 min) + Sinistros:** Dá peso real de congestionamento nos horários de pico no trajeto casa-trabalho-escola, sem depender de suposições.
6. **Diário Oficial do Recife (DOM) + Portal de Consumidor.gov.br / ReclameAqui/TJPE (consulta por razão social da construtora/administradora quando o usuário informa):** Alimenta tanto [`linhaDoTempo.ts`](file:///home/v/Documents/vereda/veredas/src/dados/estrutura/linhaDoTempo.ts) quanto histórico objetivo da construtora em imóveis novos/na planta.

### 3.4 Seis Modelos de Ciência Urbana Computáveis em TypeScript (Sem Backend Pesado)

Todos os cálculos abaixo podem ser pré-processados por edifício no pipeline offline (`scripts/dados/...`, saindo em camadas JSON leve sob D036) e ajustados em tempo real no cliente pelo seletor **Andar × Orientação da Janela**:

#### 1) Brisa Alísia do Recife (`Ventilação & Conforto Térmico por Unidade`)
- **Problema real no Recife:** Apartamentos "nascentes" sem barreira à frente economizam milhares de reais em ar-condicionado; apartamentos bloqueados por torre colada a Sudeste viram estufas.
- **Ciência aplicável:** Em Recife, os ventos alísios sopram predominantemente do quadrante **Sudeste–Leste (`110°–160°`)**. Usando `H_edificacao = MDS - MDT` (do **PE3D 1 m**), calcula-se a **razão de bloqueio aerodinâmico (efeito esteira / *wake* até `5×H` a barlavento)** no setor angular `110°–160°` para a faixa de altura do andar selecionado (`andar × 3,0 m`), cruzado com a **temperatura de superfície Landsat 100 m** (`camadas-ambientais.json`).
- **Saída VEREDA (sem nota opaca):** *"No 8º andar voltado para Leste/SE: exposição livre ao vento sudeste (prédio vizinho mais baixo que sua cota de ~24 m); ilha de calor local -0,8 °C em relação à média do bairro."*

#### 2) Alagamento Composto *Bare-Earth* + Maré de Sizígia (Superando a falha `VE14`)
- **Por que `VE14` falhou antes e como corrigir:** Em planície fluviomarinha como o Recife (Boa Viagem, Capibaribe, Pina, Madalena, Graças), **a água não escoa apenas pela chuva — ela trava quando a chuva forte coincide com maré alta (> 2,3 m)**.
- **Ciência aplicável:** Combinar **cota `bare-earth` real (`MDT` PE3D 1 m, sem viés de telhado)** + índice **HAND (*Height Above Nearest Drainage*)** até canais/rios ESIG + histórico espacial **SEDEC/Defesa Civil + 156** + tábua de marés CHM.
- **Saída VEREDA (estilo ClimateCheck adaptado):** *"Terreno a +1,9 m sobre o canal próximo (MDT PE3D 1 m); maré de sizígia chega a ~2,7 m; 5 chamados registrados na rua em dias de chuva >50 mm (2022–2025). Garagem no subsolo ou térreo baixo exige checagem de comporta/bomba."*

#### 3) Cânion Acústico Urbano & Atenuação de Fachada (Modelo Mapa Sossego + Físico Maekawa)
- **Ciência aplicável:** Somatório energético em dB(A) das fontes locais (**vias ESIG/OSM**, **rotas de aproximação Aeroporto dos Guararapes**, **agrupamentos de bares/adegas/oficinas do CNEFE `COD_ESPECIE = 6`** com bônus noturno de aglomeração) + **atenuação geométrica por andar (`andar × 3 m`) e ângulo de fachada** (janelas para os fundos ganham atenuação típica de `-12 dB` a `-20 dB` pelo efeito barreira de **Maekawa** quando a própria torre bloqueia a via arterial).
- **Saída VEREDA:** Gráfico simples **Dia vs. Noite** em `dB(A)` estimado comparado à referência da `ABNT NBR 10151` (`55 dB(A) dia / 50 dB(A) noite`) + lista clicável das 3 fontes mais próximas com distância em metros.

#### 4) Risco de "Espigão Vizinho" (Perda Futura de Sol, Brisa e Vista)
- **Ciência aplicável:** Nos raios de `80–120 m` no quadrante Nascente/Sul-Sudeste, identificar lotes hoje ocupados por casas/galpões baixos (`H < 9 m` no PE3D), **não protegidos como IEP**, situados em zonas onde o **`CA_max` da LPUOS (Lei 19.426/2025)** permite verticalização relevante ou que já têm **protocolo de Outorga Onerosa / Licenciamento na SEDUL**.
- **Saída VEREDA:** *"Há 2 terrenos de casas antigas (< 6 m) em frente à fachada Leste sem proteção de IEP, onde o zoneamento atual permite construir até X pavimentos (processo de licença/outorga: nenhum / 1 encontrado em 120 m)."* — argumento de valor absurdo que nenhum corretor menciona na visita!

#### 5) Custo Real de Vida & Tempo Perdido (CTTU + GTFS + Moradia)
- **Ciência aplicável:** O usuário define 1 ou 2 destinos reais (trabalho, escola dos filhos) em `PerfilDomicilio`. Usando **CTTU Velocidade das Vias (15 min)** (para carro/app) e **GTFS programado** ([`roteador.ts`](file:///home/v/Documents/vereda/veredas/src/dados/transito/roteador.ts)), converte minutos de deslocamento diário ida+volta em **horas por mês e dias úteis por ano no trânsito** + custo estimado de deslocamento somado ao custo mensal de moradia ([`custoPorPartes.ts`](file:///home/v/Documents/vereda/veredas/src/dados/custoPorPartes.ts)). *(Nota: nunca monetizar arbitrariamente a hora do usuário sem ele informar, conforme `decisao.ts`, mas mostrar as horas/dias reais perdidos por ano + custo direto de transporte).*

#### 6) "Bomba-Relógio Condominial" & Desconto Real ITBI (`Mediana + MAD`)
- **Ciência aplicável:**
  - **Z-score robusto (`Mediana + MAD`)** da taxa de condomínio por m² estratificada por **idade do edifício** (do cadastro IPTU) e **faixa de porte/unidades no mesmo bairro**:
    - `z > +1,8`: condomínio muito acima dos pares da mesma idade/porte (ineficiência, passivo trabalhista, rateio oculto ou lazer caro);
    - `z < -1,5` em prédio de **25 a 45 anos**: sinal clássico de subfinanciamento de fundo de reserva / manutenção adiada prestes a gerar cota extra pesada de fachada, prumada ou elevador.
  - **Âncora real de ITBI (`HouseSigma` brasileiro):** comparar o R$/m² anunciado contra a distribuição de valores venais e **transações reais de ITBI (2016–2026)** registradas **no próprio edifício ou na mesma quadra** (explicitando sempre a natureza fiscal da base ITBI/IPTU, nunca confundindo com avaliação única de mercado).

---

## 4. Nova Experiência do Usuário: Do "Dossiê Estático" ao "Co-piloto Cativante"

Para o usuário sentir que o VEREDA **acompanha, protege e faz ele virar um expert local em segundos**, a arquitetura das 4 abas existentes deve passar por esta evolução UX sem aumentar complexidade:

### Aba 1 — `Explorar` -> **Radar Local Instantâneo (Zero Cold-Start)**
- **Topo vivo antes de qualquer link:** barra única inteligente **"Busque qualquer rua, prédio no Recife ou cole o link do anúncio"**, acompanhada por **3 chips instantâneos ("Testar agora em 1 toque")** com imóveis/edifícios reais pré-carregados (ex.: um clássico em *Boa Viagem*, um usado antigo nas *Graças* com diferença de ITBI e uma rua com histórico de chuva na *Madalena*) + botão **"Estou aqui agora (GPS)"** (quando na rua olhando uma placa, abre direto a **Ficha do Prédio** ou quadra!).
- **Triage rápido nos cartões salvos (estilo MySide):** botões diretos no card (`Favoritar`, `Nota rápida`, `Descartar`) e filtro rápido por estado da jornada (`Triando -> Visita marcada -> Visitado -> Negociando`).
- **Mini-ferramenta "Onde mais procurar" destravada na Home:** mesmo sem comparar 2 anúncios, se o usuário marcar um destino (ou bairro de trabalho), um card compacto na Home sugere **3 ruas alternativas** do `procura/*.json` com tempo parecido e menor concentração de calor/ruído/IPTU.

### Aba 2 — `Dossiê` -> **Raio-X Interativo em 15s + Ficha Viva do Prédio**
Em vez de exigir rolagem longa por várias sub-abas, a abertura do Dossiê responde em **3 blocos visuais limpos na primeira dobra**:
1. **Card "Ficha do Edifício" (estilo OpenIgloo + `linhaDoTempo.ts`):** antes dos textos longos, 5 pílulas factuais clicáveis com a fonte:
   - *Construção / Unidades / Andares* (`IPTU 2026`)
   - *Registros de Estrutura* (`linhaDoTempo.ts`: ex. `0 interdições · última vistoria 2023` ou `1 registro sem liberação — ver documento`)
   - *Transações ITBI no Prédio* (faixa real `R$/m²` nos últimos 24 meses vs. pedido)
   - *Condomínio/m² vs. Prédios da Mesma Idade* (`Mediana + MAD` — alerta de subfinanciamento ou peso excessivo)
   - *Entorno Vivo* (Calor Landsat, Cota + Maré PE3D, Potencial de Espigão Vizinho).
2. **Simulador Interativo "Seu Andar e Sua Janela" (inspirado no Mapa Sossego):**
   - Pílulas `Casa | Apartamento` + seletor rápido `Andar` + grade 3×3 `Orientação das Janelas (N, NE, L, SE, S, SO, O, NO, ?)`.
   - Ao tocar em **4º andar + Leste** vs. **2º andar + Norte**, os 3 valores físicos da unidade atualizam ao vivo sem sair do lugar: **Sol da tarde**, **Brisa SE (Alísios)** e **Ruído Dia / Noite em dB(A) vs. NBR 10151** — mostrando as fontes nominais (*ex.: Av. Cons. Rosa e Silva a 15 m, Bar X a 90 m*).
3. **Analisador de Atas, Convenção e Balancete (estilo Eli Report em *Split-Screen*):**
   - Área simples dentro de `Edifício -> Documentos` para colar texto ou subir PDF de **Ata de AGO/AGE, Convenção ou Balancete**.
   - Entrega: **Fatos Literais (verbatim) com citação da página**, checagem de **Regras de Vida** (pets, Airbnb, reformas, horário de silêncio) e **Alerta de Rateios/Obras/Passivos**.
4. **Loop de Calibração "Isso bate com a rua hoje?" (`Bate / Não bate`)** no rodapé de Calor, Chuva e Ruído (salvo localmente + exportável para melhorar os dados piloto).

### Aba 3 — `Comparar` -> **Sala de Decisão Compartilhada ("Modo Casal" + Custo de Vida Real)**
- **Placar enriquecido ([`placar.ts`](file:///home/v/Documents/vereda/veredas/src/componentes/comparar/placar.ts)):** além de *Custo*, *Espaço*, *Dia a dia a pé* e *Rua/Clima*, incluir delta direto de **Custo Real de Posse (Compra: ITBI + Escritura + Cartório estimados ou Aluguel + Condomínio + IPTU)**, **Dias úteis/ano perdidos no trajeto** e **Exposição da Unidade** (se andar/orientação estiverem preenchidos).
- **"Sala do Casal / Co-compradores" (estilo RealScout, 100% local-first):** botão **"Compartilhar comparação para voto"** gera um pacote compacto (URL com payload comprimido ou JSON/cartão web estático) onde a outra pessoa abre os mesmos 2–3 imóveis, marca `Faz sentido / Dúvida / Não`, deixa comentários por cômodo e devolve o link atualizado — acabando com a guerra de prints no WhatsApp.

### Aba 4 — `Visita` + **Desfecho de Co-piloto ("Carta de Negociação + Pacote para Especialista")**
- **Durante a visita ao vivo (`NoImovel.tsx`):**
  - Substituir a limitação atual de áudio apenas manual por **Decibelímetro Opcional via Web Audio API / Expo Audio** (com janela aberta vs. fechada durante 10s, comparando na hora a medição real no cômodo com a estimativa do modelo Dia/Noite, mantendo fallback manual caso o usuário negue microfone).
  - **Checklist guiado pela rua:** se o prédio está em cota baixa + histórico Defesa Civil -> pergunta automática de visita *"Há marca de umidade/bomba de recalque ou comporta na garagem?"*; se há terreno baixo sem IEP na frente -> *"Conferiu o sol/vento caso suba torre no lote da frente?"*.
  - **Modo "Estou chegando na visita" (atalho rápido):** tela escura de alto contraste com 1 botão por cômodo (foto + tag rápida `Sol / Ruído / Infiltração / Sinal 5G-WiFi`), conectado ao módulo já pronto de [`ConectividadeNoLocal`](file:///home/v/Documents/vereda/veredas/src/dados/conectividade.ts).
- **Saída dupla pós-visita (o fechamento estilo Buyer's Agent):**
  1. **Construtor de Contraproposta Baseada em Fatos ([`negociacao.ts`](file:///home/v/Documents/vereda/veredas/src/dados/negociacao.ts)):** além do histórico de queda de preço do usuário, injeta automaticamente na mensagem editável de WhatsApp os **fatos objetivos verificados** (ex.: diferença para mediana de ITBI do prédio, parcelas omitidas no anúncio, cota extra citada em ata, ruído acima da NBR, risco de perda de vista por zoneamento LPUOS, valor total com escritura/ITBI).
  2. **Ponte Exportável para Especialista (HTML/Markdown/PDF limpo em 1 clique):** gera o **Pacote de Segunda Opinião** pronto para enviar por WhatsApp/e-mail a um advogado imobiliário, engenheiro vistoriador ou consultor independente — contendo ficha técnica, contradições encontradas, linha do tempo estrutural ([`linhaDoTempo.ts`](file:///home/v/Documents/vereda/veredas/src/dados/estrutura/linhaDoTempo.ts)), trechos grifados de atas, fotos da visita e perguntas jurídicas/técnicas em aberto.

---

## 5. Notas de Adaptação Jurídica e Regulatória (Não Bloqueantes Nesta Fase, Essenciais Pós-Testes)

*(Mantidas separadas conforme definido para a cohorte de testers; servem de guia antes de abertura pública/escala.)*

1. **CRECI vs. Ferramenta de Inteligência (Lei nº 6.530/1978):** o VEREDA nunca deve intermediar compra/venda nem cobrar corretagem disfarçada sem CRECI; sua postura como software de dados públicos, organização pessoal e encaminhamento para especialistas externos independentes protege o produto — inclusive como diferencial moral frente à comissão embutida das imobiliárias.
2. **Difamação / Responsabilidade por Dados de Prédios e Condomínios:** seguir estritamente a regra do **Eli Report** + [`linhaDoTempo.ts`](file:///home/v/Documents/vereda/veredas/src/dados/estrutura/linhaDoTempo.ts): **extração literal (`verbatim`) com número do processo/documento/Diário Oficial e data**, sem nunca gerar "nota ruim", selo de condenação ou imputação subjetiva contra síndico, proprietário ou edifício.
3. **LGPD (dados pessoais de ITBI/IPTU/atas):** em todos os dados fiscais/cartoriais e atas enviadas pelo usuário, manter processamento **local-first no aparelho** ou anonimizado no nível do **edifício/lote/fração**, nunca expondo nome, CPF ou matrícula nominal de proprietários anteriores na UI pública.
4. **Calibração e Isenção Técnica (Alagamento, Estrutura, Ruído):** sempre acompanhar estimativas físicas (`MDT PE3D`, `dB(A)` modelado) com a margem de incerteza e o aviso claro de que não substituem laudo técnico com **ART/RRT** nem vistoria jurídica de certidões reais (matrícula atualizada no RGI).

---

## 6. Prompt Técnico Pronto para Outra IA Implementar no `veredas/`

> **Como usar:** copie integralmente o bloco abaixo e cole em uma sessão de agente de código dentro da raiz `/home/v/Documents/vereda/veredas`. Ele respeita a arquitetura D036 (camadas fora do bundle), os tokens de marca, o princípio `Desconhecido ≠ zero` e os testes Jest existentes.

```markdown
# Missão de Evolução B2C do VEREDA (`veredas/`)

Você está trabalhando no repositório `/home/v/Documents/vereda/veredas` (Expo Router / React Native Web + mobile, arquitetura local-first e carregamento de camadas D036 em `src/dados/camadas.ts` e `src/dados/camadasDasTelas.ts`).

## Objetivo Geral
Transformar o VEREDA de um "leitor/dossiê estático pós-link" em um **Co-piloto Cativante de Localidade, Edifício e Decisão Imobiliária** (mantendo foco em quem busca ou chega em um local "virar local em segundos", guiando da triagem até a contraproposta com fatos literais — sem login, sem paywall/créditos e respeitando rigorosamente as regras do projeto).

## Regras Invioláveis do Repositório (SEGUIR SEMPRE)
1. **Zero nota/score opaco, zero ranking subjetivo, zero veredito:** siga `src/dados/dossie/sintesesDaRua.ts` e `docs/negocio/01-PRODUTO-TESE-E-ESTADO-ATUAL.md`. Use apenas medidas físicas reais (`dB(A)`, `°C`, `m`, `min`, `R$/m²`), comparações explícitas (`+X dB acima da referência NBR 10151`, `mediana ± MAD de prédios da mesma idade`), percentis/faixas factuais e citações literais (`verbatim`) com fonte e data.
2. **Desconhecido ≠ zero:** nunca preencha campo ausente com `0` ou suposição implícita (`src/dados/decisao.ts` e `src/dados/custos.ts`).
3. **Identidade visual da marca:** papel `#F2EBDD`, superfície `#FFFFFF`, texto `#171717`, laranja `#F47745`, ferrugem `#B94E36`, azul cadastral `#2E5A85`; fontes Fraunces, Plus Jakarta Sans e JetBrains Mono (`src/tema/`).
4. **Arquitetura de dados (D036):** camadas novas pesadas vão para `public/dados` via scripts em `scripts/dados/`, declaradas em `src/dados/camadasDasTelas.ts` e lidas via `lerCamada` (`src/dados/camadas.ts`) + validação Zod.
5. **Lições já invalidadas (NÃO reimplementar de forma ingênua):**
   - Não crie badge de 5G por edifício baseado apenas em faixa dBm do Anatel Mosaico (48/48 pontos empatam). Use apenas azimute/distância complementar se útil, mantendo o teste em cômodo (`ConectividadeNoLocal`).
   - Não rotule horários GTFS como "tempo real" (é grade programada `v2026.10.26`).
   - Não reintroduza rotas sombreadas automáticas (`CoolWalk`) sem cobertura arbórea/marquises validada.

---

## Plano Priorizado de Implementação

### FASE P0 — Zero Cold-Start, Desbloqueio das Camadas Ocultas e Ficha do Prédio

1. **Nova Experiência da Aba `Explorar` (`src/app/(abas)/index.tsx`):**
   - Substitua a abertura fria centrada só em "Cole o link" por uma **Barra Unificada de Entrada**: aceita URL de anúncio **OU** busca instantânea por **nome de edifício / logradouro / bairro** usando `src/dados/recife/buscar.ts` + botão **"Usar minha localização agora"** (GPS web/nativo -> resolve edifício ou quadra mais próxima no índice municipal e abre o Raio-X em 1 toque).
   - Logo abaixo da barra, quando o caderno tiver 0 análises (ou colapsável quando já tiver), adicione **"Explorar um endereço exemplo agora"** com **3 cenários reais anonimizados / demonstrativos** nos bairros piloto (ex.: 1 em Boa Viagem frente mar/ruído, 1 usado antigo nas Graças/Espinheiro com ITBI histórico, 1 rua na Madalena com contexto de drenagem) para que um tester experimente o app em 2 segundos sem precisar sair para buscar link no ZAP/VivaReal.
   - Adicione nos cards de análises salvas botões rápidos de triagem de comprador em 1 toque (**Favoritar / Anotar / Descartar**) com filtro por etapa (`Triagem`, `Visita`, `Visitado`, `Negociando`).
   - Promova um card compacto **"Onde mais procurar no piloto"** direto na `Explorar` consumindo `src/dados/recife/procura.ts` assim que o usuário definir destino em `PerfilDomicilio` (sem exigir que ele compare 2 imóveis antes).

2. **Destravar Dados Ocultos e Conectar Módulo Órfão (`src/app/(abas)/dossie.tsx`, `src/componentes/dossie-v1/Entorno.tsx`, `src/componentes/caderno/Servicos.tsx`):**
   - **Ligar `src/dados/estrutura/linhaDoTempo.ts` (`lerLinhaDoTempo`) na UI do Dossiê e da Ficha do Prédio:** renderizar a linha do tempo documental (`chamado -> vistoria -> laudo_art_rrt -> interdicao -> reparo -> liberacao`), mantendo estritamente a exibição literal de documento/número/data e pergunta automática ao síndico.
   - **Destravar `camadas-ambientais.json` e `censo-renda-setores.json`:** em `Entorno.tsx`, exibir o resumo de ocupação/renda do setor Censo por padrão (remover gate `verRenda = false`) e elevar **Calor de Superfície (`Landsat 100m`), Canal/Cota e Ruído Dia/Noite** para pílulas objetivas logo no bloco superior do Dossiê (**Raio-X em 15s**).
   - **Enriquecer `Servicos.tsx` / `servicos-cnefe.json`:** exibir o `DSC_ESTABELECIMENTO` real quando disponível e destacar estabelecimentos de atrito noturno/comercial próximos (bares/adegas/oficinas/supermercados) separados dos serviços de conveniência diária.

3. **Card "Ficha Viva do Edifício" no Topo do Dossiê (`src/componentes/dossie-v1/`):**
   - Antes das abas longas, mostrar 5 micro-indicadores factuais clicáveis com fonte:
     1. Porte & Idade (`IPTU 2026`: ano, pavimentos, unidades);
     2. Registros Estruturais (`lerLinhaDoTempo`);
     3. Transações ITBI no Prédio (`ITBI 2016–2026`: faixa `R$/m²` registrada no edifício vs. pedido atual, explicitando natureza fiscal);
     4. Condomínio/m² vs. Prédios da Mesma Idade/Porte (`Mediana + MAD` no bairro — alertar se muito acima dos pares OU se muito abaixo em prédio de 25–45 anos, indicando possível reserva baixa/rateio futuro);
     5. Clima & Entorno (`Delta térmico Landsat`, `Cota + ocorrências Defesa Civil`, `Lote vizinho com potencial construtivo LPUOS`).

---

### FASE P1 — Simulador Interativo da Unidade, Ciência Urbana Recife e Modo Casal

4. **Simulador Interativo "Andar × Orientação das Janelas" (`src/componentes/dossie-v1/`):**
   - Criar componente interativo (toggles `Casa | Apartamento`, seletor `Andar`, grade 3×3 **Rosa dos Ventos `NO, N, NE / O, ?, L, / SO, S, SE`**).
   - Ao alterar andar ou fachada, recalcular no cliente em tempo real e exibir sem nota 0–100:
     - **Ruído Dia vs. Noite estimado em `dB(A)`** comparado à referência `ABNT NBR 10151` (`55 dB(A) dia / 50 dB(A) noite`), listando as 3 principais fontes nominais e distância (`via arterial`, `bar/CNEFE`, `corredor de aproximação do aeroporto` + atenuação aproximada `-12 dB` na fachada oposta e ajuste de altura `andar × 3m`);
     - **Exposição ao Sol da Tarde** (integrando `src/dados/dossie/solDaTarde.ts`);
     - **Exposição à Brisa Alísia Sudeste (`110°–160°`)**: cruzando altura do andar (`andar × 3 m`) com altura das barreiras vizinhas (`H = MDS - MDT` quando camada PE3D estiver disponível para o setor).
   - Incluir no rodapé do bloco de entorno o micro-feedback anônimo em 1 toque **"Isso bate com a rua hoje? (`Bate` / `Não bate`)"** persistido em armazenamento local (com opção de anotar motivo).

5. **Enriquecimento do `Comparar` (`src/app/(abas)/comparar.tsx`, `src/componentes/comparar/placar.ts`, `src/dados/decisao.ts`):**
   - Atualizar `placarDoPar` para refletir também:
     - **Custo Total Real** (incluindo estimativa transparente de **ITBI + escritura/cartório** na aba `Custo` para modalidade `compra`, reaproveitando `src/dados/custoPorPartes.ts`);
     - **Impacto na Rotina Anual**: horas/mês e dias úteis/ano gastos no deslocamento até os destinos de `PerfilDomicilio` (via `src/dados/transito/roteador.ts` e velocidade viária quando disponível);
     - **Diferença de exposição ambiental/condominial** (delta térmico, cota/ocorrências de chuva e desvio `MAD` do condomínio).
   - **Sala de Decisão Compartilhada ("Modo Casal / Co-compradores"):** adicionar botão **"Compartilhar comparação (voto e notas)"** que serializa as 2–3 análises elegíveis em URL/JSON compacto (base64url/LZ no hash ou arquivo local) para que outra pessoa abra no próprio navegador, marque reação (`Faz sentido / Dúvida / Descartar`) e adicione observações por imóvel e reimporte a devolutiva sem exigir servidor/login.

6. **Pipelines Offline de Ciência Urbana (em `scripts/dados/` + validação Zod em `src/dados/recife/`):**
   - Se os arquivos-fonte estiverem presentes ou configuráveis em pipeline local:
     - **Bare-Earth Alagamento + Maré (`PE3D MDT 1m` + `HAND` + `Tábua de Marés CHM 2,3–2,8m` + `SEDEC/156`)**: substituir qualquer dependência exclusiva de Copernicus DEM por cota `bare-earth` real;
     - **Potencial de "Espigão Vizinho" (`PE3D MDS-MDT < 9m` + `ESIG LPUOS CA_max` + `IEPs` + `Outorga Onerosa SEDUL`)**: contar lotes baixos não tombados em `80–120 m` à frente das fachadas Leste/Sul-Sudeste;
     - **Comércio/Atrito CNEFE (`COD_ESPECIE = 6 e 7`)**: extrair nomes e categorias de vida noturna/serviços ruidosos e obras em andamento por edifício.
   - Enquanto alguma camada externa ainda não tiver cobertura total nos 6 bairros, degradar graciosamente exibindo `"Sem leitura publicada nesta área ainda"` (nunca `0`).

---

### FASE P2 — Visita Ao Vivo Inteligente, Leitor de Atas/Balancete e Desfecho Especialista

7. **Upgrade da Aba `Visita` (`src/app/(abas)/visita.tsx` e `src/componentes/visita-v1/NoImovel.tsx`):**
   - **Medidor de Ruído Ambiente Opcional no Navegador (`Web Audio API`):** no bloco `RuidoDeFora` dentro de `NoImovel.tsx`, adicionar botão opcional **"Medir 10s com microfone"** (janela aberta vs. janela fechada) usando RMS calibrado apenas como referência comparativa relativa (`delta janela aberta -> fechada` em dB e nível relativo ao modelo da rua), preservando os 3 botões manuais originais caso o usuário recuse permissão ou esteja no servidor de testes.
   - **Checklist contextual gerado pelo risco do imóvel:** injetar automaticamente até 3 verificações prioritárias derivadas do Dossiê (ex.: garagem/comporta se cota baixa; pressão de água/fachada se prédio > 25 anos com condomínio `z < -1,5`; teste Wi-Fi/4G conectado ao `ConectividadeNoLocal`).

8. **Analisador de Atas, Convenção e Balancete (Padrão Verbatim Split-Screen):**
   - Expandir `Complementos` / `proporBalancete` (`src/dados/propostasBalancete.ts`) com um leitor estruturado onde o usuário cola texto ou seleciona arquivo local (PDF/TXT via parser web/client-side) da **Ata de AGO/AGE, Convenção ou Balancete**.
   - Extrair e organizar por seções objetivas com **citação literal do trecho + página**:
     1. Regras de convivência (pets, temporada/Airbnb, obras, vagas);
     2. Fatos financeiros/jurídicos citados (rateios/cotas extras aprovadas, fundo de reserva, inadimplência, ações judiciais, sinistros);
     3. Perguntas prontas para enviar ao síndico/corretor.

9. **Fechamento Co-piloto: Contraproposta + Pacote Exportável para Especialista (`src/dados/negociacao.ts` + exportador):**
   - Enriquecer `prepararNegociacao` e `mensagemDeNegociacao` em `src/dados/negociacao.ts` para permitir incluir (via checkboxes do usuário): argumentos de distância para mediana de ITBI do prédio, parcelas omitidas no anúncio, achados literais de atas/balancetes, exposição a ruído/calor e risco de verticalização vizinha.
   - Criar gerador **"Exportar Pacote para Especialista (Advogado / Vistoriador)"**: gera documento HTML/Markdown limpo e imprimível (`window.print()` / download `.html` ou `.md`) reunindo ficha do prédio, contradições anúncio vs. cadastro, linha do tempo estrutural (`lerLinhaDoTempo`), trechos literais das atas, checklist da visita e perguntas jurídicas/técnicas abertas.

---

## Critérios de Verificação Obrigatórios Antes de Concluir
1. Rode `npm test` (toda a suíte Jest existente + novos testes unitários para o simulador de unidade, `MAD` condominial, `linhaDoTempo` na UI, `placarDoPar` estendido, leitor verbatim e exportação).
2. Rode os verificadores de cobertura/camadas/bundle do repositório (`package.json` scripts) garantindo que as novas camadas não inchem o bundle principal (mantenha o teto D036).
3. Verifique no navegador em viewport desktop e mobile (`360 px`) as 4 abas (`Explorar`, `Dossiê`, `Comparar`, `Visita`), garantindo ausência de notas/vereditos arbitrários e comportamento determinístico.
```
