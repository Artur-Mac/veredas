/**
 * Títulos da página de verificação do portal (o desafio da Cloudflare). Só o título conta: "verifique" e "captcha"
 * aparecem em anúncios comuns ("verifique a disponibilidade"), e um anúncio inteiro não pode ser descartado por isso.
 */
export const PADRAO_DE_TITULO_DE_VERIFICACAO = /just a moment|um momento|attention required|verify you are human/i;

/** O desafio também se denuncia por iframe ou script carregado de `challenges.cloudflare.com`. */
export const SELETOR_DE_DESAFIO = 'iframe[src*="challenges.cloudflare.com"], script[src*="challenges.cloudflare.com"]';

/**
 * Script injetado na WebView para coleta pontual de dados do anúncio.
 * Respeita estritamente os limites de tamanho do esquema Zod.
 * Termina com true;
 */
export const SCRIPT_COLETOR = `
(function() {
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

      if (window.__INITIAL_STATE__ && estados.length < 3) {
        try {
          var strState = JSON.stringify(window.__INITIAL_STATE__);
          if (strState && strState.length <= 3 * 1024 * 1024) {
            estados.push(strState);
          }
        } catch(e) {}
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

  coletar();
  setTimeout(coletar, 2500);
})();
true;
`;
