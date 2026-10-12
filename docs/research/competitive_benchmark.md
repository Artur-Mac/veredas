# Benchmark Competitivo e Análise de Substitutos — VEREDA

> **Data do Levantamento:** Outubro de 2026  
> **Escopo:** Avaliação empírica e documental de plataformas imobiliárias brasileiras, ferramentas internacionais de inteligência residencial, modelos de AVM e assistentes de IA de uso geral.  
> **Objetivo:** Mapear a lacuna estrutural de produto que justifica a existência do VEREDA e fundamentar a defesa na 15ª Edição do Campus Mobile (*Tecnologias Urbanas*).

---

## 1. O Problema Estrutural do Mercado: O Conflito de Interesses dos Portais

O ecossistema imobiliário digital brasileiro é dominado por portais de classificados cujo modelo de receita depende da venda de leads e destaque para corretores e imobiliárias. Esse modelo impõe um **conflito de interesses intransponível**:

$$\\text{Receita do Portal} \\propto \\text{Volume de Leads e Contatos Gerados}$$

Se um portal exibir de forma destacada que o apartamento desejado fica em frente a uma obra de 28 andares aprovada para os próximos 2 anos, que a ladeira de acesso inviabiliza caminhadas ou que o condomínio real tem uma taxa extra de 30% omitida, **a conversão do anúncio despenca**, e o anunciante (que paga a mensalidade do portal) reclama ou cancela o serviço.

Portanto, a assimetria de informação não é um defeito acidental dos portais: **é uma propriedade protegida pelo modelo de negócios**.

---

## 2. Matriz Comparativa de Capacidades

A tabela abaixo compara o **VEREDA** contra os principais concorrentes diretos, substitutos indiretos e ferramentas de inteligência global:

| Dimensão / Capacidade | Portais Tradicionais (ZAP, VivaReal, OLX) | Plataformas Transacionais (QuintoAndar, Loft) | Avaliação & AVM (DataZAP, Precifica) | Ferramentas Globais (Localize.city, AddressReport) | IAs Genéricas (ChatGPT, Perplexity) | **VEREDA** (Inteligência de Decisão) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Intake sem Fricção (URL/Print)** | ❌ (Busca interna) | ❌ (Busca interna) | ❌ (Formulário) | ⚠️ (Endereço exato) | ⚠️ (Texto copiado) | **✅ 1 clique (Link ou Endereço)** |
| **Resolução Cadastral de Edifício** | ❌ (Oculta número) | ⚠️ (Oculta até visita) | ❌ (Apenas bairro/rua)| ⚠️ (Endereços EUA) | ❌ (Alucina números) | **✅ Cruzamento CNEFE/IPTU/GeoSampa** |
| **Auditoria de Custos Ocultos** | ❌ (Valores autodeclarados) | ⚠️ (Calcula seguro, omite rateio) | ❌ (Foca em preço de venda) | ⚠️ (Taxas de NY/EUA) | ❌ (Não acessa atas/convenções) | **✅ Rent vs. Outlay Efetivo (+Rateios)** |
| **Enriquecimento com Dados Públicos** | ❌ (Nenhum) | ❌ (Nenhum) | ⚠️ (Apenas transações) | ✅ (GIS municipal NY) | ⚠️ (Apenas dados indexados web) | **✅ GeoSampa, SisRBC, CNEFE, SEDEC** |
| **Topografia Real vs. Tempo a Pé** | ❌ (Linha reta comercial) | ❌ (Distância euclidiana) | ❌ (Sem altimetria) | ⚠️ (Apenas Walk Score) | ❌ (Google Maps padrão) | **✅ Perfil Altimétrico (Aclive % e Esforço)** |
| **Detecção de Obras no Entorno** | ❌ (Omissão deliberada)| ❌ (Omissão deliberada) | ❌ (Sem alvarás) | ✅ (DOB permits em NY)| ❌ (Sem base de alvarás PMSP/PCR) | **✅ Alvarás SisRBC e Gabarito Vizinho** |
| **Tratamento Explícito de Lacunas** | ❌ (Finge completude) | ❌ (Finge completude) | ❌ (Score fechado) | ⚠️ (Métricas agregadas) | ❌ (Alucina respostas) | **✅ "Ainda Não Sabemos" é 1ª classe** |
| **Geração de Ações para Visita** | ❌ (Incentiva agendamento cego) | ❌ (Incentiva agendamento cego) | ❌ (Não se aplica) | ❌ (Apenas leitura) | ⚠️ (Sugestões genéricas) | **✅ Checklist Físico e WhatsApp Corretor** |
| **Comparação sem Notas Abstratas** | ⚠️ (Tabela de atributos)| ⚠️ (Favoritos básicos) | ❌ (Não compara) | ❌ (Dashboards isolados) | ⚠️ (Resumos em texto) | **✅ Matriz de Trade-offs e Sacrifícios** |

*Fontes e Verificação: Inspeção direta de plataformas ativas em SP e Recife (Out/2026); documentação técnica Localize.city (2021-2024); relatórios FipeZAP (2025-2026).*

---

## 3. Análise Detalhada dos Competidores e Substitutos

### 3.1 Portais de Classificados (Grupo OLX: ZAP Imóveis, VivaReal; QuintoAndar / Loft)
* **Como operam:** Agregadores de anúncios pagos por corretores ou proprietários.
* **O que fazem bem:** Escala de inventário, alcance nacional, ferramentas de busca com filtros de preço e metragem, agendamento de visitas integrado.
* **Onde falham gravemente:**
  1. *Ambiguidade intencional de endereço:* Ocultam o número da fachada para impedir que o comprador/inquilino contate diretamente o porteiro ou o proprietário, gerando confusão sobre a real localização.
  2. *Valores de condomínio e IPTU defasados:* Não realizam auditoria; o proprietário informa R$ 500 para atrair interessados, quando o boleto real com fundo de reserva e portaria remota é R$ 850.
  3. *Invisibilidade de fricções urbanas:* Não informam se a rua alaga em chuvas fortes, se há canteiro de obras no lote vizinho ou se a subida da rua é íngreme.

### 3.2 Modelos de Avaliação Automática / AVMs (DataZAP, Precifica, Loft AVM)
* **Como operam:** Modelos hedônicos e redes neurais que estimam o preço justo do metro quadrado a partir de anúncios ativos e dados cartoriais de transação.
* **O que fazem bem:** Estimativa macroeconômica de valorização imobiliária e suporte para investidores e bancos.
* **Onde falham gravemente:**
  1. *Cegos às condições vivenciais da unidade:* Dois apartamentos no mesmo prédio com a mesma metragem podem ter preços idênticos no AVM, mas um dá para a parede da torre vizinha e o outro tem sol da manhã livre.
  2. *Foco estritamente financeiro:* Não apoiam o usuário em sua rotina, mobilidade a pé ou conforto acústico.

### 3.3 Ferramentas Internacionais de Inteligência Urbana (Localize.city / Madelon, AddressReport)
* **Como operam:** Plataformas americanas que cruzam bases públicas municipais de Nova York (DOB permits, 311 noise complaints, MTA) para alertar sobre obras e ruído.
* **O que fazem bem:** Pioneirismo no cruzamento de alvarás de construção com mapas residenciais.
* **Limitações estruturais e por que não servem ao Brasil:**
  1. *Falência do modelo de assinatura B2C isolado:* A Localize.city enfrentou dificuldades quando tentou cobrar US$ 29/mês diretamente do consumidor americano, forçando um pivô para B2B com corretoras.
  2. *Inexistência no Brasil:* Não possuem conectores para a realidade cadastral caótica brasileira (IPTU PMSP, CNEFE/IBGE, EMPREL Recife, Compesa, SisRBC).
  3. *Ausência do ecossistema de campo:* Não geram roteiros práticos de vistoria física ou integração com o fluxo brasileiro de contato via WhatsApp com o corretor.

### 3.4 Assistentes de IA de Uso Geral (ChatGPT, Perplexity, Gemini)
* **Como operam:** LLMs treinados em texto web que respondem a perguntas livres sobre bairros ou analisam textos de anúncios copiados e colados.
* **O que fazem bem:** Resumo de textos longos e geração de perguntas genéricas.
* **Onde falham categoricamente:**
  1. *Alucinação cadastral e espacial:* Sem acesso a bases geoespaciais em tempo de execução, inventam números de alvarás e erram distâncias a pé e altimetria.
  2. *Sem dados fechados/municipais:* Não consultam bases de zoneamento (GeoSampa), restrições de tombamento (CONDEPHAAT) ou histórico de alagamentos (SEDEC).
  3. *Incapacidade de auditoria determinística:* Tratam números financeiros como texto livre, falhando na conferência exata de boletos e taxas condominiais extraordinárias.

---

## 4. O Espaço em Branco Defensável do VEREDA

A análise concorrencial comprova que existe um **vácuo tecnológico e de produto** no momento pós-descoberta:

```
[DESCOBERTA DO ANÚNCIO] ───────► [VÁCUO DE DECISÃO] ───────► [TRANSAÇÃO & ASSINATURA]
  (Portais dominam:                (Ninguém atua:               (QuintoAndar / Cartórios:
   ZAP, QuintoAndar,                VEREDA opera aqui:           Contratos e vistorias
   VivaReal, Loft)                  Auditoria Forense,           transacionais)
                                    Evidências Oficiais,
                                    Custo Efetivo,
                                    Incertezas de Campo)
```

O VEREDA se posiciona estrategicamente **não como um portal alternativo**, mas como o **Auditor de Decisão do Cidadão**, transformando o anúncio incompleto em poder de negociação e clareza de vida.
