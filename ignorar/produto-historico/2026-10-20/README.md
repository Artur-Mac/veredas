# VEREDA — Dossiê de evolução de produto

> Nova rodada: [refinamento de 21/10 — dados urbanos, conectividade, público, monetização e dependências](../refinamento-2026-10-21/README.md), com análise exploratória local e backlog executável.

> Atualização: a [avaliação do app e plano executável de melhorias](../melhorias-2026-10-20/README.md) compara a implementação atual com o protótipo, registra testes e detalha tarefas para execução.
**Versão:** 1.0 · **Data:** 20/10/2026 · **Status:** proposta para decisão, não compromisso de entrega  
**Escopo:** evolução da prova de conceito para um produto de apoio à decisão de moradia no Recife.

## Decisão recomendada

Concentrar a próxima etapa em **quanto custa morar, o que falta confirmar e quais perguntas fazer antes de decidir**. A diferenciação proposta é ligar informações de anúncio, cadastro, documentos e visita, preservando a origem de cada informação.

O produto deve entregar valor mesmo sem conseguir identificar o prédio. Confirmar endereço pode enriquecer o dossiê, mas não deve impedir orçamento, comparação e preparação da visita.

## Documentos

| Documento | Decisão que ajuda a tomar |
|---|---|
| [01 — PRD de evolução](01-PRD-EVOLUCAO.md) | O que desenvolver, para quem, com quais critérios de aceite |
| [02 — Dados públicos e qualidade](02-DADOS-PUBLICOS.md) | Quais dados sustentam quais afirmações |
| [03 — APIs e fornecedores](03-APIS-E-FORNECEDORES.md) | O que comprar, testar ou negociar; preços e limites |
| [04 — Preços e viabilidade econômica](04-PRECOS-E-VIABILIDADE.md) | Como cobrar, estimar custos e testar margem |
| [05 — Estratégia e oportunidades](05-ESTRATEGIA-E-OPORTUNIDADES.md) | Segmento inicial, distribuição e sequência de expansão |
| [06 — Validação e governança](06-VALIDACAO-E-GOVERNANCA.md) | Como medir valor, evitar conclusões falsas e decidir investimentos |
| [07 — Registro de fontes](07-FONTES.md) | Evidências consultadas, datas e pendências |

## Principais achados

1. **A base pública de licenciamento tem cobertura incompleta por definição.** O portal informa que inclui apenas processos 100% digitais. O produto pode mostrar registros encontrados, nunca concluir que não existem obras pela ausência deles. [Fonte municipal](https://dados.recife.pe.gov.br/dataset/licenciamento-urbanistico).
2. **Há material público sobre suscetibilidade a inundação para Recife.** O SGB disponibiliza mapa e arquivos vetoriais de 2015. É uma oportunidade de pesquisa espacial; ainda não é uma função pronta de diagnóstico de imóvel. [SGB](https://rigeo.sgb.gov.br/handle/doc/15030).
3. **Uma API barata pode ser inadequada para um cadastro permanente.** Google Geocoding restringe armazenamento e apresentação; Mapbox distingue geocodificação temporária de permanente. Isso afeta a arquitetura do dossiê. [Google](https://developers.google.com/maps/documentation/geocoding/policies), [Mapbox](https://www.mapbox.com/pricing).
4. **Leitura básica de documentos tem baixo custo nominal.** O OCR do Google é divulgado a US$ 1,50 por mil páginas na faixa inicial paga; interpretação e revisão são custos separados. [Document AI](https://cloud.google.com/document-ai).
5. **O acesso a anúncios pode evoluir por parceria.** A Kenlo documenta API para parceiros, sujeita a contrato. Isso não equivale a acesso irrestrito ao mercado. [Kenlo Open API](https://kenlo-open-api-prd.kenlo.io/docs/v2.html).
6. **A hipótese comercial preferida é um pacote por período de busca.** Assinatura mensal B2C precisa provar recorrência; pacote de cinco análises a R$ 49,90 é hipótese de teste, não preço validado.

## Relação com o trabalho em andamento

Base interna: [escopo vigente](../../V1-ESCOPO-E-VIABILIDADE.md), [validação registrada](../../POC-VALIDACAO.md) e [plano da POC](../../PLANO-POC-EXECUCAO.md). A documentação descreve estágios diferentes e o código está sendo alterado em paralelo; este dossiê não certifica o estado atual da implementação.

Estas propostas não substituem a ordem de execução da v1, não alteram o roteiro travado e não aplicam números demonstrativos do pitch ao produto operacional. Nenhuma integração foi contratada, nenhum fornecedor foi contatado e nenhuma alteração funcional foi feita nesta pesquisa.

## Como interpretar as evidências

- **Verificado na web:** página oficial ou documentação consultada nesta pesquisa.
- **Registrado internamente:** resultado relatado em documento do projeto, sem repetição do teste aqui.
- **Hipótese proposta:** funcionalidade, meta, preço ou premissa que precisa de validação.
- **Pendente:** disponibilidade técnica, cobertura, licença ou contratação ainda não demonstrada.

As páginas foram consultadas em 20/10/2026. Tarifas são fotografias da consulta, em moeda original, sem garantia de preço futuro. Não foram usadas credenciais pagas nem executados benchmarks autenticados. A tentativa de consultar metadados CKAN pelo terminal falhou por resolução de rede; as verificações externas desta entrega usam páginas e documentação acessíveis pela pesquisa web.
