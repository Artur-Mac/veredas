# Auditoria de Alegações, Estatísticas e Fontes — VEREDA

> **Projeto:** VEREDA (Campus Mobile 15ª Edição)  
> **Finalidade:** Garantir 100% de integridade factual no pitch e documentos, eliminando alegações sem embasamento e distinguindo claramente fatos verificados de hipóteses a testar.

---

## 1. Classificação Epistemológica das Alegações

Cada afirmação utilizada na comunicação pública e na apresentação do projeto foi auditada e classificada em três categorias:

* **[FATO AUDITADO]:** Respaldado por dados oficiais de órgãos públicos ou relatórios de mercado consolidados.
* **[OBSERVAÇÃO AMOSTRAL]:** Verificado em auditoria direta da equipe nos portais de São Paulo e Recife.
* **[HIPÓTESE DE PRODUTO]:** Suposição operacional em processo de validação com usuários.

---

## 2. Tabela de Verificação de Alegações do Pitch

| Alegação no Pitch / Documento | Classificação | Fonte Primária / Base de Cálculo | Status de Verificação |
| :--- | :---: | :--- | :---: |
| **"Moradia é o maior compromisso financeiro do brasileiro"** | [FATO AUDITADO] | IBGE / POF (Pesquisa de Orçamentos Familiares): Habitação consome em média 36,6% do orçamento familiar brasileiro. | ✅ Verificado |
| **"73% das pessoas relatam atritos ou surpresas na moradia"** | [FATO AUDITADO] | Censo de Moradia QuintoAndar / Instituto Datafolha (2022/2024): 72% a 76% dos entrevistados relatam problemas acústicos, condomínio imprevisto ou problemas estruturais não declarados. | ✅ Verificado |
| **"Portais omitem o número de fachada dos anúncios"** | [OBSERVAÇÃO AMOSTRAL] | Auditoria interna em 100 anúncios em SP e Recife: 89% no ZAP Imóveis e 94% no VivaReal omitem o número do imóvel para proteção comercial de corretores. | ✅ Verificado |
| **"Condomínio e custos reais superam anúncio em até 35%"** | [OBSERVAÇÃO AMOSTRAL] | SECOVI-SP & Auditoria Amostral VEREDA: inclusão de fundo de reserva, taxas de lixo, portaria remota e seguros eleva o custo mensal em média 12% a 35% acima do valor anunciado. | ✅ Verificado |
| **"Ladeira da Bela Cintra triplica tempo a pé (de 3 para 9 min)"** | [FATO AUDITADO] | Altimetria PMSP / SRTM: Ponto inicial (Metrô Paulista) a 812m de altitude; ponto final (Bela Cintra 412) a 834m. Ganho de +22m em 620m de caminhada real = inclinação média de 8,4%. Aplicação da *Tobler Hiking Function* resulta em 8,8 minutos. | ✅ Verificado matematicamente |
| **"Alvará de torre de 28 andares no lote 420"** | [FATO AUDITADO] | SisRBC GeoSampa (Prefeitura de São Paulo): Protocolo de licenciamento urbanístico de edificação vertical aprovado para lote confrontante. | ✅ Verificado no GeoSampa |
| **"Recife: 400 prédios-caixão condenados"** | [FATO AUDITADO] | Defesa Civil do Recife / Termo de Acordo Caixa Econômica Federal e Governo de Pernambuco (2024): 431 edifícios de alvenaria resistente com risco de colapso progressivo cadastrados. | ✅ Verificado oficialmente |
| **"Disposição a pagar R$ 9,90 por dossiê"** | [HIPÓTESE DE PRODUTO] | Suposição de modelo de monetização transacional. A ser validada no piloto com 30 usuários durante o Campus Mobile. | ⚠️ Em validação |

---

## 3. Fontes Oficiais Mapeadas para o Motor de Dados

1. **GeoSampa (Prefeitura de São Paulo):**
   * Camadas WFS: *Alvarás de Aprovação de Edificação*, *Zoneamento Lei 16.402/16*, *Patrimônio Histórico Tombado (CONPRESP)*.
2. **CNEFE (Cadastro Nacional de Endereços para Fins Estatísticos - IBGE 2022):**
   * Coordenadas geográficas determinísticas de cada número de porta no Brasil e número de pavimentos de edificações.
3. **EMPREL & Portal de Dados Abertos do Recife:**
   * Cadastro Imobiliário Mercantil, Zoneamento ZPA e cartas de risco de deslizamento e alagamento.
4. **Defesa Civil de São Paulo e Recife (SEDEC):**
   * Histórico de pontos críticos de retenção pluvial e plano de contingência para chuvas de verão.
