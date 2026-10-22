// Coleta da página que a pessoa compartilha do Safari (iOS). Roda dentro da extensão de compartilhamento, no arquivo
// de pré-processamento (NSExtensionJavaScriptPreprocessingFile), sobre a página que já está na tela dela.
//
// É a mesma coleta da WebView (`SCRIPT_COLETOR`, src/componentes/leitor/coletor.ts), com os mesmos limites de
// `esquemaColetaDaPagina` (src/dados/extrator/pagina.ts). Um teste roda as duas sobre a mesma página e confere que
// devolvem o mesmo objeto. Fica em JavaScript simples, sem importar nada: o plugin copia o código da função para o
// arquivo do Safari na hora do prebuild.

/** Chave em que a coleta viaja dentro de `meta` (as meta tags que a extensão já devolve ao app). */
const CHAVE_DA_COLETA = "vereda:coleta";

/** Títulos do desafio da Cloudflare; o de bloqueio ("Attention Required!") não entra. Igual a coletor.ts. */
const PADRAO_DE_TITULO_DE_VERIFICACAO = /just a moment|um momento|verify you are human/i;
const SELETOR_DE_DESAFIO = 'iframe[src*="challenges.cloudflare.com"], script[src*="challenges.cloudflare.com"]';

/**
 * Lê a página aberta: endereço, título, blocos JSON-LD, estado da página (`__NEXT_DATA__`, `initial-data`,
 * `__INITIAL_STATE__`) e o texto visível de `main` ou `body`. Devolve o objeto; quem chama decide como enviar.
 * Tudo o que ela usa chega pelos parâmetros, para o código poder ser copiado para fora deste arquivo.
 */
function coletarPagina(documento, janela, padraoDeVerificacao, seletorDeDesafio) {
  function objetoDoAnuncioNoNext(documento, janela, href) {
    try {
      var partes = janela.__next_f || [];
      var texto = '';
      for (var p = 0; p < partes.length && texto.length < 8 * 1024 * 1024; p++) {
        if (partes[p] && typeof partes[p][1] === 'string') texto += partes[p][1];
      }
      // Depois de montar a página, o Next esvazia self.__next_f; os pedaços continuam nos <script> que o chamam.
      if (!texto) {
        var scripts = documento.querySelectorAll('script');
        for (var q = 0; q < scripts.length && texto.length < 8 * 1024 * 1024; q++) {
          var codigoDoScript = scripts[q].textContent || '';
          var abre = codigoDoScript.indexOf('self.__next_f.push(');
          if (abre < 0) continue;
          try {
            var pedaco = JSON.parse(codigoDoScript.slice(abre + 19, codigoDoScript.lastIndexOf(')')));
            if (pedaco && typeof pedaco[1] === 'string') texto += pedaco[1];
          } catch (e) {}
        }
      }
      var codigo = /id-(\d+)/.exec(href || '');
      var inicio = codigo ? texto.indexOf('{"id":"' + codigo[1] + '"') : -1;
      if (inicio < 0) {
        var chave = texto.indexOf('"listing":{');
        if (chave >= 0) inicio = chave + 10;
      }
      if (!texto || inicio < 0) return null;
      var nivel = 0, emTexto = false, escapado = false;
      for (var j = inicio; j < texto.length && j - inicio < 3 * 1024 * 1024; j++) {
        var c = texto.charAt(j);
        if (emTexto) {
          if (escapado) escapado = false;
          else if (c === '\\') escapado = true;
          else if (c === '"') emTexto = false;
          continue;
        }
        if (c === '"') emTexto = true;
        else if (c === '{') nivel++;
        else if (c === '}') {
          nivel--;
          if (nivel === 0) {
            var anuncio = JSON.parse(texto.slice(inicio, j + 1));
            delete anuncio.advertiser;
            return JSON.stringify({ listing: anuncio });
          }
        }
      }
    } catch (e) {}
    return null;
  }
  var titulo = (documento.title || "").slice(0, 300);
  var url = ((janela.location && janela.location.href) || "").slice(0, 2000);

  var ld = [];
  var blocos = documento.querySelectorAll('script[type="application/ld+json"]');
  for (var i = 0; i < blocos.length && ld.length < 10; i++) {
    var conteudo = blocos[i].innerText || blocos[i].textContent || "";
    if (conteudo && conteudo.length <= 200 * 1024) ld.push(conteudo);
  }

  var estados = [];
  var nextData = documento.getElementById("__NEXT_DATA__");
  if (nextData) {
    var textoDoNext = nextData.innerText || nextData.textContent || "";
    if (textoDoNext && textoDoNext.length <= 3 * 1024 * 1024) estados.push(textoDoNext);
  }
  var initialData = documento.getElementById("initial-data");
  if (initialData && estados.length < 3) {
    var dataJson = initialData.getAttribute("data-json") || "";
    if (dataJson && dataJson.length <= 3 * 1024 * 1024) estados.push(dataJson);
  }
  // Next.js com App Router (o ZAP desde 2026): o objeto do anúncio sai de self.__next_f, sem o anunciante.
  var doNext = objetoDoAnuncioNoNext(documento, janela, url);
  if (doNext && estados.length < 3) estados.push(doNext);
  var globais = ["__INITIAL_STATE__", "__NUXT__", "__APOLLO_STATE__"];
  for (var g = 0; g < globais.length && estados.length < 3; g++) {
    if (!janela[globais[g]]) continue;
    try {
      var textoDoEstado = JSON.stringify(janela[globais[g]]);
      if (textoDoEstado && textoDoEstado.length <= 3 * 1024 * 1024) estados.push(textoDoEstado);
    } catch (e) {
      // estado com referência circular: fica de fora
    }
  }
  var nuxtData = documento.getElementById("__NUXT_DATA__");
  if (nuxtData && estados.length < 3) {
    var textoDoNuxt = nuxtData.innerText || nuxtData.textContent || "";
    if (textoDoNuxt && textoDoNuxt.length <= 3 * 1024 * 1024) estados.push(textoDoNuxt);
  }

  var principal = documento.querySelector("main") || documento.body;
  var texto = (principal ? principal.innerText || "" : "").slice(0, 200000);

  var verificacao = padraoDeVerificacao.test(titulo);
  if (!verificacao) {
    try {
      verificacao = documento.querySelectorAll(seletorDeDesafio).length > 0;
    } catch (e) {
      // seletor recusado: sem sinal de desafio
    }
  }

  return { url: url, titulo: titulo, ld: ld, estados: estados, texto: texto, verificacao: verificacao };
}

/**
 * Trecho que o plugin injeta no pré-processador da biblioteca (`preprocessorInjectJS` do expo-share-intent). Ele roda
 * dentro de `run()`, onde `metas` já tem o título e as meta tags; a coleta entra como texto JSON numa chave própria.
 * Um erro na coleta não impede o compartilhamento: o app recebe pelo menos o link.
 */
function trechoDoPreprocessador() {
  return [
    "try {",
    `  metas[${JSON.stringify(CHAVE_DA_COLETA)}] = JSON.stringify((${coletarPagina.toString()})(document, window, ${PADRAO_DE_TITULO_DE_VERIFICACAO.toString()}, ${JSON.stringify(SELETOR_DE_DESAFIO)}));`,
    "} catch (e) {}",
  ].join("\n");
}

module.exports = {
  CHAVE_DA_COLETA,
  PADRAO_DE_TITULO_DE_VERIFICACAO,
  SELETOR_DE_DESAFIO,
  coletarPagina,
  trechoDoPreprocessador,
};
