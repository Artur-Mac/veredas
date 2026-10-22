# 06 — Fontes, execução e limitações

**Consulta e execução: 21/10/2026.** Fontes primárias foram priorizadas. Acesso a documentação não significa teste autenticado de API ou ensaio de campo. As URLs abaixo sustentam os fatos técnicos; recomendações, metas e preços do pacote são propostas próprias.

## 1. Registro das fontes

| Fonte | Evidência utilizada | Situação nesta rodada |
|---|---|---|
| [IBGE — CNEFE](https://www.ibge.gov.br/estatisticas/sociais/populacao/38734-cadastro-nacional-de-enderecos-para-finsestatisticos.html) | Cadastro, usos e referência censitária | Página oficial localizada e conteúdo consultado |
| [IBGE — diretório CSV](https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/Censo_Demografico_2022/Arquivos_CNEFE/CSV/) | Publicação dos arquivos e dicionário | Diretório aberto; clique de download do dicionário falhou |
| [Geoportal Rio — CNEFE 2022](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Censo/CNEFE_2022/FeatureServer/layers) | Dicionário de espécies e níveis, republicação governamental | Conteúdo consultado; conferir versão original antes de nova produção |
| [IBGE — entorno](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/tipologias-do-territorio/24702-caracteristicas-urbanisticas-do-entorno-dos-domicilios.html?lang=pt-BR) | Escopo e variáveis da pesquisa urbanística | Página consultada; PDF `liv102168.pdf` não abriu pela ferramenta |
| [Receita — metadados CNPJ](https://www.gov.br/receitafederal/dados/cnpj-metadados.pdf) | Campos de estabelecimentos e tabelas auxiliares | PDF de seis páginas consultado; leiaute publicado é anterior ao novo identificador |
| [Receita — dados abertos](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/cadastros) | Canal oficial de distribuição | Página aberta; nenhum dump de CNPJ baixado ou atualizado aqui |
| [Receita — primeiro CNPJ alfanumérico](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/julho/receita-federal-gera-o-primeiro-cnpj-em-formato-alfanumerico) | Necessidade de preservar letras e zeros | Notícia oficial de 31/07/2026 consultada |
| [CONCLA — bares/restaurantes](https://cnae.ibge.gov.br/?classe=56112&tipo=cnae&versao=9&view=classe) e [manutenção automotiva](https://cnae.ibge.gov.br/?classe=45200&tipo=cnae&versao=9&view=classe) | Exemplos de classificação | Resultados oficiais consultados; abertura de 5611-2 retornou 403; taxonomia completa pendente |
| [GTFS — referência oficial](https://gtfs.org/documentation/schedule/reference/) | Tabelas, calendário, geometria e horários | Especificação aberta; não substitui validar feed local |
| [Grande Recife — distribuição GTFS](https://www.granderecife.pe.gov.br/gtfs/gtfs.zip) | Local a revalidar para integração | Abertura falhou; vigência, conteúdo e licença não comprovados nesta rodada |
| [CTTU — equipamentos](https://dados.recife.pe.gov.br/dataset/equipamentos-de-monitoramento-e-fiscalizacao-de-transito) | Existência do dataset e licença ODbL | Metadados consultados; não foi analisada série de tráfego |
| [OSM — licença](https://www.openstreetmap.org/copyright) | Uso/atribuição de dados OSM | Página consultada |
| [OSMF — Nominatim](https://operations.osmfoundation.org/policies/nominatim/) | Limites do servidor público | Política consultada; não foi usado para geocodificar em massa |
| [Crea-PE — ART](https://creape.org.br/art) | Caminho de verificação de autenticidade | Página consultada; formulário SITAC retornou 403 |
| [CAU — autenticidade](https://transparencia.caubr.gov.br/cartadeservicos1-3/) | Verificação por documento e chave | Serviço descrito na carta consultada; nenhum RRT consultado |
| [Diário Oficial do Recife, 18/11/2023](https://dome.recife.pe.gov.br/upload_dome/DO_149_18_11_2023-assinado.pdf) | Encontrado projeto de lei de inspeção | Resultado identifica PLO 269/2023; não tratado como lei vigente |
| [Recife — Lei 16.292](https://www.legiscidade.recife.pe.gov.br/lei/16292/) | Investigação de legislação edilícia | Resultado indexado; abertura falhou/502; aplicabilidade atual não concluída |
| [Android — WifiInfo](https://developer.android.com/reference/android/net/wifi/WifiInfo) | RSSI, frequência e dados da conexão | Documentação consultada |
| [Android — varreduras Wi‑Fi](https://developer.android.com/develop/connectivity/wifi/wifi-scan) | Permissões, limitação de frequência e resultado antigo | Documentação aberta |
| [Android — TelephonyDisplayInfo](https://developer.android.com/reference/android/telephony/TelephonyDisplayInfo) | Limite do indicador visual de tecnologia | Documentação consultada |
| [Apple — fetchCurrent](https://developer.apple.com/documentation/networkextension/nehotspotnetwork/fetchcurrent%28completionhandler%3A%29) | Campos preenchidos e entitlement | Documentação consultada; propriedade de intensidade não confundida com leitura disponível |
| [Expo 57 — Network](https://docs.expo.dev/versions/v57.0.0/sdk/network/) e [Cellular](https://docs.expo.dev/versions/v57.0.0/sdk/cellular/) | Superfície da API compatível com versão do projeto | Consultadas; nenhum pacote instalado |
| [MDN — effectiveType](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType) | Estimativa de desempenho web | Página consultada; não usada como tecnologia real de rádio |
| [Anatel — cobertura móvel](https://www.gov.br/anatel/pt-br/dados/qualidade/qualidade-dos-servicos/cobertura-da-telefonia-movel) | Limitações de predição, sobretudo interior | Página consultada; mapa não foi usado como medição |
| [Serpro — API Consulta CNPJ](https://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-cnpj/) | Consulta cadastral por identificador | Documentação aberta; loja retornou 403, preço atual pendente |
| [Mapbox — Geocoding v6](https://docs.mapbox.com/api/search/geocoding/) | Persistência temporária/permanente e escopo | Documentação consultada; sem chave, benchmark ou contratação |

Tentativas adicionais sem conteúdo suficiente: nota CNEFE em `nada.ibge.gov.br` retornou 502; visão geral de Wi‑Fi da Apple exigiu JavaScript e o link Markdown não retornou conteúdo. Nenhuma conclusão depende exclusivamente dessas tentativas. Resultados de fóruns e fornecedores não oficiais encontrados na busca não foram usados para substituir documentação técnica primária.

## 2. Análise local e rastreabilidade

- [Script da EDA](evidencias/explorar_cnefe.py): somente biblioteca padrão Python; sem rede; entrada minimizada já usada pelo projeto.
- [Resultado estruturado](evidencias/eda-cnefe.json): origem, modificação guardada no cache, hash SHA-256 do cache, hash de cada índice, contagens e método.
- Data da análise e data da fonte são separadas. Os resultados pertencem à versão dos hashes registrados.
- Não foram exportados nomes, coordenadas individuais, complementos, contatos ou identificadores pessoais. O JSON contém agregados.
- A [EDA do pacote anterior](../melhorias-2026-10-20/evidencias/eda-indice.json) é referência histórica distinta, não foi reescrita.

Para reproduzir a partir da raiz:

```bash
python3 docs/produto/refinamento-2026-10-21/evidencias/explorar_cnefe.py
```

É necessário o cache local `.cache/dados-recife/cnefe-recife.json.gz`; ele não está versionado. Sem esse insumo o script falha, não baixa nada implicitamente. A reprodução depende de mesmos hashes, não apenas do mesmo nome de arquivo. A EDA não é um pipeline de produção.

## 3. Registro de execução do produto

| Item | Alteração | Decisão |
|---|---|---|
| R00 | Fecho comum no gerador de mensagem, com VEREDA | Assinatura curta, sem domínio inventado ou rastreamento |
| R00 — testes | Ajuste das expectativas e verificação de cópia/edição/restauração | A marca integra a sugestão; respeitar revisão da pessoa |
| Documentação | Sete documentos e EDA neste pacote | Preservar diagnóstico histórico e limites do lote A |
| Navegação documental | Link adicionado ao índice de produto de 20/10 | Facilitar encontrar a nova rodada sem reescrever análises antigas |

**Arquivos de código alterados nesta rodada:** `src/dados/mensagem.ts`, `tests/mensagem.test.ts`, `tests/visita.test.ts`. Nenhum schema, cobrança, integração ou arquivo de identidade visual foi alterado. As modificações que já estavam presentes no checkout foram preservadas; esta entrega não atribui essas mudanças a si.

A [skill de marca](../../../.agents/skills/brand/SKILL.md) e sua referência de mensagens foram consultadas para a assinatura. A regra do usuário mantém o protótipo raiz como identidade. A skill não exigiu aprovação para este texto autorizado.

## 4. Verificações realizadas

| Verificação | Resultado |
|---|---|
| `npm test -- --runInBand tests/mensagem.test.ts tests/visita.test.ts` | **2 suítes, 90 testes passaram**, saída 0 |
| `npm run typecheck` | **Passou**, saída 0 |
| ESLint nos três arquivos de código alterados | **Passou**, saída 0 |
| Execução da EDA sobre o cache local | **Concluída**, 737.511 registros e 2.688 prédios analisados |
| Integridade dos artefatos | Hashes dos insumos e somas da EDA conferidos; links locais dos sete documentos resolvidos; contas dos cenários verificadas |

Resumo estruturado dessa conferência: `evidencias/validacao-pacote.json`. O `git diff --check` também passou. Essas verificações não avaliam realidade de campo, representatividade da amostra ou aparência da interface.

Os testes de visita utilizam mocks de área de transferência e abertura de URL. Nenhuma mensagem foi enviada e nenhum contato foi acionado.

**Não executado nesta rodada:** verificação completa `npm run verificar`, smoke integral, novas capturas visuais, teste em Android/iPhone, rádio Wi‑Fi/celular, velocidade, consulta autenticada a ART/RRT, download/validação atual do GTFS, ingestão/auditoria de CNPJ e entrevistas. O lote A anterior tem seu próprio registro de verificações; seus resultados não são apresentados como testes novos desta assinatura.

## 5. Pendências para uma próxima execução autorizada

Selecionar um item do backlog; conferir dicionário original do CNEFE e política por precisão; obter feed/licença atual de transporte; auditar geocodificação antes de listas de negócios; providenciar aparelhos para conectividade; definir processo de recrutamento; medir custos e validar oferta. Domínio oficial para assinatura, upload de documentos e endpoint de velocidade são decisões separadas. Nada disso foi contratado, publicado ou acionado automaticamente.
