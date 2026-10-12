# Catálogo de cartões da fase 0

Cada cartão do dossiê sai de um modelo desta tabela. O texto é preenchido com valores verificados; nunca é escrito livremente. Isto implementa o RNF-01 do PRD na fase 0. O teste `tests/linguagem.test.ts` barra as palavras proibidas.

## Regras de linguagem

- Afirmação com sujeito, número, fonte implícita e escala. Sem adjetivo avaliativo, sem nota, sem semáforo, sem veredito.
- Proibidos: "seguro" como adjetivo (seguro-fiança e seguro incêndio são permitidos), "perigoso", "vale a pena", "ótimo", "excelente", "barato", "caro", "auditar" e derivados, "oculto", "omitido", "documentação limpa", "nota", "score", "risco de X%".
- Ausência de registro é dita como ausência de registro, sempre com a frase "Ausência de registro não significa ausência de problema" na limitação.
- Escala explícita: um cartão de rua nunca fala do edifício; um cartão de edifício nunca fala da unidade.
- Nenhum nome de portal, imobiliária, construtora, corretor ou pessoa.
- `titulo` com até 5 palavras; `resumo` com até 70 caracteres (usado na tela de etapas).

## Cartões

| id | bloco | categoria | escala | fonte e url_fonte | modelo do claim |
|---|---|---|---|---|---|
| `c_edificacao` | 1 | registro_oficial | edificio | Prefeitura do Recife, Área Urbana (Edificações-Lotes e Edificações-Pavimentos); https://dados.recife.pe.gov.br/dataset/area-urbana | "A edificação {código} está cadastrada em {endereço oficial}, com {p} pavimentos e {a} m² de área construída somada." |
| `c_fiscal_edificio` | 1 | registro_oficial | edificio | Prefeitura do Recife, IPTU por contribuinte e ano, exercício 2026; https://dados.recife.pe.gov.br/dataset/imposto-predial-e-territorial-urbano-iptu | "No IPTU 2026, este endereço tem {n} unidades prediais, com construção registrada em {ano}." |
| `c_rua` | 1 | registro_oficial | rua | Área Urbana e IPTU 2026 | Só no anúncio sem número: "No trecho da {rua} em {bairro}, o cadastro tem {n} edificações; {k} têm {p} ou mais pavimentos, como pede o andar declarado." |
| `c_fiscal_unidade` | 2 | registro_oficial | unidade ou edificio | IPTU 2026 | Unidade identificada: "A unidade {complemento} tem {a} m² de área construída e IPTU de R$ {v} cobrado em 2026." Sem unidade: "No cadastro fiscal, as {k} unidades deste prédio com área entre {min} e {max} m² têm IPTU 2026 entre R$ {vmin} e R$ {vmax} por ano." |
| `c_interdicao` | 2 | registro_oficial | edificio | IPTU 2026 (regime de tributação) | "Nenhuma das {n} unidades deste endereço aparece no IPTU 2026 com isenção por imóvel interditado." ou "{k} das {n} unidades aparecem com isenção por imóvel interditado." |
| `c_defesa_civil` | 2 | registro_oficial | microarea | Prefeitura do Recife, Registro de Atendimentos da Defesa Civil, 2021 a 2024; https://dados.recife.pe.gov.br/dataset/registro-de-atendimentos-da-defesa-civil | "A Defesa Civil registrou {n} atendimentos entre 2021 e 2024 nas ruas que passam a até 150 m {do prédio / do trecho da rua}, sendo {k} em imóveis com danos ou risco." |
| `c_suscetibilidade` | 2 | registro_oficial | microarea | Serviço Geológico do Brasil, Carta de suscetibilidade a movimentos gravitacionais de massa e inundação, Recife, 2015; https://rigeo.sgb.gov.br/handle/doc/15030 | "O lote {fica / não fica} em área de suscetibilidade {classe} a {tipo} na carta do SGB de 2015, feita na escala 1:45.000." |
| `c_setorizacao` | 2 | desconhecido | bairro | Serviço Geológico do Brasil, repositório RIGeo; https://rigeo.sgb.gov.br | "Não há setorização oficial de risco alto e muito alto para o Recife nas bases públicas do SGB consultadas." |
| `c_custo` | 3 | declarado_anunciante | unidade | Anúncio e, quando houver, IPTU 2026 | "Aluguel de R$ {x} informado no anúncio; condomínio {informado / não informado}; IPTU {informado / do cadastro fiscal / não informado}." Visual `custo_mensal`. |
| `c_area` | 3 | inconsistencia se a diferença passar de 15%; senão registro_oficial | unidade | Anúncio e IPTU 2026 | "O anúncio informa {a} m² de área {útil/total}; o cadastro fiscal registra {b} m² de área construída para {a unidade / unidades comparáveis}." Visual `comparacao_area`. |
| `c_iptu` | 3 | inconsistencia ou registro_oficial | edificio | Anúncio e IPTU 2026 | "O anúncio informa IPTU de R$ {x} sem dizer se é por mês ou por ano; no cadastro fiscal, unidades comparáveis pagam R$ {min} a R$ {max} por ano." |

## Campos fixos por fonte

| Fonte | data_ref | Limitação principal |
|---|---|---|
| Área Urbana | 2026-03-02 | O cadastro de edificações pode não refletir reformas e ampliações recentes. |
| IPTU 2026 | 2026-01-01/2026-12-31 | Área construída fiscal não é área privativa; o cadastro fiscal não é laudo. |
| Defesa Civil | 2021-01-01/2024-12-31 | Reflete quem acionou a Defesa Civil, não todas as ocorrências. A Prefeitura publica o número do imóvel mascarado, então os registros são posicionados pela rua, não pelo prédio. Ausência de registro não significa ausência de problema. |
| Carta do SGB | 2015-01-01 | Indica suscetibilidade do terreno, não risco do edifício; a escala 1:45.000 não distingue lotes vizinhos. |
| RIGeo | null | Consultamos o repositório RIGeo em 11/10/2026; o portal GeoSGB não foi verificado. Ausência de setorização não significa ausência de risco. |
