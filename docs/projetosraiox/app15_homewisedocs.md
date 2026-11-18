# app15 — HomeWiseDocs

Coleta: 17/11/2026. Fontes: `homewisedocs.com` (home, `/solutions`, `/solutions/realtors`, `/solutions/lenders`, `/solutions/closing-agents`, `/solutions/owners-and-executives`, `/solutions/processors-and-operations`, `/solutions/technology-officers`, `/solutions/finance-executives`, `/my-orders`), central de ajuda `help.homewisedocshelpcenter.com`.

## 1. Identificação da Solução

- **Nome:** HomeWiseDocs (ativo desde **2008**).
- **URL:** https://www.homewisedocs.com.
- **Mercado:** Estados Unidos, por estado (cada estado tem regra própria de *resale disclosure*).
- **Público-alvo:** quatro lados do mesmo balcão —
  1. **administradora de condomínio** (quem publica o documento);
  2. **corretor** (quem pede para o comprador);
  3. **credor / banco** (quem pede para o financiamento);
  4. **agente de fechamento / title / escrow** (quem precisa do pacote no dia).
- **Proposta central:** ser **o balcão único** onde o documento de condomínio é publicado pela administradora e pedido por quem precisa, com **controle de documento faltante e vencido** e arquivo de tudo.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Lado da administradora (oferta)
- Publicação do **pacote de *resale disclosure*** do condomínio.
- **Controle de processamento, entrega e retenção de registro** para atender à regulação estadual.
- Preço e prazo definidos pela administradora, não pela plataforma.
- Automação do fluxo de revenda: "processar mais revendas sem contratar mais gente" (depoimento na home).
- **Pacote pré-venda** ("pre-sale package") para transição do novo morador.

### 2.2 Lado do comprador/corretor (demanda)
- Pedido do pacote por endereço/unidade.
- **Rastreamento por número de confirmação**, sem login.
- Compartilhamento do pedido com múltiplas partes.
- Arquivo de todos os pedidos.
- Ferramenta de **"documento faltante ou vencido"** — o diferencial operacional: garante que todo pedido esteja **completo e em conformidade no dia do fechamento**.

### 2.3 Serviços adicionais (venda cruzada no mesmo balcão)
| Serviço | Quem pede |
|---|---|
| **Municipal Lien Search** (certidão de ônus municipal) | fechamento/title |
| **Mortgage Payoff** (saldo de quitação) | credor/escrow |
| **Project Review** (revisão de projeto/documento do condomínio) | credor |
| **Lender Questionnaires** (questionário do banco) | credor |

### 2.4 Presença por persona
O site tem uma página de solução para cada papel: dono/executivo, processamento/operações, tecnologia, finanças, corretor, credor, agente de fechamento. O produto é o mesmo; a mensagem muda.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:**
- administradora: documentos, preço, prazo, regras do estado;
- comprador/corretor: endereço, unidade, e-mail;
- credor: número do processo/empréstimo.

**Fontes cruzadas:**
| Dado | Origem | Tipo |
|---|---|---|
| Documentos do condomínio | administradora | privado |
| Regra estadual de disclosure | legislação estadual | público |
| Ônus municipal | prefeitura/condado | público |
| Saldo de quitação | credor | privado |
| Questionário do banco | credor | privado |

**Artefato final:** pacote de documentos entregue digitalmente, com **status de completude e validade**, arquivado e rastreável por número.

## 4. Mecânica de UI/UX e Visualização

- **Sem login para rastrear**: o número de confirmação é a chave. Isso reduz atrito a quase zero e é raro.
- **Status por pedido**, não por documento solto.
- **"Faltante ou vencido"** como alerta de primeira classe — o produto trata **validade** como atributo do documento.
- **Compartilhamento com múltiplas partes** no mesmo pedido, o que elimina o envio manual por e-mail.
- **Arquivo permanente**: o histórico do imóvel fica consultável.
- **Portal de fornecedor** (a administradora) com painel de volume e conformidade.

## 5. Regras de Negócio e Monetização

- **Modelo:** a administradora define o preço do pacote; a plataforma cobra por transação/assinatura da administradora, e vende serviços adicionais por pedido (lien search, payoff, project review).
- **Gatilho:** o fechamento tem data. Quem não entrega o pacote completo no prazo perde o negócio — a plataforma vende **certeza de prazo**.
- **Moat:**
  1. **Rede de administradoras** já integradas (efeito de rede de dois lados).
  2. **Conformidade por estado**, que exige manutenção jurídica contínua.
  3. **Arquivo histórico** que ninguém quer reconstruir.
  4. **Integração com title/escrow**, que é onde o dinheiro fecha.

## 6. Aplicação Direta no VEREDA

O HomeWiseDocs não é um concorrente do VEREDA — é o **gabarito operacional** do que o VEREDA faz de forma analítica. O `LeitorDeAta` lê o documento; o HomeWiseDocs **controla a entrega do documento**. As duas coisas juntas são o produto completo de due diligence.

### 6.1 "Documento faltante ou vencido" no `Pacote do imóvel`
Esta é a mecânica mais copiável de todo o dossiê. O VEREDA já tem o `Pacote para especialista` (print, `.md`, `.html`) e o `LeitorDeAta`. Falta o **controle de conjunto**. Proposta de tela:

```
PACOTE DO IMÓVEL — DSQFL …
[x] Convenção de condomínio            recebido 12/11/2026
[x] Regulamento interno                recebido 12/11/2026
[ ] Atas dos últimos 24 meses          faltando (2 de 4)
[x] Demonstrativo do último exercício  recebido 03/11/2026 — vence em 31/12/2026
[ ] Previsão orçamentária do ano       faltando
[ ] Saldo do fundo de reserva          faltando
[!] Laudo estrutural                   recebido 2019 — 7 anos, desatualizado
[ ] Apólice de seguro do condomínio    faltando
[ ] Certidões negativas                faltando
```

Cada linha com três estados — **recebido, faltando, vencido** — e uma data. O VEREDA já registra data no `LinhaDoTempoEstrutural`; falta o conceito de **validade** e de **conjunto**.

### 6.2 Validade como atributo de primeira classe
O HomeWiseDocs trata "expirado" como erro de fechamento. No Brasil, os prazos usuais (a confirmar com o especialista, não inventar na tela):

| Documento | Validade típica | Observação |
|---|---|---|
| Certidão negativa de ônus | 30–90 dias | varia por cartório |
| Certidão negativa de débito condominial | 30 dias | emitida pelo síndico |
| Laudo técnico estrutural | 12 meses (ou prazo do laudo) | ART/RRT com validade própria |
| AVCB / licença do Corpo de Bombeiros | 12 meses a 3 anos | por tipo de edificação |
| Ata de eleição do síndico | mandato (2 anos) | define quem pode assinar |

Regra: **a tela mostra a data e o prazo declarado no próprio documento**; se o documento não declara prazo, diz "sem prazo declarado" — nunca inventa.

### 6.3 Rastrear por identificador, sem conta
O VEREDA não tem conta e não deve ter (decisão de produto). O HomeWiseDocs mostra que é possível: **número de confirmação** em vez de login. Aplicação: o `Sala de decisão` já usa fragmento de URL (`#s=`) para compartilhar análise. O mesmo padrão serve para o pacote: um link com **hash do conteúdo** permite ao advogado abrir o pacote exato que o cliente montou, sem conta e sem servidor.

### 6.4 Serviços adicionais como catálogo de "o que pedir"
A lista do HomeWiseDocs (lien search, payoff, project review, questionário do banco) é um bom **roteiro do que o comprador precisa além do documento do condomínio**. No Brasil, o análogo:

| EUA | Brasil |
|---|---|
| Municipal Lien Search | certidão de ônus real, IPTU, taxa de lixo |
| Mortgage Payoff | saldo devedor e quitação |
| Project Review | análise de projeto aprovado vs. construído |
| Lender Questionnaires | ficha de avaliação do banco |

Isso alimenta o **roteiro de pedido** proposto no `app3_condoscan.md`, agora com a lista completa.

### 6.5 Dois lados, não um
O HomeWiseDocs só funciona porque a **administradora** publica. O VEREDA não terá administradoras no início — mas o desenho deve prever o dia em que tiver: um síndico ou administradora que publique o pacote padrão do edifício e todos os compradores daquele edifício o recebam. É a semente de um efeito de rede **por edifício**, não por usuário: **7.206 edifícios** é uma base plausível para isso.

### 6.6 O que **não** copiar
- **Cobrança por transação sobre documento público**: no Brasil, grande parte desse documento é gratuita por lei; cobrar seria frágil.
- **Integração com title/escrow**: não existe equivalente no mercado brasileiro no mesmo formato.
- **Portal de administradora**: exige venda B2B2C que o VEREDA não tem estrutura para fazer agora.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Tela "Pacote do imóvel" com 3 estados | nenhum (entrada do usuário) | médio |
| Validade por tipo de documento | tabela de prazos (revisão jurídica) | pequeno-médio |
| Link por hash do pacote | nenhum | pequeno (reusa padrão do `Sala`) |
| Catálogo "o que pedir" | nenhum | pequeno |
