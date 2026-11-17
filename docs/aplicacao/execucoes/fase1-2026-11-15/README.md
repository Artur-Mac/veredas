# Fase 1: leitura do anúncio e prédio certo (15/11/2026)

Parte do plano em [feedback-2026-11-15-proximos-passos.md](../../feedback-2026-11-15-proximos-passos.md).

## O que mudou para a pessoa

1. **Cartão do anúncio no lugar do checklist.** Quando o link ou o texto trazem dados, a confirmação mostra o anúncio como no portal:
   - fotos do anúncio, sem guardar cópia;
   - modalidade e preço;
   - condomínio e IPTU;
   - área, quartos, banheiros, vagas e andar;
   - edifício, rua e bairro.

   Qualquer linha abre a edição, assim como o "Editar ›" no fim. Sem dado lido, sem bairro ou fora da cobertura, o formulário já aparece aberto; depois de aberto, ele não fecha mais.
2. **O prédio dentro da confirmação.** O Vereda procura o prédio com o que o anúncio trouxe e mostra o mais provável: nome, endereço, andares, ano e os motivos. "É este · gerar o dossiê" confirma direto dali, usando 1 crédito. "Não é este" abre a tela do prédio, com busca e mapa de lotes. Sem pista nenhuma, aparece "Encontrar o prédio".
3. **Preparo do dossiê.** Depois de confirmar, uma tela por cima mostra os passos, conforme as camadas do bairro:
   - cadastro;
   - IPTU, transmissões e obras;
   - caminho a pé;
   - volta à noite;
   - alagamento.

   O aviso fica sempre visível: *"Os dados vêm de bases públicas e do anúncio e podem estar desatualizados ou divergir. O Vereda é uma ferramenta de apoio: não é avaliação, laudo nem garantia. Confira o que importa na visita e nos documentos."* A tela dura o carregamento real das camadas: no mínimo 1,6 s e no máximo 8 s. Na web, levou cerca de 2,2 s.

## Bugs do teste no celular

| Bug | Causa | Correção | Teste |
|---|---|---|---|
| "$undefined, $undefined" no endereço | O ZAP (Next.js) serializa campo vazio como `"$undefined"`, e o extrator o aceitava como rua | `textoDoCampo` descarta marcadores; ao confirmar, rua e número vêm do cadastro | `tests/extrator-nome-fotos.test.ts`, `tests/confirmar-predio.test.ts` |
| IPTU R$ 131–165 no topo e R$ 15 embaixo | O ZAP mostra só "IPTU", e o extrator supunha anual (180 ÷ 12) | O período fica desconhecido; na confirmação, o cadastro do prédio decide (`src/dados/iptuDoAnuncio.ts`): R$ 180 cabe como mensal (o cadastro dá R$ 131) e não como anual. Se nenhum dos dois cabe, continua a confirmar. O que a pessoa digitou nunca muda. | `tests/iptu-do-anuncio.test.ts` (9) |
| Prédio errado sem endereço no anúncio | O nome do edifício só era lido em links da OLX; a área não pesava contra | O nome sai do título, da descrição ou do texto ("Edf. Engenho Torre"). Conectivos são ignorados ("Engenho Torre" = "Engenho da Torre"). Área praticamente igual soma +20; nenhum apartamento a até 15% da área tira 60; uma palavra própria em comum soma +15. | `tests/buscar.test.ts` (82), incluindo o caso da Torre |
| "Às vezes tem que rodar de novo" | Uma falha passageira ao ler a camada virava "não foi possível carregar" de primeira | Até 3 tentativas, com esperas de 0,4 s e 1,2 s. Arquivo que não confere continua falhando, depois da última tentativa. | `tests/camadas.test.ts` |
| "Can't perform a React state update…" | **Não reproduzido** na web (0 avisos no console no fluxo completo) | — | Conferir no celular |

**Caso Engenho Torre.** O Google Maps dá "Edf. Engenho Torre, Rua Horácio Cahu, 52", mas o cadastro não tem o número 52. O cadastro tem:
- **Engenho Capibaribe**, Rua Horácio Cahu, 61: 15 andares, 2018, com **21 apartamentos de 53,18 m²**, exatamente o tamanho do anúncio;
- **Engenho da Torre**, Rua Marquês de Maricá, 140: 10 andares, só apartamentos de 127 m².

Agora o Engenho Capibaribe vem primeiro ("nome parecido", "21 unidades com 53,18 m²"). O Engenho da Torre aparece depois, com "nenhum apartamento perto de 53 m²". **Se o prédio do anúncio é mesmo o do número 61, só você pode confirmar.**

## Verificação

- **Jest:** 74 suítes, 1.626 testes. Os testes da tela de leitura foram atualizados para o cartão; os que protegem cobertura, bairro, R2 e R3 continuam.
- **Typecheck:** limpo.
- **Lint do projeto:** 0 erros e 5 avisos, os mesmos de antes.
- **Testes Node:** 94 de 94.
- **Smoke web:** 50 de 50, sem requisição externa. Os passos de leitura foram atualizados para o cartão. As expectativas de IPTU da compra em Casa Forte mudaram: o R$ 154 sem período agora entra como mensal, decidido pelo cadastro.
- **Render do fluxo novo** ([render.mjs](render.mjs), [render.json](render.json), telas em [telas/](telas/)), a 375 e 360 px:
  - texto do anúncio → cartão → "É este" → preparo com aviso → dossiê, em cerca de 2,2 s;
  - sem checklist, sem "undefined", sem rolagem lateral, sem erros e sem requisição externa.

## O que ainda não está verificado

- **Os 20 anúncios reais** (critério da fase: 17 de 20 no prédio certo em até 2 toques). Não há conjunto autorizado no repositório, e ler o ZAP daqui não é o fluxo do app. **Teste no celular**, com os anúncios que você usou, e me diga quais erraram.
- **Fotos reais do ZAP no celular.** O formato `medias[].url` com `{action}/{width}x{height}` vem da página do ZAP; o teste usa uma reprodução. Se as fotos não aparecerem, me mande o link do anúncio.
- **O aviso de estado do React no celular.**
- **"IPTU não confere".** No caso da Torre, R$ 180 contra a mediana de R$ 131 (37%) continua aparecendo nos Destaques. Tirar divergências do topo é a Fase 2.
