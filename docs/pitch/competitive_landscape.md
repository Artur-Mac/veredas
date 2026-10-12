# Paisagem Competitiva & Análise de Substitutos — VEREDA
**Campus Mobile 15ª Edição — Categoria: Tecnologias Urbanas**  
**Data:** Outubro de 2026

---

## 1. Visão Geral do Ecossistema Imobiliário & Inteligência de Moradia

O mercado de tecnologia imobiliária (*Proptech*) é historicamente estruturado em torno da **descoberta e intermediação de transações**. O VEREDA se posiciona em uma camada distinta: a **subscrição de decisão pós-busca a favor do interessado** (*decision intelligence companion*).

Abaixo está o mapeamento detalhado dos concorrentes diretos, substitutos adjacentes e referências globais.

---

## 2. Análise Detalhada por Agente de Mercado

### 1. Portais de Classificados: ZAP Imóveis, VivaReal (Grupo OLX) & QuintoAndar
* **Usuário-alvo & Job-to-be-Done:** Corretores, imobiliárias e proprietários que buscam atrair interessados (*lead generation*); usuários finais em fase de busca e descoberta de imóveis disponíveis.
* **Jornada do Usuário:** Filtros de preço, bairro e dormitórios $\rightarrow$ Listagem de centenas de cards com fotos de marketing $\rightarrow$ Contato com corretor.
* **Esforço Exigido:** Alto. O usuário precisa garimpar dezenas de páginas, agendar múltiplas visitas e descobrir problemas por conta própria.
* **Capacidade de Dados:** Extensa base de anúncios ativos, histórico de preços ofertados e estimativas paramétricas de aluguel/venda.
* **Rastreabilidade & Transparência:** **Baixa a Moderada.** Omissão sistemática do número de fachada do edifício para evitar que o comprador ou inquilino contate diretamente o síndico ou proprietário, contornando a comissão de intermediação. Encargos de condomínio são autodeclarados e frequentemente desatualizados.
* **Tratamento de Dados Ausentes:** Dados ausentes ou desfavoráveis (como ruído de tráfego, aclive acentuado ou obras vizinhas) são simplesmente ignorados na interface.
* **Limitações Comprovadas:** Conflito estrutural de modelo de negócios: a receita dos portais provém da venda de anúncios e pacotes para corretores. Apontar riscos ou defeitos graves em um imóvel derruba a taxa de conversão do lead.
* **Sobreposição com o VEREDA:** O VEREDA não concorre na listagem de imóveis; ele consome a URL gerada por esses portais como ponto de partida da auditoria.

---

### 2. Plataformas de Inteligência e Avaliação: DataZAP & FipeZAP
* **Usuário-alvo & Job-to-be-Done:** Incorporadoras, fundos imobiliários, bancos e imobiliárias que necessitam de precificação estatística e análise macroeconômica de mercado (AVM - *Automated Valuation Models*).
* **Jornada do Usuário:** Assinaturas corporativas B2B $\rightarrow$ Dashboards de preço por metro quadrado, tempo de anúncio e absorção por região.
* **Esforço Exigido:** Elevado (voltado a analistas financeiros de mercado).
* **Capacidade de Dados:** Altíssima para séries temporais de preços, liquidez e demografia censitária agregada.
* **Rastreabilidade & Transparência:** Alta nos agregados estatísticos, mas descolada da experiência micro da unidade específica.
* **Tratamento de Dados Ausentes:** Modelagem estatística inferencial (regressões lineares/hedônicas preenchem lacunas com base na média do bairro).
* **Limitações Comprovadas:** Produto B2B inacessível e incompreensível para o cidadão comum. Não audita se a unidade tem infiltração, se o lote vizinho tem alvará de obra pesada ou se a caminhada até o metrô é inviável para idosos.
* **Sobreposição com o VEREDA:** O VEREDA foca no microterritório e no bolso da família, não em valuation macroeconômico corporativo.

---

### 3. Referência Global: Sprift (Reino Unido)
* **Usuário-alvo & Job-to-be-Done:** Corretores imobiliários, avaliadores (*surveyors*) e compradores residenciais no Reino Unido que necessitam de dossiês confiáveis sobre a propriedade (*Key Facts for Buyers*).
* **Jornada do Usuário:** Consulta pelo código postal ou código cadastral único (UPRN) $\rightarrow$ Emissão de relatório digital e PDF com mais de 100 indicadores auditados.
* **Capacidade de Dados:** Integração profunda com o cadastro predial unificado britânico (HM Land Registry, Ordnance Survey, Environment Agency, Ofcom e conselhos municipais). Relata riscos de inundação, restrições de planejamento (*planning permissions*), eficiência energética (EPC) e velocidade de internet.
* **Tratamento de Dados Ausentes:** Sinalização formal de informações pendentes de vistoria legal (*conveyancing*).
* **Limitações Comprovadas:** Modelo B2B/B2B2C formatado estritamente para o arcabouço regulatório britânico, onde existe o UPRN (*Unique Property Reference Number*). Não opera no Brasil nem possui soluções para o desafio da fragmentação cadastral brasileira.
* **Inspiração para o VEREDA:** Prova de conceito global de que dossiês prediais com dados oficiais agregados geram valor imediato e reduzem drasticamente o tempo de decisão de compra e locação.

---

### 4. Assistentes de Inteligência Artificial Generativa: ChatGPT, Claude, Gemini
* **Usuário-alvo & Job-to-be-Done:** Usuários que colam links ou descrições pedindo conselhos gerais sobre o imóvel ou bairro.
* **Jornada do Usuário:** Prompt livre $\rightarrow$ Resumo textual probabilístico.
* **Capacidade de Dados:** Extração e sumarização fluente de linguagem natural, leitura de páginas web públicas.
* **Rastreabilidade & Transparência:** **Crítica.** Ausência de modelo espacial determinístico. O modelo sintetiza textos com alta convicção, mas não consulta camadas vetoriais municipais fechadas (WFS do GeoSampa) nem executa cálculos topográficos reais.
* **Tratamento de Dados Ausentes:** Alucinação de detalhes ou recomendações genéricas sem base cadastral ("o bairro é bem localizado e tem transporte próximo").
* **Limitações Comprovadas:** Falta de rastreabilidade de fontes primárias, incapacidade de emitir garantias de conformidade urbanística e ausência de ferramentas de campo (checklists de vistoria estruturados).
* **Sobreposição com o VEREDA:** O VEREDA utiliza processamento de dados e IA com ancoragem cadastral determinística (*grounding*), onde cada afirmação aponta para uma camada pública de dados auditável.

---

### 5. Substitutos Tradicionais & Manuais: Vistoriadores Independentes & Diligência Pessoal
* **Usuário-alvo:** Compradores de alto padrão ou inquilinos experientes.
* **Jornada:** Contratação de arquiteto/engenheiro para visita presencial ou dias de pesquisa manual em cartórios e prefeituras.
* **Custo & Tempo:** R$ 500 a R$ 2.500 por visita técnica; dias ou semanas de espera.
* **Vantagem:** Inspeção física tátil in loco.
* **Desvantagem:** Inviável para quem está comparando 5 a 10 opções de aluguel ou compra em estágio inicial de decisão.
* **Papel do VEREDA:** O VEREDA atua como uma **triagem digital instantânea pré-visita**, gerando o roteiro exato do que inspecionar caso o usuário decida avançar.

---

## 3. Matriz Comparativa de Capacidades

| Dimensão de Comparação | Portais de Anúncios (ZAP, QuintoAndar) | DataZAP / AVMs | Sprift (Reino Unido) | ChatGPT / LLMs Genéricos | VEREDA (Proposta) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Foco do Negócio** | Vender anúncios e leads para corretores | Relatórios macroeconômicos B2B | Dossiê predial B2B para corretores UK | Conversação genérica | Decisão e proteção do interessado (B2C) |
| **Resolução Cadastral Brasil** | Não faz (omite propositalmente número) | Apenas no nível de bairro/zona | Não atua no Brasil | Não possui ferramentas geodésicas | **Foco central (GeoSampa, CNEFE)** |
| **Auditoria de Encargos Reais** | Não audita (aceita autodeclaração) | Médias estatísticas de condomínio | N/A (modelo britânico de taxas) | Não audita | **Sim (decomposição ordinária vs. extraordinária)** |
| **Altimetria & Caminhada Real** | Apenas raio em linha reta ("a 3 min") | Não considera | Dados de relevo locais | Estimativas vagas | **Sim (Altimetria + Tobler Hiking Function)** |
| **Obras Vizinhas & Zoneamento** | Não exibe | Não exibe | Sim (planning permissions britânicas) | Não acessa bases municipais WFS | **Sim (Alvarás SisRBC e Zonas PMSP/EMPREL)** |
| **Tratamento da Incerteza** | Esconde o problema | Aplica médias estatísticas | Transfere para advogados | Inventa ou generaliza | **Incerteza como Feature (Checklist e WhatsApp)** |
| **Custo para o Usuário** | Gratuito (mas monetiza via leads) | R$ centenas/milhares (B2B) | Mensalidade B2B em Libras (£) | Gratuito / US$ 20/mês | **Freemium acessível (cidadania urbana)** |

---

## 4. Conclusão Estratégica para o Pitch

O VEREDA não precisa disputar tráfego ou inventário com os gigantes imobiliários:
1. **O VEREDA é complementar aos portais:** O usuário encontra os imóveis no ZAP ou QuintoAndar e usa o VEREDA para decidir em qual deles realmente vale a pena assinar contrato.
2. **A neutralidade é o ativo central:** Por não receber comissões de transação de proprietários ou imobiliárias, o VEREDA é o único agente com incentivo 100% alinhado à transparência e à proteção do morador.
