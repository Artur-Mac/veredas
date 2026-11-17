# CRIVO — o que vale e o que não vale para o Vereda

> Regras de seleção de dados minerados. Cada dado que entra em `processado/`
> passou aqui. Regra geral: **fato com fonte e data, nunca adjetivo.**

## 1. O dado responde a uma pergunta real?

O dado só entra se responde a uma pergunta que quem procura apartamento faz:

| Pergunta | Dados que valem | Dados que NÃO valem |
|---|---|---|
| "A rua alaga?" | Ponto crítico catalogado (Emlurb) + situação da obra + data | "Rua que alaga" sem fonte |
| "É barulhento?" | Dá para medir no cone de ruído do aeroporto, LUSE (bar a 150 m), obra em andamento | "Bairro movimentado" |
| "Quanto custa de verdade?" | Preço anunciado (Oleo), leilão que fechou, FipeZAP m² | "Preço justo" sem base |
| "O prédio está bem?" | ITBI (histórico de transação), IPTU em dia, alvará recente | "Prédio bem conservado" (isso é visita) |
| "Tem transporte?" | Linhas GTFS a 400 m + frequência no pico | "Próximo ao metrô" sem distância |
| "Tem saúde/educação?" | CNES (unidade a X m), Ideb da escola pública mais próxima | "Bairro estruturado" |

## 2. A fonte é aberta e a licença permite?

- **ODbL, CC-BY, MIT, domínio público** → entra com aviso de origem.
- **Não declarada** → entra como "referência", nunca como fato único. Marcar `status: nao_licenciada` em `fontes/fontes.json`.
- **CC BY-ND** → precisa de parecer antes de derivar (recorte por prédio é derivação).
- **Direitos reservados (Fipe, OSM parcial)** → citar número com fonte é diferente de reproduzir a série. Marcar `status: pendente_parecer`.

## 3. A data está visível e honesta?

- Toda linha em `processado/` carrega `fonte`, `consultado_em` e (quando a fonte tem) `atualizado_em`.
- Se a data denuncia defasagem (alagamento 2022, Defesa Civil 2024), **mostrar a data** — ela faz parte do fato.
- Nunca arredondar data para parecer mais fresca.

## 4. O dado é georreferenciado ou geocodificável?

- Ideal: coordenada (lat, lng) + DSQFL (lote).
- Aceitável: endereço completo → geocodificar pelo CNEFE.
- Fora: CEP só (muito grosso), "próximo a X" sem distância.

## 5. Não é dado pessoal?

Lista branca (o que **não** ingerir mesmo que venha junto):
- CNPJ de sócios (nomes de pessoas)
- Profissionais do CNES
- Camada de ligações da Compesa (endereço + valor da conta)
- Complemento de endereço do CNEFE
- Campos de edição do ArcGIS (usuário, data de edição)

## 6. O dado é agregável por prédio (DSQFL)?

O ganho do Vereda é a resolução **anúncio → prédio → DSQFL**. Um dado que só
funciona por CEP ou por bairro perde metade do valor. Priorizar:
1. Dados com DSQFL nativo (Lotes, IPTU, LUSE, ITEP)
2. Dados com coordenada (cruzável com o polígono do lote)
3. Dados com endereço (geocodificável via CNEFE)
4. Dados por bairro/CEP (último recurso)

## 7. O dado sobrevive ao teste do "e daí?"

Antes de processar, perguntar: se eu mostrar esse número na tela do app,
a pessoa muda a decisão de visita? Se a resposta é "não", fica em `raw/`
como contexto, não vira linha de dossiê.

**Exemplos que passam:**
- "Ponto crítico de alagamento a 120 m, obra concluída em 2019" → muda a pergunta na visita
- "3 linhas de ônibus a 400 m, próxima a cada 12 min no pico" → muda a rotina
- "Prédio a 2,3 km do cone de ruído da pista 26R" → muda a percepção de barulho

**Exemplos que ficam de fora:**
- "Bairro com 450 mil habitantes" → contexto, não decisão
- "312 empresas ativas no CNAE X" → contexto econômico, não decisão de moradia
- "IDEB do bairro: 5.2" → o Ideb é por escola, não por bairro (erro comum)

## 8. Regras de saída (formato em `processado/`)

Cada arquivo em `processado/` é JSON ou CSV com:
- `fonte`: id da fonte (ver `fontes/fontes.json`)
- `consultado_em`: ISO 8601
- `atualizado_em`: se a fonte tem, senão `null`
- `granularidade`: `lote` | `endereco` | `coordenada` | `bairro`
- `dsqfl`: se houver
- `evidencia`: a frase que vai na tela (máx. 120 chars, fato com data)
- `confianca`: `alta` | `media` | `baixa` (baixa = fonte não licenciada ou defasada)

Arquivos por tema:
- `processado/ruido-aeroporto.json` — prédios no cone + distância
- `processado/alagamento.json` — pontos críticos por lote
- `processado/transporte.json` — linhas/paradas por prédio
- `processado/precos.json` — FipeZAP + leilões + anúncios por bairro
- `processado/entorno.json` — saúde, escola, comércio por prédio
- `processado/condominio.json` — ITBI, IPTU, dívida ativa por CNPJ
- `processado/pesquisa.json` — papers citáveis (título, ano, achado)
