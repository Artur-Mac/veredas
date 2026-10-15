import { icones } from "./icones.js";
import {
  h, ROTULOS, TEXTO_ILUSTRATIVO, maiuscula, formatarData, formatarDiaMes, formatarNumero, formatarReais, hojeIso,
} from "./dados.js";
import { estado, estadoDoFato, contestacaoDe, seccoesAbertas } from "./estado.js";

export function icone(nome, classe = "") {
  const desenho = icones[nome];
  if (!desenho) throw new Error(`Ícone ausente no sprite: ${nome}`);
  return `<svg class="icone ${classe}" viewBox="0 0 24 24" aria-hidden="true">${desenho}</svg>`;
}

export function etiquetaFase(fase) {
  return `<span class="etiqueta tipo-etiqueta" data-fase="${fase}">${fase === "final" ? "Final" : "Protótipo"}</span>`;
}

export function pilulaIlustrativo() {
  return `<span class="etiqueta tipo-etiqueta" aria-hidden="true">ilustrativo</span><span class="oculto-leitor">${TEXTO_ILUSTRATIVO}</span>`;
}

export function traco(rotulo) {
  return `<span class="traco traco-${rotulo}" aria-hidden="true"></span>`;
}

export function bloco(largura = "100%", alto = false) {
  return `<span class="carregando-bloco${alto ? " alto" : ""}" style="width:${largura};display:block"></span>`;
}

export function textoNaoSabemos() {
  return `<span class="nao-sabemos">${traco("nao_sabemos")}<span>não sabemos</span></span>`;
}

function pilulasDeEstado(idDossie, estadoFato, idFato) {
  if (estadoFato === "contestado") {
    const registro = contestacaoDe(idDossie, idFato);
    return `<span class="etiqueta etiqueta-forte tipo-etiqueta">Você contestou em ${formatarDiaMes(registro ? registro.data : hojeIso())}</span>`;
  }
  if (estadoFato === "em_verificacao") return `<span class="etiqueta etiqueta-pontilhada tipo-etiqueta">Em verificação</span>`;
  return "";
}

export function cabecalho({ titulo, voltar = true, fase = "prototipo", direita = "" }) {
  return `<header class="cabecalho">
    ${voltar ? `<button class="botao-icone" data-acao="voltar" aria-label="Voltar">${icone("chevron-left")}</button>` : ""}
    <h1 class="tipo-barra">${h(titulo)}</h1>
    ${direita}
    ${fase ? etiquetaFase(fase) : ""}
  </header>`;
}

export function abas(idDossie, atual) {
  const itens = [
    ["dossie", "Dossiê", "file-text", `#/dossie/${idDossie}`],
    ["mapa", "Mapa", "map", `#/dossie/${idDossie}/mapa`],
    ["visita", "Visita", "clipboard-check", `#/dossie/${idDossie}/visita`],
    ["meus", "Meus dossiês", "folders", "#/"],
  ];
  return `<nav class="abas" aria-label="Abas">${itens.map(([id, nome, nomeIcone, href]) => `
    <a class="aba" href="${href}"${id === atual ? ` aria-current="page"` : ""}>
      <span class="aba-icone">${icone(nomeIcone)}</span>
      <span class="tipo-apoio">${nome}</span>
    </a>`).join("")}</nav>`;
}

const NOMES_DE_FATO = {
  ano: "Ano",
  pavimentos: "Pavimentos",
  area_lote: "Área do lote",
  iptu_cobrado: "IPTU por unidade",
  padrao: "Padrão",
  transmissoes_2017: "2017",
  custo_transporte: "Transporte",
  custo_cesta: "Cesta DIEESE",
  altura: "Altura",
  renda_mediana: "Mediana do rendimento do responsável",
};

function textoDoFato(fato, secao) {
  const numeroSolto = /^[\d.]+$/.test(fato.texto);
  if (!numeroSolto || NOMES_DE_FATO[fato.id]) return fato.texto;
  if (fato.unidade) return `${fato.texto} ${fato.unidade}`;
  return secao ? secao.resumo : fato.texto;
}

export function linhaDeValor(dossie, fato, { secao = null, comTraco = false, nome = undefined } = {}) {
  const estadoFato = estadoDoFato(dossie.id, fato);
  const rotuloNome = nome === undefined ? NOMES_DE_FATO[fato.id] : nome;
  const inteira = !rotuloNome;
  let dado;
  if (estadoFato === "carregando") {
    dado = bloco("120px");
  } else if (estadoFato === "nao_sabemos") {
    dado = `<span class="valor-bloco">${textoNaoSabemos()}<span class="valor-motivo tipo-apoio">${h(fato.motivo_nao_sabemos)}</span></span>`;
  } else {
    const extras = [fato.ilustrativo ? pilulaIlustrativo() : "", pilulasDeEstado(dossie.id, estadoFato, fato.id)].filter(Boolean).join("");
    dado = `<span class="valor-bloco"><span class="linha">${comTraco ? traco(fato.rotulo) : ""}<span>${h(textoDoFato(fato, secao))}</span></span>${extras ? `<span class="valor-extra">${extras}</span>` : ""}</span>`;
  }
  const recebido = estado.recebido === `${dossie.id}/${fato.id}` ? `<p class="recebido tipo-apoio">Recebido. O fato continua visível enquanto conferimos.</p>` : "";
  return `<div class="valor-linha${inteira ? " inteira" : ""} tipo-corpo" id="fato-${h(fato.id)}">
    ${inteira ? "" : `<span class="valor-nome">${h(rotuloNome)}</span>`}
    <span class="valor-dado">${dado}</span>
  </div>${recebido}`;
}

export function agruparPorFonte(fatos) {
  const grupos = new Map();
  for (const fato of fatos) {
    const chave = `${fato.fonte.base}|${fato.fonte.orgao}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(fato);
  }
  return [...grupos.values()];
}

export function linhaDaFonte(fonte, recorte) {
  if (fonte.base === TEXTO_ILUSTRATIVO) return `${TEXTO_ILUSTRATIVO}.`;
  if (fonte.base === "anúncio") return `lido em ${formatarData(fonte.consultado_em)}.`;
  const partes = [fonte.base, recorte, fonte.orgao, fonte.via].filter(Boolean);
  const consulta = fonte.consultado_em ? `, consultado em ${formatarData(fonte.consultado_em)}` : "";
  return `${partes.join(", ")}${consulta}.`;
}

export function rodape(dossie, fatos, { recorte = null, escalasExtras = [] } = {}) {
  const principal = fatos.find((f) => f.estado !== "nao_sabemos") || fatos[0];
  const escalas = [...new Set([...fatos.map((f) => f.escala).filter(Boolean), ...escalasExtras])];
  if (estado.forcado === "carregando") {
    const lendo = principal.fonte.base === TEXTO_ILUSTRATIVO ? bloco("50%") : `Lendo o ${h(principal.fonte.base)}`;
    return `<div class="rodape tipo-apoio"><p>${lendo}</p></div>`;
  }
  return `<div class="rodape tipo-apoio">
    <p class="rodape-rotulo">${traco(principal.rotulo)}<span>${h(maiuscula(ROTULOS[principal.rotulo]))}${principal.fonte.base === TEXTO_ILUSTRATIVO || principal.fonte.base === "anúncio" ? "," : "."} ${h(linhaDaFonte(principal.fonte, recorte))}</span></p>
    ${escalas.map((e) => `<p>${h(e)}</p>`).join("")}
    <p class="rodape-acoes tipo-corpo">
      <a class="linha-link" href="#/dossie/${dossie.id}/fonte/${principal.id}">Ver fonte</a>
      <a class="linha-link" href="#/dossie/${dossie.id}/contestar/${principal.id}">Isso está errado</a>
    </p>
  </div>`;
}

export function anel(grafico, { pequeno = false, carregando = false } = {}) {
  const raio = 40;
  const circunferencia = 2 * Math.PI * raio;
  const total = grafico.fatias.reduce((soma, f) => soma + f.valor, 0);
  const folga = grafico.fatias.length > 1 ? (pequeno ? 3 : 1.6) : 0;
  let deslocamento = 0;
  const arcos = carregando || total === 0
    ? `<circle cx="50" cy="50" r="${raio}" fill="none" stroke="var(--cor-linha)" stroke-width="${pequeno ? 18 : 14}"/>`
    : grafico.fatias.map((fatia) => {
      const comprimento = (fatia.valor / total) * circunferencia;
      const visivel = Math.max(comprimento - folga, 0.6);
      const arco = `<circle cx="50" cy="50" r="${raio}" fill="none" stroke="var(--${fatia.cor})" stroke-width="${pequeno ? 18 : 14}" stroke-dasharray="${visivel.toFixed(2)} ${(circunferencia - visivel).toFixed(2)}" stroke-dashoffset="${(-deslocamento).toFixed(2)}" transform="rotate(-90 50 50)"/>`;
      deslocamento += comprimento;
      return arco;
    }).join("");
  if (pequeno) return `<svg class="anel-pequeno" viewBox="0 0 100 100" aria-hidden="true">${arcos}</svg>`;
  const lista = carregando ? "" : `<ul class="anel-lista tipo-corpo">${grafico.fatias.map((f) => `
    <li><span class="quadrado" style="background:var(--${f.cor})" aria-hidden="true"></span><span class="nome">${h(f.nome)}</span><span>${formatarNumero(f.valor)}</span></li>`).join("")}</ul>`;
  return `<div class="anel">
    <div class="anel-figura">
      <svg viewBox="0 0 100 100" aria-hidden="true">${arcos}</svg>
      <div class="anel-centro">${carregando ? bloco("56px", true) : `<span class="tipo-numero">${formatarNumero(grafico.total)}</span><span class="tipo-apoio apoio">${h(grafico.rotulo_centro)}</span>`}</div>
    </div>
    ${lista}
  </div>`;
}

export function barrasVizinhos(grafico) {
  if (estado.forcado === "carregando") {
    return `<div class="carregando-linha">${grafico.itens.map(() => bloco("100%")).join("")}</div>`;
  }
  const maximo = Math.max(...grafico.itens.map((i) => i.por_mil || 0));
  return `<ul class="barras tipo-corpo">${grafico.itens.map((item) => {
    if (item.estado === "nao_sabemos") {
      return `<li${item.do_dossie ? ` class="do-dossie"` : ""}>
        <span class="barra-topo"><span>${h(item.bairro)}</span>${textoNaoSabemos()}</span>
        <span class="tipo-apoio apoio">${h(item.motivo_nao_sabemos)}</span>
      </li>`;
    }
    const largura = (item.por_mil / maximo) * 100;
    return `<li${item.do_dossie ? ` class="do-dossie"` : ""}>
      <span class="barra-topo"><span>${h(item.bairro)}</span><span>${formatarNumero(item.por_mil, 1)} (${formatarNumero(item.ocorrencias)})</span></span>
      <span class="barra-trilho" aria-hidden="true"><span class="barra-valor" style="display:block;width:${largura.toFixed(1)}%;background:var(${item.do_dossie ? "--crime-1" : "--crime-3"})"></span></span>
    </li>`;
  }).join("")}</ul>`;
}

const RECORTES = [["bairro", "Bairro"], ["raio_500", "500 m"], ["raio_1000", "1 km"]];
const PERIODOS = [[12, "12 meses"], [24, "24 meses"]];

export function regua(dossie) {
  const dados = dossie.preco.regua;
  const escolha = estado.regua.get(dossie.id) || { recorte: dados.recorte, periodo: dados.periodo_meses };
  const controles = `<div class="controles">
    <div class="segmentos tipo-apoio" role="group">${RECORTES.map(([id, nome]) => `<button data-acao="regua-recorte" data-valor="${id}" aria-pressed="${escolha.recorte === id}">${nome}</button>`).join("")}</div>
    <div class="segmentos tipo-apoio" role="group">${PERIODOS.map(([id, nome]) => `<button data-acao="regua-periodo" data-valor="${id}" aria-pressed="${escolha.periodo === id}">${nome}</button>`).join("")}</div>
  </div>`;
  if (estado.forcado === "carregando") {
    const lendo = dados.fonte.base === TEXTO_ILUSTRATIVO ? "" : `<p class="tipo-apoio apoio">Lendo o ${h(dados.fonte.base)}</p>`;
    return `<div class="regua">${controles}${bloco("100%", true)}${lendo}</div>`;
  }
  const disponivel = escolha.recorte === dados.recorte && escolha.periodo === dados.periodo_meses;
  if (!disponivel) {
    return `<div class="regua">${controles}<p class="tipo-corpo">${textoNaoSabemos()}</p></div>`;
  }
  if (dados.n < 10) {
    return `<div class="regua">${controles}<p class="tipo-corpo">Poucos registros no recorte: N = ${formatarNumero(dados.n)}. Aumente o raio ou o período.</p></div>`;
  }
  const posicao = (valor) => ((valor - dados.minimo) / (dados.maximo - dados.minimo)) * 100;
  const rotuloEmbaixo = (valor) => {
    const p = posicao(valor);
    const alinhamento = p < 8 ? "translateX(0)" : p > 92 ? "translateX(-100%)" : "translateX(-50%)";
    return `<span class="tipo-apoio apoio" style="position:absolute;top:48px;left:${p}%;transform:${alinhamento}">${formatarNumero(valor)}</span>`;
  };
  const semArea = !dossie.anuncio.campos.area || dossie.anuncio.campos.area.estado === "nao_sabemos";
  const pAnuncio = posicao(dados.valor_anuncio);
  const alinhaAnuncio = pAnuncio < 15 ? "translateX(0)" : pAnuncio > 85 ? "translateX(-100%)" : "translateX(-50%)";
  const sufixo = dados.unidade.replace("R$", "").trim();
  const marcador = semArea ? "" : `
    <span class="tipo-secao" style="position:absolute;top:0;left:${pAnuncio}%;transform:${alinhaAnuncio};white-space:nowrap">${formatarReais(dados.valor_anuncio)}/${sufixo.replace(/^\//, "")}</span>
    <span style="position:absolute;top:24px;left:${pAnuncio}%;width:var(--regua-marcador);height:var(--regua-marcador);margin-left:calc(var(--regua-marcador) / -2);border-radius:50%;background:var(--cor-barro);box-shadow:0 0 0 2px var(--cor-superficie)"></span>`;
  return `<div class="regua">
    ${controles}
    <div style="position:relative;height:68px;margin:var(--espaco-2) 0" role="img" aria-label="${h(dados.frase)}">
      <span style="position:absolute;top:28px;left:0;right:0;height:var(--regua-trilho);border-radius:3px;background:var(--cor-linha)"></span>
      <span style="position:absolute;top:28px;left:${posicao(dados.p25)}%;width:${posicao(dados.p75) - posicao(dados.p25)}%;height:var(--regua-trilho);background:var(--cor-faixa-regua)"></span>
      <span style="position:absolute;top:24px;left:${posicao(dados.mediana)}%;width:2px;height:14px;margin-left:-1px;background:var(--cor-texto)"></span>
      ${marcador}
      ${rotuloEmbaixo(dados.p25)}${rotuloEmbaixo(dados.mediana)}${rotuloEmbaixo(dados.p75)}
    </div>
    ${semArea ? `<p class="tipo-corpo">${textoNaoSabemos()}</p>` : `<p class="tipo-corpo linha" style="flex-wrap:wrap">${traco(dados.rotulo)}<span>${h(dados.frase)}</span>${dados.ilustrativo ? pilulaIlustrativo() : ""}</p>`}
  </div>`;
}

export function secaoDeFato(dossie, { id, titulo, fase, icone: nomeIcone, resumo, ilustrativo, pequeno = "", conteudo }) {
  const aberta = seccoesAbertas(dossie.id).has(id);
  const carregando = estado.forcado === "carregando";
  return `<section class="cartao secao" id="secao-${id}" data-aberta="${aberta ? "sim" : "nao"}" data-fase="${fase}">
    <button class="secao-cabeca" data-acao="secao" data-secao="${id}" aria-expanded="${aberta}" aria-controls="gaveta-${id}">
      <span class="secao-icone">${icone(nomeIcone)}</span>
      <span class="secao-textos">
        <span class="secao-titulo-linha"><span class="tipo-secao">${h(titulo)}</span>${fase === "final" ? etiquetaFase("final") : ""}${ilustrativo ? pilulaIlustrativo() : ""}</span>
        <span class="secao-resumo tipo-apoio">${carregando ? bloco("70%") : h(resumo)}</span>
      </span>
      ${carregando && pequeno ? anel({ fatias: [] }, { pequeno: true, carregando: true }) : pequeno}
      <span class="secao-seta">${icone("chevron-down")}</span>
    </button>
    <div class="secao-gaveta" id="gaveta-${id}" role="region" aria-label="${h(titulo)}"><div><div class="secao-conteudo">${conteudo}</div></div></div>
  </section>`;
}

export function secaoLink(dossie, { id, titulo, fase, icone: nomeIcone, resumo, ilustrativo, href }) {
  const carregando = estado.forcado === "carregando";
  return `<section class="cartao" id="secao-${id}" data-fase="${fase}">
    <a class="secao-link pressionavel" href="${href}">
      <span class="secao-icone">${icone(nomeIcone)}</span>
      <span class="secao-textos">
        <span class="secao-titulo-linha"><span class="tipo-secao">${h(titulo)}</span>${fase === "final" ? etiquetaFase("final") : ""}${ilustrativo ? pilulaIlustrativo() : ""}</span>
        <span class="secao-resumo tipo-apoio">${carregando ? bloco("70%") : h(resumo)}</span>
      </span>
      <span class="secao-seta">${icone("chevron-right", "icone-p")}</span>
    </a>
  </section>`;
}

export function folha({ titulo, conteudo, rotuloFechar = "Fechar" }) {
  return `<div class="folha-fundo" data-acao="fechar-folha"></div>
  <div class="folha" role="dialog" aria-modal="true" aria-labelledby="folha-titulo">
    <div class="folha-alca" data-alca><span></span></div>
    <div class="folha-cabeca">
      <h2 class="tipo-barra" id="folha-titulo">${h(titulo)}</h2>
      <button class="botao-icone" data-acao="fechar-folha" aria-label="${rotuloFechar}">${icone("x")}</button>
    </div>
    ${conteudo}
  </div>`;
}

export function alterna(nome, rotulo, marcado) {
  return `<label class="alterna tipo-corpo"><span>${h(rotulo)}</span><input type="checkbox" role="switch" name="${nome}"${marcado ? " checked" : ""}></label>`;
}

export function segmentado(nome, opcoes, valor) {
  return `<div class="segmentos tipo-apoio" role="group" data-nome="${nome}">${opcoes.map((o) => `<button type="button" data-acao="segmento" data-valor="${h(o)}" aria-pressed="${o === valor}">${h(o)}</button>`).join("")}</div>`;
}
