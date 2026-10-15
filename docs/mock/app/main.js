import { carregarDossies, IDS_DOSSIES } from "./dados.js";
import { estado, seccoesAbertas } from "./estado.js";
import { ir, registrarVisita, voltar } from "./nav.js";
import {
  telaMeus, telaLer, telaConfirmarLote, telaDossie, telaMapa, telaVisita, telaAoVivo, telaCaminhos, telaComparar,
  folhaFonte, folhaContestar, telaLinhaDoTempo, folhaDomicilio, telaSobre,
} from "./telas.js";

const ROTAS = [
  { tela: "T1", padrao: "/", criar: telaMeus },
  { tela: "T2", padrao: "/ler", criar: telaLer },
  { tela: "T3", padrao: "/dossie/:id/confirmar-lote", criar: telaConfirmarLote },
  { tela: "T4", padrao: "/dossie/:id", criar: telaDossie },
  { tela: "T5", padrao: "/dossie/:id/mapa", criar: telaMapa },
  { tela: "T6", padrao: "/dossie/:id/visita", criar: telaVisita },
  { tela: "T7", padrao: "/dossie/:id/visita/ao-vivo", criar: telaAoVivo },
  { tela: "T8", padrao: "/dossie/:id/caminhos", criar: telaCaminhos },
  { tela: "T9", padrao: "/comparar", criar: telaComparar },
  { tela: "T10", padrao: "/dossie/:id/fonte/:fato", criar: folhaFonte, folha: true },
  { tela: "T11", padrao: "/dossie/:id/contestar/:fato", criar: folhaContestar, folha: true },
  { tela: "T13", padrao: "/dossie/:id/linha-do-tempo", criar: telaLinhaDoTempo, final: true },
  { tela: "T14", padrao: "/dossie/:id/domicilio", criar: folhaDomicilio, folha: true, final: true },
  { tela: "T15", padrao: "/sobre-os-dados", criar: telaSobre },
];

const NOMES_DAS_TELAS = {
  T1: "Meus dossiês", T2: "Lendo o anúncio", T3: "Confirmar o lote", T4: "Dossiê", T5: "Mapa", T6: "Visita", T7: "Modo visita",
  T8: "Caminhos diários", T9: "Comparar", T10: "Ver fonte", T11: "Isso está errado", T13: "Linha do tempo do prédio",
  T14: "Dados do domicílio", T15: "Sobre os dados",
};

const ESTADOS_DE_T2 = [
  ["", "lendo"], ["nao-abriu", "não abriu"], ["nao-e-anuncio", "não é anúncio de apartamento"], ["fora", "fora dos bairros cobertos"],
  ["sem-conexao", "Sem conexão"], ["lote-nao-encontrado", "Lote não encontrado"],
];

const PREFERENCIAS = "vereda-mock-preferencias";
const aparelhoEl = document.querySelector("[data-aparelho]");
const barraEl = document.querySelector("[data-mock-barra]");
let limpar = [];
let rotaAtual = null;
const rolagens = new Map();

function lerPreferencias() {
  try {
    return { tema: "sistema", final: true, dossie: "boa-viagem", ...JSON.parse(localStorage.getItem(PREFERENCIAS) || "{}") };
  } catch {
    return { tema: "sistema", final: true, dossie: "boa-viagem" };
  }
}

function gravarPreferencias(mudanca) {
  const novas = { ...lerPreferencias(), ...mudanca };
  try {
    localStorage.setItem(PREFERENCIAS, JSON.stringify(novas));
  } catch {
    return novas;
  }
  return novas;
}

const escuroDoSistema = matchMedia("(prefers-color-scheme: dark)");

function aplicarTema() {
  const { tema } = lerPreferencias();
  const escuro = tema === "escuro" || (tema === "sistema" && escuroDoSistema.matches);
  document.documentElement.dataset.tema = escuro ? "escuro" : "claro";
}

function aplicarFinal() {
  document.body.dataset.final = lerPreferencias().final ? "sim" : "nao";
}

function resolver(hash) {
  const [caminho, busca = ""] = (hash.replace(/^#/, "") || "/").split("?");
  const partes = caminho.split("/").filter(Boolean);
  for (const rota of ROTAS) {
    const molde = rota.padrao.split("/").filter(Boolean);
    if (molde.length !== partes.length) continue;
    const params = {};
    const confere = molde.every((pedaco, i) => {
      if (pedaco.startsWith(":")) {
        params[pedaco.slice(1)] = decodeURIComponent(partes[i]);
        return true;
      }
      return pedaco === partes[i];
    });
    if (confere) return { ...rota, params, query: new URLSearchParams(busca), caminho };
  }
  return null;
}

function paiDe(rota) {
  if (!rota || !rota.params.id) return "#/";
  if (rota.tela === "T4") return "#/";
  return `#/dossie/${rota.params.id}`;
}

function chaveDeRolagem(rota) {
  return `${rota.tela === "T10" || rota.tela === "T11" || rota.tela === "T14" ? "T4" : rota.tela}/${rota.params.id || ""}`;
}

function guardarRolagem() {
  if (!rotaAtual) return;
  const rolagem = aparelhoEl.querySelector(".tela-rolagem");
  if (rolagem) rolagens.set(chaveDeRolagem(rotaAtual), rolagem.scrollTop);
}

function renderizar() {
  const rota = resolver(location.hash);
  if (!rota) {
    ir("#/", true);
    return;
  }
  if (rota.final && document.body.dataset.final === "nao") {
    ir(`#/dossie/${rota.params.id}`, true);
    return;
  }
  if (rota.params.id && !estado.dossies.has(rota.params.id)) {
    ir("#/", true);
    return;
  }
  if (estado.recebido && (!rota.params.id || !estado.recebido.startsWith(`${rota.params.id}/`))) estado.recebido = null;
  guardarRolagem();
  limpar.forEach((fn) => fn && fn());
  limpar = [];
  const partes = [];
  if (rota.folha) partes.push(telaDossie(rota));
  partes.push(rota.criar(rota));
  aparelhoEl.innerHTML = partes.map((p) => p.html).join("");
  for (const parte of partes) if (parte.montar) limpar.push(parte.montar(aparelhoEl));
  if (rota.params.id) gravarPreferencias({ dossie: rota.params.id });
  const rolagem = aparelhoEl.querySelector(".tela-rolagem");
  const chave = chaveDeRolagem(rota);
  if (rolagem && rolagens.has(chave)) rolagem.scrollTop = rolagens.get(chave);
  if (estado.recebido && rota.tela === "T4") {
    const alvo = aparelhoEl.querySelector(`#fato-${CSS.escape(estado.recebido.split("/")[1])}`);
    if (alvo) alvo.scrollIntoView({ block: "center" });
  }
  if (rota.folha) aparelhoEl.querySelector(".folha [data-acao=fechar-folha]").focus();
  rotaAtual = rota;
  desenharBarra();
}

function aoMudarHash() {
  registrarVisita(location.hash || "#/");
  renderizar();
}

function abrirFato(id) {
  let alvo = aparelhoEl.querySelector(`#fato-${CSS.escape(id)}`);
  if (!alvo && id.startsWith("anuncio_")) alvo = aparelhoEl.querySelector("#cartao-endereco");
  if (!alvo) return;
  const secao = alvo.closest(".secao");
  if (secao && secao.dataset.aberta !== "sim") alternarSecao(secao.querySelector("[data-acao=secao]"));
  alvo.scrollIntoView({ block: "center" });
}

function alternarSecao(botao) {
  const secao = botao.closest(".secao");
  const aberta = secao.dataset.aberta !== "sim";
  secao.dataset.aberta = aberta ? "sim" : "nao";
  botao.setAttribute("aria-expanded", String(aberta));
  const abertas = seccoesAbertas(rotaAtual.params.id);
  if (aberta) abertas.add(botao.dataset.secao);
  else abertas.delete(botao.dataset.secao);
}

function alternarSelecao(id) {
  const atual = estado.selecao;
  if (atual.includes(id)) estado.selecao = atual.filter((x) => x !== id);
  else if (atual.length < 3) estado.selecao = [...atual, id];
  renderizar();
}

let toqueLongo = null;
let ignorarClique = false;

aparelhoEl.addEventListener("pointerdown", (evento) => {
  const item = evento.target.closest("[data-dossie]");
  if (!item) return;
  ignorarClique = false;
  toqueLongo = setTimeout(() => {
    ignorarClique = true;
    alternarSelecao(item.dataset.dossie);
  }, 500);
});
["pointerup", "pointerleave", "pointercancel"].forEach((tipo) => aparelhoEl.addEventListener(tipo, () => clearTimeout(toqueLongo)));
aparelhoEl.addEventListener("contextmenu", (evento) => {
  const item = evento.target.closest("[data-dossie]");
  if (!item) return;
  evento.preventDefault();
  clearTimeout(toqueLongo);
  if (!ignorarClique) alternarSelecao(item.dataset.dossie);
  ignorarClique = false;
});

aparelhoEl.addEventListener("click", async (evento) => {
  const item = evento.target.closest("[data-dossie]");
  if (item) {
    if (ignorarClique) {
      ignorarClique = false;
      return;
    }
    if (estado.selecao.length) alternarSelecao(item.dataset.dossie);
    else ir(`#/dossie/${item.dataset.dossie}`);
    return;
  }
  const alvo = evento.target.closest("[data-acao]");
  if (!alvo) return;
  const acao = alvo.dataset.acao;
  if (acao === "voltar") voltar(paiDe(rotaAtual));
  else if (acao === "fechar-folha" && rotaAtual.folha) voltar(paiDe(rotaAtual));
  else if (acao === "secao") alternarSecao(alvo);
  else if (acao === "ir-fato") abrirFato(alvo.dataset.fato);
  else if (acao === "natureza") {
    const id = rotaAtual.params.id;
    if (estado.natureza.has(id)) estado.natureza.delete(id);
    else estado.natureza.add(id);
    renderizar();
  } else if (acao === "regua-recorte" || acao === "regua-periodo") {
    const dossie = estado.dossies.get(rotaAtual.params.id);
    const atual = estado.regua.get(dossie.id) || { recorte: dossie.preco.regua.recorte, periodo: dossie.preco.regua.periodo_meses };
    if (acao === "regua-recorte") atual.recorte = alvo.dataset.valor;
    else atual.periodo = Number(alvo.dataset.valor);
    estado.regua.set(dossie.id, atual);
    renderizar();
  } else if (acao === "compartilhar" && navigator.share) {
    try {
      await navigator.share({ url: location.href });
    } catch (erro) {
      if (erro.name !== "AbortError") throw erro;
    }
  } else if (acao === "colar-link") {
    const formulario = aparelhoEl.querySelector("[data-form=colar]");
    if (formulario.url.value.trim()) {
      formulario.requestSubmit();
      return;
    }
    const texto = navigator.clipboard ? await navigator.clipboard.readText().catch(() => "") : "";
    if (texto.trim()) {
      formulario.url.value = texto.trim();
      formulario.requestSubmit();
    } else {
      formulario.url.focus();
    }
  } else if (acao === "tentar") {
    renderizar();
  }
});

aparelhoEl.addEventListener("submit", (evento) => {
  if (evento.target.dataset.form !== "colar") return;
  evento.preventDefault();
  const url = evento.target.url.value.trim();
  if (url) ir(`#/ler?url=${encodeURIComponent(url)}`);
});
aparelhoEl.addEventListener("paste", (evento) => {
  const formulario = evento.target.closest("[data-form=colar]");
  if (!formulario) return;
  setTimeout(() => formulario.requestSubmit(), 0);
});

let arrasto = null;
aparelhoEl.addEventListener("pointerdown", (evento) => {
  const alca = evento.target.closest("[data-alca]");
  if (!alca) return;
  arrasto = { y: evento.clientY, folha: alca.closest(".folha") };
  alca.setPointerCapture(evento.pointerId);
});
aparelhoEl.addEventListener("pointermove", (evento) => {
  if (!arrasto) return;
  const dy = Math.max(0, evento.clientY - arrasto.y);
  arrasto.folha.style.transform = `translateY(${dy}px)`;
});
aparelhoEl.addEventListener("pointerup", (evento) => {
  if (!arrasto) return;
  const dy = evento.clientY - arrasto.y;
  const { folha } = arrasto;
  arrasto = null;
  if (dy > 80) folha.parentElement.querySelector("[data-acao=fechar-folha]").click();
  else folha.style.transform = "";
});
document.addEventListener("keydown", (evento) => {
  if (evento.key !== "Escape") return;
  const fechar = aparelhoEl.querySelector(".folha [data-acao=fechar-folha]");
  if (fechar) fechar.click();
});

function desenharBarra() {
  const pref = lerPreferencias();
  const id = rotaAtual && rotaAtual.params.id ? rotaAtual.params.id : pref.dossie;
  const atual = location.hash || "#/";
  const comparar = id === "espinheiro" ? "boa-viagem,espinheiro" : `${id},espinheiro`;
  const fatoExemplo = id === "boa-viagem" ? "iptu_cobrado" : "dc_total";
  const links = [
    ["T1", "#/"],
    ["T2", "#/ler"],
    ["T3", `#/dossie/${id}/confirmar-lote`],
    ["T4", `#/dossie/${id}`],
    ["T5", `#/dossie/${id}/mapa`],
    ["T6", `#/dossie/${id}/visita`],
    ["T7", `#/dossie/${id}/visita/ao-vivo`],
    ["T8", `#/dossie/${id}/caminhos`],
    ["T9", `#/comparar?ids=${comparar}`],
    ["T10", `#/dossie/${id}/fonte/${fatoExemplo}`],
    ["T11", `#/dossie/${id}/contestar/${fatoExemplo}`],
    ["T13", `#/dossie/${id}/linha-do-tempo`],
    ["T14", `#/dossie/${id}/domicilio`],
    ["T15", "#/sobre-os-dados"],
  ];
  const finais = new Set(["T13", "T14"]);
  const itens = links.map(([tela, href]) => {
    const sub = tela === "T2"
      ? ESTADOS_DE_T2.slice(1).map(([valor, nome]) => `<a class="mock-sub tipo-apoio" href="#/ler?url=&estado=${valor}"${atual === `#/ler?url=&estado=${valor}` ? ` aria-current="page"` : ""}>${nome}</a>`).join("")
      : "";
    return `<a class="tipo-corpo" href="${href}"${atual === href ? ` aria-current="page"` : ""}${finais.has(tela) ? ` data-fase="final"` : ""}><span class="apoio">${tela}</span>${NOMES_DAS_TELAS[tela]}</a>${sub}`;
  }).join("");
  barraEl.querySelector("[data-telas]").innerHTML = itens;
  barraEl.querySelector("[data-dossie-mock]").value = id;
  barraEl.querySelectorAll("[data-tema-mock]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.temaMock === pref.tema)));
  barraEl.querySelectorAll("[data-estado-mock]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.estadoMock === estado.forcado)));
  barraEl.querySelector("[data-final-mock]").checked = pref.final;
}

barraEl.addEventListener("click", (evento) => {
  const tema = evento.target.closest("[data-tema-mock]");
  if (tema) {
    gravarPreferencias({ tema: tema.dataset.temaMock });
    aplicarTema();
    desenharBarra();
  }
  const forcado = evento.target.closest("[data-estado-mock]");
  if (forcado) {
    estado.forcado = forcado.dataset.estadoMock;
    renderizar();
  }
});
barraEl.addEventListener("change", (evento) => {
  if (evento.target.matches("[data-final-mock]")) {
    gravarPreferencias({ final: evento.target.checked });
    aplicarFinal();
    renderizar();
  } else if (evento.target.matches("[data-dossie-mock]")) {
    const id = evento.target.value;
    gravarPreferencias({ dossie: id });
    if (rotaAtual && rotaAtual.params.id) ir(location.hash.replace(`/dossie/${rotaAtual.params.id}`, `/dossie/${id}`));
    else desenharBarra();
  }
});

escuroDoSistema.addEventListener("change", aplicarTema);

async function iniciar() {
  aplicarTema();
  aplicarFinal();
  barraEl.querySelector("[data-dossie-mock]").innerHTML = IDS_DOSSIES.map((id) => `<option value="${id}">${id}</option>`).join("");
  try {
    estado.dossies = await carregarDossies();
  } catch (erro) {
    barraEl.querySelector("[data-erro]").hidden = false;
    barraEl.querySelector("[data-erro]").textContent = erro.message;
    throw erro;
  }
  for (const dossie of estado.dossies.values()) {
    barraEl.querySelector(`[data-dossie-mock] option[value="${dossie.id}"]`).textContent = dossie.bairro;
  }
  window.addEventListener("hashchange", aoMudarHash);
  aoMudarHash();
}

iniciar();
