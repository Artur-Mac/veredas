# PropSight — Product Requirements Document (PRD)

| Campo | Valor |
|---|---|
| Versão | 2.0 (escopo revisado após pesquisa de fontes, termos de uso e regulamento; incorpora as decisões de 13 e 14/10/2026) |
| Data | 14 de outubro de 2026 |
| Status | Escopo fechado para inscrição no Campus Mobile 15ª edição; testes técnicos da Fase 1 pendentes; protótipo em construção |
| Donos | Equipe PropSight (3 pessoas, Recife) |
| Documentos relacionados | `CONTEXT.md` (glossário), `PropSight_critical_assessment.md`, `PropSight_proposed_solution.md`, Pesquisa de fontes e termos (14/10/2026), Regulamento Campus Mobile 15ª edição |

Convenção: **[FATO]** verificado em fonte citada; **[HIPÓTESE]** suposição a testar; **[DECISÃO]** escolha tomada pela equipe, com motivo.

Nota sobre o nome: "PropSight" é provisório e pode mudar. Nenhuma decisão deste documento depende do nome.

---

## 1. Resumo

PropSight é um aplicativo móvel que transforma o link de um anúncio de apartamento em Recife em um **dossiê de evidências**: qual edifício é aquele e com que confiança, o que os registros públicos dizem sobre ele, sobre a rua e sobre o bairro, o que o anúncio declara e onde ele se contradiz, onde o preço pedido cai na faixa observada no bairro, e o que ainda não se sabe, com a lista exata de documentos a pedir, perguntas a fazer e itens a observar na visita.

O produto não emite nota, não recomenda, não prevê preço e não busca imóveis. Cada afirmação tem fonte, data e escala. Posição numa distribuição é fato; adjetivo é veredito. "Não sabemos" é uma saída válida e de primeira classe.

O produto tem **três camadas de dados** e **quatro superfícies**:

- Camadas: **Edifício** (chave DSQFL, compartilhado entre usuários, cacheado), **Anúncio** (chave URL, privado do usuário que colou) e **Usuário** (estado, notas, rotina, domicílio, medições de visita; só no aparelho).
- Superfícies: **Dossiê** (quatro blocos), **Mapa** (POIs, isócronas, camadas de contexto, 3D), **Modo visita** (checklist e sensores do aparelho) e **Meus dossiês** (lista e fatos lado a lado).

**Uma frase:** compartilhe o anúncio, veja o prédio certo no mapa, saiba o que é fato, o que é promessa do anunciante e o que ainda falta confirmar, e leve o celular na visita para fechar o que faltou.

---

## 2. Contexto e motivação

### 2.1 O problema

Quem aluga ou compra apartamento em Recife decide com três fontes: o anúncio (escrito por quem quer fechar negócio), a visita (30 minutos num horário escolhido pelo corretor) e a memória de conhecidos. As informações que mudariam a decisão existem, mas estão espalhadas e ilegíveis para leigos: cadastro municipal de edificações, cadastro fiscal, transmissões registradas, atendimentos da Defesa Civil, cartas de suscetibilidade do Serviço Geológico, atas e balancetes do condomínio. Levantar isso à mão leva horas e exige saber que existe.

Recife agrava o problema: cerca de 26,5% dos domicílios são alugados (acima da média nacional de 22%) e 30% são apartamentos, o maior percentual de Pernambuco **[FATO, Censo 2022, resultados preliminares via Folha de Pernambuco, dez 2024]**. A cidade tem histórico documentado de prédios-caixão (cerca de 5,3 mil mapeados na RMR pelo ITEP, 161 no município dentro do acordo de 2024, 431 na região metropolitana **[FATO, imprensa, TRF5/MPPE, mai/2025]**) e de alagamentos recorrentes.

### 2.2 Por que agora

- Dados municipais abertos de qualidade suficiente para resolver identidade de edifício existem desde março de 2026: Edificações-Lotes, Edificações-Pavimentos, Edificações 3D, Lotes, Quadras, em GeoJSON sob ODbL **[FATO, dados.recife.pe.gov.br]**.
- O código de lote de 14 dígitos (**DSQFL**) é a chave comum de Lotes, Edificações 3D, cadastro fiscal (IPTU, por coordenada do lote) e Licenciamento Urbanístico **[FATO, pesquisa de 14/10/2026]**. Um edifício resolvido destrava vários cartões de escala lote com uma única junção.
- A Prefeitura publica o **cadastro fiscal do IPTU por unidade** (2005 a 2026) e, desde 2015, o **ITBI por unidade**, com data da transação, avaliação fiscal e, em 2026, coordenadas **[FATO, verificado em 14/10/2026]**. É a única fonte oficial ligada a transações.
- O **Licenciamento Urbanístico** traz `dsqfl` e coordenadas, não só endereço textual **[FATO]**.
- Landsat 8/9 Collection 2 Level 2 entrega temperatura de superfície pronta em domínio público; o Recife publica censo arbóreo de 2023 árvore por árvore **[FATO]**.
- LLMs tornam barata a extração de campos de texto livre e a leitura de documentos com citação de página.
- O celular do usuário é sensor: GPS, câmera, microfone e bússola produzem **observação direta** durante a visita, categoria que nenhuma base pública oferece.
- Os portais investem em busca, conversa e preço; nenhum tem produto de verificação pós-descoberta para o consumidor **[FATO, benchmark na avaliação crítica]**.

### 2.3 Contexto do concurso

Programa Campus Mobile 15ª edição (Instituto Claro), categoria **Tecnologias Urbanas** **[DECISÃO]**. Regulamento oficial de 14/08/2026, 16 páginas **[FATO]**.

| Etapa | Data | O que pesa |
|---|---|---|
| Inscrição | até 18/10/2026, 23h59 (Brasília) | Perfil do time (peso 8 de 16), impacto (3), originalidade e uso de IA (2), viabilidade (2), clareza (1) |
| Seleção | 19/10 a 04/12/2026 | Até 17 projetos por categoria |
| Fase preparatória | 18/01 a 19/02/2027 | Mentoria remota |
| Semana Imersiva | 21 a 26/02/2027 | Demo de protótipo em dispositivo móvel (eliminatório); implementação, design, articulação, inovação. Formato (presencial em São Paulo, online ou híbrido) divulgado em 04/12; deslocamento por conta do participante |
| Finalização | 03/03 a 17/06/2027 | Metas da banca; protótipo funcional; **uso real pelo público-alvo** |
| Viagem | set/2027 | |

Restrições do regulamento que afetam o produto **[FATO, transcrição]**: uso obrigatório de telefonia móvel (2.5); item 11.20 (iv) desclassifica projeto que contiver "uso de marca de empresas, elogios ou qualquer menção que caracterize a divulgação do nome e/ou marca de produtos e empresas"; (ii) termos que ofendam honra ou imagem de pessoas, produtos ou empresas; (x) obra protegida por direito autoral ou propriedade industrial; cessão de direitos de divulgação ao Instituto (10.3); 6.5 valoriza a parceria com o poder público "para obtenção de dados".

Leitura adotada **[DECISÃO, 14/10/2026]**: o alvo do 11.20 (iv) é a publicidade (logo, elogio, propaganda), não a citação factual. Tecnologias habilitadoras (serviços de mapa, bibliotecas, bases de dados) podem ser citadas em texto factual, sem logo nem elogio. Terceiros podem ser nomeados em benchmarking na apresentação, com fonte e data, sem depreciação, sem logos nem capturas de tela. Continuam fora: nomes de portais em telas, fixtures, código e documentação do protótipo (lista em `tests/regras.ts`); logos e capturas de terceiros; frases promocionais. Confirmação por e-mail com a organização (4.7) é opcional.

---

## 3. Objetivos e não-objetivos

### 3.1 Objetivos

| # | Objetivo | Como se mede |
|---|---|---|
| O1 | Reduzir de horas para um minuto o levantamento do que é público sobre um edifício anunciado | Mediana de tempo até o primeiro bloco do dossiê < 60 s |
| O2 | Mostrar, na maioria dos anúncios, ao menos um fato verificável que o usuário não encontraria sozinho e que muda uma pergunta, uma visita ou uma proposta **[HIPÓTESE]** | ≥ 50% das sessões com "descoberta nova" autodeclarada |
| O3 | Zero afirmações falsas; toda afirmação com fonte, data e escala | Auditoria de 50 dossiês: 0 claims sem fonte; 0 wording proibido |
| O4 | Converter incerteza em ação | Toda pergunta "desconhecida" gera documento a pedir, pergunta, item de visita ou encaminhamento |
| O5 | Acumular o ativo defensável: a tabela de resolução "nome do edifício → DSQFL", o ledger de origem e o **dossiê do edifício** reutilizável | Confirmações humanas registradas; edifícios com dossiê pronto; tempo do segundo dossiê do mesmo edifício |
| O6 | Transformar o celular em instrumento de observação direta na visita | Dossiês com ao menos uma medição de campo; confirmações de edifício por GPS |

### 3.2 Não-objetivos (explicitamente fora do produto)

Buscador de imóveis; recomendação ou ranking entre imóveis; comparação com síntese de trade-off ("este é melhor"); score ou nota de risco; previsão ou estimativa pontual de preço ("vale R$ X", "está caro"); total de custo de vida; risco de alagamento, calor ou ruído **modelado** (fatos e proxies rotulados são permitidos); trânsito em tempo real; dado de API comercial gravado no ledger; preço de comércio próximo via nível de preço de terceiros; inspeção visual de fotos por IA; LiDAR; relatos de moradores; preferências inferidas; chat livre; agente que contata terceiros; qualquer cidade além de Recife; coleta longitudinal de anúncios por scraping.

Motivo comum **[DECISÃO]**: cada um desses itens ou exige dado que não existe de forma lícita e validável, ou é proibido pelos termos da fonte, ou replica incumbentes, ou cria risco de falsa garantia (precedente: Zillow retirou os scores climáticos da First Street em 2025 após contestação de precisão).

O que **deixou** de ser não-objetivo nesta versão **[DECISÃO, 14/10/2026]**: histórico de fatos de preço (ITBI, valor venal, anúncios analisados) e faixa observada de preço no bairro, porque têm fonte; comparação **de fatos lado a lado**, porque é diff, não veredito; calor, alagamento ampliado, barulho e crime como **fatos com escala declarada**, porque a pesquisa encontrou fontes; exposição solar, porque é geometria sobre dado público.

---

## 4. Usuários

### 4.1 Usuário primário

Pessoa física em Recife que **já encontrou um anúncio** de apartamento em edifício e está a até duas semanas de decidir se visita, propõe ou assina. Aluguel e compra.

Perfil típico: usa o celular para tudo, abre o anúncio no app do portal, manda o link para parceiro ou família pelo WhatsApp, agenda visita pelo app. Não sabe que o cadastro municipal existe. Não lê 80 páginas de ata.

### 4.2 Usuário secundário (Etapa 4 em diante)

Corretor ou imobiliária em Recife que quer entregar ao cliente um documento neutro e verificável sobre o edifício, como diferencial de atendimento. Canal de distribuição e de receita **[HIPÓTESE, testar na Etapa 4]**.

### 4.3 Cenários

1. **Thaís, 29, aluguel em Boa Viagem.** Viu um anúncio de 2 quartos por R$ 2.800, "condomínio isento", "a 5 min da praia", sem IPTU informado. Compartilha o link. O dossiê identifica o edifício (12 pavimentos, cadastrado), mostra que a descrição diz 86 m² e o campo estruturado 80 m², marca IPTU e seguro-fiança como desconhecidos, mede 14 minutos a pé até a orla pela rede de ruas, mostra o aluguel por m² sobre a faixa dos anúncios do bairro, e gera a pergunta "qual a área privativa na matrícula?". No mapa ela vê a padaria, a USF e a estação a 10 minutos a pé.
2. **Marcos e Lia, 41 e 38, compra em Casa Forte.** Anúncio sem número e sem nome do prédio. O app mostra 3 candidatos no mapa com endereço oficial e número de pavimentos; eles reconhecem a fachada e tocam. O dossiê lista 7 desconhecidos de compra, pede atas, balancete, convenção e matrícula, mostra que a Prefeitura registrou 9 transmissões no edifício em 24 meses com avaliação fiscal mediana de R$ 6.900/m², e que o lote ao lado tem alvará de construção deferido em 2025 (o cartão de sombra avisa que o modelo 3D é de 2013). Na visita, o modo visita confirma por GPS que estão no prédio resolvido, mede ruído com a janela aberta e fechada, e registra a orientação da janela da sala. Duas semanas depois enviam as atas; o leitor documental aponta cota extra aprovada na página 14.
3. **Corretor Jorge.** Gera dossiês dos 5 imóveis que vai mostrar no sábado e envia aos clientes antes da visita.
4. **A visita de Thaís.** No portão, o app confirma o edifício por GPS e registra a confirmação como origem "humano em campo". O checklist manda abrir ducha e torneira por 60 segundos, fotografar a fachada e o teto do último andar, e perguntar ao porteiro sobre a garagem em chuva. Ao sair, ela responde "o que bateu, o que surpreendeu, o que faltou".

---

## 5. Jornada do usuário (primeiro uso)

| Passo | Usuário | Sistema | Tela | Tempo |
|---|---|---|---|---|
| 0 | Abre o app | | Um campo: "Compartilhe ou cole o link do anúncio". Sem cadastro | 0 s |
| 1 | Compartilha o anúncio pelo app do portal (ou cola o link) | Recebe URL via share intent; abre a página numa WebView no aparelho; lê o texto renderizado e os dados estruturados; extrai campos da lista branca; marca tudo como "declarado pelo anunciante" | "Lendo o anúncio…" com campos aparecendo. Campo tocável para corrigir | 5 a 15 s |
| 2 | Só se necessário: toca no prédio correto | Resolvedor gera candidatas e pontua. Confiança alta pula este passo em aluguel; em compra a confirmação é sempre pedida | Mapa com 2 ou 3 pinos, cada um com endereço oficial e pavimentos. "Qual é o prédio? (não temos certeza)" | 5 s |
| 3 | Aguarda | Se o edifício já tem dossiê (camada 1), só a camada 2 é calculada. Senão, enriquecimento paralelo e escrita do ledger | Carregamento como lista de etapas: anúncio lido, edifício resolvido, cadastro de edificações, cadastro fiscal, transmissões, licenciamento, Defesa Civil, contexto urbano, consistência, desconhecidos | 3 a 30 s |
| 4 | Lê **Bloco 1, Identidade** | | "Edifício X, Rua Y nº N. Identificado automaticamente (confiança alta)" ou "confirmado por você" ou "confirmado por N pessoas". Pavimentos, área construída, ano, padrão, unidades cadastradas | |
| 5 | Lê **Bloco 2, Registros oficiais** | | Cartões com categoria, fonte, data, escala: cadastro fiscal da unidade; transmissões no edifício (ITBI agregado); licenciamento no lote e em 150 m; Defesa Civil no trecho; suscetibilidade; contexto urbano (alagamento, calor, arboviroses, barulho, crime, renda do setor), cada um com escala em destaque | |
| 6 | Lê **Bloco 3, O que o anúncio declara e o que não bate** | | Consistência de área, andar, IPTU, vagas, distância declarada. Custo mensal como barra segmentada com origem por parcela. **Régua de preço**: faixa do bairro (ITBI, anúncios analisados, valor venal relativo) com o preço do anúncio marcado | |
| 7 | Lê **Bloco 4, O que ainda não sabemos** | | Desconhecidos com ação; "desconhecido oficial" (setorização de risco, ruído do aeroporto); indício de tipologia quando houver; atalhos: **roteiro de visita** e **mensagem pronta ao corretor** | |
| 8 | Abre o **Mapa** | | Edifício, POIs com coordenadas, isócronas a pé de 5, 10 e 15 min, camadas ligáveis (faixas marginais, alagamentos, calor, árvores). 3D na Etapa 4 | |
| 9 | Opcional: informa caminhos diários ou domicílio | Call to action dentro do dossiê, nunca antes do resultado | Rotas a pé, bike e carro sem trânsito; carro com trânsito típico sob demanda (Etapa 4). Domicílio em faixas, só no aparelho | |
| 10 | Salva em **Meus dossiês**; abre outro anúncio | | Lista com estado; **fatos lado a lado** entre 2 dossiês; comparáveis abertos na WebView rotulados "declarado pelo anunciante" | |
| 11 | Vai à visita: **Modo visita** | GPS confirma o edifício; sensores | Checklist com progresso; foto da fachada; cronômetro; ruído janela aberta/fechada; bússola na janela; perguntas ao porteiro e corretor | |
| 12 | Opcional, depois: envia atas, balancetes, convenção | Leitor documental (Etapa 4) | Eventos com página e trecho; desconhecidos viram respondidos | min |
| 13 | Compartilha o dossiê | Link no domínio do produto, PDF ou resumo de 3 linhas para WhatsApp | Documento legível por terceiros | s |

Decisões de desenho **[DECISÃO]**: nenhuma pergunta de preferência antes do resultado; a confirmação do edifício é a única entrada obrigatória além do anúncio; os quatro blocos têm ordem fixa; não existe número-resumo, o "resumo" é a contagem de cartões por tipo; cada cartão pertence a uma camada (edifício, anúncio, usuário) e nada da camada usuário sobe ao servidor; sete categorias de confiança no ledger, quatro rótulos na tela; cartões de escala bairro ou maior nunca recebem cor, comparação com média ou adjetivo.

---

## 6. Requisitos funcionais

Prioridade MoSCoW. **M** = obrigatório no protótipo da Semana Imersiva (fev/2027); **S** = Etapa 4 (mar a jun/2027); **C** = pós-programa; **P** = pendente de parceria com órgão público ou LAI (entra quando o dado existir); **W** = não fazer nesta versão. IDs da versão 1.1 mantidos.

### 6.1 Entrada e extração

| ID | Requisito | Prio |
|---|---|---|
| RF-01 | O app aparece na folha de compartilhamento do Android e recebe texto e URL compartilhados de qualquer app | M |
| RF-02 | O app aceita URL ou texto colados num campo | M |
| RF-03 | Detecção de link na área de transferência | C (Android 12+ avisa toda leitura; ganho pequeno sobre o share intent) |
| RF-04 | Quando só há URL, o app abre a página numa WebView no aparelho do usuário, visível, e lê o texto renderizado e os dados estruturados (schema.org, Open Graph) após o carregamento. Nunca contorna anti-bot nem altera user-agent; nunca oculta anúncios do portal; linka o original | M |
| RF-05 | O servidor do produto **nunca** acessa o portal de anúncios | M |
| RF-06 | Extração híbrida: regras determinísticas para campos estruturados da **lista branca** (preço, condomínio, IPTU, área, quartos, vagas, andar, rua, número, bairro, coordenadas quando existirem, distâncias declaradas); LLM apenas para nome do edifício, andar e contradições na descrição livre. Nome, telefone e CRECI do anunciante nunca são lidos | M |
| RF-07 | Todo campo extraído é gravado com a categoria "declarado pelo anunciante" e é editável pelo usuário com um toque | M |
| RF-08 | Se a WebView falhar (anti-bot, layout), o app pede o texto colado ou um print; OCR no aparelho é fallback de emergência | S |
| RF-09 | Demo com dossiês pré-gerados como plano A; leitura ao vivo como bônus | M |

### 6.2 Resolução de identidade

| ID | Requisito | Prio |
|---|---|---|
| RF-10 | Gerar candidatas a partir de Edificações-Lotes (filtro por logradouro e bairro), com pavimentos e área construída agregados pelo `dsqfl`, mais o cadastro fiscal do IPTU (pavimentos, ano, unidades, distribuição de área, coordenada do lote), CNEFE e OSM | M |
| RF-11 | Pontuar candidatas por regras (nome fuzzy, número, andar × pavimentos, área declarada × áreas das unidades, ano declarado) e classificar em confiança alta, média, baixa | M (regras); S (Splink) |
| RF-12 | Aluguel: confiança alta associa sem perguntar; média mostra 2 ou 3 pinos e pede confirmação; baixa abre **modo rua**. Compra: confirmação humana sempre | M |
| RF-13 | Gravar no ledger: anúncio, `dsqfl`, lote, confiança, evidências do match e **origem da decisão** (resolvedor, humano no mapa, humano em campo por GPS) | M |
| RF-14 | Cada confirmação humana alimenta a tabela "nome do edifício → `dsqfl`" | M |
| RF-15 | **Dossiê do edifício como entidade**: todos os cartões de camada 1 são calculados uma vez por `dsqfl`, cacheados e compartilhados; o segundo anúncio do mesmo edifício só calcula a camada 2. Entrada por endereço abre a camada 1 sem anúncio | M |
| RF-16 | Contagem agregada de confirmações por edifício ("confirmado por N pessoas"), sem dado pessoal | S |

### 6.3 Cartões de evidência (camada edifício e camada anúncio)

| ID | Requisito | Prio |
|---|---|---|
| RF-20 | Cada cartão exibe: claim, categoria de confiança, fonte com link, data de referência, data de coleta, escala espacial, método, limitação principal, ação sugerida; camadas 2 e 3 por toque. Estrutura visual em tríade (achado, o que muda, ação) | M |
| RF-21 | **Edificação cadastrada**: pavimentos, área construída, endereço oficial, lote. Fonte: Área Urbana, Recife | M |
| RF-22 | **Cadastro fiscal**: da unidade (quando o complemento bate), só área construída e IPTU cobrado; do edifício, ano de construção corrigido, pavimentos, unidades e padrão construtivo. O **regime de tributação nunca é exibido** por unidade (revela aposentado, pensionista ou servidor); a checagem de "IPTU isento" declarado é feita pelo valor cobrado. Campos de contribuinte nunca lidos | M |
| RF-23 | **Atendimentos da Defesa Civil** no trecho de rua, 2014 a 2024, com grau de risco quando houver; escala rua; geocodificada pelo produto (base sem coordenadas; 2025 vazio) | M |
| RF-24 | **Suscetibilidade** a movimentos de massa e inundação (carta SGB 2015, 1:45.000), rotulada como suscetibilidade, nunca como risco | M |
| RF-25 | **Desconhecido oficial**, no bloco 4, uma vez por dossiê: "não há setorização oficial de risco para o Recife nas bases do SGB (confirmado: cobre 95 municípios de PE, não o Recife); verifique com a Defesa Civil" | M |
| RF-26 | **Consistência**: área declarada × descrição × cadastro de edificações × cadastro fiscal; andar × pavimentos; IPTU declarado × cobrado; vagas declaradas × necessárias (quando o domicílio informar); campos ausentes | M |
| RF-27 | **Custo mensal total** como barra segmentada (aluguel, condomínio, IPTU/12, seguro), cada parcela com origem: informado no anúncio, do cadastro fiscal, ou não informado. Nunca "oculto". Em compra, custos de transação como desconhecidos, com ITBI e cartório calculados sobre a avaliação fiscal quando houver | M |
| RF-28 | **Licenciamento**: processos no lote (`dsqfl`) e num raio de 150 m, com assunto, situação e data de conclusão; escala lote. Texto fixo: "a base só inclui processos digitais desde 2017"; ausência de registro nunca é apresentada como irregularidade | M |
| RF-29 | **Mapa de contexto**: POIs com coordenadas (UBS, USF, hospitais e escolas municipais, mercados públicos, estações de metrô) e isócronas a pé de 5, 10 e 15 min por openrouteservice próprio | M |
| RF-29b | **Rotina**: até 3 pontos de rotina informados depois do dossiê; rotas reais a pé, bike e carro sem trânsito, com perfil de elevação | S |
| RF-30 | **Exposição solar e sombra**: calculadas com Edificações 3D (LOD1, levantamento de cerca de 2013) e pré-computadas no servidor em datas e horas fixas; orientação da unidade pelo anúncio ou pela bússola do modo visita. Texto fixo: "edificações posteriores a 2013 não constam" | S |
| RF-36 | **Transmissões no edifício**: contagem, período e mediana de R$/m² de **avaliação fiscal** (ITBI 2015 a 2026) agregadas por edifício; nunca uma transmissão isolada; nunca a palavra "preço" para esse valor | M |
| RF-37 | **Régua de preço do bairro**: quartis de R$/m² de avaliação fiscal (ITBI, raio de 300 m ou bairro, 12 ou 24 meses), faixa de preço dos anúncios analisados no ledger (agregado, N ≥ 5) e valor venal da unidade em relação à mediana do edifício; o preço do anúncio marcado sobre a faixa. Controles de raio e período. Sem adjetivo, sem "acima da média" | M |
| RF-38 | **Linha do tempo do edifício**: IPTU 2005 a 2026 (área, valor venal, padrão), ITBI, licenciamento e Defesa Civil num eixo datado, com fonte por evento | S |
| RF-39 | **Distância declarada**: "a 5 min da praia", "perto do metrô" medidos pela rede de ruas (cartão de consistência) | S |

### 6.4 Desconhecidos, ação e contestação

| ID | Requisito | Prio |
|---|---|---|
| RF-31 | Matriz de perguntas por tipo de operação (aluguel, compra) × evidências do ledger; cada pergunta marcada como respondida, parcial ou desconhecida | M |
| RF-32 | Cada desconhecido gera uma de quatro ações: documento a pedir, pergunta ao corretor ou síndico, item de visita, "requer profissional" | M |
| RF-33 | **Roteiro de visita**: checklist interativo com progresso, ordenado por prioridade, com instrução concreta; alimenta o modo visita (6.10) | M |
| RF-34 | **Mensagem pronta para o corretor**: texto gerado dos desconhecidos, editável, com copiar e compartilhar; o app nunca envia por conta própria | M |
| RF-35 | **Ver fonte** e **isso está errado** em cada cartão. "Ver fonte" mostra o que foi agregado (N, período, raio, linhas, sem complemento de unidade). "Isso está errado" pede motivo de lista fechada (não é este prédio; o número parece errado; dado desatualizado; outro) e texto opcional. "Não é este prédio" reabre a confirmação no mapa e, corrigida, refaz todos os cartões. Demais motivos entram em fila revisada pela equipe (board no Linear) | M |
| RF-35b | Contestação automática: reexecução da agregação com filtro de outliers; cartão marcado "corrigido em [data]" quando o resultado muda. Etiqueta "em verificação" só após 2 contestações independentes; contestar nunca esconde o cartão | S |
| RF-3A | **Indício de tipologia**: cartão "precisa de especialista" só quando os três sinais batem (até 4 pavimentos, ano de construção anterior a 2005, padrão Simples ou Médio no IPTU), com "o que observar na visita" (fissuras em escada, umidade na base, ausência de pilotis) e "pergunta ao proprietário" (sistema construtivo, laudo). Nunca afirma a tipologia; nunca usa a palavra "caixão" como afirmação sobre o prédio | S |

### 6.5 Documentos

| ID | Requisito | Prio |
|---|---|---|
| RF-40 | Upload cifrado de atas, balancetes e convenção (PDF, foto) | S |
| RF-41 | Leitor documental: eventos (obra, cota extra, inadimplência, litígio, elevador, fachada, bombas, interdição, seguro) com página, trecho, data e status aparente; trechos de baixa confiança marcados, nunca omitidos | S |
| RF-42 | Desconhecidos respondidos por documento atualizam o bloco 4 | S |
| RF-43 | Em compra: orientação para obter matrícula pelo SAEC/ONR, com upload do PDF | C |

### 6.6 Saída e compartilhamento

| ID | Requisito | Prio |
|---|---|---|
| RF-50 | Dossiê interativo em quatro blocos fixos | M |
| RF-51 | Link de dossiê no domínio do produto, com App Links verificados | S |
| RF-52 | Exportação em PDF com ledger | S |
| RF-53 | Dossiê white-label e lote de URLs para corretor | C |
| RF-54 | **Formato WhatsApp**: resumo de 3 linhas por template (contagem de cartões por tipo, desconhecido principal, link) | M |
| RF-55 | Botão neutro **"Abrir no app de mapas"** (`geo:` no Android, `maps:` no iOS) para rota externa e transporte público; o app nunca lê o resultado | M |

### 6.7 Conta, créditos e Meus dossiês

| ID | Requisito | Prio |
|---|---|---|
| RF-60 | Uso sem cadastro até a cota gratuita; cadastro leve depois | S |
| RF-61 | Crédito = um dossiê. Cota inicial gratuita; compra de créditos; créditos ganhos por confirmação do edifício **só quando corroborada** (segunda confirmação independente no mesmo `dsqfl`, confirmação por GPS em campo, ou resolvedor em confiança alta concordando) e por feedback pós-visita. **Nunca** por documentos | S |
| RF-62 | Feedback pós-visita: "o que bateu, o que surpreendeu, o que faltou" | M (formulário); S (crédito) |
| RF-63 | **Meus dossiês**: lista com estado (em análise, visita marcada, visitado, descartado, fechado); motivo de descarte em uma linha, visível só ao usuário | M |
| RF-64 | **Fatos lado a lado**: dois dossiês em duas colunas, diferenças ordenadas por magnitude, sem recomendação, sem síntese de trade-off | M |
| RF-65 | **Comparáveis abertos pelo usuário**: outros anúncios abertos na mesma WebView, um por vez, lidos com a mesma lista branca, listados como "declarado pelo anunciante"; só lista e faixa, nunca média ponderada | M |

### 6.8 Não fazer (W)

Tudo da seção 3.2. Também: registrar o app como abridor padrão dos domínios dos portais **[DECISÃO, 12/10/2026]**; nível de preço de comércio via Places (os termos proíbem exibir conteúdo do Places com ou perto de mapa não-Google e proíbem armazená-lo; a única via, Places UI Kit, é pre-GA e não entrega o valor ao app) **[DECISÃO, 14/10/2026]**; Routes do Google e TomTom para trânsito (mesma restrição de mapa; licença TomTom só para asset management); vocabulário de certificação e pílulas de alerta por cor; comparação com recomendação.

### 6.9 Contexto urbano (camada edifício, escala declarada em destaque)

| ID | Requisito | Prio |
|---|---|---|
| RF-70 | **Alagamento ampliado**: faixas marginais de rios e canais (ODbL) já; pontos, polígonos e trechos de alagamento de 2026 e curvas de nível de 1 m após ofício (hoje só no ESIG, sem licença); MDT de 1 m por pedido à APAC. Nunca "risco de alagamento"; três fatos lado a lado | S (faixas marginais); P (ESIG) |
| RF-71 | **Calor**: temperatura de superfície do quarteirão por Landsat 8/9 C2 L2 (cenas sem nuvem do período seco), em °C acima ou abaixo da mediana do Recife na mesma cena, com data; árvores cadastradas em 200 m (censo arbóreo 2023). Camada de calor no mapa. Texto fixo: "temperatura da superfície, não do ar" | S |
| RF-72 | **Arboviroses**: notificações de dengue, zika e chikungunya por bairro de residência, série anual fechada (atraso acima de 9 meses), por 10 mil habitantes (Censo 2022); dados de paciente descartados na ingestão | S |
| RF-73 | **Barulho** (sinal exploratório): estação de metrô, classe da via (após ofício), bares em 200 m (OSM). Curvas de ruído do aeroporto: P. Medição real pelo modo visita | S; P (aeroporto, hierarquia viária) |
| RF-74 | **Crime por área** (SDS-PE): contagem bruta de CVLI e CVP nos últimos 12 meses, na menor escala pública (município, AIS ou bairro, a confirmar nos microdados), com fonte e mês. Sem cor, sem adjetivo, sem comparação com média. Texto fixo: "não descreve esta rua nem este prédio". Testar reação em E6 | S |
| RF-75 | **Renda do setor censitário** (Censo 2022): rendimento médio do responsável no setor, com fonte e ano, sob as mesmas regras do RF-74. Testar em E6 junto com crime | S |
| RF-76 | **Deslocamento com trânsito típico**: carro, horários 8h e 18h, via Mapbox Directions `duration_typical` sob demanda (chave no servidor, resultado nunca gravado, atribuição) ou estimativa própria com velocidade média dos radares da CTTU aplicada por classe de via sobre o grafo do openrouteservice (ODbL, gravável, rotulada "estimativa própria") | S |
| RF-77 | **Custo de vida por partes**: fixos da unidade; transporte por tarifa oficial × dias úteis × rota mais provável; mediana de condomínio por m² dos anúncios do bairro no ledger; cesta básica DIEESE (escala cidade); índice de preços anunciados da FIPE (escala cidade). Nunca um total | S |
| RF-78 | **Ônibus**: linhas, paradas e frequência | P (sem GTFS do Grande Recife) |

### 6.10 Modo visita (camada usuário, observação direta)

| ID | Requisito | Prio |
|---|---|---|
| RF-80 | Checklist do roteiro de visita com progresso e cronômetro para itens com tempo ("ducha e torneira por 60 s") | M |
| RF-81 | **Confirmação por GPS**: ao abrir o modo visita no local, o app compara a posição com o lote resolvido e grava a confirmação com origem "humano em campo" | M |
| RF-82 | **Foto da fachada e dos itens do checklist**; ficam só no aparelho; a fachada pode alimentar a confirmação (nunca sobe sem ação explícita do usuário) | M |
| RF-83 | **Ruído**: medição pelo microfone, janela aberta e fechada, 30 s cada, em dB(A) aproximado com aviso de calibração | M |
| RF-84 | **Bússola**: orientação da janela principal, alimenta o cartão de exposição solar | M |
| RF-85 | Feedback pós-visita (RF-62) ao encerrar o modo visita | M |

### 6.11 Domicílio (camada usuário, só no aparelho)

| ID | Requisito | Prio |
|---|---|---|
| RF-90 | Perguntas opcionais, dentro do dossiê, depois do bloco 4: quantas pessoas (1, 2, 3 a 4, 5+); criança em idade escolar (sim/não); veículos (nenhum, 1, 2+); modo de deslocamento (a pé/bike, ônibus, carro, moto); pet (sim/não). Fora: renda, idade, nome, relação entre as pessoas | S |
| RF-91 | Cada campo muda um cartão: m² por pessoa; camada de escolas e item de visita; vagas declaradas × necessárias; rota e tarifa do CTA; pergunta sobre regra de animais | S |
| RF-92 | Armazenamento só no aparelho, com `android.allowBackup: false`; texto na tela "fica só neste aparelho"; botão apagar; nenhum desses campos em telemetria ou relatório de erro | S |

---

## 7. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | **Linguagem calibrada por construção**: texto dos cartões gerado por templates por categoria de confiança, nunca por LLM livre; lista de afirmações proibidas vira teste automatizado antes de renderizar (sem "seguro", "perigoso", "vale a pena", "caro", "barato", "risco X%", "caixão" como afirmação) |
| RNF-02 | Sete categorias de confiança no ledger (observação direta, registro oficial, inferência, sinal exploratório, desconhecido, precisa de especialista, declarado pelo anunciante); **quatro rótulos na tela**: registro oficial (registro oficial, observação direta), declarado pelo anunciante, sinal (inferência, sinal exploratório), não sabemos (desconhecido, precisa de especialista). A categoria completa aparece por toque |
| RNF-03 | Ausência de registro nunca é apresentada como ausência de problema |
| RNF-04 | Fonte indisponível vira cartão "Desconhecido: não conseguimos consultar [fonte] agora"; nunca ausência silenciosa |
| RNF-05 | Conflito entre fontes vira cartão "Inconsistência" com ambas; nunca escolha silenciosa |
| RNF-06 | Privacidade (LGPD): nenhum HTML de anúncio armazenado além da sessão; documentos cifrados com retenção definida e sem uso para treino; localização do usuário usada só no modo visita, no aparelho, para confirmar o lote, e nunca armazenada no servidor; dados de um usuário nunca vendidos ou mostrados a outro; camada usuário (estado, notas, rotina, domicílio, fotos, medições) só no aparelho, com backup do Android desligado. **Lista branca de colunas por base na ingestão**: fora regime de tributação e campos de contribuinte (IPTU); logradouro, CEP e data de nascimento de paciente (arboviroses); CNPJ/CPF e razão social de requerente (licenciamento); nome de gestor (escolas); endereço de moradia em área de risco (Defesa Civil, pontos); dados de vítima (SDS). Nunca há tentativa de reidentificação |
| RNF-07 | Desempenho: mediana até o bloco 1 < 60 s no primeiro dossiê de um edifício; < 10 s quando a camada edifício já existe; p90 < 120 s |
| RNF-08 | Toda chamada a fonte tem contrato: esquema, data, cobertura, licença, comportamento se indisponível |
| RNF-09 | Versão do método gravada em cada registro do ledger |
| RNF-10 | Material do concurso sem nome de portal, logo, captura de tela de terceiros ou frase promocional; tecnologias habilitadoras citadas em texto factual (seção 2.3) |
| RNF-11 | **Licenças de dados**: tudo que vai ao ledger vem de fonte com licença aberta ou domínio público; tiles e índices derivados de bases ODbL carregam atribuição e são redistribuídos sob ODbL (share-alike); camadas sem licença declarada (ESIG da Prefeitura) só entram após ofício com resposta escrita |
| RNF-12 | **APIs comerciais**: só para enriquecimento sob demanda, calculado quando o usuário abre o cartão, nunca gravado, com atribuição conforme os termos e chave mantida no servidor. Nunca exibidas sobre ou perto do mapa próprio quando os termos o proíbem |
| RNF-13 | Cartões de escala bairro, setor, AIS ou município nunca recebem cor, comparação com média ou adjetivo; a escala aparece em destaque no claim |
| RNF-14 | Cartões de camada edifício são recalculados quando a base de origem atualiza; cartões de camada anúncio, quando o usuário reabre o link |

---

## 8. Especificação dos dados

### 8.1 Entidades

```
CAMADA EDIFÍCIO (chave dsqfl; compartilhada; cacheada)
Edificação cadastrada (dsqfl 14 dígitos, endereço_oficial, geometria, pavimentos, área_construída, lote, altura_m_3d, ano_levantamento_3d)
Edifício fiscal (logradouro, número, unidades, pavimentos, ano_construção_corrigido, padrão, área_mediana_por_unidade)
        — agregado de Unidade fiscal; ligado a Edificação cadastrada por coordenada do lote e por endereço
Transmissão (ano, data_transação, dsqfl ou endereço, área, avaliação_fiscal, padrão, tipo) — exibida só agregada por edifício
Processo de licenciamento (processo_id, dsqfl, lat, lon, assunto, situação, data_entrada, data_conclusão)
        — sem cnpj/cpf de requerente, sem razão social
Contexto urbano (dsqfl, cartões de escala quarteirão|setor|rua|bairro|AIS|município, cada um com fonte, data, licença)
Dossiê do edifício (dsqfl, cartões[], confirmações, gerado_em, versão_método, bases_e_datas[])
Tabela de resolução (nome_edifício_normalizado, dsqfl, confirmações, última_confirmação, origens[])

CAMADA ANÚNCIO (chave url; privada do usuário)
Anúncio (listing_id, url, fonte_portal_anonimizada, campos_declarados[] da lista branca, coletado_em)
Unidade fiscal (logradouro, número, complemento, bairro, área_construída, iptu_cobrado, exercício)
        — regime_tributação carregado só para agregados do edifício; nunca exibido por unidade; sem campo de contribuinte
Resolução (listing_id, dsqfl, lote, confiança {alta|média|baixa}, evidências[], origem {resolvedor|humano_mapa|humano_campo}, versão_método)
Cartão (card_id, listing_id ou dsqfl, camada {edifício|anúncio}, bloco {1..4}, claim, categoria, rótulo_tela, fonte, url_fonte,
        licença, data_ref, data_coleta, escala {unidade|edifício|lote|quarteirão|rua|setor|bairro|AIS|microárea|município},
        método, limitação, ação, versão_método)
Pergunta (question_id, operação {aluguel|compra}, texto, evidências_que_respondem[], status, ação_se_desconhecida)
Contestação (card_id, motivo {não_é_este_prédio|número_errado|desatualizado|outro}, texto, estado, resolvida_em)
Documento (doc_id, listing_id, tipo {ata|balancete|convenção|matrícula}, páginas, hash, enviado_em, retenção_até)
Evento documental (doc_id, tipo, página, trecho, data, status_aparente, confiança)

CAMADA USUÁRIO (só no aparelho; nunca sobe)
Estado do dossiê (listing_id, estado, motivo_descarte, alterado_em)
Rotina (até 3 pontos)
Domicílio (pessoas_faixa, criança_escolar, veículos_faixa, modo_deslocamento, pet)
Medição de visita (listing_id, gps_confirmou, fotos[], ruído_aberta_db, ruído_fechada_db, orientação_janela, checklist[], feedback)
```

### 8.2 Esquema do dossiê (JSON consumido pelo app)

Mantido o esquema da versão 1.1 com três mudanças: o objeto `edificio` (camada 1) é separado de `anuncio` (camada 2) e pode ser servido sozinho; cada cartão ganha `camada`, `rotulo_tela` e `licenca`; `resumo` ganha `confirmacoes_edificio`. Exemplo de cartão novo:

```json
{
  "id": "c7", "camada": "edificio", "bloco": 2, "categoria": "registro_oficial", "rotulo_tela": "registro_oficial",
  "claim": "Em 2025 a Prefeitura registrou 9 transmissões neste edifício; mediana da avaliação fiscal R$ 6.900 por m² construído.",
  "fonte": "Prefeitura do Recife, ITBI 2025", "licenca": "ODbL",
  "url_fonte": "https://dados.recife.pe.gov.br/dataset/imposto-sobre-transmissao-de-bens-imoveis-itbi",
  "data_ref": "2025-12-31", "data_coleta": "2026-10-14",
  "escala": "edifício", "metodo": "agregação por logradouro e número; mediana; N = 9",
  "limitacao": "Avaliação fiscal não é preço de venda; não inclui transmissões sem ITBI.",
  "acao": "Use como referência de faixa, não como valor do imóvel."
}
```

### 8.3 Fontes

Status verificado em 11, 12 e 14/10/2026. Licença ODbL exige atribuição e share-alike nas bases derivadas. "Sem licença" significa que a camada existe no ArcGIS da Prefeitura (ESIG) sem termos declarados e só entra após ofício.

| Fonte | Uso | Licença | Escala e data | Status | Limitação |
|---|---|---|---|---|---|
| Recife, Área Urbana: Edificações-Lotes, Edificações-Pavimentos, Lotes, Quadras, Trechos de Logradouro | Candidatas, pavimentos, área construída, endereço oficial, lote | ODbL | Lote; carga 03/2026 | **Confirmado** | Cobertura por bairro a medir (E4) |
| Recife, Edificações 3D (GeoJSON 605 MB, MultiPolygon 3D, campos MDE/MDT/MDS) | Altura em metros por bloco; sombra e exposição solar; mapa 3D | ODbL | Edificação; levantamento provável de 2013 (LiDAR) | **Confirmado** | LOD1; prédios posteriores a 2013 ausentes; máximo 99 m **[HIPÓTESE]**; cobertura a medir |
| Recife, IPTU por contribuinte e ano (CSV 2005 a 2026; 422.776 linhas em 2026) | Área e IPTU da unidade; ano, pavimentos, unidades, padrão do edifício; coordenada do lote; valor venal para a régua | ODbL | Unidade, anual; 03/10/2026 | **Confirmado**; 52 regimes enumerados | Ligação por endereço e coordenada; regime revela aposentado/servidor (nunca exibido); 2020 fora do datastore |
| Recife, ITBI (CSV 2015 a 2026; 13.852 linhas em 2026, coordenadas em 2026) | Transmissões por edifício; régua de preço | ODbL | Unidade por data; 03/10/2026 | **Confirmado** | Valor é avaliação fiscal, não preço; complemento identifica a unidade (só agregado) |
| Recife, Licenciamento Urbanístico (113.305 registros, 2017 a 06/2026) | Processos no lote e em 150 m; linha do tempo | ODbL | Lote (`dsqfl`, lat, lon); 17/06/2026 | **Confirmado** | Só processos digitais desde 2017; sem data de deferimento; CPF e razão social descartados |
| Recife, Registro de Atendimentos da Defesa Civil (2014 a 2025) | Ocorrências por trecho de rua | ODbL | Rua (endereço textual) | **Confirmado** | Sem coordenadas; 2025 vazio |
| Recife, Defesa Civil: 400 pontos de risco | Contexto | ODbL | Ponto; só Ibura e Jordão | **Confirmado** | Endereço de moradia: nunca exibido por ponto |
| Recife, Faixas marginais dos recursos hídricos (40, 60, 120 m) | Alagamento ampliado | ODbL | Polígono 1:5.000 | **Confirmado** | |
| Recife, ESIG: pontos (54), polígonos (78) e trechos (552) de alagamento 2026; curvas de nível 1 m e 5 m (2013); canais e bacias; temperatura de superfície 2018-19; hierarquia viária (6.799 trechos) | Alagamento, relevo, calor, barulho | **Sem licença** | Ponto, trecho, curva, pixel 30 m | **Confirmado** (existem) | Camadas de trabalho; podem mudar sem aviso; só após ofício |
| PE3D / APAC, MDT de 1 m | Relevo | Por solicitação | 1 m | Não verificado | |
| USGS, Landsat 8/9 Collection 2 Level 2 (ST_B10) | Temperatura de superfície por quarteirão | Domínio público, crédito | Pixel 30 m (térmico nativo 100 m); cenas datadas | **Confirmado** | Superfície, não ar; compara quarteirões, não lotes |
| Recife, Censo arbóreo 2023 | Árvores em 200 m | ODbL | Árvore | **Confirmado** | |
| Recife, Cobertura da terra 2013/14 (1:5.000) | Áreas verdes, mangue | ODbL | Polígono | **Confirmado** | Desatualizada |
| Recife, Casos de dengue, zika e chikungunya (2013 a 2025) | Arboviroses por bairro | ODbL | Bairro de residência, dia; 20/05/2026 | **Confirmado** | Sem 2026 (atraso > 9 meses); dados de paciente descartados |
| SDS-PE, estatísticas e microdados MVI (2004 a 09/2026) e CVP (2014 a 09/2026) | Crime por área | Não declarada | Município confirmado; AIS ou bairro a confirmar no xlsx | **Confirmado** (município) | Dados de vítima; LAI para granularidade |
| IBGE, Censo 2022, agregados por setor censitário | Renda do setor; população por bairro | Público | Setor | A confirmar o recorte de rendimento | Estigma: regras do RNF-13 |
| Recife, equipamentos: UBS (22), USF (131), hospitais municipais (6), maternidades (3), especializadas (4), escolas municipais 2023 (357), mercados públicos (6), feiras (17), estações de trem/metrô, malha cicloviária, faixas de ônibus | POIs do mapa | ODbL | Ponto; cargas 03 e 07/2026 | **Confirmado** | Só rede municipal (avaliar CNES); nome de gestor descartado |
| Recife, velocidade das vias por radar (2016 a 07/2026, contagens a cada 15 min) | Estimativa própria de trânsito | ODbL | Ponto do radar | **Confirmado** | Só nos pontos de radar |
| Grande Recife Consórcio, GTFS | Ônibus | | | **Não encontrado** | Pendente (LAI) |
| IBGE CNEFE 2022 | Coordenadas por endereço | Público | Endereço | **Confirmado** | Apartamento herda a coordenada do número |
| SGB, Carta de suscetibilidade (2015, 1:45.000) | Suscetibilidade | Crédito CPRM | Município | **Confirmado** | Não é setorização de risco |
| SGB, Setorização de risco | Risco oficial | | | **Confirmado que não cobre o Recife** (95 municípios de PE; Jaboatão, Olinda, Camaragibe, Paulista sim) | "Desconhecido oficial"; pedir setores à Defesa Civil municipal |
| ANAC, Portaria 1.255/SIA/2016 (PEZR do SBRF) | Ruído do aeroporto | Público (texto) | Curvas 2016 a 2029 | **Sem geometria pública** | Pendente (LAI à ANAC, operadora ou Prefeitura) |
| ITEP, Defesas Civis, MPPE: prédios-caixão por endereço | Cartão de maior impacto | | | **Não pública** | Pendente (parceria); tipologia documentada em UFPE 2015 |
| OpenStreetMap | Rede de pedestres, bares, nomes de edifício | ODbL | Variável | A medir por bairro | |
| FIPE, índice de preços anunciados (séries históricas xlsx, aba Recife) | Referência de cidade | Crédito | Município, mensal (set/2026: R$ 9.045/m² venda) | **Confirmado** | Preço de anúncio, não transação; nome do índice contém marca de portal: citar como "índice de preços anunciados da FIPE" |
| DIEESE, cesta básica | Custo de vida por partes | Crédito | Capital, mensal (set/2026: R$ 663,48) | **Confirmado** | Detalhe por produto é pago |
| Ademi-PE, pesquisa de lançamentos | Referência de lançamentos | A verificar | Município, trimestral | Via imprensa | Só lançamentos; licença a verificar |
| Mapillary | Foto de rua (pós-programa) | CC BY-SA 4.0 (parte NC-SA); termos 02/2024 | Ponto; cobertura densa em Boa Viagem | **Confirmado** | Uso comercial exige revisão jurídica; token só no servidor |
| Mapbox Directions (`duration_typical`) | Trânsito típico sob demanda | Termos 21/07/2026; 100 mil grátis/mês | Rota | **Confirmado** | Sem cache; atribuição; chave no servidor |
| Google Maps Platform (Places, Routes) | | ToS 26/08/2026 | | **Fora** | Proíbe uso com ou perto de mapa não-Google e cache de preço e duração |
| Página do anúncio, lida na WebView do usuário | Campos declarados | Termos dos portais; sem jurisprudência brasileira sobre leitura pelo usuário; **parecer pendente** | | Confirmado tecnicamente | Mitigações no RF-04 e RF-06 |
| Documentos do usuário | Leitor documental | Consentimento | | E3 pendente | Erro de extração; exige citação |
| CNM / SAEC (ONR) | Matrícula em compra | Pago pelo usuário | | Confirmado | Sem busca por endereço |

---

## 9. Arquitetura técnica

### 9.1 Visão

```
[App Expo / React Native 0.86, Android primeiro, development build]
  share intent (expo-share-intent) ─┐
  campo colar ──────────────────────┴─► URL/texto
        │
        ▼
  WebView no aparelho ─► texto renderizado + JSON-LD/OG ─► extração local por regras (lista branca)
        │                                                   │
        └────────────── texto livre ──────────────────────► API: LLM (edifício, andar, contradições)
        │
        ▼
[API FastAPI]
  resolvedor (candidatas PostGIS + regras) ─► confiança ─► (app: confirmação se média, ou sempre em compra)
  camada edifício por dsqfl (cache): cadastro, fiscal agregado, ITBI agregado, licenciamento 150 m, Defesa Civil,
      suscetibilidade, contexto urbano (faixas marginais, Landsat, árvores, arboviroses, SDS, Censo), régua, sombra pré-computada
  camada anúncio: unidade fiscal, consistência, custo, régua com o preço marcado
  ledger (PostgreSQL) ─► matriz de perguntas ─► templates por categoria ─► testes de wording
        │
        ▼
  dossiê JSON (edificio + anuncio) ─► app (4 blocos, mapa, Meus dossiês) ─► link / PDF / resumo WhatsApp
        │
  mapa: MapLibre + PMTiles próprios (lotes, edificações 3D, camadas de contexto) + openrouteservice (isócronas, rotas)
  sob demanda, não gravado: Mapbox Directions (trânsito típico)
  modo visita (só no aparelho): GPS → confirmação em campo; câmera; microfone; bússola (suncalc para o sol)
  (Etapa 4) upload cifrado ─► parsing ─► LLM com citação de página ─► eventos ─► ledger
```

### 9.2 Stack **[DECISÃO]**

| Camada | Escolha | Motivo |
|---|---|---|
| App | Expo 57 / React Native 0.86, development build com `expo-share-intent`, `react-native-webview`, `expo-location`, `expo-sensors`, `expo-camera`, `expo-av` (microfone); `android.allowBackup: false` | Share intent, sensores e MapLibre exigem código nativo; backup desligado para a camada usuário |
| Mapa | `@maplibre/maplibre-react-native` v11 (nova arquitetura), tiles vetoriais PMTiles gerados com tippecanoe a partir dos GeoJSON da Prefeitura (altura = MDS), servidor estático com Range | Sem custo por consulta; 3D por `fill-extrusion`; sombra pré-computada porque o wrapper RN não projeta sombra |
| Rotas | openrouteservice self-hosted (recorte de PE via osmium do PBF do Nordeste, 422 MB), perfis a pé, bicicleta, carro; isócronas com `maximum_intervals` ajustado | Sem restrição de cache, custo zero por consulta; VM de 4 a 8 GB **[HIPÓTESE]** |
| Trânsito típico | Mapbox Directions `driving-traffic` com `depart_at`, chamado pelo servidor | Único entre os avaliados que permite mapa próprio com atribuição; 100 mil grátis/mês |
| Backend | Python, FastAPI | Time de dados; coerente com PostGIS e DuckDB |
| Dados espaciais | PostgreSQL + PostGIS com Área Urbana, IPTU, ITBI, licenciamento, CNEFE carregados | Interseções, raios e junções por `dsqfl` |
| Raster | rasterio + Landsat C2 L2 por cena; estatística por quarteirão | Domínio público; método publicado no cartão |
| Auditoria de fontes | DuckDB | Exploração de CSV e GeoJSON grandes |
| Pareamento | Regras em fev; Splink (Fellegi-Sunter sobre DuckDB) na Etapa 4 | Explicável, barato, gera rótulos |
| LLM | Claude Opus 5.5 via API Anthropic, saída estruturada | Qualidade em texto livre; custo de centavos por anúncio |
| Texto dos cartões | Templates por categoria + testes automatizados | Auditabilidade |
| Contestação | Fila manual em board no Linear (fev); reexecução automática (Etapa 4) | Barato no protótipo |

### 9.3 Custo por dossiê **[HIPÓTESE, preços de lista]**

| Tarefa | Custo |
|---|---|
| Extração de um anúncio (Opus 5.5, 2.500 entrada, 300 saída) | ≈ US$ 0,016 |
| Mil anúncios por mês | ≈ US$ 16 |
| Leitura de 80 páginas de atas | ≈ US$ 0,28 |
| Trânsito típico (Mapbox, por consulta sob demanda) | US$ 0 até 100 mil/mês |
| openrouteservice, Landsat, PostGIS, tiles | Custo fixo da VM; sem custo marginal |

Custo não é restrição de produto. A restrição é de tempo de equipe (3 pessoas).

---

## 10. Modelo de negócio **[HIPÓTESE]**

- Cota inicial gratuita de dossiês por usuário; gratuito durante todo o programa.
- Créditos comprados avulsos.
- Créditos ganhos por confirmação do edifício **corroborada** (segunda confirmação independente, confirmação por GPS em campo ou concordância do resolvedor em confiança alta), por feedback pós-visita e por motivo de descarte informado em "Meus dossiês". Nunca por documentos: documento condominial é dado de terceiros, não pode ser revendido, e pagar por ele incentiva lixo. Crédito por confirmação não corroborada incentivaria tocar em qualquer pino **[DECISÃO, 13/10/2026]**.
- Canal corretor (Etapa 4): dossiê do edifício white-label por assinatura, modelo do precedente Sprift (Reino Unido). O que se vende é a camada edifício, construída de fontes oficiais e da tabela de resolução; nunca documentos, medições ou relatos de outro usuário.

---

## 11. Métricas e validação

### 11.1 Técnicas

| Indicador | Limiar inicial [HIPÓTESE] | Decisão se abaixo |
|---|---|---|
| Resolução de edifício (E1, 50 anúncios até dez; 200 até fev) | Top-1 alta ≥ 70%; top-3 ≥ 90%; falso match em alta < 2% (aluguel); 0 em compra (confirmação obrigatória) | Entrada por endereço + mapa vira principal |
| Cobertura de edificações cadastradas e de Edificações 3D por bairro (E4) | ≥ 80% nos 10 bairros com mais anúncios | Restringir bairros; cartão de sombra só onde o 3D cobre |
| Taxa de casamento IPTU × Edificações-Lotes por coordenada e endereço (E4) | ≥ 80% | Rever geocodificador |
| Extração por campo (E8) | Erro < 5% em preço, área, condomínio | Confirmação obrigatória de campos críticos |
| Claims sem fonte | 0% | Bloquear cartão |
| Wording proibido | 0 | Corrigir template; incidente |
| Leitor documental (E3, 30 conjuntos) | Recall ≥ 80%; página correta ≥ 95%; status ≥ 85% | Reduzir a localizador de trechos |
| Tempo até bloco 1 | Mediana < 60 s (primeiro dossiê do edifício); < 10 s (edifício cacheado) | Paralelismo; pré-carga |
| Mapa 3D em Android de entrada (E9) | ≥ 30 fps com zoom ≥ 15; sem crash em 10 min | Reduzir feições por tile; 3D só em zoom alto |
| openrouteservice (E10) | Build do recorte de PE < 2 h; isócrona < 1 s | Reduzir perfis |
| Landsat por quarteirão (E11, 2 bairros) | Diferença mediana entre quarteirões ≥ 2 °C em cenas secas | Cartão de calor fica em escala bairro |

### 11.2 Valor

| Indicador | Limiar [HIPÓTESE] | Decisão se abaixo |
|---|---|---|
| Descoberta nova (E2) | ≥ 50% das sessões | Rever fontes ou recorte |
| Superioridade sobre LLM genérico (E2, rubrica cega) | 0 claims falsos; ≥ 2 descobertas verificáveis a mais | Parar e voltar à pesquisa de dores |
| Compreensão (E6) | ≥ 8 de 10 explicam um cartão com as próprias palavras; ≥ 8 de 10 distinguem os 4 rótulos | Simplificar templates |
| **Estigma (E6)** | Cartões de crime e renda: ≤ 2 de 10 leem como "bairro perigoso/pobre" ou como juízo sobre o prédio | Retirar o cartão ou rebaixar para "ver mais" |
| Conclusão do fluxo | ≥ 80% das URLs chegam ao bloco 1 | Diagnosticar confirmação |
| Uso do modo visita | ≥ 30% dos dossiês com "visita marcada" têm ao menos uma medição | Simplificar checklist |
| Retorno com documentos | ≥ 25% em 14 dias | Melhorar pedido; canal corretor |
| Compartilhamento | ≥ 30% dos dossiês | Rever formato |
| Disposição a pagar / corretores (E6) | ≥ 20% pagariam; ≥ 3 corretores recorrentes | Reposicionar B2B2C |

---

## 12. Roteiro

| Fase | Período | Entregas | Portão |
|---|---|---|---|
| **0. Inscrição** | até 18/10/2026, 23h59 | Área Urbana, CNEFE, IPTU 2026 e ITBI 2026 carregados para 2 ou 3 bairros; 3 anúncios reais resolvidos à mão, com unidade fiscal localizada; Defesa Civil geocodificada nos trechos; 3 JSONs de dossiê; app Expo com telas de entrada, carregamento por etapas, confirmação, dossiê em 4 blocos, roteiro de visita e mensagem ao corretor, com dados fixos; dev build com share intent (limite de tempo, senão campo de colar); vídeo de 2 min; ficha Parte 3 sem logos, capturas ou nomes de portal | Ficha enviada |
| **1. Dados e testes técnicos** | 19/10 a 31/12/2026 | E4 (cobertura por bairro de Edificações, 3D e taxa de casamento IPTU × Lotes); E1 mini (50 anúncios rotulados); geocodificador compartilhado (Defesa Civil, IPTU, CNEFE); esquema do ledger com as três camadas; E9 (MapLibre 3D em Android de entrada, development build); E10 (openrouteservice: recorte de PE, build, declividade a pé); E11 (Landsat em 2 bairros); confirmar rendimento por setor no Censo 2022; abrir o xlsx da SDS (granularidade); ofícios à Prefeitura (ESIG, EMLURB, SEMOC/UIG, Finanças) e LAI (SDS, ANAC, Grande Recife, Defesas Civis, ITEP) protocolados; parecer jurídico encomendado (WebView, Mapillary); tiles PMTiles dos bairros-alvo | Números de resolução e cobertura; resultados de E9 a E11 decidem o que sai do protótipo |
| **2. Protótipo** | 18/01 a 26/02/2027 | Os 12 itens M: entrada por share e colar; WebView + extração híbrida (demo com dossiês pré-gerados); resolvedor por regras + confirmação no mapa; dossiê em 4 blocos com cadastro, fiscal, Defesa Civil, suscetibilidade, consistência, custo; ITBI agregado; licenciamento em 150 m; roteiro + mensagem + formato WhatsApp; mapa com POIs e isócronas em 2 ou 3 bairros; modo visita completo (checklist, GPS, foto, cronômetro, ruído, bússola); Meus dossiês + fatos lado a lado + comparáveis; CTA de caminhos (a pé, carro sem trânsito, botão neutro); régua de preço; contestação com fila manual; camada edifício cacheada; templates e testes de wording; teste com 10 usuários moderados (E6, incluindo o teste de estigma com cartões de crime e renda em protótipo de papel) | Demo na Semana Imersiva |
| **3. Finalização** | 03/03 a 17/06/2027 | Metas da banca; Splink; linha do tempo; distância declarada; rotina; mapa 3D; sombra e exposição solar; trânsito típico (Mapbox ou radares CTTU); calor (Landsat + árvores); alagamento ampliado (faixas marginais já; ESIG se o ofício responder); arboviroses; barulho (metrô, bares; via se o ofício responder); crime e renda (se E6 aprovar); custo por partes; domicílio no aparelho; leitor documental (E3); App Links; PDF; créditos corroborados; contestação automática; indício de tipologia; contagem de confirmações; 2 ou 3 corretores parceiros; uso real medido; auditoria de 50 dossiês | Realização |
| **4. Pós-programa** | 2º semestre 2027 | Mapillary; white-label e lote para corretor; itens pendentes conforme parcerias responderem (GTFS, ruído do aeroporto, setores de risco, prédios-caixão por endereço, camadas do ESIG) | Evidência de retenção |
| **Horizonte** | | Segunda cidade (resolvedor parametrizável); sinais compostos só com ≥ 100 observações de ground truth | |

Pendências de parceria, com dono e data-alvo **[a preencher pela equipe]**:

| Pendência | Órgão | Instrumento | Dono | Data-alvo |
|---|---|---|---|---|
| Alagamentos 2026, curvas 1 m, temperatura 2018-19, hierarquia viária, data do 3D | Prefeitura (ESIG, EMLURB, SEMOC/UIG) | Ofício | | nov/2026 |
| Semântica do valor do ITBI; regra de agregação | Sec. de Finanças | Ofício | | nov/2026 |
| Crime por AIS ou bairro | SDS-PE | LAI | | nov/2026 |
| Curvas de ruído do PEZR | ANAC / operadora / Prefeitura | LAI | | dez/2026 |
| GTFS | Grande Recife Consórcio | LAI ou parceria | | dez/2026 |
| Setores de risco R1 a R4 | Defesa Civil do Recife | Parceria | | dez/2026 |
| Prédios-caixão por endereço (sem moradores) | Defesas Civis, ITEP, MPPE | LAI ou parceria | | 1º tri/2027 |
| MDT 1 m | APAC | Solicitação | | dez/2026 |

---

## 13. Riscos

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Taxa de resolução automática baixa em Recife | Média | Alto | E1 mini até dez; confirmação humana como parte do fluxo; entrada por endereço (camada edifício) como plano B |
| R2 | Leitura da página na WebView contestada juridicamente ou bloqueada por anti-bot | Média | Alto | Servidor nunca toca o portal; lista branca de campos; sem contorno de anti-bot; fallback colar/print; parecer antes da Etapa 4; dossiês pré-gerados na demo |
| R3 | Sem setorização oficial de risco para o Recife (**confirmado**: SGB cobre 95 municípios de PE, não o Recife) | Materializado | Médio | Defesa Civil por trecho; suscetibilidade rotulada; "desconhecido oficial" no bloco 4; pedir setores à Defesa Civil municipal |
| R4 | Defesa Civil e IPTU sem `dsqfl`: ligação por endereço textual imprecisa (licenciamento tem `dsqfl` e coordenadas, risco reduzido) | Média | Médio | Geocodificador único; IPTU por coordenada do lote; escala declarada; taxa de casamento medida em E4 |
| R5 | Substituição por LLM genérico | Alta | Médio | Diferencial é identidade resolvida, proveniência e observação direta; E2 cego |
| R6 | Banca percebe o produto como "só agregação" | Média | Médio | Demo centrada na resolução no mapa, na inconsistência real, na régua e no modo visita; IA nomeada onde está |
| R7 | Economia B2C fraca | Média | Médio | Créditos por dados; canal corretor na Etapa 4 |
| R8 | Falso match em confiança alta atribui registro ao prédio errado | Baixa | Alto | Confirmação obrigatória em compra; limiar conservador em aluguel; origem registrada; "não é este prédio" reabre a confirmação; auditoria |
| R9 | Dev build, sensores e MapLibre atrasam o protótipo | Média | Médio | E9 e E10 em dezembro; campo de colar e mapa 2D como fallbacks; modo visita sem ruído e bússola se preciso |
| R10 | Escopo inflar de novo | Alta | Médio | Este PRD; mudança de escopo exige revisão da seção 6; 12 itens M são o teto |
| R11 | Bases oficiais misturam dados de pessoas (regime de IPTU, pacientes, requerentes, moradores em risco, vítimas) | Média | Alto | Lista branca de colunas por base (RNF-06); agregação mínima; política escrita; nenhuma reidentificação |
| R12 | Edificações 3D de 2013: prédios novos ausentes, torres truncadas; cartão de sombra errado em lançamentos | Alta | Médio | Texto fixo no cartão; cartão só onde o 3D cobre o lote; licenciamento recente sinaliza obra posterior; ofício sobre data e método |
| R13 | Cartões de escala bairro (crime, renda, arboviroses) estigmatizam e são lidos como juízo sobre o prédio | Média | Alto | RNF-13; teste de estigma em E6 antes de qualquer tela; retirada se ≥ 3 de 10 lerem como juízo; regulamento 11.20 (ii) |
| R14 | Protótipo ambicioso demais para 3 pessoas em 6 semanas | Alta | Alto | Fase 1 antecipa os testes técnicos; ordem de corte definida: 3D → ruído/bússola → comparáveis → régua com ledger (mantém só ITBI) → isócronas (mantém POIs em linha reta) |
| R15 | Termos de APIs comerciais mudam ou são violados por descuido | Baixa | Alto | RNF-12; nenhuma chave no app; nenhum dado comercial no ledger; revisão trimestral dos termos |
| R16 | Camadas do ESIG sem licença entram por descuido ou somem | Média | Médio | RNF-11; só após ofício; cópia local datada; cartão "não conseguimos consultar" se sumir |
| R17 | Entrada por endereço (plano B) expõe a camada edifício a consulta em lote por corretores sem contrato | Baixa | Médio | Limite por sessão; cadastro leve acima da cota |

---

## 14. Questões em aberto

**Técnicas (resolver na Fase 1; o resultado pode cortar itens do protótipo)**
1. Taxa de casamento IPTU × Edificações-Lotes e cobertura do 3D por bairro (E4).
2. MapLibre 3D em Android de entrada: fps e memória (E9).
3. openrouteservice: tempo de build do recorte de PE; declividade no perfil a pé (E10).
4. Landsat em 2 bairros: a diferença entre quarteirões aparece? (E11)
5. Censo 2022: o rendimento por setor está publicado no recorte imaginado?
6. Microdados da SDS: há AIS ou bairro?
7. O que cada app de portal envia na folha de compartilhamento (teste de 10 minutos).
8. Precisão da geocodificação da Defesa Civil contra CNEFE.
9. Calibração do microfone para dB(A) aproximado em aparelhos de entrada.

**Jurídicas (parecer, não opinião)**
10. Leitura na WebView frente às cláusulas anti-automação dos portais; responsabilidade como terceiro; injeção de script como "meio" (LPI art. 195).
11. Uso comercial do Mapillary.
12. Licença da pesquisa da Ademi-PE para a régua.
13. CDC, se houver monetização.

**Parcerias (seção 12, tabela de pendências)**
14. Ofícios e LAIs protocolados e respondidos.

**Produto**
15. Forma da Semana Imersiva, divulgada em 04/12.
16. Campos exatos do "ver fonte" para a régua sem expor unidade.
17. Nome do produto (pode mudar; fora deste PRD).

---

## 15. Registro de decisões

| Data | Decisão | Alternativas | Motivo |
|---|---|---|---|
| 11/10/2026 | Um anúncio, Recife, apartamentos, sem score | Buscador; comparador; score | Única decisão melhorável sem inventário nem scraping; precedente Zillow/First Street |
| 11/10/2026 | Categoria Tecnologias Urbanas | Diversidade | Regulamento cita moradia e segurança literalmente |
| 11/10/2026 | React Native com Expo, Android primeiro | PWA; Kotlin; bot WhatsApp | Fullstack no time; share intent nativo; banca de telecom |
| 11/10/2026 | Ficha com aluguel e compra; protótipo demonstra fluxo de aluguel | Dois fluxos completos | Volume e ciclo curto para uso real; matriz de compra na tela final |
| 11/10/2026 | Servidor nunca acessa portal; leitura na WebView do aparelho | Fetch de servidor | Portais retornam 403 a servidor e proíbem scraping; WebView é o navegador do usuário |
| 11/10/2026 | Extração híbrida: regras + LLM só em texto livre | LLM em tudo; só regras | Campos estruturados existem; LLM necessário para nome de edifício em texto livre |
| 11/10/2026 | Opus 5.5 na extração | Haiku 4.5 | Qualidade em descrição livre; custo irrelevante no volume |
| 11/10/2026 | Origem da resolução gravada no ledger | Só confiança | Ativo de dados, diagnóstico de erro, linguagem no dossiê |
| 11/10/2026 | Mock com 3 anúncios reais resolvidos à mão | Dados inventados | Vídeo e ficha com números verdadeiros |
| 12/10/2026 | Não registrar o app como abridor padrão dos domínios dos portais | Intent filter https | Exige arquivo do dono do domínio; Android 12+ manda ao navegador |
| 12/10/2026 | Leitor documental como meta da Etapa 4 | No mock de fevereiro | Sem corpus de atas com consentimento em 6 dias |
| 12/10/2026 | "Dossiê" e "cartão" como termos oficiais | Relatório; check | "Relatório" soa PDF; "check" soa veredito |
| 12/10/2026 | IPTU por unidade e Licenciamento entram como fontes | Só cadastro de edificações | Verificam área e IPTU declarados; dão número, pavimentos e ano ao resolvedor |
| 12/10/2026 | Custo mensal com parcelas "informado", "do cadastro" ou "não informado"; nunca "oculto" | Linguagem de taxa oculta | Acusação sem prova viola RNF-01 |
| 13/10/2026 | Protótipo ambicioso: quatro superfícies (dossiê, mapa, modo visita, Meus dossiês) | Só dossiê em 4 blocos | Modo visita e mapa respondem "uso de telefonia" e "inovação"; cada peça tem fonte aberta ou vem do aparelho |
| 13/10/2026 | Observação direta pelo celular no modo visita (GPS, câmera, microfone, bússola) | Só checklist | Categoria do RNF-02 que nenhuma base pública oferece; ground truth de graça para a tabela de resolução |
| 13/10/2026 | Clipboard rebaixado a C; "desconhecido oficial" vai ao bloco 4; crédito só por confirmação corroborada; 7 categorias viram 4 rótulos na tela | Manter como no 1.1 | Aviso do Android; papel de parede; incentivo a tocar em qualquer pino; carga cognitiva do leigo |
| 13/10/2026 | Versão fato de cada proxy (barulho, calor, alagamento, crime, custo): nunca score, sempre escala declarada | Scores compostos | Fato com escala é verificável; score é veredito |
| 14/10/2026 | Leitura do 11.20 (iv): tecnologias habilitadoras citadas em texto factual; benchmarking nomeado na apresentação; sem logos, capturas ou elogios | Nenhuma marca em lugar nenhum | O inciso mira "menção que caracterize a divulgação"; regras de inscrição tratam de quem participa |
| 14/10/2026 | Dados do Google (Places, Routes) fora do produto com mapa próprio; Mapbox sob demanda para trânsito típico | Mapa Google no lugar do 3D | Termos proíbem uso com ou perto de mapa não-Google e cache; o 3D da Prefeitura vale mais que o nível de preço |
| 14/10/2026 | Histórico de preços entra como histórico de fatos (ITBI, valor venal, anúncios do ledger); régua de faixa observada em vez de previsão | Previsão aproximada; manter fora | O bloqueio era de fonte, não de princípio; faixa tem fonte, previsão não |
| 14/10/2026 | Comparação entra como fatos lado a lado, sem síntese de trade-off | Síntese "qual é melhor" | Trade-off exige preferências antes do resultado e assume a escolha; diff de fatos não |
| 14/10/2026 | Crime e renda do setor entram como contagem bruta com escala, sem cor nem adjetivo, condicionados ao teste de estigma em E6 | Fora por princípio | Fato com fonte; o risco é de leitura, logo se testa a leitura |
| 14/10/2026 | Indício de tipologia de prédio-caixão só com 3 sinais e só como "precisa de especialista" | Afirmar tipologia; nada | Lista por endereço não existe; associação falsa estigmatiza; sinais documentados (UFPE 2015) |
| 14/10/2026 | Três camadas de dados (edifício, anúncio, usuário); dossiê do edifício como entidade | Dossiê único | DSQFL liga 4 bases; cache; entrada por endereço; canal corretor; privacidade por construção |
| 14/10/2026 | Domicílio em faixas, só no aparelho, allowBackup desligado, sem telemetria | No servidor com consentimento | LGPD art. 4º, I; "fica só neste aparelho" precisa ser verdade |
| 14/10/2026 | Contestação com "ver fonte" mostrando a agregação; fila manual no protótipo; nunca esconde o cartão | Esconder ao contestar | Metade das contestações morre ao ver o cálculo; esconder dá poder ao anunciante |
| 14/10/2026 | Itens dependentes de parceria ficam como P (pendente), não W | Marcar como fora | O critério "Articulação" do concurso valoriza a parceria; o dado pode chegar |

---

## 16. Glossário

Ver `CONTEXT.md`. Termos centrais: anúncio, dossiê, cartão, camada (edifício, anúncio, usuário), declarado pelo anunciante, edificação cadastrada, DSQFL, edifício resolvido, confirmação do edifício (mapa, campo), modo rua, régua de preço, avaliação fiscal, fatos lado a lado, modo visita, observação direta, contestação, leitor documental, feedback pós-visita, crédito corroborado, pendente de parceria.
