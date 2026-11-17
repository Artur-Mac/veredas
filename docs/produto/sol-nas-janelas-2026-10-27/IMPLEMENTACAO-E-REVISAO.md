# Implementação e revisão — 27/10/2026

## Resultado

A funcionalidade está integrada pelo cartão **Sol nas suas janelas** do dossiê, pela ação **Observar uma janela** na visita e pelo resumo após encerrá-la. Uma rota própria, `/sol`, mantém captura, exploração, entorno e comparação como momentos distintos. Não há um painel com todos os dados abertos ao mesmo tempo.

O fluxo permite guardar várias janelas, rever direção, nomear ambiente, excluir um registro e comparar duas janelas do mesmo imóvel ou de imóveis salvos. O calendário e o horário são compartilhados na comparação. A direção principal da tela não é inferida do endereço.

## Estrutura entregue

- `src/dados/sol/`: contratos, migração, astronomia, captura, geometria e carregamento dos recortes.
- `src/componentes/sol/`: cartão, captura, controles acessíveis, ilustração, exploração e entorno.
- `src/app/sol.tsx`: seleção, gerenciamento, persistência atômica e integração com o caderno.
- `src/plataforma/bussolaSolar.*`: bússola nativa e alternativa manual no navegador.
- `scripts/dados/preparar-sol-recife.py`: preparação reproduzível dos dados públicos.
- `scripts/dados/gerar-referencia-solar.py`: geração independente de referências numéricas NOAA.
- `scripts/sol-smoke.mjs`: fluxo de navegador isolado, persistência, calendário, entorno, comparação, interação offline e capturas.

A implementação utiliza `suncalc` **2.1.1**, com versão fixa e convenções verificadas: graus e azimute a partir do norte. A conversão do calendário usa Recife explicitamente, independentemente do fuso do aparelho. Os testes incluem instantes próximos ao zênite com comparação por vetor.

## Persistência e compatibilidade

Os registros ficam em `caderno.solar`, extensão opcional e versionada do contrato existente. As escritas usam `atualizar`, sobre a versão mais recente da análise, para não perder notas ou outros complementos durante uma gravação. A criação de outra visita preserva o caderno e suas janelas.

A leitura do armazenamento e a restauração do backup migram `visita.orientacaoGraus` para **Janela registrada**, com origem legada, referência desconhecida e data/qualidade nulas. A janela precisa de conferência antes de uma simulação específica. Excluir o registro mantém a coleção vazia explícita, evitando que o campo legado o recrie na recarga.

Mudar o dia ou o horário não altera a observação. Confirmar andar/posição também não transforma a altura em medição. Observações de varanda, árvore, brise ou prédio são preservadas, mas não viram dimensões inventadas no cálculo.

## Dados geográficos

Foram lidos integralmente os dois GeoJSONs de edificações e pavimentos da Prefeitura. Os brutos permanecem em `/tmp/vereda-sol-fontes`; a aplicação embarca os derivados compactos, sem baixar os arquivos de 80–165 MiB durante a visita.

[O relatório de preparação](./evidencias/geometrias.json) contém os hashes dos arquivos, fontes, licença, contagens, classes e associações amostradas. Foram observadas **74.013 feições de edificações** e **230.356 de pavimentos**, com **3 e 11.680 chaves inválidas**, respectivamente. As chaves inválidas não servem para associar um imóvel; volumes próximos sem chave/altura suficiente continuam como contexto ou impedimento à conclusão, não como espaço vazio.

Os recortes iniciais cobrem **Graças, Casa Forte, Espinheiro e Boa Viagem**, incluindo margens além dos edifícios residenciais indexados. A seleção física de obstáculos usa todos os volumes do recorte, incluindo construções fora do cadastro residencial do app. A cena desenha apenas o necessário à leitura.

[A triagem de cenários reais](./evidencias/amostra-cenarios.json) registra exemplos de torres próximas, torre afastada de outras altas no recorte, volumes de alturas distintas, vários volumes no mesmo lote e altura ausente. É uma análise geométrica da base, sem vistoria em campo. O ZIP 3D não foi necessário nem inspecionado.

O preparador verifica chaves, coordenadas, anéis, auto-interseções simples e coerência espacial da associação. Rejeições são registradas. A versão dos recortes incorpora as fontes e o preparador, para que uma mudança de geometria exija conferir posições antigas. O polígono do lote não é usado como torre.

As classes de pavimentos produzem alturas **de cenário**, não alturas oficiais medidas: 2,8–3,4 m por pavimento, com terreno plano e posição aproximada da abertura. Classes cuja semântica é insuficiente conservam altura desconhecida. A cobertura permanece cadastral e parcial.

## Cálculo e apresentação

O motor testa raios contra os contornos construídos e respeita múltiplos volumes, furos, base/topo e o próprio edifício. Não usa cones de abertura fixos para simular a largura de um prédio. O raio não fica limitado aos três volumes desenhados. Um obstáculo além da cobertura, principalmente com Sol baixo, pode tornar a conclusão indeterminada.

Além das alturas, são testadas variações de direção e posição. Essas amplitudes são hipóteses de sensibilidade, não uma precisão atribuída ao sensor. Se mudarem a conclusão, a tela não afirma sol ou sombra com certeza. Durações são integradas por intervalos no domínio; a interface principal não exibe horas decimais ou minutagens que os dados não sustentam.

A visualização escolhida é **2D em SVG**, com uma ilustração da janela no fluxo principal e uma planta dos volumes construídos no entorno. A comparação do vizinho permite desconsiderar um volume como hipótese explícita. A planta mantém escala métrica fixa e indica volumes fora do enquadramento.

O cartão antigo de sol/brisa e as conclusões derivadas de lotes foram retirados do fluxo. O mapa de obras permanece cadastral, em planta. Os helpers antigos permanecem identificados como experimento legado para compatibilidade, sem alimentar a nova funcionalidade. A orientação da janela também deixou de aplicar um acréscimo automático de 18% à estimativa de energia.

## Revisão visual: primeira rodada

Evidências em `evidencias/pass-1/`. Os três problemas principais foram:

1. A rotação do SVG gerava um aviso de propriedade no navegador, cuja interface de desenvolvimento cobria parte da tela. Corrigido com transformação SVG explícita.
2. O enquadramento por todos os extremos reduzia o imóvel a poucos pixels. Corrigido para uma escala local estável, sem distorcer alturas ou comprimentos no cálculo.
3. Após guardar a direção, a exploração herdava a posição de rolagem da captura. Corrigido para abrir o resultado no início; revisões de posição dentro do entorno preservam seu contexto.

## Revisão visual: segunda rodada

Evidências em `evidencias/pass-2/`. Os três problemas principais foram:

1. Oito direções e ajuste fino ocupavam espaço demais antes do primeiro registro. A captura agora começa com quatro direções; as diagonais e o ajuste preciso são revelados sob demanda.
2. Entorno e comparação ficavam abaixo do fluxo principal, distantes do controle de horário. Passaram a ter uma vista própria com o mesmo horário/data e uma ação clara de retorno.
3. Os três obstáculos de maior contagem podiam ficar todos fora do desenho. A cena passou a combinar um obstáculo de impacto com contexto próximo e marcadores para os volumes distantes; o conjunto físico do cálculo permanece completo para o recorte.

As correções foram inspecionadas em `evidencias/pass-3/` e reconfirmadas em `evidencias/final/`, incluindo **texto ampliado a 150%**. Foram conferidos 360×800, 390×844, 1280×900 e 844×390, com movimento reduzido. O teste de componentes verifica os tokens escuros; não houve validação visual em aparelho físico.

## Verificação

Os testes cobrem calendário independente, referência NOAA, noite, zênite, interseções e furos, cotas de base, incerteza, migração, backup, nova visita, falha ao salvar, permissões simuladas, estabilidade e limpeza de assinaturas. A captura não cria norte por padrão.

O navegador de teste roda em outro fuso (`America/Los_Angeles`) e verifica o horário/data de Recife, teclado, comparação, recarga, observações de proteção e interação sem rede depois da carga. As capturas e o resultado de cada rodada ficam na pasta de evidências. A abertura fria do entorno foi da ordem de **255–343 ms no Chromium de desenvolvimento** nas rodadas registradas; esse número inclui a interação automatizada e não mede desempenho de celular físico.

Resultados de comandos e eventuais interferências de alterações concorrentes ficam em [verificacao.json](./evidencias/verificacao.json). A suíte geral foi executada; ela inclui módulos que continuaram recebendo alterações durante esta entrega. Não se deve confundir uma falha nesses novos módulos com uma validação de sensor físico ou com um resultado do motor solar.

## Limites efetivamente encontrados

- A bússola nativa foi implementada e testada com fontes simuladas. **Android/iOS físicos ainda precisam validar o gesto, a interferência magnética e a calibração.** No navegador, a entrada manual é o caminho disponível.
- Sombras personalizadas dependem da associação e da posição/andar informados nos quatro bairros preparados. Outros bairros mantêm direção e percurso solar. A base não é uma reconstrução completa ou atual de todas as construções e árvores.
- A simulação não prevê nuvens, temperatura interna, iluminação difusa ou conta de energia. A hipótese de retirar um volume não descreve a situação real do imóvel.
- A verificação offline é de navegação/interação após a carga do app. Não foi adicionado service worker para recarregar o site inteiro sem rede.

## Reproduzir

```sh
python3 scripts/dados/preparar-sol-recife.py
python3 scripts/dados/gerar-referencia-solar.py
npm run typecheck
npm run lint
npm test -- --runInBand
EXPO_OFFLINE=1 npx expo start --web --port 8109
SOL_URL=http://localhost:8109 SOL_PASSO=conferencia node scripts/sol-smoke.mjs
```

O primeiro comando pressupõe os dois arquivos públicos já presentes no cache indicado pelo preparador. Para ampliar a cobertura, inclua os bairros existentes e os novos em `--bairros`, valide associações e revise o relatório antes de habilitar a área. Não é necessário reprocessar dados para usar a funcionalidade já embarcada.
