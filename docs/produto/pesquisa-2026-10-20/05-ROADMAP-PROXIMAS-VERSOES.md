# Roadmap das próximas versões

Proposta do arquiteto, 20/10/2026. Parte da v1.0 em construção (ver [`ORDEM_DO_ARQUITETO.md`](../../handoff/ORDEM_DO_ARQUITETO.md)) e usa só fontes confirmadas em [`01-DADOS-PUBLICOS.md`](01-DADOS-PUBLICOS.md) e [`02-APIS-E-FORNECEDORES.md`](02-APIS-E-FORNECEDORES.md). Complementa o [PRD de evolução existente](../2026-10-20/01-PRD-EVOLUCAO.md), que define métricas e aceite; aqui ficam a ordem e o porquê.

## Como cada item foi priorizado

- **Valor:** responde a uma pergunta que quem procura faz e que o anúncio não responde.
- **Esforço:** quase tudo novo entra pelo script do índice, que já existe, então o esforço é baixo quando a base tem coordenada ou DSQFL e médio quando precisa de geocodificação.
- **Licença:** ODbL e CC-BY entram com aviso; "não declarada" espera autorização por escrito; CC BY-ND e "direitos reservados" esperam parecer.
- **Calendário:** Semana Imersiva do Campus de 21 a 26/02/2027, com protótipo funcional obrigatório, e metas com uso real até 31/05/2027.

## v1.1: "A rua e o caminho" (até janeiro de 2027)

Objetivo: o dossiê passa a responder sobre a rua e o deslocamento, com dado oficial e data em cada fato.

| # | Item | Fonte | Licença | Esforço | Pronto quando |
|---|---|---|---|---|---|
| 1 | **Geocodificador local pelo CNEFE** | IBGE CNEFE 2022 (737.511 endereços do Recife) | Citar o IBGE | Médio | Bases com endereço viram pontos; o endereço do anúncio vira coordenada sem API paga; nenhum complemento guardado |
| 2 | **Seção "A rua"** no dossiê: licenças de som (LUSE) vigentes a 150 m; pedidos ao 156 (galeria, lâmpada, entulho) em 12 meses e tempo de atendimento; pontos de iluminação desativados; turno da coleta de lixo; sinistros de trânsito com vítima | Licenciamento Ambiental, Central 156, Iluminação, Roteiro de coleta, CTTU | ODbL | Baixo | Cada fato com fonte e data; nenhuma nota; perguntas novas no roteiro de visita |
| 3 | **Defesa Civil por endereço** | Atendimentos 2014–2024 | ODbL | Médio (casar endereço pelo CNEFE) | "A Defesa Civil atendeu este endereço em 2024" só com confirmação da pessoa, porque o endereço é digitado à mão na origem |
| 4 | **Entorno do Censo** no setor do prédio: ponto de ônibus, calçada, obstáculo, rampa, árvores; e "1 em cada 3 domicílios desta região é alugado" | IBGE, entorno por setor e Amostra por área de ponderação | Citar o IBGE | Baixo | Dado de 2022 rotulado como tal |
| 5 | **Simulação de financiamento** na compra | Banco Central, SGS 20774 e taxas por banco | ODbL | Baixo | Parcela pela Tabela Price com taxa e data da fonte, e a frase "sem TR, seguros e tarifas" |
| 6 | **Caminhos diários** por transporte público: linhas a 400 m, frequência no pico e às 22h, estação de metrô ou VLT mais próxima; destinos da pessoa abrem no app de mapas | GTFS do Grande Recife | Não declarada | Médio | Só depois de autorização por escrito do Grande Recife; sem tempo de carro inventado |
| 7 | **Alagamento**: ponto crítico catalogado a 150 m e situação da obra; cota do terreno como pergunta | ESIG/COP, curvas de nível | Não declarada | Baixo | Só depois de autorização da Prefeitura; a data de 2022 aparece junto do fato |
| 8 | **Pendências da v1.0**: tabela da leitura automática nos quatro portais num celular de verdade e mapeamento das chaves de ZAP, VivaReal e OLX | Teste em aparelho | — | Baixo | Tabela preenchida pelo humano com o que foi observado |
| 9 | **Textos para a demonstração do Campus**: "portal de anúncios" no lugar dos nomes dos portais | Regulamento, item 11.20(iv) | — | Baixo | Nenhum nome ou logo de portal na ficha, no vídeo e nas telas mostradas |
| 10 | **Compartilhar para o Vereda**: extensão do Safari que lê a página aberta (iOS) e "Processar texto" no menu de seleção (Android), porque ZAP, VivaReal e OLX bloqueiam a WebView | Build próprio do app | — | Médio | Do anúncio no navegador ao formulário preenchido em dois ou três toques, sem copiar; ver [07](07-LEITURA-DO-LINK-NO-CELULAR.md) |

**Uma carta resolve três itens.** Os itens 6 e 7 e a zona da LPUOS dependem de autorização de órgãos do Recife (Prefeitura via EMPREL/ESIG, e Grande Recife). Um pedido formal, explicando o uso educacional com atribuição, vale a pena antes de novembro.

## v1.2: "O prédio por dentro" (fevereiro a maio de 2027, Etapa 4 do Campus)

Objetivo: o que só se descobre com documento do condomínio, e a primeira cobrança real.

| # | Item | Fonte | Esforço | Condição |
|---|---|---|---|---|
| 10 | **Leitura de atas, convenção e balancetes** enviados pela pessoa, com página e trecho de cada achado (cota extra, obra aprovada, infiltração, ação judicial), que viram perguntas | Modelo de linguagem pago (cerca de US$ 0,01 a 0,46 por ata de 20 páginas) | Médio | Exige servidor (nenhum segredo no app), envio voluntário com aviso, arquivo apagado depois, nomes de moradores fora dos trechos citados, nunca o nível gratuito de provedor que treina com o conteúdo |
| 11 | **Saúde fiscal do condomínio**: achar o CNPJ (natureza 3085) pelo endereço e cruzar com a dívida ativa da PGFN e do FGTS | Receita Federal e PGFN | Médio | Só o fato com data, como pergunta à administradora; nunca sócios nem pessoa física; parecer sobre o rodapé CC BY-ND |
| 12 | **Tiroteios a 1 km em 12 meses** | Fogo Cruzado | Baixo | Contagem com fonte e data, nunca ranking; chave no servidor |
| 13 | **Régua de aluguel e venda por bairro** | FipeZAP (4 dos 5 bairros) | Baixo | Só com autorização da Fipe; rótulo "preço anunciado" |
| 14 | **Compartilhar do app do portal direto para o VEREDA** (celular) e **extensão de navegador** (web) | — | Médio | Mesmas regras da leitura automática: a página que a pessoa abriu, à vista dela |
| 15 | **Zona da LPUOS** do lote e dos vizinhos | ESIG | Médio | "Consulte o que pode ser construído", sem afirmar altura |
| 16 | **Cobrança de teste**: dossiê avulso de R$ 19,90 a R$ 29,90 e pacote "Busca" de R$ 49,90 | — | Médio | Medir pagamento real, não intenção; conta e servidor; LGPD de controlador |
| 17 | **Exportar e importar o caderno** | — | Baixo | Para troca de aparelho enquanto não há conta |

## v2: depois do Campus

| Item | Por quê | Risco |
|---|---|---|
| Índice da cidade inteira, carregado por bairro sob demanda | O script já filtra por bairro; o arquivo cresce cerca de 4 vezes | Hospedagem estática; ODbL exige oferecer o índice derivado |
| Processos do condomínio e da construtora (JUDIT, por CNPJ) | Ação judicial é a surpresa mais cara | Mínimo de R$ 1 mil por mês: só com receita |
| Módulo B2B "dossiê do prédio" para assessorias do lado do comprador, garantidoras e vistoriadoras | Parceiros que ganham quando quem procura decide bem | Ser lido como intermediação; perder a neutralidade |
| Perguntas fechadas da comunidade no Modo Visita ("alagou na última chuva?"), exibidas acima de um mínimo de respostas | Dado que nenhuma base tem | Difamação e LGPD se virar avaliação de prédio identificável |
| Outras cidades | Mercado maior | Cada cidade tem cadastro, chave e licença diferentes; não pesquisado nesta rodada |
| Painel B2G para Prefeitura ou Procon (CPSI, LC 182) | Receita pública com os mesmos dados | Depende de desafio publicado |

## Fora, por decisão

- Estimar preço do imóvel ou dar nota (erro alto fora do mercado; caso Zillow).
- Google Solar API e Aerial View (termos e cobertura).
- Bureaus de dados pessoais (BigDataCorp, Neoway, Cortex).
- Buscar páginas de anúncio pelo servidor ou contornar anti-robô.
- Exibir o risco do ITEP 2007 por prédio sem parecer.
- Consumir a Compesa sem autorização (o mesmo servidor expõe dados de contas de 2,46 milhões de imóveis).
