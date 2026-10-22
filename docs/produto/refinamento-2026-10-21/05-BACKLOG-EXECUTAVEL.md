# 05 — Backlog executável para a próxima decisão

**Não é uma ordem para executar todo o pacote.** Implementado nesta rodada: R00. EDA executada: parte investigativa de R01. Os demais itens aguardam seleção; não equivalem ao lote B da auditoria anterior.

## Regras para a IA executora

Ler README do repositório, instruções aplicáveis e registro do lote A. Inspecionar estado atual antes de editar e registrar: comportamento observado, arquivo, alteração e aceite. Preservar mudanças concorrentes, `index.html` raiz, pitch e motion. Não transportar fatos demonstrativos para o app. O protótipo continua referência exclusiva de identidade/interface.

Escopo local permitido depende do item explicitamente escolhido. Não contratar API, criar backend, ativar pagamento, enviar mensagens/convites, publicar ou migrar dados destrutivamente por inferência. Se um desses atos for necessário, preparar resultado concreto para decisão; continuar partes independentes. Datas, origem, ausência versus zero e leitura do caderno antigo são contratos comuns.

## R00 — Atribuição na mensagem ao corretor — CONCLUÍDO

**Problema confirmado:** `mensagemParaCorretor` encerrava com “Obrigado!”, sem identificação do produto. A gaveta já aceitava edição, cópia, compartilhamento e restauração.

**Alteração:** fecho comum “Obrigado!\n\nMensagem preparada com o VEREDA.” para texto com ou sem perguntas. Nenhum link novo. Arquivo: `src/dados/mensagem.ts`.

**Aceite executado:** sugestões com/sem pendências incluem assinatura; seis perguntas continuam sendo seis; cópia inicial contém marca; editar remove o texto se a pessoa escolher; cópia/WhatsApp respeitam o texto editado; restauração repõe a sugestão. Testes em `tests/mensagem.test.ts` e `tests/visita.test.ts`. Não houve envio real.

## R01 — Precisão espacial acompanhando a evidência — P0

**Esforço proposto:** 1–3 dias, mais revisão de casos. **Entrada:** EDA deste pacote, CNEFE minimizado e fixtures existentes.

**Estado confirmado:** `NV_GEO_COORD` está no cache, mas não sai em `lerEnderecoDoCnefe`. A EDA foi executada; não houve mudança no geocodificador de produção.

**Arquivos candidatos:** `scripts/dados/rua/nucleo.mjs`, `scripts/dados/rua/camadas.mjs`, `tests/rua-nucleo.test.ts`, `tests/rua-indice.test.ts`; `src/dados/contratos.ts` somente se informação chegar ao bundle.

**Passos:** conservar nível em objeto intermediário; inventariar todos os consumidores; separar método de associação textual de qualidade da coordenada; definir política de elegibilidade por camada; comparar antes/depois por bairro. O novo cálculo de pontos próximos deve nascer separado, sem modificar por efeito colateral a resolução dos prédios.

**Aceite:** fixtures para níveis 1–6 e ausente; coordenada de setor nunca produz distância precisa; empate por endereço continua ambíguo; resultado determinístico; não entram nome/complemento no cache. Mostrar diferenças de contagem explicadas, não apenas testes verdes. Nenhum percentual de score apresentado como probabilidade.

**Dependência:** confirmar dicionário da versão exata usada antes de publicar interpretação. Entrega inicial pode ser só metadado/relatório; se alterar contrato persistido, exigir migração aditiva testada.

## R02 — Data e escala compreensíveis em A Rua — P0

**Esforço:** 1–2 dias. **Entrada:** fontes do `meta.json` e valores já derivados. **Arquivos candidatos:** componentes de A Rua localizados por busca no código, `src/dados/recife/indice.ts`, testes de tela existentes. Não regenerar bases sem necessidade.

**Passos:** listar cada informação apresentada e associar escala (ponto, raio, rua, setor) e referência temporal. Garantir que fonte de 2022 não aparente medição atual. Distinguir período dos pedidos 156 do dia de geração do índice. Reaproveitar rótulos/componentes existentes.

**Aceite:** fixture de setor mostra contexto do setor; ocorrência de rua não aparece como do prédio; fonte com data ausente não recebe “hoje”; zero real e camada indisponível têm textos diferentes. Teste com nome longo e conteúdo incompleto. Inspeção de capturas em 375×812, 1280×900, 360 px e fonte 200%, mais teclado.

## R03 — Registro de inspeção informada e documentos — P1

**Esforço:** 2–4 dias para metadados locais, sem upload. **Entrada:** estados e datas definidos no documento 02. **Arquivos candidatos:** `src/dados/contratos.ts`, derivação de perguntas em `src/dados/dossie/`, componentes de Visita, persistência e testes correspondentes.

**Passos:** aprovar esquema aditivo; permitir registrar data informada, origem e tipo/escopo; incluir pergunta quando falta informação, sem duplicar pergunta própria; separar registro profissional e laudo; manter histórico de divergência. Título inicial “Documentos apresentados”.

**Aceite:** análise antiga abre sem preenchimento fabricado; data da ART não preenche inspeção; laudo de fachada não se rotula estrutural; ausência/consulta indisponível não gera “irregular”; falha ao salvar preserva estado recuperável e avisa. Compartilhamento só inclui texto escolhido. Nenhum OCR externo.

**Fora do item:** diagnóstico de engenharia, prazo legal automático, armazenamento remoto e API de inspeções ainda não demonstrada.

## R04 — Roteiro manual de conectividade offline — P1

**Esforço:** 2–3 dias. **Entrada:** teste de compreensão do vocabulário móvel/Wi‑Fi com participantes. **Arquivos candidatos:** contratos, `src/componentes/visita-v1/NoImovel.tsx`, `useVisita.ts`, `Resumo.tsx`, `logica.ts`, testes de visita/persistência.

**Passos:** adicionar observações opcionais por cômodo; informar transporte e origem manual; sem Wi‑Fi instalado, oferecer registro móvel ou “não testado”; copiar perguntas sobre infraestrutura; atualizar resumo sem nota de qualidade.

**Aceite:** funciona em modo offline e sem permissões; Wi‑Fi 5 GHz não aparece como 5G; valores técnicos permanecem ausentes; falha de conexão não gera 0 Mbps; editar/cancelar não perde notas anteriores; caderno antigo permanece legível. Executar testes de migração e revisar visualmente as telas alteradas.

## R05 — Experimento de capacidades nativas — P1, dependente de aparelhos

**Esforço:** 2–4 dias de desenvolvimento mais agenda de campo. **Entrada:** R04, aparelhos reais, permissão dos participantes. **Arquivos candidatos:** pasta de experimento isolada e documentação; dependências do app somente após decisão.

**Passos:** experimentar estado da rede/geração com Expo 57; no Android, investigar RSSI/frequência da rede conectada; no iOS, registrar honestamente campos indisponíveis. Definir adaptador com resultado e motivo de indisponibilidade. Limpar listeners ao sair. Nenhuma varredura contínua em segundo plano.

**Aceite:** matriz por aparelho e versão; sem SIM, sem dados, permissão negada, Wi‑Fi sem internet, troca de rede e dual SIM; timestamp real da amostra; não salvar identificadores de rede por padrão. Emulador comprova fluxo, não rádio. Sem aparelhos: entregar spike de código e marcar validação de campo pendente.

**Não incluído:** speed test. Endpoint, orçamento de tráfego, termos e consentimento formam decisão separada.

## R06 — Experimento CNPJ + endereço — P1, pesquisa antes de interface

**Esforço:** 3–5 dias, variável com volume. **Entrada:** competência da Receita, tabelas de municípios/CNAE e política de minimização.

**Arquivos candidatos:** `scripts/dados/` em módulo novo, evidências deste pacote em subpasta nova; não relaxar lista proibida do IPTU. Não acoplar CNPJ à chave da análise pessoal.

**Passos:** seguir pipeline do documento 01; validar encoding e leiaute; preservar identificadores alfanuméricos; resolver município; normalizar endereço; manter ambiguidade; gerar relatório agregado; auditar amostra estratificada de 150 casos.

**Aceite:** filial com múltiplos CNAEs não duplica por categoria; CNPJ alfanumérico sobrevive; sem número não recebe coordenada exata; nenhum CPF/telefone/sócio aparece nos artefatos; cobertura e acerto separados; relatório não afirma atividade atual. Incluir falsos positivos de escritório virtual e CNAE secundário.

**Condição para produto:** licença/origem registradas, qualidade auditada e evidência de utilidade. Se não cumprir, não publicar lista de “fontes de barulho”.

## R07 — Experimento de transporte por horário — P2

**Esforço:** 3–5 dias. **Entrada:** feed diretamente obtido, licença de uso identificada, vigência e área. Sem isso entregar diagnóstico de disponibilidade, não integração funcional.

**Passos:** validar tabelas/IDs; recortar Recife com margem; calcular serviço para data e faixa de horário; usar shapes quando existentes e rotular geometria aproximada; separar ônibus de outros modos; relacionar distância ao centro/portão informado.

**Aceite:** dia útil/feriado, exceção de serviço, horário 25:10, frequência sem horário exato, feed expirado, duas paradas da mesma viagem e ausência de shape. Nenhuma variável de ruído, combustível ou fachada inferida automaticamente. Contagens programadas com método explícito.

## R08 — Descoberta de público — P0

**Esforço:** quatro semanas de calendário; 30–45 h de trabalho previstas. **Entrada:** responsável, recrutamento autorizado, roteiro do documento 03.

**Entregáveis:** critérios de seleção, 18 entrevistas de consumidores e seis de profissionais identificadas por código, oito acompanhamentos, matriz de episódios/alternativas, decisões e evidência contrária. Se a amostra não for completada, informar números reais.

**Aceite:** distinguir fala/comportamento/interpretação; não inventar persona a partir dos dados cadastrais; segmentar aluguel/compra/mudança; anotar abandonos. Saída é escolha justificada do primeiro público ou decisão de continuar pesquisando.

## R09 — Oferta e custo por busca — P1 após R08

**Esforço:** 1–2 semanas para preparar e observar, conforme recrutamento. **Entrada:** segmento escolhido e custos medidos em casos reais ou claramente simulados.

**Entregáveis:** duas ofertas alternativas, unidade de valor, limites, política do histórico, cálculo de contribuição e plano de experimento. Teste de intenção pode ocorrer sem checkout; não chamar intenção de receita.

**Aceite:** custo de suporte/reprocessamento incluído; preços hipotéticos identificados; nenhum pacote anterior perde dados; oferta descreve conteúdo e cobertura; cobrança/conciliação/reembolso só implementados após aprovação específica. Nenhum gateway contratado por este item de pesquisa.

## R10 — Acessibilidade do cabeçalho e navegação — P1

**Esforço:** 1–2 dias. **Entrada:** capturas e limitações do lote A; reproduzir na versão corrente antes de corrigir. **Arquivos:** localizar cabeçalho/dock e alterar somente responsáveis pelo problema.

**Aceite:** em 360 px e texto 200%, marca/créditos e rótulos não se sobrepõem nem ocultam ações; teclado tem ordem/foco visível; tela com nome longo e informação incompleta continua operável. Examinar imagens antes/depois. Não basta o smoke terminar. Rodar verificações do projeto proporcionais à alteração e registrar ambiente real utilizado.

## Encerramento de cada item selecionado

Registrar decisão, arquivos, testes, saída e limitações em arquivo novo. Testes devem cobrir risco ou comportamento, não repetir implementação. Mudança de tela exige inspeção visual; capacidade nativa exige aparelho para ser declarada validada. Executar `npm run verificar` e smoke local ao concluir um lote funcional selecionado; documentar exatamente qualquer ambiente que faltou. Não avançar automaticamente para outros itens.
