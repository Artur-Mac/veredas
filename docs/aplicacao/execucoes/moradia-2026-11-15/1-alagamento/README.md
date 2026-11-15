# 1. Alagamento: histórico e impacto no acesso

Entrega histórica: o VE14 encerrou o modelo de previsão. Executado em 15/11/2026 pelo fluxo normal: `rodar-chuva.mjs` com publicação versionada, pacote do app e teste.

## O que mudou no app ("Se a rua alagar", aba Entorno)

| Antes (VE06) | Agora |
|---|---|
| "Quando ela alaga, **a saída a pé fica comprometida, qualquer que seja o destino**." | Histórico da rua confirmada do prédio, com meses e anos, mais "**Nenhuma dessas fontes diz se a passagem a pé foi bloqueada, nem por quanto tempo**" e a pergunta para a visita. |
| "Se a Av. X **alagar** como em DD/MM, o caminho **passa** de A para B." | "Se um alagamento como o de DD/MM **bloquear a passagem a pé** na Av. X, o caminho **passaria** de A para B." O desvio virou cenário condicional; o registro (atrás do toque) diz "o desvio é um cenário". |
| Desvios abaixo de 3 min eram descartados. | A rua do caminho com registro aparece numa linha ("também há uma rua com alagamento registrado: … (mai/2024). Se ela ficar intransitável, o desvio é de menos de 3 min"). |
| Só "Alagamentos" (via) da Defesa Civil. | Quatro fatos separados: **ocorrência na via**, **imóvel alagado na rua** ("o registro não diz qual imóvel"), **ponto catalogado** pela Prefeitura (com distância e precisão) e **trecho na lista de ruas de alagamento** (2026). **Bloqueio observado**: nenhuma fonte; dito explicitamente. |
| — | Leitura sazonal ("todos os registros com data caíram entre mai e jul") só quando a série sustenta: ≥ 4 datas, em ≥ 2 anos, numa janela de ≤ 5 meses. Nenhum prédio do piloto atinge esse limite hoje, então a frase não aparece. |

Telas renderizadas a 375 e 360 px, sem rolagem lateral, sem erros, sem requisição externa e sem frase de bloqueio. Registro em [../verificacao/render.json](../verificacao/render.json); imagens em [../verificacao/telas/](../verificacao/telas/).

## Cobertura (prédios com ligação forte, 6 áreas)

| Área | Prédios | Histórico da rua (Defesa Civil) | Catálogo eSIG perto da entrada | Só desvio < 3 min | Consequência ≥ 3 min |
|---|---|---|---|---|---|
| Boa Viagem | 1.761 | 61 | 183 | 320 | 175 |
| Casa Forte | 78 | 1 | 5 | 0 | 1 |
| Graças | 285 | 0 | 4 | 6 | 0 |
| Espinheiro | 151 | 6 | 0 | 17 | 12 |
| Madalena | 241 | 0 | 0 | 15 | 26 |
| Torre | 127 | 0 | 0 | 0 | 0 |

Publicação `chuva` ativa: `03c8ce82bc6c5a89`; pacote do app `179a8bc4e317a50c`, formato 3; a anterior `618a026790d52a94` continua disponível para reverter. Relatório completo em [chuva.json](chuva.json).

## Vínculo ambíguo: regra nova

Um registro "Travessa Lemos Torres" casava pelo nome com a "Rua Lemos Torres" (Casa Forte). Tipo de via divergente para via secundária (travessa, beco, vila, passagem, viela) agora fica **fora do histórico** e é contado: **11 registros**. "Avenida × Rua" com o mesmo nome continua valendo: a grafia oficial "Rua Barão de Souza Leão" é a avenida conhecida. Dos 369 registros de "imóvel alagado":
- 102 casaram rua e bairro;
- 59 têm o nome fora do bairro;
- 151 não têm correspondência;
- 6 são ambíguos;
- 51 são lugares nomeados (comunidade, túnel).

Os ambíguos nunca são resolvidos por aproximação.

## Cruzamento com o eSIG (fonte: Prefeitura, camadas consultadas em 14/11/2026; licença de redistribuição não declarada → usado como referência)

**54 pontos de alagamento** (edição do serviço em 25/09/2026):
- **Precisão:** 39 "aproximado" e 15 "interseção". Recorrência, maré e lâmina estão vazios em todos os 54.
- **Vínculo à malha oficial:** 37 vinculados pelo nome no bairro do polígono e posição a até 60 m da rua. Os outros 17:
  - 11 nomes sem correspondência: "Avenida Norte" e "Avenida Sul" (a malha usa outro nome oficial), "Estação Joana Bezerra" e descrições como "e arredores do Mercado Público";
  - 3 nomes que existem só em outro bairro (Av. do Forte: Cordeiro × Torrões);
  - 3 posições longe da rua do nome: Mascarenhas de Moraes a 2,7 e 3,0 km, Jundiaí a 496 m.
- **Bairro:** o bairro da fonte bate com o polígono oficial em 37 dos 54. A fonte usa o bairro popular (por exemplo Nova Descoberta → Casa Amarela/Brejo de Beberibe, Boa Viagem → Pina).
- **Ponto × Defesa Civil:** só **7** dos 37 pontos vinculados têm atendimento de alagamento na mesma rua e bairro em 2014–2024. Catálogo e ocorrência medem coisas diferentes.

**552 trechos** ("Logradouros_Alagamentos_2026", edição do serviço em 08/05/2026; 374 km):
- 545 códigos existem na malha oficial; os 7 que faltam são travessas, uma ponte e duas ruas novas.
- 536 nomes conferem; 9 divergem na grafia.
- 26 trechos estão nas áreas do VEREDA, todos em Boa Viagem.
- O critério da lista não está publicado; por isso o app diz "está na lista de ruas de alagamento da Prefeitura (2026)", sem interpretar.

## G-RAIN: conferência documental (não é revisão humana)

[g-rain-conferencia-2026-11-15.csv](g-rain-conferencia-2026-11-15.csv), gerado por [scripts/conferir-g-rain.mjs](scripts/conferir-g-rain.mjs). As colunas `REVISAO_*` de `g-rain-revisao.csv` continuam vazias e intactas.

| Conferência | Casos (de 38) |
|---|---|
| Rua no catálogo da Prefeitura (trecho ou ponto no mesmo bairro) | 9 |
| Recorrente só no livro (outras datas na mesma rua) | 15 |
| Sem vínculo a rua oficial (túneis, canais, comunidades, ambíguos) | 12 |
| Sem corroboração independente | 2 |

O conjunto tem 2 casos repetidos ("Canal do Guarulhos" e "Canal Santa Rosa" entram duas vezes, por virem de duas seleções). Fica registrado; a seleção é imutável desde o VE16.

**Os 4 registros que geram todas as consequências ≥ 3 min** (a prioridade H1 do NEXT-PROGRAMME):

| Registro | Prédios | No catálogo eSIG? | Outras datas no livro |
|---|---|---|---|
| Av. Barão de Souza Leão, Boa Viagem, 30/06/2023 | 147 | não | **nenhuma**: uma única linha, numa rua longa (1,7 km no bairro) |
| Túnel da Madalena, 25/06/2024 | 25 | não (túnel fora do catálogo) | 15/06/2024 |
| Túnel da Madalena, 15/06/2024 | 25 | não | 25/06/2024 |
| Av. Gov. Agamenon Magalhães, Espinheiro, 24/05/2023 | 1 | não | mesma data no Derby; Derby em 15 e 25/06/2024 |

A consequência que alcança mais dossiês é a menos corroborada. Isso **reforça** o H1: a revisão humana desses 4 vem antes de qualquer expansão. Se a da Barão de Souza Leão não se confirmar, 147 dossiês perdem a linha.

## Atualização do histórico e contexto de chuva e maré

- **Nota técnica do COP sobre 1 a 3/05/2026: não localizada** em busca pública. Só há notícias e releases, não conferidos. O site do COP tem um "Boletim Diário" que não abriu fora do navegador.
- **Defesa Civil 2025:** o arquivo publicado (`defesa-civil-2025.csv`) tem só o cabeçalho e uma linha. O livro continua em 2014–2024.
- **Pedido pronto** ao COP e à CTTU (trecho, data, início e fim da interdição, reabertura, modo afetado) e o teste que cada resposta destrava: [pedido-cop-cttu.md](pedido-cop-cttu.md).
- **APAC:**
  - Boletins diários de 30/04 a 04/05/2026 baixados: total diário por estação, sem hora nem janela.
  - O serviço de monitoramento só guarda o presente.
  - A série por pulso do COP termina em 26/02/2026 e tem um deslocamento de 3 h entre campos (fuso não confirmado).
  - Por isso a chuva **não entrou no app**: a estação e o total existem, mas o horário não está verificado.
- **Maré CHM 2026** (Porto do Recife, UTC−3, metros sobre o nível de redução da carta 902) extraída para 1 a 3/05. Fica como contexto no registro; não entra no app, porque não há referencial vertical comum com a rua.
- **CTTU:** não há boletim aberto de interdição. O único conjunto de ocorrências no CKAN cobre 2015–2016 e não tem trecho nem reabertura.

## Reproduzir

```bash
node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/chuva/rodar-chuva.mjs --relatorio docs/aplicacao/execucoes/moradia-2026-11-15/1-alagamento/chuva.json
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/aplicacao/execucoes/moradia-2026-11-15/1-alagamento/scripts/conferir-g-rain.mjs
```

Testes: `tests/chuva.test.ts` (11, incluindo vínculo ambíguo, dado ausente e frases condicionais) e `scripts/dados/chuva/testes/historico.test.mjs` (4).
