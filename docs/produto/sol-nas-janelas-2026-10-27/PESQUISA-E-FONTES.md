# Pesquisa e fontes — Sol nas suas janelas

Pesquisa realizada em **27/10/2026**, para orientar a implementação no repositório VEREDA. Este documento distingue observação do código, consulta documental, amostra de dados e decisões de projeto. Não é uma validação de precisão da funcionalidade atual.

Leia o [prompt completo](./PROMPT-IMPLEMENTACAO.md) para executar a implementação.

## Decisão recomendada

Construir a experiência em torno de **uma janela por vez**, com direção capturada na visita, data e controle de horário. Começar com SVG; acrescentar uma maquete 2,5D de câmera fixa quando as geometrias do entorno forem suficientes. A comparação mais útil inicialmente é a influência de um vizinho na mesma janela. Comparar apartamentos exige registros das janelas dos dois imóveis.

Essa direção visual é uma decisão de produto para este pedido, não uma exigência de biblioteca ou de fonte científica. Ela reduz controles simultâneos e aproveita a infraestrutura gráfica já instalada.

## O que o repositório realmente oferece

Inspeção local feita durante esta pesquisa; revalidar antes de implementar porque havia alterações em andamento.

| Evidência observada | Consequência para a implementação |
| --- | --- |
| Expo 57, `expo-location` e `react-native-svg` já instalados | Captura nativa e ilustração não exigem começar uma infraestrutura nova |
| `Orientacao.tsx` usa direção informada e já foi conectado a `solESombra.ts` | Integrar o fluxo existente; não criar uma ferramenta isolada |
| `ao-vivo.tsx` utiliza `watchHeadingAsync` | Há uma referência interna para o adaptador de sensor, ainda precisando avaliar calibração, ciclo de vida e norte verdadeiro |
| `visita.orientacaoGraus` é um único campo | Várias janelas exigem evolução do contrato, migração e revisão da persistência |
| `Edificio.poligono` é explicitamente um lote simplificado, limitado a 24 vértices | Não é a planta da torre; é inadequado extrudi-lo como volume real para explicar a sombra |
| O índice de edifícios inclui endereços com pelo menos duas unidades residenciais | Ele não é um catálogo completo de obstáculos urbanos |
| `pavimentos` vem do cadastro de lotes, com filtros de coerência | Não é altura medida nem posição da janela |
| O motor solar atual usa declinação fixa por estação, equinócio para durações, 3,1 m por pavimento e altura intermediária quando falta andar | É uma aproximação inicial, que precisa de revisão antes de sustentar conclusões sobre a unidade |
| Obstrução usa direção ao centro e aberturas angulares predefinidas | A largura/forma real dos vizinhos não está sendo usada para interseção do raio |
| `sombraPorMetro` tem alcance limitado a 3 e ignora elevação ≤ 2° | Um artifício visual não pode se tornar uma regra física do modelo |
| A cena 2,5D projeta os lotes e o motor mistura mensagens de sol e brisa | Corrigir a geometria, reduzir o escopo visível e retirar garantias sem modelo adequado |

Esses achados são do código lido, não resultados de testes executados. Não houve mudança no código do aplicativo nesta tarefa de preparação do prompt.

## Arsenal técnico escolhido

| Necessidade | Escolha recomendada | Razão e limite |
| --- | --- | --- |
| Direção durante a visita | Adaptador nativo com `expo-location`; alternativa manual no web | Reaproveita dependência; suporte e qualidade devem ser comprovados em aparelho |
| Sol em uma data/hora | SunCalc 2.x encapsulado e versão fixada | Cálculo local; atenção à mudança de convenções em relação à v1 |
| Referência independente | NOAA para equações/conferência; SPA como referência técnica adicional | Nenhuma API externa é necessária em cada uso |
| Desenho | `react-native-svg` existente, planta/maquete fixa | A interface não precisa de uma engine 3D para explicar sombras |
| Obstáculos | Camadas municipais de edificações e pavimentos, após validação | Não usar lote como torre nem pressupor cobertura/altura |
| Interseções | Motor puro em coordenadas métricas, separado do renderer | Permite testes físicos e o mesmo resultado em web/nativo |
| Dados no dispositivo | Recorte geográfico preparado e cacheado | Evita carregar a cidade inteira durante uma visita |
| Comparação | Mesma janela com/sem obstáculo; duas janelas registradas | Mantém hipóteses e condições visíveis |

Não foi escolhida uma biblioteca adicional de geometria: primeiro medir a complexidade da amostra e aproveitar o que já existe. Se for necessária, a IA deve verificar API, licença, compatibilidade e custo de bundle antes de adicioná-la. Não instalar simultaneamente várias bibliotecas de mapa/renderização para resolver o mesmo problema.

## Fontes primárias verificadas

### F1 — Prefeitura do Recife: Área urbana

[Catálogo oficial](https://dados.recife.pe.gov.br/dataset/area-urbana).

O catálogo distingue recursos de Lotes, Edificações–Lotes, Edificações–Pavimentos e Edificações 3D. Publica licença ODbL. Isso comprova a existência dos recursos, não a precisão de cada volume nem sua atualização física em 2026. A preparação deve preservar atribuição e metadados nos padrões do projeto.

### F2 — Edificações–Lotes

[Página do recurso](https://dados.recife.pe.gov.br/dataset/area-urbana/resource/76280b81-d3d3-4719-b686-8adb58e57b7f) · [GeoJSON publicado](https://dados.recife.pe.gov.br/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/76280b81-d3d3-4719-b686-8adb58e57b7f/download/edificacoes-lotes.geojson).

ID: `76280b81-d3d3-4719-b686-8adb58e57b7f`. O portal informa 80,3 MiB e atualização em 02/03/2026. A API retornou 84.208.543 bytes.

Foram lidos os primeiros 16.384 bytes do arquivo. A amostra contém `FeatureCollection`, referência `CRS84`, geometrias `MultiPolygon` e propriedades `DSQFL` e `NMENDCOMP`. **Na primeira feição observada, DSQFL contém um endereço em vez da chave cadastral esperada.** Na seguinte aparece uma chave numérica. Portanto, a associação por DSQFL precisa de validação e checagem espacial; não pode confiar cegamente em todas as linhas. Nenhuma altura apareceu nas propriedades das primeiras feições inspecionadas.

A amostra não determina cobertura de bairros, integridade global ou quais componentes de cada lote representam torres/embasamentos.

### F3 — Edificações–Pavimentos

[Página do recurso](https://dados.recife.pe.gov.br/dataset/area-urbana/resource/319077bd-4ec7-4e06-8544-c36a5077b47a) · [GeoJSON publicado](https://dados.recife.pe.gov.br/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/319077bd-4ec7-4e06-8544-c36a5077b47a/download/edificacoes-pavimentos.geojson).

ID: `319077bd-4ec7-4e06-8544-c36a5077b47a`. O portal informa 164,3 MiB, atualização em 02/03/2026; API: 172.368.434 bytes.

Também foram lidos 16.384 bytes. A amostra contém `CRS84`, `MultiPolygon`, coordenadas bidimensionais e os campos `OBJECTID`, `DSQFL`, `LAYER`, `OBSERVACOE`, `PAVIMENTO`, `QTAREA_TIPO`. Nas feições iniciais, `LAYER` tem o valor `1_Pavimento` e `PAVIMENTO` vale 1. Um mesmo DSQFL reaparece em geometrias distintas.

Isso não demonstra que contar registros resulte no total de andares nem que exista cota altimétrica. A IA deve confirmar semântica e amostrar edificações altas antes de usar o atributo para gerar volumes. Manter componentes múltiplos, furos e relações espaciais relevantes.

### F4 — Edificações 3D

[Página do recurso](https://dados.recife.pe.gov.br/dataset/area-urbana/resource/b014a450-1e3d-4515-9d30-d5a21fe392b9) · [ZIP publicado](https://dados.recife.pe.gov.br/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/b014a450-1e3d-4515-9d30-d5a21fe392b9/download/edificacoes-3d.zip).

ID: `b014a450-1e3d-4515-9d30-d5a21fe392b9`. Portal: 93 MiB e atualização em 02/03/2026; API: 97.595.760 bytes.

**Somente metadados consultados. ZIP não baixado nem inspecionado.** Formato interno, sistema de cotas, textura, extensão territorial e qualidade ainda precisam ser verificados. Não há evidência para prometer importar esse arquivo diretamente no app. É uma fonte candidata para preparação de volumes, não uma dependência obrigatória da primeira experiência.

### F5 — SunCalc: implementação e licença

[Repositório/documentação do autor](https://github.com/mourner/suncalc) · [Notas de versões](https://github.com/mourner/suncalc/releases).

Biblioteca JavaScript sem dependências, BSD-2-Clause, com posição solar por instante e localização. A documentação corrente usa `getPosition(date, lat, lng)`.

As notas da versão 2 registram mudanças incompatíveis: ângulos em graus; azimute horário a partir do norte; elevação aparente com refração; distribuição ESM com alternativas de bundle; tipos TypeScript. A v1 usa convenções diferentes. **Não copiar a fórmula de conversão de um tutorial antigo sem verificar a versão.** Fixar a versão instalada e testar o adaptador e os instantes locais/UTC. A pesquisa consultou a documentação e releases, não instalou a biblioteca.

### F6 — NOAA: equações e limites

[Equações solares](https://gml.noaa.gov/grad/solcalc/solareqns.PDF) · [Detalhes do cálculo](https://gml.noaa.gov/grad/solcalc/calcdetails.html).

O material descreve declinação, equação do tempo e conversão entre hora civil e solar. Serve para fundamentar os casos de teste e detectar simplificações do motor atual. A página informa que a calculadora deixou de ser mantida; portanto, não adotá-la como serviço de produção nem como única evidência de precisão. Distinguir refração e convenções ao comparar resultados.

### F7 — SPA: referência técnica independente

[Relatório NREL/TP-560-34302](https://docs.nrel.gov/docs/fy08osti/34302.pdf) · [Página do algoritmo](https://midcdmz.nlr.gov/spa/).

Referência publicada de posição solar e incidência em superfície. Usar para casos externos de verificação, com entradas e convenções documentadas. Não importar automaticamente código da distribuição C: verificar os termos aplicáveis antes de redistribuir uma implementação. Esta pesquisa localizou a referência; não executou SPA nem produziu fixtures numéricas.

### F8 — Expo 57: localização e bússola

[Documentação da versão usada no projeto](https://docs.expo.dev/versions/v57.0.0/sdk/location/).

Consultar `watchHeadingAsync` e `LocationHeadingObject`. A documentação distingue rumo verdadeiro, magnético e nível de calibração; `trueHeading` pode ser inválido. O campo de deslocamento do GPS não substitui bússola. A API de assinatura documentada é nativa; não presumir paridade web. Compatibilidade consultada documentalmente, sem teste físico nesta pesquisa.

### F9 — Orientação no navegador

[Especificação W3C](https://www.w3.org/TR/orientation-event/) · [Documentação Apple](https://developer.apple.com/documentation/webkitjs/deviceorientationevent).

A especificação trata referência absoluta/relativa, orientação do aparelho, contexto seguro e permissões. É necessário detectar o suporte concreto do navegador. O texto do W3C consultado é um Candidate Recommendation Draft; não implica implementação uniforme. O caminho manual deve estar disponível independentemente do sensor.

### F10 — Sol, proteção e aquecimento

[PNNL / Building America: Shading and Solar Control for Windows and Skylights](https://basc.pnnl.gov/resource-guides/shading-and-solar-control-windows-and-skylights).

Explica a relação entre radiação direta, ganho de calor pelo vidro, proteções e carga de resfriamento, distinguindo luz direta e difusa. Sustenta uma orientação qualitativa de visita. Não fornece um coeficiente universal para converter “oeste” em temperatura, reais ou consumo. Os exemplos de orientação e estação de latitudes dos Estados Unidos não devem ser transferidos automaticamente para Recife.

### F11 — SVG no stack atual

[Documentação Expo 57 para react-native-svg](https://docs.expo.dev/versions/v57.0.0/sdk/svg/).

Referência de integração da biblioteca vetorial que o aplicativo já utiliza. A recomendação de câmera fixa, poucos vizinhos, cores contidas e um controle por vez é a direção de produto desta pesquisa.

### F12 — Interações acessíveis

[W3C: alternativas ao arraste](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) · [React Native: acessibilidade](https://reactnative.dev/docs/accessibility).

Fundamentam alternativas por toque/teclado, semântica e leitura por tecnologias assistivas. Conferir a documentação correspondente ao React Native 0.86 antes de implementar APIs. Os gráficos precisam de equivalente textual; o horário não pode depender exclusivamente de um arraste preciso.

### F13 — Google Solar API: por que não é a primeira escolha

[Visão geral oficial](https://developers.google.com/maps/documentation/solar/overview).

O serviço é voltado à avaliação solar de telhados. As camadas incluem dados de superfície e sombras que poderiam apoiar uma investigação específica, mas o produto não resolve automaticamente direção, posição e exposição de uma janela de apartamento. Não há necessidade de torná-lo dependência desta entrega. Cobertura local e custos não foram auditados.

## Próxima investigação: pequena e decisiva

Antes de habilitar sombra personalizada para usuários, selecionar uma amostra de cenários nos dados municipais: torre isolada, duas torres próximas, edifício com embasamento, vários volumes no mesmo lote e prédio sem altura. Preparar um recorte e registrar:

1. Se há footprint construído e correspondência inequívoca com o imóvel.
2. Se a geometria conserva recuos, furos e componentes.
3. Se a origem do número de pavimentos/altura é interpretável e coerente.
4. Se os obstáculos não residenciais próximos também aparecem.
5. Que hipótese de altura e posição foi adotada, e quanto ela muda o resultado.

Só então escolher a representação dos volumes. Quando a evidência não alcançar esse nível, a experiência de orientação + percurso solar continua utilizável. É melhor um resultado explícito de exposição potencial do que uma sombra precisa em aparência e errada na geometria.

## Registro de acesso e limites da pesquisa

- Consultadas as páginas oficiais listadas e os arquivos locais indicados no prompt.
- Acesso às URLs da API CKAN pelo navegador de pesquisa falhou; consulta posterior por HTTPS retornou os três metadados com sucesso.
- Lidos prefixos de 16 KiB dos dois GeoJSONs por requisição limitada; não houve download integral, análise estatística de cobertura nem inspeção visual dos footprints.
- O ZIP 3D não foi baixado. Não foram testados sensores, permissões reais, cálculos novos ou desempenho de simulação.
- A antiga página de Sustainability Victoria sobre ganho de calor redirecionou para um aviso de encerramento do órgão; foi substituída, nesta pesquisa, pela referência PNNL acima.
- A skill local `ui-ux-pro-max` foi consultada. A busca genérica por divulgação progressiva não trouxe correspondência específica; a direção de simplicidade foi definida a partir do pedido do usuário. Buscas focadas em alternativas ao arraste e acessibilidade React Native retornaram orientações pertinentes.

Os documentos oferecem uma especificação executável e caminhos de validação. Não atestam que os dados municipais sejam suficientes para todas as janelas do Recife.

## Atualização após implementação

Na etapa posterior, os dois GeoJSONs foram lidos integralmente e geraram os recortes locais da funcionalidade. O estado atual, as validações, as revisões visuais e os limites de cobertura estão em [Implementação e revisão](./IMPLEMENTACAO-E-REVISAO.md). As observações acima sobre acesso por prefixos descrevem o momento original desta pesquisa.
