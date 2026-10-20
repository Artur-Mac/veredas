# PRD — VEREDA: decidir com custos e evidências

**ID:** PRD-2026-10-20 · **Versão:** 1.0 · **Status:** proposta  
**Responsáveis sugeridos:** produto define prioridades; design valida compreensão; engenharia valida viabilidade; dados responde por proveniência. Atribuições ainda não acordadas.

## 1. Problema e público

Quem já encontrou anúncios precisa comparar opções, esclarecer cobranças, confirmar o prédio e descobrir o que perguntar antes da visita. Informações chegam em formatos diferentes, com custos sem periodicidade e fontes de qualidade desigual.

**Público inicial proposto:** pessoas em busca ativa de aluguel nos cinco bairros da v1, com duas ou mais opções concretas. Compra permanece utilizável no núcleo existente, mas requer investigação própria antes de acrescentar simulação financeira ou avaliação de mercado.

**Trabalho principal:** “Quando tenho algumas opções de moradia, quero organizar custos e dúvidas para decidir quais visitar e o que confirmar antes de assumir um compromisso”.

A pesquisa interna com 83 respondentes é insumo exploratório. Nesta entrega não foram auditadas respostas brutas, recrutamento ou consentimentos. Seus percentuais não são tratados como estimativa da população nem evidência de conversão comercial.

## 2. Objetivo e resultado esperado

Reduzir dúvidas materiais antes da decisão. Uma dúvida é material quando muda orçamento, necessidade de visita, documentação ou escolha declarada pela pessoa.

**Métrica principal proposta:** proporção de buscas ativadas com pelo menos uma dúvida material resolvida em sete dias.  
**Busca ativada:** pessoa salva duas opções e registra ao menos uma pergunta prioritária.  
**Dúvida resolvida:** resposta registrada com origem e data; distinguir relato do usuário de documento ou cadastro.

As metas iniciais são critérios de experimento, não resultados alcançados: 60% de ativação entre participantes elegíveis; 40% das buscas ativadas com dúvida resolvida; mediana de até cinco minutos para obter o primeiro resumo útil.

## 3. Escopo incremental

| ID | Requisito proposto | Critério de aceite | Dependência |
|---|---|---|---|
| RF-01 | Orçamento de entrada e permanência | Mostra mensal, desembolso inicial e horizonte escolhido separadamente; campo ausente não vira zero | Núcleo de custos da v1 |
| RF-02 | Revisão de periodicidade | IPTU anual, mensal e desconhecido têm caminhos distintos; cálculo expõe a conversão | Extração e edição existentes |
| RF-03 | Fila de dúvidas | Cada lacuna gera pergunta editável, com estado aberta/respondida e fonte da resposta | Modelo de evidências |
| RF-04 | Comparação pessoal | Mesma modalidade e horizonte; indica parcelas ausentes; não declara vencedor | Duas análises |
| RF-05 | Exportação e recuperação | Exporta versão do formato; importa em outro armazenamento; preserva notas e custos; informa duplicatas | Persistência local |
| RF-06 | Checklist por rotina | Usuário escolhe trabalho em casa, mobilidade, água ou acessibilidade e recebe perguntas correspondentes | Pesquisa de linguagem |
| RF-07 | Histórico de alterações | Distingue atualização de anúncio, correção do usuário e mudança da fonte | Identificadores e versões |
| RF-08 | Rotina de deslocamento | Até três destinos; modo e horário explícitos; falha da API não produz tempo estimado fictício | Benchmark de rotas e licença |
| RF-09 | Leitura assistida de documentos | Cada achado aponta página e trecho; documento ilegível retorna pendência | Upload, OCR, processamento protegido |
| RF-10 | Comparação com anúncios parceiros | Informa origem, data, amostra e filtros; separa venda, aluguel e avaliação fiscal | Contrato e amostra suficiente |

RF-01 a RF-06 são candidatos à primeira evolução após estabilização da v1. RF-07 a RF-10 dependem dos resultados do piloto. Reutilizar requisitos já implementados; não reconstruí-los apenas porque aparecem neste PRD.

## 4. Fluxo principal

1. Adicionar anúncio, texto ou dados manuais.
2. Revisar preço, condomínio, IPTU e periodicidade.
3. Salvar resumo de custos, inclusive com prédio ainda desconhecido.
4. Confirmar o prédio quando houver endereço suficiente.
5. Consultar achados com fonte e escolher três perguntas prioritárias.
6. Registrar respostas durante ou depois da visita.
7. Comparar opções, registrar decisão e exportar o caderno.

**Estados obrigatórios:** sem dados; dados parciais; fonte indisponível; dado antigo; fontes divergentes; revisão necessária; carregamento; análise pronta. “Pronta” significa processamento concluído, não completude ou aprovação do imóvel.

## 5. Regras de domínio

**Custos:** subtotal mensal soma apenas parcelas conhecidas e recorrentes. Valor inicial reúne mudança, instalações e outros desembolsos informados. Garantia reembolsável fica separada de despesa: é caixa imobilizado. Compra não entra como parcela mensal.

**Horizonte:** custo estimado em 12 meses = 12 × recorrência mensal + despesas pontuais conhecidas. Reajustes e variações só entram quando a pessoa escolhe uma premissa. Mostrar separadamente o caixa necessário, incluindo garantias; evitar dupla contagem.

**Evidências:** informação deve registrar origem, data de referência, data de coleta, unidade, abrangência e transformação. Cadastro, anúncio, documento e relato podem discordar sem que o sistema apague um deles.

**Prédio:** endereço confirmado não comprova unidade, metragem útil ou obrigação tributária individual. Um candidato cadastral não deve ser promovido silenciosamente a vínculo confirmado.

**Obras:** processo encontrado não prova execução. A própria publicação municipal limita a cobertura a processos digitais. [Fonte](https://dados.recife.pe.gov.br/dataset/licenciamento-urbanistico).

**Preço:** manter em trilhas distintas valores pedidos em anúncios, valores declarados em operações quando disponíveis e avaliações fiscais. O índice FipeZAP é de preços anunciados; não é tabela do preço de fechamento de cada apartamento. [Metodologia](https://downloads.fipe.org.br/indices/fipezap/metodologia/FipeZAP_Metodologia_v20110216.pdf).

## 6. Requisitos de qualidade

- O resumo local continua acessível sem rede; enriquecimentos externos têm recuperação e mensagem de falha.
- Eventos analíticos não carregam endereço, documento, contato ou texto livre.
- Exportação deixa claro quais arquivos contém e deve permitir reimportação antes de ser anunciada como backup.
- Leitura de documentos não aceita instruções embutidas como comandos do sistema.
- A interface preserva a referência de `index.html`; qualidade é medida por compreensão e tarefa concluída, não por número de telas.
- Proposta de desempenho: resumo salvo abre em até dois segundos no aparelho de referência; chamadas externas têm cancelamento e não bloqueiam o caderno.
- Toda função paga tem limite por usuário, telemetria de custo e comportamento definido quando a quota acaba.

## 7. Fora deste ciclo

Diagnóstico estrutural; nota de segurança do bairro; previsão de inundação por apartamento; economia elétrica inferida apenas pela fachada; preço exato de mercado sem comparáveis; aprovação de crédito; parecer jurídico automático; promessa de perícia.

## 8. Plano de aceite

Usar casos de IPTU anual, custo ausente, garantia reembolsável, endereço ambíguo, anúncio indisponível, alteração de fonte e documento ilegível. Validar cálculos por tabela independente e compreensão em cinco sessões de uso por rodada. Os critérios quantitativos e o protocolo de pesquisa estão no [documento 06](06-VALIDACAO-E-GOVERNANCA.md).

**Decisões abertas:** momento de cobrança; necessidade de conta; duração do pacote; processo de contestação; limite de documentos. Nenhuma dessas decisões é pré-requisito para terminar a POC gratuita.
