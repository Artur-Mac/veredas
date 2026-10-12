# PropSight — Product Requirements Document (PRD)

| Campo | Valor |
|---|---|
| Versão | 1.1 (documento base; incorpora revisão do mock de frontend e duas fontes novas) |
| Data | 12 de outubro de 2026 |
| Status | Escopo fechado para inscrição no Campus Mobile 15ª edição; protótipo em construção |
| Donos | Equipe PropSight (3 pessoas, Recife) |
| Documentos relacionados | `CONTEXT.md` (glossário), `PropSight_critical_assessment.md`, `PropSight_proposed_solution.md`, Regulamento Campus Mobile 15ª edição |

Convenção: **[FATO]** verificado em fonte citada; **[HIPÓTESE]** suposição a testar; **[DECISÃO]** escolha tomada pela equipe, com motivo.

Nota desta cópia: nomes de portais e de empresas foram trocados por descrições neutras, por causa do item 11.20 (iv) do regulamento. Todo o resto é idêntico à versão 1.1.

---

## 1. Resumo

PropSight é um aplicativo móvel que transforma o link de um anúncio de apartamento em Recife em um **dossiê de evidências**: qual edifício é aquele e com que confiança, o que os registros públicos dizem sobre ele e sobre a rua, o que o anúncio declara e onde ele se contradiz, e o que ainda não se sabe, com a lista exata de documentos a pedir e perguntas a fazer antes de visitar ou assinar.

O produto não emite nota, não recomenda, não estima preço e não busca imóveis. Cada afirmação tem fonte, data e escala. "Não sabemos" é uma saída válida e de primeira classe.

**Uma frase:** compartilhe o anúncio, veja o prédio certo no mapa, saiba o que é fato, o que é promessa do anunciante e o que ainda falta confirmar.

---

## 2. Contexto e motivação

### 2.1 O problema

Quem aluga ou compra apartamento em Recife decide com três fontes: o anúncio (escrito por quem quer fechar negócio), a visita (30 minutos num horário escolhido pelo corretor) e a memória de conhecidos. As informações que mudariam a decisão existem, mas estão espalhadas e ilegíveis para leigos: cadastro municipal de edificações, atendimentos da Defesa Civil, cartas de suscetibilidade do Serviço Geológico, atas e balancetes do condomínio. Levantar isso à mão leva horas e exige saber que existe.

Recife agrava o problema: cerca de 26,5% dos domicílios são alugados (acima da média nacional de 22%) e 30% são apartamentos, o maior percentual de Pernambuco **[FATO, Censo 2022, resultados preliminares via Folha de Pernambuco, dez 2024]**. A cidade tem histórico documentado de prédios-caixão condenados (161 no município dentro do acordo de 2024, 431 na região metropolitana **[FATO, TRF5/MPPE]**) e de alagamentos recorrentes.

### 2.2 Por que agora

- Dados municipais abertos de qualidade suficiente para resolver identidade de edifício existem desde março de 2026: Edificações-Lotes, Edificações-Pavimentos, Edificações 3D, Lotes, Quadras, em GeoJSON sob ODbL **[FATO, dados.recife.pe.gov.br]**.
- CNEFE 2022 do IBGE traz coordenadas por endereço para o Recife **[FATO]**.
- A Prefeitura publica o **cadastro fiscal do IPTU por unidade** (2005 a 2026, com endereço, complemento, área construída, ano de construção, pavimentos, valor venal e IPTU cobrado) e os **processos de licenciamento urbanístico** (alvarás de construção, reforma e demolição por endereço) **[FATO, dados.recife.pe.gov.br, verificado em 12/10/2026]**. Isso permite verificar área e IPTU declarados por unidade e reforçar a resolução de edifício com número, pavimentos e ano.
- LLMs tornam barata a extração de campos de texto livre e a leitura de documentos com citação de página.
- Os portais investem em busca, conversa e preço (os dois maiores grupos nacionais); nenhum tem produto de verificação pós-descoberta para o consumidor **[FATO, benchmark na avaliação crítica]**.

### 2.3 Contexto do concurso

Programa Campus Mobile 15ª edição (Instituto Claro), categoria **Tecnologias Urbanas** **[DECISÃO]**.

| Etapa | Data | O que pesa |
|---|---|---|
| Inscrição | até 18/10/2026 | Perfil do time (peso 8 de 16), impacto (3), originalidade e uso de IA (2), viabilidade (2), clareza (1) |
| Seleção | resultado em 04/12/2026 | Até 17 projetos por categoria |
| Fase preparatória | 18/01 a 19/02/2027 | Mentoria remota |
| Semana Imersiva (São Paulo) | 21 a 26/02/2027 | Demo de protótipo em dispositivo móvel (eliminatório); implementação, design, articulação, inovação |
| Finalização | 03/03 a 17/06/2027 | Metas da banca; protótipo funcional; **uso real pelo público-alvo** |

Restrições do regulamento que afetam o produto: uso obrigatório de telefonia móvel (2.5); proibição de menção a marcas de empresas no projeto (11.20 iv), portanto nenhum portal é nomeado em material do concurso; cessão de direitos de divulgação da ideia ao Instituto (10.3).

---

## 3. Objetivos e não-objetivos

### 3.1 Objetivos

| # | Objetivo | Como se mede |
|---|---|---|
| O1 | Reduzir de horas para um minuto o levantamento do que é público sobre um edifício anunciado | Mediana de tempo até o primeiro bloco do dossiê < 60 s |
| O2 | Mostrar, na maioria dos anúncios, ao menos um fato verificável que o usuário não encontraria sozinho e que muda uma pergunta, uma visita ou uma proposta **[HIPÓTESE]** | ≥ 50% das sessões com "descoberta nova" autodeclarada |
| O3 | Zero afirmações falsas; toda afirmação com fonte, data e escala | Auditoria de 50 dossiês: 0 claims sem fonte; 0 wording proibido |
| O4 | Converter incerteza em ação | Toda pergunta "desconhecida" gera documento a pedir, pergunta, item de visita ou encaminhamento |
| O5 | Acumular o único ativo defensável: a tabela de resolução "nome do edifício → edificação cadastrada" para Recife | Confirmações humanas registradas por dossiê |

### 3.2 Não-objetivos (explicitamente fora do produto)

Buscador de imóveis; comparação ou ranking entre imóveis; score ou nota de risco; estimativa de preço ou "valor justo"; histórico de preço; detecção de duplicatas entre portais; conforto térmico, ruído ou risco de alagamento modelados; inspeção visual de fotos; áudio; LiDAR; relatos de moradores; preferências inferidas; chat livre; agente que contata terceiros; qualquer cidade além de Recife; coleta longitudinal de anúncios por scraping.

Motivo comum **[DECISÃO]**: cada um desses itens ou exige dado que não existe de forma lícita e validável, ou replica incumbentes, ou cria risco de falsa garantia (precedente: um grande portal americano retirou em 2025 os scores climáticos de um fornecedor de modelos de risco, após contestação de precisão).

---

## 4. Usuários

### 4.1 Usuário primário

Pessoa física em Recife que **já encontrou um anúncio** de apartamento em edifício e está a até duas semanas de decidir se visita, propõe ou assina. Aluguel e compra.

Perfil típico: usa o celular para tudo, abre o anúncio no app do portal, manda o link para parceiro ou família por mensagem, agenda visita pelo app. Não sabe que o cadastro municipal existe. Não lê 80 páginas de ata.

### 4.2 Usuário secundário (Etapa 4 em diante)

Corretor ou imobiliária em Recife que quer entregar ao cliente um documento neutro e verificável sobre o edifício, como diferencial de atendimento. Canal de distribuição e de receita **[HIPÓTESE, testar na Etapa 4]**.

### 4.3 Cenários

1. **Thaís, 29, aluguel em Boa Viagem.** Viu um anúncio de 2 quartos por R$ 2.800, "condomínio isento", sem IPTU informado. Compartilha o link. O dossiê identifica o edifício (12 pavimentos, cadastrado), mostra que a descrição diz 86 m² e o campo estruturado 80 m², marca IPTU e seguro-fiança como desconhecidos, e gera a pergunta "qual a área privativa na matrícula?".
2. **Marcos e Lia, 41 e 38, compra em Casa Forte.** Anúncio sem número e sem nome do prédio. O app mostra 3 candidatos no mapa com endereço oficial e número de pavimentos; eles reconhecem a fachada e tocam. O dossiê lista 7 desconhecidos de compra e pede atas, balancete, convenção e matrícula. Duas semanas depois enviam as atas; o leitor documental aponta cota extra aprovada na página 14.
3. **Corretor Jorge.** Gera dossiês dos 5 imóveis que vai mostrar no sábado e envia aos clientes antes da visita.

---

## 5. Jornada do usuário (primeiro uso)

| Passo | Usuário | Sistema | Tela | Tempo |
|---|---|---|---|---|
| 0 | Abre o app | Verifica área de transferência em primeiro plano; se houver link de anúncio, oferece "Analisar este anúncio?" | Um campo: "Compartilhe ou cole o link do anúncio". Sem cadastro | 0 s |
| 1 | Compartilha o anúncio pelo app do portal (ou cola o link) | Recebe URL via share intent; abre a página numa WebView no aparelho; lê o texto renderizado e os dados estruturados; extrai campos; marca tudo como "declarado pelo anunciante" | "Lendo o anúncio…" com campos aparecendo (preço, condomínio, IPTU, área, quartos, andar, edifício, rua, bairro). Campo tocável para corrigir | 5 a 15 s |
| 2 | Só se necessário: toca no prédio correto | Resolvedor gera candidatos e pontua. Confiança alta pula este passo | Mapa com 2 ou 3 pinos, cada um com endereço oficial e número de pavimentos. "Qual é o prédio? (não temos certeza)" | 5 s |
| 3 | Aguarda | Enriquecimento paralelo e escrita do ledger | Tela de carregamento como lista de etapas do pipeline, cada uma marcada ao concluir: anúncio lido, edifício resolvido, cadastro de edificações, cadastro fiscal, Defesa Civil, licenciamento, consistência, desconhecidos sintetizados | 10 a 30 s |
| 4 | Lê **Bloco 1, Identidade** | | "Edifício X, Rua Y nº N. Identificado automaticamente (confiança alta)" ou "confirmado por você". Pavimentos, área construída, ano de construção e número de unidades cadastradas | |
| 5 | Lê **Bloco 2, Registros oficiais** | | Cartões com categoria, fonte, data, escala. Ex.: "Unidade 1002: 84 m² de área construída e IPTU de R$ 1.140 em 2026 no cadastro fiscal." / "4 atendimentos da Defesa Civil no trecho da rua em 2024 (alagamento de via). Escala: rua, não o edifício." / "Alvará de reforma de fachada deferido em 2025 para este endereço" | |
| 6 | Lê **Bloco 3, O que o anúncio declara e o que não bate** | | Ex.: "Declarado: 80 m² no campo e 86 m² na descrição; cadastro fiscal: 84 m² construídos. Confirme a área privativa na matrícula." Custo mensal total como barra segmentada (aluguel, condomínio, IPTU, seguro), cada parcela com origem: informado no anúncio, do cadastro fiscal, ou não informado | |
| 7 | Lê **Bloco 4, O que ainda não sabemos** | | Lista de desconhecidos, cada um com ação. Dois atalhos: **roteiro de visita** (checklist com progresso, gerado dos itens de visita) e **mensagem pronta para o corretor** (perguntas e documentos a pedir, com copiar e compartilhar) | |
| 8 | Opcional, depois: envia atas, balancetes, convenção | Leitor documental | Eventos com página e trecho; desconhecidos viram respondidos | min |
| 9 | Compartilha o dossiê | Link no domínio do produto (App Link verificado) ou PDF | Documento legível por terceiros | s |
| 10 | Opcional, nunca antes do passo 7: informa até 3 pontos de rotina | Rotas reais (fase posterior) | Bloco 2 ganha cartões de deslocamento | |

Decisões de desenho **[DECISÃO]**: nenhuma pergunta de preferência antes do resultado; a confirmação do edifício é a única entrada obrigatória além do anúncio, e só quando necessária; os quatro blocos têm ordem fixa; não existe número-resumo, o "resumo" é a contagem de cartões por tipo.

---

## 6. Requisitos funcionais

Prioridade MoSCoW. **M** = obrigatório no protótipo da Semana Imersiva (fev/2027); **S** = Etapa 4 (mar a jun/2027); **C** = pós-programa; **W** = não fazer nesta versão.

### 6.1 Entrada e extração

| ID | Requisito | Prio |
|---|---|---|
| RF-01 | O app aparece na folha de compartilhamento do Android e recebe texto e URL compartilhados de qualquer app | M |
| RF-02 | O app aceita URL ou texto colados num campo | M |
| RF-03 | Ao abrir em primeiro plano, o app detecta link de anúncio na área de transferência e oferece análise (nunca em segundo plano) | S |
| RF-04 | Quando só há URL, o app abre a página numa WebView no aparelho do usuário, visível, e lê o texto renderizado e os dados estruturados (schema.org, Open Graph) após o carregamento | M |
| RF-05 | O servidor do produto **nunca** acessa o portal de anúncios | M |
| RF-06 | Extração híbrida: regras determinísticas para campos estruturados (preço, condomínio, IPTU, área, quartos, vagas, rua, bairro, coordenadas quando existirem); LLM apenas para nome do edifício, andar e contradições na descrição livre | M |
| RF-07 | Todo campo extraído é gravado com a categoria "declarado pelo anunciante" e é editável pelo usuário com um toque | M |
| RF-08 | Se a WebView falhar (anti-bot, layout), o app pede o texto colado ou um print; OCR no aparelho é fallback de emergência | S |

### 6.2 Resolução de identidade

| ID | Requisito | Prio |
|---|---|---|
| RF-10 | Gerar candidatas a partir de Edificações-Lotes (filtro por logradouro e bairro), com pavimentos e área construída agregados de Edificações-Pavimentos pelo código de 14 dígitos, mais o cadastro fiscal do IPTU agregado por logradouro e número (pavimentos, ano de construção, número de unidades, distribuição de área por unidade), CNEFE e OSM | M (manual no mock; automático em jan) |
| RF-11 | Pontuar candidatas (nome do edifício fuzzy, número quando houver, andar declarado × pavimentos, área declarada × áreas das unidades no cadastro fiscal, ano de construção quando o anúncio o declara) e classificar em confiança alta, média, baixa | S (regras simples em fev; Splink em Etapa 4) |
| RF-12 | Confiança alta: associa sem perguntar. Média: mostra 2 ou 3 pinos com endereço oficial e pavimentos e pede confirmação. Baixa: dossiê em **modo rua** | M |
| RF-13 | Gravar no ledger: anúncio, código da edificação, lote, confiança, evidências do match e **origem da decisão** (resolvedor ou humano) | M |
| RF-14 | Cada confirmação humana alimenta a tabela "nome do edifício → edificação cadastrada" | S |

### 6.3 Cartões de evidência

| ID | Requisito | Prio |
|---|---|---|
| RF-20 | Cada cartão exibe: claim, categoria de confiança, fonte com link, data de referência, data de coleta, escala espacial, método, limitação principal, ação sugerida; camadas 2 e 3 por toque. Estrutura visual em tríade (achado, o que muda, ação) sobre esses campos | M |
| RF-21 | **Edificação cadastrada**: pavimentos, área construída, endereço oficial, lote. Fonte: Área Urbana, Recife | M |
| RF-22 | **Cadastro fiscal da unidade e do edifício**: área construída da unidade (quando o complemento do anúncio bate), IPTU cobrado e regime de tributação, ano de construção, pavimentos, número de unidades e padrão construtivo do edifício. Fonte: IPTU por contribuinte e ano, Prefeitura do Recife. Só campos do imóvel; os campos de contribuinte (pseudonimizados) nunca são lidos, armazenados ou exibidos | M |
| RF-23 | **Atendimentos da Defesa Civil** no trecho de rua, 2021 a 2024, com grau de risco quando houver; escala declarada como rua; base geocodificada pelo produto a partir de endereço textual | M |
| RF-24 | **Suscetibilidade** a movimentos de massa e inundação (carta SGB 2015, 1:45.000), sempre rotulada como suscetibilidade, nunca como risco | M |
| RF-25 | **Desconhecido oficial**: "não há setorização oficial de risco alto e muito alto para o Recife nas bases do SGB; verifique com a Defesa Civil" | M |
| RF-26 | **Consistência**: área declarada × descrição × cadastro de edificações × cadastro fiscal; andar declarado × pavimentos; IPTU declarado × IPTU cobrado; campos ausentes | M |
| RF-27 | **Custo mensal total** como barra segmentada (aluguel, condomínio, IPTU/12, seguro), cada parcela com origem explícita: informado no anúncio, do cadastro fiscal, ou não informado. Nunca "oculto" ou "omitido". Em compra, lista de custos de transação como desconhecidos | M |
| RF-28 | **Licenciamento**: alvarás de construção, reforma ou demolição no endereço do edifício e em lotes contíguos, com tipo, situação e data; escala lote. Fonte: Licenciamento Urbanístico, Prefeitura do Recife | S |
| RF-29 | **Deslocamento a pé**: distância de rede, declividade e travessias para 5 categorias de POI e até 3 pontos de rotina (openrouteservice ou OSMnx), com perfil de elevação inline | S |
| RF-30 | **Exposição solar** do edifício calculada com Edificações 3D, com diagrama de recuo e sombra quando houver alvará vizinho | C |

### 6.4 Desconhecidos e ação

| ID | Requisito | Prio |
|---|---|---|
| RF-31 | Matriz de perguntas por tipo de operação (aluguel, compra) × evidências do ledger; cada pergunta marcada como respondida, parcial ou desconhecida | M |
| RF-32 | Cada desconhecido gera uma de quatro ações: documento a pedir, pergunta ao corretor ou síndico, item de visita, "requer profissional" | M |
| RF-33 | **Roteiro de visita**: os itens de visita viram checklist interativo com progresso, ordenado por prioridade, com instrução concreta (ex.: "abra ducha e torneira juntas por 60 s"; "olhe a garagem e o teto do último andar") | M |
| RF-34 | **Mensagem pronta para o corretor**: texto gerado dos desconhecidos (documentos a pedir e perguntas), editável, com botões copiar e compartilhar; o app nunca envia a mensagem por conta própria | M |
| RF-35 | Botões "ver fonte" e "isso está errado" em cada cartão; contestação entra em fila e, confirmada, corrige ledger e tabela de resolução | S |

### 6.5 Documentos

| ID | Requisito | Prio |
|---|---|---|
| RF-40 | Upload cifrado de atas, balancetes e convenção (PDF, foto) | S |
| RF-41 | Leitor documental: eventos (obra, cota extra, inadimplência, litígio, manutenção de elevador, fachada, bombas, interdição, seguro) com página, trecho, data e status aparente; trechos de baixa confiança marcados, nunca omitidos | S |
| RF-42 | Desconhecidos respondidos por documento atualizam o bloco 4 | S |
| RF-43 | Em compra: orientação para obter visualização ou certidão da matrícula pelo SAEC/ONR, com upload do PDF obtido | C |

### 6.6 Saída e compartilhamento

| ID | Requisito | Prio |
|---|---|---|
| RF-50 | Dossiê interativo em quatro blocos fixos | M |
| RF-51 | Link de dossiê no domínio do produto, com App Links verificados (abre no app de quem tem, no site de quem não tem) | S |
| RF-52 | Exportação em PDF com ledger | S |
| RF-53 | Dossiê white-label e lote de URLs para corretor | C |

### 6.7 Conta e créditos

| ID | Requisito | Prio |
|---|---|---|
| RF-60 | Uso sem cadastro até a cota gratuita; cadastro leve depois | S |
| RF-61 | Crédito = um dossiê. Cota inicial gratuita; compra de créditos; créditos ganhos por confirmação do edifício e por feedback pós-visita. **Nunca** por envio de documentos | S |
| RF-62 | Feedback pós-visita: formulário curto ("o que bateu, o que surpreendeu, o que faltou") | S |
| RF-63 | **Meus dossiês**: lista dos dossiês do usuário com estado (em análise, visita marcada, visitado, descartado, fechado). Ao descartar, o usuário informa o motivo em uma linha; o motivo é feedback de decisão, fica visível ao próprio usuário e é elegível a crédito | S |

### 6.8 Não fazer (W)

Tudo da seção 3.2. Também: registrar o app como abridor padrão dos domínios dos portais (inviável sem o arquivo de verificação do dono do domínio; no Android 12+ links não verificados vão ao navegador; risco de política de loja) **[DECISÃO, verificado na documentação Android]**. Tela de comparação lado a lado com "síntese do trade-off": é veredito e exige dois ou mais dossiês do mesmo usuário; volta como V2 quando ≥ 30% dos usuários tiverem 2 ou mais dossiês **[DECISÃO, 12/10/2026]**. Vocabulário de certificação ("auditar", "auditado", "documentação limpa") e pílulas de alerta e verificado por cor: substituídos pelas categorias de confiança do ledger.

---

## 7. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | **Linguagem calibrada por construção**: texto dos cartões gerado por templates por categoria de confiança, nunca por LLM livre; lista de afirmações proibidas vira teste automatizado antes de renderizar (sem "seguro", "perigoso", "vale a pena", "risco X%") |
| RNF-02 | Sete categorias de confiança: observação direta, registro oficial, inferência, sinal exploratório, desconhecido, precisa de especialista, declarado pelo anunciante |
| RNF-03 | Ausência de registro nunca é apresentada como ausência de problema |
| RNF-04 | Fonte indisponível vira cartão "Desconhecido: não conseguimos consultar [fonte] agora"; nunca ausência silenciosa |
| RNF-05 | Conflito entre fontes vira cartão "Inconsistência" com ambas; nunca escolha silenciosa |
| RNF-06 | Privacidade (LGPD): nenhum HTML de anúncio armazenado além da sessão; documentos cifrados com retenção definida e sem uso para treino; localização do usuário nunca coletada; dados de um usuário nunca vendidos ou mostrados a outro. Do cadastro fiscal do IPTU só são carregados os campos do imóvel; os campos de contribuinte (identificador e CPF/CNPJ pseudonimizados) são descartados na ingestão e nunca há tentativa de reidentificação |
| RNF-07 | Desempenho: mediana até o bloco 1 < 60 s; p90 < 120 s |
| RNF-08 | Toda chamada a fonte tem contrato: esquema, data, cobertura, comportamento se indisponível |
| RNF-09 | Versão do método gravada em cada registro do ledger |
| RNF-10 | Material do concurso sem nome de portal ou marca de terceiros |

---

## 8. Especificação dos dados

### 8.1 Entidades

```
Anúncio (listing_id, url, fonte_portal_anonimizada, texto, campos_declarados[], coletado_em)
Edificação cadastrada (dsqfl 14 dígitos, endereço_oficial, geometria, pavimentos, área_construída, lote)
Unidade fiscal (logradouro, número, complemento, bairro, código_logradouro, área_construída, ano_construção,
        pavimentos, valor_venal, iptu_cobrado, regime_tributação, tipo_uso, padrão_construção, exercício)
        — sem nenhum campo de contribuinte
Edifício fiscal (logradouro, número, unidades, pavimentos, ano_construção, padrão, área_mediana_por_unidade)
        — agregado de Unidade fiscal; ligado a Edificação cadastrada por logradouro e número
Alvará (processo_id, tipo {construção|reforma|demolição|...}, endereço, situação, data, lote_quando_houver)
Resolução (listing_id, dsqfl, lote, confiança {alta|média|baixa}, evidências[], origem {resolvedor|humano}, versão_método)
Cartão (card_id, listing_id, bloco {1..4}, claim, categoria, fonte, url_fonte, data_ref, data_coleta,
        escala {unidade|edifício|lote|rua|microárea|bairro}, método, limitação, ação, versão_método)
Pergunta (question_id, operação {aluguel|compra}, texto, evidências_que_respondem[], status, ação_se_desconhecida)
Documento (doc_id, listing_id, tipo {ata|balancete|convenção|matrícula}, páginas, hash, enviado_em, retenção_até)
Evento documental (doc_id, tipo, página, trecho, data, status_aparente, confiança)
Feedback pós-visita (listing_id, acertou[], errou[], faltou, enviado_em)
Estado do dossiê (listing_id, estado {em_análise|visita_marcada|visitado|descartado|fechado}, motivo_descarte, alterado_em)
Tabela de resolução (nome_edifício_normalizado, dsqfl, confirmações, última_confirmação)
```

### 8.2 Esquema do dossiê (JSON consumido pelo app)

```json
{
  "dossie_id": "d_2026_0001",
  "gerado_em": "2026-10-20T14:03:00-03:00",
  "versao_metodo": "0.1.0",
  "anuncio": {
    "operacao": "aluguel",
    "campos_declarados": {
      "preco": 2800, "condominio": null, "iptu": null, "area_m2": 80,
      "quartos": 3, "vagas": 2, "andar": 10, "edificio": null,
      "logradouro": "Rua José Hipólito Cardoso", "numero": "116", "bairro": "Boa Viagem"
    }
  },
  "identidade": {
    "status": "resolvido",
    "confianca": "alta",
    "origem": "resolvedor",
    "dsqfl": "00000000000000",
    "endereco_oficial": "Rua José Hipólito Cardoso, 116",
    "pavimentos": 12,
    "area_construida_m2": 4310,
    "candidatas": []
  },
  "cartoes": [
    {
      "id": "c0", "bloco": 2, "categoria": "registro_oficial",
      "claim": "Unidade 1002: 84 m² de área construída e IPTU de R$ 1.140 cobrado em 2026.",
      "fonte": "Prefeitura do Recife, IPTU por contribuinte e ano, exercício 2026",
      "url_fonte": "https://dados.recife.pe.gov.br/dataset/imposto-predial-e-territorial-urbano-iptu",
      "data_ref": "2026-01-01", "data_coleta": "2026-10-15",
      "escala": "unidade", "metodo": "casamento exato de logradouro, número e complemento",
      "limitacao": "Área construída fiscal não é área privativa; o complemento do anúncio foi declarado pelo anunciante.",
      "acao": "Compare com a área privativa na matrícula."
    },
    {
      "id": "c1", "bloco": 2, "categoria": "registro_oficial",
      "claim": "4 atendimentos da Defesa Civil registrados neste trecho de rua entre 2021 e 2024 (alagamento de via).",
      "fonte": "Prefeitura do Recife, Registro de Atendimentos da Defesa Civil",
      "url_fonte": "https://dados.recife.pe.gov.br/dataset/registro-de-atendimentos-da-defesa-civil",
      "data_ref": "2024-12-31", "data_coleta": "2026-10-15",
      "escala": "rua", "metodo": "geocodificação do endereço textual contra CNEFE; raio de 150 m",
      "limitacao": "Reflete quem acionou a Defesa Civil, não a ocorrência total; escala de rua, não do edifício.",
      "acao": "Pergunte a moradores sobre a garagem em chuva forte."
    }
  ],
  "perguntas": [
    {
      "id": "q_area_privativa", "texto": "A área anunciada é privativa?",
      "status": "desconhecida",
      "acao": { "tipo": "documento", "texto": "Peça a matrícula ou a convenção ao corretor." }
    }
  ],
  "resumo": { "registros_oficiais": 3, "inconsistencias": 1, "desconhecidos": 6, "precisa_especialista": 0 }
}
```

### 8.3 Fontes

| Fonte | Uso | Licença | Status verificado em 11 e 12/10/2026 | Limitação |
|---|---|---|---|---|
| Recife, Área Urbana: Edificações-Lotes (84 MB), Edificações-Pavimentos (172 MB), Edificações 3D, Lotes, Quadras, Trechos de Logradouro | Candidatas, pavimentos, área construída, endereço oficial, lote | ODbL, atualizado 02/03/2026 | **Confirmado** | Pavimentos e área exigem agregação por `dsqfl`; cobertura por bairro a medir |
| Recife, Registro de Atendimentos da Defesa Civil (CSV anuais 2014 a 2024, datastore 2021 a 2024) | Ocorrências por trecho de rua, grau de risco R3/R4 | ODbL, atualizado 06/03/2026 | **Confirmado** | **Sem coordenadas**; endereço textual e bairro; 2025 vazio |
| Recife, IPTU por contribuinte e ano (CSV 2005 a 2026, 128 MB em 2026, dicionário JSON) | Área construída e IPTU da unidade; pavimentos, ano, unidades e padrão do edifício; atributos do resolvedor | Portal CKAN, atualizado 03/10/2026 | **Confirmado**, dicionário lido em 12/10/2026 | Endereço textual (logradouro, número, complemento) e código de logradouro, sem `dsqfl`; ligação por endereço; campos de contribuinte pseudonimizados, descartados na ingestão; sem campo explícito de isenção (verificar valores de "regime de tributação") |
| Recife, Licenciamento Urbanístico (CSV 74 MB, dicionário PDF) | Alvarás de construção, reforma, demolição no edifício e em lotes contíguos | Portal CKAN, atualizado 17/06/2026 | **Confirmado** (dataset); campos a ler no dicionário | Só processos 100% digitais; cobertura temporal a medir; ligação por endereço |
| IBGE CNEFE 2022, município 2611606 | Coordenadas por endereço; dicionário de geocodificação | Público | **Confirmado** (zip 17 MB) | Coordenada de apartamento pode herdar a do número |
| SGB, Carta de suscetibilidade a movimentos de massa e inundação, Recife (2015, 1:45.000, SIG) | Cartão de suscetibilidade | Público | **Confirmado** | Não é setorização de risco |
| SGB, Setorização de risco alto e muito alto, Recife | Cartão de risco oficial | | **Não encontrado** no RIGeo; GeoSGB a verificar | Cartão vira "Desconhecido oficial" |
| Lista de prédios-caixão por endereço | Cartão de maior impacto possível | | **Não pública**; só agregados (TRF5, MPPE) e exemplos em notícias | Alvo de articulação com Prefeitura, Defesa Civil e o banco público que financia habitação |
| OpenStreetMap | Nomes de edifício, rede de pedestres, POIs | ODbL | A medir por bairro | Cobertura variável |
| Página do anúncio, lida na WebView do usuário | Campos declarados | Termos de uso dos portais proíbem scraping; leitura no aparelho do usuário é inferência técnica, **revisão jurídica pendente** | Confirmado em três portais: um expõe schema.org com coordenadas, outro expõe endereço com número e andar no texto, outro só texto livre | Fetch de servidor bloqueado (403) em quatro dos cinco portais testados |
| Documentos do usuário | Leitor documental | Consentimento | Experimento E3 pendente | Erro de extração; exige citação |
| CNM / SAEC (ONR) | Matrícula em compra | Pago pelo usuário | Confirmado na avaliação crítica | Sem busca por endereço |

---

## 9. Arquitetura técnica

### 9.1 Visão

```
[App Expo / React Native, Android primeiro]
  share intent (expo-share-intent, dev build) ─┐
  campo colar ────────────────────────────────┼─► URL/texto
  área de transferência (primeiro plano) ─────┘
        │
        ▼
  WebView no aparelho ─► texto renderizado + JSON-LD/OG ─► extração local por regras
        │                                                   │
        └────────────── texto livre ──────────────────────► API: LLM (edifício, andar, contradições)
        │
        ▼
[API FastAPI]
  resolvedor (candidatas PostGIS + pontuação) ─► confiança ─► (app: confirmação se média)
  enriquecimento paralelo: cadastro, Defesa Civil geocodificada, suscetibilidade, consistência, custo
  ledger (PostgreSQL) ─► matriz de perguntas ─► templates por categoria ─► testes de wording
        │
        ▼
  dossiê JSON ─► app (4 blocos) ─► link no domínio do produto / PDF
        │
  (Etapa 4) upload cifrado ─► parsing ─► LLM com citação de página ─► eventos ─► ledger
```

### 9.2 Stack **[DECISÃO]**

| Camada | Escolha | Motivo |
|---|---|---|
| App | Expo (React Native), dev build com `expo-share-intent`, `react-native-webview`, `expo-clipboard` | Time tem fullstack; share intent exige código nativo que o Expo Go não contém |
| Backend | Python, FastAPI | Time de dados; coerente com PostGIS e DuckDB |
| Dados espaciais | PostgreSQL + PostGIS com Área Urbana e CNEFE carregados | Interseções e vizinhança por rua |
| Auditoria de fontes | DuckDB | Exploração de CSV e GeoJSON grandes |
| Pareamento | Regras em fev; Splink (Fellegi-Sunter sobre DuckDB) na Etapa 4 | Explicável, barato, gera rótulos |
| LLM | Modelo de linguagem de grande porte via API, com saída estruturada | Qualidade em texto livre de descrição; custo de centavos por anúncio |
| Rotas (Etapa 4) | openrouteservice self-hosted ou OSMnx | Sem restrição de cache, custo zero por consulta |
| Texto dos cartões | Templates por categoria + testes automatizados | Auditabilidade |

### 9.3 Custo por dossiê **[HIPÓTESE, preços de lista da API]**

| Tarefa | Tokens aprox. | Opus 5.5 | Haiku 4.5 |
|---|---|---|---|
| Extração de um anúncio | 2.500 entrada, 300 saída | ≈ US$ 0,016 | ≈ US$ 0,004 |
| Mil anúncios por mês | | ≈ US$ 16 | ≈ US$ 4 |
| Leitura de 80 páginas de atas | 60 mil entrada, 2 mil saída | ≈ US$ 0,28 | ≈ US$ 0,07 |

Consultas espaciais são locais e sem custo marginal. Custo não é restrição de produto.

---

## 10. Modelo de negócio **[HIPÓTESE]**

- Cota inicial gratuita de dossiês por usuário; gratuito durante todo o programa.
- Créditos comprados avulsos.
- Créditos ganhos por confirmação do edifício, por feedback pós-visita e por motivo de descarte informado em "Meus dossiês" (os três dados que constroem o ativo e são baratos de verificar). Nunca por documentos: documento condominial é dado de terceiros, não pode ser revendido, e pagar por ele incentiva lixo.
- Canal corretor (Etapa 4): dossiê white-label por assinatura, modelo de um serviço britânico de relatórios imobiliários vendido a profissionais. O que se vende é o dossiê do edifício construído de fontes oficiais e da tabela de resolução; nunca documentos ou relatos de outro usuário.

---

## 11. Métricas e validação

### 11.1 Técnicas

| Indicador | Limiar inicial [HIPÓTESE] | Decisão se abaixo |
|---|---|---|
| Resolução de edifício (E1, 50 anúncios até dez; 200 até fev) | Top-1 alta ≥ 70%; top-3 ≥ 90%; falso match em alta < 2% | Entrada por endereço + mapa vira principal |
| Cobertura de edificações cadastradas (E4) | ≥ 80% nos 10 bairros com mais anúncios | Restringir bairros |
| Extração por campo (E8) | Erro < 5% em preço, área, condomínio | Confirmação obrigatória de campos críticos |
| Claims sem fonte | 0% | Bloquear cartão |
| Wording proibido | 0 | Corrigir template; incidente |
| Leitor documental (E3, 30 conjuntos) | Recall ≥ 80%; página correta ≥ 95%; status ≥ 85% | Reduzir a localizador de trechos |
| Tempo até bloco 1 | Mediana < 60 s | Paralelismo; pré-carga |

### 11.2 Valor

| Indicador | Limiar [HIPÓTESE] | Decisão se abaixo |
|---|---|---|
| Descoberta nova (E2) | ≥ 50% das sessões | Rever fontes ou recorte |
| Superioridade sobre LLM genérico (E2, rubrica cega) | 0 claims falsos; ≥ 2 descobertas verificáveis a mais | Parar e voltar à pesquisa de dores |
| Compreensão (E6) | ≥ 8 de 10 explicam um cartão com as próprias palavras | Simplificar templates |
| Conclusão do fluxo | ≥ 80% das URLs chegam ao bloco 1 | Diagnosticar confirmação |
| Retorno com documentos | ≥ 25% em 14 dias | Melhorar pedido; canal corretor |
| Compartilhamento | ≥ 30% dos dossiês | Rever formato |
| Disposição a pagar / corretores (E6) | ≥ 20% pagariam; ≥ 3 corretores recorrentes | Reposicionar B2B2C |

---

## 12. Roteiro

| Fase | Período | Entregas | Portão |
|---|---|---|---|
| **0. Inscrição** | até 17/10/2026 | Área Urbana, CNEFE e IPTU 2026 carregados para 2 ou 3 bairros; 3 anúncios reais resolvidos à mão, com unidade fiscal localizada quando o anúncio traz o número; Defesa Civil geocodificada nos trechos; 3 JSONs de dossiê; app Expo com telas de entrada, carregamento por etapas, confirmação, dossiê em 4 blocos, roteiro de visita e mensagem ao corretor, com dados fixos; dev build com share intent (limite de tempo, senão campo de colar); vídeo de 2 min; ficha Parte 3 | Ficha enviada |
| **1. Dados** | nov a dez/2026 | E4 (cobertura por bairro, incluindo taxa de casamento entre IPTU e Edificações-Lotes por endereço); E1 mini (50 anúncios rotulados, com e sem atributos do IPTU no resolvedor); geocodificador de endereço textual compartilhado por Defesa Civil, IPTU e licenciamento; leitura do dicionário de licenciamento; esquema do ledger em PostgreSQL | Números de resolução e cobertura |
| **2. Protótipo** | 18/01 a 26/02/2027 | Resolvedor automático por regras com atributos do IPTU; enriquecimento real (cadastro, fiscal, Defesa Civil, suscetibilidade, consistência, custo); templates e testes de wording; roteiro de visita e mensagem ao corretor funcionais; App Links no domínio próprio; detecção de área de transferência; teste com 10 usuários moderados | Demo na Semana Imersiva |
| **3. Finalização** | 03/03 a 17/06/2027 | Metas da banca; Splink; cartões de licenciamento; leitor documental (E3); Meus dossiês com motivo de descarte; créditos e feedback pós-visita; 2 ou 3 corretores parceiros; uso real medido; auditoria de 50 dossiês | Realização |
| **4. Pós-programa** | 2º semestre 2027 | Rotas e sol; comparação de 2 a 4 dossiês do mesmo usuário; canal corretor com assinatura | Evidência de retenção |
| **Horizonte** | | Segunda cidade (resolvedor parametrizável); sinais compostos só com ≥ 100 observações de ground truth | |

---

## 13. Riscos

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Taxa de resolução automática baixa em Recife | Média | Alto | E1 mini até dez; confirmação humana como parte do fluxo; entrada por endereço como plano B |
| R2 | Leitura da página na WebView contestada juridicamente ou bloqueada por anti-bot | Média | Alto | Servidor nunca toca o portal; fallback colar/print; revisão jurídica antes da Etapa 4; nenhum portal nomeado |
| R3 | Sem setorização oficial de risco para Recife, o cartão de risco perde força | Alta (já materializado) | Médio | Defesa Civil por trecho; suscetibilidade rotulada; "desconhecido oficial" como demonstração do produto; articulação com Defesa Civil municipal |
| R4 | Defesa Civil, IPTU e licenciamento sem coordenadas nem `dsqfl`: ligação por endereço textual imprecisa | Média | Médio | Um único geocodificador para as três bases, com CNEFE e código de logradouro como dicionário; escala sempre declarada; taxa de casamento medida por bairro em E4; unidade fiscal só associada quando logradouro, número e complemento batem |
| R11 | Cadastro fiscal contém dados de contribuinte pseudonimizados; risco de percepção de uso indevido | Baixa | Alto | Campos de contribuinte descartados na ingestão; política escrita; só atributos do imóvel exibidos |
| R5 | Substituição por LLM genérico | Alta | Médio | Diferencial é identidade resolvida e proveniência; E2 cego contra um assistente de IA genérico |
| R6 | Banca percebe o produto como "só agregação" | Média | Médio | Demo centrada na resolução no mapa e na inconsistência real do anúncio; IA nomeada onde está |
| R7 | Economia B2C fraca | Média | Médio | Créditos por dados; canal corretor na Etapa 4 |
| R8 | Falso match em confiança alta atribui risco ao prédio errado | Baixa | Alto | Limiar conservador; origem registrada; "isso está errado"; auditoria |
| R9 | Dev build e share intent atrasam o mock | Média | Baixo | Limite de 4 h; campo de colar como fallback |
| R10 | Escopo inflar de novo | Alta | Médio | Este PRD; mudança de escopo exige revisão da seção 6 |

---

## 14. Questões em aberto

1. Setorização de risco do Recife existe no GeoSGB? (verificar)
2. O que cada app de portal envia na folha de compartilhamento? (teste em aparelho, 10 minutos)
3. Parecer jurídico sobre leitura na WebView do usuário.
4. Cobertura real de edificações cadastradas por bairro (E4).
5. Lista de prédios-caixão: quem na Prefeitura, na Defesa Civil ou no banco público que financia habitação pode fornecer, e sob que condições.
6. Precisão da geocodificação da Defesa Civil contra CNEFE.
7. Forma da Semana Imersiva (presencial, online, híbrida), divulgada em 04/12.
8. Valores possíveis de "regime de tributação" no IPTU: qual deles indica isenção ou imunidade.
9. Campos do dicionário de Licenciamento Urbanístico: há lote ou coordenada, ou só endereço? Há situação e data de deferimento?
10. Taxa de casamento entre unidades do IPTU e Edificações-Lotes por endereço (parte de E4).
11. Nome do produto: PropSight ou o nome proposto no mock do colega; um só, verificado quanto a marca.

---

## 15. Registro de decisões

| Data | Decisão | Alternativas | Motivo |
|---|---|---|---|
| 11/10/2026 | Um anúncio, Recife, apartamentos, sem score | Buscador; comparador; score | Única decisão melhorável sem inventário nem scraping; precedente do portal americano que retirou scores climáticos |
| 11/10/2026 | Categoria Tecnologias Urbanas | Diversidade | Regulamento cita moradia e segurança literalmente |
| 11/10/2026 | React Native com Expo, Android primeiro | PWA; Kotlin; bot de mensagens | Fullstack no time; share intent nativo; banca de telecom |
| 11/10/2026 | Ficha com aluguel e compra; protótipo demonstra fluxo de aluguel | Dois fluxos completos | Volume e ciclo curto para uso real; matriz de compra na tela final |
| 11/10/2026 | Servidor nunca acessa portal; leitura na WebView do aparelho | Fetch de servidor | Portais retornam 403 a servidor e proíbem scraping; WebView é o navegador do usuário |
| 11/10/2026 | Extração híbrida: regras + LLM só em texto livre | LLM em tudo; só regras | Campos estruturados existem; LLM necessário para nome de edifício em portais que só têm texto livre |
| 11/10/2026 | Opus 5.5 na extração | Haiku 4.5 | Qualidade em descrição livre; custo irrelevante no volume |
| 11/10/2026 | Créditos por confirmação e feedback; nunca por documentos | Crédito por qualquer dado | Documento é de terceiros; incentivo a lixo |
| 11/10/2026 | Origem da resolução (resolvedor ou humano) gravada no ledger | Só confiança | Ativo de dados, diagnóstico de erro, linguagem no dossiê |
| 11/10/2026 | Mock com 3 anúncios reais resolvidos à mão | Dados inventados | Vídeo e ficha com números verdadeiros; E4 em miniatura; inscrição como "implementação" |
| 12/10/2026 | Não registrar o app como abridor padrão dos domínios dos portais | Intent filter https nos domínios | Exige arquivo do dono do domínio; Android 12+ manda ao navegador; risco de loja |
| 12/10/2026 | Leitor documental como meta da Etapa 4 | No mock de fevereiro | Sem corpus de atas com consentimento em 6 dias |
| 12/10/2026 | "Dossiê" e "cartão" como termos oficiais | Relatório; check | "Relatório" soa PDF estático; "check" soa veredito |
| 12/10/2026 | Cadastro fiscal do IPTU por unidade e Licenciamento Urbanístico entram como fontes; IPTU é obrigatório em fevereiro | Ignorar; só cadastro de edificações | Verificam área e IPTU declarados por unidade e dão número, pavimentos e ano ao resolvedor; publicados pela Prefeitura sob o mesmo portal |
| 12/10/2026 | Incorporar do mock do colega: mensagem pronta ao corretor, roteiro de visita como checklist, custo como barra segmentada com origem por parcela, carregamento por etapas, "Meus dossiês" com motivo de descarte | Manter só o fluxo do PRD 1.0 | Cada item converte um desconhecido em ação ou gera feedback de decisão; custo baixo; fiéis ao princípio de não emitir veredito |
| 12/10/2026 | Rejeitar do mock: comparação lado a lado com síntese, vocabulário de auditoria, pílulas de alerta por cor, cidade e fontes de São Paulo, nomes de portais, foto de fachada, fatos sem fonte | Adotar o mock como está | Veredito disfarçado; não-objetivos; regulamento 11.20 (iv); dados que não existem para Recife ou que exigem documento do usuário |
| 12/10/2026 | Custo mensal: parcelas rotuladas "informado no anúncio", "do cadastro fiscal" ou "não informado"; nunca "oculto" ou "omitido" | Linguagem de taxa oculta | Acusação sem prova viola RNF-01; "não informado" é a categoria desconhecido |

---

## 16. Glossário

Ver `CONTEXT.md`. Termos centrais: anúncio, dossiê, cartão, declarado pelo anunciante, edificação cadastrada, edifício resolvido, confirmação do edifício, modo rua, leitor documental, feedback pós-visita, crédito.
