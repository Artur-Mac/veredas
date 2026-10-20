# Diretrizes de Motion Design & Produção Audiovisual — VEREDA

Este arquivo define o contrato de engenharia e direção de arte para qualquer sessão ou agente trabalhando no sistema audiovisual do **VEREDA**.

---

## 1. Contrato de Renderização Determinística (`window.seek(t)`)

- **Função Pura do Tempo**: Todo filme, cena ou animação deve ser uma função determinística do tempo `t` em segundos (`window.seek(t)`).
- **Sem Estado Acumulado**: Proibido o uso de `setTimeout`, `setInterval` ou `requestAnimationFrame` durante o modo de renderização headless. Qualquer quadro $t$ deve poder ser renderizado isoladamente sem calcular os quadros anteriores.
- **Ruído Pseudoaleatório Sementeado**: Nunca use `Math.random()`. Utilize sempre PRNG determinístico (`mulberry32` ou hash sementeado).
- **Proibição de `will-change`**: Nunca aplique `will-change: transform` em containers que contenham tipografia escalada por zoom de câmera, para evitar subpixel blurring.

---

## 2. Biblioteca de Referências (`refs/references.json`)

- **Adição Contínua**: Nunca sobrescreva referências anteriores. Ao incorporar uma nova referência, adicione-a com identificador sequencial (`REF-09`, `REF-10`, etc.) no arquivo [`refs/references.json`](./refs/references.json).
- **Transparência de Acesso**: Use `available_inspected` apenas se o arquivo foi realmente baixado/assistido. Se for inspecionado via transcrições ou prompts de apoio, use `available_inspected_via_transcript_and_spec`.

---

## 3. Direção de Arte e Princípio Anti-AI-Slop

- **One-Shape UI Morphing**: Na demonstração do produto, evite cortes secos ou crossfades genéricos entre telas. Um único container contínuo deforma suas dimensões e raio enquanto o conteúdo troca com timing de opacidade controlado (`swapAlpha`).
- **DNA da Marca**:
  - Paleta: Papel Técnico (`#F3F4F2`), Grafite Escuro (`#22292D`), Barro Pericial (`#8C3D1D`), Azul Cadastral (`#2E5A85`), Maré (`#1F7F7A`), Linha (`#E2E5E2`).
  - Fontes: **Archivo** e **Archivo Condensed** (reais do protótipo) + **Instrument Serif** para títulos de impacto.
  - Proibido: Gradientes arco-íris, brilhos neon artificiais, efeitos de partículas genéricos ou modelos 3D que pareçam templates comerciais pré-fabricados.
- **Fidelidade Cadastral**: Utilize sempre dados urbanos autênticos do Recife (DSQFL real, bairros reais como Boa Viagem, Graças e Casa Forte, cotas e normas ABNT).

---

## 4. Pipeline Obrigatório de Revisão Visual (Visual QA)

Nenhuma tarefa de animação é dada como concluída apenas porque o código compilou. É obrigatório:
1. Renderizar snapshots de cada estado e midpoint de morfismo.
2. Gerar uma folha de contato (`contact_sheet.png`) e preview reduzido (360px de largura).
3. Inspecionar visualmente os quadros gerados com ferramentas de visualização.
4. Documentar problemas encontrados e correções aplicadas em [`docs/review-log.md`](./docs/review-log.md).
5. Executar pelo menos duas rodadas de crítica e ajuste antes da entrega.
