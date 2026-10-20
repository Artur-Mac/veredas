# VEREDA: pesquisa de produto verificada (20/10/2026)

Seis documentos de produto feitos a partir de uma pesquisa na internet com verificação independente das fontes. Complementam o [dossiê de evolução que já existia](../2026-10-20/README.md) (PRD, preços, validação, estratégia de 90 dias): onde aquele dossiê já resolve, estes remetem a ele; onde a pesquisa trouxe fato novo ou corrigiu algo, está dito.

## Documentos

| # | Documento | Responde |
|---|---|---|
| 01 | [Dados públicos que o VEREDA ainda não usa](01-DADOS-PUBLICOS.md) | Que bases abertas respondem "a rua alaga?", "tem ônibus?", "falta água?", "é barulhento?", "o condomínio deve?", com licença e esforço |
| 02 | [APIs pagas e fornecedores](02-APIS-E-FORNECEDORES.md) | O que usar, testar ou descartar, com preço e termos oficiais |
| 03 | [Concorrentes e soluções próximas](03-CONCORRENTES.md) | Quem faz algo parecido no Brasil e fora, e o que o VEREDA aprende |
| 04 | [Mercado, regulação, modelo de negócio e fomento](04-MERCADO-REGULACAO-E-FOMENTO.md) | Tamanho do público, limites legais, âncoras de preço, editais com prazo |
| 05 | [Roadmap das próximas versões](05-ROADMAP-PROXIMAS-VERSOES.md) | v1.1, v1.2 e v2, em ordem e com condição de pronto |
| 06 | [Plano estratégico](06-PLANO-ESTRATEGICO.md) | Tese, público, receita, vantagem, riscos, marcos e decisões da equipe |
| — | [Anexo: pesquisa verificada (JSON)](anexo-pesquisa-verificada.json) | Todos os itens, com trechos e URLs |

## Método

Cinco pesquisadores trabalharam em paralelo, cada um num tema: dados do Recife e de Pernambuco, dados nacionais, APIs pagas, concorrentes, e mercado com regulação. Para cada tema, um verificador abriu as URLs citadas e marcou cada item como confirmado, parcial ou não confirmado, corrigindo preço, licença, cobertura e data quando necessário. Resultado: **109 itens, 77 confirmados e 32 parciais** (os parciais trazem a correção). Afirmações sem fonte que se sustentasse ficaram fora das conclusões.

Limites: a cota de buscas na web acabou durante a verificação, então algumas fontes alternativas não foram procuradas (termos do ZAP e do VivaReal, número da lei da LPUOS, situação do Recife no CIB, termos do FipeZAP). Valores em moeda estrangeira não foram convertidos. Nada aqui é parecer jurídico.

## Dez achados que mudam decisões

1. **Alagamento e risco de prédio são consultáveis.** O ESIG expõe 181 pontos críticos de alagamento com situação da obra e a avaliação do ITEP de 2007. A barreira é a licença, não o acesso. Isso corrige a matriz da v1.0.
2. **Transporte público real sem API paga.** O GTFS do Grande Recife (versão de 16/10/2026, com metrô e VLT) permite "linhas a 400 m e frequência no pico" por prédio. Falta só a autorização de uso.
3. **O CNEFE do IBGE é a peça que faltava:** 737.511 endereços do Recife com coordenada, o que geocodifica de graça quatro bases que só têm endereço.
4. **Saúde fiscal do condomínio tem caminho público:** CNPJ do condomínio (natureza 3085) cruzado com a dívida ativa da PGFN e do FGTS. Vira pergunta à administradora, nunca veredito.
5. **Simulação de financiamento é viável hoje e gratuita** com as taxas do Banco Central (11,28% a.a. nos recursos direcionados, agosto de 2026).
6. **Existe régua pública de aluguel por bairro:** o FipeZAP mensal traz 4 dos 5 bairros da v1.0. Mas tem todos os direitos reservados: só com autorização da Fipe.
7. **A Compesa expõe, no mesmo servidor do calendário de água, endereço e valor de conta de 2,46 milhões de imóveis.** O VEREDA não deve consumir esse serviço sem autorização formal.
8. **A ODbL tira o fosso do dado:** quem publica dossiês sobre IPTU, ITBI e Licenciamento tem de oferecer o índice derivado. A vantagem é a resolução anúncio → prédio e a profundidade por prédio.
9. **Campus Mobile:** inscrição até 02/11/2026; o item 11.20(iv) veda menção que caracterize divulgação de marca, e o app hoje escreve os nomes dos portais. Trocar por "portal de anúncios" na demonstração é barato.
10. **Fomento com prazo:** Pró-Startups FACEPE (Edital 33/2026) até 23/11/2026, sem CNPJ na 1ª fase mas com anuência de incubadora REPE/ANPROTEC; Desafios.Gov até 30/11/2026, com CNPJ.

## O que esta pesquisa confirma do dossiê existente

- Preço de teste do dossiê avulso (R$ 19,90) e do pacote "Busca" (R$ 49,90): dentro das âncoras verificadas (extrato veicular R$ 29,90; disposição a pagar declarada R$ 27,40; passe de 24 horas do Openigloo).
- Não estimar preço: o erro das estimativas fora do mercado é cerca de 3,6 vezes maior, e o ITBI do Recife é avaliação fiscal.
- Leitura de documentos com custo baixo e regras de privacidade: confirmado com preços oficiais de modelos de linguagem.

## O que corrige ou acrescenta

- **Alagamento e ITEP:** de "não público" para "público sem licença declarada".
- **Aluguel de mercado:** de "não há base aberta" para "há régua pública, mas com direitos reservados".
- **APIs de mapa:** o limite está nos termos (mapa de outro fornecedor), não no preço.
- **Mercado com número oficial:** 58.392 apartamentos alugados no Recife (Censo 2022) e 64.153 apartamentos ocupados nos 5 bairros.
- **Prazos de fomento e do Campus** que vencem nas próximas semanas.
