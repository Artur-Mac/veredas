# Pedido de acesso à informação: SDS-PE (GGACE), roubo a transeunte por bairro do Recife

Minuta pronta para o titular enviar. Nada foi enviado. O canal é o **Ouve.PE**: <https://ouve.pe.gov.br>, em "Acesso à Informação" → "Informações Públicas". O link também está em <https://www.lai.pe.gov.br/>. É preciso entrar com conta Ouve.PE ou gov.br; o titular faz o login. Base legal: Lei 12.527/2011 e Lei Estadual 14.804/2012. O prazo é de 20 dias, prorrogável por mais 10. Recurso: em 10 dias à autoridade superior, que decide em 5. Depois, ao Comitê de Acesso à Informação, que decide em 15. O serviço é gratuito.

## Texto do pedido

> Solicito à Secretaria de Defesa Social, Gerência Geral de Análise Criminal e Estatística (GGACE), em formato aberto (CSV ou XLSX):
> 1. a contagem mensal de ocorrências de **Roubo a Transeunte** (natureza do grupo CVP) no município do Recife, por **bairro do fato**, de janeiro de 2014 até o último mês consolidado;
> 2. apenas estes campos: ano, mês, bairro, natureza e quantidade;
> 3. a lista de bairros usada e sua correspondência com os 94 bairros oficiais do Recife;
> 4. a quantidade mensal de ocorrências do Recife **sem bairro informado ou com bairro não identificado**;
> 5. o dicionário de dados, a regra de consolidação (data de extração, prazo de revisão) e a **regra de supressão** de células com contagens baixas, se houver;
> 6. a data da extração do Infopol.
>
> Não solicito dados pessoais nem registros individuais, somente contagens agregadas.

## Números para conferir a série recebida

O painel público "Estatísticas Criminais de Pernambuco" (Power BI da GGACE, página CVP, município RECIFE) foi lido em 15/11/2026. Ele só tem nível de município e região, sem bairro.

| Recife | CVP total | Roubo a Transeunte |
|---|---|---|
| 2025 (01/01 a 31/12) | 16.733 | 10.230 |
| jan. a out. de 2026 | 7.957 | 4.390 |

- O PDF "CVP anual por município" dá 16.752 para 2025, e a planilha de microdados dá 16.733. As fontes oficiais divergem em cerca de 0,1%; use tolerância de 0,5% na conferência.
- Capturas de tela e arquivos: [seguranca-2026-11-15](../../../../dados/raw/seguranca-2026-11-15/).

## Teste que a resposta destrava

1. **Soma:** a soma dos bairros mais os "sem bairro" de 2025 deve fechar com 10.230 (±0,5%). Se não fechar, a série não entra.
2. **Vínculo:** cada nome de bairro precisa casar com um dos 94 bairros oficiais, usando as grafias de `src/dados/recife/bairros.ts`. Nome que não casa fica fora e é contado; nunca é atribuído por aproximação.
3. **Período e supressão:** só meses consolidados. Células suprimidas ficam como "não divulgado", nunca como zero.
4. **Exibição a testar**, em linguagem de ocorrências registradas, sem nota nem ranking: *"Ocorrências registradas de roubo a pessoa na rua em [bairro]: N de jan. a dez. de 2025 (SDS-PE, boletins registrados; nem todo roubo é registrado)."* Deve mostrar a contagem e o período juntos. Uma taxa por habitante só entra com denominador compatível, e a contagem fica ao lado dela.
5. **Fora do escopo:** dizer que o bairro "é seguro" ou "é perigoso", ou comparar bairros com populações e circulação diferentes sem denominador.

## Outras fontes avaliadas

- **crimebrasil.com.br** (já baixado em `docs/dados/raw/seguranca/crimebrasil-bairros.json`): o site afirma usar boletins da SDS-PE por bairro, mas não informa licença nem como obteve os dados. O painel público da SDS não tem bairro. **Não usar** até a resposta ao pedido permitir comparar.
- **Fogo Cruzado** (Grande Recife desde abril de 2018): registra disparos de arma de fogo, não roubos. A API exige autorização prévia e aceite de termos que não foram vistos; a licença para redistribuição comercial não foi verificada. Os campos de vítima (idade, gênero, raça) são dados pessoais: se a API for usada, só contagens. Uso possível depois da autorização: "disparos registrados pelo Fogo Cruzado a até X m, no período", nunca como indicador de roubo.
- **O que o app já mostra e continua mostrando** como fatos da rota: iluminação instalada, pedidos de lâmpada apagada (156), travessias estimadas e ônibus que chegam à noite ("Voltando à noite", VE08), sem linguagem de segurança.
