# Dados, proxies e novas utilidades

## EDA já executada: cobertura e capacidade de discriminação

Base: cinco arquivos locais gerados em 20/10/2026 às 16:17:16 UTC. Código reprodutível: [explorar_indice.py](evidencias/explorar_indice.py). Resultado com hashes dos insumos: [eda-indice.json](evidencias/eda-indice.json). Executar da raiz com `python3 docs/produto/melhorias-2026-10-20/evidencias/explorar_indice.py`.

| Bairro | Edifícios | Com quartis ITBI por unidade | Com pedido de drenagem a 150 m | Com sinistro com vítima a 150 m | Compatíveis só com 70 m² |
|---|---:|---:|---:|---:|---:|
| Boa Viagem | 1.879 | 901 | 1.745 | 1.817 | 106 |
| Casa Forte | 82 | 38 | 64 | 72 | 9 |
| Espinheiro | 156 | 79 | 156 | 151 | 10 |
| Graças | 291 | 172 | 282 | 271 | 7 |
| Madalena | 280 | 129 | 268 | 277 | 36 |
| **Total** | **2.688** | **1.319** | **2.515** | **2.588** | **168** |

Outros resultados: 2.687 edifícios têm polígono; todos têm setor associado; 1.749 têm obra relevante nos últimos 24 meses usados pelo índice. Associação ao setor não prova completude de cada variável. Os arquivos somam 2.807.874 bytes, sem compressão; isso não mede bundle ou RAM.

**Interpretação:**

- Só 49,1% têm os quartis fiscais por unidade considerados no índice. O comparativo fiscal precisa de um estado útil quando a referência não existe; ausência não é preço justo nem dado zero.
- 93,6% têm algum pedido de drenagem próximo e 96,3% algum sinistro com vítima próximo nos períodos embarcados. Presença binária quase universal é pouco útil para diferenciar opções. Não equivale a risco individual, frequência de alagamento ou chance de acidente.
- Boa Viagem representa 69,9% dos edifícios. Métrica agregada tende a refletir esse bairro; comparar por bairro e cobertura antes de generalizar.
- Área sozinha gera dezenas de candidatos. O buscador limita apresentação a oito, mas esse limite não reduz a ambiguidade real.
- Não somar ocorrências de todos os edifícios: círculos de 150 m se sobrepõem e o mesmo evento pode aparecer várias vezes. A tabela conta edifícios com sinal, não eventos únicos.

Limites: análise descritiva do índice tratado, sem reprocessamento dos registros brutos nem validação de campo. A contagem de área reproduz apenas a tolerância da área, não a pontuação completa com nome/endereço/andar. Não é amostra aleatória do Recife.

## D01 · Avaliar identificação antes de alterar pesos

**Pergunta:** quais campos realmente reduzem erro de identificação? **Entrega:** relatório e conjunto de avaliação, não novo modelo opaco.

1. Selecionar inicialmente 50 casos, dez por bairro, com endereço confirmado por revisão independente e diferentes quantidades de informação. Usar casos sintéticos derivados do cadastro para regressão; ampliar com anúncios autorizados para medir generalização.
2. Criar variantes: área+bairro, nome, rua sem número, rua+número, abreviação, erro de digitação, andar incompatível. Separar famílias de edifícios entre ajuste e avaliação.
3. Medir acerto no primeiro candidato, presença do correto entre os oito, abstinência correta e falso vínculo quando o edifício não está no índice. Medir esforço do usuário para fornecer informação adicional.
4. Relatar por bairro e tipo de entrada. Comparar regra atual com nova apresentação E01 antes de mexer em pesos.
5. Gate proposto: nenhuma confirmação automática; versão nova não piora falso vínculo no conjunto retido. Não apresentar porcentagem de confiança sem calibração em dados independentes suficientes.

## D02 · Investigar sinais de rua sem transformar registro em diagnóstico

**Pergunta:** o sinal mantém significado quando mudamos período, raio e qualidade do endereço? Requer registros de origem e geometria; a tupla agregada atual não permite reconstruir os raios.

**Plano executável:**

1. Usar scripts de `scripts/dados/rua/` como ponto de entrada. Guardar manifestos de versão/URL/hash, filtrar períodos explicitamente e trabalhar em saída separada do índice publicado.
2. Deduplicar por ID da fonte quando houver; sem ID, documentar chave composta e risco de remover eventos distintos. Classificar geocodificação exata, aproximada e só logradouro; esta última não entra como ponto exato de edifício.
3. Produzir agregados para 75/150/300 m e janelas disponíveis. Comparar proporção de edifícios com sinal, estabilidade das perguntas geradas e sensibilidade a pontos incertos.
4. Para tempo de atendimento, distinguir aberto, encerrado e tempo ausente; reportar tamanho de amostra e mediana apenas dos casos com datas válidas. Casos não encerrados não entram como zero dias.
5. Revisar manualmente 30 localizações estratificadas. Se erro de localização mudar a mensagem ao usuário, ampliar a amostra e bloquear aquela mensagem até resolver.
6. Entregar tabela de cobertura, duplicação, perdas e sensibilidade. Não publicar índice composto de “qualidade de rua”.

**Regra de liberação:** cada texto deve sobreviver a revisão de origem e escala. Se o sinal for fraco, perguntar “Vale observar a drenagem na visita” com o fato e período; não afirmar “este imóvel alaga”.

## D03 · Selecionar perguntas pela utilidade, sem dar nota ao imóvel

**Hipótese:** três perguntas relacionadas às prioridades da pessoa ajudam mais que dez alertas genéricos. Testar com prioridades voluntárias de rotina: caminhar, tranquilidade, orçamento, acessibilidade. Não inferir características pessoais nem usar renda ou composição demográfica para classificar bairros.

**Regra inicial transparente:** até três destaques; primeiro incoerência de custo informada, depois sinal ligado à prioridade escolhida, depois pendência específica do imóvel. Desempate por força da evidência e atualidade do período, nunca por impacto emocional. Demais fatos continuam acessíveis. Não ocultar pendências financeiras para obter lista mais curta.

**Experimento:** cinco a oito pessoas com tarefa de escolha/visita, comparar lista atual e lista priorizada em ordem alternada. Medir compreensão da fonte, pergunta que levariam à visita, falsos entendimentos e esforço; amostra exploratória, sem alegar significância estatística. Gate: nenhuma interpretação de registro público como certeza sobre a unidade; pelo menos 4/5 entendem origem e próximo passo. Ajustar texto antes de adicionar nova base.

## Catálogo de proxies: uso permitido e evidência que falta

| Sinal disponível | Pode ajudar a perguntar | Não permite concluir | Validação/implementação |
|---|---|---|---|
| Pedidos 156 de drenagem | “Como a rua fica depois de chuva forte?” | Frequência real de alagamento ou dano na unidade | D02; distinguir recorrência de duplicação |
| Licença de som vigente | “Como é o ambiente à noite e no fim de semana?” | Decibéis, infração ou incômodo dentro do imóvel | Cruzar horário/atividade se houver campo válido; visita em dois horários |
| Ponto de luz desativado | “O caminho está iluminado?” | Insegurança ou apagão atual | Data do inventário e confirmação de campo |
| Coleta noturna na rua | “Onde ficam os resíduos e a coleta interfere no descanso?” | Mau cheiro, ruído ou horário exato em todos os dias | Manter múltiplos trechos/horários; não escolher um arbitrariamente |
| Sinistros com vítima próximos | “Como é atravessar o caminho que você usa?” | Probabilidade individual ou trajeto seguro | Geocodificação, período e rede viária; raio não é caminho |
| Calçadas, obstáculos e rampas do Censo | “O trecho até o destino é acessível?” | Rota integral acessível em 2026 | Escala de setor/face e observação atual do percurso |
| Árvores do entorno | “Onde há sombra no seu horário?” | Temperatura interna ou redução de graus Celsius | Observação de horário/fachada; Censo não mede conforto térmico da unidade |
| Obra licenciada próxima | “Há obra ativa? Em que fase?” | Obra em execução, prazo ou ruído atual | Status do processo e visita/documento recente |
| Atendimentos da Defesa Civil por rua | “O registro se refere a este endereço?” | Problema estrutural deste prédio | Número/unidade não resolvidos; confirmação pessoal não vira laudo técnico |
| Idade cadastral do prédio | “Quais sistemas foram renovados?” | Má conservação ou necessidade de reforma | Atas, inspeção e histórico de manutenção |
| Transmissões ITBI | “Há referências fiscais suficientes?” | Liquidez, dias para vender ou preço de mercado | Distinguir tipo de transação e amostra; não dividir área ITBI total por área privativa |
| Domicílios alugados na área de ponderação | Contexto amplo de ocupação | Vacância, procura atual, perfil de vizinhos | Denominador e escala corretos; baixo valor para decisão de uma unidade |

O IBGE descreve o entorno como características do espaço público levantadas no Censo 2022. Isso sustenta o cuidado de escala acima, não uma medição atual da unidade. [Descrição oficial](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/tipologias-do-territorio/24702-caracteristicas-urbanisticas-do-entorno-dos-domicilios.html), consultada nesta revisão em 20/10/2026. Fontes municipais e períodos do índice estão em `src/dados/recife/indice/meta.json`; não foram todos rebaixados da internet nesta rodada.

## Novas utilidades em ordem de retorno provável

1. **Pendências de orçamento:** reutilizar custo incompleto para checklist do que pedir ao corretor; custo baixo, sem API, melhora a função já existente. Prévia copiável com os campos ausentes, sem enviar automaticamente mensagem a terceiros. Medir pendências resolvidas.
2. **Duas visitas complementares:** roteiro diurno/noturno ou após chuva, escolhido pela pessoa a partir dos sinais. Não prometer previsão meteorológica nem exigir nova API no MVP. Registrar horário real da observação e mudança de resposta.
3. **Resumo da decisão pessoal:** dois imóveis, custos conhecidos, três perguntas ainda abertas e observações da pessoa. Sem vencedor automático. Exportação como texto antes de PDF sofisticado; dependente de E04/E05.
4. **Documentos do condomínio com evidência:** começar com anexos e referência manual a página; testar extração assistida depois. OCR/IA paga exige backend, consentimento de envio, prazo de retenção e trechos verificáveis. Não é requisito para os primeiros lotes.
5. **Caminho habitual:** pessoa informa destino e abre aplicativo de mapas; não armazenar endereço de trabalho por padrão. Tempo e rota dentro do VEREDA só após decisão de fornecedor, licença e custo por consulta.

APIs pagas, preços, Kenlo e alternativas permanecem no [levantamento de fornecedores](../2026-10-20/03-APIS-E-FORNECEDORES.md) e na [pesquisa posterior](../pesquisa-2026-10-20/02-APIS-E-FORNECEDORES.md). A documentação Kenlo aberta no navegador não é autorização de acesso nem prova de contrato. Nesta fase, não há justificativa demonstrada para contratar API: as primeiras melhorias usam código e bases já disponíveis. Revalidar preço/cobertura/termos antes de qualquer contratação.
