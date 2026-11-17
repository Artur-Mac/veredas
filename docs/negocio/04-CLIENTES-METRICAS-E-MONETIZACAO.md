# 04 — Clientes, Evidências de Mercado, Métricas e Monetização

**Regra de honestidade analítica:** todas as receitas, preços e metas de conversão abaixo são **hipóteses de negócio a testar em campo**. Até `14/11/2026`, não existem pagamentos reais observados, CAC medido nem teste com usuários do novo fluxo comparativo pós-pivô.

---

## 1. O que já foi medido em campo (e suas limitações honestas)

Entre **02 e 14 de outubro de 2026**, antes do pivô de novembro, foram conduzidos dois levantamentos exploratórios no Recife:

### A. Questionário quantitativo exploratório (`N = 83`, Google Forms)
- **Recorte:** pessoas que alugaram (`45,8%`), compraram (`18,1%`) ou buscavam ativamente aluguel (`19,3%`) ou compra (`16,8%`) no Recife nos últimos 24 meses; concentração em Boa Viagem/Pina/Setúbal (`34,9%`), Casa Forte/Parnamirim (`16,9%`), Graças/Aflitos (`15,7%`), Espinheiro (`13,3%`), Madalena (`10,8%`).
- **Principais achados reportados:**
  - **85,5% (71/83)** encontraram taxas, condomínio ou IPTU não informados ou maiores do que o anunciado (`62,7%` com diferença acima de `+R$ 300/mês`).
  - **92,8% (77/83)** relataram omissão frequente/constante do prédio e número pelos anúncios (média `4,51 / 5,0`).
  - **71,1% (59/83)** sofreram ao menos um arrependimento grave de entorno nas primeiras 6 semanas (obras vizinhas `67,5%`, calor/insolação poente `57,8%`, alagamento maré+chuva `53,0%`).
  - **89,2% (74/83)** avaliaram o conceito inicial (dossiê a partir do link) como muito útil/indispensável; **89,1%** toparam checar dados rápidos na visita por créditos ("Give-to-Get").
  - **Disposição a pagar declarada:** média ~**R$ 28** (`51,8%` entre R$ 15 e R$ 29,90; `28,9%` entre R$ 30 e R$ 49,90; `13,3%` acima de R$ 50).

### B. Entrevistas qualitativas em profundidade (`5 casos`, 45 min cada)
Casos documentados no Recife que ilustram o impacto financeiro e emocional da decisão no escuro:
- Cota extra de fachada omitida no anúncio subindo desembolso em **+R$ 720/mês** (Boa Viagem);
- Demolição com alvará prévio ao lado do quarto descoberta semanas após assinatura, com multa de 3 aluguéis para rescisão (Graças);
- Compra de R$ 1,15 milhão com avaliação fiscal histórica bem abaixo no ITBI (Casa Forte);
- Alagamento de garagem com maré alta + descoberta tardia de alvenaria resistente "prédio-caixão" anos 90 (Madalena);
- Insolação poente vendida como "nascente", elevando conta de energia de **R$ 230 para R$ 785/mês** (Espinheiro).

### Ressalvas críticas sobre esses dados (obrigatórias ao usar em pitch ou estratégia)
1. A amostra (`N=83`) foi captada em círculos de **tecnologia/universidade (CIn-UFPE, CESAR School, Porto Digital)** e grupos de bairro — **não representa o conjunto estatístico da população do Recife**.
2. O conceito avaliado na pesquisa foi o **formato antigo pré-pivô** (link → dossiê único). O novo fluxo comparativo + rotina (`VE01–VE15`) ainda não passou pelo teste moderado **`G-USER`** (próxima etapa prevista com `8–12` pessoas em busca ativa).
3. A disposição a pagar de `~R$ 28` foi **declarada e induzida por faixas fechadas** em formulário — intenção declarada não comprova pagamento real.

---

## 2. Segmentos Priorizados (Em sequência lógica)

| Prioridade | Segmento | Dor concreta e contexto de uso | Principal risco do segmento |
|---|---|---|---|
| **1º (Foco imediato)** | **Locatário comparando 2–5 apartamentos** (mudança em até 60 dias nos 5 bairros) | Orçamento mensal apertado por condomínio/IPTU oculto e escolha às pressas em cidade de aluguel caro (R$ 64,39/m²). | Busca curta/episódica (não retém assinatura contínua) e baixa tolerância a fricção de cadastro. |
| **2º** | **Comprador de apartamento usado** | Risco patrimonial alto; precisa confrontar pedido vs. referência fiscal ITBI, obras ao redor, certidão/matrícula e passivo condominial antes do sinal. | Esperar "laudo jurídico/estrutural" garantido, o que o app não substitui. |
| **3º** | **Mudança de cidade / Trabalho remoto ou híbrido** | Decide à distância ou prioriza silêncio (`LUSE`/via), sol por fachada, caminhada sem carro e viabilidade de internet/energia estável (`DEC/FEC`). | Cobertura ainda restrita aos 5 bairros-piloto limita parte das buscas. |
| **4º (B2B2C após validar B2C)** | **Assessoria de comprador, RH/Relocation, garantidoras e vistoriadoras** | Clientes recorrentes que precisam comparar opções com método consistente e reduzir surpresas pós-contrato. | Ciclo comercial mais longo e risco de pressão sobre independência dos achados. |

---

## 3. Métrica Norte (`North Star`) e Critérios de Decisão

- **North Star (`CDAC` — Ciclos de Decisão Assistida Concluídos):** proporção de usuários/buscas que chegam a uma conclusão acionável comparando imóveis (confirmar visita em primeiro lugar, descartar com motivo factual ou levar pergunta objetiva para negociação) e **conseguem dizer qual fato mudou a escolha**.
- **Métricas complementares válidas:** retorno ao dossiê após mudança de anúncio (`Desde que você guardou`), redução do tempo até selecionar a 1ª visita, pergunta decisiva respondida com alteração de ordem (`VE15`) e conversão paga real (quando ofertada).
- **O que não usar como métrica de vaidade:** cliques isolados em abas, buscas abandonadas por quem já alugou (encerramento da jornada ≠ churn ruim), ou coleta de endereços/notas pessoais na nuvem sem consentimento.

---

## 4. Hipóteses de Monetização e Economia Unitária

### Por que "Passe de Busca" vence assinatura B2C contínua
Quem procura moradia não passa 12 meses pagando mensalidade. O modelo mais alinhado ao ciclo de vida real é o **Passe por Episódio de Busca** (inspirado em Openigloo e análogos como Extrato Veicular R$ 29,90):

| Modelo | Unidade de valor | Faixa de teste / referência | Papel na estratégia |
|---|---|---|---|
| **Base gratuita (Aquisição & Caderno)** | Salvar anúncios, comparar custos declarados, gerar primeiras perguntas e rotina básica | **R$ 0** | Elimina barreira de entrada e prova utilidade antes de pedir cartão. |
| **Passe de Busca B2C (Principal B2C)** | Comparações completas ilimitadas/estendidas durante a janela de mudança (ex.: 30–60 dias / até 5 imóveis completos + alertas de mudança) | **R$ 29,90 – R$ 79,90** *(âncora preliminar: R$ 49,90/busca; avulso R$ 19,90–29,90)* | Casa exatamente com o episódio de compra/aluguel; notas adquiridas continuam visíveis após vencer o passe. |
| **Serviço Assistido / Piloto Concierge** | Revisão manual guiada para quem já vai visitar/fechar compra ou mudança à distância (ata, matrícula guiada, checagem cruzada) | Sob medida após medir minutos/caso | **Atalho inteligente de validação cedo:** testa disposição real a pagar antes de automatizar 100% de documentos e APIs. |
| **Benefício Corporativo / Relocation (B2B2C)** | Lotes de passes comprados por empresas/RH/universidades para colaboradores ou estudantes recém-chegados | Pacotes por lote + suporte | Ticket maior, zero CAC individual, excelente sinergia com CIn/Porto Digital e empresas atraindo talentos. |
| **Licença Profissional (B2B alinhado)** | Painel para personal shoppers, assessorias do comprador e vistoriadoras | **R$ 20 – R$ 199/mês por assento** *(para caber ao lado de CRMs de R$ 130)* | Recorrência real; só abrir após validar produto B2C e parecer jurídico CRECI. |
| **B2G / Parcerias Institucionais** | Contratação Pública de Inovação (`CPSI`, LC 182/2021 até R$ 1,6 mi) ou inteligência agregada com imobiliárias/ISPs | Sob edital / contrato | Oportunidade futura para financiar infraestrutura contínua de atualização urbana. |

### Fórmula de economia unitária (controle contra armadilha operacional)
Da especificação financeira interna:
$$\text{Contribuição antes de CAC e fixos} = P \times (1 - t) - q \times c - s$$
- $P$: preço do passe; $t$: taxas + tributos + reserva de estorno; $q \times c$: custo variável de processamento/enriquecimento; $s$: custo humano de suporte e curadoria por pedido.
- **Armadilha crítica identificada em `VE16`:** dado público gratuito **não** significa manutenção gratuita. Enquanto o pipeline rodar em batch e partições estáticas leves (bundle pós-split D036), $c$ tende a centavos, mas se $s$ (revisão manual de ruas, erros cadastrais ou suporte) crescer sem automação/priorização (`VE13`), consome toda a margem antes mesmo do CAC.

---

## 5. Próximos Passos Comerciais Obrigatórios (Antes de Escalar)

1. **Rodar `G-USER` (qualitativo pós-pivô):** observar 8–12 pessoas em busca ativa usando Comparar + Rotina + pergunta decisiva sem explicar as features antes — medir se 6 de 8 escolhem a 1ª visita citando uma evidência real.
2. **Validar esforço de atualização (`VE16`):** fechar o custo real em horas/R$ para manter 5 bairros e expandir para Torre antes de assumir CAC/margem em pitch para investidores.
3. **Testar cobrança real ou concierge pago pequeno** (sem prometer recursos não entregues) antes de assumir a WTP declarada de outubro como taxa de conversão real.
