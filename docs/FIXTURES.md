# Fixtures do protótipo

As fixtures em `src/fixtures/dossies/` e `src/fixtures/mapas/` são geradas por `scripts/dados/gerar_fixtures.py` a partir dos dados em `data/` (fora do git) e dos campos declarados em `scripts/dados/anuncios.json`. Nenhum valor é digitado à mão: o que não tem fonte fica `null`, vira `nao_informado` ou vira cartão desconhecido.

## Como reproduzir

Comandos na raiz do repositório, nesta ordem:

1. `uv run --python 3.13 scripts/dados/baixar_fontes.py` baixa as fontes e registra URL, data, tamanho e hash em `data/manifesto.json`.
2. `uv run --python 3.13 scripts/dados/preparar_area_urbana.py`, depois `preparar_cnefe.py`, `preparar_iptu.py`, `preparar_defesa_civil.py` e `preparar_suscetibilidade.py`, que geram `data/derivados/`.
3. `uv run --python 3.13 scripts/dados/gerar_fixtures.py` grava as fixtures e reescreve `src/fixtures/lista.ts`. Sai com código 1 se algum anúncio não tiver resolução suficiente, sem inventar candidatas.
4. `npm run typecheck` e `npx jest` validam o esquema, a linguagem, as marcas e as regras das fixtures.
5. `uv run --python 3.13 scripts/dados/cobertura_edificacoes.py` mede a cobertura da camada de edificações por bairro, citada no README.

## Licença e privacidade

- Área Urbana, IPTU por contribuinte e ano e Registro de Atendimentos da Defesa Civil vêm do Portal de Dados Abertos da Prefeitura do Recife, sob a Open Database License (ODbL). As fixtures derivadas desses dados ficam sob a ODbL, com atribuição à Prefeitura do Recife.
- A carta de suscetibilidade é do Serviço Geológico do Brasil (RIGeo, acesso aberto). O CNEFE 2022 é do IBGE e serve para geocodificar números e para verificar se um logradouro existe.
- Do IPTU só foram pedidos ao datastore os campos do imóvel. Número, tipo e CPF/CNPJ do contribuinte, data do cadastramento e início da contribuição nunca foram baixados. O CSV intermediário foi apagado depois do Parquet.
- Na base da Defesa Civil a Prefeitura publica o número do imóvel mascarado; o número não foi decodificado e cada atendimento conta para a rua inteira, dentro do bairro.
- O nome do edifício declarado no primeiro anúncio é nome público de prédio e já aparece no complemento do IPTU 2026.
- As URLs das páginas dos anúncios estão só em `data/anuncios/origem.local.json`, fora do git. Nas fixtures fica apenas `codigo_anuncio`.

## Datas de coleta

| Fonte | Arquivo em `data/` | Atualização informada pela fonte | Coleta |
|---|---|---|---|
| Área Urbana (Edificações-Lotes, Edificações-Pavimentos, Lotes, Quadras, Trechos, Trechos por Bairro, Bairros) | `brutos/recife/area-urbana/` | 2026-03-02 | 2026-10-12 |
| IPTU 2026, campos do imóvel (datastore) | `derivados/iptu_2026_imoveis.parquet` | 2026-10-03 | 2026-10-12 |
| Defesa Civil 2021 a 2024 | `brutos/recife/defesa-civil/` | 2026-03-06 | 2026-10-12 |
| Carta de suscetibilidade do SGB, Recife, 2015 | `brutos/sgb/sig_recife_pe.zip` | publicação 2015 | 2026-10-12 |
| IBGE CNEFE 2022, Recife | `brutos/ibge/cnefe/` | 2024-05-20 | 2026-10-12 |
| Repositório RIGeo (busca por setorização) | não se aplica | não se aplica | 2026-10-11 |
| Anúncios | `scripts/dados/anuncios.json` | não se aplica | 2026-10-12 |

## Regras de cálculo

- **Resolução pelo endereço.** Logradouro e bairro declarados, normalizados pelo geocodificador, mais o número, casados com o código de logradouro e o número do IPTU 2026. Confiança alta.
- **Resolução pelo nome do edifício.** Só quando a rua declarada não existe em nenhum bairro do cadastro de logradouros nem no CNEFE. O nome declarado é procurado no complemento das unidades do IPTU e precisa aparecer em um único endereço; a unidade declarada também precisa aparecer nesse endereço. Confiança alta, com o cartão `c_endereco` mostrando a divergência.
- **Candidatas (anúncio sem número).** Lotes do logradouro no bairro com unidades residenciais na faixa de área de `criterios_candidatas` no IPTU 2026; o mínimo de pavimentos é opcional (nulo no anúncio da Boa Vista). Ordem pela distância à posição aproximada declarada; ficam as 2 ou 3 primeiras (A, B, C). Confiança média. A faixa de 40 a 55 m² para 46 m² declarados vai de 13% abaixo a 20% acima, porque a área construída fiscal costuma ser maior que a útil.
- **Edificação.** Polígono, pavimentos e área vêm de Edificações-Lotes com a agregação de Edificações-Pavimentos (pavimentos = maior `PAVIMENTO` das camadas principais; área = soma de `QTAREA_TIPO` das camadas empilhadas mais `QTAREA_TIPO × PAVIMENTO` de `Acima_04_Pav` e `Base_de_Predio`). Quando a edificação não está nessa camada, usa-se o lote (`QTDPAVIMENTOS`, `AREATOTALCONSTRUIDA`): o cartão se chama "Lote cadastrado" e o campo `contorno` do edifício vale `lote`, para a silhueta do app avisar que o volume usa o contorno do lote.
- **Cobertura da camada de edificações.** 63 dos 94 bairros têm ao menos uma edificação em Edificações-Lotes (`cobertura_edificacoes.py`, ponto interno de cada polígono dentro do polígono do bairro). Mesmo nesses bairros há lacunas: o prédio de Boa Viagem e a Rua do Aragão não estão na camada.
- **Unidades comparáveis.** A unidade declarada, quando o número do complemento a identifica sem ambiguidade. Senão, as unidades residenciais com área construída a até 15% da área declarada; nas candidatas, a faixa de `criterios_candidatas`.
- **Defesa Civil.** Registros de 2021 a 2024 ligados ao logradouro oficial por nome e bairro (ou bairro vizinho quando o nome só existe lá). Contam as ruas cujos trechos, no bairro do trecho, passam a até 150 m do centroide do prédio ou do centro do trecho da rua. Como o número do imóvel vem mascarado, cada atendimento conta para a rua inteira dentro do bairro, e o cartão diz isso; a escala é `rua` (RF-23). `por_ano` usa o ano do arquivo publicado. `por_tipo` usa a ocorrência canônica e, quando vazia, a solicitação canônica; quando as duas faltam, o registro entra como "Tipo não informado". Até 5 tipos. Os tipos registrados são danos, risco, vistoria, desabamento, vítimas e lonas, nenhum de alagamento; por isso o cartão responde à pergunta sobre estrutura (`q_estrutura`), não à de alagamento. No mapa aparecem só os trechos dessas ruas dentro do raio, e o selo com o total fica na borda do raio, onde a rua sai do círculo.
- **Suscetibilidade.** Interseção do polígono da edificação (ou do lote) com os polígonos de inundação e de deslizamento da carta. O cartão cita a classe de cada processo tocado e diz quando o prédio fica fora das manchas de um processo, com a ressalva de que ausência de registro não significa ausência de problema.
- **Interdição.** Unidades do endereço com regime de tributação "Isenção Imóvel Interditado" no IPTU 2026. A limitação diz que o registro só existe quando a isenção foi concedida.
- **Andar.** `c_andar` aparece só quando o andar declarado passa do número de pavimentos do cadastro. A limitação cita a concordância de pavimentos entre Lotes e Edificações-Pavimentos, calculada a cada geração (73%); o mesmo número aparece na limitação de `c_rua`.
- **Custo.** Parcelas mensais do anúncio. Quando o anúncio não traz IPTU mensal utilizável, IPTU anual do cadastro dividido por 12 (valor da unidade ou faixa das comparáveis). Parcelas que o anúncio não informa só entram quando listadas em `parcelas_nao_informadas` de `anuncios.json` (Seguro-fiança no anúncio de Boa Viagem), com origem `nao_informado` e fora do total.
- **Área.** Razão entre a área declarada e a área construída fiscal (da unidade ou mediana das comparáveis). Vira inconsistência quando o anúncio passa do cadastro em mais de 15% ou fica mais de 30% abaixo dele, porque a área construída fiscal pode incluir paredes e parte das áreas comuns. A escala é `unidade` quando a unidade foi identificada e `edificio` quando a referência são as comparáveis. Áreas com uma casa decimal, como o app exibe.
- **IPTU declarado.** Leituras possíveis do valor do anúncio (por mês vezes 12, por ano, ou as duas quando a periodicidade não é informada) comparadas com a faixa anual do cadastro; nenhuma leitura dentro da faixa vira inconsistência. O texto diz "IPTU cobrado", e a limitação lembra que a base aberta não traz o valor da taxa de coleta de lixo (TRSD), que o anúncio pode ter somado.
- **Setorização.** O cartão de setorização ausente vale para o município inteiro (escala `municipio`).
- **Perguntas.** Matriz comum mais a da operação, com os textos de `scripts/dados/matriz_perguntas.json`. A ação de cada cartão é a ação da pergunta que ele responde, salvo `c_endereco`, `c_andar`, `c_edificacao`, `c_fiscal_edificio`, `c_fiscal_unidade`, `c_iptu` e `c_defesa_civil`, que têm ação própria. Status: `q_identidade` fica "parcial" quando há `c_endereco` ou `c_andar`; `q_alagamento` fica "desconhecida" quando a carta não tem mancha de inundação no prédio; `q_estrutura` usa `c_interdicao` e `c_defesa_civil` como evidências; `q_vaga` sai da lista quando o anúncio declara zero vagas. No modo rua, identidade, alagamento, estrutura e área ficam desconhecidas.
- **Mapa.** Quadrado de 420 m centrado no alvo (ou no centro do trecho da rua), coordenadas em metros relativos a `origem_utm` (EPSG:31985), y para norte, arredondadas a 0,1 m, polígonos simplificados a 0,4 m e recortados pelo quadrado. `lotes` traz os anéis externos da camada Lotes; se o arquivo passasse de 250 KB, a simplificação dos lotes subiria até 1 m (nos três mapas bastou 0,4 m).

## Decisões de método

- O anúncio de Boa Viagem fica com confiança alta: o nome do edifício aparece só em um endereço do IPTU, a unidade declarada existe lá e o cadastro de lotes registra o mesmo número de unidades (84). A divergência de endereço aparece em `c_endereco` e mantém a pergunta de identidade em aberto.
- Comparáveis a até 15% da área declarada; a referência de área é a mediana das comparáveis.
- Registros da Defesa Civil sem ocorrência nem solicitação aparecem como "Tipo não informado", sem usar outro campo no lugar.
- O ano dos registros da Defesa Civil é o do arquivo publicado: cerca de 110 registros têm data de outro ano ou inválida, e não há duplicatas entre arquivos.
- Na compra, o IPTU do custo mensal vem do cadastro, porque o anúncio informa R$ 2.000 sem periodicidade; o cartão `c_iptu` compara as duas leituras e o app mostra o valor declarado como "sem dizer se é por mês ou por ano".
- Adaptações mínimas dos modelos: `c_edificacao` se chama "Lote cadastrado" e diz "no cadastro de lotes" quando os dados vêm de Lotes; `c_custo` de compra começa por "Preço de venda"; `c_iptu` com periodicidade mensal informa também o valor anual; `c_area` diz quando o anúncio não informa se a área é útil ou total; `c_rua` sem nenhuma edificação alta diz "como pediria o andar declarado".

## boa-viagem-rua-do-catete (aluguel, resolvido, confiança alta)

| Valor | Origem e filtro |
|---|---|
| Campos declarados | `scripts/dados/anuncios.json`, anúncio aberto em 2026-10-12 |
| `c_endereco` | "Rua do Catete" não aparece em nenhum bairro de `derivados/area_urbana/logradouros_chaves.parquet` nem em `derivados/cnefe_enderecos.parquet`; o nome do edifício está no complemento de 84 unidades do IPTU 2026, todas no código de logradouro 11720, número 6472 (Avenida Boa Viagem, 6472, Boa Viagem), e a unidade 1005 está entre elas |
| `dsqfl` 61850070020340, 18 pavimentos, 7.867,8 m² | `derivados/area_urbana/lotes.parquet`, endereço oficial "Avenida Boa Viagem, 6472"; a edificação não consta em Edificações-Lotes nem em Edificações-Pavimentos (lacuna da camada na orla) |
| 84 unidades, construção de 2016 | `derivados/iptu_2026_imoveis.parquet`, código 11720 e número 6472 |
| Unidade 1005: 42,72 m² e IPTU de R$ 1.572,22 | mesma tabela, complemento com "1005" |
| Interdição: 0 de 84 | mesma tabela, regime de tributação |
| Fora das manchas de inundação; suscetibilidade baixa a deslizamento | `derivados/suscetibilidade_sgb_2015.parquet`, interseção com o polígono do lote |
| 72 atendimentos (12, 12, 26 e 22 de 2021 a 2024), 27 em imóveis com danos ou risco | `derivados/defesa_civil_2021_2024.parquet`; ruas a até 150 m: Avenida Boa Viagem 44, Rua Setubal 14, Rua Visconde de Jequitinhonha 12, Rua Baltazar Passos 2 |
| Tipos: não informado 42, imóveis com danos ou risco 27, desabamento parcial 1, vistoria em imóveis 1, vítimas 1 | mesma tabela, ocorrência ou solicitação canônica |
| Custo: aluguel R$ 5.500; condomínio não informado; IPTU R$ 131,02 por mês; Seguro-fiança não informado | anúncio; IPTU da unidade 1005 dividido por 12 |
| Área: 43 m² úteis contra 42,72 m² (0,7% acima) | anúncio e IPTU da unidade |
| Perguntas: identidade parcial (por `c_endereco`), alagamento desconhecida | regras acima |
| Mapa (14,2 KB) | centro em E 290037,4 e N 9099158,2; 17 quadras, 77 lotes, 25 edificações; alvo desenhado com o polígono do lote |

## casa-amarela-estrada-do-arraial (compra, resolvido, confiança alta)

| Valor | Origem e filtro |
|---|---|
| Campos declarados | `scripts/dados/anuncios.json`, anúncio aberto em 2026-10-12 |
| `dsqfl` 31365180030183, 17 pavimentos, 13.914,3 m² | `derivados/area_urbana/edificacoes.parquet`, endereço oficial "Estrada do Arraial, 3574, Casa Amarela" (código 8222) |
| 112 unidades, construção de 2009 | `derivados/iptu_2026_imoveis.parquet`, código 8222 e número 3574 |
| Comparáveis: 111 unidades residenciais de 67,8 a 71,45 m², IPTU de R$ 1.526,25 a R$ 1.665,18 por ano | mesma tabela, área entre 62,9 e 85,1 m² (74 m² mais ou menos 15%) |
| IPTU declarado de R$ 2.000 sem periodicidade: inconsistência | nenhuma leitura (R$ 2.000 ou R$ 24.000 por ano) cabe na faixa das comparáveis |
| Interdição: 0 de 112 | IPTU 2026, regime de tributação |
| Suscetibilidade alta a inundação e baixa a deslizamento | carta do SGB, interseção com o polígono da edificação |
| 63 atendimentos (2, 26, 14 e 21 de 2021 a 2024), 23 em imóveis com danos ou risco | Defesa Civil; ruas a até 150 m: Estrada do Arraial 45, Rua da Harmonia 17, Rua Doutor Carlos Mavignier 1 |
| Tipos: não informado 33, imóveis com danos ou risco 23, vistoria 4, colocação de lonas plásticas 3 | mesma tabela, ocorrência ou solicitação canônica |
| Custo: condomínio R$ 700; IPTU de R$ 127,19 a R$ 138,77 por mês | anúncio; faixa anual das comparáveis dividida por 12 |
| Área: 74 m² contra 67,8 a 71,45 m² (3,6% acima da mediana de 71,5 m²) | anúncio e IPTU |
| Perguntas: identidade respondida, alagamento parcial | regras acima |
| Mapa (74,3 KB) | centro em E 289034,9 e N 9112231,9; 21 quadras, 242 lotes, 403 edificações; manchas de inundação média e alta e de deslizamento baixa |

## boa-vista-rua-do-aragao (aluguel, sem número, confirmação pendente, confiança média)

| Valor | Origem e filtro |
|---|---|
| Campos declarados, parcelas extras e posição aproximada | `scripts/dados/anuncios.json`, anúncio aberto em 2026-10-12; a posição é declaração do anunciante e só ordena as candidatas |
| `c_rua`: 39 edificações, nenhuma com 11 ou mais pavimentos | `derivados/area_urbana/lotes.parquet`, lotes da Rua do Aragão (código 7013) na Boa Vista com área construída registrada |
| Candidata A: `dsqfl` 11555090030094, Rua do Aragão, 94; 9 pavimentos; 1.697,9 m² construídos; 23 unidades (11 residenciais de 40 a 55 m²); construção de 1967; a posição aproximada cai dentro do lote | Lotes (`QTDPAVIMENTOS`, `AREATOTALCONSTRUIDA`) e IPTU 2026, código 7013 e número 94 |
| Candidata B: `dsqfl` 11555120010225, Rua do Aragão, 87; 3 pavimentos; 372,4 m² construídos; 5 unidades (3 residenciais de 40 a 55 m²); construção de 1939; a 14 m da posição aproximada | Lotes e IPTU 2026, código 7013 e número 87 |
| `c_andar` em A e B | andar 11 declarado contra 9 e 3 pavimentos no cadastro de lotes |
| `c_area`: A de 43,1 a 48,5 m² (5,2% abaixo da mediana de 48,5 m²); B de 52 a 55 m² (16,4% abaixo da mediana de 55 m²); registro oficial nas duas | IPTU 2026, unidades residenciais de 40 a 55 m² de cada endereço |
| `c_iptu`: R$ 31 por mês (R$ 372 por ano) contra R$ 206,23 a R$ 232,06 (A) e R$ 274,70 a R$ 290,55 (B) por ano; inconsistência nas duas | IPTU 2026, mesmas unidades |
| Interdição: 0 de 23 (A) e 0 de 5 (B); suscetibilidade alta a inundação e baixa a deslizamento nas duas | IPTU 2026 e carta do SGB |
| 354 atendimentos (21, 79, 81 e 173 de 2021 a 2024), 115 em imóveis com danos ou risco | Defesa Civil; ruas a até 150 m do centro do trecho: Rua Velha 149, Rua Gervásio Pires 71, Avenida Manoel Borba 36, Rua Barão de São Borja 32, Rua da Conceição 16, Praça Maciel Pinheiro 14, Rua da Santa Cruz 14, Rua do Aragão 12, Rua Cassimiro de Abreu 6, Rua Rosário da Boa Vista 3, Largo da Santa Cruz 1 |
| Tipos: não informado 238, imóveis com danos ou risco 115, vistoria em imóveis 1 | mesma tabela, ocorrência ou solicitação canônica |
| Custo: aluguel R$ 2.600, condomínio R$ 315, IPTU R$ 31, seguro incêndio R$ 52 e taxa de serviço R$ 67, todos informados no anúncio | anúncio |
| Perguntas: identidade parcial (por `c_andar`); sem pergunta de vaga (o anúncio declara zero vagas) | regras acima |
| Mapa (54,8 KB) | centro do trecho em E 292077,4 e N 9108353,2; 27 quadras, 652 lotes, 33 edificações (a camada de edificações não cobre a rua); alvos A e B com os polígonos dos lotes |
