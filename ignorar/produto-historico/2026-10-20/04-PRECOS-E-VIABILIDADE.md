# Modelo de preços, custos e estimação imobiliária

**ID:** ECON-2026-10-20 · **Versão:** 1.0 · **Status:** modelo de planejamento  
Todos os valores comerciais do VEREDA e custos internos abaixo são **premissas propostas**, não cotações, resultados de vendas ou preços validados.

## 1. Modelo de cobrança proposto

A procura por moradia ocorre em episódios. Testar pacote de busca antes de assinatura B2C recorrente; medir se há uso repetido que justifique renovação.

| Oferta experimental | Preço proposto | Entrega delimitada | Hipótese |
|---|---:|---|---|
| Caderno básico | R$ 0 | Cadastro, custos informados e perguntas básicas | Demonstrar valor antes da cobrança |
| Análise avulsa | R$ 19,90 | Um enriquecimento cadastral disponível, com cobertura mostrada antes da compra | Usuário com decisão próxima prefere pagar uma vez |
| Busca | R$ 49,90 | Até cinco análises em 30 dias; comparação e exportação | Pacote acompanha shortlist |
| Assistência documental | R$ 29,90 adicionais | Até 20 páginas, achados com trecho e página | A pessoa paga para reduzir trabalho de leitura |
| Piloto profissional | R$ 299/mês | Até 30 análises; uma equipe pequena; sem integração customizada | Uso profissional tem recorrência |
| Mobilidade institucional | Sob desenho de piloto | Pacotes para funcionários ou estudantes em mudança | Instituição pode reduzir custo de aquisição |

São ofertas de teste pós-POC. A v1 continua gratuita; créditos demonstrativos não se tornam cobrança automaticamente. Não vender resultado que dependa de fonte indisponível. A política de falha deve devolver crédito quando o enriquecimento contratado não for entregue.

Preço adicional de documentos não cobre revisão por advogado, engenheiro ou avaliador. Se houver revisão humana, formar oferta e custo separados.

## 2. Custo por pacote e ponto de equilíbrio

Modelo-base do pacote Busca:

| Premissa | Valor |
|---|---:|
| Preço bruto | R$ 49,90 |
| Dossiês consumidos | 5 |
| Custo variável por dossiê | R$ 2,00 |
| Atendimento variável por pacote | R$ 3,00 |
| Reserva tributária de planejamento | 10% da receita bruta |
| Pagamento e perdas operacionais | 5% da receita bruta |
| Reserva para reembolsos | 3% da receita bruta |
| Aquisição por comprador (CAC) | R$ 15,00 |
| Custo fixo mensal ilustrativo | R$ 6.000 |

As porcentagens são provisões de orçamento; não representam alíquota legal aplicável ou tarifa de adquirente. O regime real, a composição de tributos e o contrato de pagamento precisam ser cotados. A reserva de reembolsos é conservadora e não modela recuperação de taxas.

**Contribuição antes de aquisição:** `P × (1 − 0,10 − 0,05 − 0,03) − 5 × custo_dossiê − 3`.  
No cenário-base: R$ 27,92 por pacote, aproximadamente 56% da receita bruta.

**Contribuição depois de aquisição:** R$ 12,92.  
**Equilíbrio:** `arredondar_para_cima(custo_fixo / contribuição_depois_CAC)` = **465 pacotes/mês**.

Isso supõe que todos os pacotes tenham o mesmo CAC e consumo. Não inclui aumento de equipe para suportar volume, capital de giro, investimento inicial ou aquisição de usuários gratuitos.

| Cenário | Preço | Custo por dossiê | Contribuição antes CAC | Após CAC de R$ 15 | Pacotes para R$ 6 mil fixos |
|---|---:|---:|---:|---:|---:|
| Preço baixo | R$ 29,90 | R$ 2 | R$ 11,52 | −R$ 3,48 | Sem equilíbrio nesse modelo |
| Base | R$ 49,90 | R$ 2 | R$ 27,92 | R$ 12,92 | 465 |
| Custo elevado | R$ 49,90 | R$ 4 | R$ 17,92 | R$ 2,92 | 2.057 |
| Preço alto | R$ 69,90 | R$ 2 | R$ 44,32 | R$ 29,32 | 205 |

Usar valores não arredondados para calcular o equilíbrio. A tabela evidencia por que preço baixo e assistência manual ilimitada podem inviabilizar o produto.

**Teto proposto de CAC inicial:** metade da contribuição antes de aquisição, cerca de R$ 13,96 no cenário-base. O CAC de R$ 15 da tabela excede esse teto conservador: ele é cenário de sensibilidade, não meta recomendada.

## 3. Orçamento operacional

| Item mensal | Piloto enxuto: faixa de planejamento |
|---|---:|
| Hospedagem, banco e armazenamento | R$ 100–500 |
| Mapas e rotas | R$ 0–400 |
| OCR e interpretação com limite | R$ 50–500 |
| Monitoramento, suporte e comunicação | R$ 50–300 |
| Total técnico aproximado | R$ 200–1.700 |

Faixas internas de reserva, sem cotação de infraestrutura. Excluem pessoal, aquisição, jurídico, impostos e licenças de dados imobiliários. O cenário de R$ 6 mil fixos é independente: deve ser substituído por orçamento real, sem somar despesas duas vezes.

**Sensibilidade cambial proposta:** usar R$ 5, R$ 6 e R$ 7 por dólar; são cenários, não câmbio corrente. Uma fatura de US$ 250 vira R$ 1.250, R$ 1.500 ou R$ 1.750 antes de encargos.

O [documento de APIs](03-APIS-E-FORNECEDORES.md) apresenta um cenário em que 10 mil dossiês geram US$ 250 apenas em rotas Google Essentials. Escala, funcionalidades avançadas e condições de armazenamento mudam o custo.

Para 1.000 documentos de 20 páginas, 20 mil páginas × US$ 1,50/mil = **US$ 30 de OCR básico**, antes de eventuais franquias e de outros serviços. A R$ 6/USD, isso representa R$ 180; não inclui interpretação nem revisão. [Tarifa de referência](https://cloud.google.com/document-ai).

## 4. Investimento de desenvolvimento

Estimativas de esforço, sujeitas a inspeção técnica e reaproveitamento da v1:

| Frente incremental | Pessoa-semanas |
|---|---:|
| Qualidade de dados, proveniência e atualização | 2–4 |
| Custos de entrada, perguntas e recuperação do caderno | 2–3 |
| Rotas, preferência de rotina e medição de consumo | 1–3 |
| Leitura documental com evidências | 3–5 |
| Conta, cobrança e operação comercial | 3–5 |
| Total se todas forem executadas | 11–20 |

A R$ 3 mil–6 mil por pessoa-semana como premissa interna, o intervalo é R$ 33 mil–120 mil, antes de contingência. Acrescentar 20% produz R$ 39,6 mil–144 mil. Não é prazo calendário nem proposta de prestador; despesas de equipe existente e trabalho voluntário precisam ser contabilizadas separadamente.

Não executar todas as frentes antes de validar. Começar pelas duas primeiras, e liberar as seguintes por evidência.

## 5. Estimação de preço do imóvel

### Etapa A — comparação pessoal

Usar valores salvos pela própria pessoa. Mostrar mediana e amplitude quando fizer sentido, com modalidade, quantidade de opções e parcelas incluídas. Isso descreve a shortlist, não o mercado.

### Etapa B — comparáveis licenciados

Separar aluguel-base, pacote mensal e venda. Deduplicar imóveis e anúncios repetidos; registrar data; controlar bairro, área, quartos, vagas e tipo. Preço anunciado e fechamento permanecem séries distintas.

**Regra proposta de publicação:** só exibir faixa por comparáveis com pelo menos 20 imóveis únicos elegíveis em uma janela inicialmente definida em 90 dias. É um limite operacional a testar, não garantia estatística. Se não houver amostra, ampliar região explicitamente ou não estimar.

Para um grupo comparável, calcular `preço/m² = preço do mesmo tipo / área da mesma definição`; apresentar quartis e tamanho da amostra. Multiplicar quartis pela área do imóvel produz uma referência simplificada, não avaliação profissional.

ITBI fiscal permanece painel separado. A metodologia FipeZAP descreve preços de anúncios; não permite supor preço final de negociação. [Fonte](https://downloads.fipe.org.br/indices/fipezap/metodologia/FipeZAP_Metodologia_v20110216.pdf).

### Etapa C — modelo preditivo

Somente depois de obter base licenciada e consistente. Comparar um modelo simples com a mediana segmentada antes de investir em complexidade. Separar treino e teste no tempo e por prédio para evitar vazamento por anúncios duplicados.

Avaliar erro absoluto em reais, erro percentual mediano, cobertura dos intervalos e desempenho por bairro/faixa de preço. **Meta candidata:** superar o baseline em pelo menos 15% no erro absoluto sem deterioração relevante em segmentos; definir tolerância com a equipe antes do teste.

Abster-se em imóveis fora do domínio, dados insuficientes ou intervalos muito amplos. A promessa comercial deve ser “referência comparável com limites”, nunca “preço correto garantido”.

## 6. Teste de disposição a pagar

Testar R$ 29,90, R$ 49,90 e R$ 69,90 para o mesmo pacote, com alocação consistente por pessoa. Uma primeira rodada de 15 entrevistas explora objeções; uma segunda mede comportamento em oferta real somente quando a entrega estiver disponível.

Não tratar clique como compra. Medir exposição, compra, uso, devolução e contribuição por visitante. Não escolher vencedor com poucos pagamentos; dimensionar a amostra após medir a conversão-base.
