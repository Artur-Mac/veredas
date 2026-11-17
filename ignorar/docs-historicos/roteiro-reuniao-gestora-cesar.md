# VEREDA — conversa com gestora do CESAR

Preparado em 19/10/2026. Duração sugerida: 35 minutos, ajustável. Base: conversa com a equipe, leitura do protótipo e do código, documentação de pesquisa e regulamento oficial do Campus Mobile. A inspeção do código não equivale a um teste do aplicativo em produção. As estimativas de prazo são da equipe.

## Objetivo da reunião

Obter uma avaliação do valor do projeto, escolher a prioridade do primeiro piloto e definir qual evidência produzir a seguir. Sair com uma prioridade de produto, um experimento e, se possível, uma indicação de pessoa ou organização que ajude a executá-lo.

A gestora pode contribuir com julgamento de produto, público, negócio, validação e articulação. Sua opinião orienta hipóteses; o uso por pessoas procurando moradia fornecerá evidências sobre essas hipóteses.

## Contexto a transmitir

O Vereda é uma proposta de apoio à decisão de moradia: parte de um anúncio já encontrado, organiza informações do imóvel e do entorno e ajuda a pessoa a preparar a visita. A equipe está desenvolvendo o projeto para a 15ª edição do Campus Mobile, em Tecnologias Urbanas. O primeiro recorte é B2C, aluguel no Recife.

Hoje existem pesquisas, análise de dados, provas de conceito e uma experiência navegável. O motor completo ainda não está integrado. A equipe estima entre duas e quatro semanas para uma primeira versão com funções básicas. O recorte considerado inclui custos e valores a confirmar, alagamento, indicadores do entorno e apoio à visita.

Há uma pessoa conhecida que procura imóvel no Recife e tem experiência em tecnologia. Ela pode ser a primeira participante de um teste e, depois, oferecer uma avaliação crítica técnica. Uma única participante inicia o aprendizado, mas não representa todo o público.

O Campus admite ideias em especificação ou implementação. Se selecionado, o projeto segue para a Semana Imersiva de 21 a 26/02/2027; nessa fase, são avaliados execução do protótipo, experiência de uso, articulação e inovação. Na final, a utilização efetiva pelo público passa a integrar explicitamente a avaliação. A apresentação final está prevista até 08/06/2027. Isso pede um plano de testes anterior a junho. [Regulamento, itens 2.4, 3.1, 6.5 e 7.5](https://www.institutoclaro.org.br/campus-mobile/wp-content/uploads/sites/6/2026/08/Regulamento-15a-edicao.pdf).

As inscrições foram prorrogadas para 02/11/2026, segundo [aviso publicado em 19/10/2026](https://www.institutoclaro.org.br/campus-mobile/noticias/campus-mobile-inscricoes-prorrogadas-15a-edicao/). A conversa não pressupõe que a equipe já tenha sido selecionada.

## Cinco pontos fortes observáveis

| Ponto | Base objetiva | Consequência para a conversa |
| --- | --- | --- |
| 1. Momento de uso definido | O fluxo começa depois que a pessoa encontra um anúncio e continua até comparação e visita. | É possível explicar quando alguém usaria o produto sem ensinar uma nova forma de procurar imóveis. |
| 2. Informação ligada a uma ação | Há custos por parcelas, comparação, perguntas ao corretor e roteiro de visita. | O benefício pode ser observado em decisões e perguntas realizadas pelo usuário. |
| 3. Tratamento explícito da origem e das lacunas | O projeto distingue informação declarada, registro, estimativa e informação a confirmar. O protótipo preserva parcelas desconhecidas e limitações do recorte de alagamento. | Existe uma base de produto para construir confiança e orientar verificações. Isso ainda precisa ser testado com usuários. |
| 4. Experiência materializada | O repositório contém protótipo web, telas do app e cinco dossiês preparados. | Já há material para demonstrar a jornada e observar compreensão e navegação. |
| 5. Primeiro teste delimitado e acessível | Recife, aluguel e uma participante em busca ativa já identificada. | A equipe consegue começar uma investigação de uso com um caso real e um território definido. |

Esses pontos descrevem ativos atuais e escolhas de produto. Não comprovam demanda, superioridade sobre concorrentes ou economia efetivamente obtida.

## Cinco pontos fracos observáveis

| Ponto | Base objetiva | Próxima redução de incerteza |
| --- | --- | --- |
| 1. O núcleo automático ainda não está demonstrado de ponta a ponta | O app carrega cinco dossiês estáticos; o fluxo de leitura encaminha links para casos preparados. Isso é consistente com o estágio descrito pela equipe. | Produzir um dossiê verificável para anúncio escolhido por uma pessoa, registrando os passos manuais. |
| 2. O benefício em uma busca real ainda não foi observado | O material disponível registra principalmente relato de problemas e reação ao conceito; o piloto com a pessoa em busca ativa ainda será feito. | Observar descoberta, compreensão e ação após o uso, incluindo situações em que o app não ajudou. |
| 3. A documentação de pesquisa contém divergências | Os relatórios com N=83 divergem em datas, canais e contagens; despesas omitidas aparecem como 70/83 e 71/83. Um resumo cita 65/83 para colaboração, enquanto a tabela detalhada do mesmo documento soma 74/83. | Conferir exportação original, perguntas, filtros e cálculos; consolidar uma versão rastreável. |
| 4. Parte da promessa exige dados mais específicos que os disponíveis | O protótipo usa custos conhecidos e valores a confirmar; registros de alagamento podem ser do bairro. A amplitude de funções aumenta a necessidade de verificar cobertura e precisão. | Definir, por função, o que pode ser informado sobre o imóvel, o que é contexto e o que depende de documento ou confirmação. |
| 5. Canal e monetização ainda são hipóteses | B2C foi escolhido pela facilidade de iniciar testes. Não foram apresentados resultados de aquisição, compra de dossiês ou custo operacional por caso real. | Testar recrutamento fora do círculo próximo e registrar esforço, custo e adesão à oferta após a entrega de valor. |

## Roteiro sugerido — 35 minutos

### 1. Abrir com contexto e pedido — 0 a 3 minutos

“Estamos desenvolvendo o Vereda para o Campus Mobile, na categoria Tecnologias Urbanas. A proposta é ajudar quem já encontrou um imóvel a entender melhor os custos, o entorno e o que precisa verificar antes de fechar. Queremos começar com pessoas procurando aluguel no Recife.

Como você já recebeu o pitch, queríamos aproveitar esta conversa para aprofundar sua leitura do projeto: onde você vê mais valor, o que priorizaria com os recursos que temos e como dar o próximo passo de validação.”

Acrescentar uma frase sobre o Campus como programa de desenvolvimento de soluções móveis, com mentoria e avaliações progressivas. Relacionar a participação ao desenvolvimento do produto e à obtenção de evidências.

### 2. Mostrar a experiência em um único caso — 3 a 8 minutos

“Vamos mostrar a experiência que desenhamos. A pessoa já tem um anúncio que chamou sua atenção. Ela quer saber se cabe no orçamento, como aquele lugar se encaixa na rotina e quais perguntas precisa levar à visita.”

Mostrar apenas três momentos da jornada:

1. Custos conhecidos e itens que ainda precisam de confirmação.
2. Um achado do entorno, com o recorte espacial que a informação realmente permite.
3. A pergunta ou verificação que esse achado gera para a visita.

Encerrar: “Qual parte dessa experiência ficou menos clara? Em que momento você imagina alguém recorrendo a isso?”

Ouvir a interpretação antes de explicar funcionalidades adicionais. Usar a demonstração para permitir julgamento do valor. A demonstração não precisa percorrer todas as telas.

### 3. Explicar o estágio e a capacidade de execução — 8 a 11 minutos

“Hoje temos pesquisas, análise de bases, provas de conceito e a experiência navegável. A integração completa ainda está em desenvolvimento. Estimamos duas a quatro semanas para colocar funções básicas em uso. Estamos considerando custos, informações do entorno e apoio à visita.”

Informar quem executará o piloto, disponibilidade semanal real, recursos de dados e orçamento disponível. Esses detalhes de capacidade ainda precisam ser preenchidos pela equipe; a estimativa de prazo, sozinha, não descreve a infraestrutura.

### 4. Explorar valor e prioridade — 11 a 19 minutos

Pergunta principal: “O que mais chama sua atenção no Vereda como benefício para uma pessoa procurando imóvel? Para quem isso seria mais valioso?”

Depois: “Se você tivesse de escolher uma entrega para as próximas quatro semanas, qual escolheria? O que deixaria para depois?”

Pedir o motivo: “Você escolheria isso pelo tamanho do problema, pela facilidade de chegar ao público ou pela chance de demonstrar resultado?”

Se surgir outra direção, perguntar qual observação a levou a enxergá-la e como testá-la com pouco esforço. Registrar sugestões como hipóteses, com uma justificativa e um teste associado.

### 5. Desenhar validação e acesso ao público — 19 a 27 minutos

“Já temos uma pessoa procurando aluguel no Recife disposta a experimentar. Queremos começar por uma busca real e ampliar para outras pessoas. Como você estruturaria esse piloto para produzir evidências úteis para o produto e para a banca?”

Explorar duas decisões:

- “Que comportamento faria você concluir que houve valor? E qual resultado faria repensar a proposta?”
- “Por qual canal você tentaria encontrar as próximas pessoas em busca ativa, além dos nossos colegas?”

Levar como hipótese de teste: descobrir algo relevante, compreender corretamente a informação e usá-la em uma ação real. Exemplos: pedir um documento, esclarecer uma taxa, preparar a visita, comparar alternativas ou reconsiderar um anúncio. A ação só conta como benefício se decorrer de informação correta e pertinente.

### 6. Abrir caminhos de negócio e articulação — 27 a 32 minutos

“Estamos começando pelo B2C porque conseguimos testar diretamente com quem busca imóvel. Você vê isso também como um caminho de negócio? Ou enxerga uma parceria que facilite chegar a essas pessoas e sustentar a solução?”

Se houver uma alternativa: “Qual seria o primeiro sinal de que vale explorar esse caminho?”

Pedido concreto: “Que pessoa, comunidade ou organização você acha que deveríamos procurar agora, e para resolver qual dúvida?”

Uma possível parceria deve ter um papel claro: acesso a usuários, informação necessária, conhecimento de mercado ou distribuição. A reunião não depende de a gestora ter poder para oferecer apoio institucional do CESAR.

### 7. Fechar com decisões — 32 a 35 minutos

“Do que conversamos, entendemos que vale priorizar [entrega], testar com [perfil] e observar [comportamento]. É essa a sua recomendação? Que risco importante ainda ficou de fora?”

Concluir: “Podemos voltar com os resultados desse teste para ouvir sua leitura?”

Registrar a prioridade, o teste, o responsável, a data interna e eventual contato sugerido.

## Proposta de próximo passo para levar à reunião

Minha recomendação é testar a jornada de um anúncio real até uma pergunta útil na visita. O primeiro recorte pode combinar custos conhecidos e pendências com uma informação do entorno que tenha fonte e escala adequadas. O apoio à visita organiza a ação que vem depois.

Começar com a pessoa já identificada, que trará um ou dois anúncios da própria busca. Antes de mostrar o Vereda, registrar o que ela já sabe, o que pretende perguntar e qual seria seu próximo passo. Depois, observar o uso com pouca intervenção. Fazer a conversa de crítica técnica após a experiência de usuária, para preservar o registro das dificuldades espontâneas.

Se a integração ainda estiver incompleta, preparar parte do dossiê manualmente, com dados conferidos, explicando como ele foi produzido. Esse procedimento testa o valor da informação e da experiência; ainda será necessário testar automação, cobertura, precisão e esforço operacional.

Como rodada exploratória, tentar repetir com mais quatro a sete pessoas procurando aluguel, incluindo participantes fora da tecnologia e dos amigos próximos. Esse número é uma proposta de trabalho, sem pretensão de representar o mercado ou garantir validação.

Para cada caso, registrar:

- anúncio, tarefa e momento da busca;
- informação nova e fonte conferida;
- interpretação do usuário, inclusive confusões;
- ação realizada depois do uso e como foi confirmada;
- necessidade de ajuda, tempo de preparo e trabalho manual;
- retorno para analisar outro anúncio durante a busca;
- mudança feita no produto após o teste.

A banca poderá receber evidências organizadas como hipótese → teste → resultado → mudança no produto. Usar contagens com denominador e relatos de casos, deixando clara a abrangência do teste. Pagamento, continuidade de uso e expansão geográfica são questões posteriores que precisarão de evidência própria.

## Preparação antes da conversa

Levar a demo no ponto inicial, uma página com estágio atual e próximos passos e uma síntese de pesquisa conferida. A equipe deve conseguir distinguir experiência desenhada, prova de conceito realizada e funcionalidade integrada. Reservar mais da metade do encontro para escutar e discutir.

Antes de citar percentuais de pesquisa, conferir os documentos originais. Não tive acesso, nesta revisão, à exportação original das respostas. As divergências nos relatórios não permitem concluir qual valor está correto. Números usados para encenar impacto no vídeo também não devem ser apresentados como resultados medidos do piloto.

Evitar generalizações sobre a intenção de todos os corretores ou portais. A conversa pode ser centrada na informação que falta à pessoa e no trabalho necessário para reuni-la. Explicar termos como proxy e código cadastral apenas se ajudarem uma decisão; no primeiro caso, basta dizer “um indicador do entorno, que não descreve necessariamente aquele apartamento”.

## Base da avaliação interna

- `src/dados/dossies.ts`: cinco dossiês importados de arquivos preparados.
- `src/app/ler.tsx`: encaminhamento dos links para casos existentes e progressão visual de leitura.
- `index.html`, funções `getDossierFinance`, `openDossierFlood` e fluxo de visita: parcelas conhecidas, pendências, recorte de alagamento e perguntas.
- `docs/PESQUISA_QUANTITATIVA_UFPE_83.md` e `docs/PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md`: formulação das perguntas, resultados declarados e divergências citadas.
- `docs/ENTREVISTAS_QUALITATIVAS_5_CASOS.md`: síntese de entrevistas, sem verificação independente das gravações.
- `docs/VEREDA_DOCUMENTO_DEFINITIVO.md`: desenho da proposta e hipóteses comerciais. As notas atribuídas ao projeto nesse documento são avaliações internas, não resultados da banca.
- Conversa com a equipe: motor ainda em integração, previsão de duas a quatro semanas, recorte inicial de aluguel no Recife e participante em busca ativa.
