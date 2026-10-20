# Gramática Visual & Sistema de Motion Design — VEREDA

Este documento define as regras fundamentais de movimento, física matemática, transições de estado, roteamento de cursor e tratamento sonoro para as produções audiovisuais do VEREDA.

---

## 1. O Princípio One-Shape (Um Objeto Visual, Múltiplos Estados Funcionais)

Inspirado na referência de motion design baseada em código (@twoclipping), a demonstração do produto VEREDA utiliza o princípio de **continuidade geométrica ininterrupta**.

> [!IMPORTANT] Regra de Ouro da Transição
> O espectador deve perceber uma **única investigação pericial se desenrolando através do mesmo objeto físico**.
> É expressamente proibido o uso de *fade-out para tela preta/branca seguido de fade-in* entre telas do produto. Todas as mudanças ocorrem pela deformação elástica do container, reacomodação dos eixos e substituição controlada de conteúdo.

### Sequência Canônica dos 12 Estados de Interface

Auditamos os componentes reais do protótipo (`index.html`, `src/tema/tokens.ts`, `src/dados/dossies.ts` e `PROPERTIES[0]` — Ed. Costa Atlântica, Boa Viagem) e mapeamos o fluxo:

| # | Estado | Componente Real no Protótipo | Dados Reais no VEREDA | Suporte no Protótipo |
| :-: | :--- | :--- | :--- | :---: |
| **01** | **Input de URL** | `#decoderUrlInput`, `.scanner-card` | URL de anúncio imobiliário colada | Suportado |
| **02** | **Análise / Scanner** | `#view-analyzing`, `.step-item` | "Cruzando anúncio com base cadastral da Prefeitura do Recife..." | Suportado |
| **03** | **Card Resumo do Imóvel** | `.vereda-card-body`, `#portfolioGrid` | Ed. Costa Atlântica · Boa Viagem · R$ 4.500/mês | Suportado |
| **04** | **Fotografia do Imóvel** | `.dossier-photo-track`, `PROPERTIES.images` | Foto real de fachada/interior com badge de vistoria | Suportado |
| **05** | **Confronto de Área (Auditoria)** | `.fact-sheet-card`, `discrepanciaArea` | Anúncio: 110 m² vs Cadastro: 92 m² (18 m² a menos / R$ 125 mil de sobrepreço) | Suportado |
| **06** | **Ficha Oficial / IPTU / DSQFL** | `.badge-dsqfl`, `PROPERTIES.dsqfl` | DSQFL 06.1780.0412.02.0327 · Habite-se 1984 | Suportado |
| **07** | **Lote e Projeção do Prédio** | `docs/mock/app/mapa.js`, polígono lote | Lote retangular com alinhamento predial oficial | Suportado |
| **08** | **Mapa do Bairro (Recife)** | `#ds-central-map`, `.ds-map` | Mapa cartográfico de Boa Viagem com malha viária e orla | Suportado |
| **09** | **Raio de Investigação de 150m** | `dossie.schema.json`, anéis de raio | Raio de 150m (segurança imediata e infraestrutura) | Suportado |
| **10** | **Caminhabilidade / Rota à Praia** | Rota vetorial no mapa municipal | 420 metros até a orla · 6 minutos a pé | Suportado |
| **11** | **Checklist / Handoff ao Corretor** | `#customVisitQuestionInput` | "Solicitar certidão de habite-se e planta aprovada na PCR" | Suportado |
| **12** | **Dossiê Pericial Final** | `#view-dossier`, `.dossier-panel` | Dossiê de 4 Pilares (Físico, Jurídico, Urbano, Financeiro) | Suportado |

---

## 2. Matriz Detalhada de Morfismo (State-to-State)

Para garantir integridade visual absoluta, cada transição obedece à especificação formal:

```
─────────────────────────────────────────────────────────────────────────────
TRANSIÇÃO 01: Input de URL → Scanner de Análise
─────────────────────────────────────────────────────────────────────────────
FROM STATE:                Input de URL (barra de busca 680x56px, raio 8px, fundo branco)
TO STATE:                  Scanner de Análise (painel 520x280px, raio 16px, papel técnico)
SHARED ELEMENT:            Borda externa do container principal
GEOMETRIC TRANSFORMATION:  Expansão vertical do container (56px → 280px), raio 8px → 16px
CONTENT TRANSFORMATION:    URL de anúncio é absorvida; surge barra de progresso pericial e 3 etapas cadastrais
CAMERA TRANSFORMATION:     Câmera centralizada, leve aproximação de 1.0x para 1.05x
TIMING:                    0.45s (mola k=190, d=24)
INTERACTION:               Cursor preto desliza até botão "Gerar Dossiê", pressiona com recuo elástico de 2px
SOUND CUE:                 Clique seco mecânico (1800Hz) seguido de pulso pericial baixo (90Hz)
VISUAL CONTINUITY:         A linha inferior do input se transforma na linha guia do primeiro passo do scanner
─────────────────────────────────────────────────────────────────────────────
TRANSIÇÃO 02: Scanner de Análise → Card Resumo do Imóvel
─────────────────────────────────────────────────────────────────────────────
FROM STATE:                Scanner de Análise concluído (520x280px)
TO STATE:                  Card Resumo (760x420px, proporção 16:9, foto + dados essenciais)
SHARED ELEMENT:            Retângulo do container
GEOMETRIC TRANSFORMATION:  Expansão horizontal e vertical com ancoragem central
CONTENT TRANSFORMATION:    Check verde transmuta para badge "Boa Viagem"; cabeçalho revela "Ed. Costa Atlântica"
CAMERA TRANSFORMATION:     Recuo suave de 1.05x para 1.0x com leve inclinação de 1° para sensação de profundidade
TIMING:                    0.50s (mola k=170, d=22)
INTERACTION:               Cursor move-se para a margem superior direita do card
SOUND CUE:                 Deslize suave de papel técnico (whoosh 350ms)
VISUAL CONTINUITY:         A cor de acento barro (#8C3D1D) do scanner fixa-se na etiqueta do bairro
─────────────────────────────────────────────────────────────────────────────
TRANSIÇÃO 03: Card Resumo → Confronto de Área / Discrepância
─────────────────────────────────────────────────────────────────────────────
FROM STATE:                Card Resumo do Imóvel (760x420px)
TO STATE:                  Painel de Confronto de Área (640x360px, régua métrica comparativa)
SHARED ELEMENT:            Quadro inferior de especificações (92 m²)
GEOMETRIC TRANSFORMATION:  A foto superior retrai em colapso horizontal, enquanto o bloco de área se destaca
CONTENT TRANSFORMATION:    Surge o conflito dramático: "Anúncio: 110 m²" vs "IPTU/Cadastro: 92 m²" (-18 m²)
CAMERA TRANSFORMATION:     Dolly-in de foco na régua métrica (zoom 1.15x na etiqueta de discrepância)
TIMING:                    0.42s (mola k=220, d=25)
INTERACTION:               Cursor aponta diretamente para o selo "-18 m² / R$ 125 MIL de sobrepreço"
SOUND CUE:                 Dois pulsos rápidos de medição cadastral (pop 150ms)
VISUAL CONTINUITY:         A linha da régua métrica do VEREDA se estende exatamente a partir da borda do card
─────────────────────────────────────────────────────────────────────────────
TRANSIÇÃO 04: Confronto de Área → Registro Oficial / IPTU / DSQFL
─────────────────────────────────────────────────────────────────────────────
FROM STATE:                Painel de Confronto de Área (640x360px)
TO STATE:                  Ficha Cadastral Municipal (700x480px, carimbo oficial e DSQFL)
SHARED ELEMENT:            Linha métrica de 92 m²
GEOMETRIC TRANSFORMATION:  O container se alarga para simular uma certidão técnica com grid pontilhado
CONTENT TRANSFORMATION:    O número 92 m² ancora no campo "Área Construída Tributada", surge o código "DSQFL 06.1780.0412.02.0327"
CAMERA TRANSFORMATION:     Pan sutil para a esquerda, revelando o carimbo pericial de autenticidade
TIMING:                    0.48s (mola k=180, d=24)
INTERACTION:               Cursor clica no código DSQFL, ativando iluminação da coordenada
SOUND CUE:                 Carimbo mecânico suave (thump pericial amortecido)
VISUAL CONTINUITY:         O selo do DSQFL projeta um feixe de luz que desenha o contorno do lote
─────────────────────────────────────────────────────────────────────────────
TRANSIÇÃO 05: Ficha Cadastral → Projeção do Lote e Prédio
─────────────────────────────────────────────────────────────────────────────
FROM STATE:                Ficha Cadastral Municipal (700x480px)
TO STATE:                  Projeção Isométrica do Lote Urbano (820x520px)
SHARED ELEMENT:            Retângulo da lâmina do edifício
GEOMETRIC TRANSFORMATION:  O papel técnico inclina-se em perspectiva 2.5D (rotação X 25°, rotação Z -12°)
CONTENT TRANSFORMATION:    O texto da certidão dá lugar às cotas do terreno (15m x 40m = 600 m² de lote)
CAMERA TRANSFORMATION:     Câmera sobe em ângulo zenital/oblíquo, revelando a volumetria da quadra
TIMING:                    0.55s (mola k=150, d=20)
INTERACTION:               Cursor orbita ligeiramente a geometria do lote antes de recuar
SOUND CUE:                 Giro espacial e clique de engate estrutural
VISUAL CONTINUITY:         As linhas de cota do lote expandem-se para conectar às ruas vizinhas
─────────────────────────────────────────────────────────────────────────────
TRANSIÇÃO 06: Projeção do Lote → Mapa do Bairro (Recife) & Raio de 150m
─────────────────────────────────────────────────────────────────────────────
FROM STATE:                Lote Urbano isolado em perspectiva
TO STATE:                  Mapa Cartográfico Completo de Boa Viagem (980x600px)
SHARED ELEMENT:            Ponto de localização do edifício (pino pericial vermelho-barro)
GEOMETRIC TRANSFORMATION:  O lote se enquadra na malha ortográfica de Boa Viagem; um anel de raio de 150m se expande do pino
CONTENT TRANSFORMATION:    Surgem as camadas urbanas reais: Rua João Cardoso Aires, Av. Boa Viagem, mar azul e infraestrutura
CAMERA TRANSFORMATION:     Zoom-out fluido e panorâmico para enquadrar a orla e o raio de 150m
TIMING:                    0.60s (mola k=130, d=22)
INTERACTION:               Cursor seleciona a camada "Segurança & Ocorrências", destacando o perímetro limpo
SOUND CUE:                 Expansão de radar sonoro (pulso suave em frequência ascendente)
VISUAL CONTINUITY:         O anel de raio de 150m preserva a espessura da linha do lote (1.5px)
─────────────────────────────────────────────────────────────────────────────
TRANSIÇÃO 07: Mapa do Bairro → Dossiê Pericial Final Completo
─────────────────────────────────────────────────────────────────────────────
FROM STATE:                Mapa Cartográfico com Raio de 150m
TO STATE:                  Dossiê Pericial Final (1100x680px, síntese dos 4 Pilares)
SHARED ELEMENT:            Cabeçalho com o selo oficial e endereço
GEOMETRIC TRANSFORMATION:  O mapa retrai suavemente para o quadrante superior direito; abrem-se as colunas de laudo pericial
CONTENT TRANSFORMATION:    Consolidação completa: Físico (92 m² auditados), Jurídico (Habite-se ok), Urbano (raio 150m calmo), Financeiro (Preço Justo)
CAMERA TRANSFORMATION:     Câmera estabiliza frontalmente, perfeita para leitura e impacto conclusivo
TIMING:                    0.52s (mola k=160, d=24)
INTERACTION:               Cursor assina virtualmente com o carimbo do VEREDA e repousa
SOUND CUE:                 Acorde sutil pericial de resolução e selo definitivo
VISUAL CONTINUITY:         A linha mestra "O Caminho do Veredas" conecta todos os indicadores em um só traçado contínuo
─────────────────────────────────────────────────────────────────────────────
```

---

## 3. Física Matemática do Movimento (Closed-Form Springs)

Para garantir determinismo absoluto em `window.seek(t)`, não utilizamos simulações iterativas baseadas em quadros anteriores. Todo o movimento é calculado a partir do tempo absoluto $t$ em segundos.

### A. Equação da Resposta ao Degrau (Mola Amortecida)
Para uma mola que parte de 0 e converge para 1 com rigidez $k$ e amortecimento $d$:

$$\omega_0 = \sqrt{k}, \quad \zeta = \frac{d}{2\omega_0}$$

No regime subamortecido ($\zeta < 1$), com frequência amortecida $\omega_d = \omega_0 \sqrt{1 - \zeta^2}$:

$$f(t) = 1 - e^{-\zeta \omega_0 t} \left(\cos(\omega_d t) + \frac{\zeta \omega_0}{\omega_d}\sin(\omega_d t)\right) \quad (t \ge 0)$$

### B. Multi-Target Tracking (`track`)
Quando um parâmetro recebe alvos sucessivos nos instantes $t_0, t_1, \dots, t_n$, a posição instantânea é a soma das respostas individuais, preservando continuidade de velocidade e aceleração sem descontinuidades:

$$v(t) = v_0 + \sum_{i=1}^{n} (v_i - v_{i-1}) \cdot f(t - t_i, k, d)$$

### C. Perfis Físicos Especializados do VEREDA

| Elemento | Rigidez ($k$) | Amortecimento ($d$) | Característica Visual | Overshoot Permitido |
| :--- | :-: | :-: | :--- | :-: |
| **Cursor** | 280 | 30 | Rápido, seco, intenção humana imediata | $\le 2\%$ |
| **Botões / Toggles** | 240 | 26 | Tátil, clique mecânico perceptível | $\le 3\%$ |
| **Cards & Containers** | 170 | 24 | Firme, peso de papel encorpado | $\le 5\%$ |
| **Câmera Cinematográfica** | 90 | 18 | Fluida, majestosa, sem vibração | $0\%$ (crítico) |
| **Tipografia de Título** | 220 | 28 | Firme, peso editorial sem tremor | $0\%$ |
| **Mapa & Radares** | 130 | 22 | Espacial, expansão orgânica e deliberada | $\le 4\%$ |

### D. Regras para Troca de Texto em Morfismos
1. **Timing de Entrada e Saída**:
   ```javascript
   // Opacidade calculada para transição sem sobreposição
   function swapAlpha(t, tIn, tOut) {
     return Math.min(
       clamp((t - tIn - 0.08) / 0.12),
       clamp((tOut - 0.10 - t) / 0.10)
     );
   }
   ```
2. **Proibição de `will-change`**: Nunca utilizar `will-change: transform` em containers que contenham tipografia escalada por zoom de câmera, para evitar subpixel rasterization e fontes borradas.
3. **Escalar Conteúdo**: Preferir ajustar dimensões de layout (`width`, `height`, `margin`) ao invés de aplicar `transform: scale()` genérico sobre blocos inteiros de texto.

---

## 4. Roteamento e Narrativa do Cursor

O cursor preto do VEREDA não é um ponteiro passivo — ele é o **investigador pericial**:
- **0:00 - 0:02**: Desliza com autoridade, cola o link de anúncio e aciona `Gerar Dossiê`.
- **0:03 - 0:05**: Move-se diretamente para a discrepância de 18 m², repousando sobre a régua para abrir a auditoria.
- **0:06 - 0:08**: Clica na coordenada oficial para ativar o lote cadastrado na Prefeitura do Recife.
- **0:09 - 0:11**: Desaparece durante o zoom cinematográfico do mapa para dar destaque ao território urbano.
- **0:12 - 0:14**: Reaparece para firmar o selo do Dossiê Pericial e concluir a jornada.

---

## 5. Arquitetura de Apresentação (ENTER → HOLD → EXIT)

Para a apresentação ao vivo no palco do Hackathon:
- **ENTER**: Transição fluida de entrada sincronizada com a fala do apresentador (0.4s a 0.8s).
- **HOLD**: Estado sustentado de visualização interativa com micro-animação respiratória sutil (grid pontilhado vivo, pulso sutil do lote). **O estado HOLD dura indefinidamente** até o próximo comando do apresentador, nunca forçando o palestrante a competir com um cronômetro rígido.
- **EXIT**: Saída limpa sob comando do teclado (Barra de Espaço / Seta Direita), desdobrando-se no próximo ato.
