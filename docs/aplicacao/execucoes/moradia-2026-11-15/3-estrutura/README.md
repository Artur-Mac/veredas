# 3. Estrutura: validar uma linha do tempo documental

**Situação: nenhum caso completo encontrado.** Não há caso com documento ligado a lote e bloco. O modelo da linha do tempo está implementado e testado, mas não vai para a tela até existir um caso ligado ao prédio.

## Fontes verificadas em 15/11/2026

| Fonte | Como se consulta | O que sustenta |
|---|---|---|
| **Diário Oficial do Recife** (dataset CKAN `diario-oficial`) | Desde 2017: um CSV-índice e um ZIP com os PDFs por ano. De 2004 a 2016: CSVs com o texto. O site novo tem uma API pública: lista edições, devolve o PDF assinado e faz busca **dentro de uma edição** (`/api/publico/edicoes/{id}/busca?termo=`). A busca em todas as edições exige reCAPTCHA e não foi usada. | Atos datados com número de decreto, ofício e processo SEI. |
| **Edição 046, de 10/04/2025** (id 274, 36 p.) | PDF baixado e lido. | Não traz ato do Controle Urbano, habite-se, liberação, ART/RRT nem desabamento. Traz três decretos de 09/04/2025 com benefício pago a moradores de imóveis que a Defesa Civil classificou como "Risco Muito Alto (R4)", "implicando na necessidade de desocupação e interdição imediata do imóvel". |
| **Controle Urbano, serviço 1095** | "Solicitar Certidão Narrativa de Controle Urbano" (SECON/SEOPS). Pedido online com login (CPF ou CNPJ e senha); gera protocolo; resposta em 15 dias. A página não informa custo, e o andamento só aparece após o login. | Uma certidão narrativa do lote, pedida pelo titular ou pelo condomínio. |
| **ITEP 2007** (eSIG `BASES_ITEP_EDIF_GRAURISCO`) | 205 polígonos, com DSQFL em 204 e nome do edifício em 110. Bairros: Imbiribeira 82, Várzea 67, Ipsep 41, Jardim São Paulo 8, Areias 4, Ibura 2 e Arruda 1. Nenhum está nas seis áreas do VEREDA. | Só pista histórica. O risco é texto livre, de "médio elevado" a "muito alto". O ano de construção vai até 2017, então parte dos campos vem de outro cadastro. Não usar como estado atual. |

## O melhor caso parcial (sem vínculo a lote)

| Etapa | Situação | Evidência |
|---|---|---|
| Chamado | sem documento | — |
| Vistoria / classificação de risco | indireta | R4 da Defesa Civil, citado no OFÍCIO SEOPS/SEDEC/GGAS/EGAS Nº 006/2025; data da vistoria não publicada |
| Laudo com ART/RRT | sem documento | — |
| Interdição | indireta | determinada pela Defesa Civil, segundo o Decreto 38.682 (DO 046, p. 4) |
| Reparo | sem documento | — |
| Liberação | sem documento | — |

- **Processo:** SEI 22.000741/2025-07.
- **Por que não serve:** é uma casa em área de morro, sem DSQFL nem bloco, e o endereço identifica quem recebeu o benefício. **O endereço não foi copiado.**
- **Outros dois ofícios na mesma edição:** 007/2025 (SEI 22.000753/2025-23) e 009/2025 (SEI 22.000758/2025-56), com o mesmo formato.
- **Como fechar um caso:** consultar o SEI na pesquisa pública e procurar o número do processo nas edições seguintes com a busca por edição.

**Privacidade.** O DO publica nomes e CPF mascarado. O PDF e o texto extraído foram movidos de `docs/` para `.cache/estrutura-2026-11-15/` e não são redistribuídos. O registro guarda só os números de decreto, ofício e processo.

## O que foi implementado

[src/dados/estrutura/linhaDoTempo.ts](../../../../../src/dados/estrutura/linhaDoTempo.ts), com 6 testes em [tests/estrutura-linha-do-tempo.test.ts](../../../../../tests/estrutura-linha-do-tempo.test.ts):
- **Etapas:** chamado, vistoria, laudo com ART/RRT, interdição, reparo e liberação ficam separados.
- **Vínculo:** cada ato precisa de vínculo por lote e bloco, lote ou endereço. Ato que só cita bairro ou rua é descartado e contado.
- **Desabamento:** só com documento ligado ao lote **e** ao bloco.
- **Estado atual:** nunca é afirmado. A frase traz o último ato com data e número e diz "isso não confirma a condição atual do prédio".
- **Checagem que falta:** liberação depois da interdição, laudo depois da vistoria, ou laudo recente depois da liberação.
- **Pergunta ao síndico:** cita os números encontrados e pede vistoria, laudo com ART/RRT, interdição, reparo e liberação com datas. Complementa a pergunta que o guia de visita já faz ("A Defesa Civil já vistoriou o prédio? …", `src/dados/dossie/rua.ts`).

## O que destrava a tela

Um caso em que um ato do DO, da SEDEC ou do Controle Urbano, ou um documento enviado pelo condomínio, cite o **DSQFL ou o endereço e o bloco** de um prédio coberto. As vias:
- **Controle Urbano:** a certidão narrativa do serviço 1095, pedida pelo titular ou pelo condomínio.
- **Condomínio:** o laudo com ART/RRT, que o caderno já aceita como documento (tipos `laudo` e `art_rrt`, com página e trecho).

Com isso, o dossiê mostra a linha do tempo e "último ato … isso não confirma a condição atual", e o guia de visita leva a pergunta ao síndico.
