# Execução do lote A

**Status: lote A concluído.** Registro iniciado em 20/10/2026. Escopo: T01, E01 e E04. Diagnóstico original preservado.

## Plano confirmado antes das alterações

| Item | Comportamento confirmado no código atual | Arquivos previstos | Teste de aceite |
|---|---|---|---|
| T01 | A lista é persistida antes de CHAVE_ATIVA; falha do ponteiro rejeita salvar/remover; seleção fora da fila | `src/estado/Analises.tsx`, `tests/persistir-analises.test.ts` | Falhar somente CHAVE_ATIVA depois da lista; conteúdo preservado, sucesso com aviso, reabertura e concorrência coerentes |
| E01 | Área pode qualificar um candidato; corte em oito esconde total; tela seleciona o primeiro e promete garantia | `src/dados/recife/buscar.ts`, contratos de candidato, tela `predio.tsx`, componentes/textos e testes de busca/tela | Só área pede informação; total antes do corte; alternativas e motivos; busca e continuação sem crédito; confirmação deliberada única |
| E04 | Soma já centralizada em `custoMensal`; Salvos destaca preço anunciado; início e comparação usam rótulos diferentes | `src/dados/custos.ts`, cartões de Salvos/Explorar, dossiê/comparação e testes relacionados | Aluguel 2.500 + condomínio 600 = mensal conhecido 3.100, com pendências nas superfícies; compra permanece separada |

Decisão: seleção ativa é preferência recuperável; manter APIs de contexto `Promise<void>` e emitir aviso não bloqueante. Reutilizar soma e cobrança existentes. Sem dependência de contratação, envio externo ou alteração de pagamentos.

## Resultados

### T01 — implementado

- Regressão inicial reproduzida: `salvar` rejeitava com “falha simulada de gravação” quando somente CHAVE_ATIVA falhava, depois da escrita principal.
- Lista, seleção e remoção agora usam a mesma fila. Seleção mantém referência atual para não depender de fechamento antigo do React durante operações concorrentes.
- Falha da preferência é capturada e exposta em aviso não bloqueante; conteúdo já gravado permanece salvo. Falha da lista continua rejeitando antes de mudar a memória.
- Na carga, seleção inexistente/inválida recebe fallback para primeiro item ou `null`; tentativa de reparar a preferência pode falhar sem bloquear caderno íntegro. Seleção de ID inexistente não entra no contexto.
- APIs públicas continuam `Promise<void>`, formato do caderno não mudou. Avisos de quarentena continuam preservados.
- Casos novos: falha seletiva do ponteiro, repetição sem duplicar, reabertura, falha da lista, remoção da ativa, falha de remoção do último ponteiro, concorrência com escrita atrasada e reparação de ID inválido.

### E01 — implementado

- Nova `buscarCandidatosDetalhados` fornece pistas estruturadas (`nome`, `rua`, `numero`, `area`, `ano`), total antes do corte e indicação do limite. `buscarCandidatos` preserva o formato anterior para consumidores existentes.
- Apenas área/ano não abrem confirmação direta: a tela pede endereço/nome, oferece continuar sem identificar e deixa sugestões em lista secundária expansível.
- Contagem real e limite são explícitos. A lista mostra motivos e posição da opção selecionada, sem converter pontos em probabilidade. Busca por endereço e mapa continuam disponíveis.
- Removida promessa de garantia cadastral. A confirmação pede conferência de endereço e informa o uso de crédito.
- Cobrança não foi reimplementada: busca/escolha não debitam, confirmação deliberada usa mecanismo existente. Testes cobrem também saldo zero e continuidade sem vínculo.
- Caso real da base local: a entrada Boa Viagem + 70 m² mostra 106 compatíveis e no máximo oito sugestões, em vez de apresentar automaticamente o primeiro prédio como solução.

### E04 — implementado

- Cálculo continua exclusivamente em `custoMensal`, preservando desconhecido versus zero e preço de compra fora da soma mensal.
- Vocabulário compartilhado: “Mensal conhecido” e “+ valores a confirmar”.
- Aluguel destaca mensal conhecido em Salvos e Explorar; no dossiê/comparação o mensal vem antes do aluguel anunciado. Compra preserva preço anunciado e mensal em campos separados.
- Fixtures em Salvos, Explorar, comparação e dossiê comprovam 2.500 + 600 = 3.100, com IPTU/seguro ausentes. Testes das três primeiras superfícies também mudam condomínio para 800 e conferem atualização para 3.300.
- Testes existentes preservam taxa anual, zero informado, custo desconhecido, arredondamento e compra sem somar preço às despesas.

## Validação executada

| Verificação | Resultado |
|---|---|
| Regressão de T01 antes da correção | Reprovou pelo falso erro da preferência, como esperado |
| Persistência, visita e carteira após T01 | 163 testes passaram naquele estágio |
| Testes focados de busca, telas, custos e dossiê | Passaram; casos novos incorporados ao conjunto completo |
| `npm run verificar` no fechamento das mudanças de produção | Tipos, lint e **32 suítes / 1.280 testes** passaram |
| `npm run test:v1` | **50 etapas**, cada uma a 375×812 e 1280×900; nenhuma requisição externa e nenhum problema apontado pelo auditor |
| Casos adicionais a 360 px | Identificação, dossiê, Salvos e comparação; texto ampliado por aproximação web e busca focada com navegação por teclado |

O primeiro smoke parou na expectativa antiga “É este o prédio?” para busca sem correspondência. A expectativa foi atualizada para a nova solicitação de informação; as verificações de ausência de confirmação e de preservação de crédito permaneceram. Os rótulos financeiros antigos também foram atualizados no roteiro.

Dois avisos React `act` de movimento reduzido nos testes de formulário continuam presentes e registrados no log. São a pendência T03, fora deste lote; não foram silenciados.

## Revisão visual e capturas

Pasta completa: `out/lote-a-2026-10-20/`. O smoke usa contextos isolados, com análises sintéticas e sem tocar o caderno pessoal. O nome longo e custos incompletos foram incluídos no cenário isolado do lote.

Capturas examinadas: identificação normal e sem endereço, alternativas, dossiê de aluguel, Salvos e comparação em larguras de celular/computador; versões de 360 px, busca focada e texto ampliado. Identidade, hierarquia financeira e explicação da ambiguidade foram conferidas visualmente, além dos testes.

A aproximação de texto a 200% revelou cortes no cabeçalho global e sobreposição de rótulos no dock. São áreas existentes fora do lote A; não se declara aprovação completa de acessibilidade com texto ampliado. O teste automatizado de limites da página não detecta todo corte interno ou sobreposição, por isso a inspeção manual permanece necessária.

## Limites e pendências

- Web/Chromium local validado; Android/iOS físicos, leitor de tela nativo, Dynamic Type e teclado virtual não foram executados. A busca focada e Tab na web não substituem teclado de aparelho.
- Ampliação web duplica tamanho/entrelinha de textos renderizados; é uma aproximação que não reproduz todos os limites e comportamentos nativos.
- Offline validado com app já carregado; recarga integral sem servidor continua fora da cobertura da versão web.
- Não houve migração de dados, mudança de preço/cobrança, contratação, envio a terceiros ou publicação. Índice, protótipo raiz, pitch e motion foram preservados.
- Próximos lotes não foram iniciados. A revisão visual dos detalhes ampliados foi concluída: os botões novos quebram em linhas sem perder texto; mensal, valor anunciado e pendências permanecem legíveis nos trechos financeiros. Valores e sufixos podem ocupar linhas separadas na aproximação a 200%. Os limites globais de cabeçalho/dock acima continuam pendentes.


## Evidências preservadas neste pacote

- [Log da verificação completa](evidencias/lote-a-verificar.txt).
- [Log do smoke final](evidencias/lote-a-smoke.txt).
- [Identificação sem endereço — celular](evidencias/capturas-lote-a/45-lote-a-area-sem-endereco-375.png) e [computador](evidencias/capturas-lote-a/45-lote-a-area-sem-endereco-1280.png).
- [Alternativas com motivos](evidencias/capturas-lote-a/46-lote-a-alternativas-375.png).
- [Salvos com mensal de R$ 3.100](evidencias/capturas-lote-a/49-lote-a-salvos-custo-375.png).
- [Busca focada a 360 px](evidencias/capturas-lote-a/lote-a-busca-focada-360.png).
- Texto ampliado a 200%, detalhe após rolagem: [identificação](evidencias/capturas-lote-a/lote-a-area-sem-endereco-detalhe-texto-200-360.png), [dossiê](evidencias/capturas-lote-a/lote-a-dossie-custo-detalhe-texto-200-360.png), [Salvos](evidencias/capturas-lote-a/lote-a-salvos-custo-detalhe-texto-200-360.png) e [comparação](evidencias/capturas-lote-a/lote-a-comparar-custo-detalhe-texto-200-360.png).

As capturas de `out/` podem ser regeneradas com `SMOKE_OUT=out/lote-a-2026-10-20 POC_URL=http://localhost:8102 npm run test:v1`, usando servidor Expo local. A seleção acima foi copiada para este pacote para continuar disponível junto do registro. O servidor desta execução foi encerrado ao final.
