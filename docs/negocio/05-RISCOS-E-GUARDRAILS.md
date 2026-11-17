# 05 — Riscos Jurídicos, Epistemológicos e Operacionais (Guardrails)

Qualquer estratégia de crescimento, receita ou produto sugerida para o VEREDA precisa respeitar estas cinco fronteiras rígidas mapeadas nas pesquisas e auditorias técnicas do projeto (`20/10–14/11/2026`).

---

## 1. Fronteiras Jurídicas e Regulatórias *(exigem parecer jurídico formal antes de cobrança em escala)*

| Tema | Marco aplicável | O que é PROIBIDO fazer | Caminho seguro adotado pelo VEREDA |
|---|---|---|---|
| **Corretagem (`Lei 6.530/1978` / CRECI)** | Intermediação de compra, venda e locação é privativa de corretor inscrito. | Cobrar comissão sobre aluguel/venda, receber taxa por negócio fechado, vender lead remunerado por fechamento, negociar em nome do usuário ou emitir "avaliação de preço justo". | Apresentar fato público com origem e data + gerar rascunho editável que **a própria pessoa copia e envia** (`Preparar a negociação`). Parecer jurídico obrigatório antes de vender assinatura B2B a corretores. |
| **Privacidade e LGPD (`Lei 13.709/2018`)** | Tratamento de dado público deve respeitar finalidade original; dados do usuário exigem base legal e minimização. | Expor CPF, nome de proprietário, sócios nominais, unidade individual exata do contribuinte ou enviar endereço/rotina/anotações pessoais do usuário para servidor sem consentimento. | Lista branca estrita por base; IPTU/ITBI tratados apenas em recorte predial/tipologia; **perfil, destinos e caderno locais no aparelho por padrão**. |
| **Licença Aberta (`ODbL 1.0`)** | Cadastro Sefin/Prefeitura (IPTU, ITBI, Licenciamento) usa ODbL no CKAN Recife. | Tentar vender o índice cadastral derivado como base proprietária/exclusiva fechada ou suprimir atribuição de origem. | Exibir atribuição clara e assumir que o índice municipal derivado não é segredo; **separar** dados de parceiros comerciais em base própria e construir o moat na resolução, memória histórica e experiência. |
| **Termos de Portais** | QuintoAndar (`08/01/2026`) e OLX (`27/02/2025`) proíbem extração automatizada e republicação de anúncios (ZAP/VivaReal a revisar formalmente). | Montar crawler/scraper centralizado em servidor para republicar inventário ou alimentar faixas comerciais de preço sem licença. | Captura iniciada **pela pessoa na WebView do aparelho** (sobre a página aberta diante dela) + colagem manual + futura via formal via **feeds/XML autorizados com imobiliárias parceiras**. |
| **Seguros e Crédito (`CNSP 431/2021` / `CMN 4.935/2021`)** | Intermediação remunerada de seguro fiança/incêndio e crédito imobiliário é regulada. | Monetizar links de indicação financeira ou assumir risco de garantia sem enquadramento e contrato regulatório. | Fora do escopo de receita até existir contrato formal com agente autorizado. |

---

## 2. Fronteiras de Produto e Credibilidade (`CRIVO` Anti-Alucinação)

1. **Zero nota, selo ou veredito:** atribuir "Nota 7,4/10", "Prédio Risco Alto" ou "Bairro Inseguro" abre flanco simultâneo para processo cível/difamação (de incorporadoras, síndicos e corretores), contestação metodológica e boicote — exatamente o que derrubou as notas climáticas do Zillow nos EUA em 2025. O VEREDA mostra apenas o **fato localizado no caminho/prédio com fonte e data** (ex.: ocorrência registrada na rua X em data Y; tempo alternativo se o trecho fechar).
2. **Nunca igualar fontes diferentes de preço:** nunca misturar pedido anunciado, valor venal/ITBI fiscal (que inclui fração de área comum) e locação/venda efetivamente contratada na mesma métrica.
3. **Nunca afirmar o presente com base antiga:** Defesa Civil disponível chega a 2024 (com 2025 tendo apenas 1 linha no arquivo analisado); dados defasados trazem a janela explícita e jamais declaram que o problema "acabou" ou "não existe".
4. **Silêncio de base não é ausência de problema:** bairro com baixa cobertura de registros ou apenas 48 supermercados mapeados não vira "deserto urbano" nem "rua livre de alagamento" — o app informa exatamente o escopo mapeado.

---

## 3. Riscos Operacionais e de Execução (Posição Real em Novembro/2026)

- **Risco de "cemitério de camadas quebradiças":** o projeto mapeou dezenas de fontes abertas promissoras em `14/11` (eSIG, ANEEL, APAC/COP, IDEB, TJPE, AVCB, Censo). Tentar manter 25+ conectores sem prova de impacto na decisão (`CDAC`) pode explodir o custo de manutenção manual. *Mitigação ativa:* regra do `VEREDA-APPLICATION-PLAN.md` e `VE16` — cada nova base precisa justificar **valor marginal por observação mantida** e rodar com quarentena e rollback atômico.
- **Risco de cobertura geográfica estreita:** fora dos 5 bairros iniciais (`Boa Viagem`, `Casa Forte`, `Graças`, `Espinheiro`, `Madalena`), parte dos sinais ricos (rotas a pé validadas, geometria solar completa, histórico revisado) ainda não existe. Usuários em busca mais ampla podem bater na parede de cobertura até a expansão controlada (`VE16` / `Torre`).
- **Dependência de revisão humana ainda não iniciada:** as planilhas de validação `G-BUILDING`, `G-ROUTE`, `G-POI`, `G-TRANSIT`, `G-RAIN` e `G-EXTRACT` estão geradas, mas ainda dependem de revisão humana para comprovar precisão de campo antes de reivindicar exatidão pública em massa.
- **Lacuna de validação real (`G-USER` e dispositivo físico):** toda a engenharia até `VE15` foi validada por testes automatizados e navegador desktop; antes de investir pesado em aquisição paga ou campanha comercial, é indispensável validar entendimento, confiança e conversão real com pessoas procurando apartamento no celular.
