# Checklist de Submissão e Conformidade — Campus Mobile 15ª Edição

> **Programa:** Campus Mobile 15ª Edição (2026/2027)  
> **Realização:** Instituto Claro, LSI-TEC, LSI-USP e beOn Claro  
> **Categoria Oficial:** Tecnologias Urbanas (Item 1.3.6 do Regulamento)  
> **Prazo Final de Inscrição:** 18 de Outubro de 2026  
> **Equipe:** Artur Maciel, Samuel, Walter

---

## 1. Verificação de Elegibilidade da Equipe (Item 2 do Regulamento)

- [x] **Composição da Equipe:** Exatamente 3 integrantes (máximo permitido).
- [x] **Vínculo Acadêmico:** Estudantes universitários de graduação ou pós-graduação (ou recém-formados em até 12 meses).
- [x] **Complementaridade de Perfis:**
  - *Artur Maciel:* Engenharia de Dados, Arquitetura de Software e Conexão Geoespacial.
  - *Samuel:* Estratégia de Produto, Pesquisa com Usuários e Métricas de Decisão.
  - *Walter:* Design de Produto, Identidade Editorial e Direção de Arte.

---

## 2. Campos Obrigatórios do Formulário de Inscrição

### A. Identificação do Projeto
- **Nome do Projeto:** `VEREDA` (Não utilizar o nome anterior PropSight).
- **Categoria:** `Tecnologias Urbanas`.
- **Uma Frase (Pitch Resumido):**  
  *"Plataforma mobile que transforma links de anúncios imobiliários em dossiês de decisão auditados com dados públicos, revelando custos ocultos, atritos urbanos e roteiros práticos de vistoria."*

### B. Descrição do Problema e Público-Alvo
- [x] **Problema Claro:** Assimetria crônica de informação na escolha de moradia gerada pelo conflito de interesses dos portais imobiliários (que omitem endereços, obras vizinhas e custos reais de condomínio para inflar leads de corretores).
- [x] **Público-Alvo:** Cidadãos urbanos (inquilinos e compradores de primeira viagem) em busca de moradia nas regiões metropolitanas de São Paulo e Recife.
- [x] **Evidência do Problema:** 73% relatam atritos não declarados pós-mudança (Censo de Moradia QuintoAndar/Datafolha).

### C. Solução Proposta e Diferenciação
- [x] **Mecanismo:** Intake sem fricção por link ou endereço ➔ Resolução cadastral via CNEFE/IBGE ➔ Auditoria territorial via GeoSampa/EMPREL ➔ Dossiê de Evidências baseado na Tríade: *Fato* ➔ *Impacto* ➔ *Ação*.
- [x] **Inovação Principal:**
  1. O paradigma de *Incertezas como Funcionalidade* ("Ainda Não Sabemos" é valor de 1ª classe que vira pergunta de WhatsApp).
  2. Substituição de scores arbitrários (0 a 10) por sínteses narrativas de trade-offs.
  3. Fusão determinística de dados abertos sem raspagem ilegal de portais.

### D. Impacto Social Urbano
- [x] **Relevância para a Cidade:**
  - Redução do superendividamento familiar por gastos habitacionais ocultos.
  - Proteção contra riscos de desabastecimento hídrico (rodízios Compesa/Sabesp) e áreas de alagamento pluvial.
  - Transparência do planejamento urbano municipal colocada diretamente na mão do cidadão.

### E. Viabilidade Técnica e Execução
- [x] **Protótipo Funcional:** Protótipo mobile autônomo, leve (78 KB) e responsivo já construído e testado (`index.html`).
- [x] **Fontes de Dados Abertas Homologadas:** GeoSampa (WFS), CNEFE/IBGE 2022, SisRBC, SEDEC Defesa Civil.
- [x] **Zero Riscos Legais de Scraping:** O projeto não realiza raspagem massiva de portais imobiliários.

### F. Sustentabilidade Financeira
- [x] **Modelo de Negócio:** Freemium B2C (2 dossiês grátis, R$ 9,90 por dossiê adicional) e B2B2C (qualificação de risco para seguradoras de fiança locatícia).

---

## 3. Materiais Complementares e Links

- [x] **Repositório Git Limpo:** Repositório estruturado sem scripts proibidos de scraping (`https://github.com/Artur-Mac/veredas.git`).
- [x] **Apresentação Executiva (Pitch Deck):** Estrutura de 8 slides disponível em `docs/pitch/deck_slides.html` e `docs/pitch/pitch_storyline.md`.
- [x] **Roteiro de Fala (Speaker Script):** Script de 3 minutos cronometrado para a banca em `docs/pitch/speaker_script.md`.
- [x] **Roteiro para Vídeo Conceitual (Opcional - 1 a 2 min):** Mapeado no Bloco 4 do Storyline.

---

## 4. Matriz de Alinhamento com a Pontuação da Banca

| Critério Oficial Campus Mobile | Peso | Como o VEREDA Garante Nota Máxima |
| :--- | :---: | :--- |
| **Capacidade Técnica da Equipe** | 3 / 16 | Protótipo funcional leve construído do zero, benchmark automatizado em Python (`run_benchmarks.py`) e arquitetura de dados públicos sólida. |
| **Atitude Criativa e Empreendedora**| 3 / 16 | Posicionamento original como "Advogado de Decisão do Inquilino" em vez de tentar criar um portal concorrente. |
| **Autonomia e Liderança** | 2 / 16 | Pesquisa profunda independente (70k+ palavras no arsenal) e validação em duas capitais brasileiras (SP e Recife). |
| **Objetividade e Clareza** | 1 / 16 | Jornada linear: *Cola Link* ➔ *Auditoria* ➔ *Dossiê* ➔ *Ação no WhatsApp*. |
| **Originalidade e Inovação** | 2 / 16 | Fim dos scores genéricos opacos; introdução de "Ainda Não Sabemos" e perfil altimétrico real. |
| **Viabilidade Técnica** | 2 / 16 | Uso de APIs públicas gratuitas existentes e modelos leves de inferência. |
| **Impacto no Meio Urbano** | 3 / 16 | Empoderamento do cidadão frente a assimetrias de mercado e promoção de cidades mais justas. |
