# app6 — Walk Score

Coleta: 17/11/2026. `walkscore.com` respondeu **HTTP 408** em todas as tentativas (navegador, `webfetch`, `curl`), portanto a fonte primária não estava acessível. Conteúdo obtido de: **whitepaper oficial "Walk Score Methodology" (15/07/2011)**, arquivado em `archive.org/details/walk-score-methodology` (texto completo do documento da própria empresa), mais páginas de suporte Redfin e literatura acadêmica que reproduzem a fórmula.

## 1. Identificação da Solução

- **Nome:** Walk Score (marca original Front Seat Management; hoje operada dentro do **Redfin**).
- **URL:** https://www.walkscore.com.
- **Público-alvo:** consumidor comprando/alugando casa; e **B2B** (portais, bancos, incorporadoras, prefeituras) via API.
- **Proposta central:** reduzir caminhabilidade a **um número de 0 a 100**, calculado por distância a amenidades, com **penalidade de pedestrianismo** (densidade de interseção e comprimento de quadra).
- **Produtos irmãos:** **Transit Score** (0–100, qualidade e frequência do transporte) e **Bike Score**.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 A fórmula (documento oficial)
**Categorias e pesos** — o número depois da categoria é o peso; vários números significam múltiplas contagens da mesma categoria, com peso decrescente:

```
grocery        [3]
restaurants    [.75, .45, .25, .25, .225, .225, .225, .225, .2, .2]   → total 3
shopping       [.5, .45, .4, .35, .3]                                  → total 2
coffee         [1.25, .75]                                             → total 2
banks          [1]
parks          [1]
schools        [1]
books          [1]
entertainment  [1]
```

Leitura importante: **mercado pesa 3**, restaurantes/bares pesam 3 **distribuídos em 10 contagens** (variedade importa), compras e café pesam 2, e o resto pesa 1. O total é normalizado para 0–100.

### 2.2 Função de decaimento por distância
- **Até 0,25 milha (5 min a 3 mph): pontuação cheia ou quase cheia.**
- **A 1 milha (20 min): ~12% da pontuação.**
- **Após 1,5 milha (30 min): zero.**
- O decaimento é **polinomial por partes**, não exponencial.
- **Parques têm o decaimento deslocado +0,25 milha**, porque a distância costuma ser medida do centro do parque e não da entrada. Esse é um detalhe de implementação valioso.

### 2.3 Penalidade de pedestrianismo
Depois do score base, o endereço pode perder pontos por:
- **densidade de interseção** baixa;
- **comprimento médio de quadra** alto;
- (na versão "Street Smart") **rotas reais de caminhada**, não linha reta.

### 2.4 Faixas nomeadas
| Faixa | Rótulo |
|---|---|
| 90–100 | *Walker's Paradise* — tarefas do dia a dia sem carro |
| 70–89 | *Very Walkable* — a maioria das tarefas a pé |
| 50–69 | *Somewhat Walkable* — algumas tarefas a pé |
| 25–49 | *Car-Dependent* — a maioria exige carro |
| 0–24 | *Car-Dependent* (extremo) |

### 2.5 Transit Score e Bike Score
- **Transit Score**: soma ponderada de linhas próximas, com peso por **qualidade do serviço** (frequência, tipo, cobertura). Faixas de *Rider's Paradise* a *Minimal Transit*.
- **Bike Score**: infraestrutura cicloviária, declive, conectividade e destinos.

### 2.6 Fontes de dados declaradas
| Camada | Fonte |
|---|---|
| Listagens de negócios | **Google** e **Localeze** |
| Malha viária e parques | **OpenStreetMap** |
| Escolas | **Education.com** |
| Transporte público | **mais de 200 agências** |
| Curadoria de amenidades | usuários logados, edição tipo wiki |

### 2.7 Curadoria colaborativa com controle
Usuário pode **adicionar** amenidade faltante ou **remover** fechada/errada. Exige login e edição wiki-style "para evitar que se manipule o score adicionando amenidades". É um detalhe de governança que quase ninguém copia.

### 2.8 API
`WSAPI` retorna Walk Score, Transit Score e Bike Score por latitude/longitude/endereço, com cobrança por volume de chamadas. É a base do uso B2B em portais.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário:** endereço, CEP ou coordenada. No B2B, lote de coordenadas.

**Fontes cruzadas:** negócios (Google/Localeze), vias e parques (OSM), escolas (Education.com), transporte (200+ agências).

**Artefato final:** um número 0–100 com rótulo, mais a **lista de amenidades encontradas por categoria com distância** — que é o que dá credibilidade ao número.

## 4. Mecânica de UI/UX e Visualização

- **Número + rótulo + frase de consequência** ("a maioria das tarefas pode ser feita a pé"). É o mesmo padrão do Mapa Sossego e do Localize.
- **Quebra por categoria** logo abaixo: mercado, restaurante, café, compras, parque — cada um com a distância da mais próxima. O usuário confere o número com o próprio conhecimento.
- **Mapa com raio de caminhada.**
- **Comparação entre endereços** lado a lado (recurso de portal).
- **Selo embutível** em anúncio — distribuição pelo parceiro, não pelo consumidor.

## 5. Regras de Negócio e Monetização

- **Consumidor:** gratuito, com anúncio e parceria de portal.
- **B2B:** API paga por volume; licenciamento de dados para pesquisa e planejamento (shapefiles GIS).
- **Moat:**
  1. **Marca** — "Walk Score" virou substantivo comum no mercado americano.
  2. **Fórmula publicada e patenteada** ("patent-pending Street Smart"), o que dá defensabilidade e autoridade simultâneas.
  3. **Distribuição embutida** em milhares de anúncios e portais.
  4. **Curadoria** que corrige a base sem virar produto de dados.
- **Limite:** um número global único esconde o que importa (a ladeira, a travessia, a calçada). O VEREDA não deve repetir esse erro.

## 6. Aplicação Direta no VEREDA

O VEREDA já faz algo **mais difícil** que o Walk Score: distância **de rede** a partir da **entrada do edifício**, com plano B e cadeia de tarefas (`DiaADia`, ciclo `rede` + `destinos`). O Walk Score é útil como **camada de apresentação**, não como método.

### 6.1 Uma "Nota a pé" explicável, derivada do que já existe
Hoje o `DiaADia` devolve minutos e cadeia de tarefas. Um score 0–100 só vale a pena se for **auditável**. Proposta:

```
nota = 100 × Σ (peso_categoria × decaimento(minutos)) / Σ peso_categoria
```

com os pesos do Walk Score adaptados ao Recife:

| Categoria | Peso | Justificativa |
|---|---|---|
| mercado / feira | 3 | é o destino mais frequente e o VEREDA já tem `destinos` |
| farmácia | 2 | ausente no Walk Score original; crítico no Brasil |
| pão / café | 2 | idem |
| restaurante | 2 (não 3) | menor frequência no dia a dia brasileiro |
| escola | 1 | já no ciclo |
| banco / lotérica | 1 | pagamento de conta ainda é presencial |
| parque / praça | 1 | o VEREDA tem ESIG com área |
| transporte | separado | vira "Nota de transporte", não diluir |

E o decaimento em **minutos**, não milhas: 5 min cheio, 20 min ~12%, 30 min zero. O VEREDA já mede em minutos de caminhada — a conversão é direta.

**Regra de honestidade:** a nota só aparece se **todas** as categorias tiverem destino mapeado na área; caso contrário, mostrar a contagem e não a nota. Isso evita o efeito "nota baixa porque o dado falta", que é o defeito silencioso de scores de cobertura parcial.

### 6.2 Densidade de interseção e comprimento de quadra (dado que já existe)
O VEREDA tem a rede viária e as calçadas. **Densidade de interseção** (interseções por km²) e **comprimento médio de quadra** são calculáveis sem nenhum dado novo e são exatamente a penalidade que o Walk Score usa. Servem para:

- penalizar a nota quando a malha é raquítica, mesmo com amenidades perto;
- alimentar a frase de "A rua" ("quadras longas, poucas esquinas — caminhar aqui é desviar");
- explicar **por que** a nota é o que é, o que é o que falta em todo score de caminhabilidade.

### 6.3 O deslocamento de +0,25 milha para parques é um alerta de bug
O VEREDA usa **polígonos de praça do ESIG**. Se a distância for medida do **centroide**, o erro é o mesmo que o Walk Score corrigiu em 2011 deslocando o decaimento. Ação concreta: garantir que `DiaADia` meça distância até **a borda do polígono / a entrada**, nunca ao centroide. Isso é verificação, não feature nova.

### 6.4 Rótulo em linguagem comum
As cinco faixas do Walk Score são um bom precedente para o vocabulário do VEREDA (`Posição é Fato, Adjetivo é Veredito` permite rótulo descritivo, não elogio):

| Nota | Rótulo proposto |
|---|---|
| 90–100 | "dá para viver sem carro" |
| 70–89 | "a maioria das tarefas a pé" |
| 50–69 | "algumas tarefas a pé, outras de carro" |
| 25–49 | "carro necessário na maioria dos dias" |
| 0–24 | "carro necessário" |

Nunca "paradisíaco", "excelente", "ótimo". Descritivo, não adjetivo de valor.

### 6.5 O que **não** copiar
- **Dependência de base de negócios proprietária** (Google/Localeze). O VEREDA usa OSM + CNEFE 2022 por categoria, e publica só a categoria — decisão já tomada e correta.
- **Score único global**: o VEREDA deve mostrar a nota **com âncora de destino** ("para o destino X do seu perfil"), porque caminhabilidade é relativa à rotina.
- **Curadoria aberta**: o VEREDA não tem contas nem correção compartilhada (`A36` adiado).
- **Marca registrada de rótulo**: não usar "Walker's Paradise" adaptado.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Nota a pé com pesos e decaimento | nenhum | médio (fórmula + testes) |
| Densidade de interseção / quadra | nenhum (rede) | pequeno |
| Verificação de distância até borda de praça | nenhum | pequeno |
| Rótulos e tela | nenhum | pequeno |

### 6.7 Observação de método
Como o site oficial estava em 408, **todos** os números de peso e decaimento acima vêm do whitepaper de 2011 da própria empresa, não de uma página atual. Se a fórmula tiver mudado depois de 2011 (o "Street Smart" já era a versão nova à época), a mudança não está documentada publicamente de forma acessível a esta coleta. Tratar como "fórmula de referência de 2011".
