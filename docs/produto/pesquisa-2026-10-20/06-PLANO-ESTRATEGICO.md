# Plano estratégico

Proposta do arquiteto, 20/10/2026, apoiada na pesquisa verificada desta pasta. Complementa o [plano estratégico existente](../2026-10-20/05-ESTRATEGIA-E-OPORTUNIDADES.md) (sequência de 90 dias, segmentos, critérios de interrupção). Onde os dois divergem, a decisão é da equipe.

## 1. Tese

Quem procura apartamento no Recife decide com o que o anúncio declara. O cadastro aberto da Prefeitura já sabe muita coisa que o anúncio omite: o IPTU real de unidades iguais, o ano e o porte do prédio, as obras licenciadas ao lado, as transmissões registradas. O VEREDA liga o anúncio ao prédio e mostra esses fatos com fonte e data, sem nota, antes da visita.

**Por que agora:** o aluguel no Recife chegou a R$ 64,39/m² (2º entre as capitais, mais caro do Nordeste) e subiu 21,5% em 12 meses nas Graças; errar custa caro. O cadastro tem licença aberta (ODbL) e cobertura alta: 2.688 prédios nos 5 bairros, 100% ligados a lote. Nenhum concorrente encontrado faz o vínculo anúncio → prédio → cadastro no Recife.

## 2. Posicionamento

- **É:** camada de fatos do cadastro depois da busca e antes da visita.
- **Não é:** portal, estimador de preço, corretor, avaliador de bairro.
- **Frase:** "o que o anúncio não diz, com fonte e data".
- **Referências de fora:** o Openigloo (dado público por prédio) e a "informação material" que o Reino Unido exige nos anúncios (imposto, construção, riscos, obras planejadas). A lista britânica coincide com o dossiê do VEREDA.

## 3. Público, em ordem

1. **Quem procura aluguel nos 5 bairros**, com duas ou mais opções concretas. São cerca de 22 mil apartamentos alugados ali (inferência sobre a taxa municipal de 35%; o Censo não dá aluguel por bairro). É o público do Campus e da Etapa 4.
2. **Quem compra para morar**, com a matrícula como passo final (o VEREDA explica e manda ao RI Digital, sem intermediar) e a simulação de financiamento com taxa do Banco Central.
3. **Profissionais que ganham quando quem procura decide bem:** assessorias do lado do comprador (modelo MySide, ausente em Pernambuco), garantidoras, vistoriadoras, bancos. Só depois de o produto provar valor para a pessoa.

## 4. Modelo de receita em camadas

| Camada | Para quem | Forma | Preço de teste | Quando |
|---|---|---|---|---|
| Caderno | Todos | Grátis: link, custos, perguntas, comparação | R$ 0 | Já |
| Dossiê com cadastro | Quem procura | Avulso ou passe | R$ 19,90 a R$ 29,90 avulso; R$ 49,90 por até 5 análises em 30 dias | Etapa 4 do Campus (fev–mai/2027), com cobrança real |
| Leitura de documentos do condomínio | Quem procura | Complemento | R$ 29,90 (do modelo existente) | v1.2 |
| Módulo "dossiê do prédio" | Assessorias, garantidoras, vistoriadoras | Assinatura ou por dossiê | Entre R$ 20 e R$ 130 por mês por usuário, para caber ao lado de um CRM | Depois do Campus, com parecer |
| Painel de transparência | Prefeitura, Procon | CPSI (LC 182/2021), até R$ 1,6 milhão | Sob desafio | Se houver desafio publicado |

**Âncoras confirmadas:** disposição a pagar declarada de R$ 27,40; extrato veicular avulso R$ 29,90; visualização de matrícula em PE cerca de R$ 17,58; NeighborhoodScout US$ 30; Openigloo US$ 14,99 a 17,99 por 24 horas. O custo variável por dossiê fica em centavos (dados próprios; leitura de ata de US$ 0,01 a 0,46).

**O que não fazer para ganhar dinheiro:** comissão, taxa por negócio fechado, lead pago por fechamento (corretagem, Lei 6.530); seguro ou crédito sem contrato de representante ou correspondente; vender o índice como exclusivo (ODbL).

## 5. Vantagem que se sustenta

A ODbL obriga a oferecer o índice derivado a quem pedir, então **o dado não é o fosso.** O que se sustenta:

1. **Resolução anúncio → prédio** no Recife: rua, número, nome do edifício, área por tipologia, lote. É trabalho de produto, não de dado.
2. **Profundidade por prédio**, somando camadas que ninguém junta (cadastro, obras, rua, alagamento, transporte, condomínio).
3. **Independência:** sem receita de anunciante, os achados negativos ficam na tela. O caso Zillow (notas de risco retiradas em 2025 depois de queixas de corretores) mostra o que acontece quando quem paga é o anunciante.
4. **Velocidade e confiança:** cada número com fonte e data; nada inventado.

## 6. Entrada no Recife

| Canal | Por quê | Primeiro passo |
|---|---|---|
| Comunidades de quem procura aluguel (grupos de bairro, universidades, recém-chegados por trabalho) | Quem está escolhendo agora | 5 sessões de uso com registro (já previsto na Fatia 6) |
| Conteúdo factual por bairro ("o IPTU que o anúncio não mostrou") | Mostra o produto sem prometer nota | Um caso real por semana, com autorização da pessoa |
| Porto Digital e UFPE | Rede de incubação e público jovem que aluga | Pré-incubação do próximo ciclo (cerca de fev/2027) |
| Prefeitura (EMPREL, ESIG) e Grande Recife | Autorização dos dados sem licença declarada; possível parceria B2G | Carta formal antes de novembro de 2026 |
| Procon-PE | "Informação material" como padrão voluntário | Conversa depois do Campus |

## 7. Riscos e respostas

| Risco | Probabilidade | Resposta |
|---|---|---|
| Portal copia a conferência de IPTU | Média | Profundidade por prédio e velocidade; vigiar mensalmente se os portais exibem dados cadastrais |
| Portal bloqueia a leitura na WebView | Média | Plano B já existe (texto colado); extensão de navegador; parecer sobre termos |
| Desclassificação no Campus por menção a marca (item 11.20) | Baixa se tratada | Trocar nomes de portais por "portal de anúncios" na demonstração |
| Base pública defasada (alagamento até 2022, Defesa Civil até 2024) | Alta | Data visível em cada fato; nunca afirmar o presente |
| Pessoa lê fato como veredito ("prédio perigoso") | Média | Fato com fonte e data, sem adjetivo; teste automático de palavras proibidas; sessões de uso para medir a leitura |
| Dado pessoal vazar de base derivada | Baixa | Lista branca por base; nenhum dado de unidade, sócio ou proprietário |
| CRECI ler o B2B como intermediação | Média | Parecer jurídico antes de cobrar de profissionais |
| Disposição a pagar não se confirmar | Média | Medir pagamento real na Etapa 4; o caderno grátis continua útil |

## 8. Marcos

| Data | Marco | Critério de sucesso |
|---|---|---|
| 02/11/2026 | Inscrição no Campus Mobile | Ficha e vídeo sem marcas, com demonstração da v1.0 |
| até 23/11/2026 | Proposta ao Pró-Startups FACEPE (1ª fase) | Anuência de incubadora REPE/ANPROTEC e coordenador graduado |
| até 30/11/2026 | Decidir sobre o Desafios.Gov | Só se houver desafio estadual compatível e CNPJ |
| novembro de 2026 | Carta à Prefeitura e ao Grande Recife | Resposta sobre uso de ESIG e GTFS com atribuição |
| janeiro de 2027 | v1.1 pronta ("A rua e o caminho") | Fatos novos com fonte e data; teste em celular dos quatro portais |
| 21–26/02/2027 | Semana Imersiva | Protótipo funcional sem falha no fluxo central |
| fev–mai/2027 | Etapa 4 (se premiado) | Cobrança real de dossiês; pessoas que resolveram ao menos uma dúvida material antes de visitar |
| 31/05/2027 | Metas do Campus | Números de uso reais, sem estimativa |

## 9. Métricas

Seguir as definições do [plano de validação existente](../2026-10-20/06-VALIDACAO-E-GOVERNANCA.md). Três que esta pesquisa reforça:

1. **Achado útil por dossiê:** quantos dossiês trazem ao menos um fato do cadastro que o anúncio não tinha (IPTU, obra, ano, alagamento).
2. **Pergunta respondida:** quantas perguntas do roteiro a pessoa marcou como respondidas antes ou durante a visita.
3. **Pagamento real** na Etapa 4, separado de intenção declarada.

## 10. Decisões que cabem à equipe agora

1. Inscrever no Campus até 02/11 e, para a demonstração, trocar os nomes dos portais por "portal de anúncios"?
2. Buscar a incubadora para o Pró-Startups até 23/11? Quem da equipe é o coordenador graduado?
3. Enviar a carta à Prefeitura e ao Grande Recife pedindo autorização de uso com atribuição?
4. Manter MapLibre e GTFS próprio, abrindo o app de mapas para trajeto de carro?
5. Pedir parecer jurídico sobre ODbL, termos dos portais e corretagem antes de qualquer cobrança?
