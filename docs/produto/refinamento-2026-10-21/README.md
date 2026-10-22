# VEREDA — Refinamento de produto e investigação de novas evidências

**Versão 1.0 · 21/10/2026 · Status: pesquisa e propostas para decisão.**

Este pacote responde à nova rodada sobre CNEFE, CNPJ, transporte, inspeções, conectividade, público, monetização e dependências. Inclui uma análise exploratória reproduzível do cache local e uma alteração pequena já aplicada: assinatura editável nas mensagens ao corretor. As demais funcionalidades são propostas, não entregas anunciadas.

## Decisão recomendada

Validar primeiro **quem precisa do VEREDA durante uma busca real e qual decisão ele ajuda a tomar**. A vantagem proposta é transformar evidências e lacunas em ações antes da escolha do imóvel. Acumular bases sem provar essa utilidade aumenta manutenção, latência e risco de interpretação.

O segmento inicial a testar é quem está comparando apartamentos para alugar nos próximos 60 dias, dentro da cobertura atual. É hipótese de recrutamento, não público já conhecido. Compradores, pessoas em mudança de cidade e profissionais são grupos de comparação. Não presumir renda, idade, sistema operacional ou disposição a pagar com base nos cinco bairros disponíveis.

## Respostas às propostas

| Tema | Conclusão | Próximo passo recomendado |
|---|---|---|
| CNEFE | Útil e já parcialmente utilizado. Espécies amplas não distinguem todo bar/oficina; coordenadas têm níveis diferentes | Preservar precisão e testar categorias verificáveis |
| Calçada, iluminação e drenagem | São informações da pesquisa de entorno; o app usa agregação por setor | Mostrar escala e período; conferir o trajeto real na visita |
| CNPJ geocodificado | O leiaute oficial consultado não entrega coordenadas | Criar associação de endereço auditável, antes de calcular raios |
| Ônibus e radares | Podem contextualizar circulação; não demonstram ruído na janela | Validar GTFS, calendário e geometria; formular perguntas por horário |
| Última inspeção | É possível registrar documentos apresentados e conferir registros profissionais; busca pública exaustiva por prédio não foi demonstrada | Pedir laudo, data da inspeção e ART/RRT; separar cada data |
| Internet na visita | Rede móvel, Wi‑Fi e banda larga instalada são avaliações distintas | Roteiro manual primeiro; experimento nativo antes de prometer sensor |
| Público e receita | Ainda faltam evidências de comportamento e pagamento | Pesquisa com buscas em andamento e teste de oferta, sem ativar cobrança |
| Compartilhamento | A mensagem pode apresentar a marca sem parecer publicidade invasiva | Assinatura implementada: “Mensagem preparada com o VEREDA.” |

Fundamentação e fontes de cada conclusão estão nos documentos abaixo. Proximidade, cadastro e medição não são intercambiáveis.

## Documentos para leitura e execução

| Documento | Conteúdo |
|---|---|
| [01 — Dados públicos e proxies](01-DADOS-PUBLICOS-E-PROXIES.md) | Correções de premissas, EDA realizada, cruzamentos, limites e experimentos de dados |
| [02 — Conectividade e documentos de engenharia](02-VISITA-CONECTIVIDADE-E-DOCUMENTOS.md) | Viabilidade por plataforma, visita sem internet, inspeções e contratos de informação |
| [03 — Público, monetização e distribuição](03-PUBLICO-MONETIZACAO-E-DISTRIBUICAO.md) | Recrutamento, entrevistas, ofertas, economia e crescimento orgânico |
| [04 — Fraquezas, dependências e plano](04-FRAQUEZAS-DEPENDENCIAS-E-PLANO.md) | Diagnóstico atual, respostas a falhas, prioridades e decisões de investimento |
| [05 — Backlog executável](05-BACKLOG-EXECUTAVEL.md) | Tarefas pequenas com entradas, arquivos candidatos, aceite e limites de autonomia |
| [06 — Fontes e execução](06-FONTES-E-EXECUCAO.md) | Registro de consulta, verificações, mudança aplicada e limitações |
| [EDA: resultados](evidencias/eda-cnefe.json) e [script](evidencias/explorar_cnefe.py) | Contagens, método e hashes dos insumos locais |

## Como este pacote se relaciona com o anterior

A [auditoria de 20/10](../melhorias-2026-10-20/README.md) permanece histórica. Seu [registro do lote A](../melhorias-2026-10-20/06-EXECUCAO-LOTE-A.md) documenta T01, E01 e E04. Esta rodada não reabre esses itens nem inicia automaticamente o lote seguinte.

As [pesquisas de produto anteriores](../2026-10-20/README.md) continuam como contexto. Preços, percentuais de uso de portais e personas ali propostos não se tornam validados pela repetição. Este pacote corrige especialmente a ideia de que uma coordenada permite afirmar o que existe hoje em cada porta, ou que uma base aberta elimina custos operacionais.

**Vocabulário de evidência:** “consultado” significa página/documentação lida; “medido” significa saída do script local; “proposto” significa decisão de produto a validar; “não demonstrado” significa que esta pesquisa não comprovou a capacidade. Nenhuma entrevista foi realizada, nenhuma API foi contratada e nenhum documento de condomínio foi obtido.
