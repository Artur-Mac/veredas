# 2. CoolWalk: piloto em Graças e Espinheiro

Simulação reproduzível, sem observação de campo. **A rota não entra no app**: nenhuma preferência sobreviveu a todas as variantes, e a regra exige observação de campo antes. O experimento do VE07 (`sombra-nos-caminhos.mjs`) ficou intacto; o piloto é um script próprio que reaproveita a rede, os volumes solares, o raio e a astronomia: [sombra-piloto-gracas-espinheiro.mjs](../../../../../scripts/dados/sol/sombra-piloto-gracas-espinheiro.mjs).

## Fontes

| Fonte | Data e licença | Unidade e cobertura | Uso |
|---|---|---|---|
| Censo Arbóreo 2023 (dados.recife) | metadados de 02/03/2026; ODbL | 259.575 pontos; 44.869 no entorno do piloto | Posição das árvores. Copa preenchida em 11.488 (4%) e altura em 12.390; no entorno, 7.439 com copa. A origem dominante é **ARB2007** (36.002 das 44.869): é o inventário de 2007. |
| Podas e erradicações 2023 | ODbL | Endereço textual, sem coordenada | Não entram na simulação. Nas ruas do roteiro: 12 podas e 13 erradicações em 2023 (contagem por nome de rua, aproximada). |
| Calçadas 2023 (obras de requalificação) | ODbL | 129 trechos com situação | Contexto. Concluídas: Cons. Portela, Dr. José Maria, Quarenta e Oito, Rui Barbosa, entre outras. A largura não é publicada para essas ruas. |
| Volumes do cadastro (recortes solares) | mesmos hashes do VE07/VE16 | 6 áreas | Sombra de prédios, com alturas mínima e máxima e 20% dos volumes retirados. |
| Marquises e toldos | — | nenhuma base verificável | Só na observação de campo. |

Manifesto dos downloads: [sombra-2026-11-15/manifest.json](../../../../dados/raw/sombra-2026-11-15/manifest.json). O censo tem 307 MB e fica em `docs/dados/raw/sombra-2026-11-15/`. Os campos de nome de usuário de edição, nome e CNPJ do requerente das podas não são usados.

## Desenho

- **Pares:** 6 prédios com ligação forte por área (ordem do SHA-256). Destino real mais perto de cada tipo: supermercado (OSM/municipal), **mercado público** (CONVIVA), **feira** (CONVIVA, com dias e horário) e **parada** (GTFS). Faixa de distância: 250–1.500 m; 100 m para a parada. São **34 pares** (8 supermercados, 9 mercados públicos, 11 feiras e 6 paradas).
- **Horários:** 6 por par, a mesma hora para os dois caminhos: 21/12, 20/03 e 21/06, às 9h e às 15h. Total: **204 comparações**.
- **Alternativa:** a de menos sol dentro de **+15%** de distância, construída no cenário central (prédios na faixa, árvores pequenas, eixo da via).
- **72 variantes por comparação:**
  - árvores ausentes, pequenas (raio 2 m, copa de 2,5 a 6 m) ou grandes (raio 4,5 m, copa de 3 a 11 m), porque a copa não é medida;
  - lado da via: eixo, calçada mais sombreada ou calçada menos sombreada (±7 m do eixo);
  - alturas dos prédios: na faixa, mínima, máxima, ou com 20% dos volumes retirados.
- **Regra:** "alternativa robusta" só se ganhar em **todas** as variantes e o ganho mínimo for ≥ 2× os minutos extras.

## Resultado

| Estado | Comparações |
|---|---|
| Sem alternativa útil (mesmo caminho ou ganho < 0,5 min) | 158 |
| Ganho pequeno (ganha em todas as variantes, mas menos que 2× o desvio) | 22 |
| Inconclusivo (a preferência troca entre variantes) | 24 |
| **Alternativa robusta** | **0** |

- Nas 46 comparações com alternativa, o ganho central vai de **0,5 a 4,6 min de sol** (mediana 1,4), para **0,2 a 2,8 min a mais** de caminhada (mediana 0,8). A faixa do ganho entre variantes vai de −0,7 a 6,4 min.
- **Dimensões ausentes:** trocar árvores ausentes por grandes inverte a preferência em **3** das 46 comparações. Com o cadastro de 2007 e as copas presumidas, as árvores mudam pouco o resultado; mas, como as copas não são medidas, esse "pouco" também não está verificado.
- **Dois lados da via:** a preferência inverte entre a calçada mais e a menos sombreada em **14** das 46. **O lado da calçada pesa mais que as árvores**, e a rede, que só conhece o eixo da rua, não decide isso.
- **Paradas:** 0 de 36 comparações têm alternativa útil. O caminho até o ponto é curto demais para um desvio de 15% mudar algo.
- **Feiras e mercados públicos:** concentram 39 das 46 comparações com alternativa, por terem caminhos mais longos.
- Comparado ao VE07 (sem árvores e sem lados, 6 de 80 "estáveis"): o piloto mais rico não produz preferência robusta. O ganho é da ordem de 1 min, abaixo da incerteza do lado da calçada.

Arquivos: [sombra-piloto.json](sombra-piloto.json) (todas as comparações e a faixa do ganho), [casos.csv](casos.csv) (as 46 comparações com alternativa e os trechos que diferem) e [roteiro-observacao.csv](roteiro-observacao.csv).

## Roteiro de observação para a equipe

[roteiro-observacao.csv](roteiro-observacao.csv): os **15 trechos** que decidem mais comparações, por horário. Cada linha diz o que observar e tem colunas `OBS_*` vazias para preencher. Os trechos que mais pesam são:
- Rua Conselheiro Portela às 9h (17 casos);
- Av. João de Barros às 9h (15);
- Av. Norte às 9h (13);
- Rua Dr. José Maria às 9h (10);
- os mesmos eixos às 15h.

Em cada trecho, observar:
- sol ou sombra em **cada lado** da calçada (par e ímpar), no horário indicado;
- as copas sobre a calçada (contar e estimar o raio);
- marquises e toldos contínuos.

Basta uma ida por horário (9h e 15h), em qualquer dia de céu aberto. As datas de referência só servem para a geometria do sol e podem ser substituídas pela data da ida: o script recalcula com `CENARIOS`.

**O que a observação destrava.** Com os lados e as copas observados nesses 15 trechos, a variante "lado" deixa de ser incerta. Se, depois disso, alguma comparação ficar robusta, a rota pode entrar no dossiê como "caminho com mais sombra às 9h: +N min a pé, −M min ao sol", com a data da observação.

## Reproduzir

```bash
node --max-old-space-size=10000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/sol/sombra-piloto-gracas-espinheiro.mjs
```

Leva 147 s e usa 1,8 GB de memória. A rede, os essenciais e os recortes têm versão e hash registrados no relatório.
