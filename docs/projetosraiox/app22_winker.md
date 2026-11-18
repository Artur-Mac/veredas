# app22 — Winker

Coleta: 17/11/2026. Fontes: `winker.com.br` (home, menu de soluções, segmentos, rodapé institucional).

## 1. Identificação da Solução

- **Nome:** Winker (CNPJ 18.924.102/0001-69), Florianópolis.
- **URL:** https://www.winker.com.br.
- **Público-alvo:** **administradora de condomínio**, condomínio (síndico), empresa de segurança, **construtora** e prestador de serviço.
- **Proposta central:** "ecossistema de soluções para o mercado de condomínios" — ERP de gestão, financeiro, **super aplicativo do morador**, controle de acesso, CRM e atendimento em uma só plataforma.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Cinco produtos
| Produto | O que é |
|---|---|
| **Winker Pro** | sistema de gestão / **ERP** para administradora e condomínio |
| **Aplicativo Winker** | **super app** do morador e do síndico |
| **Winker Chat** | atendimento **omnichannel** |
| **Winker Flow** | **CRM**, performance e automação comercial |
| **Winker Access** | controle de acesso (portaria, biometria, visitante) |

### 2.2 O que o ERP cobre
- Gestão financeira do condomínio (taxa, inadimplência, prestação de contas).
- Rotinas administrativas e de pessoal.
- **Prestação de contas ao morador**, que é a dor política do síndico.
- Integração com o app: o morador vê boleto, ata, reserva de área comum e comunicado.

### 2.3 O super app
- Boleto e segunda via.
- Comunicados e **atas**.
- Reserva de espaço.
- Ocorrências e solicitações.
- **Avaliação 4,8 nas lojas**, declarada no rodapé.

### 2.4 Modelo de implantação
- Migração assistida ("a maior parte do trabalho é nossa").
- Time de **sucesso do cliente**.
- **Treinamento** de colaboradores e de síndicos.
- Hospedagem em nuvem com **conformidade LGPD** declarada.
- Suporte dedicado a síndicos e moradores.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** dados do condomínio, unidades, moradores, financeiro, documentos (ata, convenção, regulamento), ocorrências.

**Fontes cruzadas:** dados do próprio condomínio (privados), integração bancária para boleto, controle de acesso físico, canais de atendimento.

**Artefato final:** boleto, prestação de contas, ata publicada, comunicado, registro de acesso, relatório de inadimplência.

## 4. Mecânica de UI/UX e Visualização

- **App como ponto de contato do morador**, com o ERP atrás.
- **Boleto em primeiro plano** — é o que faz o morador abrir o app.
- **Documento publicado** (ata, comunicado) no mesmo lugar do boleto, o que cria hábito.
- **Painel do síndico** com inadimplência e ocorrências.
- **Onboarding assistido**, que é o que permite vender para administradora conservadora.

## 5. Regras de Negócio e Monetização

- **Modelo:** SaaS B2B para a **administradora** (que revende/opera para os condomínios), com receita por condomínio gerenciado e módulos (acesso, chat, CRM).
- **Gatilho:** a administradora compra eficiência e retenção de carteira; o condomínio compra o app do morador.
- **Moat:**
  1. **Rede de administradoras** — efeito de rede no lado que opera muitos condomínios.
  2. **Dado histórico do condomínio** (financeiro, atas) que ninguém quer migrar de novo.
  3. **Super app** que prende o morador ao hábito mensal.
  4. **Módulo físico** (controle de acesso), que aumenta o custo de troca.

## 6. Aplicação Direta no VEREDA

O Winker não é concorrente do VEREDA: é o **dono do documento dentro do condomínio**. Este dossiê existe por uma razão só — mapear quem, na prática, tem o documento que o `LeitorDeAta` quer ler.

### 6.1 Onde o documento realmente está
O `app15_homewisedocs.md` propôs um modelo de dois lados (administradora publica, comprador pede). O Winker mostra que, no Brasil, **esse lado já está ocupado por ERP de condomínio**. Consequência prática para o VEREDA:

| Documento | Quem tem hoje | Como o VEREDA obtém |
|---|---|---|
| Convenção e regulamento | administradora / cartório de registro | **usuário cola ou digita**; nunca automático |
| Atas | administradora / síndico (no ERP) | usuário |
| Prestação de contas | administradora (no ERP) | usuário |
| Boleto e taxa | administradora (no ERP) | usuário (valor) |
| Laudo estrutural | condomínio / empresa contratada | usuário |
| Certidão de ônus | cartório | **Docket** (ver `app20`) |

Ou seja: o caminho do VEREDA é **o usuário**, não a integração. Isso reforça a decisão de manter tudo no dispositivo e de não prometer "buscamos para você".

### 6.2 O síndico é o informante, não o cliente
O Winker vende ao síndico e à administradora. O VEREDA precisa do **síndico como fonte** (ele responde "houve obra no hall?", "qual a taxa?"). Isso muda o desenho do "roteiro de pedido" (`A21` na síntese): o texto deve ser escrito **para o síndico**, curto, com pergunta fechada e prazo — não uma lista de 12 documentos.

Exemplo de mensagem pronta:

> Bom dia. Estou em processo de compra da unidade 402 e preciso de três informações: (1) valor atual da taxa condominial; (2) saldo do fundo de reserva; (3) existe obra ou rateio aprovado para os próximos 12 meses? Obrigado.

Três perguntas que o síndico responde em dois minutos valem mais que um pedido de pacote que ele vai ignorar.

### 6.3 A taxa condominial pode ser comparável por bairro
O ERP do condomínio sabe a taxa real de cada unidade. O VEREDA só tem a taxa **do anúncio**. Isso limita o benchmark ao caderno do usuário (mediana ± MAD, mínimo 5). O Winker confirma que a base real existe, mas **é privada de terceiro**. Conclusão: manter a regra atual e não tentar comprar essa base — o custo e o risco de LGPD não se pagam.

### 6.4 O app do morador é o padrão de "documento no lugar do boleto"
Detalhe de UX que vale copiar: o Winker coloca **ata e comunicado ao lado do boleto**, porque é onde o morador já vai todo mês. O VEREDA pode fazer o equivalente: colocar o **documento pendente ao lado do custo mensal** na tela de custo, porque é onde o usuário já olha. Um documento que falta, mostrado no lugar onde a pessoa já está, é visto; num menu separado, não.

### 6.5 O que **não** copiar
- **ERP de condomínio**: outro produto, outro comprador, outra operação.
- **Integração com administradora**: ciclo de venda longo e dependência de terceiro.
- **Controle de acesso físico**: fora de escopo.
- **Promessa de "tudo em um lugar"**: o VEREDA é deliberadamente estreito.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Roteiro de pedido ao síndico (3 perguntas) | nenhum | pequeno |
| Documento pendente ao lado do custo mensal | nenhum | pequeno |
| Qualquer integração com ERP | contrato | **não recomendado** |
