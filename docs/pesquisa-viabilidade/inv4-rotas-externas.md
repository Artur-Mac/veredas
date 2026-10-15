# Investigação 4: abertura de rotas em app de mapas externo

Data de acesso de todas as fontes: 2026-10-14.

## 1. Resposta curta

Parcial: nenhum esquema único abre o app de mapas padrão do usuário (com seletor neutro) já com origem, destino e modo; o esquema neutro (`geo:`) só leva o destino, e os esquemas que levam origem, destino e modo são específicos de cada app (Google Maps, Apple Maps, Organic Maps, CoMaps, OsmAnd), sem chave e sem custo, o que permite um seletor montado pelo próprio PropSight.

## 2. Evidências

| URL | O que confirma |
|---|---|
| https://developers.google.com/maps/documentation/urls/get-started | "You don't need a Google API key to use Maps URLs." Direções em `https://www.google.com/maps/dir/?api=1`; `origin` e `destination` aceitam "a place name, address, or comma-separated latitude/longitude coordinates"; `travelmode` = `driving`, `walking`, `bicycling`, `two-wheeler`, `transit`; `api=1` "is required in every request"; sem `origin`, usa a localização do aparelho se houver; limite de 2.048 caracteres; no Android sem o app Google Maps, "the URL launches Google Maps in a browser". Página "Last updated 2026-10-14 UTC". |
| https://developer.android.com/guide/components/google-maps-intents (destino do redirecionamento 301 de developers.google.com/maps/documentation/urls/android-intents) | `geo:` com `z`, `q`, `label`; `google.navigation:q=...&mode=d|b|l|w&avoid=t|h|f`; "Directions are always given from the user's current location" (sem origem); `setPackage("com.google.android.apps.maps")` força o Google Maps, sem ele "If multiple apps are available, the user might be asked which app they would like to use"; recomenda Maps URLs para uso multiplataforma. "Last updated 2026-10-06 UTC". |
| https://developer.android.com/guide/components/intents-common (seção Maps) | Formatos `geo:latitude,longitude`, `geo:latitude,longitude?z=zoom`, `geo:0,0?q=lat,lng(label)`, `geo:0,0?q=my+street+address`; codificação obrigatória; com mais de um app capaz, "the system presents the user with a dialog to pick which app to use"; sem app capaz, `startActivity()` falha (verificar com `resolveActivity()`). |
| https://developer.android.com/about/versions/12/behavior-changes-all (Web intent resolution) | A partir do Android 12, um link http/https só abre num app aprovado para o domínio (App Links verificados ou associação manual pelo usuário); caso contrário, "the web intent resolves to the user's default browser app instead". |
| https://developer.android.com/training/package-visibility/use-cases | `startActivity()` não exige visibilidade de pacote para abrir URL ("you don't need to add a `<queries>` element"); para saber antes se há app capaz (ex.: mostrar ou esconder um botão), declarar `<intent>` em `<queries>`. "Last updated 2026-10-01 UTC". |
| https://docs.expo.dev/versions/v57.0.0/sdk/linking/ | Projeto usa `expo` ~57.0.27 e `expo-linking` ~57.0.12 (package.json do repositório). `openURL` "rejects if there are no applications registered for the URL or the user cancels the dialog"; `canOpenURL` no iOS exige `LSApplicationQueriesSchemes`. A página não menciona `<queries>` do Android. |
| https://developers.google.com/waze/deeplinks | Base `https://waze.com/ul`, parâmetros `q`, `ll`, `navigate=yes`, `z`, `utm_source` e preferências de rota; a página não define origem nem modo de transporte; sem o app, "Waze opens as a web page"; `waze://` só se o app estiver garantidamente instalado. Teste com curl: `https://waze.com/ul?ll=...&navigate=yes` redireciona para `https://www.waze.com/live-map/directions?navigate=yes&to=ll....` (HTTP 200). |
| https://developer.apple.com/documentation/mapkit/unified-map-urls | iOS 18.4+: `https://maps.apple.com/directions` com `source`, `destination` (endereço, coordenada ou nome), `mode` = `driving`, `walking`, `transit`, `cycling`, `waypoint`, `avoid`, `transit-preferences`; sem `source`, parte da localização atual. A página antiga Map Links (`saddr`/`daddr`/`dirflg`) responde 301 para esta (verificado com curl). |
| https://www.rfc-editor.org/rfc/rfc5870.html | URI `geo:` (Standards Track, junho de 2010): coordenadas, `crs` (padrão WGS-84) e `u` (incerteza em metros); não define `q=`, origem, rota nem modo; "just one operation on a 'geo' URI is defined - location dereference". O `?q=` é convenção do Android (linha acima). |
| https://raw.githubusercontent.com/osmandapp/OsmAnd/master/OsmAnd/AndroidManifest.xml (último commit no arquivo: 6951451, 2026-10-05) | OsmAnd declara filtros para `geo:`, `osmand.geo:`, `google.navigation:`, `osmand.navigation:`, `osmand.api:`, `https://osmand.net/map...`, `maps.google.*`, `www.google.*` com `pathPrefix="/maps"`, `maps.apple.com`, `openstreetmap.org/directions`. `autoVerify="true"` só nos filtros de `osmand.net/go` e `/premium`. |
| https://raw.githubusercontent.com/osmandapp/OsmAnd/master/OsmAnd/src/net/osmand/plus/helpers/IntentHelper.java (commit a80b090, 2026-09-25) | URL de navegação do app: `https://osmand.net/map/navigate?start=lat,lon&end=lat,lon&profile=<chave>&via=...`; parâmetros lidos: `start`, `end`, `profile`, `via`, `params`. |
| https://raw.githubusercontent.com/osmandapp/OsmAnd/master/OsmAnd/src/net/osmand/plus/settings/backend/ApplicationMode.java | Chaves de perfil: `car`, `bicycle`, `pedestrian`, `public_transport`, `truck`, `motorcycle`, `moped`, `train`, `boat`, `aircraft`, `ski`, `horse`, `default`. |
| https://raw.githubusercontent.com/osmandapp/OsmAnd/master/OsmAnd-java/src/main/java/net/osmand/util/GeoPointParserUtil.java (commit f713892, 2026-09-21) | Ao receber uma Maps URL do Google, o OsmAnd lê `origin` e `destination` como coordenadas; o código não lê `travelmode` nem `mode` (busca por essas cadeias sem resultado). `google.navigation:q=` vira um único ponto. |
| https://osmand.net/docs/user/web/web-map | Documentação web usa `https://osmand.net/map/navigate/?start=...&finish=...&type=osmand&profile=car`; diverge do código Android, que lê `end`. |
| https://raw.githubusercontent.com/organicmaps/organicmaps/master/libs/map/mwm_url.cpp (commit c55247e, 2026-07-02) e .../android/app/src/main/AndroidManifest.xml (commit 9f7ddea, 2026-09-04) e .../libs/ge0/parser.hpp | Organic Maps: `om://route?sll=lat,lon&saddr=nome&dll=lat,lon&daddr=nome&type=vehicle|pedestrian|bicycle|transit`, nessa ordem; prefixos aceitos `om://`, `https://omaps.app/`, `ge0://`, `https://ge0.me/`. Declara `geo:`, `om:`, `ge0:`, `omaps.app` (com autoVerify) e `www.openstreetmap.org`; não declara hosts do Google. |
| https://codeberg.org/comaps/comaps/raw/branch/main/libs/map/mwm_url.cpp, .../libs/ge0/parser.hpp, .../android/app/src/main/AndroidManifest.xml | CoMaps: mesmos parâmetros (`sll`, `saddr`, `dll`, `daddr`, `type` com `vehicle`, `pedestrian`, `bicycle`, `transit`); prefixos `cm://`, `comaps://`, `https://comaps.at/`, `ge0://`, `https://ge0.me/`; declara `geo:`, `cm:`, `comaps:`. |
| https://cloud.google.com/maps-platform/terms ("Last modified August 26, 2026") | 3.2.3(e) "No Use With Non-Google Maps. ... Customer will not use the Google Maps Core Services with or near a non-Google Map in a Customer Application. For example, Customer will not ... (iii) link a Google Map to non-Google Maps Content or a non-Google Map." Definição: "Services" e "Google Maps Core Services" são os listados em cloud.google.com/maps-platform/terms/maps-services/. 3.2.2(b) Attribution. |
| https://cloud.google.com/maps-platform/terms/maps-services ("Last modified April 22, 2026") | Lista dos Core Services: "only the services below are covered by the Google Maps Platform Terms of Service". A lista inclui Maps Embed API, Maps JavaScript API, Maps SDK for Android, Directions API, Routes API etc.; "Maps URLs" não aparece na lista. |
| https://cloud.google.com/maps-platform/terms/maps-service-terms ("Last modified June 10, 2026") | Cláusulas "No use with a non-Google map" para Directions API (4.2), Distance Matrix (5.2), Geocoding (6.2), Places (14.2), Routes API (19.2) etc.; nenhuma menção a Maps URLs. |
| https://www.movable-type.co.uk/scripts/latlong.html | Fórmula de haversine, `R = 6371e3`, erro do modelo esférico "typically up to 0.3%", "up to 0.55% crossing the equator". |
| https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/src/geo/lng_lat.ts e https://unpkg.com/@turf/helpers@7.2.0/dist/esm/index.js | MapLibre GL JS `distanceTo` usa lei esférica dos cossenos com `earthRadius = 6371008.8`; Turf usa o mesmo raio. |
| https://dados.recife.pe.gov.br/api/3/action/package_search e package_show (pacotes listados na seção 3) | Metadados, licença `odc-odbl`, datas e URLs dos arquivos de POIs. Todos os pacotes têm `metadata_created` em 2026-02-27, e os recursos têm `created` entre 2026-03-02 e 2026-07-07. |

## 3. Esquema dos dados

### 3.1 Esquemas de URL e intent por app

| App / esquema | Origem | Destino | Modo | Sem chave | Observação |
|---|---|---|---|---|---|
| `geo:0,0?q=lat,lng(rótulo)` (Android, convenção) | não | sim | não | sim | Abre o seletor entre todos os apps que declaram `geo:` (OsmAnd, Organic Maps, CoMaps e Google Maps, este último não verificado no manifesto por ser fechado). RFC 5870 não define `q`. |
| `google.navigation:q=lat,lng&mode=d|b|l|w` | não (sempre localização atual) | sim | sim (sem transporte público) | sim | OsmAnd também declara o esquema e lê só o ponto. |
| `https://www.google.com/maps/dir/?api=1&origin=lat,lng&destination=lat,lng&travelmode=walking|driving|transit|bicycling` | sim | sim | sim | sim | Abre o app Google Maps ou o navegador. No Android 12+, outros apps que declaram o host sem verificação não recebem o link (ver seção 5). |
| Apple Maps `https://maps.apple.com/directions?source=lat,lng&destination=lat,lng&mode=walking|driving|transit|cycling` | sim | sim | sim | sim | iOS 18.4+. OsmAnd declara o host `maps.apple.com` no Android. |
| OsmAnd `https://osmand.net/map/navigate?start=lat,lon&end=lat,lon&profile=pedestrian|car|public_transport|bicycle` | sim | sim | sim | sim | Código Android lê `end`; documentação web usa `finish`. |
| Organic Maps `om://route?sll=lat,lon&saddr=Origem&dll=lat,lon&daddr=Destino&type=pedestrian|vehicle|transit|bicycle` | sim | sim | sim | sim | Ordem dos parâmetros obrigatória. Alternativa https: `https://omaps.app/route?...` (HTTP 200 no teste com curl). |
| CoMaps `cm://route?sll=...&saddr=...&dll=...&daddr=...&type=...` | sim | sim | sim | sim | Alternativa https: `https://comaps.at/route?...` (não testada). |
| Waze `https://waze.com/ul?ll=lat,lng&navigate=yes` | não | sim | não (app de carro) | sim | Sem app, abre página web. |

### 3.2 POIs municipais (portal dados.recife.pe.gov.br, licença `odc-odbl`)

Datas: "criado no portal" é o campo `created` do recurso. Como todos os pacotes foram criados em 2026-02-27, essas datas registram a carga no portal atual e não a data de coleta; a data de referência dos dados não aparece nos metadados. "Frequência" é o campo do pacote.

| Conjunto (pacote) | Arquivo | Formato | Colunas de coordenada (nome exato, CRS) | Outras colunas usáveis | Criado no portal / frequência | Tamanho | Registros |
|---|---|---|---|---|---|---|---|
| unidades-basica-de-saude | unidades-basicas-de-saude-ubs.csv | CSV `;` UTF-8 | `latitude`, `longitude` (graus decimais; dicionário: "Coordenadas geográficas em graus decimais"; datum não declarado) | `nome_oficial`, `cnes`, `tipo_servico`, `endereço`, `bairro`, `horario` | 2026-03-06 / Semestral | 9.544 B | 22 |
| unidades-saude-da-familia-usf | unidades-de-saude-da-familia-usf.csv | CSV `;` | `latitude`, `longitude` | idem | 2026-03-06 / Semestral | 53.124 B | 131 |
| hospitais | hospitais.csv | CSV `;` | `latitude`, `longitude` | idem | 2026-03-02 / Semestral | 3.147 B | 6 |
| policlinicas | policlinicas.csv | CSV `;` | `latitude`, `longitude` | idem | 2026-03-04 / Semestral | 8.027 B | 11 |
| maternidades | maternidades.csv | CSV `;` | `latitude`, `longitude` | idem | 2026-03-02 / Semestral | 2.218 B | 3 |
| rede-de-atencao-a-saude-no-recife | rede-de-atencao-a-saude-no-recife.csv | CSV `;` | `latitude`, `longitude` | `tipo_unidade` (46 categorias, inclui UBS, USF, hospitais, policlínicas, maternidades, vacinação etc.) | 2026-03-04 / Semestral | 608.179 B | 1.051 (0 sem coordenada) |
| rede-de-saude-municipal | saude-municipal.geojson | GeoJSON, Polygon (contorno do prédio), lon/lat sem membro `crs` | geometria | `NMUNIDAD`, `NMENDUNID`, `NMPATRIM`, `CDTIPO` (sem bairro) | 2026-03-04 / Anual | 106.866 B | 132 |
| rede-de-educacao-municipal | unidades-de-ensino-municipal-do-recife-2023.csv | CSV `;` | `longitude`, `latitude` (nessa ordem no cabeçalho) | `tipo`, `escola`, `inep`, `rua`, `numero`, `bairro`, `qtd_alunos` | 2026-03-04 / Anual | 79.886 B | 357 (10 sem coordenada, 1 fora do município) |
| rede-de-educacao-municipal | escolas-municipais.geojson | GeoJSON, Polygon, lon/lat sem `crs` | geometria | `escola_codigo`, `escola_tipo`, `escola_nome`, `endereco`, `mec_codigo` (sem bairro) | 2026-03-04 / Anual | 277.892 B | 342 |
| unidades-educacionais-no-municipio | unidades-educacionais-2024.csv | CSV `;` | `LATITUDE`, `LONGITUDE` | `NOMEESCOLA`, `INEP`, `BAIRRO`, `SITUACAO` | 2026-03-06 / Anual | 55.783 B | 429 (352 com coordenada) |
| conviva-feiras-e-mercados | mercados-publicos.csv | CSV `;` | `latitude`, `longitude` | `nome`, `descricao`, `bairro` (dicionário diz `Mome`, arquivo diz `nome`) | 2026-07-07 / semestral | 2.376 B | 6 |
| malha-viaria-de-trens-do-grande-recife | estacoes-de-trem-do-grande-recife.geojson | GeoJSON; 36 Point (lon, lat, 0) e 6 LineString; sem `crs` | geometria | `name` | 2026-03-02 / "finalizada"; dicionário: responsável CBTU | 11.899 B | 36 estações (32 dentro do município) |
| mapas-de-limites-e-divisoes-territoriais | limites-dos-bairros-2023.geojson (usado para contar por polígono) | GeoJSON Polygon | geometria | `EBAIRRNOME`, `EBAIRRNOMEOF`, `CBAIRRCODI` | 2026-03-02 / Anual | 2.034.014 B | 94 bairros |

Coluna com nome de pessoa: `gestor` em unidades-de-ensino-municipal-do-recife-2023.csv. Colunas `fone` dos CSVs de saúde trazem telefone da unidade.

Metrô: o portal municipal tem as estações (conjunto acima, dados da CBTU, ODbL). OSM não foi consultado porque a fonte municipal existe; a licença do OSM é ODbL (https://www.openstreetmap.org/copyright, não acessada nesta investigação).

Contagem nos bairros-alvo (ponto dentro do polígono do bairro 2023 / ponto a até 1,5 km do limite do bairro; projeção EPSG:31985 para a distância):

| Conjunto | Boa Viagem | Casa Forte | Graças | Espinheiro | Madalena |
|---|---|---|---|---|---|
| UBS | 2 / 4 | 0 / 6 | 0 / 0 | 0 / 0 | 0 / 1 |
| USF | 3 / 5 | 0 / 10 | 0 / 8 | 1 / 9 | 1 / 11 |
| Hospitais | 0 / 0 | 0 / 3 | 0 / 3 | 0 / 3 | 0 / 3 |
| Policlínicas | 0 / 1 | 0 / 3 | 0 / 4 | 0 / 3 | 1 / 3 |
| Maternidades | 0 / 0 | 0 / 1 | 0 / 0 | 0 / 0 | 0 / 0 |
| Escolas municipais 2023 (CSV) | 7 / 21 | 1 / 37 | 0 / 27 | 2 / 25 | 5 / 31 |
| Escolas municipais (GeoJSON, centroide) | 6 | 0 | 2 | 1 | 3 |
| Mercados públicos | 0 / 0 | 0 / 1 | 0 / 3 | 0 / 2 | 1 / 3 |
| Estações de trem/metrô | 1 / 6 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 1 |

A estação contada dentro de Boa Viagem é "Estação Aeroporto". Divergência entre a coluna `bairro` e o polígono que contém o ponto: UBS 3 de 22, USF 13 de 131, hospitais 1 de 6, escolas 2023 38 de 346 com coordenada, mercados 1 de 6. A USF de Casa Forte aparece no arquivo rede-de-atencao (coluna `bairro`) e não aparece no arquivo de USF, o que indica versões diferentes entre os dois arquivos.

### 3.3 Distância em linha reta

Haversine: `a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)`, `d = 2R · atan2(√a, √(1−a))`, com R = 6.371.008,8 m (mesmo raio do MapLibre GL JS e do Turf). Comparação com a geodésica no elipsoide WGS84 (pyproj `Geod`), a partir de (-8,12; -34,90), 24 azimutes:

| Distância | Erro mínimo | Erro máximo | Erro relativo máximo |
|---|---|---|---|
| 500 m | -0,59 m | +2,71 m | 0,54% |
| 1.000 m | -1,18 m | +5,41 m | 0,54% |
| 1.500 m | -1,78 m | +8,12 m | 0,54% |

O erro máximo ocorre na direção norte-sul. Exemplo: Policlínica Lessa de Andrade até Mercado da Madalena: haversine 739,8 m, geodésica 736,1 m. As coordenadas dos arquivos têm de 5 a 11 casas decimais (5 casas equivalem a cerca de 1,1 m).

## 4. Resultado contra o critério de aprovação

- Sem chave e sem custo: atendido por todos os esquemas da tabela 3.1 (Google declara "You don't need a Google API key"; os demais são links ou esquemas de app sem autenticação).
- Origem, destino e modo num único esquema que abre "o app padrão do usuário": não atendido. O único esquema neutro com seletor do sistema (`geo:`) não tem origem nem modo (Android docs; RFC 5870). A Maps URL do Google tem os três campos, mas abre o Google Maps ou o navegador; o OsmAnd declara esse host sem verificação e, quando recebe o link, ignora `travelmode` (código-fonte).
- Origem, destino e modo por app: atendido em 5 de 6 apps pesquisados (Google Maps, Apple Maps, OsmAnd, Organic Maps, CoMaps). Waze não tem origem nem modo.
- Termos e botão ao lado de mapa MapLibre: a cláusula 3.2.3(e) proíbe usar "Google Maps Core Services with or near a non-Google Map"; a lista de Core Services (abril de 2026) não inclui Maps URLs, e a página de Maps URLs não cita os termos. Se a cláusula se aplica a um link de Maps URL ao lado de um mapa MapLibre fica na lista de dúvidas (seção 8).
- Conclusão contra o critério: parcial. A forma que reúne origem, destino e modo sem favorecer um fornecedor é um seletor do próprio app com uma linha por app de mapas, cada uma com o seu esquema.

## 5. Riscos e o que não foi possível verificar

- Não verificado em aparelho (sem emulador nesta tarefa): o que cada app faz ao receber os links; se o seletor do sistema aparece para `geo:`; se o Google Maps tem App Link verificado para `www.google.com/maps` (o manifesto é fechado; teste: `adb shell pm get-app-links com.google.android.apps.maps`).
- Android 12+: pelo texto oficial, uma Maps URL http/https vai para o app aprovado para o domínio ou para o navegador. OsmAnd declara `www.google.com/maps` sem verificação, então não deve receber esse link, a menos que o usuário associe o domínio manualmente (inferência a partir da documentação; não testado).
- OsmAnd: o código Android lê `end` e a documentação web usa `finish`; qual dos dois o app aceita na versão instalada é teste de aparelho. Os filtros de `osmand.net/map` não têm `autoVerify`; o domínio `osmand.net` tem assetlinks.json para `net.osmand` e `net.osmand.plus`, e se a verificação do domínio vale também para o caminho `/map` não foi verificado.
- Transporte público em Recife: não foi verificado se Google Maps, Apple Maps, OsmAnd (`public_transport`) ou Organic Maps/CoMaps (`transit`) têm dados de ônibus e metrô de Recife. A nota de lançamento do Organic Maps de 2026-06-15 (https://organicmaps.app/news/2026-06-15/organic-maps-beta-satellite-imagery-public-transport-routing-new-search/) foi vista só como resultado de busca.
- Waze responde a `geo:`: não verificado.
- Expo SDK 57: a página do Linking não documenta `<queries>`; como declarar `<queries>` no app.json/config plugin para listar só os apps instalados não foi verificado. Sem `<queries>`, `Linking.openURL` com tratamento da rejeição funciona pelo texto do Android ("startActivity() method doesn't require package visibility").
- Página de API do Organic Maps: `https://organicmaps.app/api/` respondeu 404; os parâmetros vêm do código-fonte, não de documentação publicada.
- Datas dos POIs: os metadados do portal registram a carga em 2026 (migração de 2026-02-27), não a data de referência dos dados. Hospitais (6) e maternidades (3) parecem cobrir só a rede municipal e parceiros; hospitais privados não foram procurados.
- Divergências bairro/polígono (seção 3.2) indicam que coordenada ou coluna `bairro` pode estar errada em parte dos registros; não houve conferência em campo.
- Acesso ao portal: houve timeouts e conexões recusadas intermitentes em `dados.recife.pe.gov.br`; downloads exigem seguir redirecionamento (`-L`) para URLs assinadas temporárias em `ckan-storage-download.app.emprel.gov.br`.

## 6. Plano B

Viável. Botão "Abrir no app de mapas" com `geo:0,0?q=<lat>,<lng>(<rótulo>)`: neutro (seletor do sistema entre os apps que declaram `geo:`), sem chave, sem termos de fornecedor. O que muda: o usuário escolhe a origem (o app usa a localização atual por padrão em Google Maps e Apple Maps; nos demais não verificado) e o modo dentro do app de mapas. Fallback se nenhum app tratar `geo:` (`openURL` rejeita): abrir uma URL https no navegador; qual URL usar é decisão de produto (Google Maps URL, osmand.net/map ou openstreetmap.org).

Variação documentada: seletor próprio com uma linha por app ("Google Maps", "OsmAnd", "Organic Maps", "CoMaps", "Waze", e "Apple Maps" no iOS), cada uma com origem, destino e modo do seu esquema (tabela 3.1), mais uma linha "Outro app" com `geo:`. Mostrar só apps instalados exige `<queries>` no Android e `LSApplicationQueriesSchemes` no iOS.

## 7. Roteiro reproduzível

Diretório: `scratchpad\inv4\` (dados em `dados\`, scripts em `scripts\`).

1. Metadados (seguir redirecionamento HTTP para HTTPS):
   ```bash
   curl.exe -sS "https://dados.recife.pe.gov.br/api/3/action/package_search?q=hospital&rows=20&fl=name,title"
   for p in unidades-basica-de-saude unidades-saude-da-familia-usf hospitais policlinicas maternidades rede-de-atencao-a-saude-no-recife rede-de-saude-municipal rede-de-educacao-municipal unidades-educacionais-no-municipio conviva-feiras-e-mercados malha-viaria-de-trens-do-grande-recife mapas-de-limites-e-divisoes-territoriais; do curl.exe -sS "https://dados.recife.pe.gov.br/api/3/action/package_show?id=$p" -o dados/pk_$p.json; done
   uv run --no-project python -I scripts/res.py dados/pk_*.json
   uv run --no-project python -I scripts/datas.py dados
   ```
2. Download de cada recurso com `curl.exe -sS -L -o <arquivo> "<url do campo url do recurso>"` para `dados/raw/` (repetir se vier página "Redirecting").
3. Contagens e conferência de colunas:
   ```bash
   uv run --no-project --with shapely python -I scripts/geo.py dados/raw/escolas-municipais.geojson dados/raw/estacoes-de-trem-do-grande-recife.geojson dados/raw/saude-municipal.geojson
   uv run --no-project --with shapely python -I scripts/conta.py dados/raw
   uv run --no-project --with shapely --with pyproj python -I scripts/buffer.py dados/raw
   uv run --no-project python -I scripts/rede.py dados/raw
   uv run --no-project --with pyproj python -I scripts/hav.py
   ```
4. Termos: baixar https://cloud.google.com/maps-platform/terms, .../terms/maps-services e .../terms/maps-service-terms, converter com `scripts/txt.py` e buscar `rg -n -i "non-google map|maps urls" dados/termos/*.txt`.
5. Código-fonte dos apps: baixar os arquivos citados na seção 2 e buscar `rg -n 'android:scheme|android:host|autoVerify'` e os nomes dos parâmetros.
6. Emulador ou aparelho (Android 12+ com Google Play; instalar OsmAnd, Organic Maps, CoMaps e Waze pela loja). Origem: Policlínica Lessa de Andrade (-8.05891382154,-34.9070090424); destino: Mercado da Madalena (-8.052439,-34.908554), ambos do portal. As aspas simples dentro das duplas evitam que o shell do aparelho interprete `&`:
   ```bash
   adb shell "am start -a android.intent.action.VIEW -d 'geo:0,0?q=-8.052439,-34.908554(Mercado%20da%20Madalena)'"
   adb shell "am start -a android.intent.action.VIEW -d 'google.navigation:q=-8.052439,-34.908554&mode=w'"
   adb shell "am start -a android.intent.action.VIEW -d 'https://www.google.com/maps/dir/?api=1&origin=-8.05891382154,-34.9070090424&destination=-8.052439,-34.908554&travelmode=walking'"
   adb shell "am start -a android.intent.action.VIEW -d 'https://www.google.com/maps/dir/?api=1&origin=-8.05891382154,-34.9070090424&destination=-8.052439,-34.908554&travelmode=transit'"
   adb shell "am start -a android.intent.action.VIEW -d 'https://osmand.net/map/navigate?start=-8.05891382154,-34.9070090424&end=-8.052439,-34.908554&profile=pedestrian'"
   adb shell "am start -a android.intent.action.VIEW -d 'https://osmand.net/map/navigate?start=-8.05891382154,-34.9070090424&finish=-8.052439,-34.908554&profile=pedestrian'"
   adb shell "am start -a android.intent.action.VIEW -d 'om://route?sll=-8.05891382154,-34.9070090424&saddr=Origem&dll=-8.052439,-34.908554&daddr=Destino&type=pedestrian'"
   adb shell "am start -a android.intent.action.VIEW -d 'cm://route?sll=-8.05891382154,-34.9070090424&saddr=Origem&dll=-8.052439,-34.908554&daddr=Destino&type=transit'"
   adb shell "am start -a android.intent.action.VIEW -d 'https://waze.com/ul?ll=-8.052439,-34.908554&navigate=yes'"
   adb shell pm get-app-links com.google.android.apps.maps
   adb shell pm get-app-links net.osmand
   ```
   Para cada comando, registrar: apareceu seletor? quais apps listados? app aberto preencheu origem, destino e modo? Repetir com o Google Maps desativado (`adb shell pm disable-user --user 0 com.google.android.apps.maps`, e depois `pm enable`) para ver o fallback no navegador.
7. No app Expo: chamar `Linking.openURL(uri)` com os mesmos URIs e registrar quando a Promise rejeita.

## 8. Dúvidas de licença ou termos de uso

1. A cláusula 3.2.3(e) dos Google Maps Platform Terms ("with or near a non-Google Map") se aplica a um link de Maps URL exibido ao lado de um mapa MapLibre, dado que Maps URLs não aparece na lista de Core Services?
2. Maps URLs, usado sem chave e sem conta, cria relação contratual com os Google Maps Platform Terms ou só com os termos do Google Maps para o usuário final?
3. Exibir o nome ou ícone de Google Maps, Waze, Apple Maps, OsmAnd, Organic Maps e CoMaps num seletor exige autorização de marca? (Nenhuma das páginas lidas trata de marca para links de saída.) Ver também a regra interna de marcas do Campus Mobile.
4. ODbL nos POIs municipais: forma de atribuição na tela e se a tabela derivada (POIs filtrados por bairro, com distâncias) é "Derivative Database" sujeita a share-alike.
5. A coluna `gestor` (nome de pessoa) publicada no CSV de escolas 2023 sob ODbL: a lista branca de ingestão a exclui; há outra restrição de uso para quem baixa o arquivo completo?
6. Estações de trem: dados atribuídos à CBTU publicados pela Prefeitura sob ODbL; a CBTU tem termos próprios para esses dados?
7. `utm_source` recomendado pelo Waze nos links: incluir o identificador do app é exigência ou recomendação?

## Fim

(a) Ofício ou LAI: "Solicito à Secretaria de Saúde e à Secretaria de Educação do Recife a data de referência (data da coleta ou da última atualização) dos arquivos de UBS, USF, hospitais, policlínicas, maternidades e unidades de ensino publicados em dados.recife.pe.gov.br, e o datum das colunas latitude e longitude."

(b) Próxima ação: rodar os comandos `adb` da seção 7 num emulador Android 12+ com Google Play e os quatro apps instalados, e preencher a tabela 3.1 com o comportamento observado.
