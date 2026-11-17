// VE12.03 — startup cost of the production web build (expo export), served statically: time from navigation to the
// Início screen being usable, at CPU 1× and 4× (Chrome DevTools throttling as a rough stand-in for a mid-range phone;
// NOT a device measurement). 5 cold loads each (new context, no cache).
//   URL=http://127.0.0.1:8099 node docs/aplicacao/execucoes/VE12/scripts/ve12-inicio.mjs
import { chromium } from "playwright";
const url = process.env.URL || "http://127.0.0.1:8099";
const b = await chromium.launch();
const out = {};
for (const taxa of [1, 4]) {
  const t = [];
  for (let i = 0; i < 5; i++) {
    const c = await b.newContext({ viewport: { width: 375, height: 812 } });
    const p = await c.newPage();
    const cdp = await c.newCDPSession(p);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: taxa });
    const t0 = Date.now();
    await p.goto(url, { waitUntil: "load" });
    await p.getByText("Colar link", { exact: false }).first().waitFor({ timeout: 120000 });
    t.push(Date.now() - t0);
    const heap = await p.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null));
    out[`heapMB_${taxa}x`] = heap;
    await c.close();
  }
  t.sort((x, y) => x - y);
  out[`cpu${taxa}x_ms`] = t;
  out[`cpu${taxa}x_mediana_ms`] = t[2];
}
await b.close();
console.log(JSON.stringify(out));
