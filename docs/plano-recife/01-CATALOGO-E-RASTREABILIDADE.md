# 01 — Catálogo funcional e rastreabilidade

As épocas detalham implementação e aceite. Este catálogo impede que uma ideia desapareça ou que uma capacidade demonstrativa seja tratada como produção. **Estado atual:** E = existente a verificar; P = parcial; N = novo; C = integração/capacidade condicionada. “E” não certifica aparelho, dado atual ou ausência de defeitos.

**Origens:** H = Master Spec histórico, POC, V1 e `docs/ui-ux.md`; O = ordem do arquiteto; P = produto/2026-10-20; Q = pesquisa-2026-10-20; M = melhorias-2026-10-20; R = refinamento-2026-10-21. Documentos exatos e precedência estão no documento 09. Os IDs desta tabela são únicos e permanentes.

| ID | Capacidade e finalidade | Estado | Época | Origem / mínimo técnico |
|---|---|---|---|---|
| F01 | Casca responsiva, navegação, cabeçalho e continuidade | P | 01 | O/M E02a/E06/R10; identidade raiz, texto ampliado |
| F02 | Cadastro progressivo e rascunho revisável | P | 01/03 | P RF01/M E03; salvar incompleto sem duplicar |
| F03 | Salvamento serializado e preferência ativa recuperável | E | 00/02 | M T01; falha de preferência não apaga conteúdo |
| F04 | Migração, quarentena e exclusão segura | E/P | 02 | O/P; versão futura não sobrescrita |
| F05 | Exportar/importar caderno, conflitos e recuperação | N | 02 | M T02/Q; sem importar créditos como dinheiro |
| F06 | Fotos próprias, capa, ordem e mídia persistente | N | 02 | M E02b; sem base64 no JSON central |
| F07 | Arquivos privados locais e referências a páginas | N | 02/06 | P/R; quota, origem e exclusão |
| F08 | Formulário, URL, texto e HTML com revisão por campo | E/P | 03 | O/P/Q; origem e contradição preservadas |
| F09 | Leitura visível por WebView e escape de bloqueios | P | 03 | O 2B/Q07; sem contornar antirobô |
| F10 | Share iOS/Safari e Android URL/texto/PROCESS_TEXT | P | 03 | Q08; teste frio/quente em build real |
| F11 | Screenshot e OCR local de anúncio | N/C | 03 | Q07; revisão humana e privacidade |
| F12 | Extensão desktop iniciada pela pessoa | N/C | 03 | H/Q; permissões mínimas, não crawler |
| F13 | Feed autorizado de imobiliária/portal | C | 03/11 | P/Q Kenlo; contrato e cobertura demonstrados |
| F14 | Extração de descrição livre por LLM | C | 11 | H/Q; schema, evidência, revisão e custo |
| F15 | Índice municipal particionado por bairro | P | 04 | Q/M T06; cobertura por camada, não promessa integral |
| F16 | Resolução explicável, alternativas e abstenção | E/P | 00/04 | M E01/D01; pontos nunca viram probabilidade |
| F17 | Confirmar lote/prédio e explorar lotes vizinhos | P | 04 | H/O; lote não equivale a torre/unidade |
| F18 | Geocodificador CNEFE com qualidade espacial | P | 04 | R R01; manter NV_GEO_COORD e ambiguidade |
| F19 | Fonte, período, escala, método e frescor por evidência | P | 04 | M T05/R; consulta hoje não atualiza Censo |
| F20 | Pipeline reproduzível, licença, qualidade e atualização | P | 04/14 | O C7/M/R; publicação atômica e rollback de índice |
| F21 | Mensal conhecido e parcelas/pendências coerentes | E | 00/05 | M E04; fixture 2.500 + 600 = 3.100 |
| F22 | Entrada, mudança, instalação, garantias e caixa imobilizado | N | 05 | P; despesa separada de caução reembolsável |
| F23 | Horizonte e cenários editáveis de custo | N | 05 | P/R; hipótese não sobrescreve valor informado |
| F24 | Perfil da casa, orçamento e cenários água/energia/transporte | N | 05 | H/P; entradas opcionais e tarifas datadas |
| F25 | Simulação de financiamento Price | N | 05 | Q; taxa efetiva, entrada, prazo e exclusões |
| F26 | Comparar comprar × alugar por cenários | N | 05/10 | P; caixa/patrimônio/custo de oportunidade separados |
| F27 | Distribuições e histórico de valores fiscais ITBI | E/P | 05 | O rev2.5; por unidade compatível, não mercado |
| F28 | Comparáveis pessoais e mercado anunciado autorizado | P/C | 05 | P/Q; N, filtros, janela, licença e deduplicação |
| F29 | Histórico de alterações do anúncio | N | 10 | P; reentrada manual/feed, sem polling proibido |
| F30 | Cadastro do prédio, tipologia, área, IPTU, idade e porte | E/P | 06 | O; sem transferir mediana tributária à unidade |
| F31 | Linha do tempo com eventos rastreáveis | N/P | 06 | H; eventos cadastrais não são narrativa causal |
| F32 | Obras, licenças e processos urbanísticos | E/P | 06 | H/O; processo/licença/obra observada separados |
| F33 | Inspeção informada, laudo, ART/RRT, habite-se, bombeiros | N | 06 | R; “último documento apresentado”, não certificação |
| F34 | Atas, convenção, balancetes e pendências condominiais | N | 06 | P/Q; leitura manual com página/trecho primeiro |
| F35 | OCR/LLM de documentos privados e achados rastreáveis | C | 11 | P/Q/R; consentimento, retenção e revisão |
| F36 | Identificação do condomínio e vínculos de pessoas jurídicas | N/C | 06 | Q/adendo 10; papéis condomínio/SPE/construtora/administradora separados, sem sócios/CPF |
| F37 | Registros fiscais PGFN/FGTS do condomínio | C | 06/11 | Q; status/data, não nota de saúde financeira |
| F38 | Processos por CNPJ e ocorrências vinculadas ao edifício: obras, vícios, estrutura, trabalhista e ruído | C | 11 | Q/adendo 10; polo, vínculo, estágio, fonte e custo; ação não é culpa nem diagnóstico |
| F39 | Matrícula e consulta imobiliária documental | C | 06/11 | P/Q ONR/Docket; orientação/arquivo próprio antes de API |
| F40 | Licenciamento ambiental/sonoro LUSE | E/P | 07 | O; licença não mede emissão sonora |
| F41 | Pedidos 156 de drenagem, iluminação e entulho | E/P | 07 | O; janela explícita, duplicação e viés de registro |
| F42 | Iluminação pública cadastrada | E/P | 07 | O; data e observação atual separadas |
| F43 | Coleta, feiras, eventos e rotina de acesso da rua | P/N | 07 | H/Q; calendário não prova bloqueio/ruído |
| F44 | Sinistros, radares, corredores e características viárias | P/N | 07/08 | O/R; não inventar fluxo ou silêncio |
| F45 | Defesa Civil por alcance publicado | E/P | 07 | O; número mascarado não é recuperado |
| F46 | Calçada, rampa, obstáculos e entorno censitário | E/P | 07 | O/R; setor/face não certifica percurso |
| F47 | Alagamento catalogado, SGB, canais, drenagem e cotas | N/C | 07 | P/Q; escala/datum/legenda/licença antes de cruzamento |
| F48 | Chuva, maré e contexto climático da visita | N/C | 07 | H/P/Q APAC/Cemaden; estação não é apartamento |
| F49 | Árvores, arborização e calor de superfície | N/C | 07 | H; satélite não mede temperatura interna |
| F50 | Zoneamento LPUOS e obras públicas previstas | N/C | 07 | Q; potencial normativo não é altura futura certa |
| F51 | Água, cisterna, bombas, rodízio e infraestrutura | N/P | 07/09 | H/R; manual primeiro, sem dados de contas Compesa |
| F52 | Energia/continuidade DEC-FEC e contexto de telecom | C | 07 | P ANEEL/Anatel; unidade territorial correta |
| F53 | Ocorrências de segurança pública contextualizadas | C | 07 | H/P/Q; sem score de rua/prédio ou causalidade |
| F54 | Arboviroses por território/período | C | 07 | H; sem diagnóstico ou risco individual |
| F55 | Ocupação e renda censitária descritivas | P/C | 07 | H/O; sem perfil atribuído a morador nem ranking |
| F56 | Ensino, saúde e usos do CNEFE próximos | N | 08 | R/EDA; espécie ampla e referência 2022 |
| F57 | Comércio/serviços por CNAE e associação geográfica | N/C | 08 | R; geocodificar, auditar e distinguir atividade declarada |
| F58 | Equipamentos de saúde/escola CNES/INEP/Ideb | C | 08 | P/Q; atualidade e licença, não avaliação do bairro |
| F59 | Transporte programado GTFS: ônibus, metrô e VLT | C | 08 | Q/R; calendário, viagens e vigência |
| F60 | Ciclovias, travessias e acessibilidade de percurso | N/C | 08/09 | P/H; continuidade exige percurso verificado |
| F61 | Destinos diários, rotas, isócronas e comparação de rotina | P/C | 08 | H; distância reta, rota e tempo são medidas distintas |
| F62 | Visitas múltiplas, pausas, notas, perguntas e resumo | P | 09 | O/H; sessões datadas, retomada e offline |
| F63 | Ciclo evidência → pergunta → resposta → revisão | P | 09/10 | M E05; ID estável, origem, histórico e não se aplica |
| F64 | GPS com precisão, fotos e posição observada | P/N | 09 | H; coordenada não confirma unidade/fachada |
| F65 | Percepção e observação acústica experimental | P/C | 09 | H/R; sem dB SPL certificado sem calibração |
| F66 | Bússola, orientação, sol/sombra e 3D experimental | P/C | 09 | H; entrada fachada/andar e geometria validados |
| F67 | Conectividade móvel/Wi‑Fi/fixa por cômodo | N/C | 09 | R; 5 GHz ≠ 5G, throughput exige destino |
| F68 | Lembretes locais de visita/pendências | N | 10 | P/R; opt-in, cancelamento e sem perda de dados |
| F69 | Comparação de dois/três imóveis por prioridades | P | 10 | H/P; equivalência e ausência, sem vencedor automático |
| F70 | Decisão, descarte/restauração e diário pós-mudança | P/N | 10 | H/P; histórico privado e expectativas separadas |
| F71 | Mensagem VEREDA e resumo selecionável em texto/PDF | P | 00/10 | R00/P; marca editável, revisão e envio deliberado |
| F72 | Contestação/correção com histórico e alcance | P | 10/12 | H/P; local não significa enviado à equipe |
| F73 | Conta opcional e sincronização recuperável | C | 12 | P; local continua, conflitos e exclusão |
| F74 | Caderno colaborativo e links privados revogáveis | C | 12 | P/R; acesso mínimo e notas privadas por padrão |
| F75 | Relatos comunitários estruturados e moderados | C | 12 | H/Q; consentimento, abuso, agregação e contestação |
| F76 | Créditos, ofertas avulso/pacote e cobrança idempotente | P/C | 13 | H/P/R; sandbox antes de dinheiro real |
| F77 | Profissional, realocação, serviço assistido e indicações | N/C | 13 | P/Q/R; papéis, transparência e sem venda de veredito |
| F78 | API/agregados institucionais e B2G | C | 13 | P/Q; contrato/licença, sem dado pessoal do caderno |
| F79 | Pesquisa, métricas de utilidade e custo por caso | N/P | 00/14 | P/R; dados internos não autenticados ≠ demanda comprovada |
| F80 | Desempenho, acessibilidade, operação e lapidação | P | 01/14 | M/R; evidência visual/nativa e capacidade de desligar módulos |

## Ideias históricas substituídas, não esquecidas

| ID | Ideia original | Decisão neste plano / destino útil |
|---|---|---|
| X01 | Identificar “prédio-caixão” por idade/pavimentos/padrão; risco ITEP antigo por prédio | Não publicar diagnóstico. F30/F33 mostram cadastro e solicitam sistema estrutural/laudo; ITEP só pesquisa técnica separada com direito e escopo |
| X02 | Estimar preço justo, valorização ou ranking geral de imóvel | F27/F28 oferecem distribuições compatíveis; F26 cenário explícito. Modelo preditivo é pesquisa futura, sem endpoint público nesta versão |
| X03 | dB certificado, GPS de presença exata, poente crítico e brisa permanente | F64–F67 mantêm observações e hipóteses físicas honestas; não inferir garantia |
| X04 | Scraping universal, contorno de bloqueio e APIs de dados pessoais | F08–F14 preservam importação iniciada/autorizada; sem CPF, contas ou sócios |
| X05 | Google Solar/Aerial como solução geral de insolação; Sentinel-2 como térmico | F49/F66 usam método/fonte adequado e ensaio; não prometer cobertura/medida incorreta |
| X06 | DataJud como busca genérica por parte, CIB/SINTER como cadastro aberto, contas Compesa | Não implementar a premissa sem acesso legítimo comprovado; F38/F39/F51 têm alternativas |
| X07 | Recompensar confirmação do prédio e transformar contestações em confiança automática | Preservar regra atual de crédito até decisão específica; F72/F75 exigem validação/moderação |
| X08 | Expandir cidades e todas as linhas de negócio simultaneamente | Município Recife; F77/F78 preparam pilotos selecionáveis, sem novo mercado geográfico |

Toda função condicional mantém uma tarefa de integração e seu critério de saída. O fallback não apaga essa tarefa do catálogo nem permite marcar a integração como concluída.
