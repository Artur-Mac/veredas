# app1 — Mapa Sossego

Coleta: 17/11/2026. Fontes: `mapasossego.com.br`, `/sobre` (metodologia), `/faq`, `/produtos`, `/guia/*`, `/ruido/<cidade>`.

## 1. Identificação da Solução

- **Nome:** Mapa Sossego.
- **URL:** https://mapasossego.com.br (PT/EN).
- **Público-alvo:** comprador e inquilino brasileiro escolhendo onde morar; segundo público implícito, quem vai reclamar de barulho (guia jurídico) e jornalista/pesquisador que precisa de ranking de cidade.
- **Proposta central:** transformar dados abertos (OpenStreetMap + Censo 2022) em um **Índice Sossego de 0 a 100 por endereço/quadra**, com faixas nomeadas, sem medição de campo e sem login.
- **Escopo geográfico:** todo o Brasil, com **páginas de cidade** para dezenas de capitais (`/ruido/aracaju`, `/ruido/belem`, … `/ruido/recife`), cada uma com ranking de bairros.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Mapa e busca
- Busca por endereço e por **CEP** (declarado no FAQ).
- Mapa com o índice por ponto/quadra, não por bairro: o número muda dentro do mesmo bairro.
- Sem cadastro, sem limite de consulta visível, na versão gratuita.

### 2.2 O índice e as faixas
Escala declarada em `/sobre`:

| Faixa | Nome | dB(A) correspondente |
|---|---|---|
| 85–100 | Muito tranquilo | até 54 |
| 70–84 | Tranquilo | 54–59 |
| 50–69 | Moderado | 59–67 |
| 30–49 | Agitado | 67–75 |
| 0–29 | Barulhento | acima de 75 |

O mapeamento é aproximadamente linear: ~2,6 pontos por dB na faixa útil, ancorado em 48 dB → 100 e 86 dB → 0.

### 2.3 Inventário de fontes de ruído (o ativo real do produto)
Tudo carregado do **OpenStreetMap** num raio de alguns quilômetros:

1. **Vias** classificadas de rodovia a rua residencial.
2. **Ferrovias** e **linhas de metrô de superfície**.
3. **Aeroportos e heliportos num raio de 15 km**, com **pistas** e **rotas de pouso e decolagem** (corredores de aproximação).
4. **Zonas industriais.**
5. **Estádios.**
6. **Bares, pubs, casas noturnas e casas de show** (tratados como aglomerado: +9 dB quando há cluster).
7. **Restaurantes e lanchonetes.**
8. **Igrejas e templos.**
9. **Oficinas.**
10. **Mercados e feiras.**
11. **Terminais de ônibus.**

Densidade de moradores por quadra: **setores censitários do Censo 2022 (IBGE)**.

### 2.4 Modelo de emissão e propagação (declarado)
- **Emissão de referência a 10 m**, por tipo de via: rodovia ≈ 78 dB(A), arterial 73, coletora 68, local 61, residencial 48. Faixas extras e inclinação somam.
- **Propagação:** fonte linear ≈ **3 dB por dobra de distância**; fonte pontual ≈ **6 dB por dobra**; absorção ar/solo ≈ **1,8 dB por 100 m**.
- **Andar × fachada:** fatores de 60°, 120° e **12 dB** de atenuação entre fachada frontal e traseira.
- **Noite:** nota muda entre dia e noite (fonte noturna ganha peso).
- **Referência normativa:** NBR 10151, 55 dB(A) diurno e 50 dB(A) noturno.

### 2.5 Validação declarada
- **62 pontos** de comparação com medição real.
- **MAE 4,8 dB**, **correlação 0,55**.
- O FAQ diz explicitamente que **não é medição** e que a nota **não vale como laudo ou prova**.

### 2.6 Páginas de cidade e bairro
- `/ruido/<cidade>`: média da cidade, ranking de bairros, bairro mais silencioso e mais barulhento. Recife aparece com **139 bairros**, média municipal declarada de **67 dB(A) dia / 83 dB(A) noite**; mais tranquilo **Aldeia (100)**, mais barulhento **Ilha do Retiro (45)**.
- Página de bairro reproduz o índice e lista as fontes próximas.

### 2.7 Guia jurídico (aquisição orgânica)
Artigos prontos para busca de cauda longa:
- perturbação do sossego, **artigo 42** da Lei de Contravenções;
- **horários permitidos para obra**, inclusive sábado;
- o mito do "só depois das 22h";
- **onde denunciar** bar, igreja ou evento;
- se dá para medir ruído com o celular.

### 2.8 Produtos
Página `/produtos` separa o que é gratuito do que é pago (dados/relatórios), mantendo o mapa aberto como funil.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário:** endereço, CEP, ou clique no mapa. Nada mais. Nenhum dado pessoal é pedido.

**Fontes cruzadas:**
| Camada | Fonte | Tipo |
|---|---|---|
| Malha viária, uso do solo, POIs | OpenStreetMap | público, colaborativo |
| Densidade populacional | IBGE Censo 2022 (setores) | público |
| Aeroportos e pistas | OSM (aeroway) | público |
| Norma de conforto | ABNT NBR 10151 | público |
| Validação | 62 medições próprias (não publicadas ponto a ponto) | privado |

**Artefato final:** um número de 0 a 100, uma faixa nomeada, um mapa de calor e uma lista de fontes próximas com distância. Não há PDF, não há dossiê, não há histórico.

## 4. Mecânica de UI/UX e Visualização

- **Um número gigante + faixa nomeada** antes de qualquer explicação. É o mesmo padrão de "big number" que o pitch do VEREDA usa.
- **Mapa como resposta**, não como ferramenta: o usuário vê a mancha de cor e entende antes de ler.
- **Transparência em página própria** (`/sobre`): a metodologia é uma página, não um modal escondido. Isso é o que permite ao produto dizer "não é medição" sem perder credibilidade.
- **FAQ que antecipa a objeção.** As perguntas são as objeções reais: "é medição?", "por que o resultado parece errado para um lugar que conheço?", "moro em apartamento, o andar e a face mudam?".
- **Ranking de bairro como conteúdo compartilhável** — o formato que gera link e imprensa.
- **Guia jurídico** como camada de SEO: cada artigo responde uma dúvida que a pessoa digita no Google antes de procurar imóvel.

## 5. Regras de Negócio e Monetização

- **Modelo:** gratuito, monetizado por **anúncios** e por **links de afiliado para o Mercado Livre** (produtos na página `/produtos`).
- **Sem login, sem limite, sem paywall** no mapa: o custo marginal é baixo (tudo pré-computado a partir de OSM/IBGE) e a receita vem de audiência.
- **Moats declarados e reais:**
  1. **Pipeline de fontes**, não o dado bruto: qualquer um tem OSM; o valor é a classificação de emissão, o tratamento de corredor de aeroporto e o fator andar×fachada.
  2. **Escala nacional pré-computada** — refazer isso é caro, e o produto já indexou capitais.
  3. **Confiança calibrada**: publicar MAE e correlação é um ativo de marca; a maioria dos concorrentes não publica erro.
  4. **Conteúdo jurídico** que transforma o mapa em destino recorrente.
- **Gatilho de conversão:** o mapa entrega a nota; o produto pago entrega o recorte (relatório de endereço, dado para pesquisa, uso comercial). O FAQ deixa claro o que a nota **não** vale, o que reduz disputa jurídica.

## 6. Aplicação Direta no VEREDA

O VEREDA **não pode** copiar o número em dB(A) por andar/fachada: está no `FEATURE-REGISTER.md` como não habilitado (sem medição calibrada no Recife, decisão de 15/11/2026). O que se aproveita é o resto, e é bastante.

### 6.1 Ampliar o inventário de fontes de "De que lado vem o barulho" e de `atrito.ts`
Hoje o VEREDA usa vias principais + LUSE + atrito de bar/oficina/supermercado. O Mapa Sossego mostra que o inventário barato e verificável é maior, e todo ele sai de OSM:

| Fonte | Já no VEREDA? | Ganho |
|---|---|---|
| Estádios | não | Ilha do Retiro, Arruda — estádio é evento sazonal de pico, não ruído médio |
| Terminais de ônibus | não | ruído de frenagem e motor em marcha lenta o dia inteiro |
| Ferrovia / metrô de superfície | não | linha férrea corta bairros do Recife |
| Mercados e feiras | não | feira de bairro é pico semanal previsível |
| Igrejas e templos | não | sino e evento noturno |
| Zonas industriais | não | Suape não, mas distritos industriais sim |
| Aeroporto (pista e corredor, raio 15 km) | bloqueado por decisão | **manter bloqueado**; o corredor é o dado que o VEREDA decidiu não publicar |

Isso amplia a lista de "3 fontes nomeadas mais próximas" que o `SimuladorDaUnidade` já mostra, **sem nenhum dB**.

### 6.2 Copiar a relação distância → consequência, não o número
O Mapa Sossego usa 3 dB/dobra para linha e 6 dB/dobra para ponto. O VEREDA pode usar a **mesma geometria** para dizer: "esta fonte é a mais próxima; a duplicação da distância reduz o efeito pela metade" — sem afirmar nível absoluto. É a tradução qualitativa de uma lei física, e é defensável.

### 6.3 Fator andar × fachada como texto, não como dB
O 12 dB entre frente e fundo é o dado que sustenta a frase mais útil do `SimuladorDaUnidade`: **"no fundo do lote o efeito cai de forma relevante; na frente, não"**. O VEREDA já tem o simulador 3×3 de bússola; falta a frase de consequência por face. Usar "cai bastante / cai pouco", nunca "12 dB".

### 6.4 Página de bairro como ativo permanente
`/ruido/recife` com ranking de 139 bairros é o modelo exato do que o VEREDA pode publicar com o índice de **7.206 edifícios em 72 bairros**: uma página por bairro respondendo "o que muda aqui", sem preço, sem ranking de valor. Isso é conteúdo que o `docs/aplicacao` já tem em forma de camada e que hoje não vira página.

### 6.5 Protocolo de validação como portão, não como promessa
O Mapa Sossego só publica índice porque mediu 62 pontos e declarou MAE 4,8 dB / r 0,55. Esse é exatamente o formato de portão que o VEREDA precisa se algum dia quiser dB: **n ≥ 30 pontos por área, MAE publicado, correlação publicada, e a frase "não é medição" na tela**. Guardar como critério em `A33` (pesquisa de exposição acústica), que hoje está corretamente adiada.

### 6.6 O que **não** copiar
- Não copiar a média municipal de dB: o VEREDA não tem medição e a média esconde o que importa (a fonte a 40 m).
- Não copiar o corredor de aeroporto: bloqueado por decisão, e em Recife o aeroporto é um caso sensível.
- Não copiar o modelo de receita por anúncio/afiliado: conflita com a posição de produto do VEREDA.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Ampliar inventário de fontes (6 categorias OSM) | nenhum (OSM já usado) | 1 ciclo de extração + revisão |
| Frase de consequência por face no simulador | nenhum | pequeno, só `simuladorDaUnidade.ts` |
| Página por bairro | nenhum (índice atual) | médio, geração estática |
| Portão de validação acústica | 30+ medições | grande; só se A33 sair do adiado |
