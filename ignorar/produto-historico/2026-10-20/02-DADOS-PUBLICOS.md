# Especificação de dados públicos e qualidade

**ID:** DATA-2026-10-20 · **Versão:** 1.0 · **Status:** catálogo de oportunidades e critérios de integração.

## 1. Matriz de fontes

“Página verificada” comprova publicação ou documentação, não qualidade de todas as linhas. Campos específicos do índice atual são evidência interna do [escopo v1](../../V1-ESCOPO-E-VIABILIDADE.md).

| Fonte | Uso no VEREDA | Granularidade e acesso | Estado / limite decisivo |
|---|---|---|---|
| [IPTU Recife — catálogo](https://dados.recife.pe.gov.br/dataset) | Tipologia, ano cadastral e distribuição tributária | Cadastro municipal; API/arquivos conforme recurso | Testes e campos registrados internamente; busca específica no portal não abriu nesta pesquisa. Não presumir valor devido pela unidade |
| [ITBI Recife](https://dados.recife.pe.gov.br/sl/dataset/imposto-sobre-transmissao-de-bens-imoveis-itbi) | Histórico fiscal e atividade de transmissão | Arquivos anuais; catálogo publica série até 2026 | Página verificada; ODbL; `valor_avaliacao` não se converte em aluguel |
| [Licenciamento](https://dados.recife.pe.gov.br/dataset/licenciamento-urbanistico) | Processos próximos do prédio | CSV e dicionário; publicação declara frequência diária | Página verificada; só processos 100% digitais; separar obra de atividade comercial |
| Lotes Recife | Polígono, nome de edifício e vínculo espacial | GeoJSON, conforme integração interna | Campos DSQFL, NMEDIFICACAO e QTDPAVIMENTOS registrados na v1; recurso não revalidado aqui |
| [IBGE Agregados](https://servicodados.ibge.gov.br/api/docs/agregados?versao=3) | Contexto territorial e dimensionamento de mercado | API v3 com metadados, períodos e localidades | Documentação verificada; disponibilidade geográfica depende de cada tabela |
| [Censo 2022 — agregados por setor](https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102071.pdf) | Estudos agregados sobre entorno e moradia | Arquivos e documentação censitária | Publicação localizada; revisar variável, versão e malha antes de cruzar |
| [SGB — Recife](https://rigeo.sgb.gov.br/handle/doc/15030) | Contexto de suscetibilidade e perguntas sobre acesso | Mapa, SIG, base cartográfica e elevação; produto de 2015 | Página verificada; arquivos não baixados ou analisados nesta entrega |
| [Compesa GISCOMP](https://servicos.compesa.com.br/giscomp/) | Consulta de abastecimento e roteiro sobre reserva de água | Aplicação oficial de calendário | Página verificada; não foi confirmada API pública reutilizável |
| [Anatel — cobertura](https://www.gov.br/anatel/pt-br/dados/qualidade/qualidade-dos-servicos/cobertura-da-telefonia-movel) | Preparar teste de conectividade na visita | Mapas e indicadores de cobertura modelada | Página verificada; a própria Anatel diferencia predição e experiência real |
| [Banco Central — dados abertos](https://www.bcb.gov.br/acessoinformacao/dadosabertos) | Premissas de cenários econômicos futuros | Catálogo de séries e serviços | Catálogo verificado; taxa média não substitui oferta de financiamento |
| [Fipe — índices](https://www.fipe.org.br/pt-br/indices/) | Contexto agregado do mercado | Indicadores e relatórios | Página e metodologia localizadas; não presumir licença para microdados |
| [OpenStreetMap / Nominatim](https://operations.osmfoundation.org/policies/nominatim/) | Endereços e serviços próximos | Dados abertos; instância pública com política própria | Política verificada; servidor público não é infraestrutura ilimitada |

## 2. Oportunidades novas de maior valor

### Água e reserva do condomínio

Combinar link para a consulta oficial com perguntas sobre cisterna, última interrupção e gasto extraordinário com abastecimento. Registrar resposta com data e origem. Um calendário da rede não informa sozinho a autonomia do prédio.

**Experimento:** em dez visitas, verificar se a pessoa consegue obter resposta e se isso altera preparação ou escolha. Não calcular autonomia sem volume útil, ocupação, consumo e condições operacionais.

### Rotina com chuva

A carta do SGB permite estudar contexto territorial. Antes de apresentar qualquer camada: conferir projeção, legenda, escala, abrangência e atualização; fazer revisão por alguém com experiência geoespacial. Uma sobreposição espacial pode indicar contexto de suscetibilidade, não probabilidade de dano à unidade.

**Primeira utilidade:** roteiro sobre entrada da garagem, acesso ao transporte e histórico informado pelo condomínio. “Nenhum registro encontrado” não significa “sem risco”.

### Trabalho em casa

Anatel pode contextualizar cobertura prevista; o usuário verifica ligação, conexão de dados e operadoras efetivamente instaladas no prédio. Não inferir sinal interno a partir da distância à antena nem garantir porta de fibra disponível. [Limites oficiais](https://www.gov.br/anatel/pt-br/dados/qualidade/qualidade-dos-servicos/cobertura-da-telefonia-movel).

### Histórico de mudança do entorno

Comparar versões da base de licenciamento para apontar novos processos relevantes. O diferencial é “o que mudou desde sua última análise”, com data e registro, sujeito à cobertura digital. Isso pode sustentar retenção durante uma busca ativa.

## 3. Contrato mínimo de uma evidência

| Campo | Significado |
|---|---|
| `id`, `subject_id` | Identidade estável do fato e do objeto; sem identificador pessoal |
| `source_id`, `source_url` | Origem e caminho para inspeção |
| `reference_date`, `collected_at` | Data do dado e data da consulta, separadas |
| `geographic_scope` | Município, bairro, setor, lote, prédio ou unidade |
| `value`, `unit`, `periodicity` | Valor, unidade e período; desconhecido explícito |
| `evidence_type` | Cadastro, anúncio, documento, relato ou cálculo |
| `method_version` | Regra aplicada à transformação |
| `coverage_note`, `limitations` | Limites relevantes de interpretação |
| `license_id`, `retention_rule` | Condições de uso e armazenamento |
| `review_state` | Não revisado, confirmado, divergente, obsoleto ou retirado |

Em cálculos, preservar os identificadores das entradas. Ao alterar a fonte, recalcular derivados sem substituir anotações pessoais.

## 4. Entrada de uma fonte em produção

1. Registrar responsável, licença, periodicidade declarada e endpoint.
2. Inspecionar esquema e dicionário; escolher somente colunas necessárias.
3. Processar uma amostra sem nomes, documentos pessoais ou complementos de unidade.
4. Conferir paginação, duplicatas, coordenadas, datas e contagem total.
5. Revisar manualmente amostra estratificada por bairro e casos ambíguos.
6. Comparar com a versão anterior; bloquear publicação se mudança de esquema alterar significado.
7. Publicar versão, data e relatório de cobertura, com possibilidade de retorno à versão anterior.

**Metas propostas:** 100% dos fatos publicados com proveniência; zero identificadores de contribuintes no índice distribuído; revisão de 50 vínculos cadastrais por atualização inicial, incluindo ambiguidades. A amostra é controle operacional, não comprovação estatística de precisão para toda a cidade.

## 5. Atualização e ausência de informação

| Camada | Cadência proposta do VEREDA | Comportamento se falhar |
|---|---|---|
| IPTU e lotes | Mensal para detectar nova publicação | Manter versão identificada; não trocar data de referência pela data da consulta |
| ITBI | Mensal | Suspender alegação de recência se recurso não mudou |
| Licenciamento | Semanal no piloto; avaliar diária depois | Mostrar última coleta, sem prometer alerta em tempo real |
| SGB e Censo | Ao sair nova versão oficial | Preservar ano do produto em cada uso |
| Relato de visita | A cada contribuição | Manter autoria como categoria e data; não virar fato oficial |

Cadência de coleta é decisão de operação; não muda a frequência real de atualização da fonte.

## 6. Pendências antes de expandir

- Reconferir metadados e licença de IPTU e lotes diretamente no recurso.
- Baixar e examinar a carta e os vetores do SGB; documentar adequação à escala pretendida.
- Identificar variáveis do Censo necessárias para domicílios alugados e recorte territorial; não inventar tamanho de mercado.
- Confirmar acesso estruturado ao calendário Compesa.
- Descobrir bases de equipamentos, feiras e transporte do Recife com licença e atualidade suficientes.
- Buscar acordos para anúncios e custos condominiais; dados públicos atuais não resolvem esses campos.
