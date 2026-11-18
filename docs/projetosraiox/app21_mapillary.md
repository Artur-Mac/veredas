# app21 — Mapillary

Coleta: 17/11/2026. Fontes: `mapillary.com` (home, `/platform`, `/datasets`, `/automate-mapping`, `/open-data`, `/developer`, `/technology`, `/osm`, `/cameras`).

## 1. Identificação da Solução

- **Nome:** Mapillary, **parte da Meta** desde 2020. Sediada na Suíça.
- **URL:** https://www.mapillary.com.
- **Público-alvo:** comunidade de mapeamento, **OpenStreetMap**, times de GIS, pesquisa em visão computacional, e empresas (ArcGIS, HERE).
- **Proposta central:** **imagem de nível de rua colaborativa e aberta** — mais de **3 bilhões de imagens** — processada por visão computacional para extrair **dados de mapa**, com ferramentas para qualquer pessoa contribuir.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Base de imagem
- **+3 bilhões de imagens** de nível de rua no mundo.
- Captura com **qualquer câmera**: celular, ação, 360°, dashcam, equipamento profissional.
- Visualizador que **combina imagens em vistas 3D** e permite **comparar ao longo do tempo**.
- **Upload via CLI** e apps móvel/desktop.
- **Hospedagem de imagem de rua** como serviço para quem tem acervo próprio.

### 2.2 Extração automática (o núcleo técnico)
- Todas as imagens são processadas para criar **visualizações 3D** e **extrair dados de mapa**.
- Visão computacional reconhece **feições e sinais de trânsito**.
- Produtos derivados: camada de sinalização, pontos de interesse, geometria.
- Alimenta o **OpenStreetMap** (edição assistida) e o **HERE Map Creator**.

### 2.3 Privacidade por desenho
- **Desfoque automático de rostos e placas** feito por algoritmo, com ferramentas de edição manual quando necessário.
- É um requisito que viabiliza uso comercial e publicação de dado derivado.

### 2.4 Dados abertos e datasets de pesquisa
- **Open data** com licença de atribuição (a base é usada por pesquisadores e por empresas).
- Datasets publicados para treinar modelos: **CrowdDriven**, **Metropolis**, **Planet-Scale Depth** (750 mil imagens com profundidade métrica), **Street-level Sequences** (1,6 milhão), **Traffic Sign** (100 mil imagens, 300+ tipos), **Vistas** (25 mil imagens, 152 categorias de segmentação).
- **OpenSfM** — biblioteca aberta de estrutura-a-partir-do-movimento usada no pipeline.

### 2.5 Integrações
- **ArcGIS** (Esri) — camada de imagem dentro do fluxo GIS.
- **Mapillary JS** — visualizador embutível.
- **API** para consulta de imagem e feições por área.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** sequências de imagem com GPS, enviadas por qualquer pessoa; consulta por *bounding box* ou coordenada.

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Imagem de rua | colaboradores, empresas, prefeituras | aberto (CC BY-SA) |
| GPS e orientação | EXIF / app | aberto |
| Feições extraídas | visão computacional própria | aberto |
| Geometria 3D | OpenSfM | aberto |

**Artefato final:** imagem georreferenciada, camada de feição, modelo 3D esparso, conjunto de dados de treino.

## 4. Mecânica de UI/UX e Visualização

- **Mapa com cobertura de imagem** como indicação de onde há dado.
- **Visualizador embutível** que mostra a rua na posição e no tempo.
- **Comparação temporal** no mesmo ponto — o recurso que revela obra, poda, calçada nova.
- **Contribuição como fluxo**: baixar app → gravar → subir; sem curadoria prévia.
- **Atribuição visível** em todo uso, o que sustenta a licença aberta.

## 5. Regras de Negócio e Monetização

- **Modelo:** plataforma aberta, financiada pela Meta; receita por **serviços** (hospedagem de imagem, integração GIS, datasets, suporte) e pelo valor estratégico de manter um mapa global atualizado.
- **Moat:**
  1. **3 bilhões de imagens** — escala impossível de replicar.
  2. **Pipeline de visão computacional** já treinado em diversidade global.
  3. **Licença aberta** que garante adoção por OSM, pesquisa e GIS.
  4. **Desfoque automático** que resolve o problema jurídico de publicar imagem de rua.

## 6. Aplicação Direta no VEREDA

O VEREDA tem `A27` (extração de imagem de rua auditada) **adiado** justamente porque não há fonte de imagem nem equipe de campo. O Mapillary é a única via realista de destravar isso sem campo.

### 6.1 Antes de qualquer coisa: medir a cobertura em Recife
Este é o passo zero, e ele é barato: consultar a API do Mapillary por *bounding box* nas **seis áreas habilitadas** e contar sequências por rua. Sem isso, qualquer plano é especulação.

Critério de decisão sugerido:
- **> 60% das ruas das seis áreas com imagem dos últimos 3 anos** → `A27` deixa de estar bloqueado por fonte.
- **30–60%** → usar só como **verificação pontual** de entrada e travessia (que é o que o `A03`/`A27` precisam).
- **< 30%** → manter adiado e registrar a medição.

### 6.2 O que extrair, e só isso
O `FEATURE-REGISTER` já define o escopo do `A27`: **rampa, travessia, barreira, sombra, marquise e obra visível**. Nada de "qualidade da calçada" (bloqueado por P09) nem de "sensação de segurança". Com imagem aberta e licença de atribuição, o fluxo correto é:

1. modelo propõe candidatos (rampa/travessia);
2. **humano revisa** e confirma;
3. o fato entra com **fonte, data da imagem e coordenada**;
4. o que não foi confirmado **não aparece**.

Esse é exatamente o modelo do Mapillary — "máquina propõe, humano edita" — e é o que `A29` (alocação de revisão) já prevê.

### 6.3 Comparação temporal como feature de baixo custo
O Mapillary permite ver o **mesmo ponto em datas diferentes**. Aplicação ao VEREDA: quando houver duas imagens do mesmo trecho, mostrar "a calçada tinha rampa em 2023 e não tem em 2026". Isso é **mudança observada**, não previsão — cabe inteiro na postura do produto e alimenta o `DesdeQueSalvou`.

### 6.4 Desfoque e LGPD como pré-requisito
O VEREDA publica derivado, não imagem. Ainda assim, se algum dia exibir miniatura, o padrão do Mapillary (desfoque automático de rosto e placa) é o mínimo. **Recomendação forte: publicar apenas o fato derivado**, com link para a imagem original — evita risco e reduz peso.

### 6.5 Datasets de pesquisa não são fonte operacional
Os datasets (Vistas, Traffic Sign, Depth) são para **treinar modelo**, não para consultar endereço. O VEREDA não deve treinar modelo próprio: usaria o modelo pré-treinado do Mapillary via API/serviço.

### 6.6 O que **não** copiar
- **Contribuição aberta de imagem pelo usuário**: cria risco de privacidade e moderação.
- **Hospedagem de acervo**: infraestrutura sem retorno.
- **Promessa de cobertura nacional**: Recife é o limite.
- **Uso de imagem como prova**: imagem de rua não é laudo.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| **Medição de cobertura em Recife** | consulta à API | **pequeno — fazer primeiro** |
| Extração assistida de rampa/travessia | imagem Mapillary | grande (depende da cobertura) |
| Comparação temporal de um ponto | imagem | médio |
| Miniatura com desfoque | imagem | pequeno (mas evitar) |
