# Pedido de acesso à informação: COP e CTTU (alagamentos e interdições)

Minuta pronta para o titular enviar. Nada foi enviado. Canal: **e-SAI da Prefeitura do Recife**, em <https://transparencia.recife.pe.gov.br/codigos/web/lai/pedidoInformacaoForm.php>. Base legal: Lei 12.527/2011, Lei Municipal 17.866/2013 e Decreto 28.527/2015. O formulário pede nome e CPF do requerente e devolve uma senha de acompanhamento; preencha esses dados você mesmo. O prazo é de 20 dias, prorrogável por mais 10. Recurso: até 10 dias depois da resposta.

**Destinatários.** A CTTU consta na lista de órgãos do e-SAI. O COP não aparece na lista e falta confirmar qual órgão responde por ele (GP, SEINFRA ou SEOPS). Na dúvida, mande o pedido 1 à CTTU e o pedido 2 à Secretaria de Infraestrutura, pedindo encaminhamento ao COP.

## Pedido 1: CTTU, interdições por alagamento

> Solicito, em formato aberto (CSV ou XLSX), a relação das interdições e desvios de tráfego motivados por alagamento no Recife entre 01/01/2022 e a data da resposta. Para cada interdição, peço:
> 1. o logradouro e o trecho afetado (entre quais cruzamentos ou números), com o bairro;
> 2. a data e a hora de início da interdição;
> 3. a data e a hora de fim da interdição;
> 4. a data e a hora da reabertura total, se forem diferentes do fim;
> 5. o modo afetado: veículos, ônibus, ciclistas ou pedestres (calçada), e se a interdição foi total ou parcial;
> 6. a origem do registro (equipe em campo, câmera, COP ou chamado);
> 7. o identificador da ocorrência, se houver.
>
> Se não houver registro estruturado de algum desses campos, peço que a resposta informe qual campo não é registrado. Também peço o dicionário de dados ou a descrição de cada campo. Não solicito dados pessoais.

## Pedido 2: COP, nota técnica e registros do evento de 1 a 3/05/2026

> Solicito:
> 1. a nota técnica, o relatório ou o boletim consolidado do Centro de Operações do Recife sobre as chuvas de 1 a 3 de maio de 2026;
> 2. a lista dos pontos e logradouros com alagamento registrados pelo COP nesse período, com bairro, data e hora de início e de fim da lâmina d'água, e a fonte de cada registro (câmera, sensor, equipe ou chamado);
> 3. a série dos pluviômetros do COP de 01/03/2026 a 31/05/2026, com código da estação, data e hora de cada registro, e o fuso horário usado nos campos DATAHORA e IDUNICO do serviço BASE_SENSORES_PLUVIOMETRICOS_RECIFE. No arquivo baixado em 14/11/2026, o IDUNICO fica três horas à frente de DATAHORA em 7.807 de 7.808 registros.
>
> Peço os dados em formato aberto e a licença de reutilização. Não solicito dados pessoais.

## O que cada resposta destrava (teste pronto)

| Campo recebido | Teste no VEREDA | Muda no app |
|---|---|---|
| Trecho + início/fim + modo = pedestre | Ligar o trecho à rede de caminhada, como `arestasSobre` em [livro.mjs](../../../../../scripts/dados/chuva/livro.mjs). Conferir 10 trechos em mapa. Comparar com os registros da Defesa Civil da mesma data e rua. | O desvio deixa de ser cenário ("se bloquear") e vira fato datado ("a calçada foi interditada de X a Y"). Isso só vale para os trechos com modo pedestre ou interdição total. |
| Só veículos | Mesmo vínculo, com o modo preservado. | Mostrar "interditada para veículos em DD/MM" sem afirmar nada sobre a calçada. |
| Fuso do pluviômetro confirmado | Alinhar a chuva por hora com as datas dos registros. A data da Defesa Civil é administrativa e não traz hora: a chuva entra como contexto do dia, com a estação, a distância e o horário. | Linha de contexto "chuva medida no dia: N mm em [estação], a X km" atrás de "Ver o registro". |
| Lista de pontos do evento de maio/2026 | Comparar com os 54 pontos e os 552 trechos do eSIG e com os registros de 2014 a 2024. | Atualizar o histórico da rua com 2026, mantendo "ponto catalogado", "ocorrência" e "bloqueio" separados. |

## Contexto já verificado (não depende do pedido)

- **APAC**: os boletins pluviométricos diários de 30/04 a 04/05/2026 foram baixados ([alagamento-2026-11-15](../../../../dados/raw/alagamento-2026-11-15/)). Trazem um total diário por estação, com código, e não informam a hora nem a janela de 24 h. Em 02/05, o maior total da região metropolitana foi 147,0 mm em Alto da Brasileira (pluviômetro manual); no Recife, Pina teve 105,0 mm e San Martin 98,9 mm. Há zeros que parecem falha de leitura, não dia seco; isso não foi verificado.
- **Maré CHM, Porto do Recife 2026** (UTC−3, alturas em metros sobre o nível de redução da carta 902 pela convenção do CHM; o PDF não diz isso por extenso):

| Data | Preamar | Baixa-mar | Preamar | Baixa-mar |
|---|---|---|---|---|
| 01/05 | 03h31 · 2,25 | 09h47 · 0,27 | 15h49 · 2,26 | 21h59 · 0,36 |
| 02/05 | 04h02 · 2,28 | 10h16 · 0,28 | 16h23 · 2,22 | 22h32 · 0,39 |
| 03/05 | 04h36 · 2,26 | 10h49 · 0,33 | 16h59 · 2,16 | 23h02 · 0,45 |

A maré prevista sustenta só a leitura "chuva forte perto da preamar". Ela não prova alagamento, e não se compara com a cota da rua sem um referencial vertical comum.
