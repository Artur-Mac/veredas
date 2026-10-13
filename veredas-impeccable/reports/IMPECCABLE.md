# VEREDA — comparação antes e depois

## Acessos

- Original, preservado: http://localhost:8080
- Versão refinada: http://localhost:8081
- Comparação lado a lado: http://localhost:8081/compare.html

A nova versão está em `veredas-impeccable/`. O `index.html` original não foi alterado; confirmado com `git diff --exit-code -- index.html`. Os servidores são processos independentes.

## Fonte e aplicação

Skill oficial: https://github.com/pbakaus/impeccable — versão 4.5.2, consultada em 13/10/2026. Cópia local em `.agents/skills/impeccable/`. Motor oficial 0.1.14 em `.impeccable/bin/impeccable.exe`, baixado com SHA-256 conferido contra o arquivo da release.

O carregador de contexto falhou ao tentar usar o cache global fora da área permitida. Foram lidos diretamente o README, a especificação de marca, a implementação e os playbooks pertinentes. O motor foi instalado dentro da cópia e o detector executou normalmente. Não foram ativados hooks globais nem plugins na conta do usuário. A skill local pode ser descoberta em um próximo turno aberto nesta pasta.

As skills são instruções de trabalho, não uma série de comandos que se deve executar indiscriminadamente. Foram escolhidas as orientações que se aplicam ao produto:

| Orientação | Aplicação nesta versão |
| --- | --- |
| audit | Diagnóstico de contraste, tamanhos, estrutura, zoom e comportamentos; detector oficial antes/depois. |
| typeset | Hierarquia de títulos, prosa principal a 16px, texto de apoio maior e cores de leitura mais contrastantes. Famílias originais preservadas. |
| layout | Abertura e formulário em duas colunas no desktop; listas separadas por linhas; remoção da moldura e da grade decorativa. |
| adapt | Coluna única no celular, navegação inferior, áreas de toque maiores, zoom e impressão. |
| clarify | Rótulo persistente, ajuda junto ao campo, mensagem de erro com recuperação, demonstração identificada. |
| harden | Validação de URL, navegação por teclado, foco em diálogos, Escape, persistência local do checklist e cópia real com alternativa quando negada. |
| document | PRODUCT.md e DESIGN.md registram propósito, limites e identidade visual. |
| polish | Revisão final dos fluxos e correções de inconsistências funcionais. |

Não se aplicaram modos opostos simultaneamente, como bolder e quieter, nem overdrive, geração de imagens ou efeitos sem necessidade. Não houve medição de Web Vitals; portanto, não se afirma ganho de desempenho medido.

## Problemas do original e resultado

| Prioridade | Evidência original | Resultado |
| --- | --- | --- |
| P0 | `copyWhatsAppPayload` apenas mudava o texto do botão | Usa Clipboard API; mostra alternativa manual quando a permissão é negada. |
| P1 | `viewProperty` ignorava a alternativa escolhida | Pauliceia abre resumo próprio, com limitação do dossiê explícita. |
| P1 | Controles em div/span sem acesso por teclado | Papéis, foco, Enter/Espaço e indicação de página atual. |
| P1 | Zoom proibido e textos muito pequenos | Zoom permitido; textos de interface ampliados e escala revista. |
| P1 | Textos laranja/brancos com contraste baixo | Separação entre laranja de superfície e tom escuro para texto; botões laranja com texto escuro. |
| P1 | Diálogos sem gestão de foco | Nome acessível, foco contido, Escape, fundo inerte e retorno ao acionador. |
| P2 | Moldura fixa de 414 × 880px | Layout fluido, com adaptação a desktop e celular. |
| P2 | Qualquer entrada acionava a demonstração | URLs inválidas/sem protocolo têm erro próximo ao campo; exemplo acessível. |

Pontos preservados: identidade editorial, português brasileiro, comparação sem pontuação arbitrária e organização de achados por impacto e ação.

## Detector oficial

Na comparação estática sem o contexto novo de DESIGN.md, o detector passou de **151 achados para 1**. Os números são contagens de avisos, não uma nota de qualidade ou certificação de acessibilidade. O aviso restante é `overused-font`, relativo a Plus Jakarta Sans, mantida porque integra a marca existente.

- `detector-before.json`: execução no original.
- `detector-after-comparable.json`: execução na nova versão com `--no-design-system`, para comparar as mesmas regras do original, que não tinha DESIGN.md.
- `detector-after.json`: execução com o novo DESIGN.md. Também revela valores de cor/raio legados ainda não consolidados na escala documentada. Esse débito permanece explícito; não foi ocultado por regras de exclusão.

O detector estático pode reportar declarações antigas que a folha de refinamento substitui. A revisão visual no navegador ainda é necessária para confirmar contraste computado, quebras e transbordamento em todos os tamanhos.

## Validação e limites

**15 verificações de comportamento passaram**, registradas em `behavior-tests.json`: IDs, zoom, erros de URL, exemplo, transição ao dossiê, alternativa correta, cinco destinos de navegação, nome/foco de diálogo, ciclo de Tab, cópia real através de uma API simulada, Escape, persistência de checklist e recuperação da permissão de cópia negada. Execução com jsdom; não equivale a interação em navegador real.

JavaScript passou em `node --check`. Original, nova versão e página de comparação responderam HTTP 200.

A tentativa de captura em Chrome/Chromium headless falhou neste ambiente: `spawn EPERM`, erro de acesso do Crashpad e conexão de depuração indisponível. **Não houve validação visual automatizada, captura antes/depois, teste em aparelho físico, Safari, leitor de tela ou medição de Web Vitals.** Não se atribui uma nota final de auditoria que dependa dessas evidências.

Os dados continuam sendo os exemplos do repositório, sem integração real. A composição financeira original contém itens que não reconciliam completamente com o total; os valores foram preservados e precisam de validação de produto antes de uso real.

## Rodar novamente

Na pasta original: `python -m http.server 8080 --bind 127.0.0.1`

Na nova pasta: `python -m http.server 8081 --bind 127.0.0.1` ou `./start.ps1`.

Detector na nova pasta: `./.impeccable/bin/impeccable.exe detect --json index.html`.

Os servidores já iniciados permanecem ativos nesta sessão; os comandos acima servem para reiniciá-los posteriormente.
