# Target Audience Profile: VEREDA (Compradores de Usados, Inquilinos Média/Alta Renda & Canal B2B2C — Recife e Capitais Brasileiras)

**Phase:** 3 — Market Research (Wave 3, Agent C3 — Deep Mode)  
**Project:** vereda  
**Date:** 2026-11-15  
**Confidence:** Medium-High *(alta precisão em demografia censitária IBGE 2022, FipeZAP/Raio-X, DataZAP, Censo QuintoAndar, fluxo jurídico/engenharia e preços de mercado; `DATA GAP`s explícitos onde não há séries públicas para contagem exata de subsegmentos e 0 testes reais pós-pivô `VE01–VE15`)*

> **Nota Metodológica e Protocolo Probatório:** Este perfilamento resulta de **7 rodadas de pesquisa externa** cruzadas com os achados verificados das Ondas 1 e 2 (`A1–A4`, `B1–B4`) e os microdados censitários do repositório (`censo-renda-setores.json`). Nenhuma métrica demográfica foi inventada: todas as afirmações seguem os marcadores **`[Data]`** (dado verificado em fonte citada), **`[Estimate]`** (cálculo/projeção com premissas declaradas), **`[Assumption]`** (hipótese a validar em entrevistas) e **`[Opinion]`** (julgamento analítico). O levantamento exploratório interno de out/2026 (`N=83` e `5 casos`) é tratado estritamente como **sinal qualitativo pré-pivô com viés acadêmico/tech** (43,4% estudantes/pós CIn-UFPE/CESAR + 30,1% tech Porto Digital), nunca como taxa de conversão esperada.

---

## 0. Contexto Estrutural: Por que a Segmentação Decide a Sobrevivência do VEREDA

Os achados das Ondas 1 e 2 impõem uma restrição econômica dura sobre **quem** pode sustentar o VEREDA:

1. **O passe B2C puro de R$ 49,90 não paga aquisição via mídia paga:** `[Data]` `[Estimate]` Com margem pré-CAC de ~R$ 31,92 a R$ 39,91 e compra episódica (sem renovação mensal), o teto para `LTV:CAC ≥ 3:1` é de **R$ 13,30**. No Google Ads imobiliário em Recife, o CPC varia de **R$ 4,00 a R$ 15,00+** (`"apartamentos em boa viagem"` R$ 5,50–12,00; `"due diligence imobiliária"` R$ 7,00–15,00+), gerando CAC real de **R$ 140 a R$ 750+**.
2. **A dor é universal, mas a disposição a pagar (WTP) só destrava acima de um piso de risco e renda:** `[Data]` `[Opinion]` Nos 5 bairros-piloto do Recife (`Boa Viagem`, `Graças`, `Madalena`, `Espinheiro`, `Casa Forte`), a renda **mediana do responsável** pelo domicílio varia de **R$ 6.000 a R$ 11.000/mês** (média de **R$ 8.871 a R$ 14.342/mês**, IBGE Censo 2022) — contrastando brutalmente com bairros estudantis como a Várzea (mediana **R$ 1.500**). Ainda assim, mesmo nos bairros nobres, inquilinos locais acostumados ao "grátis" de portais, ChatGPT e porteiro resistem a pagar antes da dor aguda; já **compradores de apartamento usado**, **transferidos de fora sem rede local** e **intermediários B2B2C do lado comprador** vivem risco financeiro imediato que justifica **R$ 199–499 por transação** ou **R$ 199–399/mês**.

### Resumo Comparativo dos Segmentos Avaliados

| Segmento | Volume Recife / Piloto | Ciclo de Decisão | Risco Financeiro em Jogo | WTP Realista | Papel Estratégico no VEREDA `[Opinion]` |
|---|---|---|---|---|---|
| **Persona Primária A:** Comprador de Usado (R$ 350k–1,2M) | `[Estimate]` ~2.000–2.800 compras/ano nos 5 bairros (~7k–10k fora MCMV na RMR) | ~10 sem. busca ativa (~4 meses ponta a ponta), ~7 visitas | **R$ 50 mil – R$ 200 mil+** (*arras* 10%–20%, laudêmio 5%, cota extra, prédio-caixão, sobrepreço) | **Alta** para pacote assistido **R$ 199–349** antes do sinal | **Motor principal de receita B2C transacional** (Concierge / Pré-Diligência) |
| **Persona Primária B:** Locatário Média/Alta Renda ou Transferido (R$ 2,5k–6k/mês) | `[Data]`/`[Estimate]` 58.392 aptos alugados no Recife (~22.453 nos 5 bairros; ~8.980 buscas/ano) | ~2 meses média; **2–4 semanas** janela aguda pré-assinatura | **R$ 36 mil – R$ 80 mil/ano** de contrato + multa rescisão (3 meses) + R$ 300–1.500/mês extras ocultos | **Baixa-Média** no local (R$ 0–49,90); **Média-Alta** no transferido/escaldado | **Topo orgânico de funil** + monetização enxuta Web/Pix para transferidos e trabalho híbrido |
| **Persona Secundária B2B2C:** Advogado Imob. / *Buy-Side* / Vistoriador / RH | `[Data]` 47k advogados OAB-PE (`DATA GAP` nicho DD); 17–18k CRECI-PE; IBAPE-PE; 541 empresas Porto Digital | Contínuo (clientes mensais recorrentes) | Perda de honorário, responsabilidade civil, retrabalho de 2–4h/caso e desgaste com cliente | **Alta** (**R$ 199–399/mês** ou pacote de laudos) se anexável ao parecer/laudo | **Destravador de receita recorrente (`MRR`) e distribuição sem CAC de Ads** |
| **Anti-Personas:** Turistas, Sisu <R$ 1,5k, Corretores *Sell-Side*, Otimizadores Grátis | Alto volume aparente, mas valor capturável negativo | 2–6 dias (turista) ou sem pressa | Nulo (turista) ou incompatível com receita (estudante/corretor vendedor) | **R$ 0** ou **hostil** ao produto | **Vetar de roadmap, copy e aquisição** |

---

## 1. Persona Candidata Primária A — Comprador(a) de Apartamento Usado (R$ 350 mil a R$ 1,2 milhão em Recife / Capitais)

### 1.1 Perfil Demográfico e Econômico `[Data]` `[Estimate]`

* **Nome Representativo:** **Marcelo & Juliana Andrade** *(casal dual-income de 38 e 36 anos)* / **Patrícia Vasconcelos** *(profissional sênior/servidora de 51 anos fazendo upgrade ou investimento para renda)*.
* **Faixa Etária Real (Brasil):** `[Data]` O **Raio-X FipeZAP (2024–2026)** registra idade média dos compradores ativos em torno de **46 a 47 anos**, com peso crescente e frequentemente majoritário da faixa **acima de 50 anos** (especialmente entre compradores à vista e investidores). Ao mesmo tempo, nos financiamentos bancários (**Caixa / SBPE**), a janela etária mais ativa concentra-se entre **35 e 44 anos**, porque a regra bancária exige `idade + prazo ≤ 80 anos e 6 meses` — quem tem 35–40 anos ainda acessa o prazo máximo de **35 anos (420 meses)**, enquanto compradores de 50+ já sofrem redução para ≤30 anos, encarecendo a prestação.
* **Composição Domiciliar e Finalidade:** `[Data]` Segundo o **Raio-X FipeZAP (2025–2026)**, **60% a 65%** compram para **moradia própria** (dos quais **64% a 72%** declaram comprar *"para morar com alguém"* — cônjuge, companheiro(a) ou família com filhos) e **35% a 40%** compram para **investimento** (sendo **58% a 75%** destes focados em **renda mensal via aluguel**). **71% a 77%** das aquisições recentes no levantamento FipeZAP — e **~70% das operações no SBPE (ABECIP 2025)** — são de **imóveis usados**, preferidos por metragem maior, localização consolidada e margem de desconto.
* **Renda Domiciliar:** `[Data]` `[Estimate]`
  * No **Raio-X FipeZAP**, compradores efetivos concentram-se acima de **R$ 10 mil/mês** de renda domiciliar (e o recorte **DataZAP** acima de 20 salários mínimos domina imóveis >R$ 1 milhão).
  * Na simulação **Caixa SBPE (2025–2026)** com juros de **13%–15% a.a.** (Selic em **13,75% a.a.** em nov/2026), entrada mínima de **20%** e teto legal de prestação de **30% da renda bruta** (Lei nº 8.692/1993), um apartamento usado de **R$ 350 mil–400 mil** exige renda familiar mínima de **R$ 7 mil–10 mil+**, enquanto a faixa de **R$ 600 mil a R$ 1,2 milhão** exige renda familiar combinada típica de **R$ 15 mil a R$ 32 mil+/mês** (ou uso pesado de FGTS/capital próprio de venda de imóvel anterior).
  * **Recorte Recife (IBGE Censo 2022, `censo-renda-setores.json`):** Os 5 bairros-piloto são exatamente a base dessa renda: **Casa Forte** (média **R$ 14.342**, mediana **R$ 11.000** por responsável), **Graças** (média **R$ 11.807**, mediana **R$ 10.000**), **Espinheiro** (média **R$ 9.895**, mediana **R$ 7.500**), **Boa Viagem** (média **R$ 9.737**, mediana **R$ 7.000**) e **Madalena** (média **R$ 8.871**, mediana **R$ 6.000**). Em domicílios *dual-income* (média de 2,45 a 2,70 moradores/domicílio), a renda familiar supera facilmente R$ 15 mil–25 mil/mês.
* **Ocupação Típica no Recife:** Servidores públicos estáveis (TRT, TJPE, MPPE, UFPE, Receita), médicos e profissionais de saúde (polo médico Ilha do Leite / Agamenon / Boa Viagem), engenheiros, advogados, executivos, docentes, empreendedores e profissionais tech seniores (Porto Digital / remoto para Sudeste ou exterior).
* **Tamanho e Preço do Imóvel em Recife:** `[Data]` Com o m² médio de venda no Recife em **R$ 9.044,83/m²** (set/2026) a **>R$ 9.179/m²** (2S/2026, +8,20% em 12m, FipeZAP) — atingindo **R$ 9.300–9.600/m² em Boa Viagem**, **R$ 9.500–9.800/m² em Parnamirim**, **~R$ 8.900/m² na Madalena** e **R$ 7.700–8.500/m² nas Graças/Espinheiro** —, o orçamento de **R$ 350 mil a R$ 1,2 milhão** corresponde a apartamentos usados de **55 m² a 145 m²** (2 a 4 quartos), frequentemente com **15 a 45 anos de idade construtiva**.

### 1.2 Jornada de Compra, Prazos e Fricções Reais `[Data]`

1. **Duração e Volume de Visitas:** `[Data]` A jornada ponta a ponta dura em média **4 meses** (**DataZAP**), estendendo-se a **6–12 meses** para 15%–40%+ dos compradores sob Selic de 13,75%. O **Raio-X FipeZAP** registra média de **~10 semanas** de busca ativa e mediana de **7 visitas presenciais** antes da proposta (visitas adicionais costumam refletir desalinhamento de preço).
2. **Onde Buscam Hoje:** `[Data]` Portais dominantes (**ZAP, VivaReal, OLX** — ~70% das visitas online nacionais — e **QuintoAndar**), grupos locais de WhatsApp, indicação de porteiros/zeladores em ruas desejadas e planilhas Excel/Google Sheets comparando anúncios duplicados.
3. **Alavanca de Negociação:** `[Data]` Mais de **70%** dos compradores acham os imóveis caros ou muito caros; **67% a 71%** das transações em 2025–2026 fecharam com **desconto** sobre o anúncio (abatimento médio de **10% a 14%**, Raio-X FipeZAP). Porém, quem não tem régua de ITBI histórico ou evidência de passivo predial negocia "no escuro".
4. **O Ponto de Pânico Real (O que Tira o Sono Antes da Assinatura):**
   * **Armadilha das *Arras* (Sinal) sem Direito de Arrependimento:** `[Data]` Diferente da compra na planta (Lei do Distrato/CDC), a compra de **imóvel usado entre particulares** rege-se pelos arts. 417–420 do Código Civil: não existe arrependimento gratuito em 7 dias. Se o comprador descobre uma cota extra ou risco estrutural *depois* de pagar o sinal (geralmente 10%–20% = **R$ 50 mil a R$ 180 mil**), arrisca perder tudo ao desistir.
   * **Cota Extra Oculta e Inadimplência Condominial:** `[Data]` A taxa de condomínio subiu **+24,9%** (2022–2025, média nacional R$ 516 no 1S/2025) e a inadimplência bateu **11,95%** (Norte/Nordeste com piores índices, Censo Condominial uCondo). A CND simples do condomínio só prova que o *vendedor* pagou até hoje — **não mostra cota extra aprovada para fachada/elevador, fundo de reserva zerado nem ação trabalhista de porteiro** (que viram passivo do novo dono pelo art. 1.345 do CC / art. 130 do CTN).
   * **Terreno de Marinha (Choque Específico do Recife):** `[Data]` Estima-se que **~40% do território do Recife** (incluindo Boa Viagem, Pina, Brasília Teimosa e áreas ribeirinhas de canais/Capibaribe) esteja sob regime da SPU. O comprador desavisado — sobretudo quem vem de fora ou compra seu primeiro usado — descobre tarde o **laudêmio de 5% sobre o valor do terreno** na transferência (mais **0,6% de foro** ou **2%–5% de taxa de ocupação anual**), além de entraves de domínio pleno no financiamento.
   * **Prédios-Caixão e Vício Estrutural (RMR):** `[Data]` Edifícios de alvenaria autoportante (≤4 pavimentos, pré-2005) carregam histórico severo na RMR (**431 prédios no acordo FCVS de R$ 1,7 bilhão**, teto R$ 120 mil/unidade) e exigência legal estadual de vistoria periódica (**Lei PE nº 13.032/2006** / LTVP). Sem regularidade e seguro, a Caixa barra financiamento e o comprador fica preso a ativo ilíquido.
   * **Obras Vizinhas, Poente e Maré:** `[Data local]` Demolições de casarões para torres de 20–30 andares em Graças/Espinheiro/Boa Viagem, incidência solar poente elevando conta de ar-condicionado e alagamento de garagem subsolo em maré alta com chuva forte.

### 1.3 O Que Já Gastam Hoje na Compra (Âncora de Budget) `[Data]`

| Etapa / Serviço Tradicional | Custo Real Observado (Recife / Brasil) | Quando Acontece no Funil | O que Não Entrega (Lacuna do VEREDA) |
|---|---|---|---|
| **Vistoria Cautelar de Engenharia (CREA/IBAPE)** | **R$ 400–1.500** (aptos até ~100 m²; média PE **R$ 700–1.200**) até **R$ 1.200–2.500+** (>120 m² / c/ ART) | **Tardio** (imóvel único, pós-escolha ou pós-proposta) | Não audita atas/balancetes, ITBI histórico, obras vizinhas 150 m nem Terreno de Marinha. |
| **Due Diligence Jurídica (Advogado Imobiliário)** | **R$ 1.500–6.000** (valor fixo urbano) ou **0,5%–1%** do imóvel (ex.: R$ 3.500–8.000 num apto de R$ 700k) | **Tardio** (pós-escolha, na minuta de compra e venda) | Analisa matrícula/partes (risco vendedor), mas não checa insolação, alagamento, alvarás vizinhos nem compara 3–5 opções. |
| **Despachante / Certidões (`RI Digital` / `Certidão na Mão`)** | **R$ 170+** avulsa; **R$ 500–1.500** pacotes completos (emolumento base PE ~R$ 52–64+ mais TSNR/FERM/FUNSEG/FERC/ISS) | **Tardio** (lavratura de escritura / financiamento) | Apenas emite papel cartorial sem interpretação financeira, urbana ou condominial. |
| **ITBI + Cartório / Registro (Recife/TJPE)** | **ITBI 3%** padrão (ou 1,8%–2% campanhas / 1% SFH) + **2%–3% escritura/registro** (**~R$ 25 mil–48 mil** num imóvel de R$ 800k) | **Fechamento** | Custo transacional inevitável; cria enorme sensibilidade para pagar **R$ 249–349** antes se isso evitar perda de sinal ou negociar R$ 30k–100k. |

### 1.4 Comportamento de Compra & Fit com o VEREDA

* **Como descobre ferramentas:** Busca ativa no Google (*"o que checar antes de comprar apartamento usado"*, *"como saber se terreno é de marinha recife"*, *"lista prédio caixão recife"*), recomendação do advogado/engenheiro/corretor *buy-side*, e compartilhamento entre cônjuges/pais durante a comparação dos 3–7 finalistas.
* **Papéis na decisão:**
  * **Compradores:** Casal (decisão conjunta *dual-income*, 64%–72%) ou comprador sênior solo.
  * **Influenciadores:** Pais/familiares que já moraram no bairro, colegas de trabalho, advogado da família, engenheiro.
  * **Bloqueadores:** Corretor *sell-side* pressionando por urgência (*"tem outra família fechando hoje"*) e exigindo sinal antes da entrega das atas/matrícula; resistência psicológica a gastar antes de fechar um imóvel específico.
* **Top 5 Critérios de Decisão (Ranqueados):** `[Opinion]`
  1. Segurança jurídica e patrimonial (não perder *arras* / sem passivo oculto / financiamento aprovado sem bloqueio caixão ou marinha).
  2. Custo real de propriedade (valor justo vs. prédio/m² + condomínio real + cotas extras + laudêmio).
  3. Conforto e risco físico do prédio/entorno (alagamento de garagem, sol nascente vs. poente, obras nos próximos 2 anos, ruído).
  4. Liquidez e facilidade de revenda/locação futura (35%–40% visam investimento/renda).
  5. Rapidez e clareza para comparar 3 finalistas sem perder semanas em planilhas e cartórios.
* **Orçamento & Ciclo de Venda:** Disposto a pagar **R$ 199 a R$ 349** em **pré-diligência guiada / Concierge** no estágio **pré-proposta / pré-arras** (onde já aceita gastar R$ 600–5.000 mais adiante), mas cético para pagar R$ 49,90 na fase rasa de navegação em portal. Ciclo de conversão: **2 a 6 semanas** dentro da jornada de 10 semanas.
* **Objeções Comuns:**
  * *"Se isso não tem validade jurídica de advogado nem ART de engenheiro, por que eu pagaria antes de contratar o profissional?"* → Resposta: **triagem pré-sinal** para economizar R$ 2.000–4.000 de laudo/advogado num imóvel que seria descartado por ata/obra/maré, e base tabular para negociar desconto antes de pagar *arras*.
  * *"A MySide não faz isso de graça?"* → `[Data]` A **MySide** monetiza ~5% de comissão paga por incorporadoras em **lançamentos/novos**, **não atua com diligência independente de usados nem locação** e, até out/2026, não tinha operação presencial confirmada no Recife (apenas conteúdo editorial/SEO).
* **Citação Representativa (Pré-Pivô Local — Caso 03, Casa Forte):** `[Data local]` *(Sinal qualitativo pré-pivô)* *"Quando você vai comprar um imóvel de mais de 1 milhão, você não tem margem para errar. O corretor ficava nos pressionando dizendo que tinha três famílias querendo assinar proposta... Se eu tivesse uma régua com a mediana das escrituras reais do prédio nos últimos 10 anos, eu teria sentado na mesa e fechado por pelo menos R$ 120 mil a menos."*

---

## 2. Persona Candidata Primária B — Locatário de Média/Alta Renda ou Transferido / Trabalho Híbrido (Aluguel R$ 2.500–6.000/mês em Boa Viagem, Graças, Casa Forte, Espinheiro, Madalena)

### 2.1 Perfil Demográfico e Econômico `[Data]` `[Estimate]`

* **Nome Representativo:** **Camila / Lucas** *(27–37 anos, profissional tech, saúde, jurídico ou servidor em regime híbrido/remoto, morando só ou em casal sem filhos)* / **Henrique & Renata** *(32–42 anos, casal recém-transferido para Recife ou mudando de bairro por escola/trabalho)*.
* **Peso Estrutural da Locação:** `[Data]`
  * **Brasil (IBGE PNAD Contínua 2025):** **23,8%** dos domicílios são alugados (**18,9 milhões** de lares; alta de +54,1% desde 2016).
  * **Recife (IBGE Censo 2022 / SIDRA 9928):** **26,53%–26,6%** dos domicílios são alugados (**145.805 domicílios**), com **58.392 apartamentos alugados** (35% do estoque de apartamentos da capital; **97.700 na RMR**). Os 5 bairros-piloto concentram **64.153 apartamentos ocupados** (**~22.453 apartamentos alugados** aplicando a proporção municipal `[Estimate]`).
* **Faixa Etária e Arranjo Domiciliar:** `[Data]` Segundo o **Censo de Moradia QuintoAndar/Datafolha** e o **DataZAP**, a mobilidade de aluguel concentra-se em jovens adultos (**18 a 34 anos**, com pico de mobilidade ao redor dos 24–35 anos), com avanço expressivo de **pessoas morando sozinhas (*single living*)** e **casais sem filhos** buscando apartamentos compactos ou de 2–3 quartos próximos a eixos de serviços.
* **Pressão de Renda e Preço no Recife:** `[Data]`
  * O Recife atingiu em 2026 **R$ 60,89 a R$ 64,39/m²** de aluguel anunciado (FipeZAP — **2º ou 3º maior m² de locação do Brasil** e **1º do Nordeste**), com **Boa Viagem entre R$ 64–67/m²**, **Graças entre R$ 54–64/m²** (+21,5% em 12 meses até fev/2026) e **Parnamirim >R$ 71/m²**.
  * Um apartamento de **55 m² a 100 m²** nesses 5 bairros custa tipicamente **R$ 2.500 a R$ 6.000/mês** apenas de aluguel (ou **R$ 3.300 a R$ 7.800/mês** somando condomínio + IPTU). Pelo padrão do **Censo de Moradia QuintoAndar** (comprometimento médio de **31%–34%** da renda familiar com locação) e regra de aprovação de imobiliárias/QuintoAndar (renda ≥ 3× o pacote total), essa persona tem renda individual ou familiar de **R$ 9.000 a R$ 22.000+/mês**. *(Confirmação DataZAP: 71% do recorte de alta renda direciona orçamento para aluguéis ≥ R$ 3.000/mês).*
* **Subsegmentos com Maior Dor nos 5 Bairros:** `[Data]` `[Estimate]`
  1. **Profissionais Híbridos / Remotos (`~7,9%` trabalho no domicílio na PNAD; `>2/3` em presencial/híbrido rígido no DataZAP):** Trabalhadores do **Porto Digital** (541 empresas, 24.079 colaboradores, salário médio TIC PE R$ 5.200–5.300 — com plenos/seniores e remotos para fora ganhando **R$ 10.000 a R$ 25.000+**) e profissionais autônomos/remotos que trabalham em casa 2–5 dias/semana e **não podem errar em ruído diurno de obra nem calor poente**.
  2. **Transferidos / Recém-Chegados ao Recife (`~125–250/ano` no Porto Digital `[Estimate]` + médicos residentes HC-UFPE/IMIP/Oswaldo Cruz, servidores federais/MP/TRF5, executivos e pós-graduandos com bolsa/renda):** Sem rede de amigos para avisar que a Rua da Hora/Boa Viagem/Benfica trava na maré cheia de 2,3 m ou qual esquina tem casa de shows/corredor de ônibus.
  3. **Locatários "Escaldados" em Troca de Imóvel:** `[Data]` **58% dos inquilinos brasileiros** pretendem mudar de residência em até 2 anos (Censo QuintoAndar), motivados principalmente por busca de melhor imóvel (27%), insatisfação com o bairro/localização (18%), reajuste abusivo e desejo de mudança (12%+). Quem já pagou multa de 3 meses ou sofreu aumento surpresa de condomínio tem sensibilidade imediata.

### 2.2 Ciclo de Urgência, Dores Agudas e Relutância vs. Disposição a Pagar

* **Ciclo de Urgência (2 a 4 Semanas Críticas):** `[Data]` Embora a jornada média de locação dure **~2 meses** (**DataZAP**), a janela entre filtrar os **2–5 apartamentos finalistas**, agendar visitas e assinar para não perder a unidade disputa-se em **2 a 4 semanas** (em bairros líquidos como Graças e Boa Viagem, apartamentos bem precificados alugam em dias).
* **Dores Mais Severas no Recife:** `[Data]` `[Data local]`
  1. **Omissão deliberada de endereço e taxas nos portais:** Auditoria local (14/11/2026) confirmou anúncios da OLX exibindo *"Não informado"* para condomínio/IPTU e anúncios do ZAP com valores simbólicos de R$ 1–R$ 2. No levantamento pré-pivô (`N=83`), **92,8%** apontaram ocultação de nome/número do prédio e **85,5%** sofreram divergência financeira (62,7% acima de R$ 300/mês).
  2. **Condomínio "Segundo Aluguel" & Cotas Extras (Lei nº 8.245/1991):** Embora a Lei do Inquilinato determine que despesas extraordinárias são do proprietário (art. 22, X), elas frequentemente vêm embutidas no **boleto único mensal**, exigindo pedido posterior de reembolso/comprovação com ata de assembleia — e **inquilino raramente recebe ata ou balancete antes de assinar** (administradoras como Superlógica/uCondo restringem acesso a síndicos/moradores).
  3. **Ruído Diurno (Obras 150 m) e Noturno (Bares/LUSE/Ônibus):** Demolições e fundações de torres próximas (citadas por **67,5%** no `N=83` pré-pivô) inviabilizam *home office* e descanso pós-plantão; visitas comerciais/sábado escondem o barulho de terça às 7h ou sexta às 23h.
  4. **Calor Poente ("Forno da Tarde"):** A 8° do Equador, apartamentos poentes disparam a conta da Neoenergia (relatos locais de salto de R$ 230–280 para R$ 740–785/mês de ar-condicionado). A heurística *"é nascente?"* falha quando o corretor confunde nascente com sul/diagonal ou não calcula sombra de torres vizinhas.
  5. **Alagamento por Chuva + Maré de Sizígia:** Impede saída da garagem/rua em Boa Viagem, Setúbal, Espinheiro e Madalena, risco crítico para quem não conhece a microtopografia da rua.

* **Willingness vs. Reluctance to Pay (Diagnóstico Honesto):**
  * **Por que há FORTE relutância em pagar B2C antes da visita:** `[Data]` `[Opinion]`
    * **Efeito gratuidade:** Portais (QuintoAndar, ZAP, OLX), **Mapa Sossego** (índice de ruído grátis em Recife), **Morei Aqui** (grátis), Google Maps, `r/Recife` e conversar com o porteiro custam **R$ 0**.
    * **Inflação do compromisso financeiro:** Inquilinos já comprometem **31%–34%** da renda + seguro-fiança/caução; pagar R$ 49,90 para *começar* a olhar anúncios gera resistência imediata (benchmark RevenueCat de conversão *freemium* download→pago é de apenas **1,7%–2,1%**; WTP declarada pré-pivô no `N=83` foi de apenas **~R$ 27,40–28,00** em amostra enviesada e ainda não testada em checkout real).
    * **Desvantagem de UX:** Se houver fricção de baixar app em loja para colar 2 links, **70%–85%** abandonam antes do cadastro; se os 3 créditos iniciais + devolução por descarte continuarem permitindo uso grátis infinito, ninguém paga nas 2–4 semanas de busca.
  * **Quando a disposição a pagar DESTRAVA na Persona B:** `[Opinion]`
    1. **Transferido de fora do Recife** (não pode visitar pessoalmente em vários horários, não conhece a rua, teme cair em golpe ou multa rescisória de 3 meses num contrato de R$ 45k–60k/ano): paga **R$ 49,90–99,90** via Pix/Web (ou recebe pago pelo RH) se o dossiê resolver rua + prédio + sol + maré + perguntas em <60 segundos.
    2. **Visitante ativo comparando 3–5 finalistas em campo:** aceita pagar **R$ 29,90–49,90** em pacote web-first (sem instalar app) se **1 consulta básica por prédio for gratuita** (provando valor instantâneo) e o passe destravar **comparativo lado a lado de Custo Total, Modo Visita (bússola solar/dB/GPS) e leitura de discrepâncias** para negociar R$ 200–500/mês de aluguel ou exigir cláusula de reembolso de cota extra.

### 2.3 Comportamento de Compra & Fit com o VEREDA

* **Como descobre ferramentas:** Busca no Google/TikTok/Instagram por bairro/rua (*"morar em Boa Viagem alagamento"*, *"melhores ruas Graças Recife"*), postagens transparentes no `r/Recife`, onboarding de RH/faculdade/hospital ou assinatura *"Mensagem preparada com o VEREDA"* recebida pelo corretor/parceiro.
* **Papéis na decisão:** Usuário = Comprador final (ou colaborador cujo RH paga lote B2B2C); co-decisor = cônjuge/parceiro(a) via WhatsApp.
* **Top 5 Critérios de Decisão (Ranqueados):** `[Opinion]`
  1. Custo mensal real completo (aluguel + condomínio auditado + IPTU real + estimativa de climatização/energia).
  2. Silêncio e compatibilidade com rotina de trabalho/sono (obras em 150 m, bares/LUSE, rota GTFS/a pé com Plano B).
  3. Ausência de alagamento na saída da garagem/rua.
  4. Orientação solar real (nascente vs. poente) na unidade específica.
  5. Velocidade e zero burocracia (funcionar no celular em web mobile sem exigir criação de conta longa nem download pesado).
* **Orçamento & Ciclo:** **R$ 0** na descoberta topo de funil; **R$ 29,90–49,90** (passe de 30 dias via Pix/Web) no momento pré-visita/pré-proposta dos finalistas. Ciclo de decisão: **1 a 7 dias** após bater num sinal de risco oculto no primeiro prédio gratuito.
* **Objeções Comuns:** *"Por que vou pagar R$ 49,90 se o Mapa Sossego, Google Maps e ChatGPT são de graça e só fico nesse imóvel 1–2 anos?"* / *"E se o prédio que eu achei no ZAP não for identificado ou não tiver ata?"*

---

## 3. Personas Secundárias B2B2C — Intermediários & Canais Pagantes (R$ 199–399/mês)

Os achados da Onda 1 e Onda 2 mostram que **5 a 10 assinantes B2B2C a R$ 199–399/mês superam a receita líquida de mais de 100 vendas B2C avulsas**, com CAC próximo de zero via prospecção direta local. Abaixo estão os **4 perfis B2B2C** avaliados com rigor — deixando claro quais têm fit imediato (**Advogados Imobiliários**, **Vistoriadores Cautelares** e **Assessores *Buy-Side***) e qual tem limite estrutural (**RH Porto Digital**).

| Sub-Persona B2B2C | Base em PE / Recife `[Data]` | Ticket Atual do Serviço | Dor Não Resolvida no Workflow | Fit com R$ 199–399/mês |
|---|---|---|---|---|
| **3A. Advogado Imobiliário (Diligência)** | ~47.000–47.200 inscritos OAB-PE (`DATA GAP` contagem exata de especialistas imob.) | R$ 1.500–6.000 (ou 0,5%–1%) por compra | Cego para risco urbano/físico (obras 150 m, maré, sol, laudêmio/caixão rápido); cliente chega tarde pós-*arras*; 2–3h catando dados PCR | **ALTO** *(1 cliente retido paga 10+ meses)* |
| **3B. Assessor Independente *Buy-Side*** | Fração de ~17k–18k CRECI-PE (`DATA GAP` nº exato em Recife) | Retainer + 1%–3% ou 10%–20% sobre *saving* | Provar valor técnico em **apartamentos usados** (sem comissão de construtora) e justificar desconto na mesa | **MÉDIO-ALTO** *(nicho pequeno hoje, mas altíssimo alinhamento)* |
| **3C. Engenheiro / Arquiteto Vistoriador Cautelar** | Dezenas de peritos ativos no IBAPE-PE / CREA-PE | R$ 400–1.500 (≤100 m²) a R$ 1.200–2.500+ (>120 m²) | Concorrência por preço na inspeção visual; não entrega histórico de maré, obras 150 m, ITBI fiscal ou perfil do entorno no laudo | **MÉDIO-ALTO** *(anexo técnico de entorno aumenta ticket do laudo)* |
| **3D. RH / People Ops Porto Digital** | 541 empresas, 24.079 trabalhadores (`~60–250` realocações externas/ano `[Estimate]`) | R$ 0 estruturado para juniores/plenos; concierge só C-level | Baixa demanda externa contínua (Embarque Digital/UFPE formam localmente); orçamento restrito de RH fora executivos | **BAIXO p/ SaaS mensal fixo**; viável apenas **pacote por lote/créditos anuais** |

### 3A. Advogado Imobiliário Preventivo / *Due Diligence* (Perfil Prioritário B2B2C)

* **Nome / Cargo / Estrutura:** **Dra. Renata Cavalcanti**, sócia de escritório boutique (1 a 5 advogados) ou advogada autônoma especialista em Direito Imobiliário, membro da **Comissão de Direito Imobiliário da OAB-PE** ou associada ao **IBRADIM-PE**.
* **Volume de Clientes/Mês:** `DATA GAP` para média estatística oficial em Pernambuco; na prática boutique regional, um advogado focado em imobiliário/contratual analisa tipicamente **2 a 8 transações/mês** entre consultas avulsas, revisões de minuta e *due diligences* completas `[Estimate]`.
* **Workflow Exato Hoje:**
  1. Recebe endereço/documentos via **WhatsApp** do cliente comprador (muitas vezes *depois* de assinar proposta ou pagar sinal).
  2. Abre **RI Digital (ONR)** para pedir matrícula atualizada/cadeia dominial (~R$ 17,58 visualização; ~R$ 52–64+ certidão em PE).
  3. Acessa **PJe (TJPE / TRF5 / TRT6)** e **Jusbrasil** para buscar ações cíveis, trabalhistas e execuções nos CPFs/CNPJs dos vendedores e no CNPJ do condomínio.
  4. Consulta portais da **Prefeitura do Recife (Sefin/CND IPTU)**, **SPU** (se Terreno de Marinha) e certidões federais/estaduais manualmente.
  5. Organiza arquivos em pastas locais / Google Drive / **Astrea / Projuris / Legal One** e redige **Parecer Jurídico (Word/PDF)** classificando riscos registrais e de evicção.
  * *O que NÃO entra hoje:* licenciamento de obras em 150 m, alagamento histórico da via/Defesa Civil, orientação solar, histórico ITBI por edifício e divergências entre anúncios.
* **Orçamento Atual de Ferramentas:** `[Data]` Advogados do nicho já pagam **R$ 908/ano PF** (ou **R$ 93/mês**; **R$ 2.720/ano PJ**) só de associação ao IBRADIM, além de assinaturas de **Jusbrasil Pro**, **Astrea/Projuris** (R$ 100–400+/mês) e custas repassadas de RI Digital. **R$ 199–399/mês** cabe no orçamento operacional com folga se **1 único cliente de R$ 2.500–5.000** vier ou for melhor atendido pelo software.
* **Por que Assinaria / Empacotaria (R$ 199–399/mês):**
  1. **Anexo Técnico Factual ("Dossiê Urbano & Fiscal do Endereço"):** Economia de 1,5–3 horas na pesquisa manual em portais da Prefeitura/SPU/Defesa Civil, entregue como anexo factual objetivo do escritório (sem invadir parecer jurídico — respeitando **Recomendação CFOAB nº 001/2024**).
  2. **Diferencial Competitivo e Geração de Leads Pré-Arras:** Ao oferecer uma *"triagem rápida gratuita/barata antes de fechar proposta"* via link próprio ou marca co-branded, o advogado captura o comprador **antes** de ele assinar um contrato ruim e converte em contrato completo de R$ 2.000–5.000.
* **Objeções de Compra:**
  * *"Posso ser responsabilizado pela OAB ou pelo cliente se um dado da Prefeitura estiver desatualizado ou se o app der 'parecer'?"* → Exige que o relatório declare explicitamente **origem oficial, data de corte (ex.: Defesa Civil até 2024), zero juízo jurídico e zero nota/veredito**.
  * *"Meu cliente só me procura no imóvel único final, não comparando 5 apartamentos."* → O pacote B2B permite rodar dossiê do imóvel escolhido + 2–3 comparáveis de ITBI do mesmo prédio/rua para ancorar negociação de desconto.

### 3B. Engenheiro / Arquiteto Vistoriador Cautelar (IBAPE-PE / CREA-PE / CAU)

* **Nome / Cargo / Estrutura:** **Eng. Henrique Bezerra**, engenheiro civil autônomo ou sócio de pequena consultoria diagnóstica listado no **IBAPE-PE** ou atuando em vistorias pré-compra e LTVP (Lei PE 13.032/2006) no Recife.
* **Volume de Clientes/Mês:** `DATA GAP` para média estatística; consultorias diagnósticas individuais executam tipicamente **4 a 15 vistorias/mês** entre laudos cautelares de vizinhança, pré-compra e inspeções prediais `[Estimate]`.
* **Workflow Exato Hoje:** Contato via **WhatsApp/Instagram/Google Busca** → orçamento por m² (**R$ 400–1.500** padrão até ~100 m²; **R$ 1.200–2.500+** >120 m²) → visita física com câmera, trena laser, martelo de percussão, higrômetro e checklist em Word/Excel/app genérico de fotos → emissão do **Laudo Técnico + ART no CREA-PE**.
* **Por que Pagaria R$ 199/mês:** Hoje entrega apenas o "da porta para dentro" (ou área comum imediata). Anexar uma folha factual de **entorno (alvarás de demolição/fundação em 150 m — crítico para vistoria cautelar de vizinhança! —, histórico de alagamento Defesa Civil, idade cadastral/pavimentos e mapa solar)** permite cobrar um *add-on* "Pacote Pré-Compra Completo" (+R$ 200–350 por cliente), pagando a assinatura mensal já no **1º ou 2º laudo do mês**.
* **Objeções:** *"O app não substitui minha ART nem analisa patologia de parede."* → Correto: o VEREDA nunca emite diagnóstico estrutural (Lei 5.194/66), entrega apenas contexto urbano/cadastral datado para o engenheiro usar como insumo.

### 3C. Assessor Imobiliário Independente *Buy-Side* / *Personal Shopper* (CRECI-PE)

* **Nome / Cargo / Estrutura:** **Rodrigo Moraes**, corretor autônomo inscrito no **CRECI-PE** que se posiciona como consultor exclusivo do comprador (especialmente para compradores de **apartamentos usados** ou clientes de fora do estado buscando em Boa Viagem/Zona Norte).
* **Volume de Clientes/Mês:** **2 a 6 clientes ativos em carteira** (jornada de 2–4 meses por cliente; 1–3 fechamentos/mês ou bimestre) `[Estimate]`.
* **Stack Atual:** WhatsApp, **HubSpot/Pipedrive**, **Jetimob/Kenlo/Superlógica**, ZAP/VivaReal/OLX, **Google My Maps / Waze** (rotas de visita), **Notion/PDF** (comparativos manuais), **ClickSign/DocuSign**, **RI Digital**. Orçamento de software: já paga **R$ 75–350/mês** em CRM/assinatura.
* **Por que Pagaria R$ 199–399/mês:** A **MySide** domina lançamentos novos com comissão de 5% da incorporadora, mas deixa órfãos os **compradores de usados**. Um consultor *buy-side* independente precisa justificar *retainer* ou *success fee* de 10%–20% sobre a economia negociada: o VEREDA gera em 2 minutos a evidência de **ITBI histórico do prédio, obras vizinhas 150 m, divergências de anúncio e laudêmio/Sefin** para fundamentar contrapropostas de -10% a -14% sem parecer "achismo de corretor" (e sem violar a Lei 6.530/78, pois ele possui CRECI).
* **Objeções:** *"A quantidade de clientes buy-side puros em usados no Recife ainda é pequena; preciso também de indicação de imóveis."* → Exige busca multi-imóvel flexível + relatórios exportáveis para enviar no WhatsApp do cliente comprador.

### 3D. RH / People Ops e Programas de Onboarding (Porto Digital / CESAR / Empresas com Transferência)

* **Realidade Verificada (Contra a Ilusão de Grande Escala):** `[Data]` `[Estimate]` O **Porto Digital** tem **541 empresas e 24.079 colaboradores** (+2.528 vagas líquidas em 2025), mas grande parte das contratações vem do ecossistema local (**Embarque Digital** + **UFPE** + **CESAR School**), com salário médio estadual de TIC em **R$ 5.200–5.300/mês** e operação majoritariamente híbrida. Estimam-se apenas **~125 a 250 contratações vindas de fora por ano** (~60–125 com auxílio formal de mudança).
* **Workflow Atual:** RH usa **Sólides/Gupy**, envia manual estático em PDF/Notion de boas-vindas ao Recife e indica grupos de WhatsApp internos da empresa.
* **Objeção Fatal para SaaS Mensal de R$ 299–399:** Se uma empresa média do Porto Digital traz apenas 2 a 5 pessoas de fora por ano, pagar R$ 3.600–4.800/ano por software de realocação não fecha conta.
* **Modelo Viável para Esse Perfil:** Não vender licença mensal fixa por RH pequeno; vender **pacotes pré-pagos de passes B2C / Concierge por lote anual** (ex.: 10 passes/ano a R$ 490 ou inclusão no *welcome kit* para movimentação interna na cidade) em grandes empregadores (CESAR, grandes consultorias, hospitais, bancos/órgãos públicos com remoção anual).

---

## 4. ANTI-PERSONAS CRÍTICAS (Quem NÃO É Nosso Cliente)

Esta seção confronta diretamente suposições levantadas na sabatina do fundador e no pré-pivô para evitar desperdício de engenharia, marketing e posicionamento com públicos de **LTV zero ou incentivo hostil**.

### 4.1 Turistas de Curta Temporada / Hóspedes de Airbnb
* **Por que foi cogitada:** Na sabatina de intake (15/11/2026), o fundador declarou a visão de *"fazer em alguns segundos um turista virar um local"*.
* **Por que os dados refutam categoricamente:** `[Data]`
  * Segundo a **Setur-PE / Empetur / Observatório de Turismo do Recife**, a permanência média do turista na capital é de apenas **~6 dias** (receptive geral/lazer) e **2 a 2,5 dias** (feriados e viagens de negócios/eventos).
  * Boa Viagem concentra **>1.140 anúncios ativos no Airbnb** (diária média R$ 200–430, ocupação média 48%–62%, foco em estúdios/1 quarto a <500 m da praia), onde a decisão é tomada dentro de **Airbnb/Booking** por fotos, localização na orla e *reviews* verificados de hóspedes anteriores.
  * **Zero aderência à dor central do VEREDA:** Um turista hospedado por 3–6 dias **não paga IPTU**, **não paga condomínio/cota extra**, **não sofre laudêmio de 5%**, **não financia prédio-caixão**, **não assina contrato de 30 meses sob Lei do Inquilinato**, **não avalia alvará de obra de 24 meses** e **não compara rotina de ônibus GTFS casa-trabalho**.
  * **Risco ao produto:** Tentar servir turismo dilui o produto em guia de viagem (competindo contra Google Maps/"Ask Maps", TripAdvisor e Instagram gratuitos) e atrai avaliações de 1 estrela por usuários fora do fluxo de moradia.

### 4.2 Calouros Sisu de Baixa Renda / Caçadores de Aluguel Econômico (<R$ 1.500/mês)
* **Por que parece tentador:** São fáceis de acessar (UFPE tem **>30.000 alunos de graduação** e **>10.000 de pós-graduação**; 43,4% da amostra pré-pivô `N=83` veio de estudantes/pós CIn-UFPE e CESAR School), sofrem com alagamentos, falta de informação e moradia precária.
* **Por que NÃO é cliente pagante:** `[Data]`
  * Pesquisas **FONAPRACE / ANDIFES** mostram que a maioria expressiva dos estudantes de universidades federais provém de famílias com renda *per capita* **inferior a 1,5 salário mínimo**; os editais da **PROAES-UFPE (PNAES)** limitam auxílios-moradia e CEUs a renda *per capita* de **até 1 salário mínimo**.
  * **Choque geográfico e de renda no IBGE Censo 2022 (`censo-renda-setores.json`):** Esse público concentra-se em repúblicas e kitnets na **Várzea** (mediana do responsável **R$ 1.500**, média **R$ 2.795**), **Cidade Universitária** (mediana **R$ 1.600**) e **Iputinga** (mediana **R$ 1.500**) — bairros que **nem sequer estão cobertos pelos 5 bairros-piloto** e operam com orçamento habitacional dividido **abaixo de R$ 1.500/mês**.
  * **Papel exclusivo:** Podem atuar apenas como **usuários gratuitos de topo orgânico / testadores de usabilidade ou colaboradores de campo**, **nunca** como base para projetar receita B2C ou WTP de R$ 49,90–299.

### 4.3 Corretores Tradicionais *Sell-Side* & Corretores de Stand de Lançamentos
* **Por que foi cogitada:** Na sabatina inicial, o fundador cogitou vender *"avaliação de ap"* ou ferramenta para corretores venderem imóveis (base de **~17.000–18.000 profissionais no CRECI-PE**).
* **Por que os dados vetam:** `[Data]` `[Opinion]`
  * **Conflito de interesse econômico irreconciliável:** O corretor *sell-side* recebe **5% a 8% de comissão do vendedor/incorporadora** apenas se o negócio fechar. Qualquer fato adverso exposto pelo VEREDA — obra de demolição em 150 m, histórico de alagamento, mediana de ITBI 25% abaixo do preço pedido, Terreno de Marinha ou prédio-caixão — **reduz a conversão e derruba a comissão dele**.
  * **Precedente empírico de retaliação (caso Zillow/First Street, nov/2025):** Pressão organizada de corretores/associações forçou o maior portal dos EUA a **remover escores de risco climático de >1 milhão de anúncios** (seguido por ações de procuradores estaduais em ago–out/2026). No Brasil, o Grupo OLX já fechou integrações para proteger assinantes pagantes do Canal Pro.
  * **Risco jurídico:** Emitir "preço justo" para corretores esbarra em prerrogativa **CNAI/PTAM (Lei 6.530/78, Res. COFECI 1.066/2007)** e risco de dano moral à PJ incorporadora (**Súmula 227 STJ**) caso haja erro factual ou selo de risco.

### 4.4 Otimizadores de Ferramentas Gratuitas ("Combo ChatGPT Grátis + Porteiro + Mapa Sossego + Grupos")
* **Quem são:** Buscadores casuais ou com tempo livre que já têm o PDF ou acham que "dar uma passada à noite, perguntar ao porteiro, olhar no **Mapa Sossego** (`R$ 0`), perguntar no **`r/Recife`** (`R$ 0`) e jogar a minuta no **ChatGPT/Gemini gratuito** (`R$ 0`) ou **uCondo Móra AI** (`R$ 0` para moradores)" resolve 100% da busca.
* **Por que NÃO pagam:** `[Data]` `[Opinion]`
  * Se o VEREDA tentar competir vendendo *"resumo de PDF/ata por IA"* ou *"nível de ruído da rua"* a **R$ 49,90**, perde imediatamente para alternativas de custo zero que já dominam esse trabalho.
  * **Alerta de engenharia:** Como já detectado na Onda 2 sobre o fluxo de créditos do protótipo (`3 créditos iniciais + devolução por motivo de descarte`), esse perfil explora qualquer brecha de *Give-to-Get* infinito sem nunca passar pelo checkout. Só converte quem enfrenta o **muro pré-proposta sem PDF**, **risco de perder sinal/multa alta** ou **necessidade de comparação multi-imóvel auditada em campo**.

---

## 5. Onde Alcançá-los (Canais Concretos em Recife e Brasil)

Priorização realista considerando uma equipe part-time (**10–20h/semana**) e orçamento enxuto (**R$ 0–5 mil**), separando canais **viáveis para receita <90 dias**, canais **de topo orgânico/validação** e canais **proibidos por economia unitária**.

| Canal / Touchpoint Concreto | Persona Alvo | Densidade / Alcance Estimado `[Data]` | Custo Direto Estimado | Acessibilidade Real (<90d) & Tática Recomendada |
|---|---|---|---|---|
| **1. Abordagem Direta OAB-PE (CDI) + IBRADIM-PE** | **B2B2C 3A** (Advogados Imob.) & **Persona A** (indireta) | **~47.000–47.200 advogados na OAB-PE** (dezenas na Comissão de Dir. Imobiliário + rede IBRADIM-PE; Congresso Regional NE em Recife e *After Hours*) `[Data]` | **R$ 0–500** *(outreach direto LinkedIn / cafés; anuidade IBRADIM ref. R$ 908/ano)* | **ALTA.** Consultar listagem pública de comissões em `oabpe.org.br`, abordar 30–40 especialistas em Direito Imobiliário no Recife oferecendo **"3 Dossiês Urbanos & Fiscais anexáveis ao próximo parecer"** em troca de entrevista e piloto a **R$ 199–299/mês**. |
| **2. Diretório Público IBAPE-PE / CREA-PE (Vistoriadores)** | **B2B2C 3C** (Eng./Arq. Diagnósticos) & **Persona A** | Dezenas de peritos associados listados em `ibape-pe.org.br`; eventos **CEAD** e **Simpósio Mercado Imobiliário Day** `[Data]` | **R$ 0–300** *(outreach direto + material PDF amostra)* | **ALTA.** Lista de associados é pública no site do IBAPE-PE. Propor pacote adicional de entorno (obras 150 m + maré + solar + cadastro) anexável à ART de vistoria cautelar para aumentar o ticket do perito. |
| **3. Rede *Buy-Side* Independente (CRECI-PE seletivo) + Conteúdo Anti-Cilada** | **B2B2C 3B** (*Personal Shoppers*) & **Persona A** | Subset restrito de ~17k–18k CRECI-PE (`DATA GAP` contagem exata *buy-side*) `[Data]` | **R$ 0–300** | **MÉDIA.** Filtrar no LinkedIn/Instagram corretores que anunciam *"assessoria para compradores"* ou *"personal shopper imobiliário em Recife"* (excluir estritamente stands e captadores exclusivos de construtoras). |
| **4. Ecossistema Porto Digital / NGPD / CESAR / Hospitais (HC-UFPE)** | **Persona B** (Híbridos/Transferidos) & **B2B2C 3D** | **541 empresas, 24.079 trabalhadores** no Porto Digital; **REC'n'Play**, meetups tech (ETE Porto Digital), portal CESAR e residência médica HC-UFPE `[Data]` | **R$ 0** *(parceria de comunidade / palestra / guia)* | **MÉDIA-ALTA (Topo orgânico); BAIXA (SaaS RH fixo).** Distribuir **"Guia Web Gratuito de Mudança para os 5 Bairros"** para novos contratados/residentes médicos, monetizando via **Modo Visita / Comparação Web Pix** ou **lote anual pré-pago** para grandes empregadores. |
| **5. `r/Recife` + Grupos de Bairros (Boa Viagem, Graças, Casa Forte)** | **Persona B** (Locatários) & **Persona A** | **`r/Recife` ~81.000 membros** `[Data]`; grupos de bairro no Facebook/WhatsApp (`DATA GAP` membros ativos exatos) | **R$ 0** | **ALTA para validação / orgânico — PROIBIDO *shadow ads*.** Moderação e *Crowd Control* punem *astroturfing*. Usar **postagem transparente** (*"Mapeamos 2.688 prédios do Recife com dados da Prefeitura para checar alagamento, obras 150 m e sol — testem grátis 1 prédio e apontem erros"*). |
| **6. Micro-Criadores Locais de Recife (Arquitetura / Moradia / Finanças)** | **Persona A & B** | Perfis locais de **5k–50k seguidores** em PE *(vs. `@recifeordinario` ~2,2M que gera tráfego genérico disperso)* `[Data]` | **R$ 1.500–3.000** + **comissão Pix 25%–30%** | **MÉDIA-ALTA** *(se Web-first + Pix sem download obrigatório)*. Replicar playbook **Olho no Carro**: vídeo mostrando descoberta real num prédio (sem citar marcas proibidas no Campus Mobile `11.20(iv)`) + link direto web com cupom. |
| **7. SEO de Cauda Longa por Edifício / Dor Hiperlocal + Google Search Fundo de Funil** | **Persona A** (Compra Usado) | CPC Google Search BR: *"apartamentos em boa viagem"* **R$ 5,50–12,00**, *"comprar ap recife"* **R$ 4,00–9,00**, *"due diligence imobiliária"* **R$ 7,00–15,00+** `[Data]` | **SEO: R$ 0–200** (3–9 meses); **Ads: R$ 1.500+/mês** | **ASSIMÉTRICA.** **Vetar Google Ads para passe de R$ 49,90** (CAC destrói margem). Usar SEO programático por **edifício/rua e riscos locais** (`Terreno de Marinha Boa Viagem`, `alvarás obra Graças`) e Ads **somente** se testar **Concierge R$ 299+** ou captação B2B2C. |
| **8. UFPE (CIn / PROAES / DCE) & Calouros Sisu** | **Validação / *Ground Truth*** (NÃO monetização) | >30k graduação + >10k pós UFPE `[Data]` | **R$ 0** | **ALTA p/ testes, NULA p/ receita.** Usar apenas para recrutamento rápido de testes de usabilidade e coleta de fotos/ground-truth; não projetar receita nem WTP sobre essa base. |
| **9. SECOVI-PE & ADEMI-PE (Eventos Patronais)** | **Parceria Institucional / Alerta Regulatório** | **>1.700–2.000 condomínios** formalizados na capital (**>10.000** na RMR); Congresso Gestão Condominial SECOVI-PE (Teatro RioMar) & Ademi Fórum `[Data]` | Alto (patrocínio corporativo) | **BAIXA para vendas no Ano 1.** Representam síndicos, administradoras e incorporadoras (*sell-side*). Úteis para *networking* e diálogo regulatório/Sefin, **não** como canal de venda de ferramenta adversarial ao anúncio. |

---

## Flags

**Red Flags:**
- **Colapso de público se perseguir falas de "turista" ou universitários Sisu:** Turistas ficam **2 a 6 dias** em Recife (zero dor de condomínio/ITBI/contrato 30 meses) e calouros Sisu vivem na Várzea/CDU com mediana de renda do responsável de **R$ 1.500** e orçamento <R$ 1.500/mês (fora dos 5 bairros e sem WTP para R$ 49,90–299).
- **Conflito fatal no canal *sell-side* (17–18 mil corretores CRECI-PE tradicionais e stands):** Tentar vender transparência negativa para quem ganha 5%–8% fechando imóveis ocultos replica a armadilha **Zillow/First Street (nov/2025)** e corrói a confiança do comprador.
- **Inviabilidade matemática de Ads B2C para R$ 49,90:** Com CPC de **R$ 4,00–12,00** em buscas do Recife e teto CAC de **R$ 13,30** (para LTV:CAC 3:1), tráfego pago B2C destrói caixa antes da validação; só fecha conta em **Concierge (R$ 249–349)** ou **B2B2C (R$ 199–399/mês)**.
- **Zero testes reais pós-pivô (`0/10`) e viés da amostra `N=83`:** Toda a evidência primária interna atual vem de outubro/2026 pré-pivô com 73,5% de estudantes/tech jovens — **nenhum comprador de usado real (35–55+ anos) nem advogado/vistoriador pagante validou o fluxo atual `VE01–VE15`**.

**Yellow Flags:**
- **Risco do teste planejado pelo fundador ("irmã tech + adultos conhecidos"):** Viés de cortesia (*Mom Test*) pode gerar falso positivo de WTP se não houver cobrança real ou episódio concreto de mudança nos últimos 90 dias.
- **Subestimação do volume de *Relocation* no Porto Digital:** Apesar das 541 empresas e 24.079 colaboradores, a contratação apoia-se em formação local (Embarque Digital/UFPE), restando nicho pequeno (~125–250 externos/ano estimados) — insuficiente para sustentar SaaS mensal por RH pequeno sem expandir para benefícios a colaboradores em mudança intrametropolitana.
- **Barreira de acesso pré-proposta a atas e balancetes (Persona A e B):** Superlógica/uCondo restringem documentos a síndicos/moradores; o produto precisa entregar valor decisório imediato **antes** da posse do PDF (dados urbanos, obras 150 m, ITBI, maré, sol, laudêmio/caixão, Modo Visita) e cobrar o salto de ticket (**R$ 249–349**) apenas quando o usuário/advogado já tem o pacote documental pré-sinal.

---

## Data Gaps

1. **`DATA GAP` — Contagem exata de advogados especialistas em Due Diligence Imobiliária na OAB-PE / IBRADIM-PE e seu volume mensal médio de clientes:** Sabe-se que a OAB-PE possui ~47.000–47.200 inscritos e uma CDI ativa, mas não há estatística pública isolando quantos atuam especificamente em consultoria preventiva imobiliária no Recife nem a média mensal de processos de *due diligence* por escritório.
2. **`DATA GAP` — Contagem exata de corretores *Buy-Side* / *Personal Shoppers* independentes ativos no CRECI-PE e faturamento médio em usados:** O CRECI-PE contabiliza ~17.000–18.000 inscritos totais, sem desagregação pública entre *sell-side* tradicional e *buy-side* exclusivo; além disso, a atuação presencial da MySide em Recife não estava confirmada até out/2026.
3. **`DATA GAP` — Demografia etária e de renda granular exclusiva dos compradores e inquilinos nos 5 bairros-piloto do Recife (2024–2026):** O IBGE Censo 2022 fornece moradores, responsáveis e renda por bairro/setor (`censo-renda-setores.json`), e o FipeZAP/DataZAP/QuintoAndar fornecem perfis etários e faixas de renda **nacionais**; porém, não há cruzamento público oficial isolando idade e renda *apenas dos compradores/locatários recentes* dentro de Boa Viagem, Graças, Casa Forte, Espinheiro e Madalena.
4. **`DATA GAP` — Volume anual auditado de transferências corporativas para o Recife (Porto Digital, Suape, polo médico/federal):** Não há série pública oficial do Porto Digital ou consultorias de RH quantificando quantos dos +2.528 novos postos líquidos de 2025 vieram de fora da RMR com ou sem pacote de realocação.
5. **`DATA GAP` — Volume exato de transações anuais de apartamentos usados (financiados + à vista) nos 5 bairros-piloto do Recife:** A arrecadação total de ITBI da Sefin e os lançamentos primários (ADEMI-PE) são públicos, mas o volume unitário exato de apartamentos *usados* transacionados por bairro depende do processamento dos CSVs anuais de ITBI e filtro de tipologia residencial.
6. **`DATA GAP` — Conversão real de checkout e elasticidade de preço pós-pivô do VEREDA (R$ 49,90 vs. R$ 299 vs. R$ 199–399/mês B2B2C):** Não existem pagamentos observados, sessões medidas ou testes de campo concluídos na versão `VE01–VE15` até 15/11/2026.
7. **`DATA GAP` — Densidade exata de membros ativos em grupos fechados de moradores (Facebook/WhatsApp) e taxas de anuidade vigentes do IBAPE-PE / OAB-PE CDI:** Valores exatos de anuidade do IBAPE-PE e lista quantificada de membros em grupos privados de bairro não são publicados abertamente sem associação ou ingresso direto.

---

## Sources

### Tier 1 (Fontes Oficiais, Censitárias, Regulatórias e Microdados Verificados)
- **IBGE — Censo Demográfico 2022:** `Agregados_por_bairros_renda_responsavel_BR_20260508_csv.zip` (microdados integrados em `src/dados/recife/censo-renda-setores.json` para Casa Forte, Graças, Espinheiro, Boa Viagem, Madalena, Várzea, Cidade Universitária e Iputinga) & SIDRA 9928 (547.539 domicílios ocupados, 145.805 alugados, 58.392 apartamentos alugados no Recife).
- **IBGE — PNAD Contínua (2025):** Proporção nacional de domicílios alugados (23,8%, 18,9 milhões) e trabalho no domicílio (~7,9%).
- **Banco Central do Brasil / Copom & Caixa Econômica Federal:** Selic mantida em 13,75% a.a. (nov/2026); condições SBPE/SFH (financiamento até 80%, teto R$ 2,25M, idade + prazo ≤ 80 anos e 6 meses, comprometimento ≤ 30% conforme Lei nº 8.692/1993).
- **Legislação & Normas:** Código Civil (arts. 417–420 sobre arras; art. 1.345), Código Tributário Nacional (art. 130), Lei do Inquilinato (Lei nº 8.245/1991, arts. 22, 23 e 45), Lei nº 6.530/1978 & Res. COFECI nº 1.066/2007 (CRECI/PTAM), Lei nº 5.194/1966 & NBR 13752/16747 (CREA/engenharia), Lei Estadual PE nº 13.032/2006 (vistoria predial periódica), Recomendação CFOAB nº 001/2024 (IA na advocacia), Súmula 227 STJ, SPU / Gov.br (Terrenos de Marinha: 5% laudêmio, 0,6% foro, 2%–5% taxa de ocupação).
- **Entidades e Programas Oficiais:** **OAB-PE** (`oabpe.org.br`, ~47.000–47.200 advogados e CDI), **CRECI-PE** (`creci-pe.gov.br`, ~17.000–18.000 inscritos), **UFPE / PROAES / PNAES** (`ufpe.br`, >30k graduação, >10k pós, corte de 1 SM *per capita*), **ANDIFES / FONAPRACE** (`andifes.org.br`, perfil socioeconômico nacional <1,5 SM *per capita*), **Setur-PE / Empetur** (`setur.pe.gov.br`, `empetur.pe.gov.br`, permanência média ~6 dias geral / 2–2,5 dias feriados), **Prefeitura do Recife / Embarque Digital / Dados Abertos** (`recife.pe.gov.br`, `dados.recife.pe.gov.br`), **ONR / RI Digital** (emolumentos PE / Tabela TJPE).

### Tier 2 (Índices Setoriais, Pesquisas de Mercado, Associações & Imprensa Econômica)
- **Fipe / Índice FipeZAP & Raio-X FipeZAP (2024–2026):** `fipe.org.br` (idade média ~46–47 anos, peso >50 anos, renda >R$ 10k, ~10 semanas de busca, mediana 7 visitas, 71%–77% usados, 67%–71% com desconto de 10%–14%, 60%–65% moradia com 64%–72% "morar com alguém"; Recife m² venda >R$ 9.044–9.179/m² e aluguel R$ 60,89–64,39/m², yield 8,3%–8,56% a.a., recortes Boa Viagem, Graças, Parnamirim, Madalena, Espinheiro).
- **Grupo OLX / DataZAP & QuintoAndar / Datafolha (Censo de Moradia):** `grupoolx.com.br`, `datazap.com.br`, `quintoandar.com.br`, `exame.com`, `imobireport.com.br` (jornada de compra ~4 meses vs. locação ~2 meses; 33% intenção de mudança / 58% entre inquilinos; 31%–34% comprometimento da renda; motivos de mudança; recortes por SM; >2/3 presencial/híbrido).
- **ABECIP & ADEMI-PE / Brain Inteligência Estratégica:** `abecip.org.br` (~70% usados no SBPE; -14% unidades em 2025), `ademi-pe.com.br`, `folhape.com.br` (VGV RMR R$ 10,1B / 12.061 unid. 2025; presidência Leonardo Pessoa de Queiroz 2026–2027; eventos).
- **SECOVI-PE, IBRADIM-PE & IBAPE-PE:** `secovi-pe.com.br` (presidência Luciano Novaes 2026+, Congresso de Gestão Condominial), `ibradim.org.br` / `congressosibradim.com.br` (Congresso Regional NE set/2025 Recife, *After Hours*, planos R$ 908/ano PF e R$ 2.720/ano PJ), `ibape-pe.org.br` (diretório de associados peritos, CEAD, Simpósio Mercado Imobiliário Day).
- **Porto Digital / NGPD / CESAR & uCondo Censo Condominial:** `cesar.org.br`, `movimentoeconomico.com.br`, `folhape.com.br`, `ucondo.com.br` (541 empresas, 24.079 trabalhadores, +2.528 vagas 2025, salário médio TIC PE R$ 5.200–5.300; condomínio +24,9% e inadimplência 11,95%).
- **Imprensa & Benchmarks Competitivos (Ondas 1–2):** *Diário de Pernambuco*, *Folha de Pernambuco*, *O Globo/G1* (Terrenos de Marinha ~40% Recife, 431 prédios-caixão FCVS R$ 1,7B), *RevenueCat* (2,1% mediana *freemium*), *TechCrunch/Guardian* (caso Zillow/First Street nov/2025–2026), `myside.com.br`.

### Tier 3 (Comunidades, Benchmarks Comerciais, Agências Digitais & Coleta Exploratória Interna)
- **AirDNA / Airbtics:** Recife (~3.200–16.000 anúncios amplos; Boa Viagem >1.140 anúncios ativos Airbnb, ocupação 48%–62%, ADR R$ 200–430).
- **Comunidades & Influenciadores:** `reddit.com/r/Recife` (~81 mil inscritos), HypeAuditor (`@recifeordinario` ~2,2M seguidores).
- **Benchmarks de Preço de Serviços & Mídia Paga (BR/PE):** Escritórios imobiliários e periciais (`projuris.com.br`, `barbieriadvogados.com`, `srodriguesadvogados.com.br`, `buscahonorarios.com.br`, `rebekapedrozo.eng.br`, `peritonengenharia.com.br`, `marinadomingos.com.br` — due diligence R$ 1.500–6.000 / 0,5%–1%; vistoria cautelar R$ 400–2.500+); agências digitais (`ciclicko.com.br`, `hoogli.com.br`, `websiteimobiliario.com.br` — CPC imobiliário/jurídico BR R$ 4,00–15,00+); `olhonocarro.com.br` (R$ 64,90), `mapasossego.com.br` (R$ 0), `moreiaqui.com.br` (R$ 0).
- **Evidência Interna Pré-Pivô & Contexto Repositório:** `docs/pesquisas-campo/{PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md,PESQUISA_QUANTITATIVA_UFPE_83.md,ENTREVISTAS_QUALITATIVAS_5_CASOS.md}` (out/2026, pré-pivô, amostra com viés UFPE/CESAR/Porto Digital); `vereda-negocio/vereda/00-intake/{brief.md,brainstorm.md}` e `vereda-negocio/vereda/01-discovery/raw/{market-size,trends,regulatory,adjacent-expansion,direct-competitors,indirect-competitors,competitor-gtm,emerging-competitors}.md`.
