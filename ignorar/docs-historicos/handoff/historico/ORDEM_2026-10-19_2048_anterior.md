# VEREDA — Ordem do Arquiteto-Chefe (Agente 1)
**Destinatário**: Agente 2 — Engenheiro Operário de Execução Determinística e Massiva  
**Data**: 19/10/2026  
**Fase**: Época 3 da Prova de Conceito (POC) do VEREDA  
**Tema**: Entrada Assistida, Triplo Fallback de Ingestão e Resolução Cadastral do Recife (DSQFL)

---

## 1. Diretriz Soberana e Mandato de Execução

Você atuará estritamente como **Agente 2 (Operário)**. Sua função é executar a engenharia de software com rigor matemático, integridade tipada e total ausência de autonomia estética ou criativa desautorizada.

### Leis Imutáveis:
1. **Fonte Única de Design e UX**: `/home/v/Documents/vereda/veredas/index.html`. Toda paleta, tipografia, ritmo de cards, badges, pills e micro-interações devem espelhar fielmente esse arquivo. Fundo papel `#F2EBDD`, superfícies brancas `#FFFFFF` e creme `#FAF7F0`, tinta `#171717`, destaque laranja `#F47745`, ferrugem `#B94E36`, azul cadastral `#2E5A85`.
2. **Preservação de Arquivos Web**: Os arquivos `index.html` (raiz) e `docs/mock/index.html` não podem ser deletados ou adulterados.
3. **Integridade Epistemológica dos Dados**:
   - NUNCA converta uma parcela ausente ou placeholder simbólico ("Não informado", IPTU R$ 1, Condomínio R$ 0) em zero.
   - Todo placeholder detectado deve ser convertido em `null` ("a confirmar") e transformado em pergunta para o roteiro de visita (`T6`).
4. **Isolamento de Persistência**:
   - As análises criadas pelo usuário via link ou texto devem ser persistidas de forma isolada em `useAnalises`, jamais sobrescrevendo ou corrompendo os 5 dossiês de referência de `docs/mock/dossies/`.

---

## 2. Entregáveis Técnicos Obrigatórios da Época 3

### Entregável 1: `src/dados/extrator-anuncio.ts`
Implementar o motor de extração resiliente com triplo fallback:
- **Camada A (Zero-Network URL Parsing)**:
  - Regex parsers determinísticos para links reais de portais:
    - **VivaReal**: Extrair tipologia, quartos, bairro, área (`\d+m2`), modalidade (`aluguel`/`compra`), preço (`RS\d+`), ID do anúncio.
    - **ZAP Imóveis**: Extrair modalidade, tipologia, quartos, bairro, área (`\d+m2`), ID do anúncio.
    - **QuintoAndar**: Extrair ID, modalidade (`alugar`/`comprar`), tipologia, quartos, bairro.
    - **OLX PE**: Extrair nome do edifício (ex: `no-edificio-...` / `no-condominio-do-edificio-...`), quartos, bairro, ID.
  - **Recorte Territorial**:
    - Identificar os 5 bairros piloto do Recife: Boa Viagem, Casa Forte, Graças, Espinheiro, Madalena.
    - Se o anúncio for de bairro fora da cobertura (ex: Areias, Caxangá, Olinda, Piedade), assinalar `coberto: false`, exibir aviso autêntico e permitir prosseguir no caderno sem quebrar a aplicação.
- **Camada B/C (Extração de Texto Livre e HTML Colado)**:
  - Extrair metadados a partir de blocos JSON-LD (`schema.org/Apartment` ou `Offer`) ou texto livre colado pelo usuário.
- **Auditoria de Placeholders e Lacunas**:
  - `IPTU <= 1`: Converter para `null` e emitir alerta de placeholder imobiliário para evitar subdeclaração de encargos.
  - `Condomínio <= 100`: Emitir alerta de taxa atípica para checagem de cotas extraordinárias.
  - Gerar dúvidas acionáveis automáticas para cada campo ausente.

### Entregável 2: `src/dados/servico-cadastral-recife.ts`
Implementar o serviço de resolução cadastral para a Prefeitura do Recife:
- **Índice Local Higienizado (5 Bairros)**:
  - Base estruturada com lotes representativos e edifícios reais em Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena.
  - **Lista Branca de Privacidade (LGPD)**: Preservar estritamente apenas dados do imóvel (DSQFL de 14 dígitos, logradouro, número, bairro, pavimentos, ano de construção, área do lote, obras em 150m, ITBI mediano). Descartar CPF, CNPJ, nome de contribuinte, complemento de unidade e logins técnicos.
- **Consulta Externa CKAN com Timeout e Fallback**:
  - Endpoint `datastore_search` (recurso `39927a3d-3235-436a-9dc8-df7f4ea3b720`).
  - Timeout estrito de 3 segundos com `AbortController`.
  - Fallback 100% gracioso para o índice local determinístico quando offline ou em caso de erro da rede pública.

### Entregável 3: Refatoração da Jornada T1 → T2 → T3 → T4
- **`src/app/ler.tsx`**:
  - Substituir o redirecionamento cego para Boa Viagem pelo fluxo real de análise e resolução.
  - Exibir visualmente os passos de extração e resolução de lote conforme a referência de `index.html`.
  - Conectar com o formulário de análise (`src/app/analise.tsx`), pré-populando os dados extraídos e permitindo salvar no caderno local.
- **`src/app/index.tsx`**:
  - Suportar tanto colagem de URL quanto colagem de texto de anúncio.

### Entregável 4: Cobertura de Testes Automatizados
- `tests/extrator-anuncio.test.ts`:
  - Casos para VivaReal, ZAP, QuintoAndar, OLX PE.
  - Detecção de bairros fora de cobertura (Areias).
  - Conversão de IPTU R$ 1 para `null` ("a confirmar").
  - Extração de JSON-LD e texto livre.
- `tests/servico-cadastral.test.ts`:
  - Busca local por DSQFL e endereço nos 5 bairros.
  - Verificação de conformidade com a Lista Branca LGPD.
  - Resiliência a falhas de rede / timeout.

---

## 3. Critérios de Aceite para Handoff

1. `npm run verificar` (`tsc --noEmit`, `expo lint`, `jest`) deve passar com 0 erros.
2. Nenhum dado de contribuinte/LGPD exposto.
3. Emitir `docs/handoff/RELATORIO_DO_OPERARIO.md` com logs detalhados e evidências das execuções.
