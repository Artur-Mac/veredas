/**
 * Títulos da página de verificação do portal (o desafio da Cloudflare). Só o título conta: "verifique" e "captcha"
 * aparecem em anúncios comuns ("verifique a disponibilidade"), e um anúncio inteiro não pode ser descartado por isso.
 * "Attention Required!" não entra: é o título da página de bloqueio, que não tem verificação a completar.
 */
export const PADRAO_DE_TITULO_DE_VERIFICACAO = /just a moment|um momento|verify you are human/i;

/**
 * Página de bloqueio do portal (Cloudflare "Sorry, you have been blocked", "Access denied"). Diferente do desafio, a
 * pessoa não tem o que fazer nela dentro do app: o portal recusa a página para apps de terceiros.
 */
export const PADRAO_DE_BLOQUEIO =
  /attention required|access denied|acesso negado|you have been blocked|why have i been blocked|you are unable to access|request blocked|error 1020|403 forbidden/i;

/** O texto da página de bloqueio é curto; o padrão só olha o começo, para não pegar frases soltas de um anúncio. */
const INICIO_DO_TEXTO = 2000;

/** Calculado no app, sobre a coleta já validada (título e texto). Só decide quando a página não rendeu dados. */
export function paginaBloqueada(titulo: string, texto: string): boolean {
  return PADRAO_DE_BLOQUEIO.test(titulo) || PADRAO_DE_BLOQUEIO.test(texto.slice(0, INICIO_DO_TEXTO));
}

/** O desafio também se denuncia por iframe ou script carregado de `challenges.cloudflare.com`. */
export const SELETOR_DE_DESAFIO = 'iframe[src*="challenges.cloudflare.com"], script[src*="challenges.cloudflare.com"]';

/**
 * Script injetado na WebView para coleta pontual de dados do anúncio.
 * Respeita estritamente os limites de tamanho do esquema Zod.
 * Termina com true;
 */
export const SCRIPT_COLETOR = `
(function() {
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
      var codigo = /id-(\\d+)/.exec(href || '');
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
          else if (c === '\\\\') escapado = true;
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

  function coletar() {
    try {
      var titulo = (document.title || '').slice(0, 300);
      var url = (window.location.href || '').slice(0, 2000);

      // JSON-LD
      var ld = [];
      var ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (var i = 0; i < ldScripts.length && ld.length < 10; i++) {
        var conteudo = ldScripts[i].innerText || ldScripts[i].textContent || '';
        if (conteudo && conteudo.length <= 200 * 1024) {
          ld.push(conteudo);
        }
      }

      // Estados da página
      var estados = [];
      var nextData = document.getElementById('__NEXT_DATA__');
      if (nextData) {
        var strNext = nextData.innerText || nextData.textContent || '';
        if (strNext && strNext.length <= 3 * 1024 * 1024) {
          estados.push(strNext);
        }
      }

      var initialData = document.getElementById('initial-data');
      if (initialData && estados.length < 3) {
        var dataJson = initialData.getAttribute('data-json') || '';
        if (dataJson && dataJson.length <= 3 * 1024 * 1024) {
          estados.push(dataJson);
        }
      }

      // Next.js com App Router (o ZAP desde 2026): o estado vem em pedaços em self.__next_f, sem __NEXT_DATA__. Recorta só o
      // objeto do anúncio (pelo código do link, ou o "listing") e tira o anunciante, que traz nome e telefone.
      var doNext = objetoDoAnuncioNoNext(document, window, url);
      if (doNext && estados.length < 3) estados.push(doNext);
      // Estados que a página guarda na janela, na ordem dos frameworks mais comuns nos portais (Redux, Nuxt, Apollo).
      var globais = ['__INITIAL_STATE__', '__NUXT__', '__APOLLO_STATE__'];
      for (var g = 0; g < globais.length && estados.length < 3; g++) {
        if (!window[globais[g]]) continue;
        try {
          var strState = JSON.stringify(window[globais[g]]);
          if (strState && strState.length <= 3 * 1024 * 1024) {
            estados.push(strState);
          }
        } catch(e) {}
      }
      var nuxtData = document.getElementById('__NUXT_DATA__');
      if (nuxtData && estados.length < 3) {
        var strNuxt = nuxtData.innerText || nuxtData.textContent || '';
        if (strNuxt && strNuxt.length <= 3 * 1024 * 1024) {
          estados.push(strNuxt);
        }
      }

      // Texto visível
      var mainEl = document.querySelector('main') || document.body;
      var texto = (mainEl ? (mainEl.innerText || '') : '').slice(0, 200000);

      // Verificação: o título do desafio, ou um iframe/script de challenges.cloudflare.com. Nunca o texto do anúncio.
      var verificacao = ${PADRAO_DE_TITULO_DE_VERIFICACAO.toString()}.test(titulo);
      if (!verificacao) {
        try {
          verificacao = document.querySelectorAll(${JSON.stringify(SELETOR_DE_DESAFIO)}).length > 0;
        } catch(e) {}
      }

      var payload = {
        url: url,
        titulo: titulo,
        ld: ld,
        estados: estados,
        texto: texto,
        verificacao: verificacao
      };

      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    } catch(err) {}
  }

  // O portal monta preço e condomínio depois do carregamento, e algumas seções só aparecem quando a pessoa rola até
  // elas. O coletor lê de novo em intervalos, rola a página uma vez até o fim e volta ao topo (como quem lê o anúncio),
  // e lê quando a página muda. O app para de ouvir quando já leu; aqui só há um teto de leituras.
  var leituras = 0;
  var TETO = 14;
  function coletarComTeto() {
    if (leituras >= TETO) return;
    leituras++;
    coletar();
  }
  function rolarAteOFim() {
    try {
      var altura = (document.body && document.body.scrollHeight) || 0;
      var passo = window.innerHeight || 600;
      var posicao = 0;
      var descer = function() {
        posicao += passo;
        window.scrollTo(0, posicao);
        if (posicao < altura) { setTimeout(descer, 120); } else { setTimeout(function() { window.scrollTo(0, 0); coletarComTeto(); }, 400); }
      };
      descer();
    } catch(e) {}
  }
  coletarComTeto();
  var esperas = [1500, 4000, 7000, 11000, 16000];
  for (var k = 0; k < esperas.length; k++) setTimeout(coletarComTeto, esperas[k]);
  setTimeout(rolarAteOFim, 2500);
  try {
    if (window.MutationObserver && document.body) {
      var agendada = false;
      new window.MutationObserver(function() {
        if (agendada || leituras >= TETO) return;
        agendada = true;
        setTimeout(function() { agendada = false; coletarComTeto(); }, 1200);
      }).observe(document.body, { childList: true, subtree: true });
    }
  } catch(e) {}
})();
true;
`;
