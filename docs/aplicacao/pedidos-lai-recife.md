# Pedidos de acesso à informação (LAI) para o VEREDA, Recife

Arquivo consolidado em 15/11/2026 e revisado após consulta ao [Hub de Dados do Recife](https://hubdedados.recife.pe.gov.br/visualizacoes/), para enviar manualmente. São **17 pedidos**: 11 à Prefeitura do Recife, 5 ao Estado de Pernambuco e 1 ao CNJ. Cada um diz o órgão, o canal, o texto pronto para colar, o que destrava no app e o teste a fazer com a resposta. Nenhum foi enviado. Os achados, limites e ideias adicionais estão em [pesquisa-hub-dados-recife-2026-11-15.md](pesquisa-hub-dados-recife-2026-11-15.md).

**Regras que valem para todos:**
- **Só dados agregados ou de imóveis, nunca de pessoas.** Os textos já dizem "não solicito dados pessoais". Não acrescente nomes de terceiros.
- **Seus dados ficam com você.** O formulário pede seu nome e CPF. Preencha no site do órgão. **Não cole CPF, senha nem número de protocolo com senha neste chat.**
- **Guarde o protocolo** na tabela de acompanhamento no fim deste arquivo.
- **Peça sempre formato aberto** (CSV ou XLSX), dicionário de dados e licença de reutilização. Os textos já incluem isso.
- **Ao receber,** salve o arquivo em `docs/dados/raw/lai-<órgão>-<data>/` e me passe o caminho. O teste de cada resposta está descrito no pedido.

## Canais e prazos

| Esfera | Canal | Login | Base legal | Prazos |
|---|---|---|---|---|
| Prefeitura do Recife (secretarias, autarquias, EMLURB, CTTU) | **e-SAI**, no Portal da Transparência: <https://transparencia.recife.pe.gov.br/codigos/web/lai/pedidoInformacaoForm.php> | Não há conta. O formulário pede nome e CPF e devolve uma senha de acompanhamento. Você escolhe o órgão numa lista. | Lei 12.527/2011; Lei Municipal 17.866/2013; Decreto 28.527/2015 | Resposta em 20 dias, prorrogáveis por 10. Recurso em 10 dias, respondido em 5. |
| Estado de Pernambuco (SDS, APAC, Compesa, CPRH) | **Ouve.PE**: <https://ouve.pe.gov.br>, em "Acesso à Informação" → "Informações Públicas" (também em <https://www.lai.pe.gov.br/>) | Conta Ouve.PE (CPF e senha) ou gov.br | Lei 12.527/2011; Lei Estadual 14.804/2012 | Resposta em 20 + 10 dias. Recurso em 10 dias (decisão em 5); depois, Comitê de Acesso à Informação (15 dias). Gratuito. |
| CNJ (Poder Judiciário) | Serviço de Informação ao Cidadão do CNJ. **Confirme o canal no site do CNJ.** O CNJ não fica no Fala.BR, que é do Executivo federal. | Conforme o canal | Lei 12.527/2011 | 20 + 10 dias |

Se o órgão indicado não aparecer na lista do e-SAI, escolha a secretaria mais próxima e escreva no fim do texto: "Caso este órgão não seja o competente, peço o encaminhamento ao setor responsável, nos termos do art. 11, §1º, III, da Lei 12.527/2011."

## Ordem sugerida

| Ordem | Pedido | Órgão | Por que antes |
|---|---|---|---|
| 1 | P01 Interdições por alagamento | CTTU | Transforma o desvio "se bloquear" em fato datado no bloco de chuva, que já está no app. |
| 2 | P03 Atendimentos 2025 e vistorias de edificações | Defesa Civil (SEDEC/SEOPS) | O livro de alagamento parou em 2024; e a estrutura não tem nenhum caso ligado a prédio. |
| 3 | P12 Roubo a transeunte por bairro | SDS-PE | A planilha pública de CVP traz data, município, região e total; faltam natureza e bairro. |
| 4 | P07 ITBI: valor declarado e sequencial | Secretaria de Finanças | Separa "avaliação fiscal" de "valor declarado" sem custo de cartório. |
| 5 | P02 COP: nota técnica e pluviômetros | COP | Atualiza o histórico com maio de 2026 e resolve o fuso da chuva. |
| 6 | P04 Drenagem executada e catálogo | EMLURB | Destrava o histórico de intervenções (A12) e explica os pontos e trechos do eSIG. |
| 7–16 | demais | — | Na ordem do arquivo. |

---

# Prefeitura do Recife (e-SAI)

## P01 · CTTU: interdições e desvios por alagamento

**Destrava:** no bloco "Se a rua alagar", o desvio passa de cenário ("se um alagamento bloquear a passagem a pé") para fato ("a calçada da Av. X foi interditada de … a …").

**Texto para colar:**
> Solicito, em formato aberto (CSV ou XLSX), a relação das interdições e desvios de tráfego motivados por alagamento no Recife entre 01/01/2022 e a data da resposta. Para cada interdição, peço:
> 1. o logradouro e o trecho afetado (entre quais cruzamentos ou números), com o bairro;
> 2. a data e a hora de início da interdição;
> 3. a data e a hora de fim da interdição;
> 4. a data e a hora da reabertura total, se forem diferentes do fim;
> 5. o modo afetado: veículos, ônibus, ciclistas ou pedestres (calçada), e se a interdição foi total ou parcial;
> 6. a origem do registro (equipe em campo, câmera, COP ou chamado);
> 7. o identificador da ocorrência, se houver.
>
> Se algum desses campos não for registrado de forma estruturada, peço que a resposta informe qual. Peço também o dicionário de dados e a licença de reutilização. Não solicito dados pessoais.

**Teste com a resposta:**
- Ligar cada trecho à rede de caminhada e conferir 10 deles no mapa.
- Cruzar com a Defesa Civil na mesma rua e data.
- Só trecho com modo pedestre ou interdição total vira fato de calçada.
- Trecho só com veículos vira "interditada para veículos em DD/MM".

## P02 · COP (Centro de Operações do Recife): evento de 1 a 3/05/2026 e pluviômetros

**Órgão no e-SAI:** o COP não aparece na lista. Envie à Secretaria de Infraestrutura (ou à SEOPS) e peça o encaminhamento ao COP.

**Destrava:** o histórico de alagamento com 2026, e a chuva medida como contexto de cada registro, com estação e hora.

**Fonte já vista:** o [painel meteorológico do Hub](https://hubdedados.recife.pe.gov.br/cards-visualizacao/centro-de-operacoes/) aponta para um dashboard do COP; na consulta de 15/11/2026, o dashboard retornou `Invalid redirect_uri`. Isso não prova inexistência dos dados. O pedido continua focado na série histórica, na lista do evento e na definição dos campos.

**Texto para colar:**
> Solicito, com encaminhamento ao Centro de Operações do Recife (COP), se necessário:
> 1. a nota técnica, o relatório ou o boletim consolidado sobre as chuvas de 1 a 3 de maio de 2026;
> 2. a lista dos pontos e logradouros com alagamento registrados pelo COP nesse período, com bairro, data e hora de início e de fim da lâmina d'água, e a fonte de cada registro (câmera, sensor, equipe ou chamado);
> 3. a série dos pluviômetros do COP de 01/03/2026 a 31/05/2026, com código da estação, data e hora de cada registro, e o fuso horário usado nos campos DATAHORA e IDUNICO do serviço BASE_SENSORES_PLUVIOMETRICOS_RECIFE. No arquivo publicado, consultado em 14/11/2026, o IDUNICO fica três horas à frente de DATAHORA em 7.807 de 7.808 registros;
> 4. o motivo de o serviço público de pluviômetros terminar em 26/02/2026.
>
> Peço os dados em formato aberto e a licença de reutilização. Não solicito dados pessoais.

**Teste com a resposta:**
- Com o fuso confirmado, alinhar a chuva por hora com a data dos registros e mostrar "N mm em [estação], a X km" atrás de "Ver o registro".
- Comparar os pontos do evento com os 54 pontos e os 552 trechos do eSIG.

## P03 · Defesa Civil (SEDEC/SEOPS): atendimentos de 2025 e vistorias de edificações

**Destrava:**
- **Alagamento:** o livro ganha 2025; o arquivo aberto de 2025 tem só o cabeçalho e uma linha.
- **Estrutura:** os primeiros casos de vistoria, interdição e desinterdição ligados a um prédio.

**Checagem do portal:** os três recursos chamados “Atendimentos 2025” no [conjunto da Defesa Civil](https://dados.recife.pe.gov.br/dataset/registro-de-atendimentos-da-defesa-civil) retornaram um registro cada na API pública em 15/11/2026. O conjunto [Dados Vivos Recife](https://dados.recife.pe.gov.br/dataset/demandas-dos-cidadaos-e-servicos-dados-vivos-recife) também oferece solicitações e vistorias do dia, mas se declara restrito ao dia da consulta; não substitui o histórico.

**Texto para colar:**
> Solicito, em formato aberto (CSV ou XLSX):
> 1. os registros de atendimentos da Defesa Civil do Recife de 01/01/2025 até a data da resposta, com os mesmos campos dos arquivos publicados de 2021 a 2024 no portal de dados abertos (Regional, Ano, Mês, Data, Ocorrência, Solicitação, Endereço, Bairro, Localidade, Grau de Risco, Data da Ação, Tipo da Ação). O arquivo "defesa-civil-2025" publicado no portal contém só o cabeçalho e uma linha; peço também a previsão de atualização;
> 2. a relação de vistorias, interdições e desinterdições de **edificações multifamiliares** (prédios e condomínios) de 2014 até a data da resposta, com: endereço do edifício (logradouro e número), bairro, nome do edifício quando houver, data da vistoria, tipo de ação (vistoria, interdição total ou parcial, desinterdição), grau de risco atribuído, número do processo ou ofício e se há laudo técnico com ART/RRT no processo.
>
> Não solicito dados pessoais de moradores. Peço que endereços de residências unifamiliares sejam omitidos ou agregados por bairro, para proteger os moradores. Peço também o dicionário de dados e a licença de reutilização.

**Teste com a resposta:**
- **Item 1:** entra no livro de alagamento pelo fluxo normal (`rodar-chuva.mjs`), com a regra de vínculo atual: tipo de via divergente fica fora.
- **Item 2:**
  - cada edifício é ligado ao lote (DSQFL) pelo endereço; ambíguos ficam fora e são contados;
  - os atos entram na linha do tempo (`src/dados/estrutura/linhaDoTempo.ts`);
  - o dossiê mostra só "último ato documentado … isso não confirma a condição atual".

## P04 · EMLURB: drenagem executada, limpeza e catálogo de alagamento

**Destrava:** o histórico de intervenções de drenagem (aplicação A12, adiada até haver fonte datada), e a explicação do que significam os pontos, polígonos e trechos do eSIG que o app já usa.

**Fonte já disponível:** a [camada PAINEL_MACRODRENAGEM_2026](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Hosted/PAINEL_MACRODRENAGEM_2026/FeatureServer/0) expõe `program`, `statu_limp` e `data`: 514 trechos, 236 com `program = CONCLUÍDO`, todos esses com data não vazia, em consulta de 15/11/2026. Três datas dos concluídos são de 2025. A coleta local anterior omitiu esses campos. A data e o status precisam de definição oficial antes de virarem afirmação de execução no app.

**Texto para colar:**
> Solicito à EMLURB, em formato aberto (CSV, XLSX ou camada geográfica):
> 1. as obras e serviços de drenagem executados no Recife de 2018 até a data da resposta, com logradouro e trecho (ou geometria), tipo de intervenção (micro ou macrodrenagem, galeria, canal, boca de lobo), data de início e data de conclusão;
> 2. sobre a camada pública PAINEL_MACRODRENAGEM_2026 do eSIG, o significado operacional dos campos `program`, `statu_limp` e `data`; se `data` registra execução, conclusão, atualização ou outro marco; a explicação das datas de 2025 em uma camada de 2026; e a relação de execuções de limpeza de canais e galerias não cobertas pela camada, com data e trecho;
> 3. sobre as camadas do eSIG "pontos_alagamento_arcgis", "Poligonos_Alagamentos_2026" e "Logradouros_Alagamentos_2026":
>    - a metodologia e o critério de inclusão de cada camada;
>    - o período e os eventos em que se baseiam;
>    - o significado do campo "precisao";
>    - por que os campos "recorrencia", "mare" e "lamina" estão vazios;
>    - a relação com os 159 pontos críticos do Plano de Contingência 2026;
>    - a licença de reutilização das camadas.
>
> Não solicito dados pessoais.

**Teste com a resposta:**
- **Item 1:** cada obra é ligada à rua da rede e o app mostra "obra de drenagem concluída em MM/AAAA nesta rua", ao lado dos registros de alagamento, sem dizer que a obra resolveu.
- **Item 3:** o texto "lista de ruas de alagamento da Prefeitura" ganha o critério oficial; sem critério, continua sem interpretação.

## P05 · Secretaria de Política Urbana e Licenciamento (SEPUL): histórico de licenças e habite-se

**Destrava:** a observação de obras e mudanças de vista (aplicação A19, adiada): saber se uma obra perto do prédio foi protocolada, aprovada, venceu, está ativa ou recebeu habite-se.

**Fonte já disponível:** o [CSV de Licenciamento Urbanístico](https://dados.recife.pe.gov.br/dataset/licenciamento-urbanistico) já publica número do processo, endereço, DSQFL, situação atual e colunas de data de entrada, conclusão, emissão e validade da licença. O [painel do Hub](https://hubdedados.recife.pe.gov.br/cards-visualizacao/licenciamento-municipal/) mostra recortes e situações, com última atualização exibida em 22/07/2026. Verificar preenchimento e semântica das datas antes de usá-las; o histórico de cada mudança de situação ainda não foi identificado.

**Texto para colar:**
> Solicito, em formato aberto, para os processos de licenciamento urbanístico (construção, acréscimo, demolição e habite-se) de 2015 até a data da resposta:
> 1. para os processos identificados pelo número e DSQFL já publicados no conjunto “Licenciamento Urbanístico”, o histórico de situações com data de cada mudança: protocolado, em análise, aprovado, alvará emitido, alvará vencido, obra iniciada se registrada, habite-se emitido, indeferido ou arquivado;
> 2. a definição e a regra de preenchimento das colunas públicas `data_entrada`, `data_conclusao`, `data_emissao_licenca` e `data_validade_licenca`, incluindo se algum tipo de processo não é coberto pelo conjunto;
> 3. o número de pavimentos e a área aprovados, quando houver.
>
> O conjunto “Licenciamento Urbanístico” já traz a situação atual e as quatro colunas de data citadas, mas não identifiquei nele a sequência completa de mudanças de situação. Peço também o dicionário de dados e a licença. Não solicito dados pessoais de requerentes.

**Teste com a resposta:** o processo é ligado ao lote pelo DSQFL. O dossiê mostra a linha do tempo da obra vizinha ("aprovada em …, alvará vencido em …"), e "Desde que você guardou" passa a avisar mudança de situação.

## P06 · Controle Urbano (SECON/SEOPS): interdições e embargos de edificações

**Destrava:** a estrutura (atos ligados ao lote) e as obras irregulares perto do imóvel.

**Texto para colar:**
> Solicito, em formato aberto, a relação de autos de interdição, embargo e desinterdição de **edificações e obras** lavrados pelo Controle Urbano de 2018 até a data da resposta, com: endereço da edificação ou obra (logradouro e número) e DSQFL quando houver, bairro, data do auto, tipo (interdição, embargo, desinterdição), motivo resumido (risco estrutural, obra sem licença, outro) e número do processo.
>
> Não solicito dados pessoais de proprietários ou responsáveis. Peço que imóveis unifamiliares sejam agregados por bairro.

**Teste com a resposta:** o mesmo vínculo ao lote do P03. Interdição sem desinterdição posterior vira "falta o documento de liberação", sem afirmar o estado atual. Também é possível pedir pelo serviço 1095 (certidão narrativa) um lote específico; isso precisa de login e leva 15 dias.

## P07 · Secretaria de Finanças: ITBI com valor declarado e identificador da unidade

**Destrava:** a pergunta de preço. Hoje o app só pode dizer "avaliação fiscal do ITBI", porque o arquivo aberto não traz o valor declarado nem um identificador estável e pseudonimizado da unidade. O [painel ITBI — Pesquisa do Hub](https://hubdedados.recife.pe.gov.br/cards-visualizacao/itbi-transmissao/) exibe endereço, complemento, data e valor de avaliação por registro, mas não o valor declarado; a última atualização exibida foi 06/10/2026.

**Texto para colar:**
> Sobre o conjunto "Imposto sobre Transmissão de Bens Imóveis (ITBI)" do portal de dados abertos do Recife, solicito:
> 1. a inclusão ou o envio, em formato aberto, do **valor declarado da transação** (informado pelo contribuinte) ao lado do valor de avaliação, para as transmissões de 2020 até a data da resposta. Peço também que se informe qual dos dois é a base de cálculo do imposto em cada caso;
> 2. o campo **sequencial do imóvel (criptografado)**, que consta no dicionário de dados do conjunto mas não aparece nos arquivos CSV publicados de 2015, 2025 e 2026;
> 3. o significado e a unidade do campo "sfh";
> 4. a natureza da transmissão (compra e venda, doação, permuta, arrematação, integralização), se registrada.
>
> Não solicito dados pessoais de contribuintes; o sequencial pode permanecer criptografado.

**Teste com a resposta:**
- Comparar, por prédio, a mediana do valor declarado com a da avaliação; o app passa a ter "valor declarado no ITBI" com rótulo próprio, que continua não sendo "preço registrado".
- O sequencial criptografado permite ligar transmissões da mesma unidade ao longo do tempo sem expor a unidade.

## P08 · Secretaria de Meio Ambiente (confirme a sigla na lista do e-SAI): Censo Arbóreo

**Destrava:** o piloto de sombra. Hoje a copa e a altura estão preenchidas em 4% das árvores, e a maior parte do cadastro é de 2007.

**Texto para colar:**
> Sobre o conjunto "Censo Arbóreo" (recurso "Censo Arbóreo - 2023") do portal de dados abertos, solicito:
> 1. a data de levantamento de cada registro e o significado do campo "origem" (ARB2007, Inventario, Aplicativo, Arborizacao);
> 2. as medidas de copa (diâmetro ou raio, com a unidade) e altura disponíveis em levantamentos mais recentes que os publicados, em especial nos bairros das Graças, Espinheiro, Aflitos e Derby;
> 3. a relação de árvores **removidas ou erradicadas** desde 2007, com coordenada ou identificador do censo e data, para retirar do cadastro as que não existem mais. Os arquivos de "Podas e extrações" trazem só endereço textual;
> 4. a previsão de atualização do censo.
>
> Não solicito dados pessoais (nem nomes de requerentes nem usuários de edição).

**Teste com a resposta:** rodar `scripts/dados/sol/sombra-piloto-gracas-espinheiro.mjs` com as copas medidas e as remoções aplicadas. Se uma comparação ficar robusta e a observação de campo confirmar, a rota entra no dossiê.

## P09 · Secretaria de Infraestrutura ou CTTU: calçadas, rampas e travessias

**Destrava:** a caminhada com menos dificuldade (aplicação A09: só motor, sem dado verificado de calçada).

**Fonte adicional encontrada:** [“Calçadas — 2023”](https://dados.recife.pe.gov.br/dataset/calcadas) tem 129 registros na API pública, mas os campos efetivos são contrato, obra, RPA, trecho, bairro, situação e extensão em metros. A descrição do conjunto menciona largura, estado e manutenção, que não aparecem como colunas desse recurso. A base não resolve sozinha a largura útil da rede caminhável.

O arquivo público de [calçadas das vias principais](https://dados.recife.pe.gov.br/dataset/calcadas-dos-corredores-de-transporte-metropolitano) foi baixado: tem 159 linhas e o campo `largura_ambos_lados`. Também foi baixado o arquivo de calçadas recuperadas de 2019, com 40 linhas e campos de datas e situação. Nenhum dos dois comprova largura útil contínua e estado atual por trecho.

**Texto para colar:**
> Solicito, em formato aberto ou camada geográfica:
> 1. o cadastro de calçadas do Recife com largura útil, material e estado, por trecho de logradouro, onde existir. “Calçadas dos corredores de transporte metropolitano” cobre só vias principais, e “Calçadas — 2023” publica contrato, obra, trecho, situação e extensão, sem as colunas de largura útil, material ou estado prometidas na descrição;
> 2. a localização das rampas de acessibilidade e das faixas de pedestres implantadas, com data de implantação;
> 3. sobre os semáforos com dispositivo sonoro (conjunto "Localização dos semáforos"), a situação de funcionamento atual e a data da última manutenção.
>
> Não solicito dados pessoais.

**Teste com a resposta:** os trechos com largura e rampa verificadas permitem dizer "este trecho tem rampa e calçada de X m (cadastro de AAAA)". Sem continuidade verificada ao longo da rota, o app não chama o caminho de "acessível".

## P10 · Iluminação pública (EMLURB; confirme o órgão na lista do e-SAI): funcionamento e atendimento

**Destrava:** "Voltando à noite". Hoje o app lista lâmpadas instaladas e pedidos de "lâmpada apagada" no 156, mas não sabe se a lâmpada funciona.

**Fonte já disponível:** o [histórico do 156](https://dados.recife.pe.gov.br/dataset/central-de-atendimento-de-servicos-da-emlurb-156) publica serviço, logradouro, número, bairro, `DATA_DEMANDA`, `SITUACAO` e `DATA_ULT_SITUACAO`. O [painel EMLURB do Hub](https://hubdedados.recife.pe.gov.br/cards-visualizacao/emlurb/) permite filtrar chamados por rua, número, grupo e situação; exibe janeiro de 2024 a setembro de 2025 e última atualização em 18/11/2025. “Atendida” e data da última situação não comprovam, sem definição e vínculo ao ponto, que a luminária funcione hoje.

**Divergência encontrada na coleta de 15/11/2026:** dois recursos públicos com o mesmo título de 2025 têm 86.966 e 114.653 linhas, respectivamente (`06872af2-9350-4c34-aa39-6337a1822ff7` e `e40fc8b9-49b7-4f08-8b9f-60ba6ed35519`). Não somar essas versões sem esclarecimento.

**Texto para colar:**
> Solicito, em formato aberto:
> 1. para os pontos de iluminação pública do Recife, a situação de funcionamento registrada e a data da última manutenção ou troca, com o identificador do ponto usado no conjunto de iluminação publicado no portal;
> 2. para as solicitações de “lâmpada apagada” do 156 desde 2024, o significado de `SITUACAO` e `DATA_ULT_SITUACAO` já publicados, a data de execução ou conclusão efetiva quando diferente da última mudança de situação, e o identificador que permita vincular o chamado ao ponto de iluminação. Se houver registros não cobertos pelo histórico público, peço também esses registros e seu período de cobertura.
> 3. qual dos dois recursos publicados de 2025 (`06872af2-9350-4c34-aa39-6337a1822ff7` e `e40fc8b9-49b7-4f08-8b9f-60ba6ed35519`) é a versão correta ou mais completa, suas datas de referência e a razão da diferença entre os totais.
>
> Não solicito dados pessoais de solicitantes.

**Teste com a resposta:** o caminho à noite ganha "N pontos no trajeto, M com troca registrada nos últimos 12 meses; pedidos atendidos em média em X dias", sem linguagem de segurança.

## P11 · Secretaria de Meio Ambiente: licenças de som (LUSE) e denúncias de ruído

**Destrava:** "De que lado vem o barulho". Hoje o app mostra a LUSE válida a até 150 m, mas não os horários nem as denúncias.

**Texto para colar:**
> Solicito, em formato aberto:
> 1. para as Licenças de Utilização Sonora (LUSE) vigentes, o endereço, os dias e horários autorizados e a validade;
> 2. a contagem mensal de denúncias de poluição sonora por logradouro, de 2023 até a data da resposta, com o tipo de fonte quando registrado e o resultado da fiscalização (autuado, sem constatação, outro).
>
> Não solicito dados pessoais de denunciantes ou denunciados.

**Teste com a resposta:** "LUSE a 90 m, autorizada sexta e sábado até 2h" passa a sugerir o horário da visita. Denúncias entram como contagem por rua e período, nunca como medida de decibéis.

---

# Estado de Pernambuco (Ouve.PE)

## P12 · SDS-PE (GGACE): roubo a transeunte por bairro do Recife

**Destrava:** a pergunta de segurança, em linguagem de ocorrências registradas. O painel público só mostra o total do município.

**Texto para colar:**
> Solicito à Secretaria de Defesa Social, Gerência Geral de Análise Criminal e Estatística (GGACE), em formato aberto (CSV ou XLSX):
> 1. a contagem mensal de ocorrências de **Roubo a Transeunte** (natureza do grupo CVP) no município do Recife, por **bairro do fato**, de janeiro de 2014 até o último mês consolidado;
> 2. apenas estes campos: ano, mês, bairro, natureza e quantidade;
> 3. a lista de bairros usada e sua correspondência com os 94 bairros oficiais do Recife;
> 4. a quantidade mensal de ocorrências do Recife sem bairro informado ou com bairro não identificado;
> 5. o dicionário de dados, a regra de consolidação (data de extração, prazo de revisão) e a regra de supressão de células com contagens baixas, se houver;
> 6. a data da extração do Infopol.
>
> Não solicito dados pessoais nem registros individuais, somente contagens agregadas.

**Teste com a resposta:**
- A soma dos bairros mais os "sem bairro" de 2025 tem de fechar com **10.230** (±0,5%, conforme o painel público).
- O vínculo aos bairros oficiais é exato; nomes sem correspondência são contados, nunca aproximados.
- Célula suprimida = "não divulgado", nunca zero.
- Exibição: "N ocorrências registradas de roubo a pessoa na rua em [bairro], [período] (SDS-PE; nem todo roubo é registrado)".

## P13 · APAC: série horária de chuva das estações do Recife

**Destrava:** a chuva como contexto datado de cada registro de alagamento. Os boletins diários não trazem a janela horária; a APAC também oferece consultas e arquivos históricos, cuja cobertura, qualidade e formato ainda precisam ser conferidos para esta finalidade.

**Antes do envio:** a [página de acesso a dados da APAC](http://monitoramento.apac.pe.gov.br:8031/modelos/Modelo_dados/informacoes_sobre_os_dados.html) descreve consulta histórica convencional, consulta de estações automáticas (horária ou a cada 15 minutos quando chove) e arquivos meteorológicos. Informa observação convencional às 9h locais. Conferir primeiro cobertura, estações do Recife, formato, falhas e fuso; pedir só lacunas remanescentes. A consulta convencional diária não equivale automaticamente à série horária solicitada.

**Consulta adicional:** o [serviço de monitoramento APAC](https://geoportal.apac.pe.gov.br/server/rest/services/met_monitoramento_chuvas_pe/MapServer/0) fornece acumulados recentes; uma consulta por município retornou 20 feições do Recife, guardadas em [GeoJSON](apac-chuva-recife-2026-11-15.geojson). Há leitura anterior ao dia da consulta e valores `-1`; seu significado, fuso, licença e cobertura histórica não foram confirmados. O retrato não substitui a série solicitada.

**Texto para colar:**
> Solicito à Agência Pernambucana de Águas e Clima (APAC), em formato aberto:
> 1. a série de precipitação das estações localizadas no município do Recife, de 01/01/2014 até a data da resposta, com código e nome da estação, coordenadas, data e hora de cada leitura (indicando o fuso), intervalo de acumulação e marcação de falha ou ausência de leitura;
> 2. a janela horária (de que hora a que hora) a que se refere o total diário dos Boletins Pluviométricos publicados no site da APAC;
> 3. a licença de reutilização desses dados.
> 4. o significado de valores negativos como `-1`, a indicação de leitura desatualizada e o fuso no serviço público `met_monitoramento_chuvas_pe`.
>
> Não solicito dados pessoais.

**Teste com a resposta:** para cada registro datado da Defesa Civil, a chuva do dia na estação mais próxima, com a distância. Falha de leitura aparece como "sem leitura", nunca como zero.

## P14 · Compesa: interrupções de abastecimento por setor

**Canal:** a Compesa é empresa estatal de Pernambuco e está sujeita à LAI. **Confirme** se ela aparece no Ouve.PE ou se tem SIC próprio no site.

**Destrava:** a pergunta "falta água?". Hoje só existe o calendário programado; não há histórico de interrupções.

**Texto para colar:**
> Solicito à Compesa, em formato aberto:
> 1. o registro das interrupções de abastecimento de água no Recife de 2022 até a data da resposta, por setor de abastecimento, com data e hora de início e de fim, tipo (programada ou imprevista) e motivo resumido;
> 2. o mapa ou a lista dos setores de abastecimento do Recife com os bairros ou logradouros de cada setor;
> 3. o regime de abastecimento (rodízio) vigente por setor.
>
> Não solicito dados pessoais nem dados de ligações individuais.

**Teste com a resposta:** liga o lote ao setor, conferindo prédios na borda entre setores. O app mostra "N interrupções imprevistas em 2025 no setor, média de X h", ao lado da pergunta de visita sobre cisterna e bomba.

## P15 · Grande Recife Consórcio de Transporte: viagens realizadas e chegadas observadas

**Canal:** consórcio público. **Confirme** o canal de LAI no site do Grande Recife; se não houver, use o Ouve.PE.

**Destrava:** a confiabilidade do ônibus. Hoje o app mostra só a oferta programada (GTFS).

**Texto para colar:**
> Solicito, em formato aberto:
> 1. para as linhas que atendem o Recife, as viagens programadas e as viagens realizadas por dia, de 2025 até a data da resposta;
> 2. os horários de passagem observados por parada (dados de localização dos veículos, AVL), em amostra de pelo menos um mês recente, com identificador da parada compatível com o GTFS publicado;
> 3. a licença de reutilização desses dados.
>
> Não solicito dados pessoais de usuários ou operadores.

**Teste com a resposta:** comparar o horário programado com o observado nas paradas dos conjuntos G-TRANSIT. O app só mostra "espera real" se a amostra cobrir o horário e a parada.

## P16 · CPRH: áreas contaminadas

**Destrava:** a pista sobre usos antigos do terreno, para conferir quando o lote tem processo de área contaminada.

**Texto para colar:**
> Solicito à Agência Estadual de Meio Ambiente (CPRH), em formato aberto ou camada geográfica, a relação das áreas contaminadas ou sob investigação no município do Recife, com: localização (polígono ou coordenadas e endereço), fase (suspeita, investigação, remediação, reabilitada ou encerrada), data da última atualização e número do processo.
>
> Não solicito dados pessoais.

**Teste com a resposta:** cruzar com os lotes. A interseção vira "há processo de área contaminada neste lote (fase, data): consulte o processo", nunca um diagnóstico.

---

# CNJ (Poder Judiciário)

## P17 · CNJ: o serviço de informação de negócios imobiliários (Provimento 195)

**Canal:** Serviço de Informação ao Cidadão do CNJ. **Confirme o canal no site do CNJ.**

**Destrava:** o "preço registrado" em escala, sem comprar certidão por certidão.

**Texto para colar:**
> Sobre o art. 343-J, inciso V e §1º, do Código Nacional de Normas (redação do Provimento CNJ nº 195/2025), que trata da "informação eletrônica sobre negócios do mercado imobiliário" (data, preço, fração, tipo de ato, matrícula e endereço, excluídos dados pessoais), solicito:
> 1. se o serviço já está em funcionamento, desde quando e por qual plataforma (ONR/SAEC);
> 2. quais Registros de Imóveis do município do Recife já disponibilizam essas informações;
> 3. o custo por informação praticado e a forma de pedido;
> 4. se existem estatísticas agregadas de transações por município formadas com os atos enviados ao ONR (art. 5º do Provimento 195) e onde são publicadas.
>
> Não solicito dados pessoais.

**Teste com a resposta:** se o serviço funcionar no Recife, pedir uma pequena amostra de transações num prédio coberto e aplicar o protocolo de [6-preco/README.md](execucoes/moradia-2026-11-15/6-preco/README.md): vínculo à unidade, exclusão de permuta e leilão, e rótulo "preço registrado na matrícula".

---

## Acompanhamento

Preencha à mão. **Não guarde aqui a senha de acompanhamento**: a senha fica com você, fora deste arquivo e fora do chat.

| Pedido | Órgão | Enviado em | Protocolo | Prazo (20 dias) | Prorrogado até | Resposta em | Resultado | Recurso |
|---|---|---|---|---|---|---|---|---|
| P01 | CTTU | | | | | | | |
| P02 | COP (via Infraestrutura/SEOPS) | | | | | | | |
| P03 | Defesa Civil | | | | | | | |
| P04 | EMLURB | | | | | | | |
| P05 | SEPUL | | | | | | | |
| P06 | Controle Urbano | | | | | | | |
| P07 | Finanças (ITBI) | | | | | | | |
| P08 | Meio Ambiente (censo arbóreo) | | | | | | | |
| P09 | Infraestrutura/CTTU (calçadas) | | | | | | | |
| P10 | Iluminação pública | | | | | | | |
| P11 | Meio Ambiente (LUSE e ruído) | | | | | | | |
| P12 | SDS-PE | | | | | | | |
| P13 | APAC | | | | | | | |
| P14 | Compesa | | | | | | | |
| P15 | Grande Recife Consórcio | | | | | | | |
| P16 | CPRH | | | | | | | |
| P17 | CNJ | | | | | | | |

**Se a resposta negar ou vier incompleta:** o recurso vai em até 10 dias. Peça que a negativa cite o artigo da LAI que a fundamenta (arts. 22 a 24 ou 31). Se o motivo for dado pessoal, proponha a agregação, por bairro e por mês.

As minutas detalhadas do P01/P02 e do P12 continuam em [pedido-cop-cttu.md](execucoes/moradia-2026-11-15/1-alagamento/pedido-cop-cttu.md) e [pedido-sds-roubo-a-transeunte.md](execucoes/moradia-2026-11-15/4-seguranca/pedido-sds-roubo-a-transeunte.md). O texto daqui é o mesmo, para envio direto.
