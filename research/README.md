# VEREDA — Arsenal de Pesquisa Estratégica & Inteligência Imobiliária

> **Repositório Central de Conhecimento, Fundamentos Teóricos, Mecanismos Não-Convencionais e Validação de Mercado para o Projeto VEREDA (Campus Mobile 15ª Edição).**

Este diretório reúne o acervo completo de investigação estratégica, pesquisa multidisciplinar e modelagem de produto realizado para conceber o **VEREDA**. O objetivo deste arsenal é fornecer à equipe (e a futuras IAs e parceiros) a base técnica, analítica e conceitual para sustentar cada decisão de produto, apresentação executiva, arquitetura de dados e posicionamento competitivo.

---

## 🗺️ Mapa de Navegação do Arsenal

```
research/
├── README.md                                    # Este guia e índice geral do acervo
├── 01_MASTER_RESEARCH_ATLAS_STAGE1.md           # Monografia Master Etapa 1 (~40.000 palavras)
├── 02_DEEP_RESEARCH_ATLAS_STAGE2.md             # Monografia Master Etapa 2 (~30.000 palavras)
│
├── summaries/                                   # Sínteses Executivas & Guias Rápidos de Decisão
│   ├── stage1_executive_summary_roadmap.md      # Resumo Executivo Etapa 1 e Matriz de Fechamento
│   └── stage2_executive_playbook.md             # Playbook Estratégico Etapa 2 e Espaço em Branco
│
├── stage1_foundations/                          # Etapa 1: Mecanismos, Analogias Cruzadas & Dados Abertos
│   ├── 01_direct_proptech_landscape.md          # Diagnóstico de Portais (Zillow, QuintoAndar, ZAP) e Conflito de Interesses
│   ├── 02_cross_industry_mechanisms.md          # Mecanismos de Aviação, Saúde, Finanças, Defesa e Spotify
│   ├── 03_unconventional_proxies_sensors.md    # Sensores Indiretos, Azimutes Celulares, Clusters de Entregas e Acústica
│   ├── 04_vision_spatial_acoustics.md           # Visão Computacional, Planta Baixa e Diagnóstico de Fachada
│   ├── 05_personalization_regret_minimization.md# Elicitação por Pares (*Pairwise*), Veto Gates e Prevenção de Arrependimento
│   ├── 06_brazilian_data_warehouse_geosampa.md  # Camadas Oficiais Brasileiras (GeoSampa, CNEFE, IPTU, SisRBC, Sabesp)
│   ├── 07_strategic_product_directions.md       # Quatro Arquétipos de Produto e Caminhos Estratégicos
│   ├── 08_feature_concepts_architecture.md      # Blueprints de Telas, Fluxos Algorítmicos e Esquemas de Dados
│   └── 09_synthesis_white_space_matrix.md       # Matriz de Viabilidade vs. Defensibilidade e Posicionamento
│
└── stage2_deep_dive/                            # Etapa 2: Crítica Epistemológica, Realidade BR & Anti-Listing
    ├── 01_audit_epistemological_corrections.md  # Autocrítica Impiedosa, Eliminação de Scores Comoditizados e Falsas Premissas
    ├── 02_high_conviction_mechanisms.md         # Aprofundamento dos 5 Mecanismos de Alta Convicção
    ├── 03_brazil_recife_sp_grounding.md         # Ancoragem Hiperlocal (São Paulo e Recife, Prédios-Caixão, Rodízio Compesa/Sabesp)
    ├── 04_revealed_preference_pairwise_engine.md# Motor Matemático de Trade-offs e Preferências Reveladas
    ├── 05_compound_signal_fusion_recipes.md     # Fórmulas de Fusão: Combinando Sinais Fracos em Certezas Forenses
    ├── 06_anti_listing_adversarial_auditor.md   # Arquitetura do "Anti-Listing": Reversão de Home Staging e Detecção de Flips
    ├── 07_failure_modes_countermeasures.md      # Modos de Falha, Riscos Jurídicos e Contramedidas Adversariais
    ├── 08_white_space_map_moats.md              # Mapeamento do Espaço em Branco Defensável e Fosso Tecnológico (*Moats*)
    └── 09_final_synthesis_executive_playbook.md # Síntese Final e Playbook de Execução para o Campus Mobile
```

---

## 🔬 Visão Geral dos Módulos

### 1. Monografias Master
* [`01_MASTER_RESEARCH_ATLAS_STAGE1.md`](./01_MASTER_RESEARCH_ATLAS_STAGE1.md):
  * Documento monolítico integrando todas as 9 partes da primeira fase de pesquisa.
  * Desconstrói o modelo econômico dos portais imobiliários tradicionais e sua incapacidade intrínseca de expor atritos residenciais.
  * Mapeia 105 mecanismos de tomada de decisão inspirados em setores ultracomplexos (aviação, medicina diagnóstica, inteligência militar e trading).
* [`02_DEEP_RESEARCH_ATLAS_STAGE2.md`](./02_DEEP_RESEARCH_ATLAS_STAGE2.md):
  * Documento monolítico da segunda fase de validação e autocrítica rigorosa.
  * Elimina premissas frágeis da Etapa 1 (ex.: dependência de APIs fechadas como Strava Metro ou Uber Movement descontinuado).
  * Enraíza a tecnologia na realidade das cidades brasileiras: vícios em matrículas imobiliárias, alvarás de demolição vizinhos, prédios-caixão em Recife e racionamento de água.

---

### 2. Sínteses Executivas (`summaries/`)
* [`stage1_executive_summary_roadmap.md`](./summaries/stage1_executive_summary_roadmap.md):
  * Síntese em alta velocidade dos achados da Etapa 1.
  * O Paradoxo do Valor Inverso: os atributos mais visíveis no anúncio são os menos correlacionados com a satisfação de longo prazo.
* [`stage2_executive_playbook.md`](./summaries/stage2_executive_playbook.md):
  * Guia de decisões executivas da Etapa 2.
  * A tese do **"Auditor Adversarial do Inquilino/Comprador"** e a substituição definitiva de scores numéricos abstratos por *veto gates* binários.

---

### 3. Fundamentos e Mecanismos da Etapa 1 (`stage1_foundations/`)
* **01 - Paisagem PropTech & Conflitos de Interesse:** Porque portais como ZAP, VivaReal, QuintoAndar e Zillow são estruturalmente impedidos de proteger o usuário contra riscos do imóvel (monetização via comissão do corretor/anunciante).
* **02 - Mecanismos Cross-Industry:** Como o checklist pré-voo da aviação, os triângulos de diagnóstico médico e os motores de recomendação implícita do Spotify e Tinder podem ser aplicados na escolha de moradia.
* **03 - Sensores Não-Convencionais & Proxies:** Uso de sombras de antenas celulares, rotas de entregadores de delivery noturno e microtopografia para inferir ruído, conectividade e escoamento pluvial.
* **04 - Visão Computacional & Física Espacial:** Estimativa de altura de teto, ventilação cruzada, orientação solar em solstícios e separação entre fissura estética de reboco e recalque estrutural de fundação.
* **05 - Personalização & Minimização de Arrependimento:** Teoria das preferências reveladas contra preferências declaradas; por que questionários de 30 perguntas falham e como escolhas pareadas revelam a verdadeira curva de utilidade do usuário.
* **06 - O Armazém de Dados Brasileiro:** Especificação detalhada de como extrair valor de bases municipais e federais abertas (GeoSampa, CNEFE/IBGE, IPTU São Paulo, SisRBC, alvarás de licenciamento municipal).
* **07 - Direções Estratégicas:** Discussão dos 4 arquétipos de produto: *Due Diligence Forense*, *Simulador de Vida Diária*, *Negociador Adversarial* e *Subscritor de Decisão*.
* **08 - Conceitos de Features & Telas:** Detalhamento funcional de wireframes, fluxos de intake por link e geradores de perguntas para vistoria.
* **09 - Síntese & Matriz de Espaço em Branco:** Cruzamento de complexidade técnica vs. barreira de entrada e valor percebido.

---

### 4. Aprofundamento Crítico e Realidade Nacional da Etapa 2 (`stage2_deep_dive/`)
* **01 - Autocrítica Epistemológica:** Purificação de vícios comuns de produtos de IA: combate à "fadiga de scores", rejeição de métricas genéricas de caminhabilidade e calibração de viabilidade.
* **02 - Os 5 Mecanismos de Alta Convicção:** Especificação aprofundada dos motores centrais: Perfil Altimétrico, Insolação/Gabarito, Auditoria de Custos Ocultos, Resolução Cadastral de Imóvel e Checklist de Vistoria de Campo.
* **03 - Ancoragem em São Paulo e Recife:** Particularidades geográficas e legislativas brasileiras (crise hídrica, rodízio de água, cisternas, alagamento de vias e vulnerabilidade construtiva).
* **04 - Motor Matemático de Preferências Reveladas:** Formalização matemática dos trade-offs de decisão sem pontuações artificiais.
* **05 - Fórmulas de Fusão de Sinais Compostos:** Como a intersecção de três bases públicas abertas e imperfeitas produz uma certeza preditiva superior à de uma vistoria presencial apressada.
* **06 - O "Anti-Listing":** Como desmontar truques de grande angular, lentes olho de peixe, fotos com contraste forçado e reformas cosméticas para mascarar infiltrações.
* **07 - Riscos Jurídicos e Contramedidas:** Proteção contra passivos de difamação, responsabilidade civil nas análises e blindagem da integridade metodológica.
* **08 - Mapeamento de Fossos Tecnológicos (*Moats*):** O que torna o VEREDA impossível de ser copiado rapidamente pelos portais tradicionais.
* **09 - Playbook Final:** O plano tático para levar o VEREDA do Campus Mobile até o mercado real.

---

## 💡 Como Utilizar Este Arsenal

1. **Para Novas Telas e Funcionalidades:** Consulte os arquivos `stage1_foundations/08_feature_concepts_architecture.md` e `stage2_deep_dive/02_high_conviction_mechanisms.md`.
2. **Para Pitches e Bancas do Campus Mobile:** Utilize as sínteses em `summaries/` e o mapa de defensibilidade em `stage2_deep_dive/08_white_space_map_moats.md`.
3. **Para Integração de Dados Reais:** A bíblia de conectores e APIs públicas brasileiras está em `stage1_foundations/06_brazilian_data_warehouse_geosampa.md`.
4. **Para Treinar Novas Instâncias de IA:** Entregue este diretório como contexto (`context window`) para que o modelo absorva instantaneamente a profundidade intelectual e as diretrizes do VEREDA.
