// Service worker do Vereda na web (D036). Guarda a casca do app (o HTML, o bundle em /_expo/static e as fontes e
// imagens em /assets) para um dossiê aberto uma vez reabrir sem rede. As camadas de dados (/dados/…) não passam por
// aqui: a página as guarda ela mesma no Cache Storage ("vereda-dados-v1") depois de conferir tamanho e sha256.
// Só a origem do app; nada de fora é pedido nem guardado.
const CASCA = "vereda-casca-v1";
const daOrigem = (url) => new URL(url, self.location.origin).origin === self.location.origin;
const ehCasca = (caminho) => caminho === "/" || caminho.startsWith("/_expo/static/") || caminho.startsWith("/assets/");

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CASCA).then((c) => c.add("/")).catch(() => undefined).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil((async () => {
    for (const nome of await caches.keys()) if (nome.startsWith("vereda-casca-") && nome !== CASCA) await caches.delete(nome);
    await self.clients.claim();
  })());
});

// A página manda o que já baixou antes de o service worker assumir (primeira visita); o bundle de uma versão antiga
// que a página atual não usa sai do cache.
self.addEventListener("message", (evento) => {
  if (!evento.data || evento.data.tipo !== "guardar-casca" || !Array.isArray(evento.data.urls)) return;
  evento.waitUntil((async () => {
    const cache = await caches.open(CASCA);
    const urls = [...new Set(evento.data.urls.filter((u) => typeof u === "string" && daOrigem(u) && ehCasca(new URL(u).pathname)))];
    await Promise.all(urls.map(async (u) => { if (!(await cache.match(u))) await cache.add(u).catch(() => undefined); }));
    const bundles = new Set(urls.filter((u) => new URL(u).pathname.startsWith("/_expo/static/js/")));
    if (bundles.size === 0) return;
    for (const pedido of await cache.keys()) {
      if (new URL(pedido.url).pathname.startsWith("/_expo/static/js/") && !bundles.has(pedido.url)) await cache.delete(pedido);
    }
  })());
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET" || !daOrigem(pedido.url)) return;
  const caminho = new URL(pedido.url).pathname;
  if (pedido.mode === "navigate") {
    // Rede primeiro (uma versão nova chega assim que houver rede); sem rede, a última casca guardada. O app é de
    // página única: toda rota é o mesmo index.html.
    evento.respondWith((async () => {
      try {
        const resposta = await fetch(pedido);
        if (resposta.ok && (resposta.headers.get("content-type") || "").includes("text/html")) {
          const copia = resposta.clone();
          evento.waitUntil(caches.open(CASCA).then((c) => c.put("/", copia)));
        }
        return resposta;
      } catch {
        return (await caches.match("/", { cacheName: CASCA })) || Response.error();
      }
    })());
    return;
  }
  if (caminho.startsWith("/_expo/static/") || caminho.startsWith("/assets/")) {
    // Nomes com hash: o que está guardado não muda.
    evento.respondWith((async () => {
      const guardada = await caches.match(pedido, { cacheName: CASCA });
      if (guardada) return guardada;
      const resposta = await fetch(pedido);
      if (resposta.ok) {
        const copia = resposta.clone();
        evento.waitUntil(caches.open(CASCA).then((c) => c.put(pedido, copia)));
      }
      return resposta;
    })());
  }
});
