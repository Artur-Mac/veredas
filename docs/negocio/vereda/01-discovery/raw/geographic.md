# Análise Geográfica e de Entrada no Mercado — VEREDA (Agente D2 — Deep Mode)

**Phase:** 3 — Market Research (Wave 4, Agent D2)
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** Alta para Recife/PE, índices cadastrais locais e arcabouço jurídico-regulatório nacional (SPU, ONR/RI Digital, DataJud, ODbL 1.0, leis estaduais de vistoria predial); Média-Alta para custos exatos de certidões fora de PE/SP/RJ/SC (variação por ISS municipal e páginas excedentes); Baixa / `DATA GAP` confirmado para microdados abertos GIS/ITBI/alvarás na RMR fora da capital (Jaboatão dos Guararapes, Olinda e Paulista).

---

## Resumo Executivo

1. **A armadilha da expansão `V1` (mapas micro-urbanos):** Replicar o pipeline cadastral/ambiental do Recife (`10.761 LOC`) `[Data]` em outras capitais exigiria `3,5–6 meses (210–360h)` por cidade mais `15–30h/mês` de manutenção `[Data]`, sendo **inviável** para um time de `10–20h/semana` `[Opinion]`. Além disso, **5 das 7 capitais-benchmark** (RJ, BH, Curitiba, Fortaleza e Salvador) agregam ou bloqueiam microdados essenciais de IPTU, ITBI ou alvarás construtivos `[Data]`, restando apenas **São Paulo** (`GeoSampa` + `ITBI Fazenda SP`) e parcialmente **Porto Alegre** (`DataPOA`/`GeoPOA`) como alvos viáveis para ETL futuro `[Data]`.
2. **Recife além do piloto já está pronto no cadastro, mas a RMR é um deserto de dados abertos:** O índice municipal publicado do Recife (`versão 1e393803851f3fd5`) já cobre **`72` de `94` bairros** e **`7.206` edifícios (`188.247` unidades)** com `100%` de integridade geométrica nos `9` bairros prioritários de expansão (`Torre`, `Boa Vista`, `Tamarineira`, `Pina`, `Parnamirim`, `Aflitos`, `Rosarinho`, `Ilha do Leite`, `Jaqueira` = **`+979` edifícios**) `[Data]`. Em contraste, **Jaboatão dos Guararapes, Olinda e Paulista** são **`DATA GAP` de dados abertos reutilizáveis** (sem CKAN/GeoJSON aberto de lotes/ITBI/alvarás) `[Data]` — justamente onde se concentram **`270` de `431` (`62,6%`) dos prédios-caixão de alto risco** da RMR `[Data]`.
3. **Vetor B (`V2` Documental Nacional + Cunha Litorânea SPU) destrava escala nacional imediata:** A diligência pré-contratual (`V2`: Atas/Balancetes/Convenção + Matrícula ONR/RI Digital + SPU Terreno de Marinha + Passivos/Leilões) roda **sem ETL municipal customizado**, apoiada em upload/OCR local (`F11/F34/F35`) `[Data]`, no **RI Digital/ONR** (100% dos estados integrados) `[Data]` e numa **única camada nacional geoespacial da SPU** (via SPUNet/INDE) `[Data]` que captura **500 mil a 600 mil imóveis** sujeitos a **5% de laudêmio** nas maiores praças costeiras (`Recife`, `Florianópolis`, `Santos/Baixada Santista`, `Vitória`, `Rio/Zona Sul-Barra`, `Salvador`) `[Data]`.
4. **Sequenciamento recomendado:** **Fase 0/1** consolida Recife (`V1` congelado no índice existente + expansão leve para bairros já prontos) e abre a RMR (`Jaboatão/Piedade-Candeias`, `Olinda`, `Paulista`) exclusivamente via **`V2`** `[Opinion]`. **Fase 2** escala `V2` para cidades litorâneas de alto impacto SPU e emolumentos moderados (**Florianópolis/SC** ou **Santos/SP** como Cidade #2, evitando absorver emolumentos de `R$ 108–193+` do RJ na tarifa fixa) `[Opinion]`. **Fase 3** ataca metrópoles não-costeiras de altíssima liquidez (**São Paulo**, **Porto Alegre**, **Curitiba**) via `V2` condominial/registral e, somente com tração de receita, avalia ETL `V1` seletivo em `GeoSampa`/`DataPOA` `[Opinion]`.

---

## 1. Realidade Recife Cidade Inteira vs. RMR (`Jaboatão, Olinda, Paulista`)

### 1.1 O que já está pronto no Recife além dos 5 bairros piloto

Na base de código ativa do VEREDA (`src/dados/recife/indice-municipal/1e393803851f3fd5/cobertura.json` e `docs/dados/literatura/parecer-tecnico.md`), o Recife já superou o recorte inicial de 5 bairros no **índice cadastral básico**, embora as camadas contextuais pesadas (`V1`: `essenciais`, `transito`, `chuva`, `noite`, `sol`) permaneçam restritas `[Data]`:

| Recorte no Recife | Bairros | Edifícios | Unidades | Com ITBI (histórico) | Com Quartis ITBI (`valorUnidade`) | Elegíveis Régua Homogênea | Cobertura `V1` (Camadas + Sol) |
|---|---:|---:|---:|---:|---:|---:|---|
| **Piloto Original** (`Boa Viagem, Graças, Madalena, Espinheiro, Casa Forte`) | 5 | `2.688` `[Data]` | `79.475` `[Data]` | `2.376` `[Data]` | `1.319` `[Data]` | `630` `[Data]` | Camadas `V1` ativas nos 5; Sol em 4 (`0%` na **Madalena**) `[Data]` |
| **9 Bairros-Alvo de Expansão** *(listados abaixo)* | 9 | `979` `[Data]` | `32.208` `[Data]` | `759` `[Data]` | `414` `[Data]` | n/d no agregado | Apenas **Torre** tem camadas `V1` (`areas.json`); `0%` Sol nos 9 `[Data]` |
| **Índice Municipal Completo (Habilitados)** | 72 (de 94) | `7.206` `[Data]` | `188.247` `[Data]` | `5.243` `[Data]` | `2.421` `[Data]` | n/d no agregado | `21` bairros `sem_registros_elegiveis`; `Macaxeira` retida (`8` ed.) `[Data]` |

Detalhamento dos **9 bairros de expansão imediata no Recife** que já residem limpos no índice (`fracaoInterna = 1,0` em todos, indicando `100%` dos polígonos validados dentro do perímetro oficial) `[Data]`:

| Bairro (Recife) | Edifícios no Índice | Unidades | Prédios c/ ITBI | Prédios c/ Quartis ITBI | Status de Camadas `V1` / Prontidão |
|---|---:|---:|---:|---:|---|
| **Boa Vista** | `267` `[Data]` | `7.845` `[Data]` | `172` `[Data]` | `77` `[Data]` | Índice pronto; sem camadas `V1` nem Sol `[Data]` |
| **Tamarineira** | `159` `[Data]` | `4.236` `[Data]` | `125` `[Data]` | `58` `[Data]` | Índice pronto; sem camadas `V1` nem Sol `[Data]` |
| **Torre** | `137` `[Data]` | `6.056` `[Data]` | `114` `[Data]` | `68` `[Data]` | **Já habilitada em `areas.json`** (`essenciais`, `chuva`, `noite`, `transito`); sem Sol `[Data]` |
| **Pina** | `129` `[Data]` | `5.103` `[Data]` | `92` `[Data]` | `60` `[Data]` | Índice pronto; forte incidência SPU/marinha; sem camadas `V1` `[Data]` |
| **Parnamirim** | `92` `[Data]` | `2.673` `[Data]` | `84` `[Data]` | `59` `[Data]` | Índice pronto; alto ticket Zona Norte; sem camadas `V1` `[Data]` |
| **Aflitos** | `70` `[Data]` | `2.128` `[Data]` | `64` `[Data]` | `37` `[Data]` | Índice pronto; sem camadas `V1` `[Data]` |
| **Rosarinho** | `65` `[Data]` | `2.879` `[Data]` | `58` `[Data]` | `38` `[Data]` | Índice pronto; sem camadas `V1` `[Data]` |
| **Ilha do Leite** | `36` `[Data]` | `675` `[Data]` | `27` `[Data]` | `6` `[Data]` | Índice pronto; perfil médico/comercial; baixa densidade ITBI (`6` quartis) `[Data]` |
| **Jaqueira** | `24` `[Data]` | `613` `[Data]` | `23` `[Data]` | `11` `[Data]` | Índice pronto; enclave nobre compacto; sem camadas `V1` `[Data]` |
| **Subtotal (9 bairros)** | **`979`** `[Data]` | **`32.208`** `[Data]` | **`759`** `[Data]` | **`414`** `[Data]` | Soma `+36,4%` sobre os `2.688` prédios piloto sem novo ETL `[Data]` |

*Limitações verificadas na própria capital:* Mesmo dentro do Recife, os dados críticos de alagamento da Emlurb permanecem congelados em `08/2022` (e o Plano de Contingência 2026 ainda reproduz pontos críticos com referência EMLURB de `2015`) `[Data]`; a cobertura solar (`IMPLEMENTACAO-E-REVISAO.md`) atende apenas 4 dos 5 bairros iniciais (`0%` na Madalena) `[Data]`; e dos `94` bairros totais, `21` têm `0` edifícios elegíveis (ex.: `Brasília Teimosa`, `Cabanga`, `Ilha Joana Bezerra`, `Linha do Tiro`, `Cohab`, `Alto do Mandu`) e `Macaxeira` está retida por geometria `[Data]`. Além disso, `Boa Viagem` concentra sozinha `1.879` dos `2.688` prédios piloto (`69,9%`) `[Data]`.

### 1.2 RMR (`Jaboatão dos Guararapes, Olinda, Paulista`): Deserto de Dados Abertos vs. Epicentro dos Prédios-Caixão

A investigação dos portais oficiais dos três principais municípios vizinhos da RMR comprova que **não existe infraestrutura de dados abertos equivalente a `dados.recife.pe.gov.br` (CKAN, ODbL)** `[Data]`:

* **Jaboatão dos Guararapes (`DATA GAP` para microdados GIS/ITBI/Alvarás):** Mantém Portal de Transparência orçamentária (`jaboatao.pe.gov.br`) e Portal do Contribuinte para emissão individual de guias de IPTU/ITBI (`municipioonline.com.br`) `[Data]`. Utiliza ferramentas internas de SIGWEB e bases LiDAR/Pernambuco 3D para atualização fiscal, mas **não publica dumps abertos em GeoJSON/CSV/API pública** de lotes, IPTU por unidade, transações de ITBI ou alvarás de obras — exigindo pedidos via LAI ou trabalho acadêmico/CPRM para cartas de risco `[Data]`. O índice FipeZAP cobre Jaboatão (`Piedade`/`Candeias`) apenas em série agregada municipal `[Data]`.
* **Olinda (`DATA GAP` para microdados GIS/ITBI/Alvarás):** Possui Portal da Transparência (`cidade360.cloud`) e tributos online via sistema `Tinus` (`tinus.com.br/OLINDA`), mas **carece de portal CKAN e de camadas vetoriais oficiais abertas** de cadastro imobiliário, ITBI ou licenciamento construtivo; estudos dependem de IBGE ou OpenStreetMap `[Data]`.
* **Paulista (`DATA GAP` para microdados GIS/ITBI/Alvarás):** Opera Portal da Transparência fiscal, Portal do Cidadão (`municipioonline.com.br` / `paulista.tributosmunicipais.com.br`) e licenciamento digital privado/fechado via **Aprova Digital**, porém **sem repositório aberto de microdados de lotes, IPTU, ITBI ou alvarás em formato reutilizável** `[Data]`.

**O Choque dos `431` Prédios-Caixão (Acordo FCVS / Caixa Econômica Federal):**
Enquanto a RMR é um deserto de dados abertos para `V1`, ela concentra a maior tragédia e passivo de diligência residencial do Nordeste `[Data]`. O acordo federal de **R$ 1,7 bilhão** (custeado pelo FCVS, com indenizações padronizadas em torno de **R$ 120 mil por unidade** para desocupação e demolição) mapeou **`431` prédios-caixão de alto risco de desabamento** na RMR distribuídos em quatro municípios `[Data]`:

* **Recife:** `161` prédios (`37,4%`) — com ocorrências em áreas como `Boa Viagem` e `Imbiribeira` `[Data]`.
* **Olinda:** `129` prédios (`29,9%`) — ex.: `Jardim Fragoso` `[Data]`.
* **Jaboatão dos Guararapes:** `81` prédios (`18,8%`) — forte concentração em `Piedade` e `Candeias` `[Data]`.
* **Paulista:** `60` prédios (`13,9%`) — forte concentração em `Janga` e `Conjunto Beira-Mar` `[Data]`.

**Conclusão estratégica RMR:** **`270` de `431` prédios-caixão de alto risco (`62,6%`) estão fora do município do Recife** `[Data]`. Se o VEREDA insistir em entrar em Jaboatão, Olinda e Paulista via `V1` (mapas cadastrais abertos municipais), ficará bloqueado por inexistência de portais abertos (`DATA GAP`) `[Data]`. Via **`V2` (diligência pré-contratual sobre Atas, Balancetes, Laudo LTVP da Lei PE 13.032/2006, Matrícula ONR e checagem de processos/interdições)**, o VEREDA pode atender compradores de `Piedade`, `Candeias`, `Olinda` e `Janga` imediatamente `[Opinion]`.

---

## 2. Mapa de Expansão Nacional: Vetor A (`V1` GIS) vs. Vetor B (`V2` Documental + Cunha SPU)

### 2.1 Vetor A (`V1` — Expansão de Mapas e Índices Micro-Urbanos)

A matriz abaixo consolida o cenário factual de `Recife` frente às **7 capitais-benchmark** investigadas na Onda 1 (`A4`) e revalidadas nesta rodada `[Data]`:

| Cidade | Portal Principal | IPTU por Lote/Prédio | ITBI Microdados (Transação/Lote) | Alvarás de Construção | Licença / Barreira Real de Engenharia |
|---|---|---|---|---|---|
| **Recife** *(Baseline)* | `dados.recife.pe.gov.br` (CKAN) + ESIG | Sim (422k reg. CSV) `[Data]` | Sim (2016–2026 c/ valor e endereço) `[Data]` | Sim (113k reg. c/ DSQFL) `[Data]` | **ODbL 1.0**; `10.761 LOC`, 0% sol Madalena, Emlurb 08/2022 `[Data]` |
| **São Paulo** | `GeoSampa` + `Fazenda SP` | Sim (cadastro SQL aberto em massa) `[Data]` | Sim (`.xlsx`/`.ods` mensais desde 2019 com SQL, sem matrícula) `[Data]` | Sim (`SLCe`/`Sisacoe`/`Aprova`) `[Data]` | `CC BY / CC-BY-SA`; escala gigantesca exige `3,5–6 meses (210–360h)` de ETL p/ desambiguar torres por SQL `[Data]`/`[Estimate]` |
| **Porto Alegre** | `DataPOA` (CKAN) + `GeoPOA` (`IDE-PLUMA`) | Parcial (dados fiscais/renúncia SMF) `[Data]` | Parcial (bases históricas/arrecadação SMF) `[Data]` | Fragmentado (SMAMUS/LAI) `[Data]` | `CC BY` / Domínio Público (Dec. 20.315/2019); demanda ETL e cruzamento LAI/SMAMUS `[Data]` |
| **Rio de Janeiro** | `Data.Rio` / `IPP` | Agregado SMF `[Data]` | **Agregado** por logradouro/mês com supressão estatística `[Data]` | Não padronizado em massa `[Assumption]` | Bloqueador `A4`: sem microdado unitário de ITBI ligado ao prédio `[Data]` |
| **Belo Horizonte** | `DataBH` (CKAN) + `BHMap` | Restrito / interno SUREM `[Data]` | **Bloqueado** (sistema interno `DTIIV`/SUREM sem dump aberto) `[Data]` | Parcial/limitado `[Assumption]` | Bloqueador `A4`: foco em zoneamento/infraestrutura, sem transação por lote `[Data]` |
| **Curitiba** | `dadosabertos.curitiba` + `GeoCuritiba` | Planta cadastral em `GeoCuritiba` (lotes/WFS) `[Data]` | Sem microdado de transações aberto `[Data]` | **Apenas alvarás comerciais** (atividades econômicas no CSV aberto) `[Data]` | Bloqueador `A4`: confunde licença comercial com licença de obra `[Data]` |
| **Fortaleza** | `dados.fortaleza.ce.gov.br` (`SEFIN`) | Datasets IPTU listados `[Data]` | Datasets ITBI listados `[Data]` | Lacuna construtiva integrada `[Assumption]` | Bloqueador `A4`: `5 de 7` capitais agregam/ocultam ou falham em completude utilizável para micro-índice predial sem saneamento pesado `[Data]` |
| **Salvador** | `GeoSalvador` (`SEDUR`/`SEFAZ`) | Restrito (certidão individual SEFAZ) `[Data]` | Restrito (`ITIV` interno SEFAZ) `[Data]` | Sem dump aberto `[Data]` | Bloqueador `A4`: exportações em massa bloqueadas no ambiente corporativo `[Data]` |

**Veredito sobre o Vetor A:** Expandir via `V1` em qualquer capital brasileira fora do Recife — mesmo nas duas tecnicamente viáveis (**São Paulo** e **Porto Alegre**) — consome **`210–360h` iniciais + `15–30h/mês` de manutenção** por cidade `[Data]`. Para uma equipe de `10–20h/semana`, abrir São Paulo no `V1` significa **paralisar o desenvolvimento do produto por 4 a 8 meses** apenas escrevendo ETLs municipais frágeis `[Estimate]`/`[Opinion]`.

---

### 2.2 Vetor B (`V2` — Escala Documental Nacional + Cunha SPU Litorânea)

O modelo **`V2` ("Anti-Cilada" Pré-Contratual)** inverte a arquitetura de dados: em vez de depender de 5.570 prefeituras, apoia-se em **4 camadas de abrangência nacional** que funcionam em **São Paulo, Rio de Janeiro, Florianópolis, Santos, Vitória, Salvador, Curitiba e Porto Alegre** sem reconstruir pipelines 3D/ITBI `[Opinion]`:

1. **Documentos Privados do Condomínio (Zero dependência pública — 100% Nacional no Dia 1):**
   * *Insumos:* Atas de assembleia, Convenção Condominial, Balancetes mensais (inadimplência, fundo de reserva, contas a pagar, ações trabalhistas em notas explicativas, rateios extraordinários) e Laudos/AVCB.
   * *Infraestrutura no VEREDA:* O pipeline de OCR local (`Tesseract 7.0.0` web), propostas citadas de balancete e revisão por página/trecho já existe no repositório (`F11/F34/F35`) `[Data]`. Funciona exatamente igual para um prédio em Moema (SP), Leblon (RJ), Jurerê (Florianópolis) ou Gonzaga (Santos) `[Opinion]`.

2. **Matrícula Imobiliária Digital (`ONR / RI Digital` — SREI):**
   * Operado nacionalmente pelo **ONR** (Lei nº 13.465/2017) via `ridigital.org.br`, **integrando 100% dos estados brasileiros e o DF** `[Data]`.
   * Permite obter *Visualização de Matrícula* (consulta rápida sem fé pública) ou *Certidão Digital* (fé pública ICP-Brasil, validade 30 dias) para checar hipotecas, alienações fiduciárias, penhoras, indisponibilidades, área real registrada e **averbação de Terreno de Marinha / RIP** em qualquer uma das 8 cidades-alvo `[Data]`.
   * *Ressalva operacional:* Cartórios locais variam em nível de digitalização retroativa (matrículas antigas ou CPFs/CNPJs não vinculados podem demorar mais que as serventias automatizadas) `[Data]`.

3. **Processos Judiciais e Leilões (`DataJud CNJ` + `Caixa Imóveis`):**
   * **Leilões Caixa (`venda-imoveis.caixa.gov.br`):** O portal centralizado da Caixa publica listagens nacionais em formato tabular (CSV/relatórios por UF, cidade, bairro, endereço, valor de avaliação e desconto) `[Data]`, operando como filtro nacional sem ETL por prefeitura.
   * **Processos (`DataJud` — Resolução CNJ 331/2020):** A API pública do CNJ centraliza metadados de tribunais estaduais, federais e trabalhistas no país inteiro via número único do processo (`NNNNNNN-DD.AAAA.J.TR.OOOO`) `[Data]`. **Porém (Red Flag operacional abaixo):** por diretrizes da **LGPD**, a API pública do DataJud **bloqueia/restringe buscas abertas por string de CPF/CNPJ ou nome completo das partes** `[Data]`. Logo, levantar ações passivas contra o **CNPJ do condomínio** nacionalmente exige ou (a) certidão estadual de distribuição/consulta em cada TJ/DJe, (b) APIs jurídicas de terceiros que indexam Diários Oficiais (ex.: Escavador/Jusbrasil/Predictus), ou (c) leitura assistida de certidões/atas fornecidas no negócio `[Data]`/`[Opinion]`.

4. **A Cunha Litorânea Nacional (`Terreno de Marinha / SPU` — 1 Pipeline para Todo o Litoral):**
   * O **Geoportal da SPU (SPUNet)** e a **INDE (`geoservicos.inde.gov.br`)** disponibilizam camadas vetoriais oficiais (Shapefile, GeoJSON, GeoPackage, WFS) de polígonos de terrenos de marinha, acrescidos e marginais `[Data]`, além de consulta por **RIP** no Portal de Serviços SPU (`gov.br`) `[Data]`.
   * **Por que a cunha SPU é um gatilho de conversão "Anti-Cilada" imbatível fora do Recife:**
     * Imóveis em Terreno de Marinha (faixa de 33m da preamar média de 1831 + acrescidos + marginais de rios sob influência de maré) **não possuem domínio pleno** (`17%` da União no aforamento, `100%` na ocupação) `[Data]`.
     * Na venda, incide **Laudêmio de 5%** sobre o valor atualizado do domínio pleno do terreno (excluídas benfeitorias) + obrigação de **CAT (Certidão de Autorização para Transferência)** para o cartório registrar a escritura + encargos anuais de **Foro (`0,6%/ano`)** ou **Taxa de Ocupação (`2% a 5%/ano`)** `[Data]`.
     * Existem entre **500 mil e 600 mil imóveis** cadastrados na SPU no Brasil (`PE, RJ e SP` juntos concentram ~`50%` do total nacional) `[Data]`.

**Comparativo da Mordida SPU por Praça Litorânea:**

| Cidade / Região | Volume / Concentração SPU Verificada | Bairros / Áreas Críticas | Potência da Cunha para `V2` |
|---|---|---|---|
| **Recife (PE)** *(Base)* | **`> 85 mil` cadastros** (maior número absoluto do país); **`~40%` do território municipal** `[Data]` | Boa Viagem, Pina, Bairro do Recife, Santo Amaro, São José, Afogados, Imbiribeira *(+ enfiteuses municipais/privadas de 2%–2,5%)* `[Data]` | **Extrema** (combina SPU `5%` + laudêmios locais `2%–2,5%` + `161` prédios-caixão) `[Data]` |
| **Santos e Baixada Santista (SP)** | **`~44 mil` imóveis em Santos**; **`> 110 mil` na Baixada Santista** `[Data]` | Orla (Gonzaga, Boqueirão, Ponta da Praia) e trechos de antigos canais/rios (Zona Noroeste) `[Data]` | **Extrema** (alta densidade de apartamentos antigos + `LC 441/2001` de autovistoria) `[Data]`/`[Opinion]` |
| **Florianópolis (SC)** | **`~30 mil` imóveis** na capital sob faixas de marinha `[Data]` | Ilha de SC (orla, Centro, aterros históricos e lagoas com litígio na linha de 1831) `[Data]` | **Muito Alta** (ticket alto de compra + contencioso de demarcação travando financiamento/cartório) `[Data]` |
| **Vitória (ES)** | Concentração relativa entre as maiores do país (historicamente citada em torno de ~2/3 da ilha antes de regularizações da Lei 13.465/2017 em ZEIS) `[Data]` | Praia do Canto, Bento Ferreira e trechos nobres insulares mantêm regime SPU `[Data]` | **Alta** (mercado compacto, porém muito dependente de checagem SPU por endereço) `[Opinion]` |
| **Rio de Janeiro (RJ)** | Forte incidência histórica em áreas litorâneas e aterros de alto valor `[Data]` | Zona Sul (Copacabana, Ipanema, Leblon), Barra da Tijuca e Centro `[Data]` | **Alta** (ticket altíssimo amplifica impacto absoluto dos `5%` + combina com Autovistoria Lei 6.400) `[Data]` |
| **Salvador (BA)** | Forte concentração em áreas históricas, portuárias e orla da Baía de Todos-os-Santos `[Data]` | Comércio e faixas da orla soteropolitana `[Data]` | **Média-Alta** (essencial em imóveis antigos/orla, embora mercado local seja menos digitalizado) `[Data]`/`[Assumption]` |
| **SP Capital / Curitiba / Porto Alegre** | Residual / pontual (apenas eventuais terrenos marginais de rios com maré ou próprios federais isolados) `[Assumption]` | — | **Não aplicável como cunha**; lá `V2` lidera com **Atas, Balancetes, Processos CNPJ e Matrícula** `[Opinion]` |

---

## 3. Nuances Regulatórias, Cartorárias e Jurídicas Regionais

### 3.1 Spread Estadual de Emolumentos no ONR / RI Digital (`PE vs. SP vs. RJ vs. SC`)

Embora a plataforma **RI Digital** unifique o pedido nacional, **cada estado define suas custas e emolumentos por lei estadual**, somados a fundos do Judiciário, taxas de central eletrônica e **ISS municipal** do cartório `[Data]`. Valores de referência verificados para **Certidão Digital / Ônus Reais de Matrícula**:

| Estado (TJ Regulador) | Faixa Verificada — Certidão de Ônus Reais / Matrícula | Taxas Adicionais / Observações | Impacto nos Unit Economics do `V2` |
|---|---|---|---|
| **Pernambuco (`TJPE`)** | **`~R$ 64,00`** (base de referência) `[Data]` | Acresce TSNR e páginas excedentes / buscas sem nº de matrícula `[Data]` | **Baseline barato:** permite margem saudável ou repasse baixo ao cliente `[Estimate]` |
| **Santa Catarina (`TJSC`)** | **`R$ 64,00 a R$ 108,85`** (LC Estadual nº 755/2019) `[Data]` | Varia entre solicitação direta em serventia e intermediação eletrônica `[Data]` | **Próximo a PE/SP:** altamente compatível com ticket de diligência nacional `[Estimate]` |
| **São Paulo (`TJSP / Anoreg-SP`)** | **`~R$ 76,54`** (certidão de matrícula/ônus; há faixas menores para ZEIS) `[Data]` | *Visualização de matrícula* (sem fé pública) tem tabela própria eletrônica (referências de mercado em torno de ~`R$ 100` com intermediação, variando por atualização anual/ato) `[Data]` | **Previsível:** tabela única estadual facilita precificação padronizada em todo o estado (SP + Santos) `[Opinion]` |
| **Rio de Janeiro (`TJRJ`)** | **`R$ 108,00 a R$ 193,00+`** `[Data]` | Incidem fundos estaduais pesados (**FUNDPERJ / FUNARPEN**) e variações por formato/inteiro teor `[Data]` | **Choque de custo (`1,7x a 3,0x` vs. PE):** inviabiliza preço fixo nacional "com matrícula inclusa" absorvida na margem `[Estimate]`/`[Opinion]` |

*Nota operacional:* A **Visualização de Matrícula** fica disponível por prazo limitado (geralmente 24h) e **não tem fé pública** (serve para auditoria prévia do VEREDA); já a **Certidão de Ônus Reais / Inteiro Teor** tem fé pública e validade de **30 dias** `[Data]`.

### 3.2 Leis Estaduais e Municipais de Inspeção Predial (`Lei PE 13.032/2006` vs. Outras Praças)

A obrigatoriedade periódica de laudos técnicos estruturais cria uma **assimetria positiva para o `V2`**: onde a lei obriga o condomínio a ter um **LTVP/LTIP/CIP**, a simples ausência ou vencimento desse laudo na pasta do síndico já é um alerta objetivo de negligência ou risco oculto `[Opinion]`.

| Praça | Norma Vigente | Periodicidade Obrigatória | Escopo / Impacto para o Dossiê `V2` |
|---|---|---|---|
| **Pernambuco / Recife & RMR** | **Lei Estadual PE nº 13.032/2006** (Dec. 33.747/2009) `[Data]` | A cada **4 anos** (prédios ≤ 20 anos) e **3 anos** (> 20 anos) `[Data]` | **Âncora fortíssima:** laudo registrado no CREA-PE/CAU cobrindo fundações, colunas, lajes, fachadas, elétrica/hidráulica e incêndio; crítico na RMR dos `431` prédios-caixão `[Data]` |
| **Rio de Janeiro** | **Lei Estadual RJ nº 6.400/2013** + **LC Municipal 126/2013** (Autovistoria) `[Data]` | A cada **10 anos** (< 25 anos) e **5 anos** (> 25 anos; entrega cíclica quinquenal na capital) `[Data]` | **Âncora idêntica a PE:** permite exigir o protocolo de autovistoria/LTVP na Prefeitura do Rio antes de assinar proposta `[Data]`/`[Opinion]` |
| **Fortaleza** | **Lei Municipal nº 9.913/2012** (Dec. 13.616/2015) `[Data]` | Ciclos de **1 a 5 anos** (conforme idade; prédios ≥ 3 pavimentos) `[Data]` | Exige **Certificado de Inspeção Predial (CIP)** — ótimo gancho caso entre no Nordeste `[Data]` |
| **Porto Alegre** | **Decreto Municipal nº 17.720/2012** `[Data]` | Periódico com entrega à Secretaria de Obras `[Data]` | Exige **LTIP** (Laudo Técnico de Inspeção Predial) `[Data]` |
| **Santos (SP)** | **Lei Complementar nº 441/2001** (e atualizações) `[Data]` | Periódica `[Data]` | Reforça a escolha de **Santos** (junto com SPU `44 mil` imóveis) como cidade-satélite de `V2` no Sudeste `[Data]`/`[Opinion]` |
| **São Paulo (capital), Salvador e Florianópolis** | **Sem lei municipal universal** de vistoria periódica geral `[Data]` | Regem códigos de obras gerais + **ABNT NBR 16747** (Inspeção Predial) + AVCB `[Data]` | Sem laudo periódico obrigatório na lei local, o peso da auditoria `V2` migra para **Atas de Assembleia, Balancetes (orçamentos de fachada/impermeabilização) e Processos Judiciais** `[Opinion]` |

### 3.3 Segregação Jurídica `ODbL 1.0 Share-Alike` em Relatórios Comerciais Nacionais

O portal `dados.recife.pe.gov.br` publica seus datasets sob licença **ODbL 1.0** (`src/dados/recife/indice-municipal/*/meta.json` e `scripts/dados/ativar-indice-municipal.mjs`) `[Data]`. Ao combinar esses dados com relatórios comerciais `V2` (que contêm OCR de atas, matrículas privadas, relatos de usuários e dados proprietários), a **Seção 4.4 / 4.5 da ODbL 1.0** impõe três regras arquiteturais rígidas `[Data]`:

1. **Evitar `Derivative Database` misto (Barreira de `Collective Database`):** Se o banco de dados do VEREDA fundir colunas ODbL do Recife com registros comerciais proprietários em uma mesma tabela estruturalmente interdependente e expuser/distribuir esse banco ao público, a cláusula **Share-Alike (Seção 4.4)** obriga a abertura da base derivada inteira sob ODbL `[Data]`. **Mitigação:** Manter o índice ODbL do Recife isolado em suas próprias partições/tabelas imutáveis (como já ocorre em `src/dados/recife/indice-municipal/`), referenciando-o apenas por ID/chave externa no dossiê (`Collective Database`) `[Data]`.
2. **Entregáveis como `Produced Work` (Seção 4.5):** Um relatório PDF ou tela de dossiê gerada a partir de consultas ao índice ODbL + documentos privados do cliente qualifica-se como **`Produced Work`** — que **não** aciona a abertura compulsória dos documentos privados ou do software comercial, exigindo apenas **atribuição explícita** à fonte ODbL usada (`"Base cadastral: Prefeitura do Recife, ODbL 1.0"`) `[Data]`.
3. **Blindagem geográfica natural pelo `V2`:** Bases federais (`SPUNet`, `IBGE` — exigindo citação, `DataJud`, `Caixa`) e documentos enviados pelo comprador (LGPD) **não** são ODbL `[Data]`. Portanto, manter o núcleo comercial nacional `V2` estruturalmente desacoplado das partições ODbL locais do Recife garante que a expansão para SC, SP ou RJ não herde risco de contaminação viral de licença `[Opinion]`.

---

## 4. Recomendação Sequenciada de Entrada no Mercado (`Fase 0/1 -> Fase 2 -> Fase 3`)

### Visão Geral do Sequenciamento (`V1` Congelado Localmente vs. `V2` Escala Nacional)

* **Fase 0/1 (Agora — M0 a M4): Praia de Origem Recife + RMR (`V2` Puro + `V1` Congelado)**
  * **Escopo Geográfico:**
    * *Recife capital:* consolidar uso nos 5 bairros iniciais + habilitar no produto apenas os **9 bairros já limpos no índice municipal** (`Torre` [já c/ camadas], `Boa Vista`, `Tamarineira`, `Pina`, `Parnamirim`, `Aflitos`, `Rosarinho`, `Ilha do Leite`, `Jaqueira` = `3.667` prédios no total com os 5 iniciais) `[Data]` — **sem escrever novo código de ETL municipal** `[Opinion]`.
    * *RMR (`Jaboatão - Piedade/Candeias`, `Olinda`, `Paulista`):* entrada imediata com **`V2` puro** (Atas/Balancetes + Matrícula + LTVP Lei PE 13.032 + SPU + triagem de passivo/risco em zonas de prédios-caixão) `[Opinion]`.
  * **Racional:** Recife já pagou o custo afundado de `10.761 LOC` `[Data]`. Ao rodar `V2` na RMR *onde o VEREDA não tem nenhuma camada `V1`*, o time prova em casa que o produto gera valor e receita mesmo no "escuro" de dados abertos municipais `[Opinion]`.

* **Critérios Objetivos de Validação (Gates para Desbloquear a Cidade #2):**
  1. **Gate de Disposição a Pagar (`WTP`):** Mínimo de **`25` dossiês `V2` concluídos e pagos** (ou **`5` clientes B2B recorrentes** — assessores/peritos/advogados imobiliários — pagando por pacote mensal) no Recife/RMR `[Assumption]`.
  2. **Gate de Desacoplamento `V1`:** Pelo menos **`30%` dos dossiês pagos** (ou **`≥ 8` casos**) realizados em bairros de Recife sem camada `V1` completa ou na RMR (`Jaboatão/Olinda/Paulista`), comprovando que o valor percebido vem da diligência documental (`V2`) e não dos mapas ambientais (`V1`) `[Assumption]`.
  3. **Gate de Operação & Margem:** Tempo de entrega do dossiê `< 24h` com `< 45 min` de esforço humano por caso (via OCR local + checklist estruturado) e **margem bruta `≥ 70%`** após APIs/emolumentos (com cliente enviando PDF da matrícula ou pagando cartório como `pass-through`) `[Assumption]`.

* **Fase 2 (M5 a M9): Cidade #2 & Expansão Litorânea `V2` + Cunha SPU (`Florianópolis` ou `Santos`, depois `Rio`)**
  * **Escolha da Cidade #2:** **Florianópolis (SC)** ou **Santos (SP)** `[Opinion]`.
    * *Por que **Florianópolis (SC)** como 1ª escolha de fora do NE:* ~`30 mil` imóveis em Terreno de Marinha (mordida SPU altíssima no ticket médio da ilha) + emolumentos baratos/previsíveis (`R$ 64–108,85` na LC 755/2019) + público comprador de alto poder aquisitivo vindo de fora do estado (altamente vulnerável a ciladas fundiárias de marinha/posse/condomínio) `[Data]`/`[Opinion]`.
    * *Por que **Santos (SP)** como alternativa imediata (ou 2B):* ~`44 mil` imóveis em marinha (`>110 mil` na Baixada Santista) + **`LC 441/2001` de autovistoria predial obrigatória** (espelhando a Lei PE 13.032) + emolumento SP competitivo (`~R$ 76,54`) + proximidade comercial para futura entrada na capital paulista `[Data]`/`[Opinion]`.
  * **Entrada seguinte na Fase 2 (`M7–M9`):** **Rio de Janeiro (Zona Sul & Barra)**, aproveitando o gancho legal da **Autovistoria obrigatória (Lei 6.400/2013)** e a forte incidência de SPU na orla, **condicionada ao modelo de repasse direto (`pass-through`) das custas de cartório (`R$ 108–193+`)** para não esmagar a margem `[Data]`/`[Opinion]`.

* **Fase 3 (M10+): Metrópoles Não-Costeiras de Massa (`São Paulo`, `Porto Alegre`, `Curitiba`) + B2B**
  * **São Paulo capital:** Maior mercado do país, onde a cunha muda de SPU para **saúde financeira do condomínio (atas/balancetes/fundo de reserva/ações trabalhistas), ônus na matrícula e divergências de área/vaga** `[Opinion]`. Apenas *se* a receita da Fase 2 financiar expansão técnica dedicada, avaliar ingestão seletiva das bases abertas de **`GeoSampa` + `ITBI Fazenda SP`** (consumindo o orçamento conhecido de `210–360h`) `[Data]`/`[Opinion]`.
  * **Porto Alegre e Curitiba:** Entrada `V2` alavancando `LTIP` (Decreto 17.720/2012) em Porto Alegre e integrando corretores/advogados imobiliários em Curitiba, sem construir ETL `V1` para os alvarás estritamente comerciais de Curitiba `[Data]`/`[Opinion]`.

---

## Flags

**Red Flags:**
* **Armadilha de Engenharia `V1` (Risco Existencial):** Tentar replicar o modelo de `10.761 LOC` do Recife em SP/POA (`210–360h` + `15–30h/mês`) ou tentar montar ETL municipal em capitais bloqueadas (RJ, BH, Curitiba, Fortaleza, Salvador) **drenará 100% da capacidade de um time de `10–20h/semana`** antes de validar receita `[Data]`/`[Opinion]`.
* **Bloqueio de Consulta por CNPJ na API Pública do DataJud (CNJ):** A API pública gratuita do DataJud **não permite busca ativa aberta por CNPJ do condomínio ou nome das partes** devido a travas de LGPD `[Data]`. Assumir "consulta automática nacional gratuita de processos contra o prédio via DataJud" quebrará o produto no lançamento — é obrigatório prever fluxo via certidão de distribuição estadual, provedor LegalTech pago ou leitura das atas/balancetes `[Data]`/`[Opinion]`.
* **Subsídio de Emolumentos no RJ destrói a margem:** Cobrar preço único nacional com matrícula inclusa gera spread negativo ao sair de **PE (`~R$ 64`)** ou **SP (`~R$ 76,54`)** para o **RJ (`R$ 108–193+`)** `[Data]`/`[Estimate]`.
* **Risco de Mistura Viral `ODbL 1.0`:** Gravar notas privadas, extrações de atas `V2` e anotações comerciais dentro das mesmas tabelas derivadas de `dados.recife.pe.gov.br` e expô-las publicamente pode acionar o **Share-Alike** da ODbL 1.0 sobre ativos proprietários `[Data]`.
* **Responsabilidade Civil / Exercício Ilegal:** Emitir "veredito de segurança estrutural" sobre prédios-caixão ou "parecer jurídico definitivo" sem enquadrar o produto como **dossiê de evidências documentais e perguntas para conferência técnica** expõe o VEREDA a litígios `[Opinion]`.

**Yellow Flags:**
* **Lacunas dentro do próprio piloto Recife:** `Madalena` segue com **`0%` de cobertura solar**, pontos de alagamento Emlurb estão congelados em **`08/2022`** (e Plano 2026 ainda cita base `2015`), e `21` bairros periféricos não possuem edifícios elegíveis no índice `[Data]`.
* **Assimetria regulatória de laudos fora de PE/RJ/POA/Santos:** **São Paulo capital, Florianópolis e Salvador** não têm lei municipal universal de vistoria periódica obrigatória; haverá menos laudos LTVP disponíveis em circulação nessas praças, exigindo maior dependência de Atas e Balancetes `[Data]`/`[Opinion]`.
* **Variação de SLA no RI Digital / ONR:** Apesar de cobrir **100% dos estados**, serventias com acervos mais antigos ou cadastros incompletos ainda apresentam atrasos operacionais em pedidos digitais `[Data]`.
* **Amostra pequena de quartis ITBI fora do eixo nobre do Recife:** Bairros como `Ilha do Leite` (`6` prédios com quartis) e `Jaqueira` (`11`) têm baixa liquidez estatística para régua fiscal comparável, mesmo com geometria limpa `[Data]`.

---

## Data Gaps

1. **RMR (`Jaboatão dos Guararapes`, `Olinda`, `Paulista`):** Ausência confirmada de portais CKAN/GeoPortais abertos com microdados vetoriais de lotes, IPTU, ITBI e alvarás de construção — qualquer cobertura `V1` nesses municípios exigiria pedidos formais via LAI ou acordos diretos com as Secretarias de Fazenda/Planejamento `[Data]`.
2. **Lista Georreferenciada Pública dos `431` Prédios-Caixão:** Apesar de os totais por município (`161` Recife, `129` Olinda, `81` Jaboatão, `60` Paulista) estarem publicados via acordo FCVS/Caixa, não foi localizado um CSV/GeoJSON oficial único e aberto com coordenadas e endereços padronizados de todos os `431` blocos pronto para ingestão automatizada `[Data]`.
3. **Tabela Completa de Custas de *Visualização de Matrícula* para Todas as 27 UFs:** O portal `ridigital.org.br` exige login (`gov.br`/certificado) e seleção de comarca/cartório específico para exibir em tempo real o valor exato da *visualização* (sem fé pública) com ISS municipal; foram confirmados valores de referência para certidões de ônus/matrícula em PE, SP, RJ e SC, restando validar em tela os valores exatos por comarca para ES (`Vitória`) e BA (`Salvador`) `[Data]`.
4. **Completude Granular Real dos Datasets de Fortaleza (`dados.fortaleza.ce.gov.br`):** Embora o catálogo liste CSVs de IPTU e ITBI, não foi feita ingestão exploratória dos arquivos brutos nesta rodada para auditar o percentual exato de nulos/coordenadas frente à conclusão `A4` da Wave 1 `[Data]`.

---

## Sources

### Tier 1 — Fontes Primárias Oficiais, Código Verificado e Normas Legais
* **Repositório VEREDA (Arquivos Auditados Localmente):**
  * `src/dados/recife/indice-municipal/1e393803851f3fd5/cobertura.json` e `meta.json` (`72` bairros habilitados, `7.206` edifícios, `188.247` unidades, métricas por bairro) `[Data]`
  * `src/dados/recife/publicacaoGerada.ts` e `scripts/dados/areas.json` (`Torre` em expansão; camadas por bairro) `[Data]`
  * `docs/dados/literatura/parecer-tecnico.md` (`2.688` piloto, `1.319` com quartis ITBI, `630` elegíveis à régua homogênea; `ODbL 1.0 §§ 4.3–4.6`) `[Data]`
  * `docs/produto/sol-nas-janelas-2026-10-27/IMPLEMENTACAO-E-REVISAO.md` (cobertura solar em 4 bairros; Madalena ausente) `[Data]`
  * `docs/produto/fontes-prioritarias-recife-2026-11-14.md` (Plano de Contingência 2026 citando EMLURB `2015`; SPU e leilões Caixa) `[Data]`
  * `ignorar/docs/pesquisa-viabilidade/SINTESE.md` (auditoria `dados.recife.pe.gov.br`, ODbL 1.0, IBGE 2022) `[Data]`
* **Portais Governamentais e Geoportais Municipais / Federais:**
  * Prefeitura do Recife — Portal Dados Abertos (`https://dados.recife.pe.gov.br`, CKAN, ODbL 1.0)
  * Prefeitura de São Paulo — **GeoSampa** (`geosampa.prefeitura.sp.gov.br`) e Secretaria da Fazenda — **ITBI-IV** (`prefeitura.sp.gov.br`)
  * Prefeitura de Porto Alegre — **DataPOA** (`dadosabertos.poa.br`, Decreto nº 20.315/2019) e **GeoPOA / IDE-PLUMA** (`prefeitura.poa.br`)
  * Prefeitura do Rio de Janeiro — **Data.Rio / IPP** (`https://data.rio/`)
  * Prefeitura de Belo Horizonte — **DataBH** (`https://databh.pbh.gov.br/`) e **BHMap / IDE-BHGEO** (`https://bhmap.pbh.gov.br/`)
  * Prefeitura de Curitiba / IPPUC — **GeoCuritiba** (`https://geocuritiba.ippuc.org.br/`) e Dados Abertos (`dadosabertos.curitiba.pr.gov.br`)
  * Prefeitura de Salvador — **GeoSalvador / SEFAZ** (`https://www2.sefaz.salvador.ba.gov.br/`)
  * Prefeitura de Fortaleza — Dados Abertos (`dados.fortaleza.ce.gov.br`)
  * Prefeituras de Jaboatão (`jaboatao.pe.gov.br`), Olinda (`olinda.pe.gov.br`, `tinus.com.br/OLINDA`), Paulista (`paulista.pe.gov.br`, `municipioonline.com.br`)
  * **SPU / MGI — SPUNet / Geoportal e INDE** (`gestao.gov.br`, `patrimoniodetodos.gov.br`, `geoservicos.inde.gov.br`) e Decreto-Lei nº 9.760/1946 / Lei nº 13.465/2017
  * **CNJ — DataJud** (Resolução CNJ nº 331/2020, `cnj.jus.br`)
  * **Caixa Econômica Federal — Venda de Imóveis / Leilões** (`https://venda-imoveis.caixa.gov.br/`)
* **Legislações de Vistoria Predial e Licenças:**
  * Pernambuco: **Lei Estadual nº 13.032/2006** e Decreto nº 33.747/2009 (`alepe.pe.gov.br`)
  * Rio de Janeiro: **Lei Estadual nº 6.400/2013** (`alerj.rj.gov.br`) e LC Municipal nº 126/2013 (`rio.rj.gov.br`)
  * Fortaleza: **Lei Municipal nº 9.913/2012**; Porto Alegre: **Decreto nº 17.720/2012**; Santos: **LC nº 441/2001**
  * **Open Data Commons ODbL 1.0** (`https://opendatacommons.org/licenses/odbl/1-0/`, Seções 4.3–4.6)

### Tier 2 — Instituições Registrais, Índices Setoriais e Imprensa de Referência
* **ONR / RI Digital** (`https://ridigital.org.br`, `https://www.registrodeimoveis.org.br`, `anoreg.org.br`, `anoregsp.org.br`) — cobertura nacional (100% UFs + DF) e regras de Visualização vs. Certidão Digital.
* **Tabelas / Referências Cartorárias Estaduais:** Serventias e portais oficiais consultados nas buscas (`18risp.com.br`, `11ri.com.br` em SP; `2rgi-rj.com.br` no RJ; `cartoriorecife.com.br` em PE; `ricriciuma.com.br` / LC 755/2019 em SC).
* **FipeZAP (`fipe.org.br`)** — cobertura de Recife e Jaboatão dos Guararapes.
* **Secovi-PE (`secovi-pe.com.br`)** e **Senado Federal (`senado.leg.br`)** — incidência de terrenos de marinha (`~40%` Recife, `500–600 mil` imóveis Brasil, Vitória/ES).
* **G1 / Globo, EBC, Diário de Pernambuco e Brasil de Fato** — detalhamento oficial do acordo FCVS / Caixa de `R$ 1,7 bilhão` e distribuição dos `431` prédios-caixão (`161` Recife, `129` Olinda, `81` Jaboatão, `60` Paulista; indenização de `R$ 120 mil`).
* **A Tribuna / Novo Milênio / FloripAmanhã** — estimativas de `~44 mil` imóveis em Santos (`>110 mil` Baixada Santista) e `~30 mil` imóveis em Florianópolis.

### Tier 3 — Referências Secundárias, Despachantes, Engenharia e LegalTechs
* **Portais de Cartórios Intermediadores / Despachantes:** `cartorio.net.br`, `cartorio.info`, `querodocumento.com.br`, `centraldascertidoes.com.br`, `meucartoriodigital.com.br` (usados exclusivamente para triangular faixas de preços de certidões de ônus reais entre `R$ 64` e `R$ 193+` somando taxas operacionais).
* **LegalTechs & Guias Jurídicos / Engenharia Predial:** `legalsuite.com.br`, `buscaprocessos.app.br`, `amandafreire.adv.br`, `despachanteimobiliariope.com.br`, `fibersals.com.br`, `costasaleseng.com.br` (triangulação operacional sobre limites LGPD do DataJud e aplicação prática de LTVP/CIP/LTIP e laudêmio supletivo `2%–2,5%`).
