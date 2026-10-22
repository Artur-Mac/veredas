# 02 — Conectividade na visita e histórico de engenharia

**Status: especificação de investigação, sem sensor ou consulta documental implementados nesta rodada.**

## 1. O que significa “Wi‑Fi 5G”

Separar três perguntas na experiência:

1. **Rede móvel:** o celular consegue usar 4G/5G desta operadora neste cômodo?
2. **Wi‑Fi:** existe um roteador acessível, em qual faixa ele está operando e como o sinal varia dentro do apartamento?
3. **Internet fixa:** existe instalação, infraestrutura do prédio e possibilidade de contratar determinado serviço? Isso exige informação do condomínio/operadora; o celular sozinho não certifica disponibilidade comercial.

Wi‑Fi de **5 GHz** não é **5G celular**, e nenhum dos dois, por si só, prova velocidade boa. Sem roteador no imóvel não há sinal Wi‑Fi daquele imóvel para avaliar. Um roteador ligado, mesmo sem conexão externa, permite alguns testes de rádio; medir internet requer um destino alcançável. A rede móvel do visitante pode fornecer esse acesso mesmo quando o apartamento não tem banda larga.

## 2. Matriz de viabilidade

| Situação | O que é possível propor | O que não concluir |
|---|---|---|
| Sem roteador, com SIM e dados móveis | Registrar operadora informada, cômodo, tecnologia reportada e experiência; teste de dados opcional | Qualidade do futuro Wi‑Fi ou de outra operadora |
| Sem roteador e sem dados móveis disponíveis | Roteiro offline; registro manual; leitura de rádio somente se a plataforma entregar | Velocidade, latência ou “sem cobertura” a partir da falta de pacote de dados |
| Roteador ligado, sem internet | No Android, avaliar frequência/RSSI da conexão autorizada; eventual teste local com dois dispositivos | Velocidade da internet contratável |
| Wi‑Fi com internet | Teste opcional registrando Wi‑Fi como transporte e condições | Resultado atribuível ao 5G celular |
| Roteador portátil levado à visita | Experimento controlado de propagação naquela posição/configuração | Desempenho de uma instalação futura diferente |
| Somente mapa de cobertura | Contexto externo por operadora/tecnologia | Sinal garantido naquele andar ou cômodo |

A Anatel descreve mapas como predição sujeita a relevo, construções, altura e ambiente interno. Usá-los como contexto, nunca substituir medição por uma porcentagem de “qualidade do apartamento”. [Anatel — cobertura móvel](https://www.gov.br/anatel/pt-br/dados/qualidade/qualidade-dos-servicos/cobertura-da-telefonia-movel).

### Android nativo

`WifiInfo` oferece frequência em MHz, RSSI em dBm e velocidade do enlace da conexão Wi‑Fi; enlace não é throughput da internet. Campos podem depender de permissões e estado da conexão. Para o experimento, priorizar a rede conectada e não catalogar redes de vizinhos. [Android — WifiInfo](https://developer.android.com/reference/android/net/wifi/WifiInfo).

Varreduras têm permissões, restrições de frequência e possibilidade de retornar resultados antigos. Exigir carimbo da amostra e estado de disponibilidade; não atualizar a hora da tela e fingir nova leitura. [Android — Wi‑Fi scanning](https://developer.android.com/develop/connectivity/wifi/wifi-scan).

O indicador de 5G exibido pode refletir políticas da operadora; `TelephonyDisplayInfo` não representa necessariamente a tecnologia efetivamente em uso. Registrar “tecnologia reportada pelo sistema”; avaliar dual SIM, NSA/SA e transição de rede no ensaio. [Android — TelephonyDisplayInfo](https://developer.android.com/reference/android/telephony/TelephonyDisplayInfo).

### iPhone

Não prometer paridade com Android para diagnóstico Wi‑Fi. `NEHotspotNetwork.fetchCurrent` fornece SSID, BSSID e tipo de segurança sob condições específicas e entitlement; a documentação diz que os outros campos não são preenchidos por essa chamada. Portanto, a existência da propriedade `signalStrength` não autoriza usar seu zero como sinal medido. Não propor APIs privadas ou entitlement de hotspot como atalho para um app imobiliário. [Apple — fetchCurrent](https://developer.apple.com/documentation/networkextension/nehotspotnetwork/fetchcurrent%28completionhandler%3A%29).

Para rede móvel, investigar a API da versão do Expo e testar em aparelho; ausência de informação deve aparecer como indisponibilidade, não virar 4G/5G por suposição. Não foi feito ensaio com iPhone nesta rodada.

### Expo e web do VEREDA

O projeto usa Expo 57 e não possui `expo-network` ou `expo-cellular` no `package.json`. A documentação da mesma versão oferece estado de conexão e geração celular, incluindo 5G, mas não constitui um medidor completo de rádio/throughput. Permissão negada pode resultar em geração desconhecida; operadora não está disponível de forma equivalente em todas as plataformas. [Expo 57 — Network](https://docs.expo.dev/versions/v57.0.0/sdk/network/), [Expo 57 — Cellular](https://docs.expo.dev/versions/v57.0.0/sdk/cellular/).

No navegador, `effectiveType = "4g"` é uma classe estimada de desempenho baseada em latência/downlink, não a identificação do rádio celular. Não usar esse campo para mostrar “você está no 4G”. [MDN — effectiveType](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType).

## 3. MVP recomendado: roteiro de conectividade com origem explícita

Adicionar primeiro uma seção opcional em Visita, com três pontos escolhidos pela pessoa: local de trabalho/estudo, quarto e sala. Outros cômodos podem ser nomeados. Perguntar se há Wi‑Fi instalado e se a observação usa Wi‑Fi, rede móvel ou nenhum acesso.

Para cada observação: cômodo, horário, operadora informada ou origem automática, tecnologia informada/reportada, sucesso/falha/não testado e nota curta. “Não consegui conectar” é experiência registrada, não diagnóstico da causa. O formulário precisa funcionar offline e sem permissão de localização/telefone.

**Perguntas para o corretor/condomínio:** quais operadoras atendem o prédio, como chega a fibra ao apartamento, existe restrição de passagem de cabos, qual a infraestrutura nas áreas de trabalho e há relatos de falta de sinal. Uma resposta continua declarada até receber documento/observação pertinente.

### Contrato proposto para uma futura migração

```ts
type Disponibilidade = 'observado' | 'nao_testado' | 'sem_permissao'
  | 'nao_suportado' | 'sem_rede' | 'erro';
type ObservacaoConectividade = {
  id: string;
  comodo: string;
  observadoEm: string;
  origem: 'pessoa' | 'sistema' | 'teste_ativo';
  transporte: 'wifi' | 'celular' | 'nenhum' | 'desconhecido';
  disponibilidade: Disponibilidade;
  operadora: string | null;
  tecnologiaReportada: string | null;
  frequenciaMHz: number | null;
  rssiDbm: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  latenciaMs: number | null;
  bytesTransferidos: number | null;
  duracaoMs: number | null;
  nota: string;
};
```

Esse contrato é proposta; não foi adicionado ao schema. Antes de implementar: decidir versão/migração aditiva com fixture de caderno antigo. Não registrar SSID/BSSID, IP ou identificadores de SIM por padrão. `null` significa sem resultado; RSSI negativo é válido. Uma falha não produz `0 Mbps`. Cancelamento preserva observações já salvas.

### Experimento técnico e critérios de saída

- Ensaio mínimo: dois Android de fabricantes diferentes e dois iPhones, com versões registradas; aparelho real é obrigatório para afirmar capacidade de rádio. Acrescentar modelos conforme a pesquisa de público.
- Casos: sem SIM, permissão negada, modo avião, Wi‑Fi sem internet, rede móvel com/sem dados, dual SIM e troca de transporte durante a observação.
- Resultado: tabela por aparelho/API/campo com valor ou motivo de indisponibilidade. No iOS não preencher RSSI com dado de API que não o entrega.
- Não concluir “rede ótima” por barras, tecnologia ou uma medida. Comparações devem manter operadora, aparelho, horário, cômodo e método visíveis.
- Teste ativo de velocidade fica em tarefa separada: destino, contrato, custos, privacidade e limite de tráfego definidos antes. Proposta inicial de teto: 10 MB e 15 s por tentativa, com consentimento contextual e cancelamento. Pode subestimar conexões rápidas; nesse caso apresentar apenas resultado limitado, sem selo de qualidade.
- Sem destino autorizado/disponível: “Teste de velocidade não realizado”. Não usar serviços públicos de teste como backend não contratado.

## 4. Última avaliação de engenharia: o que podemos saber

**Conclusão desta pesquisa:** não foi demonstrado um endpoint público, completo e pesquisável por endereço que retorne a última inspeção predial de todos os condomínios do Recife. Isso é limite da pesquisa, não afirmação de inexistência de registros.

Há caminhos oficiais para verificar autenticidade de ART e RRT. O Crea-PE descreve consulta de ART, mas o formulário retornou 403 neste ambiente; o CAU descreve verificação por número e chave, quando aplicável. Essa validação não prova que o laudo apresentado é o mais recente, nem equivale a avaliar as conclusões técnicas. [Crea-PE — ART](https://creape.org.br/art), [CAU — autenticidade](https://transparencia.caubr.gov.br/cartadeservicos1-3/).

| Evidência | O que registra | O que não deve substituir |
|---|---|---|
| Laudo de inspeção predial | Escopo, observações, datas e recomendações daquele trabalho | Avaliação atual universal ou garantia estrutural |
| ART/RRT | Responsabilidade profissional por atividade registrada | Conteúdo do laudo ou prova de execução de toda recomendação |
| Habite-se/aceite-se | Ato administrativo correspondente | Manutenção e inspeção periódica recente |
| AVCB/documento de bombeiros pertinente | Aspectos de proteção contra incêndio dentro do escopo | Diagnóstico estrutural ou inspeção geral |
| Registro de Defesa Civil | Atendimento/ocorrência com abrangência própria | Inspeção de um prédio apenas por estar na mesma rua |
| Informação do síndico/corretor | Declaração de existência/data | Documento recebido e conferido |

O resultado da busca incluiu um **projeto de lei de 2023**, não prova de lei em vigor. A página municipal da Lei 16.292 apresentou falhas de acesso. Não inserir contagem regressiva de inspeção obrigatória ou prazo legal com base nisso. Confirmar norma vigente e sua aplicabilidade antes de qualquer regra automática. [Diário Oficial — publicação do projeto](https://dome.recife.pe.gov.br/upload_dome/DO_149_18_11_2023-assinado.pdf), [base municipal consultada](https://www.legiscidade.recife.pe.gov.br/lei/16292/).

### Feature recomendada: documentos apresentados e pendências

Primeiro resultado útil, mesmo sem API: perguntar “Quando foi realizada a inspeção predial mais recente informada pelo condomínio? Pode compartilhar o laudo, a ART/RRT correspondente e o andamento das recomendações?”. Não exigir que a pessoa envie documentos privados para usar o restante do app.

Estados independentes: `não solicitado`, `solicitado`, `data informada`, `documento recebido`, `autenticidade consultada`, `não foi possível conferir`, `divergência`. Autenticidade se aplica ao documento/registro consultado, não é selo do prédio. Manter histórico sem sobrescrever datas conflitantes.

Separar **data da inspeção**, **emissão do laudo**, **registro ART/RRT**, **consulta da autenticidade**, **recebimento pelo usuário** e **prazo recomendado no próprio documento**. Se só existe a data da ART, o campo “data da inspeção” permanece desconhecido. “Último documento apresentado” é rótulo sustentável; “última inspeção do prédio” exige completude que ainda não temos.

Campos mínimos futuros: tipo, escopo (fachada/estrutura/elétrica/geral/outro), datas opcionais, origem, número do registro se informado, endereço que consta no documento, notas da pessoa e pendências. Armazenamento de arquivos exige decisão própria sobre tamanho, exclusão, backup e privacidade; o MVP pode começar só com metadados locais. Não enviar PDF automaticamente a OCR/LLM.

**Aceite:** data ausente continua ausente; laudo de outra unidade não se associa automaticamente; laudo de fachada não vira estrutural; consulta indisponível não vira registro inválido; ausência de documento não vira condenação do edifício. Para interpretar conclusões ou urgência técnica, o fluxo encaminha a profissional habilitado, sem emitir avaliação pelo aplicativo.
