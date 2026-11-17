# 01 — Produto, Tese Pós-Pivô e Estado Atual

**Última atualização da base:** 14/11/2026 (até época `VE15`, com `VE16` em andamento em `../veredas/`).

---

## 1. O que é o VEREDA hoje (após o pivô de 11–14/11/2026)

**Declaração de produto:** ajudar quem busca alugar ou comprar moradia a decidir **qual imóvel visitar primeiro, por quê, qual dúvida muda a escolha, o que negociar e onde mais procurar**, cruzando os imóveis salvos pela pessoa com vínculos verificados entre prédio, entradas, ruas caminháveis, horários reais de transporte, episódios datados e mudanças desde que o imóvel foi salvo.

### O que mudou no pivô
- **Antes (outubro de 2026):** produto centrado em "cole o link de um anúncio e receba um dossiê pericial automático" com ênfase em detecção de anomalias, promessas amplas de IA/sensores no modo visita e monetização imediata por relatório avulso.
- **Depois (11–14 de novembro de 2026):** a unidade de valor deixa de ser o dossiê isolado e passa a ser a **Comparação com base na rotina real** (*"A Comparação como centro"*). O aplicativo funciona a partir de anúncios já importados pela própria pessoa (WebView deliberada no aparelho ou entrada manual), sem exigir conta obrigatória, upload de documentos, permissões de sensores nem formulários longos.

### Princípios operacionais (`CRIVO` + `VE01–VE15`)
- **Fato com fonte e data, zero adjetivo e zero nota:** nenhum prédio recebe pontuação de "qualidade de vida", "risco climático" ou "segurança".
- **Desconhecido ≠ zero:** taxas omitidas (como condomínio ou IPTU sem periodicidade declarada) permanecem como faixa numérica e entram no cálculo de ponto de empate — nunca são zeradas silenciosamente.
- **Consistência entre telas:** Destaques, Entorno, Edifício, Comparar e roteiro de visita leem a mesma projeção de decisão.
- **Privacidade local por padrão:** rotina, destinos pessoais, caderno de imóveis, notas e snapshots ficam salvos no dispositivo do usuário.

---

## 2. O que já existe construído e testado hoje (Engenharia Web até VE15)

*Observação de rigor: todas as entregas abaixo passaram por testes unitários/pipeline (`Jest` 67 suítes / 1.569 testes na época VE15), smoke test web de 50 passos e renderização em `360 px` / `375 px` sem requisições externas inesperadas. Ainda não passaram por validação em smartphone físico nem por teste moderado com pessoas.*

| Bloco / Capacidade | O que faz concretamente para o usuário | Cobertura e limites declarados hoje |
|---|---|---|
| **Base cadastral e vínculo anúncio → prédio (`DSQFL`)** | Sugere e vincula o anúncio ao lote/edifício oficial; mostra área, padrão e IPTU cadastrado (sem expor CPF, unidade ou proprietário). | `7.206` prédios em 72 bairros do Recife; **piloto concentrado em `2.688` prédios** (Boa Viagem, Casa Forte, Graças, Espinheiro, Madalena). |
| **Comparar — *"Para decidir"* (`VE01`, `VE11`)** | Alterna *"Menor custo / Mais espaço"* sem gravar perfil; mostra até 3 diferenças materiais, trade-off **Custo × Tempo** (R$/hora poupada), empate para compra (meses até taxa maior anular preço menor) e **Onde mais procurar**. | Tabela pré-calculada de `261` ruas × `94` bairros (`97 KB`) mantendo o limite de tempo ao destino; informa que não cobre preço nem anúncios disponíveis. |
| **Pergunta decisiva interativa (`VE15`)** | Exibe a pergunta faltante que pode inverter o ranking de visita (ex.: condomínio desconhecido). Em *"Já tem a resposta?"*, digitar o valor recalcula na hora e diz qual imóvel passou à frente. | Testado em browser web `360/375 px`; rolagem automática pós-resposta implementada só na web (nativo sem teste de aparelho). |
| **Essenciais a pé e Plano B independente (`VE03`, `VE04`)** | Calcula caminhada pela **rede pedonal real** (`273.529` nós, `300.703` arestas) até mercado, farmácia, praça e parada; aponta ponte como gargalo e entrega **Plano B que não cruza a mesma ponte**, além de roteiro combinado. | Restrito a prédios com vínculo forte de entrada no piloto. Catálogo tem `7.272` pontos no total, mas **apenas `48` mercados e `53` farmácias mapeados no piloto** (exibe como "mais próximo mapeado"). Entradas de porta e `8` vias sem tag de ponte aguardam revisão humana. |
| **Rotina por horário real (`VE05`)** | Roda roteador **GTFS no dispositivo** (`v2026.10.26`, `87.678` viagens compactadas em `2,9 MB` / `0,76 MB` gzip) para dia útil 7–8h, retorno 18–19h, sábado 9–10h e volta noturna 22–23h, incluindo último ônibus útil e feriados. | Usa horário programado oficial; **não** há feed em tempo real de GPS dos ônibus no Recife. |
| **Histórico de chuva no acesso (`VE06`, `VE13`)** | Ledger da Defesa Civil `2014–2024` (`1.645` registros → `763` observações → `31` episódios datados) ligado ao grafo. Exibe impacto concreto se a alteração no caminho a pé passar de 3 min (ex.: `6 min → 13 min` por rota alternativa). | Consequência material aparece em `175` prédios de Boa Viagem, `26` Madalena, `12` Espinheiro e `1` Casa Forte. `176` nomes de rua ainda sem vínculo; fila de revisão ranqueada (`VE13`) pronta (`3` revisões cobrem `845` unidades de impacto). |
| **O sol nas fachadas (`VE07`)** | Usa volumes 3D municipais nos 5 bairros (Madalena adicionada com `15.701` volumes) para contrastar lado norte/sul/leste/oeste no verão e no inverno e recomendar o melhor horário de visita. | Não estima temperatura interna do apartamento nem assume qual fachada é a da unidade sem o usuário informar. |
| **Volta à noite e lado do ruído (`VE08`)** | Mostra parada noturna `22h–2h` (e linhas da madrugada), travessias de via arterial estimadas, luminárias instaladas vs. chamados em aberto no 156, sinistros CTTU `2022–2024` na rua, proximidade a via principal e licenças sonoras `LUSE` em `150 m`. | Sem nota de crime ou ruído em dB estimados; sinistros CTTU não trazem hora do dia; travessias baseadas em interseções (`2.919` faixas mapeadas na cidade). |
| **Memória e Negociação (`VE09`, `VE10`)** | *"Desde que você guardou"* aponta aumento de taxa/preço, novo alvará em `150 m` ou ocorrência nova (isolando correções cadastrais). *"Preparar a negociação"* compara preço/m² anunciado dentro **da amostra do próprio usuário**, traz ITBI fiscal separado, detecta possível duplicidade de apartamento e monta mensagem editável. | Sem faixas externas de mercado no app hoje por falta de fonte deduplicada e autorizada de ofertas. |
| **Performance e Split de Payload (`VE12 / D036`)** | Dividiu os dados monolíticos em **99 arquivos sob demanda** (`27,6 MB` bruto / `6,5 MB` gzip). Bundle JS web caiu de **`30,08 MB` (`7,30 MB` gzip) para `3,45 MB` (`0,94 MB` gzip)**. | Início utilizável caiu de `697 ms → 265 ms` (CPU 1×) e `1.952 ms → 931 ms` (CPU 4×) em desktop. Fluxo nativo offline e Service Worker entre versões não testados em telefone físico. |

---

## 3. O que foi cortado, corrigido ou rejeitado (Decisões com evidência)

Para que nenhuma skill ou análise proponha novamente caminhos já invalidados:

1. **Modelo preditivo (ML) de alagamento rejeitado (`VE14`):** regressão logística testada contra temporais de 2024 acertou `7` de `17` ruas no top 50, perdendo para a regra simples "ruas com registro anterior" (`8/50`). A complexidade foi descartada por falta de modelo de terreno sem edificações (`bare-earth`), drenagem completa e série chuva/maré rotulada. Outras 6 famílias de ML (valoração, calor/ventilação, ruído/ar, confiabilidade de ônibus, efeito de obras) foram adiadas por falta de rótulos locais.
2. **Rota sombreada a pé mantida fora do app (`VE07`):** experimento em 80 cenários contra `57.851` volumes só manteve vantagem robusta em `6/80` casos (`1–3,6 min` menos sol por `13–43 m` extras) — abaixo da incerteza por ausência de copas de árvores e marquises.
3. **Google Earth pago descartado (`14/11`):** planos de US$ 75–150/mês impõem restrições de exportação/KML; o VEREDA segue com bases 3D abertas locais.
4. **Selo de 5G por edifício descartado (`14/11`):** consulta na Anatel Mosaico em 48 pontos do Recife colocou **48/48** na mesma faixa (`-90/-110 dBm`), sem poder algum para distinguir um prédio de outro.
5. **Contagens legadas corrigidas:** removida a métrica de GTFS que somava útil+sábado+domingo (`2,42×` superestimada; `146` paradas "de corredor" não tinham ônibus útil), corrigidas planilhas deslocadas de 2020/2022 da Defesa Civil, isolados `41%` de registros de campanha porta a porta (`18.820` linhas em Rua Salgueiro/etc.) e removida a antiga mistura de furto em "crime violento".

---

## 4. Lacunas abertas que determinam os próximos marcos de negócio

1. **Validação com pessoas reais (`G-USER`):** zero sessões moderadas realizadas após o pivô (planejado: 8–12 pessoas em busca ativa de compra/aluguel).
2. **Aparelho nativo físico:** aplicativo e split de payload precisam ser medidos em smartphone Android/iOS de entrada, não apenas em Chromium desktop.
3. **Revisão humana das planilhas (`G-BUILDING`, `G-ROUTE`, `G-POI`, `G-TRANSIT`, `G-RAIN`, `G-EXTRACT`):** todas prontas na pasta de engenharia, ainda sem revisão humana concluída.
4. **Fontes externas permitidas de oferta e fechamento:** sem feed/parceria autorizada (XML de imobiliária ou base contratada como aluguel pago do Censo 2022), o app não exibe faixas externas de mercado.
5. **Economia operacional de atualização (`VE16` em execução):** medir tempo humano e custo real para manter e expandir além dos 5 bairros (Torre em verificação), superando a antiga premissa ingênua de "centavos por dossiê".

---
*Fontes de origem em `../veredas/`: `docs/aplicacao/VEREDA-APPLICATION-PLAN.md`, `docs/aplicacao/EPOCH-TRACKER.md`, `docs/aplicacao/execucoes/VE00–VE15/summary.md`, `docs/aplicacao/execucoes/VE12/payload-split.md`, `docs/dados/crivo/CRIVO.md`, `docs/dados/literatura/parecer-tecnico-integrado.md`, `docs/produto/*-2026-11-14.md`.*
