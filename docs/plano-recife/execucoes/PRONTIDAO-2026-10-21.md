# Prontidão por capacidade — execução contínua 21/10/2026

Esta matriz registra o resultado real da execução autorizada das épocas 00–14. **O plano inteiro não está concluído.** Não confundir capacidade local/manual, código em memória, simulação e integração operacional. Uma pendência de implementação local não está classificada como falta de autorização.

O index raiz, pitch, motion e diagnósticos históricos foram preservados. Consulta remota, conta, pagamento e publicação permanecem desligados. A expansão municipal é experimental neste checkout; nenhuma liberação pública foi realizada.

| ID | Capacidade | Estado confirmado | Evidência e trabalho restante |
|---|---|---|---|
| F01 | Casca responsiva, navegação, cabeçalho e continuidade | Parcial | Casca existente preservada; quebra de cabeçalho/botões e nomes longos corrigida. Web examinada; teclado virtual e leitores de tela físicos pendentes. |
| F02 | Cadastro progressivo e rascunho revisável | Web verificado | Salvar incompleto, retomar/descartar rascunho, ID estável e proteção contra rascunho futuro. tests/rascunho; smoke ampliado. |
| F03 | Salvamento serializado e preferência ativa recuperável | Existente revalidado | Fila única; lista principal e preferência recuperável. Falha seletiva CHAVE_ATIVA em persistir-analises. |
| F04 | Migração, quarentena e exclusão segura | Existente ampliado | Migração/quarentena preservadas; complementos opcionais validados. Exclusão local inclui mídia; falha parcial é informada. |
| F05 | Exportar/importar caderno, conflitos e recuperação | Web verificado / nativo parcial | JSON revisado, conflitos preservados, idempotência e revisão obsoleta recusada. Pacote web com SHA256; importação nativa de bytes ainda não implementada. |
| F06 | Fotos próprias, capa, ordem e mídia persistente | Web verificado / nativo não testado | Cinco fotos privadas, primeira como capa e promoção de outra foto. Reordenação arbitrária/exclusão individual e ensaio físico pendentes. |
| F07 | Arquivos privados locais e referências a páginas | Web verificado / nativo não testado | PDF privado, limite e assinatura básica de arquivo; metadados com trecho/página. Sem OCR, sanitização semântica ou certificação documental. |
| F08 | Formulário, URL, texto e HTML com revisão por campo | Existente revalidado | Leitores/formulário preservados; suítes de extração e smoke exercitam revisão, ausências e anomalias. |
| F09 | Leitura visível por WebView e escape de bloqueios | Parcial | Código WebView/saídas já existente; regressão web verificada. Anti-bloqueio e navegação nativa em build físico não testados. |
| F10 | Share iOS/Safari e Android URL/texto/PROCESS_TEXT | Parcial nativo | Plugin e entradas existentes preservados; início frio/quente e Safari/PROCESS_TEXT exigem builds físicos. |
| F11 | Screenshot e OCR local de anúncio | Não implementado | Falta selecionar/validar biblioteca OCR local, licença e builds. Não há conversão automática de screenshot em fatos. |
| F12 | Extensão desktop iniciada pela pessoa | Não implementado | Extensão desktop e protocolo de entrega ainda precisam de implementação/teste; não é bloqueio por credencial. |
| F13 | Feed autorizado de imobiliária/portal | Dependência externa | Feed Kenlo exige contrato/escopo/credencial e amostra autorizada de Recife. Nenhum segredo ou adaptador fictício adicionado. |
| F14 | Extração de descrição livre por LLM | Não implementado / dependência externa | Faltam corpus, avaliador e adaptador revisável. Remoto exige fornecedor, retenção e custo aprovados. |
| F15 | Índice municipal particionado por bairro | Experimento local parcial | 94 partições geradas e auditadas estruturalmente; 72 habilitadas localmente, 7.206 edifícios. 21 sem registros elegíveis e Macaxeira retida. Auditoria física/associação e liberação externa pendentes. |
| F16 | Resolução explicável, alternativas e abstenção | Existente revalidado | Motivos, total antes do corte, área insuficiente e escolha deliberada preservados. Testes buscar/lote A e smoke. |
| F17 | Confirmar lote/prédio e explorar lotes vizinhos | Parcial | Confirmação de lote existente; exploração avançada de lotes vizinhos não ampliada. Coordenada não confirma torre/unidade. |
| F18 | Geocodificador CNEFE com qualidade espacial | Parcial | NV_GEO preservado na normalização e na nova camada de serviços. Busca de endereço por CNEFE não foi ampliada para resolver todas as ambiguidades. |
| F19 | Fonte, período, escala, método e frescor por evidência | Parcial | Fontes/períodos existentes e fonte CNEFE 2022 explícitos; manifesto único e avaliação de frescor por toda evidência ainda incompletos. |
| F20 | Pipeline reproduzível, licença, qualidade e atualização | Parcial verificado | Staging, schemas, hashes, versão imutável e troca atômica local; reversão/reativação executadas. Revisão humana de associações e calendário de manutenção pendentes. |
| F21 | Mensal conhecido e parcelas/pendências coerentes | Existente revalidado | Derivador único: 2.500 + 600 = 3.100, IPTU/seguro pendentes; compra separada. Testes e smoke das superfícies. |
| F22 | Entrada, mudança, instalação, garantias e caixa imobilizado | Núcleo local verificado | Despesas iniciais separadas de caução reembolsável e caixa inicial. Sem catálogo detalhado por item de mudança/garantia. |
| F23 | Horizonte e cenários editáveis de custo | Núcleo local verificado | Cenários nomeados, meses e hipóteses persistentes; recálculo usa valores atuais sem sobrescrever anúncio. |
| F24 | Perfil da casa, orçamento e cenários água/energia/transporte | Parcial | Extras mensais manuais disponíveis. Perfil domiciliar, orçamento máximo e tarifas datadas de água/energia/transporte não implementados. |
| F25 | Simulação de financiamento Price | Núcleo local testado | Price em centavos e taxa efetiva; teste de zero/limites/valor de referência. Não inclui CET/proposta bancária real; UI de compra exige ampliação da QA visual. |
| F26 | Comparar comprar × alugar por cenários | Núcleo local testado | Simulação separa saldo devedor, patrimônio e investimento com hipóteses explícitas. Não é recomendação; validação com usuários pendente. |
| F27 | Distribuições e histórico de valores fiscais ITBI | Existente revalidado | Derivações fiscais preservadas; testes de ITBI/cadastro, sem apresentar valor tributário como preço de mercado. |
| F28 | Comparáveis pessoais e mercado anunciado autorizado | Parcial existente | Comparação pessoal preservada. Dataset autorizado de anúncios, filtros de comparáveis e janela de mercado não implementados. |
| F29 | Histórico de alterações do anúncio | Núcleo local testado | Histórico de campos/origem/período antes/depois em salvar/atualizar deliberados; não reconstrói passado nem consulta portal. Testes de histórico; captura específica ainda pendente. |
| F30 | Cadastro do prédio, tipologia, área, IPTU, idade e porte | Existente revalidado | Cadastro e perímetro/índice existentes preservados; expansão local validada. Sem transferir tributo agregado à unidade. |
| F31 | Linha do tempo com eventos rastreáveis | Parcial | Documentos datados e histórico do anúncio existem; linha do tempo unificada de todos os eventos ainda não implementada. |
| F32 | Obras, licenças e processos urbanísticos | Existente + manual | Licenças existentes e documentos/ocorrências pessoais. Sem afirmar execução de obra a partir de licença. |
| F33 | Inspeção informada, laudo, ART/RRT, habite-se, bombeiros | Manual web verificado | Data de inspeção distinta de emissão; último laudo apresentado com vínculo confirmado. ART/RRT isolada não vira inspeção. Consulta automática inexistente. |
| F34 | Atas, convenção, balancetes e pendências condominiais | Manual parcial | Tipos ata, balancete e convenção, PDF e trechos/páginas. Extração estruturada de finanças/pendências de atas não implementada. |
| F35 | OCR/LLM de documentos privados e achados rastreáveis | Não implementado | Documentos não são enviados a OCR/LLM. Faltam corpus e adaptador com revisão/citações e limites. |
| F36 | Identificação do condomínio e vínculos de pessoas jurídicas | Manual web verificado | CNPJ alfanumérico preservado; papéis separados e evidência do vínculo. Formato não valida cadastro nem confirmação automática. |
| F37 | Registros fiscais PGFN/FGTS do condomínio | Dependência externa | Não há consulta PGFN/FGTS. Documento próprio pode ser registrado como outro; isso não conclui integração fiscal. |
| F38 | Processos por CNPJ e ocorrências vinculadas ao edifício: obras, vícios, estrutura, trabalhista e ruído | Manual web verificado / automático pendente | Ocorrências com polo, natureza, estágio, vínculo, fonte e tipo de valor. Deduplicação CNJ e exclusão de vizinho/outro imóvel. Sem consulta automatizada ou nota de risco. |
| F39 | Matrícula e consulta imobiliária documental | Manual parcial / dependência externa | Documento tipo matrícula permitido; acesso ONR/Docket ainda não implementado/contratado. |
| F40 | Licenciamento ambiental/sonoro LUSE | Existente revalidado | Camada LUSE preservada com origem; nenhuma medição de ruído inferida. |
| F41 | Pedidos 156 de drenagem, iluminação e entulho | Existente revalidado | 156 e janelas existentes, reprocessados nas partições; preservar viés e ausência versus zero. |
| F42 | Iluminação pública cadastrada | Existente revalidado | Iluminação cadastrada e fonte existentes; condição atual não comprovada por cadastro. |
| F43 | Coleta, feiras, eventos e rotina de acesso da rua | Parcial existente | Roteiro de coleta preservado. Integração de feiras/eventos e verificação de horários não ampliadas. |
| F44 | Sinistros, radares, corredores e características viárias | Parcial existente | Sinistros preservados. Radares/corredores/tráfego não integrados; GTFS não foi usado como ruído. |
| F45 | Defesa Civil por alcance publicado | Existente revalidado | Defesa Civil pelo alcance existente, sem recuperar número mascarado. |
| F46 | Calçada, rampa, obstáculos e entorno censitário | Existente revalidado | Entorno censitário existente; informação agregada não certifica percurso acessível. |
| F47 | Alagamento catalogado, SGB, canais, drenagem e cotas | Não implementado | Falta fonte/legenda/licença/datum e validação espacial de alagamento/SGB/cotas. |
| F48 | Chuva, maré e contexto climático da visita | Não implementado | Sem adaptador validado de chuva/maré/clima. Falta confirmar estações, janela, licença e granularidade. |
| F49 | Árvores, arborização e calor de superfície | Não implementado | Sem cruzamento arborização/temperatura; não usar Sentinel-2 como termômetro indoor. |
| F50 | Zoneamento LPUOS e obras públicas previstas | Não implementado | Faltam norma/cartografia vigente, estágio e validação de associação; licença existente não substitui zoneamento. |
| F51 | Água, cisterna, bombas, rodízio e infraestrutura | Manual parcial | Observação de água por cômodo e roteiro existentes; campos estruturados de cisterna/bombas/rodízio pendentes. |
| F52 | Energia/continuidade DEC-FEC e contexto de telecom | Não implementado | Sem associação válida de conjuntos DEC/FEC ou cobertura telecom. Nenhuma aproximação por bairro adicionada. |
| F53 | Ocorrências de segurança pública contextualizadas | Não implementado | Sem fonte/agregado/denominador adequado validado. Não há ranking de segurança. |
| F54 | Arboviroses por território/período | Não implementado | Sem integração territorial/temporal validada de arboviroses. |
| F55 | Ocupação e renda censitária descritivas | Parcial existente | Contexto censitário existente, sem perfil atribuído a moradores. Não ampliado para ranking. |
| F56 | Ensino, saúde e usos do CNEFE próximos | Experimento local web verificado | 5.661 pontos de ensino/saúde/religião CNEFE 2022, nível 1; categoria/raio/total antes do limite. Sem nomes, disponibilidade ou funcionamento atual. |
| F57 | Comércio/serviços por CNAE e associação geográfica | Não implementado | Receita/CNAE e geocodificação não integrados; faltam tabela versionada e auditoria estratificada de 150 associações. |
| F58 | Equipamentos de saúde/escola CNES/INEP/Ideb | Não implementado | CNES/INEP/Ideb não integrados. CNEFE genérico não é substituto desses cadastros. |
| F59 | Transporte programado GTFS: ônibus, metrô e VLT | EDA, não habilitado | Feed oficial baixado/inspecionado: 400 rotas, 7.217 paradas. Licença de reuso e validação completa de calendário/stop_times pendentes. |
| F60 | Ciclovias, travessias e acessibilidade de percurso | Manual parcial | Acesso pode ser observado; rede contínua de ciclovias/travessias/calçadas não modelada. |
| F61 | Destinos diários, rotas, isócronas e comparação de rotina | Núcleo local parcial | Destinos privados com nota ou posição deliberada, precisão e distância reta. Web com GPS simulado testado. Sem rota, minutos, isócrona ou comparação de rotina completa. |
| F62 | Visitas múltiplas, pausas, notas, perguntas e resumo | Núcleo local web verificado | Sessões arquivadas preservam respostas/notas/datas; nova sessão não inventa data antiga. Testes e restauração. |
| F63 | Ciclo evidência → pergunta → resposta → revisão | Parcial ampliado | Documento/ocorrência gera pergunta própria estável; roteiro e mensagem existentes preservados. Revisão completa de evidência/resposta ainda não unificada. |
| F64 | GPS com precisão, fotos e posição observada | Web simulado / nativo não testado | Adaptador GPS com permissão por ação e precisão; fotos próprias persistentes. Não é prova de funcionamento em visita real. |
| F65 | Percepção e observação acústica experimental | Manual parcial | Observação de fonte/duração/janela/horário; não mede dB. Sensor acústico/calibração não implementados nesta execução. |
| F66 | Bússola, orientação, sol/sombra e 3D experimental | Manual parcial | Orientação/percepção existentes e nota de sol; sensor/sol/sombra/3D não implementados ou verificados. |
| F67 | Conectividade móvel/Wi‑Fi/fixa por cômodo | Manual web verificado | Notas por cômodo; diferença 5 GHz/5G e ausência de roteador/throughput explícitas. Não há medição automática. |
| F68 | Lembretes locais de visita/pendências | Não implementado | Notificações locais com timezone, permissão, reagendamento e cancelamento ainda precisam de adaptador/build e testes físicos. |
| F69 | Comparação de dois/três imóveis por prioridades | Parcial web verificado | Terceiro imóvel opt-in, grupos custo/documentos/visitas e nomes sem corte; pilha legível em 360 px. Prioridades arbitrárias e rotina ampliada pendentes. |
| F70 | Decisão, descarte/restauração e diário pós-mudança | Núcleo local web verificado | Decisão pessoal e diário datado; descarte/restauração existentes preservados. Expectativa estruturada versus pós-mudança pendente. |
| F71 | Mensagem VEREDA e resumo selecionável em texto/PDF | Web verificado / nativo parcial | Mensagem VEREDA existente, resumo selecionado, notas privadas fora por padrão e PDF real renderizado/examinado. PDF nativo não implementado; impressão longa exige mais casos. |
| F72 | Contestação/correção com histórico e alcance | Local web verificado | Correção com fato, referência/versão, motivo/evidência e data. Não modifica fonte nem envia à equipe. |
| F73 | Conta opcional e sincronização recuperável | Modelo local, não operação | Protocolo de revisões/idempotência/tombstone/conflito testado em memória. Fila durável de sync, autenticação e backend não implementados. |
| F74 | Caderno colaborativo e links privados revogáveis | Não implementado / decisão operacional | Links revogáveis, convites e ACL dependem de backend autorizado. Exportação estática não equivale a colaboração. |
| F75 | Relatos comunitários estruturados e moderados | Não implementado / decisão operacional | Sem mural/comunidade; moderação, contestação e antispam não operacionais. |
| F76 | Créditos, ofertas avulso/pacote e cobrança idempotente | Carteira existente + modelo interno | Regra deliberada/cobrança única preservada. Derivador de economia com custos desconhecidos testado. Catálogo, contadores, ledger/webhook/sandbox não implementados; pagamentos reais desligados. |
| F77 | Profissional, realocação, serviço assistido e indicações | Não implementado | Sem CRM/clientes/realocação/indicações remuneradas. Necessita escopo, consentimento e papéis antes de operação. |
| F78 | API/agregados institucionais e B2G | Não implementado | Nenhuma API ou infraestrutura remota criada. Faltam piloto/contrato/schema agregado e revisão de redistribuição. |
| F79 | Pesquisa, métricas de utilidade e custo por caso | Preparação parcial | Baseline técnico e desempenho coletados. Não houve recrutamento, entrevistas ou métricas de demanda; percentuais antigos não reautenticados. |
| F80 | Desempenho, acessibilidade, operação e lapidação | Parcial verificado | Suíte, smoke, capturas/PDF e benchmark local. Dispositivos, leitor de tela, memória e campo pendentes; 500 análises excedem meta inicial de 1s nesta medição. |
