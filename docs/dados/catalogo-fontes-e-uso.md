# Catálogo Concentrado de Dados do VEREDA — Cobertura, Importância, Tempo e Local

**Inventário atualizado em:** 18 de novembro de 2026  
**Referência técnica:** branch `feat/vereda-visual-power-overhaul` · índice publicado [`indice-municipal/faa40c969275e6b5`](../aplicacao/VEREDA-APPLICATION-PLAN.md) (`2026-11-15T00:00:00Z`) · extração Hub Municipal (`15/11/2026`) · camadas ambientais e referências públicas (`27/10/2026`) · GTFS (`v2026.10.26`) · OSM (`13/11/2026`).  
**Objetivo:** consolidar de forma direta **o que temos hoje, nível de importância, recorte temporal, recorte local e lacunas** para orientar decisão de produto, engenharia de dados e entregas das duas frentes de dados.

---

## Como ler: estados e níveis de importância

| Eixo | Sigla / Estado | Significado operacional |
|---|---|---|
| **Importância** | **`P0 · Crítico`** | Espinha dorsal obrigatória: identifica lote/prédio, calcula custo/TCO real ou trava jurídica pré-sinal. |
| | **`P1 · Alto`** | Núcleo diferencial: sol/sombra 2.5D, vista e obras licenciadas, matrícula/CNM, rota a pé/GTFS e alagamentos. |
| | **`P2 · Médio`** | Contexto de entorno e rua: calor de superfície, Censo micro, zeladoria 156, noite/sinistros, LUSE e arboviroses. |
| | **`P3 · Expansão`** | Dado em cache fora do app, branch experimental, fornecedor pago sem contrato ou lacuna sujeita a LAI/campo. |
| **Situação** | **`Integrado`** | Ativo em pacote estático assinado (SHA-256) no app; não é feed ao vivo nem validado em campo por clientes. |
| | **`Local-first`** | Gerado ou colado no aparelho do usuário (anúncios, atas, matrícula, visitas, sinal); sem nuvem nem treino de IA. |
| | **`Cache / Exp.`** | Baixado no cache local (`.cache/`, fora do Git) ou branch separada (`dados/crime-recife`), fora do fluxo de produção. |
| | **`Avaliado / LAI`** | Fornecedor cotado em triagem (`20/10/2026`, `0` contratos) ou lacuna com pedido LAI preparado (`P01–P17`, `0` enviados). |

**Regras de leitura:** ausência nunca vira zero (`não se aplica` ≠ `sem ocorrência no período` ≠ `ainda não sabemos`); datas de **evento**, **protocolo**, **publicação**, **extração** e **observação** permanecem separadas.

---

## Síntese executiva para as 2 frentes de dados

### As 4 escalas espaciais do produto (não misturar coberturas)

| Escala local | Cobertura verificada em 18/11/2026 | O que entra nessa escala |
|---|---|---|
| **1. Município do Recife (`IBGE 2611606`)** | `94` bairros oficiais · `114.079` lotes (`DSQFL`) | IPTU, ITBI, Licenciamento, LUSE, 156, Defesa Civil, Iluminação, CTTU, Calor Landsat (`100 m`, `178×256`), Relevo `GLO-30` (`30 m`, `115×165`), Censo Renda (`2.814` setores) e CNEFE (`5.661` serviços ativos). |
| **2. Índice cadastral publicado no app** | **`72` bairros** · **`7.206` edifícios** | Fichas prediais básicas, cadastro IPTU/ITBI, obras até `150 m`, parâmetros federais (`BCB`/`ANEEL`/`SPU`) e simuladores locais. |
| **3. Camadas profundas por edifício** | **`6` bairros · `2.825` edifícios** (`2.688` nos 5 piloto + `137` na Torre; `2.643` com vínculo forte OSM) | Rede caminhável, destinos cotidianos, GTFS, bloco noturno, consequências de alagamento e entorno solar. **Sem cobertura imobiliária RMR demonstrada.** |
| **4. Unidade / Apartamento (no aparelho)** | Sob demanda do usuário | Andar, fachada 2.5D, leitura de anúncio/matrícula/ata, checklist de visita, internet por cômodo e finanças pessoais. |

- **Para a Task 1 (o que temos hoje):** **`17` conjuntos integrados** (`5` `P0`, `7` `P1`, `5` `P2`) cobrindo do cadastro fiscal/registral até microclima de satélite, rotas programadas e cofre documental pré-sinal.
- **Para a Task 2 (cache, gargalos e expansão):** **`71` arquivos brutos do Hub** em `.cache/` (`29` principais + `42` complementares), **`1` branch experimental** (`dados/crime-recife`), **`7` APIs pagas triadas** (`0` contratadas), **`17` pedidos LAI preparados** (`P01–P17`, `0` enviados) e **`259` revisões humanas pendentes**.

---

## 1. O que temos integrado ao produto hoje (Inventário, Importância e Recortes)

| Conjunto e volume | Importância | Recorte temporal e atualização | Recorte local e granularidade | Uso atual e limite conhecido |
|---|---|---|---|---|
| **Cadastro municipal de lotes, edifícios e bairros (`DSQFL`)**: geometrias, pavimentos e vínculo imóvel-lote (`114.079` lotes). | **`P0`** | Modificado `02/03/2026`; extração Hub `15/11/2026`. Ciclo planejado trimestral (depende da Prefeitura). | Recife (`94` bairros oficiais); no app: `72` bairros / `7.206` edifícios (`2.825` nos `6` bairros profundos). | Chave espinha dorsal; não assume `lote = edifício = apartamento` nem confirma entrada física; ambiguidades ficam explícitas. |
| **IPTU Recife**: área, ano construtivo, padrão, tipologia e valor fiscal (`422.910` bruto Hub; `413.750` lidos no manifesto `15/11`). | **`P0`** | Exercício `2026` (mod. `03/10/2026`). Atualização vinculada à republicação municipal e ao índice. | Recife, por inscrição/lote ligado ao `DSQFL` quando casado. | Identidade e contexto fiscal; contém CPF/CNPJ mascarados na origem; **valor fiscal não é preço anunciado nem de venda**. |
| **ITBI Recife + Regras Tributárias (`LC nº 227/2026`)**: transmissões fiscais (`144.576` processados `2016–2026`; `15.078` linhas no Hub `2026`). | **`P0`** | Série `2016–2026` (mod. `03/10/2026`); `LC nº 227/2026` sancionada `13/01/2026`. | Recife por imóvel declarado (sem ID estável de apartamento); quartis em `1.319` prédios (`630` homogêneos `≤20%`). | Referência fiscal agrupada e simulação de fechamento (`1%` SFH / `1,8%` 180d / `3%`); **não traz valor declarado de venda** nem comparável automático. |
| **Terrenos de Marinha / SPU e Limites Costeiros (`ESIG`)**: faixa litorânea, rios e `9` bairros históricos de ilhas/aterro. | **`P0`** | ESIG consultado `27/10/2026`; `DL 9.760/1946` e `DL 2.398/1987` vigentes (`PEC 3/2022` em tramitação). | Orla e zonas alagáveis/aterradas do Recife (triagem espacial por polígono/bairro). | Alerta de foro (`0,6%`), ocupação (`2%`), laudêmio (`5%` sobre domínio pleno do terreno × fração ideal), bloqueio FGTS/Caixa e `CAT` (`90d`); exige certidão SPU. |
| **Cofre Local-First do Usuário (Anúncios, Matrícula/CNM 16d, Atas e Visitas)**: parser, chaves duplas `Lote 14d + CNM`, rateio e travas. | **`P0`** | Em tempo real no aparelho; validades legais de referência (`30d` ônus, `90d` `CAT`, `180d` ITBI, trienal `Lei PE 13.032/2006`, corte `AQUA-PE` `23/11/2026`). | Unidade/apartamento e condomínio específico escolhidos pelo usuário. | Leitura determinística (`6` campos da matrícula, travas `bloqueia`/`depende_de`, déficit de reserva); **não substitui certidão nem conferência cartorária**; `0` envio à nuvem. |
| **Parâmetros Oficiais BCB, ANEEL e Tarifas VEM/CBTU (`referencias-publicas.json`)**: juros, energia B1 e passagens. | **`P1`** | `BCB SGS 20774` (`11,28% a.a.`, ref. `08/2026`, cons. `27/10/2026`); `ANEEL Res. 3.583/2026` (`29/04/2026–28/04/2027`, `R$ 0,79886/kWh` / `R$ 1,0625/kWh`); Anel A `R$ 4,50`, Metrô `R$ 4,25`. | Referência municipal (energia/transporte) e nacional (crédito). | Motor `Price + TCO 10 anos`, custo mensal estimado de ar-condicionado e mobilidade; conta real varia conforme consumo e contrato. |
| **Geometria Solar 2.5D, Fachadas e Brisa E-SE (`motorSombra25D`)**: polígonos, orientação viária e altura por pavimentos. | **`P1`** | Solstícios (`21/12` verão e `21/06` inverno) sobre snapshot predial e licenças de obra. | `2.825` edifícios nos `6` bairros + estimativa por via/polígono onde houver geometria. | Sombras no solo, auto-sombreamento de paredes, oclusão por andar e vetor de brisa `125°`; **não modela copa fina nem temperatura interna**. |
| **Licenciamento Urbanístico de Obras**: alvarás e requerimentos (`118.607` bruto Hub; `39.067` filtrados `Obra`; `DSQFL` em `117.754`). | **`P1`** | Mod. `19/10/2026`; entrada (`118.607`), conclusão (`115.837`), emissão (`36.562`) e validade (`36.255`). | Recife por endereço/`DSQFL`; cruzamento em raios de `85–150 m` do prédio. | Radar de vista (`±42°`), recuo `LC 2/2021` e ritmo `12m × 12m`; **snapshot pontual sem histórico de transições nem prova de obra ativa**; contém CNPJ/razão social. |
| **Rede Caminhável OpenStreetMap (OSM)**: vias, acessos e barreiras (`nordeste-261113.osm.pbf`). | **`P1`** | Dados até `13/11/2026` (Geofabrik); exige nova extração e build para atualizar. | Recife + margem `1,5 km` (`273.529` nós, `300.703` arestas; vínculo forte `93,6%` piloto / `92,7%` Torre). | Menor caminho a pé da fachada candidata (`255` barreiras e `1.731` vias restritas filtradas); **sem modelo confiável de rampa ou calçada contínua**. ODbL. |
| **GTFS Transporte Público + Corredores e Metrô**: viagens programadas, paradas e estações. | **`P1`** | Versão fixada `v2026.10.26` (SHA-256, válida até `26/10/2027`, atualização manual). | `2.822` paradas no Recife (`5.376/7.208` ligadas ao grafo) + `1.492` pontos `≥180` partidas/dia e `30` estações CBTU (`camadas-ambientais.json`). | Caminhada + espera programada, rotina de `2` destinos e causas de ruído sem `dB`; `87.678` viagens conferidas (`20/20`); **sem atraso, lotação ou tempo real**. |
| **Destinos Cotidianos, Praças e Árvores Tombadas**: POIs municipais/OSM reconciliados e verde urbano. | **`P1`** | Snapshot do ciclo + camada ambiental `27/10/2026`. | `7.272` locais canônicos nos `6` bairros (`476` fusões, `7.241` na rede; `44` revisões `G-POI` pendentes) + `499` praças e `49` árvores tombadas. | Busca a pé (`48` mercearias, `53` farmácias, `90` praças no piloto); contagem mapeada **não prova completude, estoque nem abertura hoje**. |
| **Defesa Civil (Alagamentos) + Relevo `GLO-30` e Rios/Canais**: chamados hídricos + altitude `30 m`. | **`P1`** | Defesa Civil `2014–2024` (`886.263` linhas; `1.645` alagamentos -> `763` obs., `31` episódios; `2025` com `1` linha em 3 CSVs) + `GLO-30` cons. `27/10/2026`. | `182` trechos na rede caminável (`176` ambíguos; `38` revisões `G-RAIN` pendentes) + grade `115×165` (`31` rios, `2.768` pontos) no Recife. | Contexto histórico e topográfico; `726` relatos com dia exato vs. `919` só com ano; **não é previsão de enchente nem prova calçada bloqueada**. |
| **Calor de Superfície Landsat 8/9 (`ST_B10` 100 m)**: temperatura radiométrica da superfície. | **`P2`** | `4` cenas `2023–2025` (`14/06/2023` a `16/04/2025`, nuvens `5,78%–14,66%`), cons. `27/10/2026`. | Grade `100 m` (`178×256`) cobrindo os `94` bairros do Recife. | Contraste térmico da quadra frente à mediana do bairro; resolução `100 m` **não mede temperatura interna de cômodos**. Domínio Público (USGS). |
| **IBGE Censo 2022 (Entorno, Amostra, Renda) e CNEFE**: faces de quadra, renda e estabelecimentos. | **`P2`** | Referência `2022` (modificados IBGE `2024–2026`); próximo ciclo depende do IBGE. | CNEFE `737.511` (`5.661` serviços filtrados); Entorno `5.637` setores; Amostra `2.885` áreas; Renda `2.814` setores (`18` em sigilo). | Contexto micro da quadra e renda territorial; estatística censitária **não é atributo do morador nem garante comércio aberto**. Citar IBGE. |
| **EMLURB / Central 156 e Coleta Urbana**: chamados de drenagem, conservação, luz e coleta. | **`P2`** | Janela selecionada `20/06/2025–19/06/2026` (`175.878` linhas); CSV 2026 `61.225` (coord. `50,6%`); recursos 2025 duplicados (`86.966` e `114.653`). | Recife por endereço/coordenada (sem auditoria posicional) + `5.046` pontos de coleta. | Sinal contextual por rua/noite; **chamado não comprova dano vigente nem reparo concluído**; recursos 2025 não devem ser somados. |
| **Iluminação Pública, Sinistros CTTU e LUSE (Ruído/Atividades)**: sinais noturnos e fontes sonoras. | **`P2`** | Iluminação `111.666` pts (`14.571` chamados `01/2025–01/2026`); CTTU `2022–2024` (`12.016` linhas, `2024` sem coord.); LUSE `49.924` (sem período). | Recife; LUSE até `150 m` / vias a `80 m`; `577` ligações de pedestres CTTU no bloco noturno. | Contexto noturno e causas potenciais de ruído **sem exibir `dB` nem nota de segurança**; cadastro de luminárias intitula-se “pontos desativados”. |
| **Arboviroses (`SINAN` / Saúde Recife) e Internet no Imóvel**: notificações e teste presencial. | **`P2`** | SINAN `2023–2025` (`29.236` registros anuais agregados); teste de internet na data da visita. | `112` recortes/bairros no JSON ambiental + cômodos do imóvel no aparelho. | Série epidemiológica histórica por bairro (ODbL) e orientação de checagem presencial de sinal/fibra na última milha. |

---

## 2. Dados extraídos em cache, experimentais e oportunidades de expansão (Backlog)

A extração municipal de **15/11/2026** soma **29 recursos principais + 42 complementares (`71` arquivos)** em `.cache/dados-recife/hub-2026-11-15` (ignorado pelo Git; ver [manifesto](../aplicacao/manifesto-extracao-hub-2026-11-15.json) e [relatório](../aplicacao/extracao-hub-2026-11-15.md)). **Estar em cache não significa estar validado ou integrado.**

| Fonte / Frente | Importância | Extensão temporal e volume | Recorte local | Bloqueio e condição para uso no produto |
|---|---|---|---|---|
| **Novas publicações Hub Recife / IBGE / OSM / GTFS** | **`P1`** | Hub `15/11/2026`, IBGE `2022`, OSM `13/11/2026`, GTFS `v2026.10.26–2027`. | Ampliação de `6` para `72` bairros profundos ou RMR. | RMR não demonstrada; exige dicionário, checagem de esquema, vínculo por município e `259` revisões humanas (`G-BUILDING`/`G-POI`/`G-RAIN`/transporte). |
| **Macrodrenagem / eSIG** | **`P2`** | `514` feições em cache (`236` `CONCLUÍDO`, mas `21` dizem `“NÃO FOI LIMPO”`). | Recife (rede de canais e macrodrenagem). | Conflito semântico de conclusão vs. limpeza efetiva; depende do pedido LAI **P04**. |
| **Branch experimental `dados/crime-recife`** | **`P2` / `P3`** | `11/2025–10/2026` (12m móveis via Crime Brasil/SDS-PE), `~9.418` registros. | `26` bairros (sem Pau-Ferro; ~`4%` sem bairro; sem rua). | Fora de `main`: subnotificação, licença bruta SDS-PE não declarada e raspagem sem autorização; substituir via LAI **P12**. |
| **Ciclovias, Paraciclos, Bike PE e Calçadas** | **`P2` / `P3`** | `558` permanentes + `79` Conecta; `562` CSV / `511` GeoJSON paraciclos (3× duplicado); `90` Bike PE; calçadas `129`/`159`/`40`. | Trechos selecionados no Recife. | Não formam rede contínua nem trazem largura, rampa, obstáculo ou estado atual; depende de **P09** e campo. |
| **APAC: chuva recente** | **`P2` / `P3`** | `20` estações com acumulados recentes (sensor municipal analisado termina em `26/02/2026`). | Estações pontuais, sem grade por rua. | Valores negativos/antigos e discrepância de `3h` entre `IDUNICO` e `DATAHORA` em `7.807/7.808` linhas; depende de **P02** / **P13**. |
| **Empresas ativas/inativas + Equipamentos / Semáforos** | **`P3`** | `439.905` ativas + `421.722` inativas (`incomodo = N` em `100%`); `68` cultura, `132` saúde, `712` semáforos (`67` sonoros). | Recife (com razão social e CNPJ no bruto). | Status fiscal não prova funcionamento ou ruído; requer mascaramento de PII e auditoria operacional. |

---

## 3. Fornecedores pagos avaliados e 17 lacunas / pedidos LAI (`P01–P17`)

### Fontes e APIs pagas avaliadas (`20/10/2026` — `0` contratadas, `0` gasto)

| Fornecedor / Serviço | Importância potencial | Capacidade avaliada | Pendência para contratação |
|---|---|---|---|
| **Kenlo Open API, DataZAP, Loft Dados, Geobrain** | **`P1`** | Inventário de ofertas com IDs estáveis, área, retiradas e histórico de mercado autorizado. | Cotação vigente, cobertura no Recife, amostra e direitos de cache/exibição (`VE10` adiou; raspagem de portais não é autorizada). |
| **Google Maps Platform, Mapbox, Geoapify** | **`P2`** | Geocodificação, isócronas, rotas a pé e POIs comerciais complementares. | Custo/cota, restrições contratuais de cache/armazenamento permanente e atribuição. |
| **Google Document AI / Open-Meteo Comercial** | **`P3`** | OCR em nuvem para PDFs extensos; previsão/séries comerciais meteorológicas. | Document AI envolve custo/retenção/privacidade de PDFs do usuário; Open-Meteo não substitui sensor local. |

Ver [triagem de APIs e fornecedores (20/10/2026)](../../ignorar/produto-historico/2026-10-20/03-APIS-E-FORNECEDORES.md).

### Lacunas críticas e pedidos LAI preparados (`11` Recife · `5` PE · `1` CNJ — `0` enviados)

| Importância | Lacuna / Impedimento | Códigos LAI e necessidade objetiva | Por que falta hoje |
|---|---|---|---|
| **`P1`** | **Preço real de venda e chave estável da unidade** | **P07** (SEFIN valor declarado + chave protegida) e **P17** (CNJ/ONR). | ITBI traz só avaliação fiscal e sem identificador único da unidade autônoma. |
| **`P1`** | **Vistorias, interdições e histórico de alvarás / habite-se** | **P03**, **P05** e **P06** (Defesa Civil e Licenciamento). | Relato cidadão não é laudo (`1` linha nos CSVs 2025); snapshot não guarda transições de status nem vigência real. |
| **`P1`** | **Fechamentos de via, chuva horária e drenagem executada** | **P01** (CTTU desde `2022`), **P02**/**P13** (chuva/maré com fuso) e **P04** (eSIG). | Chamado 156 não marca início/fim de bloqueio; conflito `3h` em `7.807/7.808` linhas e `21` obras eSIG conflituosas. |
| **`P1`** | **Ofertas comparáveis históricas licenciadas** | Contrato / parceria autorizada (sem LAI aplicável). | App só guarda anúncios trazidos pelo usuário; raspagem direta não é autorizada. |
| **`P2`** | **Criminalidade mensal por bairro e pontualidade de ônibus** | **P12** (SDS-PE desde jan/`2014`) e **P15** (AVL/GTFS-RT). | Abertos da SDS são por município/região; GTFS só mostra grade programada, não viagens executadas. |
| **`P2`** | **Calçadas contínuas, luminárias e ruído/copas medidos** | **P08** (árvores), **P09** (calçadas/rampas), **P10** (156/luz), **P11** (ruído). | Apenas `~4%` das árvores têm copa/altura (muitas de `2007`); `incomodo = N`; duplicatas no 156. |
| **`P3`** | **Falta d’água, áreas contaminadas, microclima e internet interna** | **P14** (Compesa), **P16** (CPRH) e medição presencial/sensores. | Sem série georreferenciada pública; grade `100 m` / operadora não resolve último metro dentro do apartamento. |

Detalhes de protocolo em [pedidos LAI preparados](../aplicacao/pedidos-lai-recife.md).

---

## 4. Combinação por fluxo no app e governança

| Pergunta do usuário no VEREDA | Fontes cruzadas hoje | O que entrega com segurança (e onde para) |
|---|---|---|
| **Que prédio é este e qual a chave?** | Cadastro `DSQFL`, lotes, IPTU, OSM + CNM `16d` de docs locais | Localiza o prédio e separa chave municipal de matrícula; não confirma torre/apartamento sem revisão. |
| **Quanto custa entrar e morar em 10 anos?** | IPTU, ITBI, `LC 227/2026`, `SPU`/`ESIG`, `BCB`, `ANEEL`, anúncio | TCO real (`entrada + fechamento + parcela + rotina + SPU`); preço final e cota condominial exigem boleto e matrícula. |
| **Este apartamento é fresco, claro e silencioso?** | Motor solar `2.5D`, licenças `150 m`, `Landsat 100 m`, `LUSE`, `GTFS`, `156` | Simula sol/oclusão por andar e brisa, e decompõe causas de barulho sem `dB` falso; **não mede ruído ou calor dentro do quarto**. |
| **Qual o risco de chuva, rua e rotina a pé?** | Defesa Civil, `GLO-30`, hidrografia, OSM, `GTFS v2026.10.26`, Censo `2022` | Histórico de alagamento, cota altimétrica, caminhabilidade e duelo a dois; não prevê alagamento nem garante acessibilidade. |
| **O que falta para assinar o sinal?** | Cofre local (`auditorDocumental`), prazos (`30d`/`90d`/`180d`), `AQUA-PE` | Aponta travas `bloqueia`/`depende_de`, `6` campos da matrícula e roteiro ao síndico; requer certidões atualizadas. |

### Regras de operação e dívida técnica de qualidade
- **Pipeline e integridade:** coleta local em `scripts/dados/ciclo.mjs` com validação Zod, SHA-256, backup e rollback testado; `.cache/` permanece fora do Git (`manifesto` não recompila o bruto sem novo download).
- **Pendências humanas:** **`259` linhas de revisão amostral pendentes** (`G-BUILDING`, `G-POI`, `G-RAIN`, transporte) e **`0` validações com usuários finais** até `VE17`.
- **Arquitetura mestre e governança:** alinhado ao [Documento Mestre](../ARQUITETURA_MESTRE.md) e [Arquitetura e Dados](../plano-recife/03-ARQUITETURA-E-DADOS.md).

---

## Referências internas

- [Arquitetura Mestre VEREDA (17/11/2026)](../ARQUITETURA_MESTRE.md) · [Arquitetura e Dados](../plano-recife/03-ARQUITETURA-E-DADOS.md) · [Registro SOTA de Evolução (S0–S99)](../../SOTA_EVOLUTION_LOG.md)
- [Plano da Aplicação](../aplicacao/VEREDA-APPLICATION-PLAN.md) · [Feature Register](../aplicacao/FEATURE-REGISTER.md) · [Epoch Tracker](../aplicacao/EPOCH-TRACKER.md) · [Runbook de Atualização](../aplicacao/RUNBOOK-ATUALIZACAO.md)
- [Pedidos LAI Preparados (`P01–P17`)](../aplicacao/pedidos-lai-recife.md) · [Triagem de APIs (20/10/2026)](../../ignorar/produto-historico/2026-10-20/03-APIS-E-FORNECEDORES.md)
- [Pesquisa do Hub (15/11/2026)](../aplicacao/pesquisa-hub-dados-recife-2026-11-15.md) · [Manifesto Hub](../aplicacao/manifesto-extracao-hub-2026-11-15.json) · [Manifesto Complementar](../aplicacao/manifesto-extracao-complementar-2026-11-15.json)
- Avaliações por capacidade: [VE03](../aplicacao/execucoes/VE03/evaluation.md) · [VE04](../aplicacao/execucoes/VE04/evaluation.md) · [VE05](../aplicacao/execucoes/VE05/evaluation.md) · [VE06](../aplicacao/execucoes/VE06/evaluation.md) · [VE08](../aplicacao/execucoes/VE08/evaluation.md) · [VE10](../aplicacao/execucoes/VE10/evaluation.md) · [Auditoria VE17](../aplicacao/execucoes/VE17/auditoria.md)
