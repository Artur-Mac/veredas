# Plano de validação, métricas e governança

**ID:** VAL-2026-10-20 · **Versão:** 1.0 · **Status:** protocolo proposto.

## 1. Hipóteses e experimentos

| ID | Hipótese | Experimento | Sinal de avanço proposto |
|---|---|---|---|
| H1 | Comparação de custos é útil antes de enriquecer endereço | 15 entrevistas com shortlist real e cinco testes de tarefa | Usuário descreve utilidade concreta e conclui comparação sem ajuda recorrente |
| H2 | Perguntas resolvem lacunas | Acompanhar 20 buscas por sete dias | ≥40% das buscas ativadas resolvem uma dúvida material |
| H3 | Caderno acompanha a busca | Observar retorno em sete dias entre quem continua procurando | ≥40% voltam voluntariamente; separar quem encerrou a busca |
| H4 | Pacote é compreensível | Teste de compreensão com dez pessoas | Pelo menos oito explicam cobertura, limite e preço corretamente |
| H5 | Há disposição a pagar | Oferta real após serviço estar disponível | Contribuição por visitante e devolução aceitáveis; amostra posterior dimensionada |
| H6 | Rotas melhoram decisão | Comparar versão com e sem percurso em tarefas equivalentes | Benefício relatado acompanhado de uso e precisão observada |
| H7 | Documento economiza trabalho | 30 documentos autorizados, com gabarito revisado | Nenhum valor crítico sem citação; ≥95% dos campos críticos corretos na amostra |
| H8 | Canal institucional reduz CAC | Piloto limitado com uma organização | Custo por beneficiário ativado e compra do lote documentados |

Nenhum experimento foi executado nesta pesquisa. Os limites são escolhas iniciais de operação, não benchmarks do setor.

## 2. Recrutamento e roteiro

Recrutar pessoas com busca ativa nos últimos 30 dias, de diferentes bairros e orçamentos. Evitar depender apenas de amigos e comunidade de tecnologia. Entrevistar compradores separadamente de locatários.

Perguntas centrais:

1. Mostre como compara hoje suas opções.
2. Qual informação faltou na última conversa com corretor ou proprietário?
3. Qual surpresa mudou seu orçamento ou sua escolha?
4. Que informação você conseguiu confirmar, com quem e em quanto tempo?
5. Faça uma comparação usando os dados disponíveis, sem orientação do moderador.
6. O que você faria depois de ver este resumo?
7. O que precisaria estar incluído para você pagar por essa entrega?

Não introduzir primeiro uma lista de riscos para depois perguntar se ela preocupa. Não prometer diagnóstico ou economia que o produto ainda não entrega.

## 3. Definições das métricas

| Métrica | Numerador / denominador | Cuidados |
|---|---|---|
| Ativação | Buscas com duas opções e uma pergunta / buscas elegíveis iniciadas | Não usar visitas à página como denominador |
| Dúvida resolvida em 7 dias | Buscas ativadas com resposta material / buscas ativadas com janela completa | Registrar origem da resposta |
| Retorno durante busca | Pessoas que voltaram / pessoas ainda em busca com janela completa | Encerrar busca não é necessariamente churn |
| Conversão paga | Compradores únicos / pessoas elegíveis expostas à oferta | Separar convite, clique e pagamento |
| Reembolso | Pacotes reembolsados / pacotes pagos da coorte | Aguardar janela de maturação |
| Custo por dossiê | Custos variáveis atribuídos / dossiês processados | Incluir tentativas que falharam |
| Margem de contribuição | Receita menos custos variáveis, provisões e suporte variável | Separar antes/depois de CAC |
| Correção cadastral | Vínculos corrigidos / vínculos revisados | Expor tamanho e seleção da amostra |
| Cobertura | Análises com evidência disponível / análises elegíveis | Distinguir “não encontrado” de “consulta falhou” |

Eventos candidatos: `analysis_saved`, `cost_reviewed`, `building_confirmed`, `question_answered`, `comparison_opened`, `export_completed`, `offer_viewed`, `purchase_completed`, `refund_recorded`.

Na POC local, eventos podem ser contados em sessão de pesquisa. Telemetria remota é proposta posterior: não está sendo instalada nesta entrega.

## 4. Qualidade e limites da inferência

| Risco | Efeito | Controle proposto |
|---|---|---|
| Prédio errado | Atribui cadastro à opção errada | Confirmação explícita, revisão e capacidade de desvincular |
| Campo fiscal interpretado como mercado | Referência de preço enganosa | Trilhas separadas e unidade explícita |
| Processo confundido com obra ativa | Alarme indevido | Estado do processo e pergunta de confirmação |
| Ausência confundida com inexistência | Falsa segurança | Mostrar cobertura e resultado da consulta |
| OCR erra dinheiro ou data | Distorce orçamento | Citação, revisão de valores e bloqueio de confiança excessiva |
| API muda preço ou quota | Margem negativa | Limite diário, consumo por SKU e degradação planejada |
| Pesquisa enviesada | Oferta desenhada para amigos | Recrutamento diversificado e análise por segmento |
| Dados antigos ganham aparência atual | Confiança indevida | Data de referência separada da data de coleta |
| Incentivo por contribuição gera respostas falsas | Base comunitária perde qualidade | Limite, revisão e não promover relato a fato oficial |

## 5. Governança de documentos e dados pessoais

A LGPD estabelece princípios como finalidade, necessidade e transparência, além de hipóteses para tratamento e direitos dos titulares. O desenho abaixo é uma proposta de produto a revisar conforme o tratamento efetivo. [Texto oficial](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm).

- Coletar somente o necessário para a tarefa; não distribuir nomes ou identificadores de contribuintes.
- Manter documentos privados e separados do catálogo público.
- Antes de usar processamento externo, informar a finalidade e definir fornecedores, base legal, retenção e eventual transferência internacional.
- Proposta inicial: apagar arquivo original do processamento temporário em até 24 horas após a conclusão, salvo armazenamento solicitado; definir também exclusão de cópias e logs. Prazo ainda depende de arquitetura e contratos.
- Não reutilizar documentos para treinamento ou base comercial como padrão.
- Compartilhamento deve permitir revogação; URLs de documentos não devem ser públicas por conveniência.
- Tratar afirmações de moradores como relatos contextualizados, com contestação e remoção.

Estes controles são necessários especialmente para a futura leitura de atas, que pode conter nomes, dívidas e informações de terceiros. Na etapa atual, priorizar exemplos sintéticos para testes e documentos autorizados e minimizados para avaliação.

## 6. Regras de IA documental

Extrair texto e preservar número de página; identificar campos; gerar achado com trecho; revisar valores; retornar “não localizado” quando não houver suporte. Toda recomendação deve se apoiar no documento ou ser claramente uma pergunta adicional.

Separar conteúdo do arquivo de instruções do sistema. Documentos não podem autorizar ações externas. Não enviar mensagens, alterar cadastros ou executar pagamentos a partir de texto encontrado.

Teste com tabelas, páginas rotacionadas, documentos escaneados, versões conflitantes e números semelhantes. A precisão de 95% da amostra não autoriza desprezar erros críticos: qualquer erro em obrigação ou valor exige revisão do fluxo.

## 7. Portões de decisão

**G0 — pesquisa pronta:** dor e tarefa reproduzíveis, com alternativas atuais documentadas.  
**G1 — piloto útil:** custos corretos, pendências compreensíveis, recuperação do caderno demonstrada.  
**G2 — enriquecimento confiável:** qualidade e cobertura medidas, falhas tratadas, licença registrada.  
**G3 — oferta vendável:** cobertura antes de pagar, suporte, reembolso e custo conhecidos.  
**G4 — expansão:** margem e operação sustentáveis em coortes repetidas.

Produto registra decisão e justificativa; engenharia e dados registram limitações; responsável comercial só amplia oferta depois de G3. Papéis são propostos, sem atribuir compromissos à equipe.
