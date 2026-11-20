// Navegação dos protótipos (fase 1). Tudo é link: a rota fica no endereço, depois do #.
//
//   #tela                 mostra <section class="tela" id="tela">
//   #tela+gaveta          a mesma tela com <section class="gaveta" id="g-gaveta"> aberta
//   #tela@ancora          a tela rolada até o elemento de id "tela-ancora"
//
// O index.html de cada opção declara, antes deste arquivo:
//   window.PROTOTIPO = { nome: "Opção A · Ficha de campo", resumo: "uma linha" };
//   window.TELAS = [{ rota: "caderno", nome: "Caderno", grupo: "Caderno", inteira: true }, …];
// `inteira: true` marca as telas que rolam (a captura guarda também a tira inteira).
// E um <template id="dock"> com a barra inferior; ela entra em toda tela que tiver data-dock="nome-da-aba".
//
// Controles sem rota (trocar Dia/Noite, 0%/3%/5%): data-escolhe="grupo:valor" no botão e data-quando="grupo:valor" no que aparece.
(function () {
  const TELAS = window.TELAS || [];
  const aparelho = document.getElementById("aparelho");
  const BARRA_DE_ESTADO =
    '<div class="estado" aria-hidden="true"><span>9:41</span><svg viewBox="0 0 66 12" fill="currentColor">' +
    '<rect x="0" y="8" width="3" height="4" rx="0.8"/><rect x="5" y="5.5" width="3" height="6.5" rx="0.8"/><rect x="10" y="3" width="3" height="9" rx="0.8"/><rect x="15" y="0" width="3" height="12" rx="0.8"/>' +
    '<path d="M31 2.2c2.5 0 4.7 1 6.3 2.6l-1.3 1.4a7 7 0 0 0-10 0l-1.3-1.4A8.9 8.9 0 0 1 31 2.2Zm0 3.7c1.4 0 2.7.6 3.6 1.5l-1.4 1.4a3.1 3.1 0 0 0-4.4 0l-1.4-1.4A5.1 5.1 0 0 1 31 5.9Zm0 3.5 1.6 1.7L31 12.6l-1.6-1.5L31 9.4Z"/>' +
    '<rect x="43.5" y="0.5" width="19" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.45"/><rect x="45" y="2" width="16" height="8" rx="1.8"/><rect x="63.6" y="4" width="1.6" height="4" rx="0.8" opacity="0.45"/></svg></div>';

  // Barra de estado e barra inferior em cada tela.
  const modeloDoDock = document.getElementById("dock");
  for (const tela of document.querySelectorAll(".tela")) {
    tela.insertAdjacentHTML("afterbegin", BARRA_DE_ESTADO);
    if (modeloDoDock && tela.dataset.dock) {
      tela.appendChild(modeloDoDock.content.cloneNode(true));
      for (const a of tela.querySelectorAll(".dock [data-aba]")) {
        const ativa = a.dataset.aba === tela.dataset.dock;
        a.setAttribute("aria-selected", String(ativa));
        if (ativa) a.setAttribute("aria-current", "page");
      }
    }
  }

  // Véu das gavetas.
  const veu = document.createElement("a");
  veu.className = "veu";
  veu.setAttribute("aria-label", "Fechar");
  veu.setAttribute("tabindex", "-1");
  aparelho.appendChild(veu);

  // Roteiro das telas (só no computador).
  const roteiro = document.getElementById("roteiro");
  if (roteiro) {
    const p = window.PROTOTIPO || {};
    let html = `<h1>${p.nome || ""}</h1>${p.resumo ? `<p>${p.resumo}</p>` : ""}`;
    let grupo = null;
    for (const t of TELAS) {
      if (t.grupo !== grupo) {
        grupo = t.grupo;
        html += `<h2>${grupo}</h2>`;
      }
      html += `<a href="#${t.rota}">${t.nome}</a>`;
    }
    roteiro.innerHTML = html;
  }

  const lerRota = () => {
    const h = decodeURIComponent(location.hash.slice(1)) || (TELAS[0] && TELAS[0].rota) || "";
    const [resto, ancora] = h.split("@");
    const [tela, gaveta] = resto.split("+");
    return { tela, gaveta: gaveta || null, ancora: ancora || null, inteira: h };
  };

  let telaAnterior = null;
  function aplicar() {
    const r = lerRota();
    const alvo = document.getElementById(r.tela);
    if (!alvo || !alvo.classList.contains("tela")) {
      if (TELAS[0]) location.replace("#" + TELAS[0].rota);
      return;
    }
    for (const t of document.querySelectorAll(".tela")) t.classList.toggle("ativa", t === alvo);
    let aberta = null;
    for (const g of document.querySelectorAll(".gaveta")) {
      const e = r.gaveta && g.id === "g-" + r.gaveta;
      g.classList.toggle("aberta", !!e);
      g.toggleAttribute("inert", !e);
      if (e) aberta = g;
    }
    veu.classList.toggle("visivel", !!aberta);
    veu.setAttribute("href", "#" + r.tela);
    alvo.toggleAttribute("inert", !!aberta);
    for (const a of document.querySelectorAll("[data-fechar]")) a.setAttribute("href", "#" + r.tela);

    const rolagem = alvo.querySelector(".rolagem");
    if (rolagem) {
      if (r.ancora) {
        const el = document.getElementById(r.tela + "-" + r.ancora);
        if (el) {
          const fixa = alvo.querySelector(".fixa-no-topo");
          const folga = fixa ? fixa.getBoundingClientRect().height + 8 : 8;
          rolagem.scrollTop += el.getBoundingClientRect().top - rolagem.getBoundingClientRect().top - folga;
        }
      } else if (telaAnterior !== r.tela) rolagem.scrollTop = 0;
    }
    if (aberta) {
      const corpo = aberta.querySelector(".corpo");
      if (corpo) corpo.scrollTop = 0;
      const titulo = aberta.querySelector("h2, h3");
      if (titulo) {
        titulo.setAttribute("tabindex", "-1");
        titulo.focus({ preventScroll: true });
      }
    }
    telaAnterior = r.tela;
    if (roteiro) for (const a of roteiro.querySelectorAll("a")) a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + r.inteira));
    const atual = TELAS.find((t) => t.rota === r.inteira);
    document.title = `${(window.PROTOTIPO || {}).nome || "Protótipo"}${atual ? " · " + atual.nome : ""}`;
  }

  // Controles sem rota: data-escolhe="grupo:valor" mostra os [data-quando="grupo:valor"] e esconde os outros do grupo.
  function escolher(grupo, valor) {
    for (const b of document.querySelectorAll(`[data-escolhe^="${grupo}:"]`)) {
      const marcado = b.dataset.escolhe === `${grupo}:${valor}`;
      b.setAttribute(b.getAttribute("role") === "tab" ? "aria-selected" : "aria-checked", String(marcado));
    }
    for (const el of document.querySelectorAll(`[data-quando^="${grupo}:"]`)) el.hidden = el.dataset.quando !== `${grupo}:${valor}`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-escolhe]");
    if (b) {
      const [grupo, valor] = b.dataset.escolhe.split(":");
      escolher(grupo, valor);
      return;
    }
    // Liga e desliga (favoritar, marcar um ponto do roteiro).
    const liga = e.target.closest("[data-liga]");
    if (liga) {
      const atributo = liga.getAttribute("role") === "checkbox" ? "aria-checked" : "aria-pressed";
      liga.setAttribute(atributo, String(liga.getAttribute(atributo) !== "true"));
    }
  });
  // Ao abrir, cada grupo mostra a opção marcada no HTML (ou a primeira). Com data-sem-inicial em qualquer botão do grupo,
  // nada vem marcado: é o caso das respostas que a pessoa ainda não deu (ponto da visita, motivo do descarte).
  const vistos = new Set();
  for (const b of document.querySelectorAll("[data-escolhe]")) {
    const [grupo] = b.dataset.escolhe.split(":");
    if (vistos.has(grupo)) continue;
    vistos.add(grupo);
    const marcada = document.querySelector(`[data-escolhe^="${grupo}:"][aria-checked="true"], [data-escolhe^="${grupo}:"][aria-selected="true"]`);
    if (!marcada && document.querySelector(`[data-escolhe^="${grupo}:"][data-sem-inicial]`)) {
      for (const el of document.querySelectorAll(`[data-quando^="${grupo}:"]`)) el.hidden = true;
      continue;
    }
    escolher(grupo, (marcada || b).dataset.escolhe.split(":")[1]);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lerRota().gaveta) location.hash = "#" + lerRota().tela;
  });
  if (new URLSearchParams(location.search).has("inteira")) document.documentElement.classList.add("inteira");
  window.addEventListener("hashchange", aplicar);
  aplicar();
  document.documentElement.dataset.pronto = "1";
})();
