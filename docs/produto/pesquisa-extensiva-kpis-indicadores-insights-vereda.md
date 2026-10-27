# Pesquisa extensiva de evolução, KPIs e oportunidades de inovação do VEREDA

**Versão 1.0 · 22/10/2026 · Recife como praça inicial · Documento de pesquisa, diagnóstico e direção de produto.**

Este documento consolida a pesquisa existente e amplia a análise de evolução, indicadores, dados, monetização e inovação do VEREDA. O arquivo solicitado pelo nome não existia no checkout; este é o novo documento consolidado. A data descreve a versão do documento, não a atualização das bases públicas.

## Como interpretar as conclusões

- **Confirmado no produto:** comportamento localizado no código e, quando citado, coberto por teste, smoke ou inspeção visual nos registros de execução.
- **Medido em dado local:** resultado reproduzível sobre um cache ou índice específico, com período e limitações descritos. Não é necessariamente atual nem representativo de todos os imóveis do Recife.
- **Fonte consultada:** página ou documentação pública examinada. Consultar uma fonte não equivale a integrar, contratar ou validar todos os seus registros.
- **Hipótese:** explicação plausível a testar com pessoas em decisões reais.
- **Oportunidade proposta:** trabalho futuro; não é funcionalidade disponível.
- **Não demonstrado:** capacidade que os artefatos desta pesquisa não comprovam.

Nenhuma entrevista, teste de disposição a pagar, campanha, API paga ou pesquisa de campo com moradores foi realizada para este documento. Não há base para declarar público-alvo conhecido, demanda validada, retenção, conversão, CAC ou preço ótimo.

## Síntese executiva

O VEREDA deixou de ser apenas um protótipo de exploração visual: há hoje um caderno local de imóveis, comparação por prioridades, cenários de custo, evidências e pendências, dados urbanos parciais para Recife, registros de visita, importação revisável, OCR local de imagem no navegador, exportação e um plano de 80 capacidades com estados e pendências. O lote final de execução registrou 48 suítes/1.363 testes e smoke da V1 e ampliado; a validação web incluiu telas em 360, 375 e 1280 px, mas não certifica sensores, leitores de tela ou operação em aparelho físico. A [matriz de prontidão](../plano-recife/execucoes/PRONTIDAO-2026-10-22-FINAL.md) é o inventário detalhado.

Esse avanço técnico não prova que o produto resolveu uma decisão real, que alguém pagará, nem que a cobertura está pronta para publicação. A maior oportunidade imediata é ligar quatro coisas que hoje aparecem em partes: **o que a pessoa precisa decidir → qual evidência existe e em que escala → o que continua incerto → qual ação pode resolver a lacuna**. O produto deve ser útil mesmo quando não reconhece o prédio ou quando uma fonte está ausente.

Prioridades estratégicas recomendadas:

1. **Conhecer o usuário por comportamento observado.** Começar com pessoas em busca ativa de aluguel dentro da cobertura atual; comparar com compradores e pessoas mudando para Recife. São segmentos de pesquisa, não personas validadas.
2. **Dar precedência à confiança e à explicação.** Exibir origem, período, alcance, qualidade do vínculo e motivo da correspondência. Separar “não há registro” de “não foi possível avaliar”. Não produzir uma nota única de risco ou qualidade.
3. **Fazer a visita fechar o ciclo.** Gerar perguntas a partir das lacunas, registrar resposta e fonte, comparar o que mudou na decisão e preservar uso offline. Medição de rede, ruído, acessibilidade e estrutura deve ser observação delimitada, não promessa de sensor ou perícia.
4. **Medir decisão assistida, não volume de cartões.** Instrumentar apenas com governança e escolha informada; começar com pesquisa acompanhada e dados agregados voluntários.
5. **Validar monetização antes de integrar fornecedores.** Testar oferta de pacote para uma busca, serviço assistido e benefício de realocação em pesquisa; usar preço e custo real apenas depois de autorizar experimento comercial.
6. **Evitar dependência cara ou difícil de retirar.** Dados abertos minimizam taxa de licença, não o custo de atualização, associação, qualidade, operação e suporte. API paga só deve resolver um gargalo comprovado e ter fallback.

## 1. Evolução real confirmada e limites

| Área | Evidência disponível | O que isso permite afirmar | O que ainda não permite afirmar |
|---|---|---|---|
| Caderno e persistência | Cadastro progressivo, análise local, rascunhos, backup/restauração e filas de salvamento com testes registrados | É possível organizar imóveis e preservar uso local em fluxos cobertos | Recuperação universal em qualquer aparelho, colaboração/sincronização ou backup automático |
| Custos | Derivador comum para custo mensal; aluguel R$ 2.500 + condomínio R$ 600 resulta em mensal conhecido de R$ 3.100, mantendo IPTU/seguro pendentes; compra separada | Ausência e zero são estados diferentes; o valor conhecido pode ser mostrado sem inventar parcela | Estimativa universal de gasto final, tarifas futuras ou aconselhamento financeiro |
| Comparação | Dois ou três imóveis, prioridades ajustáveis e contexto incompleto expresso | A pessoa pode organizar diferenças segundo seus próprios critérios | Ranking de melhor imóvel, utilidade validada ou recomendação objetiva |
| Recife e CNEFE | Cache local minimizado do Censo 2022; categorias de ensino, saúde e religião; no índice consultado, 5.661 registros elegíveis de nível 1 para essas categorias | Há experimento local de proximidade com origem e nível espacial | Funcionamento em 2026, atividade aberta, acesso, horário, fachada ou trajeto caminhável |
| Índices de edifícios | 94 partições geradas; 72 habilitadas localmente, cobrindo 7.206 prédios experimentais; bairros sem elegibilidade e uma partição retida | A cobertura técnica cresceu e pode ser medida por bairro | Cobertura equilibrada de Recife, cobertura de anúncios ou disponibilidade ao público |
| Visita e conectividade | Registros manuais de visita, notas de Wi‑Fi/rede por cômodo, lembretes e observações | Fluxo manual pode funcionar sem rede se os dados já estiverem no aparelho | Medição de velocidade, 5G, Wi‑Fi 5 GHz, ruído em dB ou sensores físicos validados |
| Documentos e importação | Revisão antes de aplicar, OCR de imagem local no navegador, estruturas documentais manuais e geração de PDF/backup web | Parte da coleta pode reduzir digitação e conservar referência | OCR geral confiável, leitura direta de PDF, integração com condomínio ou consulta automática a processos |
| Fontes e cronologia | Linha do tempo combina cadastros, licenças próximas, evidências próprias e eventos do usuário com limitações de vínculo | Pode organizar fatos heterogêneos sem esconder origem | Histórico exaustivo do prédio, confirmação de obra executada ou última inspeção pública automática |
| Compartilhamento | Texto de mensagem editável com assinatura “Mensagem preparada com o VEREDA.”; compartilhamento deliberado | O nome da marca acompanha o texto preparado | Envio automático, aquisição orgânica, leitura ou conversão |
| Qualidade | A prontidão registra suíte geral, smokes, capturas web e limitações | A base local tem uma verificação técnica documentada | Conformidade integral, prontidão nativa, acessibilidade validada com usuários ou segurança de operação remota |
| Negócio | Modelos de preço foram propostos em documentos anteriores | Há hipóteses que podem orientar pesquisa | Preço aceito, disposição a pagar, modelo sustentável, tamanho de mercado ou margem observada |

O plano de Recife enumera capacidades desde dados fiscais e mobilidade até inspeções, documentos, monetização e comunidade. O catálogo é uma ferramenta de rastreabilidade, não evidência de que todas essas funções estão feitas. Para cada decisão, a matriz de prontidão preserva “verificado”, “parcial”, “manual”, “não implementado” e “dependência externa”.

## 2. Evidência exploratória: CNEFE e valor diferencial

Uma análise reproduzível foi executada no cache minimizado `.cache/dados-recife/cnefe-recife.json.gz`, com referência censitária de 2022 e modificação registrada no cache em 20/05/2024. O SHA-256 do cache é `424040817d90431893dd555d456e3909a7bcc2f96e613cad7249092bebdc2eb6`. Método, contagens por espécie, níveis e bairros estão em [resultado da EDA](refinamento-2026-10-21/evidencias/eda-cnefe.json) e [script](refinamento-2026-10-21/evidencias/explorar_cnefe.py).

O recorte contém 737.511 registros: 643.590 domicílios particulares, 623 coletivos, 60 agropecuários, 1.689 de ensino, 1.519 de saúde, 72.760 de outras finalidades, 14.695 de construção/reforma e 2.575 religiosos. “Registro” não equivale a porta única, empresa distinta, atividade em operação ou endereço visitável.

Qualidade espacial: 654.789 registros estão no nível 1; 71.793 no nível 2; 8.638 no nível 3; 2.284 no nível 4; e sete no nível 6. Assim, 82.722 (11,2%) estão fora do nível 1. A metodologia do IBGE ressalta erro espacial e casos em que a coordenada representa face ou setor, portanto coordenada publicada não significa necessariamente ponto preciso na porta. A aplicação deve manter o nível da geocodificação como parte da evidência, e não convertê-lo em probabilidade.

Nos cinco bairros presentes nos índices analisados, 2.347 de 2.688 edifícios (87,3%) têm pelo menos um registro de ensino, saúde ou religião nível 1 dentro de 150 m; a 300 m, são 2.594 (96,5%). A métrica conta edifícios com um ou mais pontos, não número de equipamentos, acesso por rota, relevância para a pessoa ou ruído. As distâncias são linha reta entre centros de edifício e coordenadas de registros; não representam a situação atual.

**Insight sustentado:** uma notificação genérica “há algo perto” teria pouco poder de distinção nesse recorte. Isso não prova baixa utilidade para todas as pessoas. Recomenda testar relevância por tarefa: “há serviço de saúde registrado neste raio e período”, “qual caminho você usaria?”, “que horário vale observar?”, com escolha por prioridade pessoal. A mesma escola pode ser conveniente para uma família e irrelevante para outra. Religião, renda, presença de pequenos negócios e ocorrências não devem virar penalidade de imóvel.

O CNEFE é referente ao Censo 2022. O IBGE publica campos de endereço e coordenadas e descreve níveis de qualidade; sua documentação metodológica apresenta erro RMS de 5,84 m em condição ideal e máximo de 11,71 m em condição normal, podendo ser maior ou sem coordenada em condições adversas. Esses números são descrição da metodologia, não garantia individual para qualquer ponto. [CNEFE — IBGE](https://www.ibge.gov.br/estatisticas/sociais/habitacao/38734-cadastro-nacional-de-enderecos-para-fins-estatisticos.html) · [Metodologia de coordenadas — IBGE](https://www.ibge.gov.br/singedlab/dados-apoio-rs_populacao-residente.php) · [Faces de logradouros — IBGE](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/28971-base-de-faces-de-logradouros-do-brasil.html?=&t=sobre).

## 3. Tese de produto e usuários a descobrir

### Tese

VEREDA ajuda uma pessoa a conduzir uma busca de moradia com menos repetição e mais clareza sobre custos, evidências, perguntas ainda abertas e mudanças na decisão. Seu valor pode surgir tanto de uma informação encontrada quanto de uma incerteza exposta antes da escolha. A unidade de valor não é “quantidade de dados do bairro”; é uma etapa real da busca que a pessoa conseguiu realizar melhor.

### Segmentos que merecem comparação

| Segmento de pesquisa | Situação concreta | Resultado que pode importar | Risco que invalida a hipótese |
|---|---|---|---|
| Locatário em busca ativa em Recife | Compara alguns apartamentos antes da mudança | Saber custo conhecido, pendências e perguntas por visita | A busca é curta; a planilha ou conversa atual já resolve |
| Comprador de apartamento usado | Precisa separar preço, custos de compra e documentos | Organizar evidências e identificar perguntas para profissionais | Espera que o app avalie estrutura ou substitua inspeção |
| Pessoa mudando para Recife | Pesquisa à distância e conhece pouco os bairros | Preparar visitas e comparar rotina/acesso | Cobertura local parcial ou fonte territorial pouco explicável |
| Pessoa com trabalho/estudo em casa | Depende de conectividade e conforto por cômodo | Registrar verificação no horário e espaço que usa | Espera que teste offline prove qualidade permanente da rede |
| Profissional de realocação | Apoia buscas recorrentes de terceiros | Padronizar etapas, sem apropriar dados privados | Venda B2B exige gestão, suporte, papéis e contratos |
| Corretor, síndico ou administrador | Responde repetidamente perguntas/documentos | Reduzir retrabalho e esclarecer pedido | Conflito comercial prejudica independência do produto |

**Amostra inicial proposta:** 18 entrevistas com consumidores (seis por cada um dos três primeiros grupos) e seis entrevistas profissionais separadas. Recrutar pessoas com episódio recente ou busca ativa; limitar equipe/amigos; coletar histórias e artefatos voluntários minimizados. Depois acompanhar oito pessoas em buscas reais durante duas semanas. Esses tamanhos servem à descoberta qualitativa, não a estimar prevalência de mercado. O protocolo e os limites já estão detalhados em [Público, monetização e distribuição](refinamento-2026-10-21/03-PUBLICO-MONETIZACAO-E-DISTRIBUICAO.md).

Perguntas centrais: conte a última busca; mostre como comparou; qual informação faltou; o que tentou, quanto tempo custou; quem participou e pagaria; que pergunta alterou uma visita ou decisão? Apresentar o protótipo depois da narrativa espontânea e observar uma ação, não pedir apenas nota de satisfação. Registrar fala, interpretação e comportamento em campos distintos.

### Jornada que organiza a experiência

1. **Começar sem fricção:** colar URL/texto/foto ou criar cadastro incompleto; reconhecer o que foi inferido e permitir edição.
2. **Confirmar sem excesso de certeza:** mostrar candidato, motivos e dados faltantes; permitir seguir sem prédio confirmado.
3. **Entender o dinheiro:** separar preço, recorrência, parcelas desconhecidas e cenários pessoais; preservar ausência versus zero.
4. **Ver o contexto:** camada opcional por decisão, distância, data, escala e qualidade; explicar limites junto do dado.
5. **Preparar a visita:** perguntas personalizadas pelas lacunas/prioridades, materiais já salvos disponíveis sem internet.
6. **Registrar o que observou:** horário, cômodo, fonte/resposta, nota e evidência opcional; separar observação de dado público.
7. **Comparar e decidir:** registrar mudança da preferência e motivo; nenhuma nota automática substitui o julgamento.
8. **Compartilhar apenas o escolhido:** mensagem/dossiê com marca, campos selecionáveis e sem notas privadas por padrão.

## 4. KPI principal e árvore de indicadores

### North Star candidata

**Ciclos de decisão assistidos concluídos por pessoa ativa em busca no mês (CDAC).** Considerar um ciclo concluído quando a própria pessoa registra que, para um imóvel ou visita, concluiu uma etapa que pretendia fazer — por exemplo, comparar custos, obter uma resposta, realizar uma visita com roteiro ou registrar uma decisão/continuidade — e o caderno guarda ao menos o artefato correspondente (cenário, resposta com origem, registro de visita ou estado/motivo). Não exigir geocodificação, score, compartilhamento ou decisão final.

Essa definição é **candidata**. O evento no app prova que uma ação foi registrada, não que a evidência externa é verdadeira nem que a decisão ficou melhor. Separar duas versões no painel: `ciclo registrado` (observável no produto) e `ciclo confirmado pela pessoa` (autorrelato em pesquisa). Não chamar nenhuma delas de “decisão correta” ou economia comprovada.

### Árvore

```text
CDAC por pessoa em busca
├── pessoas que iniciam uma busca e conseguem estruturar imóvel
├── imóveis com pelo menos uma pergunta ou custo relevante
├── evidências / respostas revisadas e ações de visita
├── ciclos registrados como concluídos
└── guardrails
    ├── taxa de correção / associação ambígua
    ├── abandono por fricção e tempo para primeira utilidade
    ├── conteúdo ausente exibido como zero ou certeza (meta: zero)
    ├── falhas de salvamento, restauração e exportação
    ├── reclamações, incidentes de privacidade e suporte
    └── custo por ciclo assistido e dependência de fornecedor
```

### Definições operacionais propostas

| Indicador | Fórmula/denominador | Janela e leitura | Limite de interpretação |
|---|---|---|---|
| Ativação útil | pessoas elegíveis novas que registram 1º artefato útil ÷ pessoas novas que criam análise | 7 dias desde início; segmentar por aluguel/compra e cobertura | Criar cadastro sozinho não é ativação; exigir prédio localizado exclui valor real |
| Tempo até primeira utilidade | mediana entre início e primeiro artefato definido | mesma sessão e 7 dias; mostrar distribuição/p90 | Não reduzir por ocultar revisões necessárias |
| Continuidade da busca | pessoas com segundo imóvel, visita ou retorno explícito ÷ pessoas que informaram busca ainda aberta | 14 e 30 dias; cohort pela data de início | Imóvel resolvido encerra a necessidade; retenção mensal bruta distorce ciclo curto |
| Fechamento de lacuna | lacunas com resposta e referência ou observação marcada ÷ lacunas escolhidas para acompanhamento | por imóvel/visita; separar resposta de “não consegui” | Marcar como respondida não comprova conteúdo factual |
| Utilidade percebida | ciclos com avaliação breve “ajudou a agir” ÷ ciclos com resposta | voluntário e opcional; publicar contagem e taxa de resposta | Viés de resposta; “gostei” não equivale a resultado financeiro |
| Associação automática útil | candidatos aceitos sem correção material ÷ candidatos apresentados e revisados | por tipo de correspondência, bairro, qualidade geográfica e modo | Não divulgar como probabilidade; abstenção é resultado apropriado |
| Abstenção apropriada | casos insuficientes que pedem informação/seguem sem prédio ÷ casos insuficientes avaliados | corpus revisado + produção agregada opcional | Alto valor pode ser sinal de segurança; não otimizar para “sempre responder” |
| Custo conhecido coerente | casos de fixture/produção em que rótulo, soma e pendências concordam ÷ casos elegíveis | cada release e regressão | Métrica de integridade, não engajamento |
| Qualidade de importação | campos importados que pessoa mantém após revisão ÷ campos candidatos aplicados | por fonte/formato; conferir amostra humana | Não tratar OCR confidence como verdade nem comparar motores sem corpus equivalente |
| Preparação de compartilhamento | resumos copiados/abertos ÷ resumos apresentados | opcional; agrega apenas ação local | Não prova mensagem enviada, entregue ou viralização |
| Cobertura de evidência | casos com pelo menos uma fonte disponível e período/escala exibíveis ÷ casos em que a camada é elegível | por bairro/camada/coorte de dataset | Cobertura não é completude do mundo real |
| Frescor operacional | registros com idade dentro da janela aprovada pela fonte ÷ registros usados | por camada, fonte e data de atualização | Janela depende do dataset; CNEFE 2022 não vira fresco por baixar cópia em 2026 |
| Custo por ciclo | (infra + consultas pagas + processamento + suporte atribuível) ÷ CDAC no período | mensal por cenário e volume | Incluir trabalho humano e chamadas que falham; custo zero é desconhecido, não nulo |
| Conversão paga | compradores confirmados ÷ usuários elegíveis expostos à oferta aprovada | experimento com regra e preço congelados | Não medir antes de oferta real aprovada; intenção declarada é métrica diferente |
| Margem de contribuição | receita líquida − custos variáveis − suporte − reembolso atribuível | por pacote/coorte | Não chamar de lucro; exclui custo fixo, aquisição e tributos ainda não definidos |

Medir percentis e contagens junto de médias, com coortes e denominadores explícitos. Segmentar no máximo por variáveis úteis e autorizadas: modalidade, etapa da busca, cobertura disponível e versão do produto. Evitar inferir renda, perfil familiar, vulnerabilidade ou preferência sensível a partir de bairro, endereço ou atividade próxima.

### Linha de base disponível hoje

Não há telemetria representativa, tamanho de usuários ativos, funil, retenção, conversão, CAC, uso de feature ou abandono observado. Testes automatizados, smokes, número de prédios e registros CNEFE descrevem o software/dataset, não consumidores. Portanto a linha de base comercial é **“não medida”**. O primeiro baseline deve nascer de pesquisa acompanhada e, só depois, de uma opção de compartilhamento de métricas explicada e independente do uso local.

## 5. Plano de instrumentação preservando o uso local

**Princípio:** nenhuma telemetria é necessária para que o caderno funcione. Até haver finalidade, base legal, responsável, retenção, canal de acesso/exclusão e aviso compreensível, não enviar eventos em segundo plano. Os princípios de finalidade, adequação, necessidade, qualidade, transparência, segurança, prevenção e prestação de contas constam da orientação pública ligada ao art. 6º da LGPD. [ANPD/Ministério — princípios da LGPD](https://www.gov.br/saude/pt-br/acesso-a-informacao/lgpd/principios).

Quando aprovado, limitar eventos a dados agregáveis com ID aleatório e versão: `analise_criada`, `imovel_adicionado`, `custo_revisado`, `lacuna_marcada`, `visita_iniciada/concluida`, `resposta_registrada`, `evidencia_revisada`, `comparacao_aberta`, `ciclo_encerrado`, `exportacao_concluida`, `erro_categoria`. Usar um registro local em fila, explicação antes de ativar, botão de pausar/apagar e envio agregado sob opção explícita. Ter também mecanismo de pesquisa manual sem instrumentação.

**Não coletar para analytics:** nome, telefone, email, URL do anúncio, endereço completo, coordenada, texto da conversa, notas livres, conteúdo/foto de documentos, dados de corretor, CNPJ associado à pessoa, destinos de rotina, identificadores persistentes de publicidade ou texto OCR. Registrar apenas enums e durações por faixa se forem indispensáveis. Definir limiar mínimo de agregação e impedir visualização de trajetórias individuais.

Documentar esquema, eventos, propósito, campos, acesso, criptografia, retenção e exclusão em ficha de governança antes do código. Pesquisa gravada ou compartilhamento de documento requer processo e autorização próprios. O usuário precisa continuar usando o produto se recusar analytics.

## 6. Oportunidades de inovação priorizadas

Classificação: **impacto** e **confiança** são avaliações qualitativas de produto (alta/média/baixa), não estatísticas. “Esforço” é relativo. Ordem combina relevância imediata e redução de risco.

| Prioridade | Oportunidade | Evidência/hipótese | Forma inicial | Guardrail e dependência | Impacto / confiança |
|---|---|---|---|---|---|
| P0 | Ficha de evidência universal | Fontes e períodos já existem parcialmente; contratos estão espalhados | Cabeçalho padrão: o que afirma, origem, referência, escala, vínculo, última atualização e limite | Não mostrar frescor como data de download; manter “sem informação” | Alto / alta |
| P0 | Abstenção explicável do prédio | E01 já explica match e insuficiência; cobertura é parcial | “Encontrei estes candidatos por…”, pedir número/foto/endereço ou continuar sem prédio | Ponto/área não vira certeza; sem score probabilístico | Alto / alta |
| P0 | Próxima pergunta por lacuna e prioridade | Fluxos de perguntas, visitas e respostas já existem em partes | Converter pendência em pergunta editável; responder com relato/documento/fonte ou deixar em aberto | Resposta não equivale a fato verificado; evitar aconselhamento técnico | Alto / média-alta |
| P0 | Resumo de decisão pessoal | Comparação por prioridades existe | “O que importa para você”, diferenças e itens sem dado, sem vencedor | Preferências privadas no aparelho; nenhuma nota total automática | Alto / média |
| P0 | Usabilidade e confiança offline | Preservação local já é princípio central | Preparar visita, testar modo avião, mostrar data/cache e guardar notas até reconexão | Não prometer sincronização/capacidade nativa sem ensaio real | Alto / alta |
| P1 | CNEFE por necessidade e qualidade | EDA mostra presença quase universal da categoria ampla | Filtrar categoria/raio, mostrar nível 1–6, distância aproximada e contexto do Censo 2022 | Não inferir negócio atual; revalidar licença/versão e associação | Médio-alto / alta |
| P1 | CNPJ agregado e contexto de atividade | Receita tem CNAE/endereço, mas sem coordenadas; casamento ainda proposto | EDA de endereço, deduplicação por estabelecimento, mapa interno e amostra auditada antes da UI | Não expor residencial/nominal; não rotular barulho ou risco estrutural | Médio / média |
| P1 | Linha do tempo de engenharia documental | Há cronologia e documentos manuais; busca automática não demonstrada | Registrar laudo apresentado, inspeção declarada, emissor, vínculo e datas distintas | Não afirmar “última inspeção” sem comprovação; ART/RRT não é laudo | Alto / média |
| P1 | Visita de conectividade por cômodo | A pessoa pode registrar rede sem internet; requisitos de aparelho variam | Checklist offline: operadora, tipo indicado pelo aparelho, rede vista, chamada/site quando houver sinal, local e horário | “5G” móvel ≠ Wi‑Fi 5 GHz; sem sinal não significa inexistência de cobertura | Médio / média |
| P1 | Transporte por serviço programado | GTFS foi inspecionado, mas licença/calendário completo ainda pendente | Distância até parada e serviço programado em data/hora, se feed íntegro | Sem inferir fluxo, ruído, diesel ou pontualidade; validar licença e exceções | Médio / média |
| P1 | Custo completo como intervalo conhecido + pendência | Cálculo mensal já é coerente; falta pesquisa sobre despesas práticas | Custos conhecidos, recorrentes, únicos e reembolsáveis em seções distintas | Não inventar contas/tarifas, não somar preço de compra ao mensal | Alto / alta |
| P1 | Compartilhamento orgânico com contexto | Assinatura de marca já foi incluída | Resumo selecionável com link explicativo da marca após domínio autorizado | Sem tracking por padrão, sem enviar notas privadas nem autofill de contato | Médio / média |
| P2 | Rede de serviços de confiança | Possível monetização assistida/indicação | Diretório transparente de profissionais solicitados pela pessoa | Conflito, remuneração e responsabilidade jurídica antes de operação | Médio / baixa |
| P2 | Alertas de alteração de fontes | Dados têm períodos e versões distintos | Notificar mudança material apenas em camada escolhida | Exige backend/atualização e definir relevância/falsos positivos | Médio / baixa |
| P2 | Dossiê/colaboração compartilhada | Exportação existe; sync/ACL não | Primeiro experimentar exportação selecionável e revogação só após backend | Não confundir arquivo exportado com link revogável; modelo de ameaça | Médio / baixa |
| P2 | Cenários explicáveis de moradia | Simulações financeiras já existem | Cenários “se custo mensal subir”, “se horizonte for 12/24 meses” | Hipóteses editáveis; não alegar recomendação financeira | Médio / média |

Recursos de alto risco para evitar nesta fase: **nota de segurança do bairro**, **risco estrutural derivado de CNPJ**, “rua barulhenta” derivada de parada/atividade, preço justo inferido de IPTU, previsão de alagamento sem validação técnica, “melhor imóvel” por soma de pesos e rede social pública sem moderação. Esses atalhos podem transformar proxies em alegações prejudiciais.

## 7. Dados públicos e fornecedores: valor, custo e dependência

### Fontes abertas relevantes para Recife

| Fonte | O que pode apoiar | Estado/limite no VEREDA | Próxima validação antes de usar |
|---|---|---|---|
| CNEFE / IBGE 2022 | Endereços, espécies de uso, coordenadas e nível de geocodificação | EDA local e camada experimental; não cobre funcionamento atual | Comparar versão, geografia, campos, licença, níveis e atualização do arquivo |
| Pesquisa do Entorno / IBGE | Características urbanísticas pesquisadas em 2022 | Contexto agregado por setor no app; não certifica face ou trajeto atual | Denominador, escala e associação geográfica por variável |
| Cadastro fiscal/IPTU Recife | Identificador/atributos fiscais e recortes anuais | Portal oferece registros por contribuinte/ano e API; cadastro não é preço de mercado | Esquema, atualização, licença, identificadores, proteção e correspondência prédio/unidade |
| CNPJ / Receita Federal | Situação cadastral, datas e CNAE de estabelecimento | Não há coordenada; consulta exige associação espacial própria; não integrado automaticamente | Competência, leiaute, município, CNPJ textual, duplicação, CNAE e amostra de endereço |
| GTFS / Grande Recife | Paradas, linhas, calendário e horários programados | EDA reportou 400 rotas e 7.217 paradas; calendário/licença não liberados para produto | Feed vigente, validação de calendário/stop_times/frequência, licença e geometria |
| CTTU / Portal Recife | Cadastros de trânsito, radares, sinistros e solicitações conforme dataset | Camadas existentes são parciais; ocorrência não mede exposição atual | Metadados, janelas, completude, IDs, geografia e mudanças no esquema |
| OSM | Rede e atributos de ruas/serviços quando mapeados | Alternativa/complemento, com cobertura desigual | Licença ODbL, atribuição, política de geocodificação e qualidade local |
| ANEEL / ANATEL | Indicadores territoriais de serviço elétrico/telecom | Nenhuma associação local demonstrada na prontidão | Escala, período, denominador, limites de uso e se a métrica responde pergunta do usuário |

O Portal de Dados Abertos do Recife lista o IPTU em JSON/CSV e indica acesso pela API. Isso oferece uma rota de ingestão, não autoriza inferir avaliação de mercado, nem substitui a verificação da licença e do esquema de cada dataset. [Portal Recife — IPTU](https://dados.recife.pe.gov.br/dataset/?tags=iptu). Para qualquer publicação, registrar metadados, licença, responsável, frequência e granularidade conforme padrão municipal. [Padrões de publicação do Recife](https://dados.recife.pe.gov.br/base/doc/recife/padroes_de_publicacao_dos_dados_no_portal_de_dados_abertos_do_recife.pdf).

A Receita Federal publica arquivos e metadados de CNPJ. O endereço cadastral precisa ser geocodificado ou associado a outra fonte; associação nunca é perfeita só porque rua e número coincidem. Data de início não confirma início da atividade naquele local. CNAE secundário não prova execução local, operação aberta, entregas ou emissão de ruído. [Dados abertos da Receita](https://www.gov.br/receitafederal/dados) · [Metadados do CNPJ](https://www.gov.br/receitafederal/dados/cnpj-metadados.pdf).

### APIs pagas e por que não contratar agora

| Categoria/fornecedor consultado | Possível ganho | Custo/dependência | Recomendação |
|---|---|---|---|
| Google Maps Geocoding | Resolver endereços problemáticos e geocodificação sob demanda | Requer billing e chave; cobrança por SKU/request; termos de uso limitam armazenamento/uso e quota | Considerar somente depois de medir taxa de abstenção e provar que isso impede uma tarefa relevante; começar por poucas consultas e teto diário |
| Mapbox Geocoding v6 | Geocodificar endereço; endpoints de geocoding e busca de POI são produtos separados | Resultados temporários não podem ser armazenados; persistência requer modo permanente, cartão/contrato e cobrança aplicável | Não adotar como base offline sem orçamento e direito permanente; uma API de geocoding não substitui CNEFE/POI |
| Consulta cadastral comercial (ex.: Serpro) | Atualizar ou confirmar CNPJ já conhecido | Não descobre coordenadas nem a atividade em cada porta; custo corrente não confirmado nesta pesquisa | Avaliar apenas quando fluxo por usuário demonstrar que confirmação cadastral resolve bloqueio; cotar primeiro |
| APIs de places, mapas ou trânsito | POIs, rotas ou condições conforme produto | Custo por chamadas, cobertura/atualização, licenças e limitações de cache | Só prototipar como fallback, registrar fonte e comparar com dados abertos; não dependência central |
| Operadora/medição de banda | Potencial análise de conectividade | Sem contrato ou desenho de medição; consumo, permissão, validade local e dependência | Primeiro conduzir checklist manual e ensaio nativo; não prometer “qualidade da internet” por uma medição pontual |

Preços de API mudam e dependem de SKU/país/volume/contrato. Não fixar custos unitários com base em uma captura de busca. Google documenta cobrança pay-as-you-go e cálculo por request, quotas e billing; sua página lista faixas e uso mensal incluído que podem ser atualizados. Mapbox separa resultado temporário e permanente; seu v6 diz que temporário não pode ser armazenado e que permanente exige meio de pagamento ou contrato. [Google — uso e faturamento](https://developers.google.com/maps/documentation/geocoding/usage-and-billing?hl=en) · [Google — descontos e faixas](https://developers.google.com/maps/billing-and-pricing/faq) · [Mapbox — Geocoding v6 e armazenamento](https://docs.mapbox.com/api/search/geocoding/).

**Custo total por caso** deve incluir: consultas pagas que falham, repetição, operação/monitoramento, download e processamento, validação humana, armazenamento permitido, suporte, tratamento de chave e contingência. Para aquisição: `custo por ciclo resolvido = (infraestrutura + APIs + revisão humana + suporte atribuível) / ciclos assistidos`. Comparar com o mesmo recorte resolvido por fonte aberta e fluxo de abstenção. Cobrar por requisição e ganhar por “caso resolvido” são unidades diferentes.

### Arquitetura de dados que mantém opção de saída

1. Importação versionada em staging com origem, licença, data de referência, coleta, hash, esquema e contagem.
2. Transformação reproduzível em modelo canônico; guardar ausência e precisão, não campos pessoais sem propósito.
3. Associação como objeto auditável: método, identificador de candidato, motivo, distância, nível geográfico e estado (confirmada, plausível, ambígua, abstenção).
4. Teste de schema/deduplicação e amostragem humana antes de publicar nova partição.
5. Publicação atômica, manifesto por bairro/camada e botão/flag de desativação para dados com falha.
6. Contratos de fonte com limites explícitos: taxa, cache, exportação, SLA, atualização, encerramento e migração.

## 8. Monetização, precificação e estratégia de validação

O problema prioritário é descobrir quem sente a dor, qual parte resolve e quando; escolher um preço agora cria precisão falsa. Os preços antigos sugeridos (avulso/pacotes/assinaturas) continuam sendo âncoras de brainstorming, não propostas aprovadas nem resultados de pesquisa.

### Hipóteses de receita para testar em sequência

| Ordem | Modelo | Por que pode ajustar ao comportamento | Pergunta crítica |
|---|---|---|---|
| 1 | Pacote por período de busca (ex.: 30–60 dias) | Moradia pode ser uma necessidade episódica; vários imóveis/visitas num intervalo | Quem paga, quantos imóveis são úteis e se a pessoa volta durante uma única busca? |
| 2 | Serviço assistido de organização | Pode monetizar valor antes de automatizar tudo | Minutos por caso, limite do serviço e como não parecer laudo ou consultoria profissional? |
| 3 | Benefício corporativo/realocação | Pagador pode ser empresa, usuário final ganha orientação | Ciclo de venda, privacidade e integração mínima necessária? |
| 4 | Licença profissional | Uso recorrente possível para equipes | O profissional vê valor sem alterar a independência ou coletar dados dos clientes? |
| 5 | Avulso | Entrada simples em uma análise específica | Uma análise tem valor suficiente ou o valor real é comparar e visitar? |
| 6 | Indicação/parceria | Pode remunerar encaminhamento solicitado | Como revelar remuneração, evitar conflito e atribuir responsabilidade? |
| 7 | Agregados/API institucional | Pode apoiar atualização e contratos B2G/B2B | Há demanda, base legal/licença, escala mínima e governança? |

### Experimento sem cobrança

Após entrevistas, desenhar três ofertas claramente hipotéticas para entrevistas e medir entendimento, objeções e alternativa atual. Não dizer que preço foi validado. Depois, com produto e suporte definidos, um teste de página sem cobrança pode medir intenção qualificada, mas clique não é pagamento. A validação mais forte exige oferta real, preço transparente, política de cancelamento e aprovação jurídica/comercial. Só executar cobrança quando checkout, restituição, suporte, termos, tratamento fiscal e consentimento estiverem prontos; este documento não ativa nada disso.

Estimar por cenário e mostrar variáveis, não uma projeção pontual:

```text
Receita líquida do período = pagamentos liquidados − estornos − taxas de pagamento − tributos aplicáveis
Margem de contribuição = receita líquida − APIs/infra por uso − processamento − revisão humana − suporte variável
CAC = gastos atribuíveis à aquisição / novos pagantes atribuíveis no mesmo período
LTV observado = contribuição acumulada por coorte até a janela observável (sem extrapolar retenção curta)
```

Coletar cotações reais de fornecedor e minutos de operação antes de preencher custos. Não assumir custo de API ou taxa tributária zero. Modelar no mínimo cenário local sem API, cenário com chamadas sob demanda e cenário de revisão assistida. Fixos, aquisição e caixa aparecem separados da margem de contribuição.

## 9. Fraquezas, riscos e sinais de alerta

| Fraqueza atual | Risco para produto | Indicador de alerta | Mitigação e gate |
|---|---|---|---|
| Público não conhecido | Feature set cresce sem tarefa prioritária | Entrevistas só com equipe/amigos; relatos sem episódio | Gate: tarefa recorrente e ação observada em busca real antes de novo dado |
| Cobertura parcial e concentrada | Usuários fora dos bairros recebem pouco valor ou falsa ausência | Abandono por fora da cobertura; associação ambígua | Benefício local-first sem match; mapa de cobertura e UX de abstenção |
| Fontes heterogêneas e antigas | Dados antigos parecem observação atual | Divergências, reclamações ou camadas sem período | Manifesto de dados e validade por fonte; desligamento simples |
| Associação espacial imperfeita | Evidência de rua/setor atribuída a prédio/unidade errada | Correções materiais por tipo de vínculo | Motivo, nível, margem e revisão; não exibir vínculos duvidosos como exatos |
| Muitas funções aumentam carga cognitiva | Tela parece catálogo técnico e obscurece decisão | Tempo sem utilidade, baixa conclusão de visita | Revelação progressiva, prioridade escolhida e grupos de tela coerentes |
| Offline local depende do dispositivo | Limpeza/troca pode perder histórico | Falha de exportação/restauração e chamados | Backup visível, exportação testada e mensagem clara antes de apagar dados |
| OCR reduz digitação, mas erra | Fato incorreto é salvo com aparência oficial | Campo alterado/rejeitado após revisão | Prévia por campo, citação/página, confiança sem probabilidade e confirmação humana |
| Notificações/sensores variam por OS | Experiência inconsistente e promessa vazia | Permissão negada/fila não entregue | Preferir lembrete interno; ensaio em aparelhos e sem rede antes de anunciar |
| API cria lock-in e custos | Custo por uso imprevisível e produto quebra em outage | Crescimento de chamadas, falhas 429, mudança de termos | Adapter, quota, fallback, cache permitido, budget cap, teste de saída |
| Monetização pode comprometer confiança | Pagador/intermediário afeta ordem ou mensagem | Reclamação de viés ou lead sem escolha | Separar receita de evidência; divulgar comissão e manter neutralidade |
| Ausência de governança métrica | Telemetria identifica vida/endereços dos usuários | Eventos com URL, notas, IDs, excesso de retenção | Minimização, escolha, acesso, retenção curta, exclusão e auditoria |
| Lote técnico não prova uso | “1.363 testes” interpretado como validação do mercado | Métricas técnicas aparecem como KPI de valor | Painéis separados: qualidade de software, cobertura de dados, resultado do usuário e negócio |

### Regras para impedir conclusões abusivas

- **Sem ocorrência** significa sem registro conhecido na fonte e período consultados, salvo documentação que permita outra afirmação.
- **Licença/inscrição** não significa obra executada nem situação estrutural boa/ruim.
- **CNPJ ativo** não prova porta aberta ou atividade no endereço; associação precisa de método.
- **CNEFE/censo** não prova funcionamento atual, acesso ou vista do apartamento.
- **Ponto próximo** não prova ruído, segurança, entrega, conforto ou trajeto.
- **Resposta do corretor/condomínio** é relato atribuído, não auditoria independente.
- **Data de emissão do laudo** não é data da última inspeção; registrar datas e autor diferentes.
- **Sinal Wi-Fi** é rede local; Wi‑Fi 5 GHz não é rede móvel 5G. Um teste pontual não é garantia de serviço.
- **Pontuação interna** não é probabilidade, risco técnico, preço justo ou recomendação.

## 10. Roadmap de pesquisa e entrega: 0–30 / 31–60 / 61–90 dias

As janelas começam após decisão de produto e disponibilidade de pessoas. São etapas recomendadas, não compromisso de calendário.

### Dias 0–30 — reduzir incerteza de problema e confiança

- Consolidar ficha de cada camada atualmente mostrada: fonte, data de referência, atualização, escala, correspondência, precisão e fallback.
- Revisar fluxos de início, insuficiência de endereço, custo, pendência e pergunta de visita com 6–8 pessoas em busca ativa. Registrar tarefa e observação, sem publicar percentuais de prevalência.
- Preparar e executar entrevistas propostas (18 consumidores e seis profissionais, se recrutamento/consentimento viáveis); reduzir escopo se recrutamento não produzir perfis variados.
- Criar protocolo offline manual: preparar dois imóveis; ativar modo avião; registrar visita, pergunta, foto opcional e volta ao app; testar exportação/backup em navegador e dispositivo alvo disponível.
- Revisar nomes e confiança da UI para CNEFE, CNPJ, licença, cronologia e custos desconhecidos; incluir estados sem dado/fonte vencida.
- Decidir política de telemetria; manter desligada enquanto finalidade e experiência não forem aprovadas.

**Gate de avanço:** pessoas conseguem explicar qual próxima ação farão e por que; casos de ausência e ambiguidade não geram falsa certeza; artefato de visita sobrevive ao fluxo offline testado.

### Dias 31–60 — testar tarefa principal e dados incrementais

- Conduzir acompanhamento de oito buscas reais por duas semanas, com consentimento e notas minimizadas.
- Prototipar “lacuna → pergunta → resposta/observação → mudança de decisão” sem integrar nova API.
- Reexecutar EDA CNEFE com versão atual confirmada e rastreabilidade; avaliar taxa de correspondência e diversidade de cobertura, sem publicar novos pontos antes da auditoria.
- Fazer amostra de 150 CNPJs geocodificados conforme documento de dados (50 exatos, 50 sem número/ambíguos, 50 por categorias de interesse) apenas com arquivos e finalidade autorizados; codificar desacordo e não publicar endereços individuais.
- Validar licença, calendário e horários GTFS; se falhar, deixar feature em backlog e não extrapolar ruído.
- Testar rótulos, tamanho das telas e hierarquia com informação incompleta e voz ampliada/teclado junto de pessoas.

**Gate de avanço:** evidência melhora uma etapa concreta; categorias e fonte não induzem ação errada; taxa de associação exata, abstenção e trabalho humano são conhecidos na amostra auditada.

### Dias 61–90 — validar modelo econômico sem perder confiança

- Construir três ofertas para entrevistas/landing controlada; declarar caráter hipotético e não cobrar antes de aprovação operacional/jurídica.
- Medir demanda qualificada, retorno durante buscas abertas, minutos de suporte e custo de atualização/ingestão por coorte/piloto.
- Cotar apenas APIs que resolvam falha quantificada; comparar custo por tarefa concluída e validar direito de cache/exportação/encerramento.
- Definir North Star final com resultados de pesquisa; publicar dicionário KPI e dados mínimos, ou manter manual se amostra/instrumentação ainda for pequena.
- Decidir uma aposta principal e congelar demais integrações até ela cumprir critérios.

**Gate para cobrar:** pessoa entende pacote e limites; uso recorrente/episódico está observado; custo variável e suporte medidos; fluxo de restituição, privacidade e atendimento prontos; oferta aprovada por responsável. Sem isso, manter protótipo e pesquisa.

## 11. Critérios mínimos para uma nova feature

Uma proposta entra em implementação apenas quando seu PRD responder:

1. Qual pessoa, em qual etapa e com qual tarefa concreta?
2. Qual evidência indica que essa tarefa existe e qual alternativa resolve hoje?
3. Qual resultado muda no comportamento observado, além de abrir a tela?
4. Quais entradas, saídas, ausências, estados de erro e limites espaciais/temporais?
5. Qual origem, licença, custo de atualização, persistência permitida e fallback?
6. Como a pessoa revisa, corrige, exclui, exporta e continua offline?
7. Qual dano pode surgir de falso positivo, ausência apresentada como zero ou recomendação implícita?
8. Qual métrica/denominador e guardrail determinam seguir, corrigir ou parar?
9. O que deixa de ser feito para abrir capacidade para esta feature?
10. Qual evidência de aceite cobre web/mobile, largura estreita, teclado, texto ampliado e falha da fonte?

Preferir feature flags e camadas que possam ser desligadas. Um dado não entra na interface só por existir em arquivo. Um sinal só vira insight depois de validar cobertura, qualidade, escala, interpretabilidade e ação útil.

## Fontes e artefatos relacionados

### Artefatos locais de produto

- [Pacote de refinamento de 21/10/2026](refinamento-2026-10-21/README.md)
- [Dados públicos, proxies e EDA](refinamento-2026-10-21/01-DADOS-PUBLICOS-E-PROXIES.md)
- [Conectividade, visita e documentos](refinamento-2026-10-21/02-VISITA-CONECTIVIDADE-E-DOCUMENTOS.md)
- [Público, monetização e distribuição](refinamento-2026-10-21/03-PUBLICO-MONETIZACAO-E-DISTRIBUICAO.md)
- [Fraquezas, dependências e plano](refinamento-2026-10-21/04-FRAQUEZAS-DEPENDENCIAS-E-PLANO.md)
- [Backlog executável](refinamento-2026-10-21/05-BACKLOG-EXECUTAVEL.md)
- [Plano de Recife e prompt da operária](../plano-recife/README.md)
- [Prontidão consolidada](../plano-recife/execucoes/PRONTIDAO-2026-10-22-FINAL.md)

### Fontes externas consultadas em 22/10/2026

- [IBGE — Cadastro Nacional de Endereços para Fins Estatísticos](https://www.ibge.gov.br/estatisticas/sociais/habitacao/38734-cadastro-nacional-de-enderecos-para-fins-estatisticos.html)
- [IBGE — dados metodológicos de coordenadas](https://www.ibge.gov.br/singedlab/dados-apoio-rs_populacao-residente.php)
- [IBGE — Base de Faces de Logradouros](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/28971-base-de-faces-de-logradouros-do-brasil.html?=&t=sobre)
- [Receita Federal — dados abertos](https://www.gov.br/receitafederal/dados)
- [Receita Federal — metadados do CNPJ](https://www.gov.br/receitafederal/dados/cnpj-metadados.pdf)
- [Portal de Dados Abertos do Recife — IPTU](https://dados.recife.pe.gov.br/dataset/?tags=iptu)
- [Prefeitura do Recife — padrões de publicação de dados](https://dados.recife.pe.gov.br/base/doc/recife/padroes_de_publicacao_dos_dados_no_portal_de_dados_abertos_do_recife.pdf)
- [GTFS Schedule — especificação](https://gtfs.org/documentation/schedule/reference/)
- [OpenStreetMap — licença e atribuição](https://www.openstreetmap.org/copyright)
- [Nominatim — política de uso](https://operations.osmfoundation.org/policies/nominatim/)
- [ANPD/Ministério — princípios da LGPD](https://www.gov.br/saude/pt-br/acesso-a-informacao/lgpd/principios)
- [Google Maps Platform — faturamento de Geocoding](https://developers.google.com/maps/documentation/geocoding/usage-and-billing?hl=en)
- [Google Maps Platform — tabela e mudanças de preços](https://developers.google.com/maps/billing-and-pricing/faq)
- [Mapbox — Geocoding API v6 e regras de armazenamento](https://docs.mapbox.com/api/search/geocoding/)

Valores, regras de API e dados são temporais. Antes de contratar ou implementar, conferir a documentação, licença e preço vigentes diretamente com a fonte.
