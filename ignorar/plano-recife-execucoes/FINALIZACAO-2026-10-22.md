# Continuação para finalizar atribuições — 22/10/2026

Autorização: finalizar as atribuições definidas; prosseguir nos itens independentes. Base atual 897df79; mudanças documentais da auditoria preservadas. Nenhuma autorização para infraestrutura, publicação, contratação, pagamento real ou envio a terceiros. Não alterar identidade raiz/pitch/motion.

| Unidade/FID | Estado confirmado | Arquivos previstos | Aceite |
|---|---|---|---|
| F06 | Apenas promoção a capa | Fotos, domínio de mídia | mover/remover referência sem apagar arquivo ainda referenciado |
| F24/F22 | Somente extra mensal agregado | caderno, orçamento e painel | itens/consumos opcionais com origem, ausências e zero; não duplicar extra legado |
| F31/F34/F51/F70 | Metadados e notas livres | domínio e painéis temáticos | cronologia sem datas inventadas; balancete, água e expectativa estruturados |
| F12 | Sem extensão desktop | extensão isolada e entrada existente | ação na aba, prévia, sem host global, protocolo por arquivo/clipboard, revisão no app |
| F11/F35 | Sem OCR | adaptador web local, componentes, corpus | imagem escolhida, processamento local sem CDN/runtime externo, cancelamento, revisão antes de aplicar |
| F68 | Sem lembretes | domínio, adaptadores e caderno | fuso/opt-in, cancelamento/reagendamento; sem permissão permanece anotação |
| F05/F71 nativo | Backup textual e sem PDF nativo | plataforma | código com capacidade explícita; dispositivo físico continua gate de verificação |
| F79/F80 | Evidência técnica sem pesquisa real | corpus, QA e prontidão | resultados reais, sem inventar usuários/dispositivos/fornecedores |

Registro inicial antes da edição; os resultados finais abaixo se baseiam em testes e inspeção reais. Instalações de bibliotecas são locais; não autorizam envio de conteúdo privado ou integração contratada.

## Resultado da continuação

A auditoria e os ajustes desta rodada foram concluídos e verificados no alcance abaixo. **Isso não encerra todas as épocas 00–14.** O inventário consolidado de F01–F80 está em [PRONTIDAO-2026-10-22-FINAL.md](PRONTIDAO-2026-10-22-FINAL.md). Não é correto declarar o plano completo como entregue: existem implementações locais pendentes, integrações ainda não validadas e aceites físicos/pesquisa.

A tabela acima foi registrada antes das edições. O levantamento complementar durante a execução também levou aos filtros de comparáveis e prioridades/rotina; estes resultados não são uma observação da auditoria histórica.

| Unidade | Alteração efetiva | Resultado e limite |
|---|---|---|
| Fotos | `Fotos.tsx`, `galeria.ts` | Antes/depois/capa, retirada confirmada, cancelamento e persistência após recarga. Retira referência; conserva bytes ainda potencialmente referenciados. |
| Cenários | `caderno.ts`, `orcamento.ts`, `EditarCenario.tsx`, `Orcamento.tsx` | Edição e itens com fonte, categoria e duração de extra. Modo selecionado substitui agregados sem somar os dois; totais antigos e itens ficam preservados ao trocar de modo. Caução não entra como despesa. Conflito de edição impede sobrescrita silenciosa. |
| Perfil doméstico | `Complementos.tsx`, `complementos.ts` | Ocupantes/orçamento opcionais, quantidade × tarifa em centavos, origem/data, subtotal conhecido e pendências. Independente do anúncio e de extras de cenário. |
| Cronologia | `Cronologia.tsx`, `cronologiaPublica.ts` | Eventos pessoais, inspeção/emissão distintas, ano cadastral, ITBI anual agregado e entrada de licenças próximas. Não atribui transação à unidade nem obra próxima ao prédio. Não inventa dia/mês de datas parciais. |
| Balancetes | `propostasBalancete.ts`, `Complementos.tsx` | Competência, receitas/despesas/reserva/inadimplência e saldo conhecido; propostas de rubricas em texto revisado. Trecho/página/ID preservados. Valores conflitantes ficam vazios; edição manual elimina citação incompatível. Não é diagnóstico ou rateio. |
| Infraestrutura/pós-mudança | `Complementos.tsx`, `Registros.tsx` | Água/bomba/cisterna/reservatório/rodízio com sim/não/não sabemos, fonte e data. Expectativa original e experiências datadas separadas. |
| OCR | `ocr.web.ts`, `LeituraDeImagem.web.tsx`, `public/ocr/` | Tesseract real local e opcional com português, prévia/cancelamento/limites. Nenhuma imagem enviada ou anexada automaticamente. Sem PDF direto, modelo de linguagem ou suporte OCR nativo. Motor/modelo/licenças congelados e conferíveis por hash. |
| Extensão | `extensions/desktop/`, `arquivoDaExtensao.ts`, importador e leitor | MV3 por ação, sem host global/rede/background, prévia e transferência por arquivo com hash. Reimportação abre o existente; conteúdo privado não entra no URL de revisão. **Aceite do acesso privilegiado por clique real ainda pendente.** |
| Lembretes | domínio, painel e adaptadores por plataforma | Web guarda anotações com fuso/offset e informa ausência de aviso com navegador fechado. Nativo solicita permissão só por ação, sem push/token, cria canal Android, serializa, cancela antes de reagendar, usa IDs sem colisão e limita a 60 próximos. Testado com mocks; SO físico não verificado. |
| Exportação nativa | `imprimir.ts`, `backupArquivo.ts` | PDF com fontes locais/cópia privada verificada antes de excluir temporário e abrir diálogo; JSON escrito/lido antes de disponibilizar. Falhas não abrem destino. Clipboard de fallback explícito. Pacote binário nativo e aparelho continuam pendentes. |
| Comparação | `Prioridades.tsx`, `ComparaveisPessoais.tsx`, `comparaveisPessoais.ts` | Dois/três imóveis por assunto, ordem temporária escolhida sem score, mesmo destino para distâncias retas. Filtros pessoais por bairro/tipologia/modalidade/área; contagem anterior ao corte e deduplicação conservadora de URL. Não é pesquisa de mercado. |
| Precisão e resiliência | `formatarCentavos`, derivadores e integrações | Um centavo não vira R$ 0. Ausência/zero preservados. Soma fora da precisão segura mostra erro editável, não quebra a página nem apresenta total presumido. Complementos opcionais preservam contratos v2/caderno antigo. |

## Validação final

Servidor Expo local usado: `http://localhost:8095`. Nenhuma publicação/infraestrutura remota. As três baterias de navegador bloquearam chamadas externas do app e não registraram chamadas externas ou erros de página.

| Verificação | Resultado real |
|---|---|
| `npm run verificar` | **48 suítes / 1.363 testes passaram**, tipagem e lint passaram. Há avisos conhecidos de `act` do ambiente de testes em movimento; não equivalem a aceite físico. |
| `npm run test:v1` com `POC_URL` local | **50 etapas** passaram em 375×812 e 1280×900, incluindo compra/aluguel, crédito deliberado, custo 2.500 + 600, prédio/área, notebook ilegível e persistência. |
| `scripts/finalizacao-smoke.mjs` | **40 capturas, zero erros**, em 375×812, 1280×900 e 360×812. Fluxos de consumo, cenário detalhado/editável, balancete com citações, água, expectativa, lembrete, fotos, OCR real e protocolo da extensão. |
| `scripts/recife-amplo-smoke.mjs` | **60 capturas, zero erros**, nas três dimensões. Backup completo web com PDF/foto, corrupção recusada, restauração/repetição, visitas, GPS simulado, prioridades/rotina, comparáveis, cronologia, compra e texto ampliado. |
| OCR adverso | Arquivo inválido, maior que 10 MB, imagem branca e cancelamento durante carregamento recusados sem aplicar texto ou modificar o caderno. Sem imagem enviada. |
| Corpus de rubricas | Oito documentos sintéticos; cinco propostas anotadas corretas com cinco citações localizáveis; conflito bloqueado e instruções hostis tratadas como dado. [Alcance e limites](CORPUS-2026-10-22.md). |
| Recursos OCR | Nove arquivos conferidos por SHA256/tamanho e motor instalado 7.0.0, licenças locais. `node scripts/verificar-ocr-local.mjs` passou. |
| Integridade do trabalho | `git diff --check` e sintaxe do popup passaram; root `index.html`, pitch, motion, refs e referências não têm alteração nesta rodada. Nenhuma mudança alheia descartada e nenhum commit automático. |

### Inspeção visual efetivamente realizada

As capturas foram abertas como imagens, não inferidas do resultado do teste. Foram examinadas folhas de contato e imagens em resolução original das telas modificadas em 375×812, 1280×900 e 360×812: consumo, balancete/citações, cronologia privada/pública, água, expectativa/experiência, lembrete, galeria, OCR/revisão/cancelamento, importação, editor de cenário, prioridades/rotina e comparáveis.

Nome longo quebra sem ocultar ações; caixa inicial/caução e pendências ficam legíveis; valores financeiros mantêm centavos; fonte/data/escopo não estão encobertos; novos controles permanecem nos grupos existentes. Teclado de hardware foi ensaiado com foco e Tab. Texto 200% foi aproximado por estilos no navegador, com capturas do editor e orçamento: botões crescem e quebram texto. Não é Dynamic Type nativo, teclado virtual ou leitor de tela.

As capturas de cenário mostram: 3.100 × 12 + 500 de mudança + 200 × 3 de extra = 38.300 de despesa conhecida; 500 + 5.000 de caução = 5.500 de caixa inicial. O cenário continua parcial por IPTU/seguro e outros itens desconhecidos do anúncio. Reserva zero não vira pendência; reserva desconhecida não vira zero.

Artefatos reproduzíveis completos estão em `out/v1/finalizacao-2026-10-22/` (ignorado pelo Git). Logs finais, resultados, folhas de contato e seleção de capturas ficam preservados também em [finalizacao-2026-10-22/](finalizacao-2026-10-22/), com manifesto SHA256. As capturas contêm fixtures sintéticas, não documentos de moradores.

## Decisões e limites

- Não há cobrança nova, API contratada, backend, envio automático, publicação, consulta de processo ou diagnóstico de engenharia. Dados demonstrativos do protótipo não foram usados como fatos.
- Notificações nativas/PDF/JSON têm código e testes simulados; **não foram executados em Android/iOS físico, Expo Go ou build nativo desta rodada**. SDK/importações seletivas evitam autorregistro de push; precisam ser revalidados ao atualizar o Expo.
- O Chromium isolado carregou a extensão, mas popup programático não concedeu `activeTab`; o erro de falta de acesso é explícito. Clique no ícone, atalho, captura privilegiada, clipboard da extensão e distribuição precisam do roteiro manual em `extensions/desktop/README.md`. O caminho de arquivo a partir do contrato e a revisão do app foram efetivamente testados.
- OCR local exige recursos disponíveis na origem; não foi criado service worker ou garantia de primeira instalação sem rede. Não existe OCR PDF multipágina/nativo ou avaliação universal de precisão. O corpus de rubricas não valida documentos livres.
- As adições do caderno são opcionais e legíveis pelo schema atual. Versões antigas do executável com schema estrito não reconhecem novos campos; preservar backup antes de voltar para um executável antigo. A versão atual continua aceitando caderno antigo.
- Não houve pesquisa/recrutamento, visita real, leitor de tela físico, medição de throughput/rádio ou inspeção predial. Nada disso foi inventado como resultado.

## Pendências distintas de autorização externa

A [matriz das 80 capacidades](PRONTIDAO-2026-10-22-FINAL.md) conserva cada pendência. Continuam existindo tarefas **de implementação local**, sem justificá-las por falta de credencial: exploração de lotes vizinhos F17; manifesto/frescor unificado F19; reajustes/sensibilidade ampliada F22–26; achados gerais de atas e vínculo deliberado de rateio F34; corpus independente/extração geral F35; sensores/calibração F65–66; pacote binário nativo F05; fila durável de sync F73; catálogo/ledger sandbox F76; preparo de papéis/consentimento profissional e schema agregado F77–78; ampliação de desempenho/acessibilidade F80. Fontes e validação geográfica de F47–59 também requerem trabalho de levantamento/EDA/implementação, e não foram anunciadas como integradas.

Dependências operacionais separadas: licenças/contratos de fontes, credenciais quando necessárias, backend/conta/ACL/sync/colaboração, pagamentos reais, moderação e transmissão de documentos. Isso exige decisão específica antes da ativação, sem impedir trabalho local independente. Pesquisa com pessoas e validação em aparelhos exigem evidência real.

Para lapidação, manter custos/proveniência/revisão e caderno privado como núcleo; agrupar OCR com revisão e finanças documentais com Edifício; melhorar primeiro instalação/limites/offline e densidade das listas; ocultar operações remotas indisponíveis. Nenhuma funcionalidade foi cortada por suposta falta de demanda sem pesquisa. Esses são encaminhamentos técnicos, não conclusão de utilidade com usuários.
