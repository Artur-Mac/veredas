# 5. Internet: teste no lugar em que a pessoa vai usar

**Situação: funciona no app** (caderno → Registro de campo → "Internet onde você vai usar"). Testado pelo fluxo normal na web, a 375 e 360 px. Falta o teste em aparelho e com pessoas.

## O que foi implementado

- **Modelo:** [src/dados/conectividade.ts](../../../../../src/dados/conectividade.ts). É um campo opcional `conectividade` no caderno; cadernos antigos continuam válidos. Três fatos separados:
  1. **Disponibilidade consultada.** Prestadora, até onde vale a resposta (endereço, bloco ou unidade), resposta (disponível, visita técnica, indisponível, sem resposta), canal, protocolo e data. Uma consulta por endereço **não vira** confirmação na unidade: a frase diz que a instalação ainda depende de porta e infraestrutura do condomínio.
  2. **Cobertura móvel externa.** Abre o mapa da Anatel com o aviso de que a predição é ao ar livre. O cruzamento de 48 pontos de 14/11 mostrou que o 5G previsto não diferencia imóveis nesses bairros, por isso não virou selo.
  3. **Qualidade observada na unidade.** Cômodo, data e hora, rede (Wi-Fi ou móvel), tecnologia vista (2,4 ou 5 GHz; 2G a 5G), operadora quando conhecida, método (SIMET, chamada ou outro), download, upload, latência e resultado da chamada.
- **Regras:**
  - valor não medido fica `null`, nunca zero;
  - número negativo ou texto é recusado;
  - tecnologia Wi-Fi com rede móvel (e o contrário) é recusada;
  - teste de chamada exige dizer se funcionou.
- **"Ainda falta":** consultar a fibra; confirmar no bloco ou na unidade; medir no cômodo; testar a rede móvel sem Wi-Fi; anotar upload e latência; medir num segundo cômodo.
- **Tela:** [src/componentes/caderno/Conectividade.tsx](../../../../../src/componentes/caderno/Conectividade.tsx). O link do SIMET (<https://medicoes.nic.br/consumidor/>) abre no navegador. O VEREDA não roda o teste nem lê o resultado: a pessoa copia os números.

## Verificação

- **Jest:** [tests/conectividade.test.ts](../../../../../tests/conectividade.test.ts), 8 testes: frases, nulo ≠ zero, entrada inválida, mistura de redes, pendências e compatibilidade com cadernos antigos.
- **Render no fluxo normal** ([../verificacao/render.json](../verificacao/render.json)):
  - foram gravadas uma consulta de fibra (bloco B), uma medição Wi-Fi (312,4 Mbps, latência 9 ms; upload vazio, gravado como `null`) e uma chamada 4G que funcionou;
  - uma medição com −5 Mbps foi recusada, com aviso;
  - os 3 registros ficaram persistidos;
  - sem rolagem lateral, sem erro, sem requisição externa.

## O que ainda depende de evidência

- **Aparelhos reais:** o teste é manual. A leitura automática da geração celular (Expo Cellular, SDK 57) precisa de aparelhos reais (NEXT-PROGRAMME: 2 aparelhos).
- **Viabilidade por bloco via API:** depende de parceria com prestadoras. Hoje é a pessoa que anota a resposta.
- **Qualidade agregada da vizinhança:** Ookla tem licença CC BY-NC-SA, e o nPerf é sob contrato. Fica fora até haver licença para uso comercial.
