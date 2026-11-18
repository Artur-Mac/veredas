# Recado para o agente de coleta do Vereda

Continue a pesquisa de dados usando `docs/dados/infra/scripts/`. Trabalhe uma fonte e um recorte por vez. Comece pela origem oficial, confira a amostra e registre a evidência antes de ampliar.

## Como executar neste computador

Na raiz do Vereda, rode:

```bash
node22="$HOME/.nvm/versions/node/v22.23.3/bin/node"
"$node22" docs/dados/infra/scripts/rodar-tudo.mjs --listar
"$node22" docs/dados/infra/scripts/rodar-tudo.mjs --somente 04
```

O segundo comando faz consultas reais do cadastro municipal. Use `--somente` para repetir apenas a etapa necessária. O padrão é sequencial. Com `--paralelo`, são até dois scripts por rodada. Esse limite vale para scripts, e o ritmo por domínio precisa ser controlado dentro de cada coletor. Confira `docs/dados/raw/_resumo-ultima-rodada.json`, que guarda código de saída, duração e trechos de stdout e stderr. Um processo que saiu com código zero ainda pode ter registrado falhas parciais por fonte. Valide as saídas antes de rodar `09-processar.mjs`.

O Playwright já está no projeto e o Chromium headless já está no cache desta máquina. Use o Node 22 acima para rodá-lo. O `node` do sistema pode apontar para o Node 18. Aproveite a instalação que o Vereda já usa em `motion/render.mjs` e a prática de abrir e fechar o navegador em torno de um trabalho, como em `~/AI/pixal3d-benchmark/web/shape512/run_playwright.js`. Para uma fonte que depende de JavaScript, use um contexto isolado, aguarde o elemento ou a resposta esperada e feche o contexto e o navegador ao terminar. [Isolamento no Playwright](https://playwright.dev/docs/browser-contexts)

## Como coletar e validar

1. Priorize downloads oficiais, APIs documentadas e dados abertos. No Vereda, procure primeiro pelos recursos no CKAN e ESIG do Recife, pelo GTFS do operador e pelas séries publicadas pelo órgão responsável. Use HTML estático quando a API ou o arquivo aberto estiverem indisponíveis. Reserve Playwright para páginas autorizadas que realmente precisem de JavaScript. Confira os termos e o robots.txt para a coleta de páginas.
2. Para novos coletores Node, use `get`, `getJSON` e `saveOut` de `http.mjs`. Use `maxAgeMs` conforme a periodicidade da fonte e `cache: false` para uma verificação ao vivo. Mantenha o código da fonte e a URL original no catálogo. O cliente repete falhas transitórias e respeita `Retry-After` quando a espera cabe no orçamento de 30 segundos. Se o servidor solicitar uma pausa maior, adie a fonte para outra rodada. Trate 401, 403 e CAPTCHA como indisponibilidade para a automação e procure um canal oficial de acesso. [HTTP Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after)
3. Valide o conteúdo além do status HTTP. Para CKAN, confira `success`, recurso e colunas. Para ArcGIS, cheque erros no JSON e a paginação. Para GTFS, valide as tabelas obrigatórias, a contagem de registros e os limites geográficos antes de qualquer correção. Registre data da coleta, versão ou período da fonte, recorte e contagem. Preserve a última saída válida se o portal devolver HTML de erro, dados incompletos ou um esquema inesperado.
4. Salve o original em `raw/`, normalize em `processado/` e atualize `fontes/fontes.json` pelo fluxo de `fontes.mjs`. Use um identificador estável por registro para atualizar uma coleta sem duplicar dados. Uma repetição deve preservar o recorte e atualizar a versão com proveniência rastreável.
5. Para melhorar a arquitetura, migre primeiro os coletores com transporte próprio para o cliente comum, um por vez, depois de comparar as saídas com amostras locais. Adicione limites por domínio, com concorrência inicial de uma requisição por origem e aumento gradual com base na latência e nas falhas. Se uma coleta longa precisar retomar, persista o cursor por fonte e recorte após validar e gravar cada página. Meça duração, páginas concluídas, erros HTTP, proporção de cache e registros validados. Avalie Scrapy quando a fila persistente e o controle de concorrência justificarem migrar os coletores atuais. [AutoThrottle](https://docs.scrapy.org/en/latest/topics/autothrottle.html) · [Retomada de coletas](https://docs.scrapy.org/en/latest/topics/jobs.html)
