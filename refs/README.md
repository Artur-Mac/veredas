# Biblioteca de referências do pitch

[`references.json`](./references.json) guarda as referências de motion do pitch do VEREDA e a fonte da marca. Foi refeito em 17/10/2026; a versão anterior, descartada, está em `motion-references/_descartado-ia-anterior/refs/`.

## Duas listas

| Lista | O que guarda |
| --- | --- |
| `productSources` | A marca e os dados do produto. Hoje só `PROD-01`, o `index.html` da raiz. Nenhuma referência externa muda paleta, fonte ou componente. |
| `references` | Referências externas (`REF-NN`). Delas sai gramática (ritmo, física, câmera, pipeline), nunca conteúdo ou marca. |

## Como acrescentar uma referência

1. Rode `node refs/validate.mjs`. Ele mostra o próximo id livre.
2. Acrescente um objeto ao fim de `references` com esse id, a URL em `originalUrl`, `accessStatus: "not_inspected"`, `accessLog: []` e `analysis.status: "pending"`. O resto pode ficar vazio.
3. Uma sessão futura procura as entradas com `analysis.status` diferente de `analyzed` e analisa só essas.

Não apague nem reescreva uma entrada analisada. Para corrigir, acrescente um item em `revisions` (`{ "date", "by", "change" }`) e mude só o campo afetado.

## Status de acesso

| `accessStatus` | Quando usar |
| --- | --- |
| `available_inspected` | O vídeo ou a imagem foi baixado ou assistido e decomposto em quadros. Exige `accessLog`. |
| `available_inspected_via_transcript_and_spec` | O material principal não foi visto; o texto integral (post, prompt, artigo, transcrição) foi lido numa URL de apoio. |
| `unavailable` | Nenhuma URL respondeu. Use só o que estiver documentado. |
| `not_inspected` | Registrada, ainda sem inspeção. |

Cada tentativa vai para `accessLog` com data, URL, método e resultado, inclusive as que falharam. `evidenceInspected` diz o que foi lido; `notInspected` diz o que ficou de fora. Nunca escreva que um vídeo foi assistido quando só o texto foi lido.

## Estado em 17/10/2026

| ID | Referência | Autor | Status | Análise |
| --- | --- | --- | --- | --- |
| PROD-01 | Protótipo web, `index.html` | equipe VEREDA | inspecionado (código e capturas) | feita |
| REF-01 | Showreel de 5 anos da Ravie | Ravie | vídeo enviado pelo usuário, decomposto | feita |
| REF-02 | "Comma" motion graphics | seven (a confirmar) | vídeo enviado pelo usuário, decomposto | feita |
| REF-07 | One-shape UI morph (template de prompt) | zero, @twoclipping | texto lido e vídeo decomposto | feita |
| REF-08 | Motion design studio workflow (artigo) | Movez, @0xMovez | lido por texto (figuras não vistas) | feita |
| REF-09 | Captura avulsa: "new" em meio-tom | desconhecido | só a imagem | feita |
| REF-10 | Par de fotos da mesma sala (ajuste de imagem) | desconhecido, enviado pelo usuário | as duas fotos | feita |

Os ids REF-03 a REF-06 não aparecem em nenhum arquivo do repositório. Se essas referências existirem, acrescente as URLs com os próprios ids.

Quadros e folhas de contato de cada referência ficam em `motion-references/contact-sheets/refs/<ID>/`. Os vídeos ficam fora do repositório.
