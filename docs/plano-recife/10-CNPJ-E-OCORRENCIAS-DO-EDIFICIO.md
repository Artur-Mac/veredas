# 10 — CNPJ, documentos e ocorrências vinculadas ao edifício

**Adendo 1.1 · 21/10/2026.** Aprofundamento autorizado pelo usuário para obras, vícios construtivos, questões estruturais, passivos trabalhistas e barulho. Detalha capacidades já catalogadas; mantém os 80 IDs, as 15 épocas e as 57 unidades. Não é implementação nem contratação de consulta.

## Decisão de produto

Adicionar uma investigação guiada a partir do **CNPJ confirmado do condomínio**, conectada ao endereço/lote, documentos e pessoas jurídicas responsáveis pelo empreendimento quando seu vínculo estiver demonstrado. É útil para descobrir ocorrências e perguntas relevantes. Cadastro empresarial sozinho não contém diagnóstico físico, lista completa de obras nem medição de barulho.

Nome proposto na interface: **“Documentos e ocorrências do edifício”**, dentro de Dossiê → Edifício. Evitar “bomba trabalhista”, “risco estrutural pelo CNPJ” e notas agregadas. A apresentação responde: **o que foi encontrado, sobre qual entidade/imóvel, em qual estágio, com que evidência e o que confirmar**.

### Valor por assunto

| Pergunta | Fontes e cruzamentos | Entrega permitida / limite |
|---|---|---|
| Existem obras ou reformas documentadas? | Licenciamento Recife por endereço/processo/CNPJ do requerente; atas, contratos e rateios apresentados | Processo, licença, decisão de assembleia e obra observada ficam separados. Requerimento não significa obra iniciada/concluída |
| Há discussão sobre vício construtivo? | Processos públicos acessíveis, atas, notificações e laudos apresentados | Assunto discutido, trechos, partes e estágio. Alegação, perícia e decisão não são equivalentes |
| Há documento sobre questão estrutural? | Laudo/perícia com imóvel e escopo confirmados; atos oficiais disponíveis | Apresentar conclusão atribuída ao documento e sua data/escopo, quando verificável. CNPJ/ação isolados não estimam risco físico atual |
| Há contingência trabalhista a esclarecer? | Certidão de ações TRT6, CNDT/TST, processos identificados, atas/balancetes e provisões informadas | Separar ação em tramitação, dívida registrada, garantia/suspensão e valor provisionado. Não estimar rateio automaticamente |
| Há registros relacionados a barulho? | Processo/licenciamento ou reclamação vinculados à atividade/imóvel; CNPJ de estabelecimento vizinho, endereço e observação de visita | Registro histórico e motivo para visitar em certo horário. Não mede emissão atual nem prova incômodo em uma unidade |

## Fontes verificadas e limites de acesso

Consulta documental em 21/10/2026; nenhuma pessoa jurídica real foi pesquisada.

- O [TRT6](https://www.trt6.jus.br/portal/servicos/consultas) descreve certidão que informa se uma pessoa/empresa é reclamada em processo trabalhista em tramitação naquele Regional. Guardar o alcance real descrito no documento emitido; não extrapolar a outros tribunais, datas ou acervo histórico.
- A [carta de serviços do TST](https://www.tst.jus.br/web/acesso-a-informacao/carta-de-servicos-a-cidadania/servicos-processuais/cndt) descreve CNDT baseada no BNDT e emissão gratuita pela internet, com CAPTCHA. O [TST explica os resultados](https://www.tst.jus.br/o-que-e-cndt): negativa, positiva e positiva com efeitos de negativa são estados diferentes. CNDT negativa não é inventário de ações em andamento nem prova de ausência de contingência. Conteúdo localizado no índice de busca; abertura direta desta segunda página exigiu JavaScript/checagem de acesso.
- O [Licenciamento Unificado do Recife](https://licenciamentounificado.recife.pe.gov.br/consultas-processos-de-licenciamento-fiscalizacao) orienta pesquisas por endereço, número e, em processos digitais, CPF/CNPJ do requerente/empresa. Usar somente CNPJ no VEREDA. Resultados do índice de busca descrevem filtros; a abertura retornou conteúdo parcial. Não foi demonstrada API, consulta em lote ou cobertura completa.
- O [CNJ descreve a API pública DataJud](https://www.cnj.jus.br/sistemas/datajud/api-publica/) como metadados processuais, com proteção de informações das partes. Não tratar como busca universal por CNPJ. Página localizada no índice; abertura direta retornou 403 nesta rodada. Busca de partes exige serviço legítimo que comprove esse acesso.
- A [Infosimples documenta consulta CEAT/TRT6](https://infosimples.com/consultas/tribunal-trt6-certidao/) com entrada CNPJ e saída de processos/certidão. É fornecedor candidato condicionado: documentação lida, sem teste autenticado, cotação ou verificação de direitos/SLA. Não contornar CAPTCHA por conta própria.
- A [JUDIT anuncia busca processual por CNPJ](https://judit.io/). Exigir documentação atual e amostra autorizada antes de integrar; uma URL antiga de documentação de contagem retornou 404. A propaganda de cobertura nacional não comprova completude no caso do condomínio.

Não depender de fornecedor único. Um documento emitido manualmente e anexado pode atender ao núcleo local, com origem e revisão; a busca automática permanece uma integração pendente até teste legítimo.

## Identidade: a parte crítica da funcionalidade

1. A análise pode continuar sem CNPJ. Solicitar o identificador ao condomínio ou extrair como proposta de documento/ata, com revisão.
2. CNPJ do condomínio, incorporadora/SPE, construtora, administradora e empresa vizinha são entidades diferentes. Guardar `papel`, identificador textual, nome, endereço e evidência do vínculo. Não inferir grupo econômico ou responsabilidade solidária.
3. Para condomínio, verificar compatibilidade com endereço/nome e documento apresentado. Para SPE/construtora, exigir documento que ligue aquela pessoa jurídica ao empreendimento. Nome comercial semelhante ou atividade CNAE não basta.
4. Consulta pode devolver resultados abrangendo filiais/raiz. Preservar chave pesquisada e alcance retornado; não atribuir cada resultado à torre/unidade sem evidência.
5. Resultados da construtora em **outros empreendimentos** ficam em contexto empresarial separado, quando houver justificativa de uso. Não entram como ocorrência do imóvel atual, não geram rótulo de defeito e não são destaque padrão.
6. Para barulho do entorno, associar estabelecimento/endereço e precisão espacial próprios. Não procurar indiscriminadamente processos de todos os CNPJs em um raio; começar por atividade selecionada pela pessoa ou por registro diretamente relevante.

## Contrato de ocorrência proposto

Adaptar ao schema ativo, migrando só se necessário; não duplicar `Fato`, documento e evidência existentes. Manter duas dimensões separadas: natureza do registro e estágio do processo.

| Campo | Regra |
|---|---|
| `id`, `tipo`, `assunto` | ID estável; tipos: processo, certidão, licença, documento técnico, ata ou observação; assunto pode ser múltiplo |
| `entidadeConsultada`, `chaveConsultada`, `alcanceConsulta` | Papel/CNPJ, identificador usado e universo/tribunal/data cobertos |
| `vinculoImovel` | confirmado, a confirmar ou outro empreendimento; IDs de documentos que sustentam vínculo |
| `identificadorRegistro`, `tribunalOrgao`, `grau` | Número CNJ/processo administrativo/certidão quando conhecido; não inventar identificador |
| `polo`, `objeto`, `estagioOriginal` | Condomínio pode ser autor buscando reparação; preservar texto/status da fonte |
| `naturezaEvidencia` | alegação, documento técnico, ato/decisão ou observação; decisão pode ser provisória, recorrível ou final conforme evidência |
| `referenciaEm`, `consultadoEm`, `ultimaMovimentacaoEm` | Datas distintas, opcionais quando desconhecidas |
| `valores` | Lista tipada: valor da causa, pedido, condenação informada, acordo, pagamento ou provisão; moeda/data/trecho próprios |
| `fonte`, `url`, `documentoId`, `pagina`, `trecho` | Suporte auditável e mínimo necessário, sem replicar nomes/CPF de trabalhadores/moradores |
| `revisao`, `perguntaId` | Confirmação da classificação/vínculo e pergunta derivada estável |

Valor da causa não é dívida certa. Não somar pedidos, condenações e provisões do mesmo caso. Não dividir valor por unidades para publicar “rateio provável”. Só levar ao cenário de custos valor de rateio informado e confirmado, com duração e fonte, evitando dupla contagem com condomínio extraordinário.

Deduplicar processo pelo número CNJ quando válido; graus/recursos/fases permanecem associados ao caso, sem inflar total de conflitos. Guardar respostas negativas de consulta com alcance/data, sem criar “edifício sem processos”.

## Classificação inicial sem novo modelo de machine learning

- Taxonomia versionada de assuntos: obras/reparos, vícios construtivos, estrutura, trabalhista, ruído/vizinhança e outros. Palavras-chave/assuntos oficiais só geram **proposta de categoria**.
- “Infiltração”, “fachada”, “fissura”, “fundação”, “indenização” ou “adicional de insalubridade” não comprovam defeito estrutural, dívida do condomínio ou poluição no apartamento. Conferir contexto, polo, pedido e documento.
- Modelo da época 11 pode sugerir resumo com página/trecho, seguindo corpus e revisão já previstos. Se falta trecho/documento, mostrar assunto original e abster-se do resumo factual.
- Não gerar score de risco, causalidade, culpa ou juízo de qualidade do edifício. Ordem inicial: ocorrências diretamente ligadas ao imóvel, assunto escolhido e data; explicar ordenação. A gravidade de uma conclusão técnica não é inferida por quantidade de processos.

## Experiência proposta

Em Edifício, um bloco compacto reúne **identidade confirmada**, **consultas/documentos por assunto** e **perguntas pendentes**. Expandir lista para ver registros. Fonte/custo/cobertura ficam claros antes de iniciar consulta paga; repetir a ação usa protocolo idempotente e não altera a política de crédito vigente.

Cartão de ocorrência mostra até cinco elementos: assunto; entidade e papel; estágio/data; trecho com origem; ação. Abrir leva ao documento/processo e ao vínculo com o imóvel. Sem resultado: “Nenhum registro retornado nesta consulta — TRT6, realizada em [data]”, sem selo de segurança. Sem acesso: “Consulta não realizada”, com opção de anexar certidão.

Perguntas prontas, sempre editáveis e com assinatura VEREDA na mensagem consolidada:

- “Há ação sobre reparos deste edifício? Qual o estágio, o laudo relacionado e a solução prevista?”
- “Qual foi a última inspeção apresentada e quais intervenções recomendadas já foram executadas?”
- “Há provisões ou rateios aprovados relacionados a processos trabalhistas? Posso consultar a ata e o balancete?”
- “Existe obra aprovada, contrato, cronograma e valor já deliberado para minha unidade?”
- “Há registros sobre ruído dessa atividade e em quais horários vale verificar durante a visita?”

Não repetir a ocorrência em todas as abas. Barulho no entorno continua em Entorno, com referência cruzada ao documento; questões de custo viram cenário somente após revisão. Comparação mostra documentação disponível/pendências, sem ranking de quantidade de litígios.

## Encaixe na execução existente

| Unidade | Complemento obrigatório |
|---|---|
| EP06.04 / F36–F37 | Identidades/papéis confirmados; anexação manual de CNDT e certidão de ações TRT6; distinguir seus significados |
| EP06.02–EP06.03 / F33–F34 | Vínculo do laudo/ata à ocorrência; inspeção, obra e rateio com origem e datas |
| EP07.01 e EP08.01 / F40–F41/F57 | Registro de ruído/licenciamento ligado ao endereço/atividade; sem busca judicial massiva de vizinhos |
| EP11.01–EP11.03 / F35/F38 | Corpus, taxonomia, consultas autorizadas, deduplicação e preservação do estágio/polo/valores |
| EP10.01–EP10.03 / F63/F69/F71 | Perguntas estáveis, comparação sem score, compartilhamento selecionado |
| EP14.01–EP14.03 / F79–F80 | Medir se achado realmente esclareceu decisão; custos, falsos vínculos, compreensão e utilidade |

Pontos de inspeção: contratos, fatos/perguntas e derivadores de dossiê existentes; componentes de Edifício; custos/cenários; armazenamento de documentos. Adaptador judicial e normalizador de ocorrências serão módulos novos, a posicionar após inspeção do código. Não refatorar buscador cadastral para virar motor jurídico.

## Testes de aceite específicos

1. **Identidade equivocada:** CNPJ de administradora ou edifício homônimo não passa a condomínio confirmado. Resultado de outro empreendimento não vira fato do imóvel.
2. **Condomínio autor:** processo de reparação contra construtora mostra polo ativo; não rotula condomínio como devedor.
3. **Trabalhista:** CNDT negativa e certidão TRT6 com ação em andamento convivem sem contradição artificial; positiva com efeitos de negativa preserva estado original. Não emitir parecer de contingência.
4. **Valores:** causa/pedido/condenação/provisão não se somam; número de processo repetido em recurso não duplica total; ausência de valor não vira zero.
5. **Engenharia:** alegação de fissura não vira risco estrutural confirmado; laudo de fachada não certifica estrutura; documento sem vínculo/data fica a confirmar.
6. **Ruído:** CNPJ/CNAE de bar e reclamação antiga não viram barulho atual medido. Registro de outra porta não é atribuído ao apartamento por proximidade apenas.
7. **Cobertura e falhas:** nada consta, tribunal não coberto, CAPTCHA, segredo/indisponibilidade, erro tarifado e consulta desatualizada têm estados distintos. Sem burlar acesso ou repetir compra.
8. **Privacidade:** nome de empregado, CPF e conteúdo sigiloso não aparecem em resumo, log, índice público ou mensagem padrão; só o mínimo do registro público é retido legitimamente.
9. **Continuidade:** consulta falha e leitura offline não bloqueiam caderno, custo, visita e documentos locais. Não apresentar mock como resultado consultado.

Esses casos entram nos testes de comportamento das unidades responsáveis e na revisão visual do documento 07. Não executar consulta real apenas para produzir captura.

## Avaliação exploratória proposta

Piloto autorizado com pelo menos 20 condomínios do Recife, incluindo casos com e sem documentação/processos conhecidos, sem publicar lista nominativa. Fazer amostra intencional por idade/tipologia/bairro e declarar que não estima prevalência na cidade. Usar identificadores reais somente com finalidade/base de tratamento e acesso definidos; ainda não realizado.

Medir: taxa de CNPJ corretamente vinculado; cobertura por fonte/tribunal; tempo/custo por caso; duplicatas; proporção de registros diretamente relacionados ao imóvel; precisão da classificação por revisão; registros sem contexto suficiente; perguntas esclarecidas; compreensão dos estados pela pessoa. Não calcular “percentual de prédios problemáticos”.

Decisão de continuidade: habilitar uma fonte apenas quando vínculo, direitos, custo e apresentação forem verificáveis. Manual/documental pode sair na época 06; API judicial fica na 11. Validar utilidade na 14 e simplificar se houver muitos resultados irrelevantes ou leitura alarmista.

## Registro desta revisão

Documentação aprofundada e vinculada às épocas; nenhuma consulta autenticada, emissão de certidão, compra, alteração de cobrança, envio ou mudança no app. Fontes públicas e documentação de fornecedores foram consultadas; limites de acesso descritos acima. Executar validador estrutural do pacote e `git diff --check`; resultado consolidado em `evidencias/validacao.json`. Testes do app e inspeção visual não se aplicam como prova desta especificação e não foram executados nesta revisão.
