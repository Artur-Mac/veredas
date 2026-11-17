# Extensão local VEREDA

Chrome/Chromium Manifest V3. Em `chrome://extensions`, ative modo de desenvolvedor, escolha **Carregar sem compactação** e selecione esta pasta. Nada foi publicado em loja.

Na página do anúncio, clique na extensão e **Ler esta aba**. A seleção visível tem preferência; sem seleção, lê texto visível de `main`/`body`, limitado a 200 mil caracteres. Confira e remova dados pessoais na prévia. Use o arquivo `vereda-anuncio.json` no controle de importação do app ou copie o texto. A extensão não salva análises, confirma prédios ou cobra créditos.

Permissões: `activeTab` dá acesso temporário à aba acionada, `scripting` executa a coleta nessa aba e `clipboardWrite` permite a cópia deliberada. Sem host global, serviço em background, requests de rede, cookies, scraping periódico, login ou contorno de CAPTCHA. Páginas internas e conteúdo inacessível são recusados. Não capturamos campos de formulário, HTML ou imagens.

O arquivo contém conteúdo privado escolhido pela pessoa; não deve ser publicado. O ID é SHA256 de URL + texto (prefixo de 40 hex), validado no app. Importação repetida abre a análise já salva; não grava/compra automaticamente. Cancelar a revisão não altera o caderno.

Fontes de identidade copiadas do projeto com respectivas licenças OFL. Documentação de API: https://developer.chrome.com/docs/extensions/reference/api/scripting e https://developer.chrome.com/docs/extensions/develop/concepts/activeTab.

## Aceite pendente antes de distribuir

A instalação sem compactação foi conferida em um perfil temporário isolado do Chromium. O popup acionado programaticamente no navegador sem janela não reproduziu a concessão `activeTab`; isso não comprova o caminho privilegiado de leitura. Não foi publicada nem declarada pronta para distribuição.

Em Chrome/Chromium com janela: abra um anúncio de teste, selecione uma frase, clique no ícone da extensão (ou Alt+Shift+V) e em **Ler esta aba**; a prévia deve conter só a seleção. Repita sem seleção e confira texto visível. Tente em `chrome://extensions` e confirme recusa. Edite a prévia, baixe o arquivo e importe no VEREDA: nenhuma análise deve ser salva antes da revisão/ação deliberada. Reimporte o mesmo arquivo: deve abrir a análise já existente sem nova cobrança ou sobrescrita. Confira cópia para clipboard e navegação/troca de aba: o acesso não deve persistir em outra origem. Registre navegador/versão e resultados reais.
