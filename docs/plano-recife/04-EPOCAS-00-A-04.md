# 04 — Épocas 00 a 04: fundamento e cobertura Recife

Cada unidade abaixo exige registro de comportamento atual antes de editar. Caminhos são pontos de inspeção, não autorização para alterar todos eles. Módulo “novo” é uma proposta a ajustar ao padrão encontrado. Aplicar os documentos 02, 03 e 07 a todas as unidades.

## Época 00 — Reconciliação verificável

**Capacidades:** F03, F16, F21, F71, F79. **Entrada:** checkout atual e documentos históricos. **Saída:** baseline reproduzível, sem reconstruir itens já corrigidos.

### EP00.01 — Inventário do estado real

- Ler instruções aplicáveis, README, este pacote e registros de T01/E01/E04/R00. Inspecionar diff sem descartar alterações de terceiros.
- Criar `docs/plano-recife/execucoes/EP00.md` com commit quando houver, arquivos já modificados, versões, plataformas acessíveis e tabela capacidade → código → teste → lacuna. Criar registros equivalentes nas épocas seguintes.
- Conferir `src/dados/contratos.ts`, `src/estado/Analises.tsx`, `src/estado/armazenamento.ts`, `src/estado/Carteira.tsx`, rotas e scripts de teste. A leitura histórica não comprova implementação.
- Aceite: cada item existente selecionado tem referência de código e resultado de teste ou limitação explícita; exemplos não são contabilizados como recurso real.

### EP00.02 — Não regredir o lote A nem a assinatura

- Reexecutar testes focados de persistência, busca/identificação, custos, comparação e mensagem, adaptando nomes ao checkout.
- Reproduzir falha seletiva de `CHAVE_ATIVA` depois de persistir a lista: análise continua salva; seleção pode ser recuperada; erro de conteúdo permanece erro; requisições concorrentes mantêm ordem.
- Entrada só por área/bairro deve pedir detalhe ou continuar sem prédio; motivos de correspondência e total antes do corte quando aplicável; pontos não são probabilidade; confirmação deliberada não cobra duas vezes.
- Fixture aluguel 2.500 + condomínio 600, IPTU/seguro ausentes: Salvos, dossiê e comparação mostram 3.100 conhecido e as duas pendências. Compra permanece separada. Mensagem mantém assinatura VEREDA e prévia editável.
- Se passar, registrar “já resolvido” com evidência. Corrigir apenas regressão confirmada, não reimplementar o item.

### EP00.03 — Baseline de qualidade e hipóteses

- Executar `npm run verificar`; iniciar servidor local e executar `npm run test:v1` com `POC_URL` correto. Salvar resultados reais, inclusive falhas preexistentes.
- Medir leitura de cadernos sintéticos de 10/100/500 análises, tamanho do índice e carregamento de bairro no mesmo dispositivo. Registrar build/modo/aparelho, mediana e p95; não comparar desenvolvimento e produção como equivalentes.
- Abrir capturas das superfícies principais nos tamanhos do documento 07. Registrar o que impede fluxo, sem redesenho amplo nesta época.
- Auditar alegações dos documentos de pesquisa: localizar instrumento, respostas brutas e consentimento disponíveis; se ausentes, classificar como resultado interno declarado sem autenticação primária. Pesquisa de público segue em paralelo.
- Saída: tabela de falhas com responsável/época; não afirmar que baseline passou se um ambiente não rodou.

## Época 01 — Organização da experiência e interface

**Capacidades:** F01, F02, F80. **Depende:** 00. **Locais:** `src/componentes/casca/`, `src/tema/tokens.ts`, `src/app/(abas)/`, `src/componentes/dossie-v1/`.

### EP01.01 — Casca e navegação contínua

- Comparar protótipo raiz e app em identificação, ritmo tipográfico, cabeçalho, ações e densidade. Registrar tabela de diferenças confirmadas e alteração pretendida.
- Reusar cabeçalho, gaveta, dock, foco e coluna existentes. Implementar navegação conforme documento 02, preservando histórico/voltar e seleção ativa. Links profundos sem análise válida levam a estado recuperável, nunca a crash.
- Aceite: iniciar sem dados, abrir análise, navegar entre quatro áreas, abrir Salvos e voltar preserva contexto; URL/rota inválida oferece retorno. Teclado e leitor de tela identificam área ativa.

### EP01.02 — Componentes de informação e estados

- Consolidar apresentação de fonte, pendência, estado vazio, erro recuperável e ação secundária onde houver duplicação real. Não criar framework genérico de cartões antes de dois usos comprovados.
- Aplicar hierarquia resumo → detalhe → origem; no máximo três questões prioritárias em Destaques, com acesso a todas. Prioridade deriva de necessidade declarada/pendência, não de nota de risco do prédio.
- Aceite: dados completos, parciais, zero explícito, sem prédio e sem cobertura não deixam espaço vazio inexplicável nem exibem número simulado. Mesmo fato apresenta mesmo rótulo em todas as superfícies.

### EP01.03 — Cadastro progressivo e recuperação

- Ajustar formulário existente para identidade, custos e revisão, preservando modo manual simples e campos opcionais. Não exigir endereço exato para salvar.
- Rascunho local inclui versão, atualização e campos editados; limpar só após gravação confirmada ou descarte deliberado. Ao reabrir, oferecer continuar e descartar.
- Aceite: teclado cobre campo inferior → ainda é possível concluir; matar/reabrir recupera rascunho suportado; voltar não zera campos; salvar duas vezes não duplica análise.

### EP01.04 — Revisão visual e acessível

- Executar matriz 375×812, 1280×900, 360 px, nome longo, informação incompleta, 200% de texto e teclado. Revisar foco, contraste, área de toque, rolagem e área segura.
- Capturar e abrir imagens antes/depois; registrar defeitos corrigidos e limites de validação nativa. Nenhuma alteração em `index.html`, pitch ou motion.
- Saída: componentes básicos estáveis para épocas futuras, sem tentar desenhar 80 funcionalidades de uma vez.

## Época 02 — Caderno, recuperação e arquivos

**Capacidades:** F03–F07. **Depende:** 00 e componentes de 01. **Locais:** contratos, estado, armazenamento; novos módulos de backup/mídia junto ao domínio existente.

### EP02.01 — Evolução de schema e escrita confiável

- Desenhar campos mínimos para visitas/documentos/cenários, sem implementar suas telas ainda. Se exigir v3, aplicar protocolo de migração do documento 03 e preservar originais.
- Testar v1→v2→v3 quando aplicável, v2 válido, dados corrompidos, versão futura, falha de leitura, quota e falha na promoção. Dados desconhecidos não são descartados silenciosamente por parser.
- Aceite: falha em cada estágio mantém o caderno anterior recuperável; seleção ativa ausente escolhe fallback válido sem apagar lista; concorrência não perde atualização.

### EP02.02 — Exportar e importar metadados

- Exportação tem versão de formato, data, contagens e aviso de mídia não incluída quando for JSON. Excluir carteira/créditos e segredos.
- Importar em staging, validar limites e mostrar revisão antes da gravação. ID igual/conteúdo igual não duplica; conteúdo diferente exige escolha ou nova cópia vinculada à origem.
- Aceite: exportar→importar em caderno vazio preserva fatos, ausências, perguntas e datas; reimportar é idempotente; JSON inválido/grande não altera nada; interrupção não deixa metade das análises incorporada.

### EP02.03 — Fotos e documentos persistentes

- Integrar seletor instalado; copiar URIs temporárias, otimizar fotos e salvar metadados somente após persistência. Não baixar fotos de portal automaticamente.
- Implementar limite, progresso, cancelamento, reordenação de capa e exclusão com referência. Abrir documento sem executar conteúdo ativo; validar formato real e tamanho.
- Aceite: reiniciar/offline preserva foto; permissão negada permite continuar; arquivo inválido não entra; quota/falha de metadado não produz anexo fantasma; nomes de arquivo não viram caminhos arbitrários.

### EP02.04 — Backup com mídia e recuperação assistida

- Após JSON confiável, adicionar pacote com manifesto/checksums e tamanho de expansão limitado. Testar links ausentes, checksum errado, duplicação, path traversal e restauração em versão compatível.
- Exibir armazenamento usado e itens faltantes; permitir exportar bytes originais em recuperação. Limpeza de órfãos usa referências verificadas e janela segura, nunca rollback improvisado.
- Saída: caderno antigo continua; “backup completo” só é rótulo permitido quando inclui arquivos e é restaurado em teste.

## Época 03 — Entrada multimodal revisável

**Capacidades:** F02, F08–F13. **Depende:** 01–02. **Locais:** `src/dados/extrator/`, `src/componentes/leitor/`, `src/estado/compartilhamento.ts`, `src/app/+native-intent.tsx`, `plugins/compartilhar/`.

### EP03.01 — Unificar proposta de importação

- Formulário, texto, URL e HTML produzem a mesma proposta de campos com origem/trecho, sem gravar fatos automaticamente. Campo editado pela pessoa prevalece até revisão explícita.
- Resolver conflitos de preço, aluguel/venda, condomínio e endereço com apresentação lado a lado. Link sozinho não autoriza inventar conteúdo. Dados pessoais/HTML bruto não entram no caderno ou logs por padrão.
- Aceite: link sem preço, múltiplos preços, compra+aluguel, parcela “a partir de”, anúncio expirado e duplicata resultam em proposta honesta; cancelar não cobra nem salva análise incompleta sem ação deliberada.

### EP03.02 — WebView e compartilhamento nativo

- Preservar leitura visível já iniciada pela pessoa, tratamento de bloqueio e saída para colar texto/manual. Não contornar login, CAPTCHA ou antirobô.
- Verificar URL/texto Android, PROCESS_TEXT, Safari/iOS e início frio/quente com build real. Usar ID de recebimento para evitar duplicação e expiração do payload temporário.
- Aceite: compartilhar duas vezes, trocar de app, cancelar, URL inválida e receber sem app aberto não perdem rascunho nem criam análises duplas. Web tem alternativa explícita; teste web não comprova extensão nativa.

### EP03.03 — Imagem e OCR local

- Seleção manual de screenshot → recorte opcional → OCR em adaptador compatível com versão/build → proposta com trechos e revisão. Validar biblioteca, licenças, tamanho e suporte em aparelho antes de instalar.
- Preferir processamento local; se indisponível, permitir transcrição manual. Não enviar imagem remotamente como fallback silencioso.
- Aceite: valor com separador brasileiro, condomínio ausente, duas imagens conflitantes, texto ilegível e cancelamento não produzem fatos sem revisão. Rotular extração e preservar origem da imagem quando escolhida para guardar.

### EP03.04 — Extensão e feed autorizado

- Extensão desktop é iniciada pela pessoa, com acesso apenas à aba acionada e prévia de campos; protocolar entrega ao app sem endpoint público improvisado. Implementação isolada e documentação de instalação local.
- Feed Kenlo ou equivalente: obter documentação/credencial autorizada, escopo, direito de armazenamento, IDs estáveis e amostra de Recife. Criar adaptador somente após contrato verificável. Nunca usar segredo no bundle.
- Aceite extensão: permissões mínimas, aba incompatível, payload inválido e importação repetida. Aceite feed: paginação, atualização, remoção, rate limit, revogação e origem por campo. Sem acesso: registrar bloqueio específico, continuar entradas independentes; não declarar feed pronto com fixture.

## Época 04 — Recife municipal, identidade e proveniência

**Capacidades:** F15–F20. **Depende:** 00–02. **Locais:** `scripts/dados/construir-indice-recife.mjs`, `scripts/dados/rua/`, `src/dados/recife/`, busca/alternativas de prédio.

### EP04.01 — Manifestos e qualidade antes da expansão

- Inventariar as cinco partições atuais e fontes; gerar manifesto por camada conforme documento 03, sem renomear janelas históricas como recentes.
- Conferir licença/condições e campos mínimos; criar validações de schema, duplicação, limites municipais, coordenadas, datas e geometrias. Relatório deve separar descartes, sem associação e sem cobertura.
- Aceite: arquivo truncado, schema alterado e coordenada invertida impedem ativar versão nova; índice anterior permanece legível. Fatos exibem referência e consulta distintas.

### EP04.02 — CNEFE e busca explicável

- Preservar `NV_GEO_COORD` hoje perdido na normalização; criar fixtures para cada código efetivamente presente, consultando dicionário oficial. Não atribuir significado por chute.
- Normalizar abreviações com regras testadas, manter endereço original, múltiplos candidatos e motivos. Área/bairro limita busca, não identifica prédio. Expor contagem total antes do corte.
- Aceite: rua homônima, sem número, múltiplas portas no lote, bairro limítrofe, erro de número e qualidade baixa levam à abstenção/alternativas. Confirmar prédio é ação deliberada idempotente, sem nova regra de cobrança.

### EP04.03 — Expandir partições para Recife

- Obter lista/limites oficiais de bairros, gerar todas as partições que tenham dados válidos e índice leve de disponibilidade. Carregar bairro sob demanda, evitar embutir todos os registros brutos no cliente.
- Comparar contagens contra fontes e amostra estratificada por bairro/tipologia/precisão. Metas propostas: nenhum registro fora do escopo sem justificativa; nenhum ID duplicado indevido; 100% dos registros publicados passam schema. Taxa de associação é publicada, não elevada por forçar matches.
- Aceite: bairro novo, bairro sem camada, limite municipal e arquivo indisponível não quebram os cinco existentes. Medir tamanho/memória/tempo contra baseline. Cobertura incompleta continua explicitamente parcial.

### EP04.04 — Lote, vizinhança e operação de índice

- Mapa apresenta lote e alternativas, sem confundir torre/unidade. Lista acessível oferece mesma seleção e fontes. Lotes vizinhos mostram vínculo geométrico e contexto, não inferência de impacto automático.
- Gerar atualização reproduzível em diretório de versão, validar antes de apontar manifesto ativo; ensaiar rollback de índice sem tocar em dados pessoais. Configurar verificação manual de frescor e documentação antes de automatizar agenda.
- Saída: matriz municipal de cobertura e relatório de amostra, pipeline reproduzível e lista de camadas bloqueadas. Nenhum deploy remoto é autorizado por este plano.
