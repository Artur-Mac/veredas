> **⚠️ ARQUIVO NA CÂMARA FRIA (`ignorar/camara-fria-swarm-2026-11-14/`) — NÃO UTILIZAR COMO REFERÊNCIA ATIVA**  
> Análise executada prematuramente em `14/11/2026` sobre um estágio ainda cru do projeto. Diversas críticas de negócio, monetização, cobertura e escopo presentes abaixo **não devem ser levadas em conta nesta etapa**. Consulte [`LEIA-ME.md`](./LEIA-ME.md).

# VEREDA — Insights da Simulação de Enxame de Mercado (Stress-Test Multissistema)

**Data de geração:** 14/11/2026  
**Escopo avaliado (Ground Truth):** Estado real do repositório local em 14/11/2026 (`README.md`, `docs/VEREDA_DOCUMENTO_DEFINITIVO.md`, `docs/pitch/pitch-revisado-2026-10-18.md`, `docs/aplicacao/VEREDA-APPLICATION-PLAN.md`, `docs/aplicacao/EPOCH-TRACKER.md` épocas `VE00–VE15`, pesquisas `N=83` e `2026-10-20`, e código-fonte `src/`).  
**Motor da simulação:** Enxame headless adaptado do `viralix` (script salvo nesta pasta em `run_vereda_swarm.py`) sobre LLM local sem censura (`qwen-local` / `Qwen3.8-27B-Uncensored`, `num_ctx=4096`, `temperature=0.75`).  
**Escala executada:** 9 personas de alto atrito × 4 rodadas sequenciais = 36 inferências (`1.105,77 s`, `10.381` tokens gerados). Logs integrais nesta pasta em `vereda_raw_debate.json` e `vereda_raw_debate.md`.

---

## 1. Resumo Executivo do Enxame

### Veredito Brutal do Mercado
O mercado simulado tratou o estado atual do **VEREDA** como um **protótipo de engenharia promissor embalado por um pitch juridicamente e empiricamente indefensável**. Em vez de gerar consenso otimista, a exposição cruzada entre compradores, inquilinos, investidores, corretores, incorporadoras, auditores técnicos/jurídicos e investidores de risco produziu **zero posturas de adoção incondicional (`0/9`)** ao final das 4 rodadas.

A principal fratura não está na tese original (*"o anúncio omite riscos e custos reais"*), que inclusive os usuários validam como dor genuína, mas no **abismo entre o que o pitch promete e o que o pipeline/app realmente sustenta hoje**:
1. Promessa de *"valor real das escrituras"* quando a base pública municipal ingere **ITBI fiscal (`valor_avaliacao`)**, frequentemente abaixo do fechamento real de mercado (e já em processo de retirada silenciosa dos exemplos em `src/app/exemplos/[id]/contestar/[fato].tsx` via `ReguaDoItbiRetirada`).
2. Promessa de *"correção de foto olho de peixe"* e alertas avançados quando os braços de VLM (`VE13`) não foram executados, o coletor `Oleo` falhou `10/10`, o modelo preditivo de alagamento (`VE14 / X04`) foi formalmente rejeitado frente à recorrência simples e a climatologia `ERA5` usa uma única célula de `30 km` para os 5 bairros piloto.
3. Uso do levantamento exploratório inicial (`N=83` via Google Forms, `89,2%` de utilidade) como prova de mercado enquanto o indicador de campo real do software construído (`G-USER` em `VE12` e `VE15`) ainda registra **zero usuários reais** e **zero testes em aparelho físico Android/iOS**.

### Taxa de Aceitação, Confiança e Viabilidade por Grupo (R1 → R4)

> **Nota metodológica de auditoria dos dados brutos:** Na Rodada 1, a persona `@auditora_lgpd_juridica` atingiu o teto de `max_tokens` no meio da serialização JSON (`vereda_raw_debate.md:59-66`), acionando o fallback neutro (`skeptical`, confiança `35`), embora o texto parcial já exibido declarasse `stance="sue_or_block"`, `trust_score=25` e `adoption_intent=10`. A tabela abaixo preserva as métricas oficiais registradas pelo orquestrador e explicita a leitura real corrigida.

| Grupo / Stakeholder | Persona(s) | Postura R1 | Postura R2 | Postura Final (R4) | Confiança R1 → R2 → R4 | Viabilidade R4 (/100) | Aceitação Condicional? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Incumbente Hostil** | `@corretor_veterano`, `@incorporadora_diretora`, `@proprietario_especulador` | 1 `boycott`, 1 `sue_or_block`, 1 `hostile` | 1 `boycott`, 1 `sue_or_block`, 1 `hostile` | 1 `conditional`, 1 `sue_or_block`, 1 `hostile` | `20,7` → `19,0` → `24,3` | `36,7` | **Parcial (33%)** — apenas se houver trava de exclusividade/ocultação |
| **Usuário Final (Baixa Tolerância a Atrito)** | `@compradora_primeira_viagem` (Camila, médica residente) | `skeptical` | `hostile` | `conditional` | `35,0` → `30,0` → `45,0` | `60,0` | **Sim (condicional)** — exige resposta ≤ 15s e app leve |
| **Usuário Final (Sensível a Preço / Fora do Eixo Nobre)** | `@inquilino_cetico` (Thiago, Torre/Cordeiro) | `hostile` | `hostile` | **`boycott`** | `25,0` → `20,0` → `15,0` | `20,0` | **Não (0%)** — rejeição ativa por recorte geográfico e custo |
| **Usuário Final (Power User / Analítico)** | `@investidor_planilheiro` (Marcelo, eng. civil) | `skeptical` | `skeptical` | `conditional` | `35,0` → `32,0` → `48,0` | `55,0` | **Sim (condicional)** — exige aluguel fechado real (n≥20 / 500m) |
| **Auditor Técnico / Legal** | `@auditora_lgpd_juridica` (Dra. Helena) | `skeptical` *(fallback; real: `sue_or_block`)* | `sue_or_block` | `conditional` | `35,0` *(real: 25)* → `20,0` → `45,0` | `60,0` | **Sim (condicional)** — só com disclaimer anti-CRECI + compliance ODbL/ToS |
| **Auditor Técnico / Engenharia** | `@engenheiro_dados_senior` (Rafael Brito) | `hostile` | `hostile` | **`skeptical`** | `35,0` → `30,0` → `35,0` | `40,0` | **Não (0%)** — exige substituição de coletores e selo de incerteza |
| **Avaliadora de Pitch & VC** | `@jurada_vc_campus` (Beatriz Monteiro) | `skeptical` | `skeptical` | `conditional` | `35,0` → `30,0` → `45,0` | `60,0` | **Sim (condicional)** — só como B2B2C após prova de retenção e fonte |
| **MÉDIA GLOBAL DO ENXAME** | **9 agentes** | **0% pró-adoção** | **0% pró-adoção** | **55,6% `conditional` (5/9)** | **`29,1` → `24,3` → `34,0`** *(σ=12,36)* | **`45,0`** *(σ=14,72)* | **Alto atrito com potencial condicional** |

### Nível de Polarização e Dinâmica de Rede
* **Contágio negativo imediato na Rodada 2 (`29,1 → 24,3`):** Quando os agentes leram as objeções uns dos outros, **zero personas ganharam confiança** entre R1 e R2. Os argumentos dos auditores técnicos (`bundle` de `30,1 MB` no `VE12`, coletor `Oleo 10/10` falho, `VE14` rejeitado, `G-USER = 0`) municiaram imediatamente os incumbentes hostis e desarmaram a empolgação inicial da compradora e da investidora de risco.
* **Polarização irreconciliável de interesses (`σ = 14,72` em viabilidade):** O enxame divergiu em três blocos incompatíveis:
  * **Eixo de demanda qualificada + risco (`60/100` de viabilidade):** Camila, Dra. Helena e Beatriz enxergam valor real no cruzamento urbano/jurídico, mas condicionam a sobrevivência a cortes radicais de complexidade, pivot B2B2C e blindagem regulatória.
  * **Eixo periférico/anti-franquia (`20/100`):** Thiago (`@inquilino_cetico`) caiu continuamente (`25 → 20 → 15`) e terminou em **`boycott`** porque as camadas enriquecidas e os 2.688 prédios do piloto (`parecer-tecnico.md`, com `1.879` só em Boa Viagem) criam uma percepção de *"app de classe média alta para Zona Sul/Graças"* inacessível em 4G/Android antigo.
  * **Eixo incumbente de bloqueio (`18–20/100` confiança em R4):** Incorporadora e proprietário rentista nunca aceitarão transparência assimétrica gratuita; suas condições de "trégua" (veto prévio, ocultação de dados técnicos) destruiriam a própria razão de existir do Vereda.

---

## 2. Mapa de Atrito e Resistência de Mercado

A simulação expôs quatro vetores concretos de sabotagem, boicote comercial, fraude de dados e litígio judicial contra o Vereda:

| Ator / Frente de Ataque | Motivo Real (Monólogo Interno) | Argumento & Tática de Sabotagem / Litígio na Simulação | Como Neutralizar (Defesa Técnica, Jurídica e de Produto) |
| :--- | :--- | :--- | :--- |
| **Corretores Tradicionais** (`@corretor_veterano` — Sérgio) | *"Se o cliente vê onde fica e quanto custa antes do café, minha comissão de 6% acaba."* | **1) Ocultação ativa:** Remover endereço/nome do prédio dos portais.<br>**2) Denúncia ao CRECI-PE:** Acusar o ranking `"visite primeiro"` (`src/dados/decisao.ts`) de exercício ilegal de corretagem (Lei 6.530/78, art. 16).<br>**3) Fraude de créditos:** Marcar leads no descarte dizendo *"cliente desistiu"* sem visitar para gerar créditos infinitos (`+1`).<br>**4) Pressão de exportação:** Exigir PDF limpo sem marca d'água ou boicotar/exigir exclusividade de 72h no lead. | **1) Enquadramento estritamente informativo/decisório (sem intermediação):** Nunca intermediar visita, não cobrar comissão, substituir `"visite primeiro"` por ordenação declarada segundo critérios configuráveis do usuário (*"pela prioridade que você escolheu: menor custo conhecido"*) com aviso explícito de não-corretagem.<br>**2) Cortar recompensa de crédito por descarte trivial** (não creditar `+1` sem prova/coerência mínima, ou substituir Give-to-Get ingênuo por pacote limitado). |
| **Incorporadoras e Donas de SPE** (`@incorporadora_diretora` — Renata) | *"Transparência de passivo trabalhista e alagamento derruba minha VSO na Zona Norte."* | **1) Notificação extrajudicial / Ação por danos à imagem e desvio de finalidade:** Atacar o cruzamento de `SPE + TRT6 + alvarás + alagamento Defesa Civil`, alegando que marca empreendimento como *"prédio-caixão"* ou *"obra atrasada"* sem direito de resposta.<br>**2) Bloqueio corporativo + Envenenamento (Sybil):** Barrar acesso no Wi-Fi dos stands e instruir pré-venda a criar centenas de contas descartáveis para zerar dossiês e poluir crowdsourcing com feedback falso. | **1) Abolir vereditos, selos e adjetivos** (rigor absoluto no princípio *"Posição é fato, adjetivo é veredito"*): exibir apenas texto literal da fonte pública com número de processo, tribunal, data e link oficial, **sem nunca** traduzir TRT6 em *"construtora atrasada"* ou CND/obra em *"prédio-caixão"*.<br>**2) Direito de resposta institucional auditável** (anexar manifestação com protocolo/documento oficial datado ao lado do fato público — nunca ocultando ou permitindo veto prévio, ao contrário do que a incorporadora exigiu em R4).<br>**3) Separar CNPJ de obra em andamento da auditoria passiva sem conta compartilhada:** exigir prova documental para alteração comunitária. |
| **Proprietários Rentistas Especuladores** (`@proprietario_especulador` — Duda) | *"Minha tática é 'IPTU a consultar' e esconder sol poente para pegar inquilino desatento."* | **1) Remoção de fotos/dados identificáveis** de portais quando perceberem extração via Vereda.<br>**2) Weaponização do botão `"Isso está errado"` (`src/app/exemplos/[id]/contestar/[fato].tsx`):** Usá-lo durante negociações ou com corretores parceiros para gerar dúvida sobre IPTU/sol ou para farmar créditos grátis e filtrar *"inquilinos técnicos chatos"*. | **1) `"Isso está errado"` nunca deve gerar crédito automático nem alterar/suprimir dado para terceiros sem evidência anexada** (hoje fica só no `Aparelho` local, o que é seguro contra contaminação global, mas a futura sincronização D034/VE15 precisa de quórum ponderado + anexo comprobatório — ex.: foto do boleto de condomínio/carnê IPTU — nunca auto-credito por clique).<br>**2) Manter captura 100% acionada pelo usuário (client-side/extensão/OCR)** para que o proprietário não tenha um servidor central simples para bloquear por IP. |
| **Compliance LGPD, ODbL & Portais Incumbentes** (`@auditora_lgpd_juridica` — Dra. Helena) | *"A quebra da ODbL e o ToS no-scraping são o passivo jurídico perfeito para travar a startup."* | **1) ToS *no-scraping* (QuintoAndar jan/2026, OLX fev/2025) e Marca no Campus Mobile (`11.20(iv)`):** Colar URL explícita de portais terceiros na Home (`src/app/(abas)/index.tsx:156`) e ingerir dados via automação centralizada gera notificação extrajudicial imediata e risco de desclassificação em edital.<br>**2) Contágio viral da ODbL 1.0 (`§4.3` e `§4.6(b)`):** Misturar bases da Prefeitura (`dados.recife.pe.gov.br`, ODbL) com dados proprietários/comerciais no mesmo "Banco de Dados Derivado" obriga abertura pública gratuita dos dados enriquecidos, destruindo o *moat*.<br>**3) LGPD (Art. 7º §3º / Art. 18):** Processar endereço visitado, OCR de atas condominiais (que contêm nomes/unidades de moradores e síndicos) e CNPJ de proprietários sem base legal granular e fluxo de exclusão. | **1) Remover nomes/marcas de portais da UI e logs** imediatamente (`index.tsx:156`) → adotar texto agnóstico (*"Cole o link de um anúncio imobiliário ou importe o arquivo da página"*).<br>**2) Arquitetura de "Muralha ODbL" (Database Firewall):** Manter as camadas públicas municipais (ODbL) como um índice separado estaticamente servido com atribuição explícita e licença ODbL publicada na tela `"Sobre os dados"`; nunca fundir na mesma tabela/exportação os dados derivados licenciados em ODbL com *scores*, contratos B2B2C ou caderno privado do usuário.<br>**3) Redação (PII scrubbing) no OCR de atas (`ler.tsx` / `VE15`):** Mascarar CPFs, nomes próprios de condôminos e números de apartamento antes de qualquer armazenamento persistente ou futura inferência em nuvem. |

---

## 3. Pontos Cegos da Proposta de Valor e Dados

A auditoria cruzada entre a fala das personas e os relatórios técnicos internos (`VEREDA-APPLICATION-PLAN.md §2`, `VE12`–`VE15`) revelou **seis pontos cegos críticos** onde o usuário comum ou o auditor técnico detecta desalinhamento imediato:

1. **O abismo "Escritura Real" vs. ITBI Fiscal (`P02` / Pitch):**
   * *O que o pitch vende:* *"revela o valor real das escrituras."*
   * *O que o mercado percebeu:* `corretor_veterano`, `incorporadora_diretora`, `proprietario_especulador`, `investidor_planilheiro` e `jurada_vc_campus` identificaram unanimemente que o ITBI municipal traz `valor_avaliacao` fiscal da Prefeitura (frequentemente subavaliado ou defasado frente ao preço real de escritura pública em cartório/RI).
   * *Risco real:* O código já começou a retirar a régua de ITBI dos exemplos (`ReguaDoItbiRetirada` em `src/app/exemplos/[id]/contestar/[fato].tsx:40-47`), mas **o roteiro oficial do pitch (`pitch-revisado-2026-10-18.md`) e o documento mestre ainda afirmam "escrituras"**. Essa incoerência aniquilou a credibilidade do Vereda em R1 e R2.

2. **A "Régua de Aluguel Circular" (Espelho Vazio sem Feed Vivo):**
   * Sem um servidor/feed contínuo de ofertas ou contratos fechados (aluguel não gera ITBI público e `D034` adiou backend), o Vereda compara o imóvel contra a média macro do **FipeZAP** (`R$ 64,39/m²`) e contra os **próprios anúncios salvos no caderno local** do usuário.
   * *Reação do enxame:* Beatriz (`@jurada_vc_campus`) chamou de *"espelho vazio / diário de bordo"*; Marcelo (`@investidor_planilheiro`) apontou que falta histórico de aluguel *fechado* (não anunciado) no raio de 500 m; Thiago (`@inquilino_cetico`) classificou como dado inútil para negociar aluguel abusivo.

3. **Ilusão Climática e de Mobilidade em Microescala (`VE13` / `VE14` / GTFS):**
   * **Alagamento (`VE14`):** O modelo preditivo X04 foi rejeitado formalmente (logística acertou `7/50` vs `8/50` da recorrência histórica em 17 ruas de 2024) e `211/394` registros de Defesa Civil têm falha de vínculo viário (`VE13`). Enquanto a UI exibir mapa/alerta de chuva sem selo explícito de erro e cobertura parcial, engenheiros e incorporadoras vão apontar *"feitiçaria / dado falso"*.
   * **Calor (`ERA5`):** Uma única célula de `30 km` iguala a temperatura de Boa Viagem inteira à da Casa Forte ou Torre — o usuário sente na pele que não há microclima por rua.
   * **Transporte (`GTFS`):** Conforme documentado em `VEREDA-APPLICATION-PLAN.md §2`, o feed GTFS histórico do Grande Recife apresentou desvios espaciais graves (`-0,75°` sem alinhamento), tornando perigoso prometer precisão de rotina de ônibus noturno sem ingestão validada ou disclaimer rigoroso.

4. **Viés Socioespacial e "Deserto de Dados Enriquecidos" fora da Zona Nobre:**
   * Embora `src/dados/recife/publicacaoGerada.ts` já publique índice municipal básico em `72` bairros (`BAIRROS_HABILITADOS` de `94` em `bairros.ts`), os **dados validados de decisão do piloto** (`parecer-tecnico.md`: `2.688` prédios totais, com `1.879` só em Boa Viagem contra `82` em Casa Forte e apenas `630` edifícios elegíveis no ITBI) concentram o valor real no corredor nobre.
   * *Consequência:* Moradores da Zona Oeste/Norte popular (`@inquilino_cetico`, Torre/Cordeiro/Várzea) sentiram exclusão classista (*"luxo de classe média alta"*).

5. **Fragilidade Catastrófica de Ingestão (`Oleo 10/10` erro, `ZAP 139 cards` enviesados, `DataJud 403`):**
   * O pipeline de coleta automatizada que alimentaria comparações de mercado falhou (`Oleo` `10/10` erro, `Overpass` falhou em `18` categorias, `Google Maps` `0` entidades). Sem sincronização server-side (`D034`), o app depende de colagem manual ou extensão local (`src/dados/extrator/`), quebrando o discurso de *"mágica em segundos"* toda vez que um portal muda o DOM ou bloqueia preview.

6. **Risco Silencioso de Responsabilidade sobre Passivos (`TRT6` / `CNDT` / `Obras`):**
   * A consulta `DataJud` retornou `403` e `TST` exige CAPTCHA (`10-CNPJ-E-OCORRENCIAS-DO-EDIFICIO.md`). Se o Vereda tentar cruzar CNPJ de SPE com ações trabalhistas em produção sem curadoria documental e atualização diária com carimbo de data/hora, expõe-se imediatamente a liminares de remoção e ações indenizatórias das incorporadoras, exatamente como a `Zillow` recuou dos escores climáticos nos EUA.

---

## 4. Feedback de UX/UI e Produto (Acionável)

### Mapa de Fricção Cognitiva e Técnica
Na votação da Rodada 3, o fluxo principal (`UX-A`: Colar link + confirmação de DSQFL + réguas) recebeu **`5` votos de `abandon_friction` e `0` votos `pay_or_adopt`**. Já os recursos de campo (`UX-B`: Modo visita, sol na janela, ruído, obras em 150m, OCR de atas) conquistaram **`2` votos `pay_or_adopt`** (os dois perfis reais de compra/investimento: Camila e Marcelo), mostrando claramente **onde está o ouro do produto e onde está a barreira de entrada**.

| Perfil de Usuário | Onde o App Gera Atrito / Rejeição Hoje | O que Valorizar / Destacar | Veredito de UX |
| :--- | :--- | :--- | :--- |
| **Usuário Comum com Pouco Tempo** (`@compradora_primeira_viagem`, `@inquilino_cetico`) | **1) Peso inicial:** Baseline `VE12` de `30,1 MB` JS (`7,4 MB` gzipped) travando em 4G/Android de entrada.<br>**2) Trabalho braçal na entrada:** Ter que baixar extensão, colar link que às vezes falha e *"confirmar polígono/lote no mapa"*.<br>**3) Excesso de telas:** Navegar entre `15` telas para responder se o imóvel tem pegadinha. | **Sol nas janelas (`sol.tsx`), alerta de obras a 150 m (`comparar.tsx`) e risco de alagamento direto na cara.** Camila pede decisão assistida em **≤ 15 segundos**. | **Cortar atrito de entrada:** Entregar um **"Resumo de Risco e Custo em 3 Linhas"** no topo do dossiê/anúncio assim que o endereço for reconhecido, antes de pedir qualquer confirmação manual. |
| **Usuário Avançado / Analítico** (`@investidor_planilheiro`, `@engenheiro_dados_senior`) | **1) Opacidade de erro/amostra:** Réguas sem intervalo de confiança, tamanho de amostra (`n`), data da coleta e cobertura real.<br>**2) Ausência de comparáveis fechados e exportação limpa.** | **Cruzamento histórico de SPE/CNPJ/licenciamento, modo visita técnico e transparência metodológica (`fonte/[fato].tsx`, `resposta.ts`).** | **Expor metadados técnicos sob demanda:** Sempre imprimir `n=X`, janela temporal e `nivel_de_confianca` ao lado das réguas e permitir exportação estruturada (JSON/CSV) para power users. |

### Lista Direta de Simplificação: Cortar, Reduzir ou Destacar

* **CORTAR / RETIRAR DO PITCH E DA PROMESSA IMEDIATA:**
  1. **Promessa de "correção de foto olho de peixe" (`VLM`):** Não rodou no `VE13`; promete milagre computacional inexistente no produto atual e destrói credibilidade na frente técnica.
  2. **Promessa de "ilha de calor" via `ERA5` e "valor real de escrituras" via `ITBI`:** Trocar o termo *"escrituras"* por *"referência fiscal de ITBI / valor declarado"* ou remover a régua de preço de compra onde não houver base cartorial/comercial confiável (alinhado ao que já foi iniciado em `ReguaDoItbiRetirada`).
  3. **Nomes de marcas de portais na UI (`ZAP, VivaReal, QuintoAndar, OLX` em `index.tsx:156`):** Risco jurídico e violação direta do item `11.20(iv)` do Campus Mobile.

* **SIMPLIFICAR / DESATOLAR:**
  1. **Fluxo de Entrada (Zero-Link-First opcional):** Permitir iniciar busca direto por **Nome do Edifício / Rua no Recife** (consumindo o índice municipal local/cacheado dos 72 bairros) em 2 toques, sem obrigar o usuário no meio da rua a caçar URL de portal ou confirmar lote manualmente antes de ver os alertas críticos (sol, obras a 150 m, alagamento histórico).
  2. **Carregamento Progressivo Real (`D036` — `src/dados/camadas.ts` + `public/sw.js`):** A divisão das camadas para `/dados/<sha256>.json` já foi arquitetada no código recente, **mas ainda não foi medida em `expo export` nem testada em hardware Android real de entrada**. Validar redução da casca inicial para `< 2–3 MB` gzipped é pré-requisito para sobrevivência mobile.
  3. **Card de Risco Instantâneo ("Resumo em 3 Linhas"):** Condensar no topo de `dossie.tsx` os 3 achados materiais de maior impacto (1. Custo mensal total + lacunas pendentes; 2. Insolação + obras próximas; 3. Ocorrência pública de rua/lote + cobertura da base).

* **DESTACAR (CORE HERO DO PRODUTO):**
  1. **Modo Visita ao Vivo (`visita.tsx` / `sol.tsx` / decibelímetro / obras 150 m):** Foi o único bloco que recebeu votos pagantes (`pay_or_adopt`) de usuários finais reais na simulação. O momento em que o usuário está *dentro do imóvel ou na calçada* é onde nenhum portal concorre com o Vereda.
  2. **Pergunta Decisiva com Recálculo Imediato (`src/dados/resposta.ts` — `VE15`):** Mostrar em 1 frase exatamente *quanto falta saber* para inverter a escolha entre dois imóveis e atualizar na hora quando o usuário digita o condomínio/IPTU informado pelo corretor.

---

## 5. Viabilidade de Monetização e Modelo de Negócios

### Resultado do Teste de Estresse (Rodada 3)

| Modelo Testado | `pay_or_adopt` | `use_free_only` | `bypass_or_game` | `boycott_or_block` | `abandon_friction` | Veredito do Mercado |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **M1 — B2C Pay-per-use (R$ 29,90 + Give-to-Get)** | **0** | **4** | **4** | 0 | 1 | **COLAPSO TOTAL NA CONVERSÃO:** 8 de 9 personas usam de graça ou burlam o sistema. |
| **M2 — B2B Corretores / White-label (R$ 49–129/mês)** | **1** *(cínico)* | 0 | **5** | **3** | 0 | **ARMADILHA DE ALINHAMENTO:** Corretores só pagam se puderem esconder defeitos ou sequestrar o lead. |
| **M3 — B2B2C API / Bancos / Seguros / Assessoria** | **3** *(Marcelo, Helena, Beatriz)* | 4 | 1 | 1 | 0 | **ÚNICO MODELO ESTRUTURALMENTE VIÁVEL** entre atores institucionais e analíticos (junto a contratos B2G/CPSI). |

### Por que M1 (B2C + Give-to-Get) Fracassou (0/9 Pagantes)
1. **Janela curta de compra/aluguel vs. Cota grátis:** O usuário comum fecha ou desiste da busca em 2–4 semanas usando os 3 a 5 créditos iniciais gratuitos (`src/estado/Carteira.tsx:23` cria carteira inicial com `3` créditos; `creditos.tsx` permite recarga de teste). Quando precisaria pagar `R$ 29,90`, simplesmente tira prints de tela (*Rafael Brito*), cria e-mails descartáveis (*Marcelo Tavares*) ou pergunta no grupo do prédio (*Camila Ferreira*).
2. **Give-to-Get é um "furo de balde" anti-qualidade:** A mecânica de dar `+1` crédito ao informar motivo de descarte (`src/app/creditos.tsx:72`) ou contestar um fato incentivou **três estratégias explícitas de fraude** na simulação:
   * Corretor marca lead como *"desistiu"* sem visitar só para ganhar crédito (`@corretor_veterano`).
   * Incorporadora cria contas de pré-venda para farmar créditos e contaminar feedback (`@incorporadora_diretora`).
   * Inquilino clica confirmações/descartes vagos genéricos só para desbloquear infinito grátis (`@inquilino_cetico`).
3. **Disposição a Pagar (WTP) real de ponta a ponta:**
   * **Usuários finais (`Média: R$ 26,60`):** `R$ 0,00` (Thiago/inquilino), `R$ 29,90` pagamento único condicional a rodar leve offline (Camila), `R$ 49,90` (Marcelo — apenas se tiver base limpa estilo M3). Zero adesão a mensalidade B2C recorrente.
   * **Incumbentes (`R$ 0–50`):** `R$ 0,00` (Duda), `R$ 15,00` (Sérgio), `R$ 50,00` apenas tático por mês de lançamento (Renata).
   * **Âncoras B2B2C / Corporativo (`R$ 149 – R$ 4.500`):** Beatriz (`R$ 149/mês` para API/proptech) e Dra. Helena (`R$ 4.500/mês` contrato corporativo com bancos/seguradoras absorvendo passivo).

### Qual Posicionamento Sobrevive? (Comparativo B2C vs B2B vs B2B2C)
Na votação direta de *"qual modelo sobrevive em 12 meses"*, houve empate numérico (`M3: 4 votos`, `M2: 4 votos`, `M1: 1 voto`), mas a **análise qualitativa das justificativas desmonta `M2`**:
* Os 4 votos pró-`M2` não vieram de entusiasmo comercial, e sim de **cinismo estrutural**: incorporadora, proprietário e engenheiro votaram em `M2` afirmando que *corretores são os únicos com volume transacional recorrente*, ao mesmo tempo em que **os 3 incumbentes votaram `boycott_or_block` ou `bypass_or_game` contra `M2`**, exigindo white-label para mascarar riscos e exclusividade de lead por 72h. É exatamente o **paradoxo Zillow/First Street** citado no próprio plano estratégico do repo (`04-MERCADO-REGULACAO-E-FOMENTO.md`): quem lucra com assimetria de venda tenta silenciar o dado negativo assim que vira o pagador principal.
* **`M3` (B2B2C — Assessoria Independente ao Comprador + Bancos/Seguradoras/Vistoriadoras + B2G/CPSI)** venceu nos votos sérios de quem paga (`pay_or_adopt` por investidor, advogada e VC). Diferente de corretores tradicionalistas, **assessorias *buy-side* (modelo MySide), seguradoras de fiança/incêndio, bancos de crédito imobiliário e prefeituras (CPSI)** têm alinhamento econômico *direto* com redução de sinistro, prevenção de fraude documental, sol/alagamento/risco estrutural (prédios-caixão) e verificação de lastro municipal.
* **Papel ideal do B2C no funil:** Deixa de ser o motor de lucro direto por PDF avulso para virar **camada gratuita de aquisição, auditoria de campo em visita e validação de demanda (`G-USER`)** — ou **Passe Único de 30 dias (`R$ 29,90–49,90` sem renovação automática)** apenas para o **Modo Visita + Dossiê Completo de Comparação**, enquanto o dinheiro recorrente escala via **M3 (B2B2C)** e editais públicos (**CPSI / FACEPE**).

---

## 6. Defesa para Banca e Investidores (Moat & Pitch)

Abaixo estão os ataques mais letais formulados por `@jurada_vc_campus` (Beatriz Monteiro), `@engenheiro_dados_senior` (Rafael Brito) e `@auditora_lgpd_juridica` (Dra. Helena Guimarães) — junto com a resposta exata e mudança pré-banca necessária:

### Pergunta 1 (VC + Investidor): *"Por que vocês vendem 'valor real das escrituras' no pitch se a base só tem ITBI fiscal (e vocês já começaram a esconder a régua nos exemplos)? Como isso sustenta retenção e unit economics?"*
* **Diagnóstico honesto:** Não sustenta se vendido como preço cartorial fechado. O código já reconheceu o limite (retirando `ReguaDoItbi` dos exemplos em `src/app/exemplos/[id]/contestar/[fato].tsx`), mas o roteiro (`pitch-revisado-2026-10-18.md`) não foi atualizado — criando risco severo de **descredibilização diante de jurados imobiliários ou financeiros**. (Nota: em R4, a VC simulada confundiu cartório com "hash no blockchain", mas a substância da cobrança dela é real: ITBI municipal ≠ matrícula/preço negociado em RGI).
* **Resposta & Ajuste de Pitch:** Corrigir o discurso para **"referência fiscal oficial do município cruzada com histórico de oferta do edifício — e o que o anúncio esconde dentro do custo mensal de morar"**. Tirar o foco de *"adivinhar preço exato de venda por decreto"* e ancorar o valor econômico no **Custo Total de Ocupação (condomínio + IPTU + seguro + taxa + obra + sol/ruído)** e na **Comparação Decisória Auditável**, onde não há dependência de escritura fechada para gerar economia real ao usuário.

### Pergunta 2 (VC + Advogada): *"Se a base municipal é ODbL 1.0 e o código cliente roda sem backend, qual é o seu Moat? Se vocês combinarem dados ODbL com enriquecimentos comerciais, a cláusula Share-Alike não obriga a abrir a base inteira?"*
* **Diagnóstico honesto:** Sim — se houver mistura física no mesmo "Banco de Dados Derivado" (`ODbL §4.6(b)`), o moat de dados simplesmente não existe. Além disso, o protocolo de sincronização comunitária (`D034`) segue adiado, tornando o grafo proprietário de condomínios ainda inexistente fora do aparelho local.
* **Resposta & Defesa para Banca:** O moat do Vereda **não está em revender CSV da Prefeitura do Recife** (que é commodity pública). O moat estrutural está em **três ativos privados legalmente isolados da camada ODbL**:
  1. **Grafo de Evidência Condominial Verificada por Documento (`Privado`):** Condomínio real por tipologia/andar, regras de atas/convenções extraídas com citação de página (`RAG`), histórico de obras e medições de insolação/ruído capturadas em campo via celular (`sensor fusion`).
  2. **Motor Determinístico de Decisão Comparativa (`Proprietário`):** Lógica de faixas intervalares com limiar de inversão (`src/dados/decisao.ts` + `src/dados/resposta.ts`) que transforma *"não informado / a confirmar"* em perguntas cirúrgicas com recálculo instantâneo.
  3. **Muralha ODbL arquitetural:** Bases municipais rodam em camada isolada de consulta e atribuição pública (ODbL explícita em `/sobre-os-dados`), enquanto o ledger analítico, OCR de atas anonimizadas e APIs B2B2C residem em esquema separado não-derivado.

### Pergunta 3 (Engenheiro + VC): *"Qual a validação real em campo além de um Google Forms N=83? Por que `G-USER` está zerado, o VLM de olho-de-peixe não rodou e o modelo de alagamento perdeu de uma lista simples?"*
* **Diagnóstico honesto:** O relatório `VE12` e `VE15` provam excelente disciplina automatizada (`1.569/1.569` testes Jest passantes, `81/81` pipeline, `0` erros em `20` dossiês sintéticos), **mas zero uso humano moderado registrado no app construído** e **rejeição empírica de `VE14` (`7/50` vs `8/50`)**. Citar `N=83` no pitch como validação de *software* quando o `G-USER` é zero abre um flanco fatal se um jurado perguntar *"quantas pessoas reais testaram o APK esta semana no celular?"*.
* **Resposta & Plano pré-banca:**
  1. **Antes da banca:** Executar **protocolo mínimo `G-USER` (10 a 15 usuários reais no Recife em hardware Android intermediário via 4G)** executando comparação de 2 anúncios + modo visita, registrando tempo de primeira renderização e taxa de conclusão. Atualizar os slides/pitch com **métricas reais do app**, não apenas do Forms antigo.
  2. **Transparência radical como trunfo de engenharia:** Assumir na banca que o Vereda **descartou** o modelo ML de alagamento no `VE14` porque não superou a recorrência histórica auditada — provando rigor científico antipalpite (*CRIVO*) em vez de exibir score artificial. E cortar completamente *"olho de peixe / ERA5 microclimático"* das promessas enquanto não houver execução validada.

### Pergunta 4 (Compliance / Campus Mobile): *"Como vocês sobrevivem a uma notificação extrajudicial do QuintoAndar/OLX (no-scraping) e ao item 11.20(iv) de marca de terceiros?"*
* **Resposta & Mudança Obrigatória:** O Vereda **não opera scraper centralizado em servidor contra portais privados**. Todo dado do anúncio entra por **ação exclusiva e privada do titular/consumidor no seu próprio dispositivo** (colagem manual, arquivo HTML salvo pelo próprio usuário ou preenchimento guiado no celular, sem republicação pública dos anúncios dos portais). E remover todas as marcas nominais de portais das telas (`src/app/(abas)/index.tsx:156`) e do material visual do pitch antes do envio à banca.

---

## 7. Plano de Ação Priorizado (Backlog Técnico e de Produto)

### A. Quick Wins Imediatos (Pré-Banca / 1 a 7 Dias)

| Prioridade | Tarefa Objetiva | Alvos no Repositório | Por que Resolve um Bloqueio do Enxame | Critério de Pronto (Done) |
| :---: | :--- | :--- | :--- | :--- |
| **P0-1** | **Sanitização Jurídica de Marcas e Rótulos ("QuintoAndar/ZAP/OLX" + "Escritura" + "Visite Primeiro")** | `src/app/(abas)/index.tsx:156`, `src/dados/decisao.ts`, telas de comparação/dossiê, `docs/pitch/pitch-revisado-2026-10-18.md` *(revisão de deck/fala)* | Elimina risco imediato do item `11.20(iv)` Campus Mobile, neutraliza tese de exercício ilegal de corretagem (Lei 6.530/78) e encerra a mentira percebida de *"ITBI = escritura real"*. | Placeholder neutro sem marcas de portais; aviso de *"ferramenta informativa de apoio, não presta corretagem"* visível; nenhuma menção na UI a *"valor de escritura"* onde o dado é ITBI fiscal (ou manter `ReguaDoItbiRetirada`). |
| **P0-2** | **Medir & Fechar o Split de Bundle (`D036`) + Baseline Android 4G Real** | `src/dados/camadas.ts`, `public/sw.js`, script `camadas` / `expo export` em `package.json`, `docs/aplicacao/execucoes/VE12/` | Ataca a objeção nº 1 de infraestrutura e adoção (`30,1 MB` JS / `7,4 MB` gzipped citados por 6 dos 9 agentes como *"morte no 4G"*). A infraestrutura de split já existe no repo, mas falta comprovar o tamanho pós-split e testar em aparelho físico. | Novo `expo export` medido pós-split com casca web `< 3 MB` gzipped + gravação/telemetria de abertura em dispositivo Android intermediário via 4G sem travamento. |
| **P0-3** | **Inserir Card de "Resumo em 3 Linhas" no Topo do Dossiê + Selo de Confiança/Cobertura** | `src/app/(abas)/dossie.tsx`, `src/componentes/fatos/Regua.tsx` *(ou cabeçalho de resumo)*, `src/dados/recife/coberturaDasCamadas.ts` | Resolve a evasão de usuários sem tempo (`@compradora_primeira_viagem`: *"decido em 15s ou volto ao WhatsApp"*) e dá honestidade científica exigida por `@engenheiro_dados_senior` e `@investidor_planilheiro`. | Topo do dossiê exibe máximo de 3 bullets objetivos (Custo mensal + pendências; Sol/Obras 150m; Alagamento/Cobertura com carimbo `n=X`, fonte, data e lacunas de bairro). |
| **P0-4** | **Desarmar Exploit do "Give-to-Get" e Proteger `"Isso está errado"`** | `src/app/creditos.tsx`, `src/estado/Carteira.tsx`, `src/dados/descarte.ts`, `src/app/exemplos/[id]/contestar/[fato].tsx` | Bloqueia fraude trivial descoberta por 5 personas (`+1` por descartar imóvel sem visitar ou contestar sem prova) e retira linguagem de mercado real de cima do modo teste. | Remover bonificação automática de crédito em descarte simples ou exigir campo coerente sem repetição; tornar explícito no botão de contestação que só se aplica à visualização privada ou exige evidência documental quando houver sync. |
| **P0-5** | **Rodar Sprint Mínimo de Campo `G-USER` (N = 10–15 Usuários Reais no Recife)** | `docs/aplicacao/execucoes/VE12/`, `docs/aplicacao/EPOCH-TRACKER.md` | Transforma o maior ataque da VC e do Engenheiro (*"G-USER = 0, nunca saiu do computador"*) em evidência verificável de uso real com funil medido. | 10–15 sessões moderadas completas (colagem/busca + comparação + uso de `resposta.ts` ou visita) com tempo de tarefa, taxa de conclusão e falhas documentadas. |
| **P0-6** | **Publicar Firewall / Atribuição Clara da ODbL 1.0 e Disclaimer de Escopo Climático/GTFS** | `src/app/sobre-os-dados.tsx`, `src/dados/recife/chuva.ts`, `src/dados/recife/camadasAmbientais.ts` | Neutraliza notificação por quebra de licença `ODbL 1.0` e impede que incorporadora ou engenheiro processe/ridicularize dados de `ERA5 (30 km)` ou `Defesa Civil (211 ruas sem vínculo)`. | Página `/sobre-os-dados` listando licença ODbL 1.0 para cada base municipal, resolução exata do dado (`30 km` macro para ERA5; lista de ruas vinculadas para Defesa Civil) e separação explícita da base privada do usuário. |

---

### B. Mudanças Estruturais (Pós-Banca / 2 a 8 Semanas — Sobrevivência e Escala)

| Prioridade | Frente Estrutural | Direção de Arquitetura e Produto | Justificativa Estratégica (Enxame) |
| :---: | :--- | :--- | :--- |
| **S1** | **Pivot de Monetização para B2B2C (`M3`) + B2G (CPSI) como Motor Principal** | Criar módulo de **API / Relatório Auditável de Risco Imobiliário & Custo de Ocupação** voltado a: **(a) Assessorias independentes do comprador** (ex.: perfil MySide), **(b) Seguradoras de fiança/incêndio e correspondentes de crédito** (risco físico/alagamento/CNDT/SPE), e **(c) Prefeituras / Defesa Civil (CPSI)**. Manter o app B2C como topo de funil leve + passe único pago só para **Modo Visita Avançado** (sem assinatura mensal B2C). | Único posicionamento que recebeu `pay_or_adopt` institucional (`R$ 149–4.500` âncora) sem desencadear o paradoxo do corretor (`M2`, boicotado/hackeado para esconder defeitos) nem morrer no CAC/burla do PDF avulso (`M1`). |
| **S2** | **Separação Física "Muralha ODbL" vs. Grafo Privado Condominial (`D034`)** | Ao construir o backend de sincronização (`VE15` adiado), isolar fisicamente dois serviços/bancos: **(1) Serviço Público ODbL** (espelho estático versionado dos dados abertos da PCR/IBGE sob ODbL 1.0); **(2) Cofre Privado Vereda** (medições em visita de sol/dB, documentos de condomínio enviados pelos clientes, respostas de `resposta.ts` validadas por comprovante OCR com PII redacted). | Resolve o bloqueio jurídico nº 1 apontado pela `@auditora_lgpd_juridica` e protege o *moat* proprietário de investidores (`@jurada_vc_campus`) contra exigência legal de abertura por *share-alike*. |
| **S3** | **Motor de Ingestão Resiliente + Normalização Viária (`VE13`) & Base de Aluguel Real** | Descontinuar dependência de scrapers frágeis em lotes abertos (`Oleo` falho, `ZAP` enviesado); concentrar a entrada em **busca direta por edifício/endereço + OCR local de anúncios/contratos/boletos de condomínio enviados pelo usuário (`PII-scrubbed`)** e parcerias de dados anonimizados com administradoras/seguradoras (aluguel fechado real). Resolver normalização das `211/394` ruas de Defesa Civil via grafo canônico antes de reativar qualquer modelo preditivo (`VE14`). | Substitui a "régua circular" por transações/boletos reais validados (`@investidor_planilheiro`), elimina exposição de scraping contra portais (`QuintoAndar`/`OLX`) e corrige o maior gargalo técnico aberto de dados geográficos no Recife. |
| **S4** | **Expansão Geográfica de Cobertura Mínima (Torre, Cordeiro, Várzea, Pina, Afogados)** | Priorizar a ativação das camadas de **custo + alagamento histórico + transporte validado + serviços essenciais** fora do quadrilátero Boa Viagem / Graças / Espinheiro antes de escalar marketing B2C amplo. | Reverte o bloqueio de classe e abandono (`boycott` de `@inquilino_cetico`, confiança `15/100`), desbloqueando o volume real da classe trabalhadora/universitária do Recife que sofre maior impacto com aluguel e transporte noturno. |
| **S5** | **Compliance LGPD & Direito de Resposta Documentado (Anti-SLAPP)** | Implementar fluxo automático de **redação de PII** (CPF, unidade exata, nomes de moradores/síndicos) antes de indexar atas em `ler.tsx`, somado a um canal formal de **contestação institucional por documento público datado** para incorporadoras/condomínios (lado a lado com o registro original, sem remoção unilateral). | Neutraliza o vetor de processo por difamação/LGPD das incorporadoras (`@incorporadora_diretora`) e transforma passivos judiciais públicos em registro auditável impossível de derrubar judicialmente. |

---

### Síntese Executiva em Uma Frase
**O VEREDA já tem engenharia de decisão comparativa e ferramentas de visita em campo superiores ao que existe no mercado brasileiro (`src/dados/decisao.ts`, `resposta.ts`, `visita.tsx`, `sol.tsx`), mas perderá a banca e o mercado se continuar vendendo milagres não implementados (*"escritura real"*, *"olho de peixe"*, *"microclima"*) num app ainda sem validação `G-USER`, exposto a ToS/ODbL/CRECI e dependente de uma monetização B2C de R$ 29,90 facilmente burlável.** Corte as promessas indefensáveis, valide o novo pacote fatiado no Android 4G real com 15 usuários em Recife, blinde a muralha ODbL/LGPD e alinhe a receita no eixo **B2B2C / Modo Visita**.
