# Análise Comparativa e Técnica de Referências — Motion Design VEREDA

Este documento consolida a análise detalhada das referências audiovisuais do projeto VEREDA, documentando o status de acesso, técnicas observadas, limitações e plano de síntese para a produção do pitch e demonstrações do produto.

---

## 1. Registro e Status de Acesso

| Ref ID | Título | Autor | Status de Acesso | Evidência de Inspeção Real |
| :--- | :--- | :--- | :--- | :--- |
| **REF-01** | *Ravie's 5-year Showreel (Design + Animation)* | Ravie & Co. | **available_inspected** | Arquivo de vídeo 640x360 baixado diretamente via yt-dlp, 47 quadros extraídos a 1 fps com ffmpeg (`/tmp/frames_ravie/`), contact sheet 7x7 analisado. Cenas mapeadas em segundos exatos: 0:10 (lettering e halftone grid), 0:13 (UI card highlight), 0:19 (cidade 3D laranja/terracota), 0:34 (cidade vetorial flat). |
| **REF-02** | *"Comma" motion graphics* | seven (@seven_playstudy) | **available_inspected** | Arquivo de vídeo baixado via yt-dlp, 25 quadros extraídos a 1 fps com ffmpeg (`/tmp/frames_comma/`), contact sheet 5x5 analisado. Inspecionado ciclo de pontuação, teclas físicas de teclado afundando e respiração temporal. |
| **REF-07** | *Code-based UI motion design showreel (One-Shape UI Morph)* | zero (@twoclipping) | **available_inspected_via_transcript_and_spec** | Vídeo no X bloqueado para download headless direto sem autenticação. Inspeção realizada na transcrição técnica integral no repositório público JasonZhu.AI, contendo o prompt XML de 2.711 caracteres, estrutura dos 7 compassos a 120 BPM, pipeline Playwright/ffmpeg e metadados. |
| **REF-08** | *Motion Design Studio Workflow with Claude Opus 5.5* | Movez (@0xMovez) | **available_inspected_via_transcript_and_spec** | Post original no X protegido. Inspeção realizada no curso integral de 12 etapas via Thread Navigator, abrangendo o contrato `window.seek(t)`, equações fechadas de molas (`spring` e `track`), analisador `beats.py` (librosa/numpy), sintetizador de SFX (`sfx.mjs`), harness de review loop e script `render.mjs`. |

---

## 2. Decomposição das Novas Referências (REF-07 e REF-08)

### REF-07: O Princípio "One-Shape UI Morph" (@twoclipping)
* **Conceito Nuclear**: *One shape, never cut*. Em vez de cortar entre telas diferentes ou aplicar crossfades que desorientam o espectador, um único container contínuo transforma suas dimensões (`width`, `height`), raio de borda (`border-radius`), cor de preenchimento e elevação.
* **Mapeamento de Conteúdo**: O conteúdo interno nunca colide. O conteúdo anterior sai com leve fade e blur de saída antes que a geometria atinja o novo estado; o novo conteúdo entra apenas quando a caixa tem área suficiente para acomodá-lo (`swapAlpha(t, tIn, tOut)`).
* **Interatividade Narrativa**: Um cursor virtual preto com física de alta responsividade conduz as mudanças com ações concretas (digitar URL, clicar em botão, inspecionar discrepância, expandir raio geográfico).

### REF-08: A Arquitetura do Estúdio Determinístico (@0xMovez)
* **Contrato `window.seek(t)`**: A renderização é uma função pura do tempo $t$. Não há `setTimeout`, nem `requestAnimationFrame` em modo de captura, nem variáveis de estado acumuladas entre quadros.
* **Molas em Forma Fechada**: Em vez de simulações numéricas iterativas (como Euler ou Verlet que dependem do histórico de quadros), utiliza a resposta ao degrau da equação diferencial de segunda ordem:
  $$f(t) = 1 - e^{-\zeta \omega_n t} \left(\cos(\omega_d t) + \frac{\zeta \omega_n}{\omega_d}\sin(\omega_d t)\right)$$
* **Multi-Target Tracking**: Quando uma propriedade recebe novos alvos ao longo do tempo (ex.: o cursor que vai para $P_1$ em $t_1$, depois para $P_2$ em $t_2$), a posição não reinicia a mola, mas soma uma resposta ao degrau para cada mudança:
  $$v(t) = v_0 + \sum_{i=1}^{n} (v_i - v_{i-1}) \cdot \text{spring}(t - t_i, k, d)$$
* **Loop de Crítica com Contact Sheets**: Antes de gerar o vídeo final, o estúdio extrai quadros-chave a cada compasso/batida, monta uma prancha de contato visual, avalia critérios de 1 a 10 e corrige os três piores defeitos em um `review-log.md`.

---

## 3. Matriz de Síntese para o VEREDA

Nenhuma referência deve ser copiada isoladamente. O VEREDA combina as quatro referências em momentos narrativos específicos e complementares:

```
[Território Urbano & Cidade 3D]       --> Inspirado em REF-01 (Ravie 0:19)
    Avenida isométrica, edifícios técnicos, paleta barro/terracota (#8C3D1D, #D9805A)

[Caos de Dados Públicos & Teclas]     --> Inspirado em REF-02 (Comma)
    Sobriedade monocromática, carimbos cadastrais, peso institucional anti-slop

[Demonstração Central do Produto]     --> Inspirado em REF-07 (One-Shape Morph)
    Container único: URL -> Scanner -> Card -> IPTU -> Lote -> Mapa -> Dossiê

[Motor e Pipeline de Renderização]    --> Inspirado em REF-08 (Studio Workflow)
    seek(t) determinístico, Playwright + ffmpeg, beats.json, review-log.md
```

Todas as cenas adotam rigorosamente o **Sistema de Design Real do VEREDA**:
- Tipografia: **Archivo / Archivo Condensed** (tokens reais do protótipo) + **Instrument Serif** (peso editorial).
- Cores: Papel Técnico Off-White (`#F3F4F2`), Grafite Escuro (`#22292D`), Barro/Terracota (`#8C3D1D`), Azul Cadastral (`#2E5A85`), Maré (`#1F7F7A`).
- Gráficos: Grid milimetrado pontilhado de prancheta pericial, miras técnicas de alinhamento (`+`, `( . )`), réguas métricas.
