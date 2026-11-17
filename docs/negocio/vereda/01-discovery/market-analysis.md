# Análise de mercado — VEREDA

**Fase:** 3 — Pesquisa, revista no gate 3.5  
**Projeto:** vereda  
**Data:** 2026-11-15  
**Confiança:** [Opinion] Alta para o estoque habitacional oficial; baixa para mercado capturável, conversão e viabilidade comercial; cálculos condicionais reproduzíveis.

## Síntese

[Opinion] Há motivo para investigar a decisão pré-contrato, mas a pesquisa não prova a viabilidade de V1, V2 ou B2B2C. O passe barato tem pouco espaço para pagar aquisição e atendimento; a oferta assistida aumenta a contribuição por pedido, mas também exige acesso documental, trabalho humano e delimitação profissional. O mercado imobiliário amplo não pode ser confundido com receita de software. [Data] O intake registra ausência de testes reais pós-pivô ([brief, seção 3](../00-intake/brief.md)). [Opinion] A recomendação é luz amarela para investigação, com decisão reservada ao fundador no [Research Gate](research-gate.md).

## Tamanho de mercado e crescimento

**Confiança:** [Opinion] Alta no dado nacional; baixa nos recortes monetários.

[Data] A PNAD registra 18,9 milhões de domicílios alugados em 2025, segundo a [publicação oficial via IBGE](https://agenciagov.ebc.com.br/noticias/202604/ibge-99-8-dos-domicilios-brasileiros-tem-acesso-a-energia-eletrica). [Opinion] Esse estoque contextualiza a necessidade habitacional; não mede o número anual de clientes acessíveis ao VEREDA.

| Medida herdada | Valor | Como interpretar agora |
|---|---|---|
| TAM agregado Brasil | [Estimate] R$ 807,7 milhões/ano | [Data] Soma do modelo em [raw/market-size, seção 2](raw/market-size.md): locação R$ 330,1M + compra R$ 238,8M + B2B R$ 118,8M + B2G R$ 120M. [Opinion] Não usar como mercado validado: mistura ofertas e possíveis compradores sobrepostos. |
| SAM Recife/RMR | [Estimate] R$ 5,03M–8,89M/ano | [Data] Cenário da seção 3 do mesmo bruto, incluindo B2B, relocation e governo. [Opinion] Não representa apenas o produto nem a cobertura atual; falta elegibilidade, deduplicação e disposição a pagar. |
| SAM capitais | [Estimate] R$ 290,8M–333,6M/ano | [Opinion] Potencial hipotético condicionado a cobertura e distribuição; não demonstrado como atendível. |
| V1 em bairros piloto | [Estimate] R$ 2.994–12.475/ano | [Assumption] 60–250 passes × R$ 49,90; volumes derivados de hipóteses de alcance e conversão, não vendas. Não é teto empírico do mercado. |
| SOM híbrido herdado | [Estimate] R$ 68.066 no cenário base | [Data] R$ 6.986 passes + R$ 8.970 concierge + R$ 43.200 contratos de RH + R$ 8.910 licenças. [Opinion] Não transferir este resultado ao novo mix V2 + profissionais; depende principalmente de relocation ainda não validado. |
| TAM/SAM/SOM específico da oferta a escolher | [Opinion] DATA GAP | [Opinion] Falta definir comprador, unidade de cobrança, cobertura atendível, volume de jornadas e separação B2C/B2B para não contar o mesmo caso duas vezes. |

[Assumption] No modelo bruto de locação nacional, giro anual de 35% e ticket de R$ 49,90 são premissas. [Estimate] Aplicados ao estoque arredondado de 18,9 milhões, produzem aproximadamente R$ 330,1 milhões/ano. [Opinion] O cálculo é uma análise de sensibilidade do potencial, não gasto observado. Para compra, as transações financiadas, vendas e lançamentos precisam ser deduplicados antes de servir de base. O cenário B2G exige produto e comprador próprios.

[Opinion] A intermediação habitacional é uma categoria estabelecida; o nicho exato de organização documental e comparação local continua sem maturidade ou taxa de crescimento medidas. O crescimento do aluguel não prova crescimento proporcional na compra de relatórios.

## Economia unitária — cenários condicionais

**Confiança:** [Opinion] Alta na aritmética abaixo; baixa nos custos, na demanda e na adequação fiscal do caso concreto.

[Data] A [Receita](https://www8.receita.fazenda.gov.br/SimplesNacional/Arquivos/manual/PerguntaoSN.pdf) e a [LC 123](https://www2.camara.leg.br/legin/fed/leicom/2006/leicomplementar-123-14-dezembro-2006-548099-normaatualizada-pl.html) relacionam fator R e anexos para atividades sujeitas a essa regra. [Assumption] Para comparação, usamos primeira faixa: Anexo V a 15,5% na largada conservadora e Anexo III a 6% quando elegível com fator R ≥28%. Não são alíquotas universais de software: atividade efetiva, faixa, início de atividade e folha precisam ser enquadrados. [Opinion] Mais pró-labore também tem custo; reduzir a alíquota não equivale à economia líquida integral.

[Assumption] Preços, custos operacionais e taxas abaixo vêm das hipóteses de [raw/pricing-intel, seção 6/tabela consolidada](raw/pricing-intel.md). Gateway de 0,99% para A2/A3 e R$ 0,80 para os demais é entrada de simulação, não cotação contratada vigente. O custo operacional inclui as rubricas estimadas de tecnologia, perdas e, nos B1/B2, revisão humana. Custas de cartório estão excluídas.

[Estimate] Fórmula: contribuição = preço − gateway − tributo − custo operacional variável. Cada rubrica monetária é arredondada a centavos, metade para cima. O limite analítico de aquisição é contribuição ÷3, arredondado a centavos. [Assumption] A relação 3:1 é uma regra de planejamento, não uma exigência universal nem LTV medido. [Opinion] Contribuição antes de CAC e custos fixos não é lucro líquido.

| Oferta | Preço [Assumption] | Gateway [Assumption] | Custo operacional [Assumption] | Contribuição V / III [Estimate] | Limite CAC V / III [Estimate] |
|---|---:|---:|---:|---:|---:|
| A2 — passe V1 | [Assumption] R$ 49,90 | [Assumption] R$ 0,49 | [Assumption] R$ 5,20 | [Estimate] R$ 36,48 / R$ 41,22 | [Estimate] R$ 12,16 / R$ 13,74 |
| A3 — passe ampliado | [Assumption] R$ 79,90 | [Assumption] R$ 0,79 | [Assumption] R$ 8,40 | [Estimate] R$ 58,33 / R$ 65,92 | [Estimate] R$ 19,44 / R$ 21,97 |
| B1 — organização documental assistida | [Assumption] R$ 199,00 | [Assumption] R$ 0,80 | [Assumption] R$ 46,98 | [Estimate] R$ 120,37 / R$ 139,28 | [Estimate] R$ 40,12 / R$ 46,43 |
| B2 — assistida com conversa | [Assumption] R$ 349,00 | [Assumption] R$ 0,80 | [Assumption] R$ 74,98 | [Estimate] R$ 219,12 / R$ 252,28 | [Estimate] R$ 73,04 / R$ 84,09 |
| C1 — ferramenta profissional, pacote | [Assumption] R$ 199,00 | [Assumption] R$ 0,80 | [Assumption] R$ 11,99 | [Estimate] R$ 155,36 / R$ 174,27 | [Estimate] R$ 51,79 / R$ 58,09 |
| C2 — ferramenta profissional mensal | [Assumption] R$ 249,00 | [Assumption] R$ 0,80 | [Assumption] R$ 20,49 | [Estimate] R$ 189,11 / R$ 212,77 | [Estimate] R$ 63,04 / R$ 70,92 no primeiro mês |

[Data] A2 agora usa o custo explícito de R$ 5,20 do bruto; a contribuição anterior de R$ 43,50 não usava essa mesma cascata. [Estimate] Pequenas diferenças de centavos no B1/B2 decorrem do arredondamento por rubrica. O limite do B2 permanece R$ 73,04 na hipótese de largada e R$ 84,09 no cenário III; não vale para B1, cujo limite é R$ 40,12 / R$ 46,43.

[Assumption] C1 cobre 10 relatórios e C2 até 20 por mês **como ferramenta para um profissional fazer a revisão**, sem curadoria humana do VEREDA por caso. [Estimate] Incluir no C1 a mesma revisão de R$ 35 por caso suposta no B1 acrescentaria R$ 350 ao pacote e levaria a contribuição V a −R$ 194,64. [Opinion] Portanto, não vender C1/C2 com a mesma promessa operacional de B1/B2. O custo de suporte profissional também é DATA GAP.

[Assumption] O bruto usa retenção de 6 meses para C2, ainda não observada. [Opinion] Esse horizonte não autoriza comprometer antecipadamente um CAC de vários meses. CAC inclui mídia, encargos, criação, comissões e tempo de prospecção; indicação e trabalho dos sócios não são gratuitos economicamente. O repasse específico de tributos da Meta não foi revalidado e não compõe uma cotação neste documento.

### Certidões e aquisição

[Estimate] Sob B1/V, absorver duas certidões hipotéticas de R$ 75 reduz R$ 120,37 a −R$ 29,63 (aproximadamente −14,9%). Com duas de R$ 58,61, restariam R$ 3,15 antes de aquisição e fixos. [Assumption] Ambos são cenários de custo, não preços oficiais atuais de Pernambuco. [Opinion] Separar a compra de certidão do preço de serviço torna o custo mais visível, mas o tratamento fiscal depende do contrato e da operação; não chamar automaticamente de bitributação.

[Assumption] Se o CAC fosse R$ 100, ele ultrapassaria a contribuição A2/V. [Opinion] Isso demonstra fragilidade nesse cenário, não que todo canal B2C é inviável. **DATA GAP:** CAC real, recompra, custo humano e reembolsos do VEREDA. Benchmarks de leads imobiliários ou apps globais não substituem compras do nosso relatório.

## Geografia, acesso e conformidade

**Confiança:** [Opinion] Baixa para expansão; média para o diagnóstico de dependências documentadas.

[Data] [raw/adjacent-expansion](raw/adjacent-expansion.md) e [raw/geographic](raw/geographic.md) registram dificuldades de acesso e heterogeneidade entre cidades. [Opinion] Essas observações justificam testar portabilidade; não demonstram inexistência de dados em toda uma cidade nem que apenas V2 possa escalar. [Estimate] A hipótese herdada de 210–360 horas por capital, a 10–15 horas/semana, representa 14–36 semanas, antes de interrupções. Não é tempo medido de implantação.

[Opinion] Uma oferta documental pode reduzir dependência municipal, mas continua dependente de acesso autorizado, qualidade dos documentos, revisão e responsabilidade. A camada SPU, por si só, não prova enquadramento individual do imóvel nem expansão comercial. Não há cidade seguinte aprovada.

[Data] O [CNJ](https://www.cnj.jus.br/sistemas/datajud/api-publica/) descreve API de metadados com proteção das informações das partes. [Opinion] Não prometer varredura processual completa por pessoa ou empresa com essa base. A distinção entre fatos, orientação profissional e responsabilidade está em [industry-trends, marco regulatório](industry-trends.md).

## Auditoria Interna do Repositório

**Confiança:** [Opinion] Média para o relato herdado; estado atual não reexecutado.

[Data] [raw/channels, seção 0](raw/channels.md) relata saldo inicial e restituição de créditos em Carteira.tsx/descarte.ts. [Opinion] Isso requer revisão antes de um teste de cobrança; não prova sozinho que nenhuma venda seria possível. [Data] [raw/geographic, seção 1](raw/geographic.md) registra cobertura técnica desigual. [Opinion] Linha de código e quantidade de prédios indexados não são demanda nem vantagem competitiva validada. Nenhuma evidência interna é fonte externa Tier 1.

## Conexões e próximo passo

[Opinion] Os concorrentes em [competitor-landscape](competitor-landscape.md) mostram ofertas documentais existentes, não um mercado sem competição. As personas em [target-audience](target-audience.md) são candidatas. O [painel de confiança](confidence-dashboard.md) identifica quais hipóteses mais afetam o gate. Não iniciar estratégia, produto ou projeção financeira antes da decisão do usuário.

## Data Gaps

- [Opinion] Mercado monetário deduplicado e aderente à oferta escolhida; buscas e transações por bairro.
- [Opinion] Pagamento, acesso aos documentos, tempo humano, qualidade e retrabalho por caso.
- [Opinion] CAC completo, retenção profissional, taxas contratadas, encargos e elegibilidade tributária.
- [Opinion] Capacidade semanal total e orçamento aprovados: os brutos divergem de horas por pessoa versus horas da equipe.
- [Opinion] Cobertura, licenças, custos cartoriais por comarca e limite de responsabilidade profissional.

## Flags

**Red Flags:**
- [Opinion] Tratar cenário de margem como negócio validado ou financiar aquisição sobre retenção não observada.
- [Opinion] Prometer revisão humana com o custo de ferramenta automatizada.

**Yellow Flags:**
- [Opinion] TAM amplo mistura mercados; SOM antigo depende de RH; aquisição orgânica também consome recursos.

## Fontes

[Data] Fontes externas S01–S03 e S12 no [registro de fontes](source-register.md); [market-size bruto](raw/market-size.md), [pricing bruto](raw/pricing-intel.md), [brief](../00-intake/brief.md). Os documentos internos são rastros de cálculo/contexto e não corroboradores externos.
