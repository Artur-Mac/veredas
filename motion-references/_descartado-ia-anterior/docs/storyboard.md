# Storyboard Cinematográfico & Roteiro do Pitch — VEREDA

Este documento estabelece o roteiro completo, segundo a segundo, do vídeo e apresentação ao vivo do VEREDA. Integra as técnicas de **One-Shape UI Morphing**, **Cidade Estilizada 3D**, **Tipografia Cinética Editorial** e a narrativa do **Motif do Caminho (The Vereda Path)**.

---

## O Motif Central: "O Caminho do Veredas" (The Vereda Path)

Um único traço vetorial contínuo atravessa todo o filme, transformando seu significado a cada ato:
```
Sublinhado da URL de Anúncio
  └──> Linha de Discrepância na Régua Métrica
         └──> Polígono de Contorno do Lote Urbano
                └──> Anel de Investigação de 150 Metros
                       └──> Rota a Pé até a Praia de Boa Viagem
                              └──> Eixo da Rosa dos Ventos / Insolação
                                     └──> Assinatura e Logotipo do VEREDA
```

---

## Estrutura de Cenas do Pitch

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CENA 01: O Anúncio Perfeito vs. A Realidade Oculta                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Frase do Pitch:        "Todo anúncio de imóvel mente por omissão.           │
│                         Apartamento de luxo em Boa Viagem: fotos impecáveis,│
│                         110 m², vista eterna. Mas a escritura oficial conta │
│                         outra história."                                    │
│ Objetivo Narrativo:    Criar o gancho emocional imediato nos primeiros 3s:  │
│                         o contraste entre a maquiagem comercial e o fato.   │
│ Estado Inicial:        Fotografia editorial estilizada de alto padrão       │
│                         (Ed. Costa Atlântica, Boa Viagem) em tela cheia.    │
│ Estado Final:          A foto é 'descascada' por máscara orgânica, revelando│
│                         a ficha de IPTU e o número "92 m²" em destaque.     │
│ O Que Persiste:        O enquadramento da fachada do edifício.             │
│ Técnica de Referência: Transição de Máscara Orgânica + Kinetic Typography   │
│                         (Inspirada em Ravie Showreel 0:10).                 │
│ Ativo Real VEREDA:     Foto real do anúncio em Boa Viagem (`PROPERTIES[0]`) │
│                         e tipografia Archivo-Bold.                          │
│ Coreografia & Câmera:  Câmera inicia estável e sofre um micro-recuo quando  │
│                         a linha métrica corta a imagem.                     │
│ Tratamento Sonoro:     Trilha com piano sutil; corte com som de papel       │
│                         sendo rasgado/descascado (whoosh seco).             │
│ Tempo de Tela:         0:00 - 0:04 (4 segundos).                            │
│ Estado HOLD (Ao Vivo): Foto estática com a linha pericial pulsando sobre a  │
│                         fachada até o palestrante disparar a transição.     │
│ Complexidade:          Média (Composição vetorial e máscara de corte).      │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CENA 02: O Número Dramático — "R$ 125 MIL"                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Frase do Pitch:        "18 metros quadrados a menos. Em Boa Viagem, isso    │
│                         representa R$ 125 mil pagos por uma área que não    │
│                         existe no cartório."                                │
│ Objetivo Narrativo:    Fixar a dor financeira real auditada pelo VEREDA.    │
│ Estado Inicial:        Linha de corte da cena 01 expande-se horizontalmente.│
│ Estado Final:          Tipografia gigante em serifa de alto impacto         │
│                         "R$ 125 MIL", sustentada por grid técnico pontilhado│
│                         com marcadores `+` e `( . )`.                       │
│ O Que Persiste:        A linha divisória da régua métrica do VEREDA.        │
│ Técnica de Referência: Tipografia Cinética com Halftone Dot Matrix          │
│                         (Ravie 0:11 e Comma 0:14).                          │
│ Ativo Real VEREDA:     Token `--cor-barro` (#8C3D1D), `--cor-fundo`         │
│                         (#F3F4F2) e cálculo da pesquisa qualitativa UFPE.   │
│ Coreografia & Câmera:  Dolly-in assertivo no número central, sem tremor     │
│                         (mola com amortecimento crítico k=220, d=28).       │
│ Tratamento Sonoro:     Batida seca e pesada de bumbo acústico (thump 90Hz). │
│ Tempo de Tela:         0:04 - 0:08 (4 segundos).                            │
│ Estado HOLD (Ao Vivo): Número estático no centro; pontilhado técnico em     │
│                         drift sutil no fundo.                               │
│ Complexidade:          Baixa (Tipografia vetorial precisa e grid puro).     │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CENA 03: O Caos de Dados Públicos → O Scanner VEREDA                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Frase do Pitch:        "Para descobrir isso sozinho, você levaria semanas:  │
│                         Prefeitura, Cartório, Diário Oficial, Tribunal.     │
│                         O VEREDA faz em 4 segundos com um único link."      │
│ Objetivo Narrativo:    Demonstrar a transformação de semanas em segundos.   │
│ Estado Inicial:        Fragmentos de documentos fiscais dispersos flutuando │
│                         em baixa opacidade sobre a tela.                    │
│ Estado Final:          Os fragmentos convergem por gravidade para a barra   │
│                         única de busca `#decoderUrlInput` do VEREDA.        │
│ O Que Persiste:        O cursor preto que centraliza e comanda a ação.      │
│ Técnica de Referência: One-Shape UI Morphing (@twoclipping) + Teclas do     │
│                         vídeo Comma (seven).                                │
│ Ativo Real VEREDA:     Barra de busca real do protótipo `#decoderUrlInput`  │
│                         com o link do Ed. Costa Atlântica colado.           │
│ Coreografia & Câmera:  Câmera faz transição suave de 2.5D para plano frontal│
│                         perfeito sobre a barra de input.                    │
│ Tratamento Sonoro:     Sons mecânicos de digitação rápida em teclado        │
│                         vintage, seguido de clique firme de ativação.       │
│ Tempo de Tela:         0:08 - 0:13 (5 segundos).                            │
│ Estado HOLD (Ao Vivo): Barra de busca pronta com o botão "Gerar Dossiê"     │
│                         pulsando com micro-glow técnico até o clique.       │
│ Complexidade:          Média-Alta (Física de atração e alinhamento).        │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CENA 04: A Demonstração One-Shape (Card → IPTU → Lote → Mapa)               │
├─────────────────────────────────────────────────────────────────────────────┤
│ Frase do Pitch:        "O VEREDA audita a matrícula oficial, projeta os     │
│                         limites exatos do lote na malha da cidade e analisa │
│                         tudo o que acontece em um raio de 150 metros."      │
│ Objetivo Narrativo:    Entregar a mágica do produto sem nenhum corte falso: │
│                         um único container fluindo pelos fatos auditados.   │
│ Estado Inicial:        Card de Resumo do Imóvel (760x420px).                │
│ Estado Final:          Mapa Cartográfico 3D de Boa Viagem com o raio de     │
│                         investigação pericial de 150m ativado.              │
│ O Que Persiste:        O container contínuo que se deforma de card para     │
│                         lote e depois para mapa (princípio One-Shape).      │
│ Técnica de Referência: One-Shape Morphing (@twoclipping) + Cidade           │
│                         Estilizada em Perspectiva (Ravie 0:19).             │
│ Ativo Real VEREDA:     `PROPERTIES[0]`, DSQFL 06.1780.0412.02.0327,         │
│                         polígono real do lote em Boa Viagem e mapa de ruas. │
│ Coreografia & Câmera:  Câmera orbita de frontal para perspectiva oblíqua    │
│                         2.5D quando o lote se ergue, e abre em zoom zenital.│
│ Tratamento Sonoro:     Pulso tecnológico de varredura pericial e radar      │
│                         sonoro suave indicando a expansão do raio.          │
│ Tempo de Tela:         0:13 - 0:24 (11 segundos — coração do produto).      │
│ Estado HOLD (Ao Vivo): O mapa de Boa Viagem permanece interativo no palco:  │
│                         o palestrante pode alternar camadas de segurança.   │
│ Complexidade:          Alta (Interpolação contínua de canvas determinístico)│
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CENA 05: A Caminhabilidade e o Território Urbano                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Frase do Pitch:        "Da porta do prédio até a orla: 420 metros, 6 minutos│
│                         a pé. Sem pontos de alagamento histórico, sem       │
│                         surpresas de zoneamento."                           │
│ Objetivo Narrativo:    Provar o domínio pericial do ambiente urbano real    │
│                         (Recife e seus desafios específicos de drenagem).   │
│ Estado Inicial:        Mapa de 150 metros centralizado no pino do imóvel.   │
│ Estado Final:          Traçado vetorial dinâmico desenhando a rota pedestre │
│                         pela Rua João Cardoso Aires até o mar.              │
│ O Que Persiste:        A linha de caminhabilidade (The Vereda Path).        │
│ Técnica de Referência: Vetores Urbanos Flat + Cidade Isométrica             │
│                         (Ravie 0:34 "Every city has a heartbeat").         │
│ Ativo Real VEREDA:     Cores cartográficas: `--mapa-via` (#FFFFFF),         │
│                         `--mapa-mar` (#D3E3E8), `--cor-barro` (#8C3D1D).    │
│ Coreografia & Câmera:  Pan horizontal suave acompanhando o traçado da rota  │
│                         em direção à praia de Boa Viagem.                   │
│ Tratamento Sonoro:     Som sutil de brisa marinha mesclado com compasso de  │
│                         passos ritmados sobre o asfalto.                    │
│ Tempo de Tela:         0:24 - 0:29 (5 segundos).                            │
│ Estado HOLD (Ao Vivo): Rota desenhada com marcador de tempo "6 min a pé"    │
│                         aguardando comando do apresentador.                 │
│ Complexidade:          Média (Animação de stroke vetorial com dashoffset).  │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CENA 06: O Dossiê Definitivo & Encerramento                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Frase do Pitch:        "VEREDA. A perícia imobiliária que devolve o poder   │
│                         de negociação para quem compra e aluga."            │
│ Objetivo Narrativo:    Assinatura memorável, reforçando a seriedade jurídica│
│                         e o valor inquestionável da ferramenta.             │
│ Estado Inicial:        Síntese dos 4 pilares se agrupando no Dossiê Final.  │
│ Estado Final:          O Dossiê dobra-se elegantemente no selo oficial e no │
│                         logotipo do VEREDA sobre fundo de papel técnico.    │
│ O Que Persiste:        A linha pericial que se fecha no símbolo da marca.   │
│ Técnica de Referência: Fechamento Editorial com Carimbo (Ravie & Comma).    │
│ Ativo Real VEREDA:     Símbolo da marca `docs/kv/simbolo-barro.svg` e       │
│                         logotipo oficial do VEREDA em Archivo-Bold.         │
│ Coreografia & Câmera:  Afastamento solene para o centro da tela.            │
│ Tratamento Sonoro:     Resolução harmônica no piano e som de carimbo pericial│
│                         seco que chancela o término do pitch.               │
│ Tempo de Tela:         0:29 - 0:34 (5 segundos).                            │
│ Estado HOLD (Ao Vivo): Tela final com QR Code para acesso imediato ao mock  │
│                         interativo pelos jurados.                           │
│ Complexidade:          Média.                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```
