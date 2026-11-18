# app29 — Placer.ai

Coleta: 17/11/2026. Fontes: `placer.ai` (home, `/products/platform`, `/products/api`, `/resources/our-data`, `/solutions/cre`, `/solutions/civic`, `/anchor`, `/free-tools/*`, `/company/data-for-good`).

## 1. Identificação da Solução

- **Nome:** Placer Labs (Placer.ai).
- **URL:** https://www.placer.ai.
- **Público-alvo:** varejo, **imobiliário comercial**, governo municipal, CPG, entretenimento, publicidade, financeiro, restaurante, saúde, educação.
- **Proposta central:** **inteligência de localização a partir de fluxo de pessoas** — estimar quantas pessoas visitam qualquer lugar dos EUA, de onde vêm, quanto tempo ficam e para onde vão depois.
- **Escala:** **4.000+ clientes** declarados; painel de **dezenas de milhões de dispositivos móveis**.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 O dado
- **Painel de dispositivos móveis** de "dezenas de milhões", formando amostra representativa da população dos EUA.
- Origem: **provedores de aplicativo diversos, avaliados** (*vetted*).
- Métricas por local: **visitas**, **visitantes únicos**, **frequência**, **tempo de permanência**, **dia e hora de pico**, **origem do visitante** (onde mora), **destino seguinte**.
- **True Trade Area**: a área real de onde vêm os visitantes — não o raio de 5 km do mapa.
- Análise de **vazio competitivo** (*void analysis*): onde há demanda sem oferta.

### 2.2 O desenho de privacidade (a parte mais relevante)
Quatro regras declaradas, e todas são técnicas:
1. **Não coletam identificador**: o dado chega **sem MAID**, sem nome, sem ID persistente de dispositivo e sem contato.
2. **Agregação e extrapolação** por algoritmo próprio antes de virar estimativa.
3. **Nunca exibem dado de nível de usuário**: "o que você vê no mapa nunca representa a localização de um dispositivo em particular".
4. **Limiar mínimo de 50 dispositivos únicos** por local — abaixo disso, **não há dado**.

### 2.3 Certificações e governança
- **SOC 2** e **ISO 27001** mantidos anualmente.
- Provedores avaliados para garantir **base legal** de coleta.
- Página "Trust Center" e programa "Data for Good".

### 2.4 Formatos de entrega
| Canal | Uso |
|---|---|
| **Plataforma** | análise e relatório prontos |
| **API** | dado programático para aplicação interna |
| **Data Feeds** | entrega em escala para o warehouse do cliente |
| **Data Marketplace** | catálogo de conjunto de dado |
| **Free Tools** | páginas públicas por rede (ex.: Walmart, supermercado, academia) |

### 2.5 As ferramentas gratuitas
Páginas públicas com dado agregado de uma **rede** (tráfego por unidade, tendência). É aquisição: o usuário vê o dado de graça e **compra a capacidade de ver o seu**.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** coordenada ou polígono de um local; no caso de *trade area*, o conjunto de visitantes.

**Fontes cruzadas:** painel móvel (sem identificador), limites de local, dados de negócio e de mercado, e o dado do cliente.

**Artefato final:** estimativa de visita por local e período, área de influência, análise de vazio, e **relatório comparativo entre locais** — nunca dado individual.

## 4. Mecânica de UI/UX e Visualização

- **Local como unidade**, com painel comparativo ao lado (benchmark contra a rede e contra a região).
- **Trade area desenhada pelo comportamento**, não pelo raio.
- **Ranking de locais** da mesma rede, com percentil.
- **Comparação temporal** (mesmo mês do ano anterior).
- **Limiar visível**: o produto diz quando **não há dado suficiente**, em vez de estimar com 3 dispositivos.
- **Ferramenta gratuita** como porta de entrada.

## 5. Regras de Negócio e Monetização

- **Modelo:** assinatura enterprise por plataforma + API/feeds por volume + marketplace de dado.
- **Gatilho:** decisão de abrir, fechar ou reposicionar um ponto comercial — **capital de risco alto** com informação ruim.
- **Moat:**
  1. **Painel proprietário de dezenas de milhões** de dispositivos (ativo de aquisição, não de código).
  2. **Modelo de extrapolação** calibrado e validado.
  3. **Série histórica** que ninguém reconstrói.
  4. **4.000 clientes** e benchmark de rede, que melhora com escala.

## 6. Aplicação Direta no VEREDA

O Placer não é copiável — o VEREDA não tem (nem deve ter) painel de dispositivos. Mas o dossiê entrega **duas regras de produto** e **um caminho alternativo** para "vida na rua".

### 6.1 O limiar de 50 é a regra que o VEREDA deve adotar
O VEREDA agrega dado do usuário (caderno de imóveis, medianas de custo) com **mínimo 5** amostras. O Placer usa **50** para o dado mais sensível (localização) e não publica abaixo disso.

Proposta de política explícita, por sensibilidade:

| Tipo de dado agregado | Mínimo | Publica? |
|---|---|---|
| Preço/taxa do caderno do usuário | **10** (subir de 5) | só mediana e faixa, no aparelho |
| Contagem de edifícios por face/andar | 3 | sim (não é pessoa) |
| Qualquer dado derivado de pessoas | **50** | não — só o fato agregado do lugar |

O texto do produto fica simples: **"não mostramos número quando a amostra é pequena"**. É a mesma frase do Placer e resolve a objeção de privacidade antes de ela existir.

### 6.2 "Nunca exibimos dado de nível de usuário" como cláusula de produto
O VEREDA não tem servidor, então isso é trivialmente verdade — mas **não está escrito em lugar nenhum**. Deve estar, na mesma frase do `app27` (§6.4): o dado fica no aparelho, não há conta, não há sincronização, não há perfil. Três negações concretas valem mais que uma promessa de privacidade.

### 6.3 "Vida na rua" sem painel móvel: o caminho determinístico
O VEREDA quer medir vida na rua (`Placar`, `R6`). O Placer resolve com fluxo de pessoas; o VEREDA pode resolver com **oferta de comércio e serviço**, que é dado aberto e estável:

| Sinal | Fonte | O que diz |
|---|---|---|
| Nº de estabelecimentos por 300 m | OSM | densidade de uso |
| Mistura de tipos (padaria, farmácia, bar, escola) | OSM | variedade |
| Horário de funcionamento declarado | OSM (`opening_hours`) | vida noturna vs. diurna |
| Frente ativa (comércio com porta para a rua) | OSM + geometria | rua "viva" vs. muro |
| Contagem de edifícios residenciais na face | índice VEREDA | olhos na rua |

Isso é **proxy declarado**, não medição de fluxo — e deve ser dito assim: "densidade de comércio e serviço a 300 m", nunca "movimento de pessoas". A diferença de nome é a diferença entre leitura e invenção.

### 6.4 Comparação temporal e limiar visível
Duas mecânicas de UI que servem direto:
1. **Comparar com o mesmo período do ano anterior** em tudo que é contagem (obras, licenças, alvarás). O VEREDA tem 2026 e parte de 2025; já dá para dizer "12 obras neste trimestre contra 8 no ano passado".
2. **Dizer quando não há base** — o `R17` (três estados) já cobre, e o Placer confirma que o usuário **aceita** a lacuna quando ela é nomeada.

### 6.5 O que **não** copiar
- **Painel de dispositivos móveis**: vigilância de localização, ainda que agregada. Decisão de produto e de ética.
- **Trade area por comportamento**: exige o painel.
- **Venda de feed de dado de pessoa**: fora de questão.
- **Estimativa abaixo do limiar**: o próprio Placer proíbe.
- **Certificação SOC 2 / ISO**: o VEREDA não tem servidor; a certificação equivalente é a arquitetura local.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Política de limiar mínimo (10 / 50) | nenhum | pequeno |
| Cláusula "sem conta, sem sync, sem perfil" | nenhum | pequeno |
| Índice de vida na rua por OSM (proxy declarado) | OSM (já usado) | médio |
| Comparação com mesmo período do ano anterior | nenhum | pequeno |
