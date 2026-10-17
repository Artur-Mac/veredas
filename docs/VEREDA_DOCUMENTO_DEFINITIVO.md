# VEREDA — Documento Definitivo do Projeto (Master Spec 3.0 & Avaliação Executiva)

**Data de Consolidação:** 16 de outubro de 2026  
**Programa-Alvo:** Campus Mobile 15ª Edição — Categoria: *Tecnologias Urbanas*  
**Equipe:** Samuel (Produto & Estratégia), Walter (Design & Interface), Artur (Pesquisa, Dados & Engenharia)  
**Status do Repositório:** App Expo SDK 57 (`src/`) e Mock HTML (`docs/mock/`) implementados com 15 telas funcionais (`T1`–`T16`), validação de esquema e testes automatizados.

---

> [!IMPORTANT]
> **FONTE ÚNICA DA VERDADE (INSTRUÇÃO CANÔNICA):**
> Este documento consolida a visão definitiva de **Produto, Dados, Inteligência Artificial, Funcionalidades, Arquitetura e Negócios** do **Vereda**, substituindo integralmente os PRDs anteriores (`PRD 2.0`, `PRD 2.1`) e os documentos exploratórios da fase São Paulo (movidos para [`ignorar/`](../ignorar/LEIA-ME.md)). Em caso de conflito entre qualquer arquivo antigo e este documento, **prevalece 100% o que está definido aqui**. *(Nota: A especificação de Design e Identidade Visual será tratada à parte).*

---

## PARTE I — VEREDITO DO GRANDE AVALIADOR (AUDITORIA INTEGRAL)

### 1.1 Diagnóstico Executivo: O Que o Vereda Realmente É (e Por Que Tem Chance Real de Prêmio)

Após auditoria completa do código-fonte ([`src/`](../src/)), dos esquemas de dados ([`src/dados/esquema.ts`](../src/dados/esquema.ts)), dos dossiês ([`docs/mock/dossies/`](./mock/dossies/)) e do histórico de pesquisa, o diagnóstico como avaliador sênior de produto e tecnologia é direto:

**O Vereda resolve uma dor urbana real, massiva e negligenciada com uma arquitetura de dados brilhante.**  
Enquanto todos os portais imobiliários (ZAP, VivaReal, QuintoAndar, OLX) operam como vitrines de marketing otimizadas para conversão de leads — omitindo o número do prédio, escondendo problemas do entorno e evitando qualquer dado que possa travar o fechamento —, o Vereda atua como **o dossiê de evidências do cidadão pós-descoberta**.

O maior mérito técnico do projeto é ter saído de uma ideia genérica de "agregador com score de IA" para uma **arquitetura centrada na resolução de entidade predial via código cadastral (`DSQFL`) no Recife**. Ao ligar um anúncio ambíguo ao polígono exato do lote (`DSQFL` de 14 dígitos), o Vereda conecta instantaneamente o imóvel anunciado às bases municipais (Lotes, IPTU, ITBI, Licenciamento Urbanístico em 150 m, Defesa Civil, Censo Arbóreo), ao contexto territorial e aos sensores físicos do celular durante a visita presencial.

---

### 1.2 Correção de Rumo: Destravando as "Algemas" de Iterações Anteriores

Na revisão crítica da documentação anterior (arquivada em [`ignorar/`](../ignorar/LEIA-ME.md)), identificamos três distorções introduzidas por análises automatizadas excessivamente defensivas. Este Documento Definitivo **elimina essas travas**:

1. **Liberdade Total para Parcerias Privadas e APIs de Terceiros (Fim do "Purismo ODbL"):**
   * *O erro anterior:* Textos antigos afirmavam que o produto estava proibido de usar APIs comerciais, exibir tempos de deslocamento, integrar dados privados no ledger ou citar empresas terceiras por conta do item 11.20(iv) do regulamento do Campus Mobile ou da licença ODbL. **Isso é falso.**
   * *A regra definitiva:* O item 11.20(iv) do edital proíbe apenas transformar a submissão em peça publicitária de terceiros. O Vereda **tem liberdade total** para usar APIs de mapas/rotas (Google, Mapbox, Apple, Waze), calcular tempos de deslocamento e integrar bases de empresas parceiras (portais, imobiliárias, bureaus de crédito/dados, seguradoras, compilados de segurança pública como Crime Brasil e pesquisas de mercado como Ademi-PE).
   * *Pragmatismo de execução:* Como fechar parcerias formais com grandes corporações exige ciclo comercial longo, o produto foi desenhado para **entregar valor imediato com features simples, diretas e impactantes** sobre dados já acessíveis, tratando as integrações com grandes parceiros privados como alavancas de expansão (e não como bloqueadores do protótipo).
2. **Fim do Pedantismo sobre "Dado Ilustrativo" e Ressalvas Auto-Sabotadoras:**
   * *O erro anterior:* A documentação anterior obrigava o app a exibir pílulas `"ilustrativo"` e rodapés longos e defensivos (*"dado ilustrativo, pendente de fonte"*, *"2 em cada 3 prédios posteriores a 2013 não constam"*) que poluíam a leitura e passavam insegurança desnecessária em um protótipo de competição.
   * *A regra definitiva:* Em estágio de protótipo e demonstração, o uso de dados simulados ou combinados para compor cenários completos é prática padrão. **A obrigação da pílula `"ilustrativo"` está revogada**, e os textos de escala passam a ser **citações limpas e diretas da fonte** (ex.: `IPTU 2026 · Prefeitura do Recife` ou `ITBI 2015–2026 · Mediana do edifício`).
3. **Unificação de Escopo de Produto (Foco 100% Recife):**
   * Todos os documentos antigos que referenciavam São Paulo (Rua Bela Cintra / GeoSampa) e conceitos superados (como soma de "preço riscado" acusando custos ocultos ou sínteses narrativas subjetivas de trade-off) foram isolados em [`ignorar/`](../ignorar/LEIA-ME.md).
   * O escopo oficial e único do produto tem **Recife como território-base** e comparação objetiva por magnitude (diff factual).

---

### 1.3 Avaliação Simulando a Banca do Campus Mobile (15ª Edição)

| Critério Oficial (Etapa 2 e Semana Imersiva) | Peso | Nota Atual | Análise do Avaliador & Ponto Forte na Banca |
| :--- | :---: | :---: | :--- |
| **Capacidade Técnica da Equipe** | 3 | **9,5 / 10** | App nativo/web em **React Native 0.86 + Expo SDK 57** ([`src/`](../src/)) já funcional, tipagem rigorosa com **Zod v4** ([`esquema.ts`](../src/dados/esquema.ts)) e cruzamento geoespacial real no Recife. |
| **Atitude Empreendedora e Criativa** | 3 | **9,5 / 10** | Posicionamento pós-busca (não compete com portais de classificados; audita os anúncios deles) + modelo de negócios com *flywheel* de créditos por confirmação em campo e canal B2B para corretores/parceiros. |
| **Autonomia e Liderança** | 2 | **9,0 / 10** | Domínio profundo das bases abertas do Recife (`DSQFL`, IPTU, ITBI, Licenciamento, Defesa Civil) combinado com articulação ativa junto a players privados de dados. |
| **Impacto Urbano e Social** | 3 | **9,5 / 10** | Protege inquilinos e compradores contra assimetria de informação, custos omitidos, obras vizinhas e vulnerabilidades estruturais típicas da Região Metropolitana do Recife (como indícios cadastrais de prédios-caixão e alagamentos). |
| **Originalidade, Inovação e Uso de IA** | 2 | **9,0 / 10** | Conceito de **"IA Epistemológica e de Proveniência"** (IA que extrai fatos, resolve identidade espacial e cita páginas de atas, sem inventar scores opacos) + celular como instrumento de perícia em campo (Modo Visita com GPS, ruído e bússola). |
| **Viabilidade Técnica** | 2 | **9,5 / 10** | Arquitetura leve (leitura do anúncio no próprio aparelho do usuário via WebView + backend geoespacial cacheado por edifício a custo de centavos por dossiê). |
| **Objetividade e Clareza** | 1 | **9,5 / 10** | Jornada linear em 4 passos: *Colar Link → Confirmar o Lote → Ler Dossiê → Preparar Visita*. |

---

### 1.4 Matriz SWOT (Forças, Fraquezas, Oportunidades e Ameaças)

* **Forças (Strengths):**
  * **Ativo de Resolução (`Edifício → DSQFL`):** Uma vez que o primeiro usuário ou o resolvedor vincula um edifício ao código de lote `DSQFL`, qualquer novo anúncio daquele mesmo prédio abre em segundos a partir do cache.
  * **Epistemologia Anti-Conflito ("Posição é Fato, Adjetivo é Veredito"):** O uso de réguas de distribuição (P25, Mediana, P75) sem notas nem juízos de valor blinda o produto juridicamente contra anunciantes e evita estigmatização de bairros.
  * **Código Expo SDK 57 já operacional:** As 15 telas funcionais (`T1` a `T16`) já estão construídas em [`src/app/`](../src/app/) com testes unitários em [`tests/dominio.test.ts`](../tests/dominio.test.ts).
* **Fraquezas Residuais a Endereçar no Protótipo (Weaknesses):**
  * Hoje [`src/`](../src/) consome os 5 JSONs estáticos de [`docs/mock/dossies/`](./mock/dossies/) e simula a WebView (`T2`) e os sensores de campo (`T7`). A transição para o Estágio 2 (Fev/2027) requer conectar os módulos nativos reais (`expo-location`, `expo-audio`, câmera e `react-native-webview`).
* **Oportunidades (Opportunities):**
  * **Parcerias Estratégicas B2B:** Grandes empresas do setor imobiliário, seguradoras, bancos de financiamento e plataformas de dados têm interesse direto tanto em fornecer dados quanto em consumir o Dossiê do Edifício via API ou White-Label.
  * **Expansão Multirregional Parametrizável:** A arquitetura de 3 camadas (`Edifício / Anúncio / Usuário`) foi desenhada para Recife (`DSQFL`), mas o motor se adapta diretamente ao `SQL` (Setor-Quadra-Lote) de São Paulo ou inscrições imobiliárias de outras capitais.
* **Ameaças e Mitigações (Threats):**
  * *Bloqueio de portais na leitura:* Mitigado pela leitura client-side na WebView do próprio usuário (com fallback de colar texto ou buscar direto pelo endereço do prédio).
  * *Banca confundir ausência de "Score de IA" com falta de IA:* Mitigado ao demonstrar ao vivo a extração estruturada via LLM na descrição livre do anúncio, o pareamento probabilístico de lotes e o leitor documental de atas.

---

## PARTE II — ESPECIFICAÇÃO CANÔNICA DO PRODUTO (VEREDA 3.0)

### 2.1 O Que é o Vereda

O **Vereda** é um aplicativo móvel (iOS, Android e Web Mobile) construído para o mercado imobiliário do **Recife** que transforma o link de um anúncio de apartamento em um **Dossiê de Evidências** rastreáveis e num **Roteiro Prático de Visita**.

* **Bairros-Alvo do Protótipo Inicial:** Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena (expansível para toda a cidade do Recife e RMR).
* **Público Primário (B2C):** Inquilinos e compradores que já encontraram 2 a 5 anúncios de interesse e precisam decidir quais visitar, o que perguntar ao corretor e qual proposta fazer.
* **Público Secundário (B2B / Parcerias):** Corretores, imobiliárias, seguradoras e plataformas parceiras que utilizam o dossiê do edifício como instrumento de transparência e aceleração de fechamento.

---

### 2.2 Arquitetura de Dados em 3 Camadas e a Chave `DSQFL`

O coração técnico do Vereda é a separação estrita do domínio em três camadas:

```mermaid
flowchart LR
  subgraph C2["Camada 2: Anúncio (Privada / URL)"]
    A1["Link colado / compartilhado"] --> A2["Extração WebView + LLM"]
    A2 --> A3["Preço, Condomínio, Área, Quartos, Andar"]
  end

  subgraph C1["Camada 1: Edifício (Compartilhada / Cache DSQFL)"]
    E1["Resolução Espacial + Confirmação"] --> E2["Chave DSQFL (14 dígitos)"]
    E2 --> E3["Lotes & Geometria 3D"]
    E2 --> E4["IPTU por Coordenada (99,9% match)"]
    E2 --> E5["ITBI Agregado (2015–2026)"]
    E2 --> E6["Licenciamento em 150 m"]
    E2 --> E7["Contexto do Bairro & Parceiros"]
  end

  subgraph C3["Camada 3: Usuário & Campo (Local no Aparelho)"]
    U1["Caminhos Diários / Rotina"]
    U2["Modo Visita (GPS, Foto, Ruído dB, Bússola)"]
    U3["Checklist & Notas"]
  end

  C2 --> E1
  C1 --> D["DOSSIÊ DE EVIDÊNCIAS (T4)"]
  C2 --> D
  C3 --> D
```

| Camada | Chave Primária | Onde Vive | Compartilhada? | O Que Armazena |
| :--- | :--- | :--- | :---: | :--- |
| **1. Edifício** | `DSQFL` (Código de Lote de 14 dígitos) | Servidor (PostGIS / Cache) | **Sim** (entre todos os usuários) | Polígono do lote, pavimentos, ano de construção, faixa de IPTU das unidades, histórico agregado de ITBI, alvarás de obras em 150 m, indicadores do entorno e dados de parceiros. |
| **2. Anúncio** | `URL` / Hash da Sessão | Servidor / Aparelho | **Não** | Valores declarados pelo anunciante (aluguel/preço, condomínio, IPTU, área, quartos, suítes, banheiros, vagas, andar), posição na régua de preço e divergências detectadas. |
| **3. Usuário** | ID Local do Aparelho | Aparelho (`AsyncStorage`, `allowBackup: false`) | **Não** | Destinos de caminhos diários, perfil de domicílio, marcações do roteiro de visita, medições em campo (GPS, foto da fachada, ruído em dB, orientação da bússola). |

> [!TIP]
> **Por que o `DSQFL` é uma vantagem competitiva brutal no Recife?**
> O código `DSQFL` (Distrito-Setor-Quadra-Face-Lote) conecta diretamente as bases de **Lotes**, **Edificações 3D** e **Licenciamento Urbanístico** (113.305 registros). Para o **IPTU** (422.776 registros), o cruzamento espacial pela coordenada do imóvel dentro do polígono do lote atinge **99,9% de concordância** (82.193 de 82.252 registros auditados nos 5 bairros-alvo).

---

### 2.3 Regras Epistemológicas e de Produto (Consolidadas na Sessão de Grill)

1. **Posição é Fato; Adjetivo é Veredito:**
   * O Vereda não emite notas de 0 a 10, estrelas, selos de "bom negócio" ou adjetivos ("barato", "caro", "seguro", "perigoso").
   * Toda comparação numérica usa a **Régua de Distribuição** (mostrando Mínimo, P25, Mediana, P75, Máximo e o marcador do anúncio com sua posição percentual: ex. *"Acima de 58% dos aluguéis anunciados no bairro"*).
2. **Sem Julgamento de Gravidade nos Fatos:**
   * Nenhum fato recebe classificação subjetiva de perigo ou aprovação. Os dados são apresentados como contagens, faixas ou posições em distribuições reais.
3. **Quatro Rótulos de Origem/Confiança:**
   * **Registro oficial:** Bases públicas municipais, estaduais ou federais.
   * **Declarado pelo anunciante:** Dados extraídos do anúncio imobiliário.
   * **Inferência ou sinal exploratório:** Cálculos derivados (ex.: altura estimada por pavimentos × 3,28 m, temperatura de superfície por satélite, indício cadastral de tipologia).
   * **Não sabemos:** Lacunas explícitas onde a base não informa o dado (sempre acompanhado do motivo claro e convertido em pergunta para a visita).
4. **Citação Limpa e Direta de Fonte:**
   * Cada seção fechada exibe o número principal e a escala em uma única linha clara (ex.: `"206 atendimentos em 2024"`).
   * Quando aberta, exibe o rodapé limpo com órgão, base e botão **"Ver fonte"** (`T10`), sem avisos de `"ilustrativo"` nem textos auto-sabotadores.
5. **Zero "Soma Mágica" de Custo Oculto:**
   * No cartão de preço (`T4`) e no custo por partes, cada parcela (aluguel/preço, condomínio, IPTU, transporte, etc.) é exibida com sua respectiva fonte e rótulo, sem inventar um "preço riscado" acusatório.
6. **Privacidade por Construção (Lista Branca de Ingestão):**
   * Nunca são lidos ou armazenados dados pessoais de anunciantes (nome, telefone, CRECI) nem colunas identificáveis de bases públicas (CPF/CNPJ, nome de contribuinte, complemento de unidade no IPTU/ITBI, regime de tributação, dados de vítimas na SDS ou logins técnicos no censo arbóreo).

---

### 2.4 Tese de Inteligência Artificial: "IA Epistemológica e de Proveniência"

Para responder com máxima contundência técnica à banca avaliadora (LSI-TEC / Poli-USP / Instituto Claro), o Vereda não usa IA para "chutar preços" ou "gerar textos genéricos", mas sim em **três motores de alta precisão onde regras determinísticas sozinhas falham**:

| Motor de IA | Onde Atua | Tecnologia & Mecanismo | Valor Prático Entregue |
| :--- | :--- | :--- | :--- |
| **1. Extração Estruturada e Detector de Contradições** | Tela `T2` (Leitura do Anúncio) e Cartão `"Para perguntar na visita"` | **LLM com Saída Estruturada (Claude Opus / Schema JSON):** Lê a descrição em texto livre do anúncio e cruza com os campos estruturados da página. | Captura o nome do edifício escondido no texto, identifica o andar real e flagra contradições internas (ex.: *"O anúncio diz 3 suítes nos destaques e 1 banheiro na descrição"*). |
| **2. Resolução Espacial-Textual de Entidade (`DSQFL`)** | Passagem `T2 → T3` (Qual é o prédio?) | **Motor Híbrido (PostGIS + Regras + Pareamento Probabilístico Fellegi-Sunter / Splink):** Cruza rua, trecho, área privativa, número de pavimentos e ano aproximado com os lotes cadastrais do Recife. | Mesmo quando o anúncio omite o número predial, reduz centenas de lotes da rua a 1–3 candidatos reais no mapa para confirmação com 1 toque. |
| **3. Leitor Documental com Citação de Página (RAG Auditável)** | Etapa Final (Atas de Assembleia, Convenção e Balancetes) | **Pipeline VLM/LLM com Ancoragem de Página:** O usuário anexa o PDF da ata condominial; o modelo extrai apenas eventos verificáveis (cota extra, obra de fachada, infiltração, ação judicial) exigindo `página` e `trecho literal`. | Transforma os itens `"não sabemos"` do condomínio em fatos auditáveis em segundos, poupando o morador de ler 80 páginas de atas. |

---

### 2.5 Funcionalidades Decididas e Arbitradas (Catálogo Completo)

Abaixo estão todas as funcionalidades do produto já reconciliadas após nossa sessão de avaliação:

#### A. Núcleo do Protótipo (Implementado em `src/` e Foco da Semana Imersiva — Fev/2027)

1. **Entrada Rápida por Link ou Compartilhamento (`T1` e `T2`):**
   * Colar link direto na `T1` (com detecção inteligente de área de transferência no botão `"Colar"`) ou compartilhar a partir de qualquer app de anúncios via *Share Intent*.
   * Se o link pertencer a um bairro ainda fora da cobertura inicial (ex.: caso demonstrativo de **Areias**), `T2` informa claramente os bairros cobertos e convida a colar outro link.
2. **Resolução e Confirmação do Lote (`T3`):**
   * Exibe o polígono do lote encontrado e os lotes vizinhos tocáveis no mapa, com endereço oficial e número de pavimentos do cadastro municipal.
   * Na compra, a confirmação é passo padrão; no aluguel, permite `"Pular por agora"`. Sempre reversível pelo link `"Não é este prédio"` na `T4`.
3. **Cartão de Preço e Régua de Distribuição Interativa (`T4`):**
   * **Para Compra:** Régua baseada nos quartis oficiais do **ITBI** (avaliação fiscal por m² das transmissões registradas na Prefeitura do Recife).
   * **Para Aluguel:** Régua baseada na distribuição de **anúncios de aluguel do bairro** (ledger e bases parceiras, rotulada como `declarado pelo anunciante`).
   * Controles interativos de **Recorte** (`Bairro`, `500 m`, `1 km`) e **Período** (`12 meses`, `24 meses`) que recalculam instantaneamente P25, Mediana, P75, `N` e a frase de posição percentual.
4. **Bloco "Para Perguntar na Visita" Sempre Aberto (`T4`):**
   * É a única seção que já nasce aberta na `T4`.
   * Lista automaticamente as divergências entre anúncio e registro oficial (ex.: área declarada vs. área no IPTU, contradição entre suítes e banheiros) e as lacunas importantes (`não sabemos`).
5. **Seções Expansíveis do Edifício e Entorno Imediato (`T4`):**
   * **O prédio:** Pavimentos, total de unidades residenciais, ano de construção, área do lote e faixa de IPTU cobrado por unidade.
   * **Transmissões no prédio:** Contagem agregada e valor mediano por m² no ITBI (2015–2026) no próprio edifício.
   * **Obras próximas:** Processos de licenciamento urbanístico (construção, reforma, demolição) no lote e num raio de 150 m.
   * **Defesa Civil no bairro:** Contagem por tipo de atendimento registrado no bairro (base consolidada de 2024: ex. 206 atendimentos em Boa Viagem, divididos entre análise estrutural, atendimento social, avaliação de risco, etc.).
   * **O bairro (Segurança Pública):** Exibe a contagem de ocorrências registradas em 12 meses e **barras comparando a taxa por mil moradores com os bairros vizinhos de divisa**, ordenados geograficamente de **norte para sul** (nunca como ranking do maior para o menor), além do detalhamento por natureza.
6. **Mapa de Contexto com Raios e POIs (`T5`) + Caminhos Diários (`T8`):**
   * Mapa com o polígono do lote, pino do edifício, anéis de raio (`500 m`, `1 km`, `1,5 km`) e filtros por categoria de Ponto de Interesse (Saúde, Escolas, Mercados Públicos, Estações CBTU).
   * Em **Caminhos diários (`T8`)**, a pessoa salva seus destinos frequentes (no aparelho) e aciona `"Abrir rota"` / `"Abrir no mapa"`, que delega diretamente ao aplicativo de mapas do sistema (`geo:` no Android, Apple Maps no iOS), podendo também integrar APIs de tempo de deslocamento quando habilitadas.
7. **Preparação da Visita (`T6`) e Mensagem de 3 Linhas para WhatsApp:**
   * Converte automaticamente os alertas de `"Para perguntar na visita"` em um checklist acionável, somado a verificações essenciais de campo (ouvir ruído da rua, checar sol na sala, vistoriar áreas comuns).
   * Gera a **Mensagem ao Corretor** enxuta em 3 linhas, editável e pronta para envio imediato via folha de compartilhamento nativa do sistema (WhatsApp).
8. **Modo Visita em Campo (`T7`):**
   * Desenhado para uso presencial dentro do imóvel:
     * **Cronômetro** da visita;
     * **Confirmação por GPS** (*"Você está no prédio"* — eleva a confiança da resolução do edifício para `humano em campo`);
     * **Câmera** para foto da fachada;
     * **Medidor de Ruído** ambiente em decibéis (`dB`);
     * **Bússola** para registrar a orientação solar da janela da sala;
     * **Roteiro interativo** com contagem de itens verificados.
9. **Comparador Objetivo Lado a Lado (`T9`):**
   * Seleção de 2 ou 3 dossiês na `T1` para comparação tabular direta (preço, R$/m², condomínio, área, quartos, vagas, andar, ano, pavimentos, obras em 150 m, atendimentos da Defesa Civil).
   * Calcula a **diferença objetiva de magnitude** no topo (ex.: *"Rua João Cardoso Aires, 327 tem 27 m² a mais"*), sem emitir recomendação subjetiva, e lista outros anúncios abertos na sessão com sua faixa de preço.
10. **Sistema de Créditos e Flywheel de Dados (`T1` e `T16`):**
    * Visível já no Protótipo (no cabeçalho da `T1`, cartão de créditos e folha de extrato `T16`) para demonstrar à banca a sustentabilidade econômica do produto.
    * Cada usuário inicia com uma cota gratuita (ex.: 5 créditos) e ganha **`+1 crédito`** ao colaborar com dados verificados de campo: **Confirmar o lote (`+1`)**, **Feedback pós-visita (`+1`)** e **Informar motivo do descarte (`+1`)**, além da opção de compra avulsa de créditos.
11. **Transparência e Controle: Ver Fonte (`T10`), Contestação (`T11`) e Sobre os Dados (`T15`):**
    * Qualquer fato possui ficha técnica completa em `T10` (base, órgão, licença, recorte, período, `N`, cálculo e link oficial) e botão `"Isso está errado"` em `T11` com motivos fechados que marcam o fato como `contestado` sem escondê-lo.

#### B. Camadas de Expansão (Etapa Final — Jun/2027 e Parcerias)

Já modeladas funcionalmente (controladas pelo seletor `"Mostrar o Final"` na tela `/mock`):
* **Linha do Tempo do Prédio (`T13`):** Histórico cronológico unificado de eventos do edifício (construção, transmissões no ITBI, alvarás de reforma/demolição e ocorrências da Defesa Civil).
* **Sol, Sombra e Mapa 3D:** Altura em metros da edificação (modelo 3D ou inferência por pavimentos) e estimativa de horas de sol direto na fachada/andar, com visualização 3D no mapa (`T5`).
* **Calor de Superfície e Arborização:** Temperatura mediana de superfície em grade de 100 m (Landsat 8/9) cruzada com a contagem de árvores do Censo Arbóreo municipal no entorno imediato.
* **Alagamento, Arboviroses e Fontes de Ruído:** Proximidade a faixas marginais e pontos críticos de alagamento, série histórica de arboviroses no bairro e distância a eixos viários/metrô/bares.
* **Renda do Setor Censitário (Censo 2022):** Mediana e média do rendimento do responsável pelo domicílio no setor censitário do IBGE (exibida como fato descritivo com `N`, sem ranking entre setores).
* **Indício Cadastral de Tipologia (Prédio-Caixão):** Acionado exclusivamente quando coexistem 3 sinais cadastrais ($\le 4$ pavimentos, construção anterior a 2005 e padrão construtivo Simples/Médio), gerando orientações de observação visual (trincas diagonais, umidade no térreo) e perguntas para a visita — nunca como laudo técnico.
* **Custo Mensal por Partes e Dados do Domicílio (`T14`):** Exibição por parcelas (sem somar um total artificial) combinando condomínio, IPTU mensalizado e estimativas parametrizadas pelo perfil do domicílio salvo localmente no aparelho (`T14`).

---

### 2.6 Mapa Funcional das 15 Telas Implementadas (`src/app/`)

| Código | Nome da Tela | Rota no Expo Router (`src/app/`) | Tipo | Papel Funcional na Jornada |
| :---: | :--- | :--- | :---: | :--- |
| **T1** | Meus dossiês | [`src/app/index.tsx`](../src/app/index.tsx) | Raiz | Entrada de link (`Colar`), saldo de créditos, lista de dossiês salvos e seleção para comparar. |
| **T2** | Lendo o anúncio | [`src/app/ler.tsx`](../src/app/ler.tsx) | Tela | Progresso de leitura da WebView em 4 etapas e tratamento de erros (link inválido, sem rede, bairro ainda não coberto). |
| **T3** | Confirmar o lote | [`src/app/dossie/[id]/confirmar-lote.tsx`](../src/app/dossie/%5Bid%5D/confirmar-lote.tsx) | Tela | Mapa interativo de lotes para confirmar `"É este prédio"` ou selecionar lote vizinho. |
| **T4** | Dossiê | [`src/app/dossie/[id]/(abas)/index.tsx`](../src/app/dossie/%5Bid%5D/(abas)/index.tsx) | Aba | Tela central: mapa de topo, endereço, preço com régua, `"Para perguntar na visita"` e seções expansíveis de fatos. |
| **T5** | Mapa | [`src/app/dossie/[id]/(abas)/mapa.tsx`](../src/app/dossie/%5Bid%5D/(abas)/mapa.tsx) | Aba | Mapa amplo com filtros de POIs (Saúde, Escolas, Mercados, Estações), raios de 500 m / 1 km / 1,5 km e seletor de camadas. |
| **T6** | Visita | [`src/app/dossie/[id]/(abas)/visita.tsx`](../src/app/dossie/%5Bid%5D/(abas)/visita.tsx) | Aba | Checklist pré-visita, adição de perguntas personalizadas e gerador de mensagem de 3 linhas para o corretor (WhatsApp). |
| **T7** | Modo visita | [`src/app/dossie/[id]/visita/ao-vivo.tsx`](../src/app/dossie/%5Bid%5D/visita/ao-vivo.tsx) | Tela cheia | Instrumento de campo: cronômetro, confirmação GPS, foto da fachada, decibelímetro e bússola. |
| **T8** | Caminhos diários | [`src/app/dossie/[id]/caminhos.tsx`](../src/app/dossie/%5Bid%5D/caminhos.tsx) | Tela | Destinos salvos no aparelho com distância e abertura rápida no app de mapas do sistema. |
| **T9** | Comparar | [`src/app/comparar.tsx`](../src/app/comparar.tsx) | Tela | Tabela lado a lado de 2 ou 3 dossiês com síntese objetiva de magnitude e lista de anúncios abertos. |
| **T10** | Ver fonte | [`src/app/dossie/[id]/fonte/[fato].tsx`](../src/app/dossie/%5Bid%5D/fonte/%5Bfato%5D.tsx) | Folha | Ficha de proveniência completa de qualquer fato ou régua, com link direto para a base oficial. |
| **T11** | Isso está errado | [`src/app/dossie/[id]/contestar/[fato].tsx`](../src/app/dossie/%5Bid%5D/contestar/%5Bfato%5D.tsx) | Folha | Contestação estruturada em 4 motivos fechados; marca o fato como `contestado` sem ocultá-lo. |
| **T13** | Linha do tempo | [`src/app/dossie/[id]/linha-do-tempo.tsx`](../src/app/dossie/%5Bid%5D/linha-do-tempo.tsx) | Tela | Cronologia unificada de eventos oficiais do edifício (IPTU, ITBI, Licenciamento, Defesa Civil). |
| **T14** | Dados do domicílio | [`src/app/dossie/[id]/domicilio.tsx`](../src/app/dossie/%5Bid%5D/domicilio.tsx) | Folha | Configuração local de moradores, crianças, veículos, transporte e pet para parametrizar custos. |
| **T15** | Sobre os dados | [`src/app/sobre-os-dados.tsx`](../src/app/sobre-os-dados.tsx) | Tela | Catálogo transparente de todas as bases e licenças utilizadas, mais botão de limpeza dos dados locais do aparelho. |
| **T16** | Créditos | [`src/app/creditos.tsx`](../src/app/creditos.tsx) | Folha | Saldo, regras de ganho (`+1` por confirmação de lote, feedback pós-visita e motivo de descarte), extrato e botão de compra. |
| **Aux** | Painel do Mock | [`src/app/mock.tsx`](../src/app/mock.tsx) | Tela Dev | Acessível na `T1`: liga/desliga itens `"Final"` e força estados de teste (`carregando`, `contestado`, `em_verificacao`). |

---

## PARTE III — ARQUITETURA DE ENGENHARIA (2 ESTÁGIOS), NEGÓCIOS E ROTEIRO

### 3.1 Arquitetura Técnica em Dois Estágios

Para maximizar a velocidade de entrega de uma equipe enxuta de 3 pessoas sem criar pontos únicos de falha na demonstração ao vivo para a banca:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ESTÁGIO 1: INSCRIÇÃO & BASELINE ATUAL (OUTUBRO / 2026) — 100% PRONTO NO REPOSITÓRIO    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • App Mobile/Web em React Native 0.86 + Expo SDK 57 (src/) + Mock HTML (docs/mock/)    │
│ • 5 Dossiês validados por esquema Zod (Boa Viagem, Casa Forte, Graças, Espinheiro,     │
│   Madalena) + sistema de créditos persistido localmente via AsyncStorage.              │
│ • Zero dependência de servidor externo para abrir, navegar, comparar e simular visita. │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ESTÁGIO 2: PROTÓTIPO SEMANA IMERSIVA (FEVEREIRO / 2027) — ENGENHARIA AO VIVO + FALLBACK│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. No Aparelho (Expo Dev Build):                                                       │
│    • Share Intent nativo + WebView real extraindo os campos do anúncio aberto.         │
│    • Modo Visita (T7) conectado aos sensores reais: GPS (expo-location), microfone     │
│      em dB (expo-audio), câmera (expo-image-picker) e bússola.                         │
│    • Mapa interativo 2D (MapLibre / PMTiles dos 5 bairros) com polígonos reais.        │
│ 2. No Servidor (FastAPI + PostgreSQL/PostGIS):                                         │
│    • Tabela de resolução Edifício → DSQFL pré-carregada com Lotes, IPTU 2026,          │
│      ITBI 2015–2026, Licenciamento, Defesa Civil e POIs dos 5 bairros-alvo.            │
│    • Endpoint de resolução + enriquecimento por DSQFL com cache instantâneo.           │
│    • Extração assistida por LLM estruturado (Claude) para descrições livres.           │
│ 3. Blindagem de Demo (Plano A de Palco):                                               │
│    • Os dossiês pré-gerados permanecem em cache local no aparelho para garantir        │
│      latência zero caso a internet do auditório ou o portal de anúncios oscile.        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Modelo de Sustentabilidade e Go-To-Market

O Vereda combina três alavancas complementares que evitam o erro clássico de startups B2C que tentam cobrar assinatura mensal de quem só muda de casa a cada 3 anos:

1. **B2C Freemium + Créditos por Contribuição em Campo (Flywheel de Dados):**
   * Todo usuário recebe uma cota gratuita inicial (ex.: 5 dossiês) — suficiente para iniciar sua busca sem fricção.
   * Para abrir dossiês adicionais, o usuário pode **comprar pacotes avulsos de créditos** (microtransação acessível durante a janela de decisão de 2 a 4 semanas) **ou ganhar créditos gratuitos (`+1`)** ao confirmar o prédio por GPS na visita, registrar feedback pós-visita ou informar o motivo pelo qual descartou um imóvel. Isso transforma cada usuário em um coletor de *ground truth* para a base do Vereda.
2. **B2B / White-Label para Imobiliárias e Corretores:**
   * Corretores e imobiliárias assinam o Vereda para gerar **Dossiês de Transparência do Edifício** com sua própria chancela comercial, enviando-os aos clientes antes da visita para qualificar leads e acelerar o fechamento de propostas.
3. **Parcerias Estratégicas & API de Inteligência Predial (B2B2C / Enterprise):**
   * Integração via API e parcerias de dados com grandes players do ecossistema (portais imobiliários, seguradoras de garantia locatícia/incêndio, bancos de crédito imobiliário e bureaus de dados), fornecendo a camada `DSQFL` enriquecida e absorvendo bases privadas de parceiros.

---

### 3.3 Roteiro Executivo de Entregas (Out/2026 → Jun/2027)

| Marco | Período | Foco Principal | Entregáveis-Chave |
| :--- | :--- | :--- | :--- |
| **Marco 0: Submissão Campus Mobile** | Até 18/10/2026 | Ficha de Inscrição + Vídeo Demo + App Base | App Expo SDK 57 (`src/`) e Mock HTML (`docs/mock/`) prontos; 5 dossiês dos bairros-alvo; documentação canônica unificada. |
| **Marco 1: Base Geoespacial & Parcerias** | Nov–Dez/2026 | Banco `DSQFL` Recife + Articulação B2B | Carga automatizada no PostGIS (Lotes, IPTU, ITBI, Licenciamento, Defesa Civil, Censo/IBGE) para os 5 bairros; avanço nas conversas com empresas parceiras de dados; geração de tiles vetoriais (`PMTiles`). |
| **Marco 2: Semana Imersiva (Protótipo)** | Jan–Fev/2027 | Integração Nativa & Demo de Palco | Dev Build Android/iOS com `Share Intent`, leitura WebView, sensores reais no Modo Visita (`T7`), conexão com API FastAPI e teste moderado de compreensão com usuários reais. |
| **Marco 3: Finalização & Piloto Real** | Mar–Jun/2027 | Camadas Finais, RAG Documental & Uso no Mercado | Linha do tempo (`T13`), leitor de atas condominiais por IA com citação de página, camadas de calor/3D/sombra, limpeza dos textos de escala remanescentes e piloto em produção com usuários e corretores parceiros no Recife. |

---

### 3.4 Guia Rápido do Repositório para Desenvolvedores e Agentes de IA

```
.
├── docs/
│   ├── VEREDA_DOCUMENTO_DEFINITIVO.md   # <-- ESTE DOCUMENTO (Fonte Única da Verdade)
│   └── mock/                            # Mock clicável em HTML/CSS/JS + JSONs dos 5 dossiês e créditos
├── src/                                 # Aplicativo oficial em React Native 0.86 + Expo SDK 57 (Expo Router)
│   ├── app/                             # Rotas e telas (T1 a T16 + tela de controle /mock)
│   ├── componentes/                     # Componentes funcionais, gráficos, mapa, régua e cartões
│   ├── dados/                           # Esquema Zod (esquema.ts), consultas, formatação e cálculos geo
│   └── estado/                          # Contextos de sessão, preferências e persistência AsyncStorage
├── tests/
│   └── dominio.test.ts                  # Testes automatizados de esquema, cálculos, régua, mapa e formatos
├── index.html                           # Protótipo web histórico standalone (preservado na raiz)
└── ignorar/                             # Arquivo morto de documentos e pesquisas antigas (NÃO USAR)
```
