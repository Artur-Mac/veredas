# VEREDA — Inteligência de Evidências para Moradia no Recife

> **"O link do anúncio vira um dossiê de evidências."**  
> Transformando anúncios imobiliários, cadastros municipais, bases parceiras e observação em campo em fatos rastreáveis, posição em distribuições reais e roteiros práticos de visita.

---

## Prova de conceito em execução

**Referência exclusiva de design e experiência:** [`index.html`](./index.html), em `/home/v/Documents/vereda/veredas/index.html`. A regra abrange interface, layout, navegação e interações, além de cores e fontes. Outros protótipos, o app existente e documentos arquivados não são referências alternativas de design ou UX.

O app agora inclui um caderno local: cadastro manual ou link de referência, edição, custos mensais, comparação de dois imóveis, checklist e perguntas copiáveis. Na página inicial, use **Adicionar imóvel sem link** ou **Abrir minhas análises**. Os dossiês de referência continuam separados dos dados que você adicionar.

- [Plano por épocas e prompt de continuidade](./docs/PLANO-POC-EXECUCAO.md)
- [Validação e limites atuais](./docs/POC-VALIDACAO.md)
- [v1.0: escopo e viabilidade](./docs/V1-ESCOPO-E-VIABILIDADE.md) e [ordem de execução para o operário](./docs/handoff/ORDEM_DO_ARQUITETO.md)
- Iniciar: `npm run web`; teste do fluxo com servidor ativo: `npm run test:poc` (porta padrão 8087; configure `POC_URL` para outra).

## 📌 Especificação histórica

Toda a especificação estratégica, funcional, de dados e arquitetural do projeto está consolidada no documento canônico:

* **[Documento Definitivo do Projeto (`docs/VEREDA_DOCUMENTO_DEFINITIVO.md`)](./docs/VEREDA_DOCUMENTO_DEFINITIVO.md):** Master Spec 3.0 & Avaliação Executiva (Visão, Arquitetura de 3 Camadas com chave `DSQFL`, Tese de IA, Funcionalidades Decididas, Modelo de Negócios e Roteiro Campus Mobile 15ª Edição).

> **Atualização de 19/10/2026:** o usuário autorizou consultar `ignorar/` como pesquisa para a prova de conceito. O plano atual está em [Plano da POC](./docs/PLANO-POC-EXECUCAO.md); ideias antigas devem ser reconciliadas com esse plano e com o código, não aplicadas automaticamente.

---

## 🏛️ Visão Geral do Produto

O **Vereda** é um aplicativo móvel desenvolvido para a **15ª Edição do Campus Mobile** (Categoria: *Tecnologias Urbanas*), focado no mercado imobiliário do **Recife** (cobertura inicial do protótipo: *Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena*).

Quem procura apartamento para alugar ou comprar decide hoje no escuro: anúncios omitem o número do prédio, escondem obras vizinhas, contradizem áreas e não informam o contexto real do lote. O Vereda atua **após a descoberta do anúncio**:

```
[1. Colar ou Compartilhar Link do Anúncio (T1 / T2)]
                     │
                     ▼
[2. Resolução do Edifício via Lote Cadastral DSQFL (T3)]
                     │
                     ▼
[3. Dossiê de Evidências, Régua de Preço e Consistência (T4 / T5)]
                     │
                     ▼
[4. Roteiro de Visita, WhatsApp ao Corretor e Sensores em Campo (T6 / T7)]
```

### Princípios Inegociáveis
* **Posição é fato, adjetivo é veredito:** Sem notas opacas de 0 a 10, estrelas ou selos de "barato/caro". Preços e indicadores são posicionados em **réguas de distribuição** (P25, Mediana, P75).
* **Desconhecido vira ação:** Toda divergência entre o anúncio e o cadastro oficial (ou lacuna documental) alimenta automaticamente o bloco **"Para perguntar na visita"** e a mensagem pronta de 3 linhas para o corretor no WhatsApp.
* **Celular como instrumento de perícia:** O **Modo Visita (`T7`)** utiliza GPS (confirmando a presença física no edifício), câmera, microfone (dB) e bússola durante a vistoria presencial.

---

## 📱 Aplicativo (React Native + Expo SDK 57) e Protótipos

O repositório conta com o aplicativo multiplataforma em **React Native 0.86 + Expo SDK 57** ([`src/`](./src/)) e o mock interativo em HTML ([`docs/mock/index.html`](./docs/mock/index.html)), além do protótipo web da raiz, referência exclusiva de design e experiência ([`index.html`](./index.html)).

### 1. Rodando o App Oficial (Expo SDK 57 — `src/`)
```bash
# Instalar dependências
npm install

# Iniciar o servidor do Expo (Android, iOS ou Web)
npm run start

# Executar verificação completa (TypeScript + ESLint + Testes Jest)
npm run verificar
```

### 2. Rodando o Mock Clicável (`docs/mock/`)
```bash
python3 -m http.server 8765 --bind 127.0.0.1
# Acesse http://127.0.0.1:8765/docs/mock/
```

---

## 🗂️ Estrutura do Repositório

```
.
├── docs/
│   ├── VEREDA_DOCUMENTO_DEFINITIVO.md   # Especificação Canônica Unificada & Avaliação Executiva
│   └── mock/                            # Mock HTML + JSONs dos 5 dossiês e créditos
├── src/                                 # App React Native 0.86 + Expo SDK 57 (Expo Router)
│   ├── app/                             # 15 telas do fluxo (T1 a T16) + painel dev (/mock)
│   ├── componentes/                     # Componentes funcionais, régua, gráficos e mapa
│   ├── dados/                           # Schema Zod (esquema.ts), consultas, formatos e geo
│   └── estado/                          # Contextos e persistência local (AsyncStorage)
├── tests/
│   └── dominio.test.ts                  # Suíte de testes unitários de domínio e formatação
├── index.html                           # Protótipo web histórico standalone (preservado)
└── ignorar/                             # Arquivos legados arquivados (não utilizar)
```

---

## 👥 Equipe (Campus Mobile — 15ª Edição)

* **Samuel:** Estratégia de Produto & Jornada do Usuário
* **Walter:** Design & Interface
* **Artur:** Pesquisa, Engenharia de Dados & Arquitetura de Software
