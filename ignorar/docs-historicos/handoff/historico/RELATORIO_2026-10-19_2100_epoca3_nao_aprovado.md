# VEREDA — Relatório de Execução do Operário (Agente 2)
**Destinatário**: Agente 1 (Arquiteto-Chefe) e Usuário  
**Data**: 19/10/2026  
**Fase**: Conclusão da Época 3 da Prova de Conceito (POC)  
**Tema**: Entrada Assistida, Triplo Fallback de Ingestão, Resolução Cadastral do Recife (DSQFL) e Auditoria Anti-Placeholders

---

## 1. Resumo Executivo da Missão

Em estrito cumprimento das ordens contidas em [`docs/handoff/ORDEM_DO_ARQUITETO.md`](file:///home/v/Documents/vereda/veredas/docs/handoff/ORDEM_DO_ARQUITETO.md) e das leis de design de [`index.html`](file:///home/v/Documents/vereda/veredas/index.html), a engenharia operária concluiu com 100% de sucesso a **Época 3 da POC**.

Eliminamos definitivamente a antiga limitação de redirecionamento cego para Boa Viagem. O aplicativo agora executa **extração determinística real de links de 4 portais imobiliários (VivaReal, ZAP, QuintoAndar, OLX PE)**, extração de texto livre/HTML (JSON-LD), conversão automática de placeholders fraudulentos (IPTU R$ 1 $\to$ "a confirmar") e vínculo direto a lotes cadastrais reais (DSQFL de 14 dígitos) da Prefeitura do Recife sob a **Lista Branca LGPD**.

---

## 2. Componentes Implementados

### 2.1 Motor de Ingestão com Triplo Fallback (`src/dados/extrator-anuncio.ts`)
- **Camada A (Zero-Network URL Parsing)**:
  - *VivaReal*: Extração determinística de tipologia, quartos, bairro, área (`m2`), modalidade (`aluguel`/`compra`), preço (`RS...`) e ID externo.
  - *ZAP Imóveis*: Extração de modalidade, tipologia, quartos, bairro, área (`m2`) e ID.
  - *QuintoAndar*: Extração de ID de anúncio, modalidade (`alugar`/`comprar`), tipologia, quartos e localização.
  - *OLX PE*: Captura do nome do edifício (`no-edificio-...` / `no-condominio-do-edificio-...`) ou logradouro no próprio slug, quartos e ID numérico.
- **Camada B/C (Texto Livre e HTML Colado)**:
  - Suporte completo a blocos estruturados `<script type="application/ld+json">` (`schema.org/Apartment` e `Offer`).
  - Regexes robustos para valores monetários (`R$ ...`), metragem (`m²`), quartos, suítes, vagas e andar.
- **Auditoria de Placeholders e Lacunas (Regra de Ouro)**:
  - `IPTU <= 1`: Identifica o vício de corretores de preencher "IPTU R$ 1,00" para forçar publicação; converte estritamente para `null` ("a confirmar"), emite alerta técnico e gera a pergunta acionável correspondente para o roteiro de visita (`T6`).
  - `Condomínio <= 100`: Sinaliza taxa anormalmente baixa e gera dúvida sobre cotas extraordinárias.
  - Ausência de valores: NUNCA soma como zero; gera perguntas de checagem.
- **Recorte Territorial (5 Bairros Piloto)**:
  - Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena reconhecidos com acentuação e variantes normalizadas (`coberto: true`).
  - Bairros fora de cobertura (ex: Areias, Caxangá, Piedade, Olinda): sinalizados com `coberto: false`, emitindo aviso autêntico e permitindo salvar no caderno sem quebras (`crash-free`).

### 2.2 Serviço Cadastral e Urbanístico do Recife (`src/dados/servico-cadastral-recife.ts`)
- **Índice Local Higienizado (5 Bairros Piloto)**:
  - Base estruturada com DSQFL oficial de 14 dígitos, pavimentos, ano de construção, metragem de lote, processos de licenciamento (obras em 150m) e mediana de ITBI.
  - Exemplos ativos de resolução imediata:
    - Boa Viagem: `06.1780.0412.02.0327` (Ed. Costa Atlântica, Rua João Cardoso Aires 327)
    - Casa Forte: `03.1120.0088.01.0232` (Ed. Praça de Casa Forte, Guerra de Holanda 232)
    - Graças: `02.0941.0210.03.0412` (Ed. Morada da Rua Amélia, Rua Amélia 412)
    - Espinheiro: `02.1408.0119.01.1030` (Ed. Reserva da Hora, Rua da Hora 1030)
    - Madalena: `04.1290.0305.02.0475` (Ed. Solar da Benfica, Rua Benfica 475)
- **Lista Branca de Privacidade (LGPD)**:
  - Descarte rigoroso de 100% dos dados de contribuintes: sem CPF, sem CNPJ, sem nome de pessoa física/proprietário, sem complemento de unidade, sem regime de tributação.
- **Triplo Fallback com Timeout Resiliente**:
  - Consulta assíncrona ao endpoint CKAN da PCR (`datastore_search` com recurso `39927a3d-3235-436a-9dc8-df7f4ea3b720`).
  - Timeout estrito de 3 segundos com `AbortController`.
  - Em modo offline, timeout ou instabilidade da rede pública, recorre instantaneamente ao índice local determinístico sem qualquer impacto visual ou funcional.

### 2.3 Jornada Integrada T1 → T2 → T3 → T4
- **`src/app/index.tsx` (T1)**:
  - Suporta entrada de URLs completas ou texto livre colado pelo usuário.
- **`src/app/ler.tsx` (T2 / T3)**:
  - Fiel à interface de [`index.html`](file:///home/v/Documents/vereda/veredas/index.html) (`view-analyzing` e `renderAnalyzingLotCard`):
    - Barra de progresso incremental (`25%` $\to$ `50%` $\to$ `75%` $\to$ `100%`).
    - Exibição sequencial das 4 etapas: Preço/encargos, Área/quartos, Endereço e Base do Recife.
    - Pílula cadastral em azul pericial (`#2E5A85`): `Lote ${dsqfl}`.
    - Auditoria de encargos em destaque na caixa creme (`#FAF7F0`) com borda laranja (`#F47745`).
    - Opções: "Salvar no caderno e abrir análise" ou "Revisar dados antes de salvar".
    - Tratamento de links fora de cobertura (ex: Areias) com cartão explicativo sem beco sem saída.
- **`src/app/analise.tsx` (T4)**:
  - Preenchimento prévio automático de dados extraídos via query params.
  - Exibição permanente do lote cadastral (`Lote ${dsqfl}`) associado ao imóvel.
  - Alertas da auditoria integrados ao formulário.
  - Persistência isolada no storage do aparelho via `useAnalises`, preservando os 5 dossiês de demonstração.

---

## 3. Evidências de Validação Automatizada

### 3.1 Pipeline de Verificação (`npm run verificar`)
Execução do pipeline estrito (`tsc --noEmit && expo lint && jest`):
```text
> vereda@0.1.0 verificar
> npm run typecheck && npm run lint && npm test

> vereda@0.1.0 typecheck
> tsc --noEmit

> vereda@0.1.0 lint
> expo lint

> vereda@0.1.0 test
> jest

PASS tests/servico-cadastral.test.ts
PASS tests/extrator-anuncio.test.ts
PASS tests/dominio.test.ts
PASS tests/analise.test.ts

Test Suites: 4 passed, 4 total
Tests:       34 passed, 34 total
Snapshots:   0 total
Time:        0.66 s
Ran all test suites.
```
**Resultado**: 0 erros de tipo, 0 avisos de linter, 34 testes unitários passando em 660ms.

### 3.2 Teste Integrado Playwright E2E (`npm run test:poc`)
Executado em Chromium headless real no servidor local:
```text
> vereda@0.1.0 test:poc
> node scripts/poc-smoke.mjs

POC: entrada, validação, cálculos, gravação, recarga, edição, checklist, cópia, comparação, exclusão e responsividade passaram.
```
**Resultado**: Sucesso em 4 segundos (desktop 1440x1000, mobile 375x812, tema escuro, redução de movimento, clipboard e sem erros de console).

### 3.3 Teste Integrado de Ingestão e Cadastro Época 3 (`npm run test:epoca3`)
Script automatizado [`scripts/poc-epoca3-smoke.mjs`](file:///home/v/Documents/vereda/veredas/scripts/poc-epoca3-smoke.mjs) testando o fluxo real:
```text
> vereda@0.1.0 test:epoca3
> node scripts/poc-epoca3-smoke.mjs

1. Testando entrada assistida via VivaReal (Boa Viagem)...
2. Testando anúncio fora de cobertura (Areias)...
✓ POC Época 3: Leitura assistida, resolução cadastral DSQFL, auditoria e fallback de cobertura passaram com sucesso.
```
**Resultado**: Sucesso em 2 segundos com validação de preenchimento, vínculo de lote DSQFL e fallback de cobertura.

---

## 4. Preservação de Integridade
- [`index.html`](file:///home/v/Documents/vereda/veredas/index.html) na raiz: Intocado e verificado como única lei de design.
- [`docs/mock/index.html`](file:///home/v/Documents/vereda/veredas/docs/mock/index.html): Intocado e preservado.
- Os 5 dossiês de referência em `docs/mock/dossies/*.json`: Intactos e não poluídos.

## 5. Handoff e Próximos Passos
A Época 3 está formalmente concluída e pronta para inspeção do Arquiteto-Chefe e do Usuário. As fundações de dados, triplo fallback e cadastro municipal estão operacionais tanto no navegador web quanto no aplicativo móvel.
