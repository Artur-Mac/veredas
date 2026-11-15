# 03 — Ativos de Dados, Novas Fontes, Parcerias e Moat

**Diretriz central (`D039` / ODbL):** o dado público bruto da Prefeitura (como IPTU, ITBI e Licenciamento sob licença **ODbL 1.0**) **não é fosso competitivo exclusivo** — qualquer base derivada pública precisa manter atribuição e disponibilidade sob a mesma licença. A vantagem difícil de copiar nasce da **arquitetura de vínculos auditados, série temporal própria, prioridade de revisão e fechamento de lacunas por parcerias**.

---

## 1. Onde mora o fosso competitivo real (Moat)

1. **Vínculos persistentes de identidade (`Building → Lote DSQFL → Frentes/Entradas → Trecho → Travessia → Destino`):**
   Resolver se um anúncio vago aponta para o prédio certo, qual esquina/canal bloqueia uma saída ou onde fica a entrada real exige engenharia + curadoria local. **Uma correção feita em um cruzamento ou prédio melhora automaticamente todas as comparações futuras que passam por ali.**
2. **Memória temporal independente (`Eventos + Ofertas`):**
   Importar um arquivo público hoje é trivial para qualquer concorrente; manter um ledger versionado que distingue um boletim administrativo em lote de um alagamento recorrente no mesmo trecho, acompanha reaberturas, obras posteriores e mudanças em anúncios republicados (`Desde que você guardou` / `Rever anúncio`) constrói um ativo histórico acumulável.
3. **Alocação ativa de revisão (`VE13`) em vez de coleta cega:**
   A fila priorizada mede impacto em moradores/decisões do piloto — por exemplo, **3 revisões humanas na fila de ruas da Defesa Civil resolvem 845 unidades de impacto no piloto** (contra apenas 90 via amostragem aleatória), mantendo o custo marginal de curadoria controlável.
4. **Camada neutra sobre múltiplas origens (sem dependência de um único portal):**
   Dados de parceiros ficam segregados do núcleo ODbL, permitindo combinar dados abertos municipais/federais, importações do usuário e fluxos autorizados de terceiros sem contaminar licenças.

---

## 2. Inventário de Dados em Três Camadas (Posição em 14/11/2026)

### Camada A — Já integrada ao pipeline e/ou ao aplicativo hoje
- **Cadastro e Tributário (Sefin / Prefeitura):** `7.206` prédios em 72 bairros (`2.688` nos 5 bairros-piloto); `1.319` prédios com quartis fiscais de ITBI (`630` homogêneos); `2.622/2.688` centróides a até 50 m do código oficial de logradouro.
- **Rede Pedonal Real (`OSM` datado + malha oficial):** `273.529` nós e `300.703` arestas; `76` prédios protegidos contra frentes inválidas cruzando rio/canal.
- **Transporte Programado (`GTFS v2026.10.26`):** `7.238` paradas (corrigido o antigo bug de `-0,75°` de projeção), `87.678` viagens por calendário/exceção/direção em pacote compacto no aparelho.
- **Chuva e Drenagem:** `1.645` registros Defesa Civil (`2014–2024`) consolidados em `763` observações e `31` episódios datados.
- **Geometria 3D e Insolação:** volumes prediais municipais completos nos 5 bairros (incluindo `15.701` volumes em Madalena adicionados em `VE07`).
- **Contexto Noturno e Ruído:** paradas `22h–2h`, iluminação pública vs. `156`, sinistros CTTU `2022–2024` por via, estabelecimentos com licença sonora `LUSE`.

### Camada B — Novas fontes prioritárias de Recife/PE testadas e baixadas em 14/11/2026
Em `14/11`, um levantamento técnico validou e arquivou amostras brutas de fontes oficiais ainda não plugadas na UI do app (`docs/produto/fontes-prioritarias-recife-2026-11-14.md` e `raw/fontes-prioritarias-2026-11-14/`):

| Prioridade | Fonte / Conjunto obtido (14/11) | Volume / Sinal observado | Uso estratégico no produto |
|---|---|---|---|
| **P0** | Calçadas em corredores & Semáforos sonoros/acessíveis | `159` corredores + `67` semáforos | Evolução concreta para rotas de acessibilidade e travessias reais. |
| **P0** | CONVIVA (Mercados públicos & feiras) | `17` feiras + `6` mercados | Corrige cobertura fraca de supermercados/abastecimento no piloto. |
| **P0** | EMLURB Coleta de resíduos | `5.046` registros | Dado prático de rotina (dias/horários de coleta na via, ruído matinal/noturno). |
| **P0** | IEPs (Imóveis Especiais de Preservação) | `275` polígonos | Indica restrições severas de demolição/verticalização no lote e no entorno imediato. |
| **P1** | eSIG Drenagem (5 camadas) + APAC/COP + Marinha/REMO | `54` pontos, `78` polígonos, `552` trechos, `99` canais, `514` limpezas; `7.808` pulsos de chuva; tábua de maré `14/11` | Destrava cruzamento histórico chuva × maré × ponto crítico com granularidade superior ao CSV antigo. |
| **P1** | ANEEL / Neoenergia (DEC-FEC `2025`) | `12` conjuntos espaciais cruzados nos `48` pontos de teste | Indicador factual de interrupção e duração de falta de energia por conjunto elétrico — fortíssimo para quem trabalha remoto. |
| **P1** | Censo Arbóreo, Ciclovias, Ideb `2025`, Saúde/CNES, Sisagua/Compesa, Outorga Onerosa, CPRH contaminadas, Cittamobi | `1.099` registros arbóreos; Ideb `309/192/122`; `19` outorgas | Copas viabilizam futuro teste real de sombra na caminhada (`VE07`); Ideb/CNES atendem famílias; Outorga antecipa adensamento construtivo. |

### Camada C — 12 lacunas de alto retorno mapeadas em 14/11/2026 (`mapeamento-criativo` + `conectividade`)
Estas são as descobertas mais recentes para transformar o VEREDA de piloto local em referência nacional defensável:

1. **Censo 2022 — Aluguel efetivamente contratado + FCU (IBGE):** resolve o maior ponto cego de preço no Brasil sem depender de scraping de anúncios nem confundir pedido com contrato fechado.
2. **OSRM / Valhalla (roteamento real):** substitui cálculos em linha reta para busca ampla e cálculo de amenidades na cidade inteira.
3. **Conectividade pragmática (após falha do 5G genérico):**
   - Teste na **Anatel Mosaico** provou que cobertura 5G de Claro/TIM/Vivo coloca 48/48 pontos de Recife na mesma faixa (`-90/-110 dBm`), logo um "selo 5G" não diferencia prédios.
   - Plano vencedor em 4 frentes: (i) cobertura móvel externa prevista + (ii) links profundos para consulta de viabilidade de fibra por endereço/CEP (Claro/TIM), nPerf, Ookla/SIMET + (iii) **diário offline cômodo a cômodo na visita** + (iv) piloto nativo `Expo Cellular` + parcerias com provedores locais.
4. **Camada Condominial, Jurídica e Patrimonial:**
   - **TJPE:** consulta estruturada de processos ligados ao CNPJ do condomínio (passivos trabalhistas/cíveis sem julgar mérito).
   - **AVCB (Corpo de Bombeiros PE):** situação de regularidade contra incêndio e pânico no edifício.
   - **Certidão de Matrícula (fluxo guiado RI Digital):** orientar exatamente qual certidão pedir e o que conferir antes de sinal/compra, sem intermediar cartório.
   - **CVM (FIIs):** referência adicional de portfólios e relatórios quando houver ativos institucionais no entorno/recorte.
5. **Complementos Urbanos e Educacionais:** **PVGIS** (irradiação solar calibrada por fachada), **QEdu** / Ideb por escola real na rota, **Atlas Brasil (IPEA)**, **SIDRA IBGE** (séries dinâmicas IPCA/Censo) e **CPRH balneabilidade** (crítico na faixa costeira de Boa Viagem/Pina).

---

## 3. Estratégia de Parcerias (Onde buscar dados exclusivos ou escala sem perder neutralidade)

| Tipo de Parceiro | O que o VEREDA busca | O que o parceiro ganha | Condição inegociável (Guardrail) |
|---|---|---|---|
| **Prefeitura / EMPREL / EMLURB / Defesa Civil / Grande Recife** | Acesso limpo a séries sem licença clara (eSIG, boletins de interdição/reabertura, GTFS/ônibus observado); possível contrato B2G via CPSI (`LC 182/2021`). | Devolução de auditorias úteis (ex.: inconsistências cadastrais, erros de codificação, fila priorizada) e ferramenta de transparência urbana. | Manter separação entre atribuição ODbL e camada analítica da plataforma. |
| **Imobiliárias e redes regionais (XML / Canal Pro)** | Feed estruturado autorizado de ofertas e, idealmente, dados agregados/anonimizados de fechamento para calibrar Pedido vs. Fechado. | Receber comprador/inquilino mais qualificado com roteiro objetivo e pergunta clara (reduz visitas perdidas e retrabalho do corretor). | Proibido ocultar obra, taxa extra, alagamento ou divergência cadastral mediante pagamento. |
| **Provedores de Internet Regionais (ISPs)** | Disponibilidade real de fibra até o apartamento (FTTH) por prédio/rua — dado que operadora nacional esconde atrás de formulário de CEP. | Canal qualificado para morador em mudança imediata ou trabalho remoto procurando contratação no endereço novo. | Remuneração transparente e nunca alterar evidência técnica de outros provedores. |
| **Ecossistema complementar ao comprador/inquilino** | Assessorias de comprador (`MySide` ou equivalentes), vistoriadoras (`Rede Vistorias`), garantidoras e consultorias de realocação (RH). | Ferramenta pronta para clientes que precisam decidir em dias ou à distância com menos atrito pós-assinatura. | Avaliar regulação CRECI / CNSP / CMN antes de qualquer cobrança por indicação. |
