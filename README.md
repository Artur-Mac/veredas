# PropSight · protótipo da fase 0

Aplicativo móvel que transforma o link de um anúncio de apartamento em Recife num dossiê de evidências: qual é o prédio e como chegamos a ele, o que os registros públicos dizem sobre ele e a rua, o que o anúncio declara e onde não bate, e o que ainda falta confirmar, com documentos a pedir, perguntas e itens de visita. Sem nota, sem semáforo, sem veredito.

Este protótipo é a fase 0 do roteiro do PRD (`docs/PRD-PropSight.md`, seção 12). Ele não tem backend: lê três dossiês montados com dados públicos reais de Recife e mostra a jornada completa no celular.

## Como rodar

Requisitos: Node 22 ou mais recente e npm.

```bash
npm install
```

```bash
npm run web
```

O comando abre o app no navegador. Use a emulação de celular do navegador (390 × 844) para ver como no aparelho.

```bash
npm run verificar
```

Roda typecheck, lint e testes. Os testes validam as fixtures contra o esquema e barram linguagem proibida (RNF-01 do PRD) e nomes de marcas de terceiros (regulamento 11.20 iv).

O app também abre no Expo Go, mas o recebimento pela folha de compartilhamento só funciona no dev build ou no APK, porque depende de código nativo.

## APK e dev build para Android

O recebimento de anúncios pela folha de compartilhamento usa `expo-share-intent` (só Android nesta fase). Ele exige um build nativo.

Requisitos: Android SDK (plataforma 36), JDK 17 (o Gradle do projeto não roda com JDK 26) e as variáveis `JAVA_HOME` e `ANDROID_HOME`.

```bash
npx expo prebuild --platform android --no-install
```

```bash
cd android && ./gradlew assembleRelease --no-daemon
```

O APK sai em `android/app/build/outputs/apk/release/app-release.apk`, com o JavaScript embutido. Ele roda sem servidor e serve para gravar a demonstração num celular. Está assinado com a chave de depuração pública do modelo Expo, então não serve para loja.

Na rede corporativa em que o protótipo foi gerado, o Java não confiava no certificado do proxy e o Gradle não conseguia abrir sockets locais em `%TEMP%`. Se acontecer o mesmo, defina antes do build:

```bash
JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStoreType=Windows-ROOT -Djdk.net.unixdomain.tmpdir=C:/caminho/curto/uds"
```

Para instalar e testar o compartilhamento num emulador ou aparelho:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

```bash
adb shell am start -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT "https://anuncio.exemplo/imovel/1541528320" -n br.propsight.prototipo/.MainActivity
```

No aparelho, basta abrir o anúncio no app do portal, tocar em compartilhar e escolher o PropSight. O app reconhece o anúncio pelo código numérico do link. Nesta fase ele só tem dossiês para os três anúncios de exemplo; qualquer outro link cai na tela "Este anúncio não está entre os exemplos".

## O que é dado real e o que é fixo

| Item | Origem |
|---|---|
| Campos dos três anúncios | Anúncios reais de Recife abertos no navegador em 12/10/2026. O endereço das páginas fica fora do repositório, em `data/anuncios/origem.local.json` |
| Edificação, pavimentos, área construída, geometria do mapa | Prefeitura do Recife, Área Urbana (Edificações-Lotes, Edificações-Pavimentos, Quadras, Trechos de Logradouros), atualizada em 02/03/2026 |
| Unidades, ano de construção, área e IPTU por unidade, regime de tributação | Prefeitura do Recife, IPTU 2026, só campos do imóvel (os de contribuinte foram descartados na ingestão) |
| Atendimentos da Defesa Civil | Prefeitura do Recife, registros de 2021 a 2024, posicionados por rua |
| Suscetibilidade | Serviço Geológico do Brasil, carta do Recife de 2015 (1:45.000) |
| Setorização de risco | Não encontrada nas bases públicas do SGB; vira cartão "desconhecido" |
| Matriz de perguntas, textos dos cartões e da mensagem | Fixos, escritos a partir do PRD (`scripts/dados/matriz_perguntas.json`, `docs/CATALOGO-DE-CARTOES.md`) |
| Tempo das etapas de consulta | Simulado; o resultado de cada etapa vem das fixtures |
| Correções, roteiro, contestações, estado dos dossiês, tema | Gravados só no aparelho |

A derivação de cada valor está em `docs/FIXTURES.md`. Os scripts que geram as fixtures estão em `scripts/dados/` e rodam com `uv`.

## Estrutura

```
src/app/            telas (Expo Router)
src/componentes/    mapa cadastral, barra de custo, cartões, carimbos
src/dominio/        esquema das fixtures (zod), visão do dossiê, formatos
src/estado/         estado local persistido
src/fixtures/       dossiês e mapas em JSON
src/textos/         rótulos e modelo da mensagem ao corretor
tests/              linguagem calibrada, marcas e fixtures
scripts/dados/      download e derivação dos dados públicos
scripts/capturas/   capturas de tela em docs/capturas
docs/               PRD, glossário, panfleto, plano, catálogo de cartões, fixtures
```

## Limitações conhecidas

- Só três anúncios. Não há leitura ao vivo do anúncio: a leitura no aparelho, prevista no PRD, entra na fase 2.
- As etapas de consulta têm tempo simulado.
- Corrigir um campo declarado marca o campo como "corrigido por você", mas não recalcula os cartões.
- A Defesa Civil publica o número do imóvel mascarado. Por isso o cartão conta os atendimentos das ruas que passam a até 150 m, e não os do prédio.
- O cadastro de edificações da Prefeitura cobre 60 dos 94 bairros.
- Não há setorização oficial de risco alto e muito alto para o Recife nas bases públicas do SGB consultadas. O portal GeoSGB não foi verificado.
- No navegador, a detecção de link na área de transferência só acontece se a permissão de leitura já tiver sido concedida.
- O recebimento por compartilhamento está desligado no iOS nesta fase.
- O APK é assinado com a chave de depuração.

## Licenças e créditos

Contém dados da Prefeitura do Recife, disponibilizados sob ODbL 1.0; as fixtures derivadas desses dados seguem a mesma licença. Contém dados do IBGE (CNEFE 2022) e do Serviço Geológico do Brasil. Fontes Bricolage Grotesque, Atkinson Hyperlegible Next e IBM Plex Mono, sob SIL Open Font License.

## Outros materiais no repositório

- `research/`: pesquisa de mercado e mecanismos feita pela equipe.
- `index.html` e `docs/` anteriores: primeiro esboço em HTML e materiais de marca. Ficam como histórico. Eles citam portais por nome e não fazem parte do material do concurso.
