# Auditoria de Alegações, Estatísticas e Fontes — VEREDA
**Campus Mobile 15ª Edição — Categoria: Tecnologias Urbanas**  
**Versão:** 2.0 (Auditada & Reconciliada)

---

## 1. Classificação Epistemológica das Informações

* **[FATO AUDITADO]:** Informação respaldada por banco de dados oficial público ou estudo amostral estatístico validado.
* **[OBSERVAÇÃO AMOSTRAL DE MERCADO]:** Padrão verificado diretamente pela equipe técnica na auditoria de anúncios públicos de locação/venda.
* **[HIPÓTESE DE PRODUTO / VALIDAÇÃO]:** Premissa de negócio ou impacto urbano a ser testada experimentalmente no piloto do Campus Mobile.

---

## 2. Matriz Consolidada de Fatos, Métricas e Fontes

| Alegação no Pitch / Documentação | Classificação | Fonte Primária / Fórmula de Cálculo | Status |
| :--- | :---: | :--- | :---: |
| **"Habitação consome 36,6% do orçamento familiar brasileiro"** | [FATO AUDITADO] | **IBGE / POF (Pesquisa de Orçamentos Familiares 2017-2018):** Despesa média com habitação é o maior componente orçamentário no país. | ✅ Verificado |
| **"58% dos inquilinos têm intenção de mudar de imóvel"** | [FATO AUDITADO] | **Censo QuintoAndar / Instituto Datafolha (2022):** Alta insatisfação e mobilidade residencial no segmento de locação. | ✅ Verificado |
| **"Despesas extraordinárias de condomínio são indevidamente cobradas de locatários"** | [FATO AUDITADO] | **Lei nº 8.245/1991 (Lei do Inquilinato), Art. 22:** Reformas, fundos de reserva e melhorias prediais são obrigação legal do proprietário, mas constam comumente no boleto padrão sem contestação (Reclame Aqui / STJ). | ✅ Verificado |
| **"Portais de classificados omitem número de fachada nos anúncios"** | [OBSERVAÇÃO AMOSTRAL] | **Auditoria de 100 anúncios em SP e Recife (ZAP, VivaReal, QuintoAndar):** Omissão deliberada para evitar desintermediação comercial do corretor. | ✅ Verificado |
| **"Custos reais de habitação superam em 10% a 30% os valores de anúncio"** | [OBSERVAÇÃO AMOSTRAL] | **Auditoria de custos da equipe:** Rateios de portaria virtual, seguro incêndio obrigatório e taxa extraordinária somam de R$ 200 a R$ 600 adicionais por mês. | ✅ Verificado |
| **"Ladeira da Bela Cintra impõe trecho crítico com 8,33% de declividade"** | [FATO AUDITADO] | **Altimetria PMSP / SRTM e Tobler Hiking Function:** 620m com +22m de desnível médio (3,55%). Trecho íngreme de 180m com +15m de desnível = 8,33%. Caminhada real passa de ~7,8 min para ~9,5 min. | ✅ Reconciliado |
| **"Licenciamento de torre residencial em lote confrontante (SisRBC)"** | [FATO AUDITADO] | **Prefeitura de São Paulo / GeoSampa (Camada de Alvarás de Edificação):** Protocolo municipal de edificação vertical registrado. | ✅ Verificado |
| **"Recife possui centenas de edifícios de alvenaria resistente sob monitoramento"** | [FATO AUDITADO] | **Defesa Civil do Recife / Termo de Acordo CEF-Governo PE (2024):** Prédios-caixão com risco de colapso progressivo catalogados. | ✅ Verificado |
| **"Meta de processamento de links em 60 segundos"** | [HIPÓTESE DE PRODUTO] | Meta de SLA do pipeline de inferência automatizada para produção. Protótipo atual opera sobre demonstração com dados cacheados. | ⚠️ Em desenvolvimento |
| **"Disposição a pagar de R$ 9,90 por dossiê avulso"** | [HIPÓTESE DE PRODUTO] | Premissa de monetização transacional para usuários em busca ativa. A ser validada no piloto com 30 usuários na Etapa 2. | ⚠️ Em validação |
| **"Redução potencial de inadimplência e disputas de distrato"** | [HIPÓTESE DE IMPACTO] | Teoria da mudança do projeto: informação pré-contratual previne choque orçamentário. | ⚠️ Em validação |

---

## 3. Fontes de Dados Oficiais Integradas ao Modelo Conceitual

1. **GeoSampa (Prefeitura de São Paulo):**
   * Alvarás de Edificação e Reformas (`SisRBC`).
   * Zoneamento Urbano e Lei de Uso do Solo (`Lei 16.402/2016`).
   * Patrimônio Histórico Tombado (`CONPRESP` e `CONDEPHAAT`).
2. **IBGE / CNEFE (Censo Demográfico 2022):**
   * Cadastro Nacional de Endereços para Fins Estatísticos (coordenadas geodésicas de portas e número de pavimentos de edificações verticais).
3. **Portal de Dados Abertos do Recife & EMPREL:**
   * Cadastro Imobiliário Mercantil, Zoneamento ZPA e cartas geotécnicas de risco.
4. **OpenStreetMap & SRTM / NASA Elevation Models:**
   * Geometria de malha cicloviária, calçadas e perfil de declividade topográfica.
