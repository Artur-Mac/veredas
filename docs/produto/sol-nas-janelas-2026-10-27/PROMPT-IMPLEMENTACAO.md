# Prompt de implementação — Sol nas suas janelas

Implemente a funcionalidade **Sol nas suas janelas** no VEREDA. Leia este documento inteiro e o arquivo `PESQUISA-E-FONTES.md` nesta mesma pasta antes de alterar código. O objetivo é entregar uma experiência funcional, simples e bonita para quem visita um imóvel no Recife: registrar para onde uma janela está voltada, explorar o sol ao longo do dia e do ano e, quando houver dados suficientes, entender a interferência dos prédios vizinhos.

O usuário quer entender uma janela, não operar um software de engenharia. A profundidade técnica fica no motor e nos testes. A tela responde: **“Quando esta janela pode receber sol, o que pode fazer sombra e o que vale observar na visita?”**

## 1. Direção de produto e limites de escopo

Entregue o fluxo principal completo, com persistência, sensores nativos, alternativa manual, cálculo solar por data e integração ao dossiê. Desenvolva também o suporte ao entorno e a comparação contextual descritos abaixo; habilite os resultados conforme a disponibilidade e qualidade dos dados. A ausência de uma base externa não deve impedir o uso da janela e do percurso solar.

Não transforme esta entrega em um dashboard. Não acrescente meteorologia, vento, umidade, ruído, ranking de imóveis, pontuação de conforto, realidade aumentada, câmera ao vivo ou previsão da conta de luz. Não crie assinatura, serviço pago ou backend novo para calcular a posição do Sol.

O produto informa exposição solar potencial. Não prevê nuvens nem assegura sol observado. Não deduza temperatura interna, ventilação ou consumo elétrico apenas da direção. A regra histórica que permite inventar dados no pitch não se aplica aos resultados funcionais desta ferramenta.

## 2. Leia o projeto e preserve o trabalho existente

A raiz do projeto é `/home/v/Documents/vereda/veredas`. Antes de editar, confira `git status`, as instruções aplicáveis e o código corrente. Há trabalho em andamento: os caminhos abaixo foram inspecionados em 27/10/2026 e podem ter mudado. Integre o que for útil sem desfazer alterações alheias. Não faça reset nem sobrescreva arquivos inteiros por conveniência.

| Área | Arquivos a inspecionar, relativos à raiz |
| --- | --- |
| Marca e componentes | `index.html`, `src/tema/tokens.ts`, `src/tema/Tema.tsx`, componentes existentes de texto, ícones e botões |
| Entrada na visita | `src/componentes/visita-v1/NoImovel.tsx`, `Orientacao.tsx`, `useVisita.ts`, `logica.ts` |
| Sensor já utilizado | `src/app/exemplos/[id]/visita/ao-vivo.tsx` |
| Sol e vizinhos | `src/dados/dossie/solESombra.ts` |
| Desenho do entorno | `src/componentes/dossie-v1/MapaDoLote.tsx`, `mapa.ts` |
| Integração no dossiê | `src/app/(abas)/dossie.tsx` e seus componentes |
| Contratos e persistência | `src/dados/contratos.ts`, `caderno.ts`, `migracao.ts`, `sessoes.ts`, exportação/importação e backups |
| Dados geográficos | `src/dados/recife/indice.ts`, índices e metadados municipais; `scripts/dados/construir-indice-recife.mjs` |
| Decisões anteriores | `docs/plano-recife/05-EPOCAS-05-A-09.md`, especialmente EP09.03 |

Baseline encontrada: Expo 57, React Native 0.86, React 19, TypeScript, `expo-location`, `react-native-svg`, AsyncStorage e Zod. Aproveite esses recursos. Não migre versões principais para construir a funcionalidade. Confirme compatibilidade antes de acrescentar qualquer dependência.

## 3. Experiência principal: três momentos

### A. Entrada no dossiê

Um único cartão, **“Sol nas suas janelas”**.

- Sem registro: “Descubra como o sol chega à sala e aos quartos.” Ação: **“Verificar na visita”**.
- Se o anúncio declarar uma orientação: “Anúncio informa: nascente.” Ação para verificar. Preserve a origem; não trate a declaração como medição.
- Com uma janela registrada: resumo curto da janela ativa, sua origem em texto discreto e **“Explorar o sol”**.

Endereço localiza o edifício; não identifica a direção da janela ou a unidade. Não escolha leste/oeste com base no centro do lote, na rua ou em uma fachada genérica. Uma declaração “nascente” também não equivale automaticamente a uma medição exata de 90°.

### B. Registrar uma janela

Abra uma tela ou painel coerente com a navegação existente. A pergunta inicial é **“Qual janela vamos observar?”**, com poucas escolhas: Sala, Quarto, Varanda e possibilidade de nomear outra. Uma única janela é suficiente para começar; outras são adicionadas depois.

Mostre uma instrução curta e um desenho vetorial do gesto: **“De frente para fora da janela, mantenha o celular deitado e aponte a parte de cima para fora.”** A direção deve ser perpendicular ao plano da janela, do interior para o exterior. Confirme esse gesto nos aparelhos usados nos testes; ajuste a instrução se o adaptador exigir outra posição.

Uma seta estável, o nome cardeal legível e a ação **“Guardar direção”** são suficientes. Graus ficam nos detalhes. Peça acesso ao sensor/localização no momento de usar a bússola, explicando a finalidade em uma frase.

Estados necessários: preparando, leitura disponível, leitura instável, permissão negada, sensor indisponível e alternativa manual. Exemplos de mensagens: “Afaste o celular de metais e tente de novo”; “Você também pode indicar a direção”. Não deixe um carregamento infinito.

Na alternativa manual, permita selecionar a direção em um pequeno desenho orientado ao norte, com botões além do arraste. Se houver planta/fachada identificável, permita apontar o lado da janela. Se a pessoa não souber, aceite **“Verificar depois”**. Uma direção escolhida manualmente permanece identificada como informada.

Ao guardar, estabilize a leitura e encerre o sensor. A exploração solar não gira continuamente com o movimento do celular. Não peça andar, dimensão de vidro, profundidade de varanda e tipo de parede antes de entregar o primeiro resultado.

### C. Explorar o sol

Na primeira tela, limite o conteúdo a:

1. Identificação da janela: **“Sala · voltada para oeste”**.
2. Uma frase calculada para a data selecionada, por exemplo **“Potencial de sol à tarde”**.
3. Uma única ilustração: janela/fachada e posição do Sol, ou a maquete do entorno quando os dados estiverem prontos.
4. Um controle de horário com hora visível, opções de toque e alternativa acessível.
5. Um seletor compacto de data, inicialmente **“Hoje”**; abre o dia escolhido e atalhos de junho/dezembro com datas explícitas.

Logo abaixo, uma linha contextual: **“Percurso solar; nuvens e proteções locais podem mudar o sol na janela.”** Quando houver modelo de vizinhos, adapte a linha para esclarecer o que foi considerado. Uma ação secundária **“Ver entorno”** revela a análise dos vizinhos; **“Como foi estimado”** contém fontes e hipóteses. Não espalhe avisos, siglas e selos pela tela.

Ao mover o horário, o Sol e a sombra mudam juntos e uma frase responde ao estado. Evite repetir a mesma conclusão em título, cartão, legenda e rodapé. A data deve afetar o cálculo de verdade. Use o fuso do imóvel, mesmo que o celular esteja em outra cidade.

Os exemplos de texto são modelos condicionais, nunca resultados fixos. “Sem sol direto neste horário” não significa “ambiente escuro”. A simulação não mede luz difusa ou iluminação interna.

## 4. Direção visual

Use a identidade existente: papel `#F2EBDD`, superfície branca, texto `#171717`, laranja `#F47745`, ferrugem `#B94E36`, azul cadastral `#2E5A85`; Fraunces, Plus Jakarta Sans e JetBrains Mono nos papéis já usados pelo produto. Consuma os tokens do aplicativo, inclusive os de tema escuro, em vez de duplicar cores em cada componente.

Priorize composição editorial, respiro e ilustração vetorial nítida. O laranja destaca a janela ou o imóvel ativo. Vizinhos usam tons neutros; a sombra tem uma camada discreta e uniforme. Mantenha texto sobre fundo legível. O interesse visual vem de arrastar o horário e entender a mudança, não de ornamentação.

Sem fotografia de satélite como fundo obrigatório, texturas de fachada, centenas de janelas, carros, árvores decorativas, grade técnica, glow, partículas, gradientes ou órbita automática. O mapa cadastral de obras e suas informações existentes não deve ficar misturado à explicação solar; compartilhe geometria e componentes onde fizer sentido, mas mantenha contextos claros.

Proporção inicial sugerida para celular: ilustração de aproximadamente 220–280 px de altura; adaptar ao conteúdo e tamanho da tela. Não esconda a ação principal abaixo de uma maquete enorme. Meta de compreensão: a pessoa identifica a janela, o horário e a conclusão sem abrir a explicação técnica.

## 5. Entorno e comparação sem excesso

### Maquete discreta, com câmera fixa

A primeira escolha é **SVG 2D/2,5D usando a biblioteca existente**. Use projeção ortográfica/axonométrica consistente, poucos volumes e uma câmera que mantenha a janela visível. Uma planta com sombra é preferível quando a perspectiva não acrescentar compreensão. Não introduza Three.js, mapa 3D comercial ou WebGL apenas para dar aparência tridimensional.

Mostre inicialmente o edifício ativo e até três vizinhos relevantes para a janela/data, não simplesmente os três mais próximos. A seleção visual não pode limitar o conjunto de obstáculos usado pelo motor. Se um obstáculo oculto for relevante, a conclusão deve continuar correta e oferecer sua identificação. Mantenha o conjunto e o enquadramento estáveis enquanto o horário é arrastado.

Não exagere alturas. Não use tamanho visual reduzido de prédio no cálculo da sombra. Projete em metros e só depois converta para a tela. Recorte o desenho no viewport; não encurte fisicamente sombras para fazê-las caber. Trate sobreposição de polígonos para não produzir manchas escuras e listras artificiais. Preserve orientação norte/sul/leste/oeste entre planta, maquete, bússola e matemática.

A janela deve ficar identificável mesmo se um volume a encobrir. Preferir enquadramento estável alternativo, contorno ou recorte localizado; nunca apagar um obstáculo do cálculo para melhorar o desenho. Evite malhas impossíveis, fachadas atravessando umas às outras e rótulos empilhados.

### Descoberta progressiva dos dados necessários

Ao abrir “Ver entorno”, peça apenas o que falta: andar e posição aproximada da janela no contorno **real da edificação**, com opção “Não sei”. Não use o GPS interno para localizar a janela na fachada. A seleção pode ser aproximada e deve guardar essa incerteza. Se não houver contorno confiável, mantenha a orientação e mostre o entorno apenas como contexto em planta.

Um andar informado não é uma altura medida. Havendo conversão por pé-direito, registre a hipótese e avalie sua sensibilidade. Não invente andar intermediário nem coordenada de Recife como se fossem dados da unidade.

### Comparação contextual

Entregue primeiro **“Influência deste vizinho”**: selecionar um prédio mostra uma frase e a comparação do mesmo cenário com todos os obstáculos e com aquele obstáculo desconsiderado. O segundo estado se chama **“Sem este obstáculo · hipótese”** e nunca substitui o cenário real. Compare apenas a exposição da janela, mantendo horário, data, posição e escala.

Uma comparação entre apartamentos pode aceitar **duas janelas já registradas**, lado a lado no desktop e em linhas/cartões compactos no celular, com uma única régua de tempo compartilhada. Mesma data e condições; cada janela mantém andar, orientação e origem próprios. Sem janela conhecida no outro prédio, ofereça “Registrar janela” ou contexto cadastral, sem declarar que o apartamento vizinho é mais fresco.

Não coloque comparação, múltiplos prédios, múltiplos meses e múltiplos cômodos na tela inicial. Não produza ranking ou vencedor. Primeiro responda uma janela; a comparação entra por ação explícita.

## 6. Fontes geográficas e níveis de disponibilidade

As fontes verificadas e seus IDs estão em `PESQUISA-E-FONTES.md`. Há recursos municipais distintos para lotes, contornos construídos, pavimentos e 3D. **O campo atual `Edificio.poligono` contém o lote simplificado. Não o extrude como se fosse a torre.**

Faça uma prova pequena de dados antes de construir toda a experiência de sombras:

- Inspecione as camadas de edificações e pavimentos, seus atributos, referência espacial, anéis e múltiplos polígonos. A pesquisa já encontrou um valor inválido de DSQFL na amostra de edificações: não confie apenas no nome da coluna.
- Relacione por chave validada e coerência espacial. Preserve múltiplos volumes e torres no mesmo lote. Registre ambiguidades, conflitos e objetos sem correspondência; não associe silenciosamente ao edifício mais próximo.
- Verifique o significado real de `PAVIMENTO`; não suponha que cada registro seja um andar nem que contar registros dê o total de pavimentos. Compare com o cadastro e com a documentação disponível.
- O índice residencial atual não representa todos os obstáculos: inclui edifícios com pelo menos duas unidades residenciais. O modelo solar precisa considerar também volumes não residenciais e construções fora desse recorte quando a camada geográfica os tiver.
- Faça preparação fora do celular e produza recortes pequenos, versionados e cacheáveis. Não baixe 80–165 MiB ao abrir uma janela. Preserve fonte, licença, data da publicação e data do levantamento quando conhecida; atualização do portal não prova atualização de cada edifício.

Implemente níveis explícitos no domínio, sem transformar isso em uma coleção de badges na interface:

| Dados disponíveis | Resultado permitido |
| --- | --- |
| Orientação declarada no anúncio | Mostrar a declaração e convidar à verificação |
| Coordenada do imóvel + direção da janela | Percurso do Sol e exposição potencial sem obstáculos |
| Somente lotes/centros e quantidade de pavimentos | Contexto cadastral; nenhuma duração de sombra apresentada como resultado da janela |
| Contorno construído + janela posicionada + altura estimada + cobertura avaliada | Cenário aproximado, com intervalo de incerteza e identificação de alturas estimadas |
| Geometria e alturas verificadas, com posição suficiente da janela | Estimativa geométrica mais específica, ainda sem garantia de nuvens, cortinas ou alterações futuras |

“Sem obstáculos encontrados na base” não equivale a “vista livre”. Altura desconhecida não equivale a zero. Edificações faltantes tornam a cobertura incompleta.

## 7. Motor de cálculo

### Posição solar

Encapsule o cálculo em uma função pura com instante UTC, latitude/longitude e saída normalizada: azimute em graus, norte = 0°, leste = 90°, sul = 180°, oeste = 270°; elevação em graus. Use o fuso `America/Recife` para converter a escolha de calendário/horário em instante. Não use implicitamente o fuso do ambiente de execução.

SunCalc é a primeira biblioteca candidata: pequena, sem dependências e com licença BSD-2-Clause. **A versão 2 mudou unidades e convenções**: graus e azimute a partir do norte; exemplos antigos da versão 1 usam radianos e referência ao sul. Fixe a versão escolhida, confira o pacote real e teste o adaptador. Não aplique conversões antigas sobre valores da versão 2. Referências [F5–F7] no arquivo de pesquisa.

A função atual `posicaoSolarRecife` utiliza declinações fixas de três estações e não considera a equação do tempo. Não reutilize esse atalho como calendário anual validado. Compare a nova saída com casos independentes, conforme os testes abaixo.

### Exposição e obstrução

Mantenha o motor independente do desenho. Para uma janela vertical e ângulos em radianos dentro da operação, o produto da normal com a direção solar é `cos(elevação) × cos(azimuteSolar − orientaçãoJanela)`. Um valor positivo, com o Sol acima do horizonte, indica possibilidade geométrica de incidência na face. Isso não fornece potência térmica ou temperatura.

Para sombras, projete os dados num plano métrico local ou CRS adequado. Trace o raio a partir da posição/altura da janela na direção do Sol e teste interseção com os volumes reais disponíveis. Em coordenadas leste/norte/cima, a direção é `[cos(e)·sin(a), cos(e)·cos(a), sin(e)]`. Em um obstáculo cuja projeção o raio atravessa, avalie a altura do raio ao longo do intervalo de interseção: `z(d) = zJanela + d·tan(e)`. Considere base, topo, furos, múltiplos volumes e diferenças de nível quando disponíveis.

Não substitua a largura do obstáculo por cones fixos de 16°, 22° ou 28°. Não use distância entre centroides ou apenas entre vértices como teste de obstrução. O próprio edifício pode causar sombra em recuos e varandas; apenas “há varanda” não informa dimensões suficientes para calcular essa sombra.

O raio deve começar ligeiramente fora da face para evitar auto-interseção numérica, sem ignorar volumes reais do próprio edifício. Um único ponto representa o centro aproximado da janela; não equivale à fração sombreada de todo o vidro. Só calcule essa fração com dimensão e amostragem de superfície suficientes.

Não limite os obstáculos físicos aos três exibidos nem a um raio arbitrário de 120 m: o alcance depende da diferença de altura e da elevação solar. Use índice espacial e limite de cobertura explícito; perto do horizonte, onde o alcance e a incerteza crescem, devolva resultado limitado/indeterminado quando necessário. Sombras cortadas no desenho continuam sendo consideradas pelo motor.

Produza estados como `sol_potencial`, `bloqueado_no_modelo`, `sol_atras_da_face`, `noite` e `indeterminado`, com causa e proveniência. A interface os traduz em linguagem cotidiana. Não confunda sol atrás da fachada com sombra de um vizinho.

Para duração, integre intervalos entre amostras, sem somar endpoints duplicados. Comece com passo de cinco minutos e refine transições quando necessário; teste convergência. A apresentação deve respeitar a incerteza dos dados, evitando minutos exatos quando só houver alturas estimadas. Com direção/altura incerta, teste intervalos plausíveis e devolva faixa ou “estimativa insuficiente” se o resultado mudar demais. Esses intervalos precisam de justificativa, não de um percentual inventado.

## 8. Bússola e persistência

No nativo, adapte `expo-location` e a leitura já existente. Prefira `trueHeading` válido. Se apenas norte magnético estiver disponível, não o trate silenciosamente como norte verdadeiro; use correção documentada e validada ou ofereça direção manual para a simulação. Guarde a referência usada. `coords.heading` é rumo de deslocamento, não a direção da janela. A escala `accuracy` da bússola Expo é um nível de calibração, não um erro em graus.

Como decisões de engenharia: use suavização circular, trate a passagem 359°→0° e observe estabilidade por uma janela curta antes de sugerir captura. Estabilidade não prova ausência de interferência magnética. Os limiares devem ser ajustáveis e validados em aparelho. Encerre assinaturas ao salvar, sair da tela, perder foco ou suspender o app, inclusive se a permissão resolver depois da saída.

No web, a alternativa manual deve funcionar sempre. Só habilite bússola após detecção de capacidade, contexto seguro, permissão por gesto e referência absoluta utilizável. `alpha` isolado não garante rumo absoluto; trate orientação da tela e diferenças dos navegadores no adaptador. Não prometa equivalência de suporte entre Expo nativo e browser. Consulte [F8–F9].

Modele registros por janela: ID estável, ambiente/nome, direção nullable, referência angular, método/origem, instante da observação, qualidade, coordenada do imóvel e precisão/origem, andar informado, altura e sua hipótese, posição aproximada na fachada, obstáculos observados e fonte/versão da geometria usada. Guarde apenas o necessário; não mantenha rastreamento contínuo.

Separe observação registrada, declaração do anúncio e cenário explorado. Mudar a data da simulação não altera a data da medição. Comparar outro andar não modifica o andar informado. Migre `visita.orientacaoGraus` sem inventar ambiente, precisão ou captura por sensor: use “Janela registrada” e origem legada manual/indefinida quando não houver evidência melhor.

Revise esquemas Zod estritos, edição, sessões de visita, backups e importação/exportação. Preserve registros entre visitas e permita revisão explícita; não perca janelas ao iniciar nova sessão. Mantenha compatibilidade com dados antigos e ausência de orientação. Valores ausentes continuam nulos.

## 9. Calor: uma orientação útil

Use no máximo uma observação contextual, condicionada aos dados. Exemplo: “Sol direto à tarde pode aumentar o aquecimento. Observe a proteção da janela e o uso de ar-condicionado nesse horário.” Quando houver sombra estimada: “Este obstáculo pode reduzir a exposição direta no período mostrado.”

Não derive temperatura, porcentagem de consumo, kWh ou reais deste motor. Não anuncie “nascente sempre fresco”, “face sul sempre sem sol”, “brisa garantida” ou “poente crítico”. Não transporte regras sazonais de latitudes temperadas para Recife. Orientação solar, sombreamento, calor interno e ventilação são fenômenos relacionados, mas têm entradas e modelos diferentes. A fonte térmica [F10] fundamenta a orientação geral, não coeficientes específicos para o imóvel.

## 10. Qualidade e aceite

Escreva testes que encontrem erros físicos e de dados, não testes que apenas repitam a implementação.

- **Astronomia:** Recife em março, junho, setembro e dezembro; manhã, meio-dia, tarde e noite; datas/instantes explícitos e comparação com referência independente. Como meta inicial de engenharia, diferença angular até 0,5° fora do horizonte e do zênite, com a mesma convenção de refração. Perto do zênite compare vetores, não só azimute. Registre a justificativa da tolerância e os valores de referência.
- **Fuso e convenções:** aparelho em outro fuso, virada do dia, longitude negativa, ano bissexto, graus/radianos e norte verdadeiro/magnético. O mesmo cenário deve gerar o mesmo resultado em web e nativo.
- **Geometria:** janela leste/oeste; obstáculo à frente/atrás; baixo/alto; estreito/largo; dois obstáculos sobrepostos; prédio com recuo; buraco no polígono; torres no mesmo lote; alturas ausentes; geometria incompleta; nenhum bloqueio à noite; próprio prédio; janela próxima à borda. Cenários sintéticos identificados apenas nas fixtures de teste.
- **Propriedades do modelo:** remover um obstáculo não pode reduzir exposição geométrica; a duração com obstáculos não pode superar a do mesmo cenário sem obstáculos; recortar ou simplificar a cena visual não altera os cálculos. Não use “andar maior sempre dá mais sol” como regra universal com recuos/volumes complexos.
- **Dados:** DSQFL inválido, múltiplos matches, coordenadas invertidas, lote confundido com torre, polígonos inválidos, licença/proveniência, atributos com semântica desconhecida e índice residencial incompleto.
- **Sensores:** permissão negada, sem sensor, `trueHeading = -1`, timeout, passagem por 0°, interferência/instabilidade, saída da tela durante leitura e limpeza de assinatura. Verifique Android e iOS reais quando disponíveis; emulador não comprova bússola física.
- **Persistência:** migração, várias janelas, exclusão/revisão, nova visita, encerramento do app, exportação e restauração.
- **UX:** uma pessoa conclui o registro de uma janela sem conhecer graus; falhas preservam os dados e a alternativa manual. O gráfico tem resumo textual, foco, nomes acessíveis, ações de incremento/decremento e controle por teclado no web. Cor não é o único código.
- **Visual:** revisar 360/390 px e desktop, orientação horizontal, fonte ampliada, temas existentes e movimento reduzido. Alvos de toque de 44 pt no iOS e 48 dp no Android. Inspecionar manhã, meio-dia, tarde, noite e cada estado de falta de dados. A maquete não treme, não gira sozinha e não cobre a janela com rótulos.
- **Desempenho:** carregar só o recorte necessário; pré-calcular/cachear trajetórias por cenário; não recalcular toda a cidade em cada evento de arraste. Medir resposta do controle num celular representativo e registrar aparelho/condições; perseguir atualização perceptível em até 100 ms sem anunciar garantia universal.

Rode os comandos relevantes do projeto (`npm run typecheck`, `npm run lint`, testes focados e regressões justificadas). Faça duas rodadas de revisão visual dos estados desta funcionalidade, corrigindo os problemas mais importantes. Registre evidências em uma pasta própria de produto; os comandos de QA do pitch não são o teste desta tela.

## 11. Ordem de entrega e definição de pronto

1. Audite o trabalho atual e faça a prova de dados geográficos. Registre em poucas linhas o que será reaproveitado, corrigido e o que realmente existe na amostra.
2. Entregue janela + captura/manual + persistência + percurso solar por data + cartão do dossiê, completos e utilizáveis sem rede após carregar o imóvel.
3. Integre contornos construídos e motor de obstrução validado. Entregue maquete fixa e “Influência deste vizinho” com ativação condicionada aos dados, mantendo uma experiência útil quando faltarem.
4. Entregue comparação compacta de duas janelas registradas, reaproveitando controles e motor; não crie uma tela de BI.
5. Teste, revise visualmente e documente limitações efetivamente encontradas. Corrija textos antigos que contradigam o novo nível de evidência, inclusive durações automáticas e garantias de brisa no fluxo solar.

A entrega deve incluir código integrado, migração, testes, imagens dos estados principais e um relato curto do que foi verificado em navegador/aparelho. Se uma fonte externa falhar, registre a tentativa e entregue os níveis que têm dados; não simule sucesso nem declare validação em aparelho que não ocorreu. Não termine apenas com um plano ou uma maquete estática.

**Critério final de produto:** o usuário consegue guardar a direção de uma janela, mover o horário, perceber o que muda ao longo do ano e entender a influência de um vizinho quando houver evidência suficiente — sem precisar interpretar uma parede de números.
