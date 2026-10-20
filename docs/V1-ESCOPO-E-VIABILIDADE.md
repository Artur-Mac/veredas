# VEREDA v1.0: escopo e viabilidade

Arquiteto, 19/10/2026. Base: inspeção de `index.html`, do app em `src/`, da pesquisa em `ignorar/docs/pesquisa-viabilidade/` e testes feitos hoje contra as fontes (registrados na seção 5). A execução está em [`handoff/ORDEM_DO_ARQUITETO.md`](handoff/ORDEM_DO_ARQUITETO.md).

## 1. O que é a v1.0

Uma pessoa cola o link de um anúncio de Boa Viagem, Casa Forte, Graças, Espinheiro ou Madalena e, em poucos minutos, tem:

1. no celular, os dados que a própria página do anúncio mostra, lidos sem nenhum passo além de colar o link; na web, o que o link contém mais o texto que ela colar; sempre revisados por ela;
2. o prédio confirmado no cadastro da Prefeitura, quando ela sabe ou descobre o endereço;
3. um dossiê com o que o cadastro diz que o anúncio não diz: IPTU de unidades com a mesma área, ano e porte do prédio, transmissões e avaliação fiscal (ITBI), obras licenciadas a 150 m;
4. as perguntas para a visita e a mensagem pronta para o corretor;
5. a comparação com as outras opções que ela salvou.

Tudo com a cara de `index.html`: papel `#F2EBDD`, cartões brancos, laranja `#F47745` na ação, Fraunces, Plus Jakarta Sans e JetBrains Mono, cabeçalho com marca e créditos, dock de quatro abas (Explorar, Dossiê, Comparar, Visita).

A v1.0 é uma prova de conceito interna e educacional: sem login, sem pagamento, dados só no aparelho, custo de infraestrutura zero.

### O que muda em relação ao app de hoje

| Hoje | v1.0 |
|---|---|
| Link vira formulário em branco; o link é só referência | No celular, colar o link abre a página do anúncio no app e lê preço, condomínio, IPTU e área. Na web, o link é lido e o texto colado completa os custos |
| Cadastro municipal só nos 5 dossiês de exemplo, com dados de demonstração | Índice gerado das bases abertas da Prefeitura para os 5 bairros, com data e fonte em cada número |
| Análise do usuário abre num formulário | Análise do usuário abre no dossiê, no layout de `index.html` |
| Tela sem cabeçalho de marca nem dock; tema escuro azulado | Casca de `index.html`; tema claro de papel (o escuro de `index.html` existe só no modo de campo da visita) |
| Fontes Archivo carregadas sem uso na marca | Removidas |

## 2. Matriz de viabilidade

Legenda de custo: **baixo** cabe numa fatia de trabalho do operário; **médio** exige build nativo, servidor ou várias fatias; **alto** exige pesquisa, parceria ou operação contínua.

### 2.1 Entra na v1.0

| Funcionalidade | Como | Custo | Limite honesto |
|---|---|---|---|
| Ler o link (Camada A) | Expressões sobre o endereço da URL, no aparelho, sem rede. ZAP, VivaReal, QuintoAndar, OLX-PE | Baixo | Lê o que está no endereço: em geral tipo, quartos, bairro, área, às vezes preço, edifício ou rua (OLX). Nunca condomínio nem IPTU. Quebra se o portal mudar o formato: as fixtures pegam isso |
| Ler a página do anúncio no celular | Colar o link abre a página dentro do app, à vista da pessoa (WebView); o app lê os dados estruturados do anúncio e o texto da tela e preenche a revisão sem outro toque. Requisito do usuário de 19/10/2026 | Médio | Só no celular. O portal pode pedir verificação anti-robô, que a pessoa resolve na própria página; o app nunca a automatiza. Nomes de campo de ZAP, VivaReal e OLX ainda precisam ser conferidos em aparelho (QuintoAndar conferido) |
| Completar pelo texto colado (Camadas B e C) | Plano B no celular e caminho principal na web: a pessoa copia o texto da página e cola; regras locais e JSON-LD extraem custos | Baixo | Exige um passo manual. Sem ele, o dossiê sai com "a confirmar" nos custos |
| Valores de fachada | IPTU R$ 1, condomínio R$ 100 num apartamento de 152 m², "Não informado", IPTU sem período: viram "a confirmar" e pergunta, nunca zero | Baixo | Regras fixas; podem marcar um valor legítimo como atípico. A pessoa corrige |
| Índice cadastral dos 5 bairros | Script lê as APIs abertas da Prefeitura (IPTU 2026, ITBI 2016–2026, Licenciamento, Lotes) pedindo só colunas da lista branca, agrega por prédio e grava JSON no repositório | Médio (uma vez) | Retrato com data. Atualizar é rodar o script de novo |
| Encontrar o prédio | Rua e número, ou o nome do edifício (o cadastro de Lotes tem nome em 87% dos prédios de Graças), vão direto ao prédio. Sem nenhum dos dois, filtra prédios do bairro com unidades da mesma área e mostra candidatos; a pessoa confirma | Baixo | **Sem endereço nem nome não há vínculo automático.** Em Boa Viagem, uma área como 125 m² aparece em dezenas de prédios. O app pede o número ao corretor |
| IPTU do cadastro × anúncio | Mediana do IPTU das unidades com a mesma área no prédio confirmado | Baixo | Área do cadastro pode diferir da área útil anunciada; tolerância de 3% e rótulo de inferência |
| Prédio: ano, porte, unidades, padrão | IPTU 2026 (moda por prédio) e pavimentos da base de Lotes | Baixo | Pavimentos do IPTU não servem (correlação nula com a altura); só os de Lotes |
| Sinais de alvenaria resistente | Três sinais do cadastro: até 4 pavimentos, ano anterior a 2005, padrão Simples ou Médio. Vira pergunta sobre estrutura e laudo | Baixo | É indício, não diagnóstico. O texto nunca afirma o tipo de estrutura |
| Avaliação fiscal (ITBI), compra | Quartis de R$/m² das transmissões do prédio (com 3 ou mais) e do bairro nos últimos 24 meses | Baixo | É avaliação fiscal escriturada, não preço de mercado. Dito na tela |
| Obras a 150 m | Licenciamento com categoria "Obra": construção nova, acréscimo e demolição licenciados nos últimos 24 meses | Baixo | Retrato com data; licença não é obra em andamento. Dois terços da base são alvarás de funcionamento de comércio: sem filtrar, o número fica cerca de 50 vezes maior (mediana de 259 contra 5 por prédio em Graças) |
| Perguntas, roteiro e mensagem | Cada lacuna, valor de fachada e achado gera uma pergunta; a pessoa copia a mensagem ou abre o WhatsApp com o texto, sem envio automático | Baixo | — |
| Comparar | Duas análises da mesma modalidade, lado a lado: custo mensal conhecido, espaço, entorno. Sem "melhor" | Baixo | Compara só o que é conhecido; mostra quantas parcelas faltam |
| Visita no imóvel | Cronômetro, checklist, respostas, percepção de ruído e orientação da janela informadas pela pessoa, notas | Baixo | Sem medição de decibéis nem bússola automática |
| Descarte com motivo e créditos | Motivos de `index.html`; carteira local: 3 de início, 1 por dossiê com prédio confirmado, +1 por descarte com motivo, recarga de teste quando zera | Baixo | Crédito sem valor monetário. Serve para testar a percepção do modelo de cobrança |
| Sobre os dados | Fontes, datas, licença ODbL, colunas usadas e o que não cobrimos | Baixo | — |

### 2.2 Viável, mas fica para depois da v1.0

| Funcionalidade | Por que não agora | Custo | Caminho |
|---|---|---|---|
| Só colar o link também na web | O navegador não deixa um site ler a página de outro, e buscar a página por servidor esbarra no bloqueio dos portais | Médio | Extensão de navegador ou favorito ("Enviar ao Vereda") que a pessoa aciona na página do anúncio |
| Compartilhar do app do portal direto para o Vereda | Exige build nativo de desenvolvimento e configuração de intent | Médio | Plugin de share intent; abre a leitura com o link pronto |
| Atualizar obras ao vivo | A API da Prefeitura não libera CORS: o navegador bloqueia a consulta direta (testado) | Médio | Rota de API do Expo Router como proxy, com hospedagem (EAS Hosting ou equivalente) |
| Atualização periódica do índice | Hoje é rodar um script e fazer commit | Baixo | Tarefa agendada mensal (GitHub Actions) que gera e abre PR |
| Mais bairros do Recife | O script já sabe filtrar por bairro; o JSON cresce cerca de 4 vezes para a cidade toda | Médio | Carregar o índice do bairro sob demanda, de hospedagem estática, em vez de embutir |
| Foto do imóvel no cartão | Fotos dos portais não podem ser copiadas | Baixo | A pessoa anexa uma captura ou foto da galeria |
| Rotas e destinos frequentes | Precisa da camada de preferências (Época 4) | Baixo | Distância em linha reta e abertura no app de mapas (`geo:` e links de mapas, sem chave); nenhum tempo de trajeto inventado |
| Leitura de ata de condomínio | Exige modelo de linguagem com chave em servidor; nenhum segredo no cliente | Médio | Upload voluntário de PDF, resposta citando página |
| Backup e troca de aparelho | Sem conta, os dados ficam no aparelho | Baixo | Exportar e importar JSON do caderno |

### 2.3 Caro ou inviável sem acordo

| Funcionalidade | Barreira verificada | Quem destrava |
|---|---|---|
| Buscar a página do anúncio pelo servidor | ZAP, VivaReal e OLX responderam 403 com desafio Cloudflare a um GET comum (19/10/2026). Os termos dos portais vedam coleta automatizada. Insistir é contornar proteção, o que a POC não faz | Parceria ou feed oficial com portais e imobiliárias |
| Comparar o aluguel com o mercado do entorno | Não há base **aberta** de aluguéis anunciados. Correção de 20/10/2026: o informe mensal gratuito do FipeZAP traz o preço anunciado de 4 dos 5 bairros, mas com todos os direitos reservados à Fipe. ITBI é venda e é fiscal | Autorização da Fipe (fipezap@fipe.org.br) ou parceria. Na v1.0, a régua de aluguel usa só as análises salvas pela própria pessoa no bairro, e diz isso |
| Segurança por bairro | A SDS-PE publica só por município e região; a base por bairro circula por terceiro com API paga | Pedido via LAI à Ouvidoria Geral do Estado ou licença |
| Alagamento por endereço, prédios condenados | Correção de 20/10/2026: o ESIG expõe numa API pública 181 pontos críticos de alagamento (última conclusão em 2022) e a avaliação de risco de 205 prédios feita pelo ITEP em 2007 (nenhum nos 5 bairros). A barreira é a licença não declarada, não o acesso. Listas do MPPE seguem sem fonte pública | Autorização da Prefeitura (EMPREL/ESIG); ITEP só com parecer. Ver `produto/pesquisa-2026-10-20/01-DADOS-PUBLICOS.md` |
| Insolação 3D, ruído medido, temperatura de superfície | Modelo 3D de 2013 cobre só 32% dos prédios pós-2013; dB de celular sem calibração não é medição; Landsat só mostra variação em Boa Viagem | Pesquisa própria; fica como percepção da pessoa na visita |
| Outras cidades | Cada cidade tem cadastro, chave e licença diferentes | Trabalho por cidade; é o principal custo de escala do produto |
| Uso comercial do índice derivado | ODbL tem cláusula de compartilhamento pela mesma licença; a tabela prédio → DSQFL pode ter de ser publicada | Parecer jurídico antes de qualquer uso comercial |

## 3. O que a v1.0 faz à mão (e por quê)

Não escala, mas é o certo para validar antes de construir infraestrutura:

1. **Na web, a pessoa cola o texto do anúncio**; no celular, só quando a leitura da página falha ou o portal pede verificação. Medir nas sessões de teste quantas vezes isso acontece por portal.
2. **A pessoa confirma o prédio**, e muitas vezes precisa pedir o número ao corretor. O app transforma isso na primeira pergunta da mensagem.
3. **Alguém roda o script do índice e faz commit**, com data visível no app. Mensal é suficiente para IPTU e ITBI; obras ficam defasadas até um mês.
4. **Créditos recarregam por botão de teste.** Não há compra.
5. **Padrões de URL são mantidos à mão.** Quando um portal mudar o formato, uma fixture falha e alguém atualiza a regra.
6. **Cinco sessões de uso com pessoas reais**, recrutadas e anotadas manualmente (Época 5).

## 4. Riscos

| Risco | Efeito | Mitigação na v1.0 |
|---|---|---|
| Área do cadastro ≠ área anunciada | Prédio certo não aparece entre candidatos | Tolerância de 3% (mínimo 1,5 m²), busca por rua e número sempre disponível |
| Índice desatualizado | Obra nova não aparece | Data do retrato em todo fato; "Sobre os dados" diz o que não está coberto |
| Formato de URL muda | Leitura do link perde campos | Fixtures com URLs reais; o fluxo sempre cai no texto colado e na revisão |
| Portal muda a página ou passa a barrar a WebView | Leitura automática deixa de preencher campos | A busca é pelo código do anúncio e por sinônimos de chave; falha cai no texto colado com a página ainda visível; tabela de teste por portal a cada versão |
| Tamanho do índice no app | App pesado na web | Só prédios com 2 ou mais unidades residenciais; polígono simplificado; orçamento de 2 MB por bairro e 4 MB no total, com cada obra guardada uma vez por bairro, verificado por teste |
| Reidentificação | Valor de IPTU de uma unidade exposto | Nenhuma coluna de contribuinte, CPF/CNPJ, complemento ou regime é pedida à API. IPTU guardado por tipologia (área, contagem, mediana), sem unidade |
| Operário cria dados de aparência oficial | Simulação apresentada como cadastro | Proibido na ordem. Todo dado oficial vem do script; fixtures de teste ficam em `tests/`, nunca no app |

## 5. Evidências levantadas em 19/10/2026

| Teste | Resultado |
|---|---|
| `GET` com navegador comum em anúncios citados no plano | ZAP, VivaReal e OLX: HTTP 403, página de desafio Cloudflare. QuintoAndar: HTTP 200, com `og:title` e JSON-LD |
| Cabeçalhos CORS da API CKAN da Prefeitura | Resposta 200 sem `Access-Control-Allow-Origin`: o navegador bloqueia a leitura no Expo Web; no celular funciona |
| `datastore_search` no IPTU 2026 | Funciona com `filters` por bairro e `fields` (lista branca aplicada na própria consulta). Registros: Boa Viagem 71.237, Madalena 12.805, Graças 11.327, Espinheiro 6.533, Casa Forte 3.247. Valor da coluna `bairro`: "Gracas", sem acento |
| Campos do IPTU 2026 | Há `logradouro`, `numero`, `Código Logradouro`, `AREA CONSTRUIDA`, `valor cobrado de IPTU`, `ano da construção corrigido`, `tipo de padrão da construção`, `Tipo de Construção` ("Apartamento <= 4 Pavimentos"), `latitude`, `longitude`. Não há DSQFL nem nome do edifício |
| ITBI | Pacote `imposto-sobre-transmissao-de-bens-imoveis-itbi`, ODbL, um CSV por ano de 2016 a 2026 (2026 com 13.852 registros), com `cod_logradouro`, `numero`, `valor_avaliacao`, `area_construida`, `data_transacao`, `latitude`, `longitude` |
| Licenciamento Urbanístico | 118.602 registros, com `dsqfl`, `tipo_processo`, `data_entrada`, `situacao_processo`, `latitude`, `longitude` |
| SQL no CKAN (`datastore_search_sql`) | Desativado. O script usa `datastore_search` paginado |
| Lista oficial de bairros | 94 bairros (CSV "Bairros e RPAs do Recife"); gravada em `src/dados/recife/bairros.ts` |
| Estrutura de uma página do QuintoAndar | O anúncio vem inteiro num bloco `__NEXT_DATA__` (`…initialState.house.houseInfo`): aluguel, condomínio, IPTU, total, área, quartos, banheiros, vagas, rua e bairro, com o código do anúncio em `id`. O mesmo bloco traz outros anúncios e o ramo da conta logada: por isso a leitura se limita ao objeto com o código do link |
| API CKAN, tamanho de página (20/10/2026) | No máximo 500 linhas por requisição, qualquer que seja o `limit`. Os 5 bairros somam cerca de 600 requisições; com cache, a segunda execução é instantânea. O primeiro índice do operário saiu truncado por isso (4 prédios em Boa Viagem, contra 1.818) |
| Grafias de bairro (20/10/2026) | Graças aparece como "Gracas" e "Graças" no IPTU e no ITBI; o filtro da API é exato |
| ITBI × IPTU (20/10/2026) | Apartamentos vendidos em Graças casam com um prédio do IPTU por logradouro e número em 95% (2026) a 100% (2020). ITBI 2017 não está na API: só CSV |
| Lotes (20/10/2026) | 114.079 lotes, CRS84. Nomes reais das colunas: `DSQFL` (14 dígitos), `QTDPAVIMENTOS`, `NMEDIFICACAO`. Em Graças, 100% dos 283 prédios caem num lote, 87% com nome, 100% com pavimentos |
| Licenciamento (20/10/2026) | 39.067 registros "Obra" e 79.535 "Atividade" (alvará de funcionamento). Série útil desde 2018; 19% das obras sem coordenada, recuperáveis pelo DSQFL |
| Tamanho do índice (20/10/2026) | Prédios com 2+ apartamentos: Boa Viagem 1.818, Graças 283, Madalena 214, Espinheiro 154, Casa Forte 78. Boa Viagem pede guardar cada obra uma vez por bairro para caber em ~2 MB |
| `react-native-webview` | Versão 13.16.1 é a do SDK 57 (`expo/bundledNativeModules.json`); ainda não instalada no projeto |

**Correção de 20/10/2026:** o IPTU não tem o nome do prédio, mas a base de Lotes tem (`NMEDIFICACAO`, preenchido em 87% dos prédios de Graças). Quando o anúncio só diz "Edifício Solar do Gayppio", o app procura pelo nome; se não achar, pergunta o número.
