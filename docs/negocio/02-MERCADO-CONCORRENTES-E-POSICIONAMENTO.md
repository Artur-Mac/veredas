# 02 — Mercado, Concorrentes e Posicionamento

**Referência:** Benchmarks ao vivo e mapeamento competitivo de **14/11/2026**, combinados com números macro verificados de Recife (IBGE Censo 2022 / FipeZAP).

---

## 1. Contexto de Mercado — Ponto de Entrada (Recife e RMR)

O mercado imobiliário de entrada combina custo alto por m², forte aceleração recente e opacidade na etapa de anúncios:

| Indicador verificado | Valor | Fonte registrada |
|---|---|---|
| Domicílios ocupados no Recife | `547.539` (`145.805` alugados = `26,6%`) | IBGE SIDRA 9928 (Censo 2022) |
| Apartamentos alugados | `58.392` no Recife (`35%` dos aptos); `97.700` na RMR | IBGE SIDRA 9928 |
| Apartamentos ocupados nos 5 bairros-piloto | `64.153` (`39%` da cidade): Boa Viagem `43.454`, Graças `7.699`, Madalena `7.081`, Espinheiro `3.951`, Casa Forte `1.968` *(~22 mil alugados se mantida a taxa de 35% — inferência)* | IBGE Censo 2022 por bairro |
| Aluguel anunciado no Recife | **R$ 64,39/m²** (set/2026 — 2º maior entre capitais, maior do Nordeste); Graças `+21,5%` em 12 meses (fev/2026) | FipeZAP |
| Rentabilidade do aluguel | **8,53% a.a.** (fev/2026 — maior entre 22 capitais) | FipeZAP |
| Venda anunciada no Recife | **R$ 9.044,83/m²** (set/2026) | FipeZAP |
| Concentração nacional dos portais | Duopólio de descoberta em **Grupo OLX** (ZAP, VivaReal, OLX, DataZAP) e **QuintoAndar** (incl. Imovelweb/Navent) | Pesquisa setorial (20/10/2026) |

**Implicação estratégica:** ninguém ganha tentando construir mais um portal de classificados para competir por liquidez de inventário contra OLX/ZAP e QuintoAndar. Por outro lado, o conflito de interesse estrutural desses portais cria um espaço aberto imediatamente **depois da busca e antes da visita/proposta**.

---

## 2. Benchmark de Portais Imobiliários (14/11/2026)

Análise feita diretamente sobre **QuintoAndar, Viva Real, OLX, ZAP, Zillow e Homes.com**:

| Aspecto | O que os portais resolvem bem | Onde falham / conflito estrutural | Onde o VEREDA se encaixa |
|---|---|---|---|
| **Escopo da jornada** | Descoberta de estoque, filtros básicos, agendamento, fluxo de proposta e contrato. | Cada anúncio isola sua narrativa; o portal depende da assinatura ou taxa sobre a transação do anunciante. | **Camada pós-anúncio neutra:** captura o anúncio salvo e acompanha a decisão comparativa do usuário. |
| **Custos e divergências** | Mostram aluguel/preço anunciado e taxas declaradas pelo anunciante (às vezes incompletas ou sem periodicidade clara). | Não cruzam condomínio/IPTU com histórico fiscal ou mudanças após republicação; cota extra e área comum ficam opacas. | Separa **Pedido (anúncio)** × **ITBI Fiscal (Sefin)** × **Locação Contratada**; soma taxas sem zerar o desconhecido; destaca a pergunta decisiva. |
| **Riscos e passivos externos** | Evitam mostrar obras ativas ao lado, trechos com histórico de alagamento ou falta de rota alternativa. | **Caso Zillow / First Street (nov/2025):** Zillow removeu notas climáticas de >1 milhão de anúncios após pressão de corretores por perda de vendas. | Exibe **fatos com fonte e data** ligados ao caminho e ao prédio, com linha do tempo `Rever anúncio` e `Desde que você guardou`. |
| **Plano de entrada local (benchmark 14/11)** | — | — | Execução P0–P2 no Recife com amostra inicial controlada (`32` anúncios piloto) e futuro canal de **feed/XML de imobiliárias** parceiras sem comprometer neutralidade. |

---

## 3. Benchmark de 9 Concorrentes de Contexto & Decisão (14/11/2026) + Referências Globais

Além dos portais de classificados, foram analisados **9 players internacionais e nacionais** focados em contexto de bairro, prédio, preço ou jornada sem intermediário:

| Referência analisada (14/11) | O que entrega hoje | Limite ou armadilha evitada pelo VEREDA | Oportunidade direta mapeada para o VEREDA |
|---|---|---|---|
| **Walk Score** | Nota única de 0–100 de caminhabilidade e trânsito (sem cobertura granular útil no Recife). | Score opaco esconde barreiras concretas (pontes, travessias perigosas, horários). | **Caminhabilidade com rota real + Plano B** (e futuro roteamento OSRM/Valhalla) em minutos até destinos da pessoa. |
| **AreaVibes** | Nota agregada de "qualidade de vida" por bairro combinando métricas heterogêneas. | Mistura percepção com estatística agregada e julga bairros inteiros de cima. | Mostrar impactos concretos no trajeto do endereço escolhido, preservando regra zero-score. |
| **Hoodmaps** | Mapa colaborativo opinativo e estereótipos de regiões. | Viés demográfico, difamação e ruído anedótico sem evidência. | Evitar opinião solta; manter eventuais contribuições futuras restritas a checagens factuais moderadas e anônimas. |
| **Rentometer** | Distribuição rápida de aluguéis pedidos ao redor de um endereço. | Usa apenas ofertas pedidas e médias geográficas simples, vulneráveis a duplicação e viés. | Combinar deduplicação de anúncios (`unidade ±2%`), **Censo 2022 de aluguel contratado** e comparáveis homogêneos com `n` explícito. |
| **Homes.co.nz** | Histórico rico de imóvel, avaliações e contexto local integrado na jornada da casa. | Depende de registro aberto de transações de compra/venda (inexistente em nível aberto unitário no Brasil). | Linha do tempo do imóvel/edifício (`Desde que você guardou` + histórico de anúncios e alvarás/ITBI fiscal onde homogêneo). |
| **NeighborhoodScout** | Relatórios pagos (US$ 30 avulso; planos US$ 125–400/mês) com índices pesados de crime e perfil de vizinhança. | Ranking de criminalidade por região reforça estigma e usa subnotificação desigual sem ajudar na rota. | Nunca dar nota de segurança/crime; detalhar condições objetivas de retorno noturno (travessias, última linha, iluminação/156, CTTU). |
| **Nomads.com** | Critérios práticos para quem trabalha remoto e escolhe onde morar (custo de vida, internet, clima, caminhada). | Foco em cidade inteira, inútil para escolher entre dois apartamentos no mesmo bairro. | Recorte **micro-urbano** para trabalho remoto: sol por fachada, ruído LUSE/via, internet/fibra checável por endereço e rotina sem carro. |
| **SíndicoNet** | Conteúdo, fornecedores e comunidade voltada à gestão de condomínios e síndicos. | Foco no síndico após a mudança, não em quem está comparando contratos. | Aproximação com **dados prediais/documentais**: balancetes, atas, AVCB e processos do CNPJ do condomínio antes da assinatura. |
| **NoBroker** | Jornada direta proprietário-inquilino/comprador buscando eliminar comissão de corretagem. | Exige liquidez pesada de dois lados (marketplace) e entra em choque regulatório/comercial direto com imobiliárias. | Não virar marketplace; atuar como **copiloto neutro do comprador/inquilino** e oferecer integração opcional a quem abre dados limpos. |

### Outros análogos estratégicos relevantes (pesquisa verificada)
- **Openigloo (Nova York):** modelo mais próximo no B2C — cruza dados oficiais da cidade por prédio e cobra por **passe temporal** (US$ 14,99–17,99 por 24h; US$ 24,99–34,99 por 3 meses) em vez de depender só de laudo avulso.
- **Reino Unido ("Material Information" / NTSELAT + Groundsure):** regulação que exige transparência prévia de imposto, riscos e obras planejadas — excelente narrativa institucional para diálogos com Procon-PE e Prefeitura.
- **Google Earth Web / Pro Avançado (benchmark 14/11):** descartado pagar US$ 75–150/mês por travas contratuais de exportação/KML; as bases 3D locais (Edificações 3D, PE3D, eSIG, EMLURB) já atendem à estratégia visual do produto (sol na fachada → sombra no caminho → linha do tempo do imóvel salvo).

---

## 4. Frase de Posicionamento Sintética

> **Para quem compara apartamentos no Recife (e futuramente em grandes capitais brasileiras), os portais ajudam a achar opções e agendar a visita — o VEREDA transforma anúncios incompletos em comparação objetiva por rotina, custos reais conhecíveis, acesso sob chuva, exposição solar e mudanças do prédio antes de assinar.**
