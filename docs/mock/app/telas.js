import {
  h, ROTULOS, TEXTO_ILUSTRATIVO, TEXTO_ROTAS, maiuscula, formatarData, formatarNumero, formatarReais, formatarDistancia,
  tipoDoDossie, enderecoDoDossie, acharFato, reguaComoFato, secao as secaoDe, fato as fatoDe, secaoDoFato,
  distanciaMetros, metrosParaCoordenada, linkDoMapa, aparelho, hojeIso, IDS_DOSSIES, NOMES_DE_MOVIMENTO, COMO_GANHAR, resumoDosCreditos,
} from "./dados.js";
import {
  estado, seccoesAbertas, loteConfirmado, confirmarLote, contestar, estadoDoFato, destinos,
} from "./estado.js";
import {
  icone, etiquetaFase, pilulaIlustrativo, traco, bloco, textoNaoSabemos, cabecalho, abas, linhaDeValor, agruparPorFonte,
  rodape, anel, barrasVizinhos, regua, secaoDeFato, secaoLink, folha, alterna, segmentado, linhaDaFonte,
} from "./componentes.js";
import { montarMapa, poligonoMini } from "./mapa.js";
import { ir, voltarPara } from "./nav.js";

function dossieOuErro(id) {
  const dossie = estado.dossies.get(id);
  if (!dossie) throw new Error(`Dossiê não encontrado: ${id}`);
  return dossie;
}

const PASSOS = [["link", "Colar link"], ["map-pin", "Confirmar o lote"], ["file-text", "Dossiê"], ["clipboard-check", "Preparar visita"]];

const KV_MINI = `<svg class="kv-mini" viewBox="0 0 160 130" aria-hidden="true">
  <g transform="rotate(-8 80 50)" fill="none" stroke="var(--crime-3)" stroke-width="1.25" stroke-dasharray="4 3">
    <rect x="22" y="8" width="36" height="30"/><rect x="62" y="8" width="36" height="30"/><rect x="102" y="8" width="36" height="30"/>
    <rect x="22" y="42" width="36" height="30"/><rect x="102" y="42" width="36" height="30"/>
    <rect x="22" y="76" width="36" height="30"/><rect x="62" y="76" width="36" height="30"/><rect x="102" y="76" width="36" height="30"/>
  </g>
  <g transform="rotate(-8 80 50)">
    <rect x="62" y="42" width="36" height="30" fill="var(--cor-azul-cadastral)" fill-opacity="0.12" stroke="var(--cor-azul-cadastral)" stroke-width="2"/>
    <path fill="var(--cor-barro)" fill-rule="evenodd" transform="translate(70 47) scale(0.21)" d="M 18,80 C 7,79 2,66 2,49 C 2,24 20,4 50,3 C 79,2 97,25 97,49 C 97,68 89,80 79,80 C 64,80 34,81 18,80 Z M 40,58 C 35,42 40,24 53,23 C 64,22 69,40 64,57 C 59,72 45,72 40,58 Z"/>
  </g>
  <line x1="80" y1="74" x2="80" y2="112" stroke="var(--cor-barro)" stroke-width="1.5" stroke-dasharray="3 3"/>
  <rect x="8" y="114" width="144" height="6" rx="3" fill="var(--cor-linha)"/>
  <rect x="52" y="114" width="56" height="6" rx="3" fill="var(--cor-faixa-regua)"/>
  <line x1="72" y1="111" x2="72" y2="123" stroke="var(--cor-traco)" stroke-width="1.5"/>
  <circle cx="80" cy="117" r="6" fill="var(--cor-barro)" stroke="var(--cor-superficie)" stroke-width="2"/>
</svg>`;

function cabecalhoDaEntrada() {
  const { disponiveis } = resumoDosCreditos(estado.creditos);
  return `<header class="cabecalho" style="padding-right:var(--espaco-3)">
    <h1 class="cresce" style="padding-left:var(--espaco-3)">
      <img class="logo-app logo-claro" src="../kv/logotipo-claro.svg" alt="Vereda">
      <img class="logo-app logo-escuro" src="../kv/logotipo-escuro.svg" alt="Vereda">
    </h1>
    <a class="pilula-credito tipo-etiqueta pressionavel" href="#/creditos" data-fase="final" aria-label="${disponiveis} créditos, ver extrato">${icone("coins", "icone-p")}<span>${disponiveis}</span></a>
  </header>`;
}

function cartaoEntrada(comparando) {
  return `<section class="cartao"><div class="cartao-corpo pilha">
    <div class="entrada">
      <div class="entrada-textos">
        <h2 class="tipo-titulo-tela">O link do anúncio vira um dossiê de evidências.</h2>
        <p class="tipo-corpo apoio">Recife, a partir de registros públicos.</p>
      </div>
      ${KV_MINI}
    </div>
    <form class="campo-acao" data-form="colar">
      ${icone("link")}
      <input name="url" type="url" inputmode="url" autocomplete="off" placeholder="Cole o link do anúncio" aria-label="Colar link">
      <button class="botao ${comparando ? "botao-secundario" : "botao-principal"} tipo-botao" type="button" data-acao="colar-link">${icone("clipboard", "icone-p")}Colar</button>
    </form>
    <ul class="avisos tipo-apoio apoio">
      <li>${icone("shield-lock", "icone-p")}<span>Só lemos campos do imóvel. Nada sobre quem anuncia.</span></li>
      <li>${icone("map-pin", "icone-p")}<span>Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena.</span></li>
    </ul>
  </div></section>`;
}

function cartaoCreditos() {
  const resumo = resumoDosCreditos(estado.creditos);
  const total = resumo.cotaInicial + resumo.ganhos;
  const trilho = Array.from({ length: total }, (_, i) => `<span class="${i < resumo.disponiveis ? "disponivel" : ""}"></span>`).join("");
  const ganhos = COMO_GANHAR.map(([nomeIcone, tipo, mais]) => `<li class="tipo-corpo"><span class="secao-icone secao-icone-p">${icone(nomeIcone, "icone-p")}</span><span class="nome">${NOMES_DE_MOVIMENTO[tipo]}</span><span class="mais">+${mais}</span></li>`).join("");
  return `<section class="cartao" data-fase="final"><div class="cartao-corpo pilha">
    <div class="creditos-topo">
      <span class="secao-icone">${icone("coins")}</span>
      <span class="secao-textos"><span class="tipo-secao">Créditos</span><span class="tipo-apoio apoio">Um crédito abre um dossiê</span></span>
      ${etiquetaFase("final")}
    </div>
    <div class="creditos-numero"><span class="tipo-numero">${resumo.disponiveis}</span><span class="tipo-corpo">${resumo.disponiveis === 1 ? "dossiê disponível" : "dossiês disponíveis"}</span></div>
    <div class="creditos-trilho" role="img" aria-label="${resumo.disponiveis} disponíveis de ${total}">${trilho}</div>
    <p class="tipo-apoio apoio">Cota gratuita de ${resumo.cotaInicial}, ${resumo.ganhos} ganhos, ${resumo.usados} usados.</p>
    <ul class="ganhos" aria-label="Como ganhar créditos">${ganhos}</ul>
    <div class="rodape-acoes tipo-corpo">
      <a class="linha-link" href="#/creditos">Ver extrato</a>
      <a class="linha-link" href="#/creditos">Comprar créditos</a>
    </div>
  </div></section>`;
}

function itemDoDossie(dossie, marcado) {
  const campos = dossie.anuncio.campos;
  const principal = campos.aluguel || campos.preco;
  const resumo = [principal, campos.area].filter(Boolean).map((f) => f.texto).join(" · ");
  return `<li><button class="item-dossie" data-dossie="${dossie.id}" aria-pressed="${marcado}">
    <span class="item-lote">${poligonoMini(dossie, loteConfirmado(dossie))}</span>
    <span class="item-textos">
      <span class="tipo-secao">${h(enderecoDoDossie(dossie))}</span>
      <span class="tipo-corpo">${h(resumo)}</span>
      <span class="item-meta tipo-apoio apoio"><span class="chip-tipo tipo-etiqueta">${tipoDoDossie(dossie)}</span><span>${h(dossie.bairro)}</span><span>·</span><span>${formatarData(dossie.gerado_em)}</span></span>
    </span>
    <span class="item-marca">${marcado ? icone("check") : icone("chevron-right", "icone-p")}</span>
  </button></li>`;
}

export function telaMeus() {
  const lista = estado.apagado ? [] : IDS_DOSSIES.map((id) => estado.dossies.get(id));
  const selecao = estado.selecao;
  const selecionando = estado.selecionando || selecao.length > 0;
  const comparando = selecao.length >= 2 && selecao.length <= 3;
  const corpo = lista.length
    ? `<ul class="lista-dossies">${lista.map((d) => itemDoDossie(d, selecao.includes(d.id))).join("")}</ul><p class="dica tipo-apoio apoio">${selecionando ? "Toque para selecionar 2 ou 3 e comparar." : "Toque e segure para selecionar e comparar."}</p>`
    : `<p class="vazio vazio-esq tipo-corpo" style="padding:0 var(--espaco-4)">Nenhum dossiê ainda. Compartilhe um anúncio de apartamento com o Vereda ou cole o link acima.</p>`;
  const passos = PASSOS.map(([nomeIcone, texto]) => `<li><span class="secao-icone">${icone(nomeIcone)}</span><span class="tipo-apoio">${texto}</span></li>`).join("");
  const fontes = fontesDoApp().map((f) => f.base).join(", ");
  const comparar = comparando
    ? `<div class="barra-comparar"><a class="botao botao-principal tipo-botao" href="#/comparar?ids=${selecao.join(",")}">Comparar ${selecao.length}</a></div>`
    : "";
  return {
    html: `<div class="tela">
      ${cabecalhoDaEntrada()}
      <div class="tela-rolagem">
        ${cartaoEntrada(comparando)}
        ${cartaoCreditos()}
        <div class="cabeca-grupo"><h2 class="tipo-secao">Meus dossiês</h2>${lista.length ? `<button class="linha-link tipo-apoio" data-acao="selecionar">${selecionando ? "Cancelar" : "Selecionar"}</button>` : ""}</div>
        ${corpo}
        <ol class="passos cartao">${passos}</ol>
        <section class="cartao">
          <a class="secao-link pressionavel" href="#/sobre-os-dados">
            <span class="secao-icone">${icone("info-circle")}</span>
            <span class="secao-textos"><span class="tipo-secao">Sobre os dados</span><span class="secao-resumo tipo-apoio">${h(fontes)}</span></span>
            <span class="secao-seta">${icone("chevron-right", "icone-p")}</span>
          </a>
        </section>
      </div>
      ${comparar}
    </div>`,
  };
}

export function folhaCreditos() {
  const resumo = resumoDosCreditos(estado.creditos);
  const linhas = estado.creditos.extrato.map((m) => {
    const dossie = m.dossie ? estado.dossies.get(m.dossie) : null;
    const detalhe = m.tipo === "cota_inicial" ? "gratuita" : m.tipo === "dossie" ? (dossie ? dossie.bairro : m.dossie) : (dossie ? enderecoDoDossie(dossie) : "");
    return `<li class="tipo-corpo">
      <span class="nome"><span>${NOMES_DE_MOVIMENTO[m.tipo]}</span><span class="tipo-apoio apoio">${h(detalhe)} · ${formatarData(m.data)}</span></span>
      <span class="delta">${m.delta > 0 ? "+" : "−"}${Math.abs(m.delta)}</span>
    </li>`;
  }).join("");
  const conteudo = `<div class="pilha">
    <div class="creditos-numero"><span class="tipo-numero">${resumo.disponiveis}</span><span class="tipo-corpo">${resumo.disponiveis === 1 ? "dossiê disponível" : "dossiês disponíveis"}</span></div>
    <ul class="extrato" aria-label="Extrato">${linhas}</ul>
    <p class="tipo-apoio apoio">Um crédito abre um dossiê. Você ganha créditos ao confirmar o lote, ao enviar o feedback pós-visita e ao informar o motivo do descarte. Nunca por envio de documentos.</p>
    <a class="botao botao-secundario tipo-botao" href="#/creditos">Comprar créditos</a>
  </div>`;
  return { html: folha({ titulo: "Créditos", conteudo }) };
}

const ETAPAS = ["Anúncio aberto", "Preço, área e quartos lidos", "Procurando o lote", "Lote encontrado"];
const BAIRROS_COBERTOS = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];

function destinoDoLink(url) {
  const texto = (url || "").toLowerCase();
  return BAIRROS_COBERTOS.find((id) => texto.includes(id)) || "boa-viagem";
}

function estadoDoLink(url) {
  if (!url) return "lendo";
  if (!navigator.onLine) return "sem-conexao";
  if (!/^https?:\/\/\S+\.\S+/i.test(url)) return "nao-e-anuncio";
  if (/areias/i.test(url)) return "fora";
  return "lendo";
}

export function telaLer(rota) {
  const url = rota.query.get("url") || "";
  const forcado = rota.query.get("estado");
  const situacao = forcado || estadoDoLink(url);
  const idDestino = destinoDoLink(url);
  const feitasPorEstado = { "nao-abriu": 0, "nao-e-anuncio": 1, fora: 2, "lote-nao-encontrado": 3, "sem-conexao": 0, lendo: 0 };
  const feitasIniciais = feitasPorEstado[situacao] ?? 0;
  const mensagens = {
    "nao-abriu": ["O anúncio não abriu. Tente de novo ou cole outro link.", ["tentar", "colar"]],
    "nao-e-anuncio": ["Este link não é de um anúncio de apartamento. Cole outro link.", ["colar"]],
    fora: ["Este anúncio fica em Areias. Por enquanto o Vereda cobre Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena.", ["colar"]],
    "sem-conexao": ["Sem conexão. O dossiê abre quando a internet voltar.", ["tentar"]],
    "lote-nao-encontrado": ["Não achamos o lote deste endereço. Marque o prédio no mapa.", ["marcar"]],
  };
  const botoes = {
    tentar: `<button class="botao botao-secundario tipo-botao" data-acao="tentar">Tentar de novo</button>`,
    colar: `<a class="botao botao-principal tipo-botao" href="#/" data-acao="colar-outro">Colar outro link</a>`,
    marcar: `<a class="botao botao-principal tipo-botao" href="#/dossie/${idDestino}/confirmar-lote">Marcar no mapa</a>`,
  };
  const mensagem = mensagens[situacao];
  const etapas = (feitas) => ETAPAS.map((nome, i) => `<li data-feita="${i < feitas ? "sim" : "nao"}" class="tipo-corpo"><span class="marca">${i < feitas ? icone("check", "icone-p") : ""}</span><span>${nome}</span></li>`).join("");
  const webview = `<div class="webview" aria-hidden="true">${[90, 60, 100, 100, 80, 40, 100, 70, 100, 55, 90, 100].map((l, i) => bloco(`${l}%`, i % 5 === 0)).join("")}</div>`;
  return {
    html: `<div class="tela">
      ${cabecalho({ titulo: "Lendo o anúncio" })}
      <div class="tela-rolagem">
        ${situacao === "sem-conexao" || situacao === "nao-abriu" ? "" : webview}
        <div class="cartao"><div class="cartao-corpo pilha">
          <ol class="etapas" data-etapas aria-live="polite">${etapas(feitasIniciais)}</ol>
          <p class="tipo-apoio apoio">Só lemos campos do imóvel. Nada sobre quem anuncia.</p>
        </div></div>
        ${mensagem ? `<div class="cartao"><div class="cartao-corpo pilha"><p class="tipo-corpo" role="status">${mensagem[0]}</p>${mensagem[1].map((b) => botoes[b]).join("")}</div></div>` : ""}
      </div>
    </div>`,
    montar(raiz) {
      if (situacao !== "lendo") return null;
      const lista = raiz.querySelector("[data-etapas]");
      let feitas = 0;
      const relogio = setInterval(() => {
        feitas += 1;
        lista.innerHTML = etapas(feitas);
        if (feitas === ETAPAS.length) {
          clearInterval(relogio);
          const dossie = dossieOuErro(idDestino);
          setTimeout(() => ir(loteConfirmado(dossie) ? `#/dossie/${dossie.id}` : `#/dossie/${dossie.id}/confirmar-lote`, true), 600);
        }
      }, 700);
      return () => clearInterval(relogio);
    },
  };
}

export function telaConfirmarLote(rota) {
  const dossie = dossieOuErro(rota.params.id);
  const pavimentos = fatoDe(dossie, "predio", "pavimentos");
  const local = { naoEEste: false, selecionado: 0 };
  const apoio = `${enderecoDoDossie(dossie)}${pavimentos ? `, ${pavimentos.texto} pavimentos no cadastro` : ""}`;
  return {
    html: `<div class="tela">
      ${cabecalho({ titulo: "Confirmar o lote" })}
      <div class="mapa mapa-cheio" data-mapa aria-label="${h(enderecoDoDossie(dossie))}"></div>
      <div class="painel-mapa" style="padding-bottom:var(--espaco-4)">
        <h2 class="tipo-barra">É este o prédio?</h2>
        <p class="tipo-corpo apoio linha">${h(apoio)}${dossie.endereco.ilustrativo || dossie.lote.ilustrativo_poligono ? pilulaIlustrativo() : ""}</p>
        <p class="tipo-corpo" data-escolha hidden>Escolha o prédio no mapa.</p>
        <button class="botao botao-principal tipo-botao" data-acao="e-este">É este prédio</button>
        <button class="botao botao-secundario tipo-botao" data-acao="nao-e-este">Não é este</button>
        ${dossie.tipo === "aluguel" ? `<button class="botao botao-texto tipo-corpo" data-acao="pular" style="align-self:center">Pular por agora</button>` : ""}
      </div>
    </div>`,
    montar(raiz) {
      const mapa = montarMapa(raiz.querySelector("[data-mapa]"), dossie, {
        interativo: true, raios: [], lotes: "candidatos", selecionado: 0, ajustar: 110,
        aoTocarLote(indice) {
          local.selecionado = indice;
          mapa.atualizar({ selecionado: indice });
        },
      });
      raiz.addEventListener("click", (evento) => {
        const acao = evento.target.closest("[data-acao]")?.dataset.acao;
        if (acao === "nao-e-este") {
          local.naoEEste = true;
          raiz.querySelector("[data-escolha]").hidden = false;
          mapa.atualizar({ destacarVizinhos: true });
        } else if (acao === "e-este") {
          confirmarLote(dossie.id, true);
          ir(`#/dossie/${dossie.id}`, true);
        } else if (acao === "pular") {
          confirmarLote(dossie.id, false);
          ir(`#/dossie/${dossie.id}`, true);
        }
      });
      return () => mapa.destruir();
    },
  };
}

const RECORTE_BAIRRO = new Set(["defesa_civil", "bairro", "calor"]);

function conteudoDeValores(dossie, secao) {
  const mistura = new Set(secao.fatos.map((f) => f.rotulo)).size > 1;
  const linhas = secao.fatos.map((f) => linhaDeValor(dossie, f, { secao, comTraco: mistura })).join("");
  const recorte = RECORTE_BAIRRO.has(secao.id) ? dossie.bairro : null;
  const rodapes = agruparPorFonte(secao.fatos).map((grupo) => rodape(dossie, grupo, { recorte })).join("");
  return `<div class="valores">${linhas}</div>${rodapes}`;
}

function conteudoDefesaCivil(dossie, secao) {
  const grafico = secao.grafico;
  const carregando = estado.forcado === "carregando";
  const corpo = grafico.total === 0 && !carregando
    ? `<p class="tipo-corpo">Nenhum atendimento em 2024</p>`
    : anel(grafico, { carregando });
  const linhasExtras = secao.fatos.filter((f) => f.valor !== grafico.total).map((f) => linhaDeValor(dossie, f, { secao })).join("");
  const estadoTotal = estadoDoFato(dossie.id, secao.fatos[0]);
  const pilula = estadoTotal === "contestado" || estadoTotal === "em_verificacao" ? linhaDeValor(dossie, secao.fatos[0], { secao }) : "";
  return `${corpo}${linhasExtras ? `<div class="valores">${linhasExtras}</div>` : ""}${pilula}${agruparPorFonte(secao.fatos).map((g) => rodape(dossie, g, { recorte: dossie.bairro })).join("")}`;
}

function conteudoBairro(dossie, secao) {
  const aberto = estado.natureza.has(dossie.id);
  const valores = secao.fatos.map((f) => linhaDeValor(dossie, f, { secao })).join("");
  return `<div class="valores">${valores}</div>
    <div class="pilha">
      <p class="tipo-apoio apoio">Por mil moradores, com os bairros que fazem divisa. Moradores: Censo 2022.</p>
      ${barrasVizinhos(secao.grafico)}
      <p class="tipo-apoio apoio">Ordem do mapa, de norte a sul.</p>
    </div>
    <button class="botao botao-secundario tipo-botao" data-acao="natureza" aria-expanded="${aberto}">${icone("chart-donut")}Ver por natureza</button>
    ${aberto ? anel(secao.grafico.detalhe, { carregando: estado.forcado === "carregando" }) : ""}
    ${agruparPorFonte(secao.fatos).map((g) => rodape(dossie, g, { recorte: dossie.bairro })).join("")}`;
}

const PARTES_DO_CUSTO = [
  { nome: "Condomínio", cor: "cat-ipe-roxo", achar: (d) => d.anuncio.campos.condominio, mensal: true },
  { nome: "IPTU cobrado", cor: "cat-goiaba", achar: (d) => fatoDe(d, "predio", "iptu_cobrado"), mensal: false },
  { nome: "Transporte", cor: "cat-ipe-amarelo", achar: (d) => fatoDe(d, "custo", "custo_transporte"), mensal: true },
  { nome: "Cesta DIEESE", cor: "cat-mare", achar: (d) => fatoDe(d, "custo", "custo_cesta"), mensal: true },
];

function conteudoCusto(dossie) {
  const partes = PARTES_DO_CUSTO.map((p) => ({ ...p, fato: p.achar(dossie) })).filter((p) => p.fato);
  const naBarra = partes.filter((p) => p.mensal && p.fato.estado !== "nao_sabemos" && typeof p.fato.valor === "number");
  const barra = estado.forcado === "carregando"
    ? bloco("100%")
    : `<div class="custo-barra" aria-hidden="true">${naBarra.map((p) => `<span style="flex:${p.fato.valor};background:var(--${p.cor})"></span>`).join("")}</div>`;
  const lista = partes.map((p) => `<div class="linha"><span class="quadrado" style="background:var(--${p.cor})" aria-hidden="true"></span><div class="cresce">${linhaDeValor(dossie, p.fato, { nome: p.nome, comTraco: true })}</div></div>`).join("");
  const rodapes = agruparPorFonte(partes.map((p) => p.fato)).map((g) => rodape(dossie, g)).join("");
  return `${barra}<p class="tipo-apoio apoio">Sem total.</p><div class="valores">${lista}</div>${rodapes}
    <a class="botao botao-secundario tipo-botao" href="#/dossie/${dossie.id}/domicilio">Informar meu domicílio</a>`;
}

function linkDeCamada(dossie, camada, texto) {
  return `<a class="botao botao-secundario tipo-botao" href="#/dossie/${dossie.id}/mapa?camada=${camada}">${icone("map")}${texto}</a>`;
}

function textoCaminhos(dossie) {
  const lista = destinos();
  if (!lista.length) return "Adicionar destino";
  const primeiro = lista[0];
  return `${primeiro.nome}; ${formatarDistancia(distanciaMetros(dossie.lote.centro, primeiro.coordenada))} em linha reta a partir do prédio`;
}

const ORDEM = ["predio", "transmissoes", "obras", "defesa_civil", "caminhos", "linha_do_tempo", "sol", "calor", "alagamento", "renda", "tipologia", "bairro", "custo"];

function secoesDoDossie(dossie) {
  return ORDEM.map((id) => {
    if (id === "caminhos") {
      return secaoLink(dossie, { id, titulo: "Seus caminhos", fase: "prototipo", icone: "route", resumo: textoCaminhos(dossie), href: `#/dossie/${dossie.id}/caminhos` });
    }
    const secao = secaoDe(dossie, id);
    if (!secao) return "";
    const base = { id, titulo: secao.titulo, fase: secao.fase, icone: secao.icone, resumo: secao.resumo, ilustrativo: secao.ilustrativo };
    if (id === "linha_do_tempo") return secaoLink(dossie, { ...base, href: `#/dossie/${dossie.id}/linha-do-tempo` });
    let conteudo;
    let pequeno = "";
    if (id === "defesa_civil") {
      conteudo = conteudoDefesaCivil(dossie, secao);
      pequeno = anel(secao.grafico, { pequeno: true });
    } else if (id === "bairro") {
      conteudo = conteudoBairro(dossie, secao);
    } else if (id === "custo") {
      conteudo = conteudoCusto(dossie);
    } else {
      conteudo = conteudoDeValores(dossie, secao);
      if (id === "predio") conteudo += `<a class="linha-link tipo-apoio" href="#/dossie/${dossie.id}/confirmar-lote">Não é este prédio</a>`;
      if (id === "sol") conteudo += linkDeCamada(dossie, "3d", "Ver em 3D");
      if (id === "calor") conteudo += linkDeCamada(dossie, "calor", "Abrir mapa");
      if (id === "alagamento") conteudo += linkDeCamada(dossie, "alagamento", "Abrir mapa");
    }
    return secaoDeFato(dossie, { ...base, pequeno, conteudo });
  }).join("");
}

function chipsDoAnuncio(dossie) {
  const c = dossie.anuncio.campos;
  const chip = (fato, nomeIcone, rotulo) => fato ? `<span class="chip tipo-corpo" aria-label="${h(rotulo)}">${nomeIcone ? icone(nomeIcone, "icone-p") : ""}<span aria-hidden="true">${h(fato.texto)}</span></span>` : "";
  const plural = (fato, um, varios) => fato ? `${fato.texto} ${fato.valor === 1 ? um : varios}` : "";
  return `<div class="chips">
    ${chip(c.area, "ruler-2", c.area?.texto)}
    ${chip(c.quartos, "bed", plural(c.quartos, "quarto", "quartos"))}
    ${chip(c.banheiros, "bath", plural(c.banheiros, "banheiro", "banheiros"))}
    ${chip(c.vagas, "car", plural(c.vagas, "vaga", "vagas"))}
    ${chip(c.andar, "stairs", c.andar?.texto)}
  </div>`;
}

function rodapeDoAnuncio(dossie, fatos) {
  return agruparPorFonte(fatos).map((grupo) => rodape(dossie, grupo)).join("");
}

function cartaoEndereco(dossie) {
  const c = dossie.anuncio.campos;
  const fatos = [c.area, c.quartos, c.suites, c.banheiros, c.vagas, c.andar].filter(Boolean);
  const carregando = estado.forcado === "carregando";
  return `<section class="cartao" id="cartao-endereco"><div class="cartao-corpo pilha">
    <p class="tipo-apoio apoio">${tipoDoDossie(dossie)}, ${h(dossie.bairro)}</p>
    <h2 class="tipo-titulo-tela linha" style="flex-wrap:wrap">${h(enderecoDoDossie(dossie))}${dossie.endereco.ilustrativo ? pilulaIlustrativo() : ""}</h2>
    ${carregando ? bloco("80%") : chipsDoAnuncio(dossie)}
    ${rodapeDoAnuncio(dossie, fatos)}
    <a class="linha-link tipo-apoio" href="#/dossie/${dossie.id}/confirmar-lote" style="align-self:flex-start">Não é este prédio</a>
  </div></section>`;
}

function cartaoPreco(dossie) {
  const c = dossie.anuncio.campos;
  const principal = c.aluguel || c.preco;
  const iptuAnuncio = c.iptu
    ? linhaDeValor(dossie, c.iptu, { nome: "IPTU no anúncio", comTraco: true })
    : `<div class="valor-linha tipo-corpo"><span class="valor-nome">IPTU no anúncio</span><span class="valor-dado"><span class="valor-bloco">${textoNaoSabemos()}<span class="valor-motivo tipo-apoio">O anúncio não diz IPTU.</span></span></span></div>`;
  const estadoPrincipal = estadoDoFato(dossie.id, principal);
  const valor = estadoPrincipal === "carregando"
    ? bloco("60%", true)
    : `<span class="linha">${traco(principal.rotulo)}<span class="tipo-numero">${h(principal.texto)}</span></span>${principal.ilustrativo ? pilulaIlustrativo() : ""}`;
  const reguaFato = reguaComoFato(dossie);
  const recebido = estado.recebido === `${dossie.id}/regua` ? `<p class="recebido tipo-apoio">Recebido. O fato continua visível enquanto conferimos.</p>` : "";
  return `<section class="cartao" id="cartao-preco"><div class="cartao-corpo pilha">
    <div class="preco-valor" id="fato-${principal.id}">${valor}</div>
    <div class="valores">
      ${c.condominio ? linhaDeValor(dossie, c.condominio, { nome: "Condomínio", comTraco: true }) : ""}
      ${iptuAnuncio}
    </div>
    <p class="tipo-apoio apoio">Sem total.</p>
    <div id="fato-regua" class="pilha">
      ${regua(dossie)}
      ${recebido}
    </div>
    ${rodape(dossie, [reguaFato], { recorte: dossie.bairro })}
    ${rodapeDoAnuncio(dossie, [principal, c.condominio, c.iptu].filter(Boolean))}
  </div></section>`;
}

function cartaoVisita(dossie) {
  const linhas = dossie.visita.map((item) => {
    const naoSabemos = item.rotulo === "nao_sabemos";
    const corpo = `${naoSabemos ? traco("nao_sabemos") : ""}
      <span class="pilha" style="gap:2px"><span class="tipo-corpo">${h(item.texto)}</span>${item.escala ? `<span class="tipo-apoio apoio">${h(item.escala)}</span>` : ""}</span>`;
    if (!item.origem.length) return `<li><div class="linha-toque" style="cursor:default">${corpo}</div></li>`;
    return `<li><button class="linha-toque" data-acao="ir-fato" data-fato="${h(item.origem[0])}">${corpo}${icone("chevron-down", "icone-p icone-ir")}</button></li>`;
  }).join("");
  return `<section class="cartao cartao-nota" id="cartao-visita"><div class="cartao-corpo">
    <div class="cartao-titulo"><h2 class="tipo-secao">Para perguntar na visita</h2></div>
    <ul class="nota-lista">${linhas}</ul>
  </div></section>`;
}

function mapaDoTopo(dossie) {
  const confirmado = loteConfirmado(dossie);
  if (estado.forcado === "carregando") return `<div class="mapa mapa-topo mapa-carregando" aria-hidden="true"></div>`;
  const canto = confirmado
    ? (dossie.lote.ilustrativo_poligono ? `<div class="mapa-canto">${pilulaIlustrativo().replace("etiqueta tipo-etiqueta", "etiqueta tipo-etiqueta pilula-fundo")}</div>` : "")
    : `<div class="mapa-canto"><span class="pilula-mapa tipo-apoio" style="position:static;transform:none">Lote não confirmado</span><a class="pilula-mapa tipo-apoio" style="position:static;transform:none;text-decoration:underline" href="#/dossie/${dossie.id}/confirmar-lote">Confirmar o lote</a></div>`;
  return `<div class="mapa mapa-topo" data-mapa-topo aria-label="${h(enderecoDoDossie(dossie))}">
    <a class="botao botao-secundario botao-pilula tipo-botao mapa-acao" href="#/dossie/${dossie.id}/mapa" style="z-index:2">${icone("map", "icone-p")}Abrir mapa</a>
  </div>${canto ? `<template data-canto>${canto}</template>` : ""}`;
}

export function telaDossie(rota) {
  const dossie = dossieOuErro(rota.params.id);
  const compartilhar = `<button class="botao-icone" data-acao="compartilhar" aria-label="Compartilhar">${icone("share")}</button>`;
  return {
    html: `<div class="tela">
      ${cabecalho({ titulo: "Dossiê", direita: compartilhar })}
      <div class="tela-rolagem" data-rolagem>
        ${mapaDoTopo(dossie)}
        ${cartaoEndereco(dossie)}
        ${cartaoPreco(dossie)}
        ${cartaoVisita(dossie)}
        ${secoesDoDossie(dossie)}
        <div class="area-botoes"><a class="botao botao-principal tipo-botao" href="#/dossie/${dossie.id}/visita">Preparar visita</a></div>
      </div>
      ${abas(dossie.id, "dossie")}
    </div>`,
    montar(raiz) {
      const elemento = raiz.querySelector("[data-mapa-topo]");
      if (!elemento) return null;
      const canto = raiz.querySelector("template[data-canto]");
      const confirmado = loteConfirmado(dossie);
      const mapa = montarMapa(elemento, dossie, {
        raios: [500], lotes: confirmado ? "confirmado" : "nenhum", ajustar: 500, extraSobre: canto ? canto.innerHTML : "",
      });
      return () => mapa.destruir();
    },
  };
}

const CATEGORIAS = [
  ["saude", "Saúde", "first-aid-kit", "cat-goiaba"],
  ["escolas", "Escolas", "school", "cat-ipe-roxo"],
  ["mercados", "Mercados", "shopping-cart", "cat-ipe-amarelo"],
  ["estacoes", "Estações", "train", "cat-mare"],
];
const CAMADAS = [["ruas", "Ruas"], ["3d", "3D e sombra"], ["calor", "Calor"], ["alagamento", "Alagamento"]];

function painelDaCamada(dossie, camada) {
  if (camada === "3d") {
    const altura = fatoDe(dossie, "sol", "altura");
    return altura ? `<div data-fase="final">${linhaDeValor(dossie, altura, { secao: secaoDe(dossie, "sol") })}<p class="tipo-apoio apoio">${h(altura.escala)}</p></div>` : "";
  }
  if (camada === "calor") {
    const calor = fatoDe(dossie, "calor", "calor_amplitude");
    if (!calor) return "";
    if (calor.estado === "nao_sabemos") return `<div data-fase="final">${linhaDeValor(dossie, calor, { secao: secaoDe(dossie, "calor") })}<p class="tipo-apoio apoio">${h(calor.escala)}</p></div>`;
    return `<div data-fase="final" class="pilha" style="gap:var(--espaco-2)">
      <div class="legenda-calor tipo-apoio"><span>0 °C</span><span class="escala" aria-hidden="true"></span><span>${formatarNumero(calor.valor, 1)} °C</span>${pilulaIlustrativo()}</div>
      <p class="tipo-apoio apoio">${h(calor.texto)}</p>
      <p class="tipo-apoio apoio">${h(calor.escala)}</p>
    </div>`;
  }
  if (camada === "alagamento") {
    const faixa = fatoDe(dossie, "alagamento", "faixa_marginal");
    return faixa ? `<div data-fase="final">${linhaDeValor(dossie, faixa, { secao: secaoDe(dossie, "alagamento") })}</div>` : "";
  }
  return "";
}

export function telaMapa(rota) {
  const dossie = dossieOuErro(rota.params.id);
  const pedida = rota.query.get("camada") || "ruas";
  const camada = document.body.dataset.final === "nao" ? "ruas" : pedida;
  const ligadas = new Set(CATEGORIAS.map(([id]) => id));
  const chips = CATEGORIAS.map(([id, nome, nomeIcone, cor]) => `<button class="chip chip-toque tipo-corpo" data-acao="categoria" data-categoria="${id}" aria-pressed="true"><span style="color:var(--${cor});display:inline-flex">${icone(nomeIcone, "icone-p")}</span>${nome}</button>`).join("");
  const camadas = `<div class="segmentos tipo-apoio" role="group" data-fase="final">${CAMADAS.map(([id, nome]) => `<button data-acao="camada" data-valor="${id}" aria-pressed="${id === camada}">${nome}</button>`).join("")}</div>`;
  return {
    html: `<div class="tela">
      ${cabecalho({ titulo: "Mapa" })}
      <div class="painel-mapa" style="padding-top:0">
        <div class="chips rolagem-x" style="flex-wrap:nowrap">${chips}</div>
        <div class="linha">${camadas}${etiquetaFase("final")}</div>
      </div>
      <div class="mapa mapa-cheio" data-mapa aria-label="${h(enderecoDoDossie(dossie))}"></div>
      <div class="painel-mapa">
        <div data-painel-camada>${painelDaCamada(dossie, camada)}</div>
        <p class="tipo-apoio apoio">Pontos de interesse: Prefeitura do Recife; data de referência pendente de ofício.</p>
      </div>
      ${abas(dossie.id, "mapa")}
      <div data-folha-local></div>
    </div>`,
    montar(raiz) {
      const confirmado = loteConfirmado(dossie);
      const calor = fatoDe(dossie, "calor", "calor_amplitude");
      const mapa = montarMapa(raiz.querySelector("[data-mapa]"), dossie, {
        interativo: true, raios: [500, 1000, 1500], lotes: confirmado ? "confirmado" : "nenhum", ajustar: 1550, camada,
        calor: calor && calor.estado !== "nao_sabemos" ? calor : null,
        rotuloPino: enderecoDoDossie(dossie),
        aoTocarPino() {
          raiz.querySelector("[data-folha-local]").innerHTML = folha({
            titulo: enderecoDoDossie(dossie),
            conteudo: `<div class="pilha">
              <p class="tipo-corpo apoio">${tipoDoDossie(dossie)}, ${h(dossie.bairro)}</p>
              <a class="botao botao-secundario tipo-botao" href="${h(linkDoMapa(dossie.lote.centro, enderecoDoDossie(dossie)))}">${icone("external-link")}Abrir no mapa</a>
              <p class="tipo-apoio apoio">${TEXTO_ROTAS}</p>
            </div>`,
          });
        },
      });
      raiz.addEventListener("click", (evento) => {
        const alvo = evento.target.closest("[data-acao]");
        if (!alvo) return;
        if (alvo.dataset.acao === "categoria") {
          const id = alvo.dataset.categoria;
          if (ligadas.has(id)) ligadas.delete(id);
          else ligadas.add(id);
          alvo.setAttribute("aria-pressed", String(ligadas.has(id)));
        } else if (alvo.dataset.acao === "camada") {
          ir(`#/dossie/${dossie.id}/mapa${alvo.dataset.valor === "ruas" ? "" : `?camada=${alvo.dataset.valor}`}`, true);
        } else if (alvo.dataset.acao === "fechar-folha") {
          raiz.querySelector("[data-folha-local]").innerHTML = "";
        }
      });
      return () => mapa.destruir();
    },
  };
}

const ITENS_FIXOS = ["Ouvir o ruído da rua", "Ver o sol na sala", "Ver as áreas comuns"];

function itensDoRoteiro(dossie) {
  const extras = aparelho.ler(`roteiro-extra/${dossie.id}`, []);
  return [...dossie.visita.map((v) => v.texto), ...ITENS_FIXOS, ...extras];
}

function mensagemPadrao(dossie) {
  return `Olá, vi o apartamento da ${enderecoDoDossie(dossie)}, em ${dossie.bairro}.\nGostaria de visitar {quando}.\nPode confirmar {pergunta 1} e {pergunta 2}?`;
}

export function telaVisita(rota) {
  const dossie = dossieOuErro(rota.params.id);
  const marcados = aparelho.ler(`roteiro/${dossie.id}`, []);
  const mensagem = aparelho.ler(`mensagem/${dossie.id}`, mensagemPadrao(dossie));
  const itens = itensDoRoteiro(dossie).map((texto, i) => `<li><label class="tipo-corpo"><input type="checkbox" data-item="${i}"${marcados.includes(i) ? " checked" : ""}><span>${h(texto)}</span></label></li>`).join("");
  return {
    html: `<div class="tela">
      ${cabecalho({ titulo: "Visita" })}
      <div class="tela-rolagem">
        <section class="cartao"><div class="cartao-corpo">
          <div class="cartao-titulo"><h2 class="tipo-secao">Roteiro</h2></div>
          <ul class="roteiro" data-roteiro>${itens}</ul>
          <form class="linha" data-form="item" style="margin-top:var(--espaco-2)" hidden>
            <input class="campo-linha tipo-corpo" name="item" aria-label="Adicionar item" autocomplete="off">
            <button class="botao-icone" aria-label="Adicionar item">${icone("plus")}</button>
          </form>
          <button class="botao botao-texto tipo-corpo" data-acao="adicionar-item">${icone("plus", "icone-p")}Adicionar item</button>
        </div></section>
        <section class="cartao"><div class="cartao-corpo pilha">
          <div class="cartao-titulo" style="margin:0"><h2 class="tipo-secao">Mensagem ao corretor</h2><button class="botao botao-texto tipo-corpo" data-acao="editar">Editar</button></div>
          <p class="mensagem tipo-corpo" data-mensagem>${h(mensagem)}</p>
          <button class="botao botao-secundario tipo-botao" data-acao="enviar">${icone("share")}Enviar ao corretor</button>
        </div></section>
        <div class="area-botoes"><a class="botao botao-principal tipo-botao" href="#/dossie/${dossie.id}/visita/ao-vivo">Começar visita</a></div>
      </div>
      ${abas(dossie.id, "visita")}
    </div>`,
    montar(raiz) {
      raiz.addEventListener("change", (evento) => {
        const caixa = evento.target.closest("[data-item]");
        if (!caixa) return;
        const lista = [...raiz.querySelectorAll("[data-item]:checked")].map((c) => Number(c.dataset.item));
        aparelho.gravar(`roteiro/${dossie.id}`, lista);
      });
      raiz.addEventListener("submit", (evento) => {
        if (evento.target.dataset.form !== "item") return;
        evento.preventDefault();
        const texto = evento.target.item.value.trim();
        if (!texto) return;
        aparelho.gravar(`roteiro-extra/${dossie.id}`, [...aparelho.ler(`roteiro-extra/${dossie.id}`, []), texto]);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      raiz.addEventListener("click", async (evento) => {
        const acao = evento.target.closest("[data-acao]")?.dataset.acao;
        if (acao === "adicionar-item") {
          const formulario = raiz.querySelector("[data-form=item]");
          formulario.hidden = false;
          formulario.item.focus();
        } else if (acao === "editar") {
          const alvo = raiz.querySelector("[data-mensagem]");
          if (alvo.tagName === "TEXTAREA") {
            aparelho.gravar(`mensagem/${dossie.id}`, alvo.value);
            const p = document.createElement("p");
            p.className = "mensagem tipo-corpo";
            p.dataset.mensagem = "";
            p.textContent = alvo.value;
            alvo.replaceWith(p);
          } else {
            const area = document.createElement("textarea");
            area.className = "mensagem-edicao tipo-corpo";
            area.dataset.mensagem = "";
            area.setAttribute("aria-label", "Mensagem ao corretor");
            area.value = alvo.textContent;
            alvo.replaceWith(area);
            area.focus();
          }
        } else if (acao === "enviar") {
          const alvo = raiz.querySelector("[data-mensagem]");
          const texto = alvo.value ?? alvo.textContent;
          if (navigator.share) {
            try {
              await navigator.share({ text: texto });
            } catch (erro) {
              if (erro.name !== "AbortError") throw erro;
            }
          }
        }
      });
      return null;
    },
  };
}

const DIRECOES = ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"];

export function telaAoVivo(rota) {
  const dossie = dossieOuErro(rota.params.id);
  const itens = itensDoRoteiro(dossie);
  const marcados = aparelho.ler(`roteiro/${dossie.id}`, []);
  const lista = itens.map((texto, i) => `<li><label class="tipo-corpo"><input type="checkbox" data-item="${i}"${marcados.includes(i) ? " checked" : ""}><span>${h(texto)}</span></label></li>`).join("");
  return {
    html: `<div class="tela" data-tema="escuro">
      <header class="cabecalho">
        <h1 class="tipo-barra">Modo visita</h1>
        <a class="botao botao-secundario botao-pilula tipo-botao" href="#/dossie/${dossie.id}/visita" data-acao="encerrar">Encerrar</a>
      </header>
      <div class="tela-rolagem">
        <section class="cartao"><div class="cartao-corpo linha" style="justify-content:space-between">
          <span class="tipo-numero cronometro" data-cronometro aria-live="off">00:00</span>
          <button class="botao-icone" data-acao="pausar" aria-label="Pausar" aria-pressed="false">${icone("player-pause")}</button>
        </div></section>
        <section class="cartao"><div class="cartao-corpo pilha" data-gps>
          <div class="linha">${icone("current-location")}<p class="tipo-corpo">Para confirmar o prédio, o Vereda usa a sua localização só durante a visita.</p></div>
          <div class="linha">
            <button class="botao botao-principal tipo-botao" data-acao="permitir">Permitir</button>
            <button class="botao botao-secundario tipo-botao" data-acao="agora-nao">Agora não</button>
          </div>
        </div></section>
        <div class="grade">
          <label class="grade-item pressionavel">${icone("camera", "icone-g")}<span class="tipo-secao">Foto da fachada</span><span class="tipo-apoio apoio" data-foto></span><input type="file" accept="image/*" capture="environment" aria-label="Foto da fachada"></label>
          <button class="grade-item pressionavel" data-acao="ruido">${icone("ear", "icone-g")}<span class="tipo-secao">Ruído</span><span class="tipo-apoio apoio" data-ruido></span></button>
          <button class="grade-item pressionavel" data-acao="bussola">${icone("compass", "icone-g")}<span class="tipo-secao">Bússola</span><span class="tipo-apoio apoio" data-bussola></span></button>
          <button class="grade-item pressionavel" data-acao="roteiro" aria-expanded="false">${icone("clipboard-check", "icone-g")}<span class="tipo-secao">Roteiro</span><span class="tipo-apoio apoio" data-contagem>${marcados.length} de ${itens.length}</span></button>
        </div>
        <section class="cartao" data-lista hidden style="margin-top:var(--espaco-2)"><div class="cartao-corpo"><ul class="roteiro">${lista}</ul></div></section>
      </div>
    </div>`,
    montar(raiz) {
      let segundos = 0;
      let pausado = false;
      let fluxo = null;
      let observadorGps = null;
      let quadro = 0;
      const relogio = setInterval(() => {
        if (pausado) return;
        segundos += 1;
        const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
        const ss = String(segundos % 60).padStart(2, "0");
        raiz.querySelector("[data-cronometro]").textContent = `${mm}:${ss}`;
      }, 1000);
      const naoSabemosEm = (seletor) => { raiz.querySelector(seletor).innerHTML = textoNaoSabemos(); };
      const aoGirar = (evento) => {
        const rumo = evento.webkitCompassHeading ?? (evento.absolute && evento.alpha !== null ? 360 - evento.alpha : null);
        if (rumo === null || rumo === undefined) return;
        raiz.querySelector("[data-bussola]").textContent = `janela da sala: ${DIRECOES[Math.round(rumo / 45) % 8]}`;
      };
      raiz.addEventListener("change", (evento) => {
        if (evento.target.type === "file") {
          raiz.querySelector("[data-foto]").innerHTML = evento.target.files.length ? icone("check", "icone-p") : "";
          return;
        }
        if (!evento.target.closest("[data-item]")) return;
        const lista = [...raiz.querySelectorAll("[data-item]:checked")].map((c) => Number(c.dataset.item));
        aparelho.gravar(`roteiro/${dossie.id}`, lista);
        raiz.querySelector("[data-contagem]").textContent = `${lista.length} de ${itens.length}`;
      });
      raiz.addEventListener("click", async (evento) => {
        const alvo = evento.target.closest("[data-acao]");
        if (!alvo) return;
        const acao = alvo.dataset.acao;
        if (acao === "pausar") {
          pausado = !pausado;
          alvo.setAttribute("aria-pressed", String(pausado));
          alvo.innerHTML = icone(pausado ? "player-play" : "player-pause");
        } else if (acao === "agora-nao") {
          raiz.querySelector("[data-gps]").innerHTML = `<p class="tipo-corpo">${textoNaoSabemos()}</p>`;
        } else if (acao === "permitir") {
          const caixa = raiz.querySelector("[data-gps]");
          if (!navigator.geolocation) {
            caixa.innerHTML = `<p class="tipo-corpo">${textoNaoSabemos()}</p>`;
            return;
          }
          caixa.innerHTML = `<p class="tipo-corpo">${bloco("60%")}</p>`;
          observadorGps = navigator.geolocation.watchPosition((posicao) => {
            const distancia = distanciaMetros(dossie.lote.centro, [posicao.coords.longitude, posicao.coords.latitude]);
            caixa.innerHTML = `<div class="linha">${icone("current-location")}<p class="tipo-secao">${distancia <= 40 ? "Você está no prédio" : `Você está a ${formatarNumero(Math.round(distancia))} m do prédio`}</p></div>`;
          }, () => {
            caixa.innerHTML = `<p class="tipo-corpo">${textoNaoSabemos()}</p>`;
          });
        } else if (acao === "ruido") {
          if (fluxo) return;
          try {
            fluxo = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch {
            naoSabemosEm("[data-ruido]");
            return;
          }
          const contexto = new AudioContext();
          const analisador = contexto.createAnalyser();
          contexto.createMediaStreamSource(fluxo).connect(analisador);
          const amostras = new Float32Array(analisador.fftSize);
          const medir = () => {
            analisador.getFloatTimeDomainData(amostras);
            const rms = Math.sqrt(amostras.reduce((s, v) => s + v * v, 0) / amostras.length);
            const db = Math.max(30, Math.min(110, Math.round(20 * Math.log10(rms || 1e-6) + 94)));
            raiz.querySelector("[data-ruido]").textContent = `${db} dB agora`;
            quadro = requestAnimationFrame(medir);
          };
          medir();
        } else if (acao === "bussola") {
          const pedir = window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission;
          if (pedir) {
            try {
              if (await DeviceOrientationEvent.requestPermission() !== "granted") throw new Error("negado");
            } catch {
              naoSabemosEm("[data-bussola]");
              return;
            }
          }
          if (!("ondeviceorientationabsolute" in window) && !("ondeviceorientation" in window)) {
            naoSabemosEm("[data-bussola]");
            return;
          }
          naoSabemosEm("[data-bussola]");
          window.addEventListener("deviceorientationabsolute", aoGirar);
          window.addEventListener("deviceorientation", aoGirar);
        } else if (acao === "roteiro") {
          const caixa = raiz.querySelector("[data-lista]");
          caixa.hidden = !caixa.hidden;
          alvo.setAttribute("aria-expanded", String(!caixa.hidden));
        }
      });
      return () => {
        clearInterval(relogio);
        cancelAnimationFrame(quadro);
        if (fluxo) fluxo.getTracks().forEach((t) => t.stop());
        if (observadorGps !== null) navigator.geolocation.clearWatch(observadorGps);
        window.removeEventListener("deviceorientationabsolute", aoGirar);
        window.removeEventListener("deviceorientation", aoGirar);
      };
    },
  };
}

export function telaCaminhos(rota) {
  const dossie = dossieOuErro(rota.params.id);
  const lista = destinos();
  const itens = lista.map((d) => `<li class="valor-linha" style="align-items:center">
    <span class="cresce pilha" style="gap:2px"><span class="tipo-secao">${h(d.nome)}</span><span class="tipo-apoio apoio">${formatarDistancia(distanciaMetros(dossie.lote.centro, d.coordenada))} em linha reta a partir do prédio</span></span>
    <a class="botao botao-secundario botao-pilula tipo-botao" href="${h(linkDoMapa(d.coordenada, d.nome, dossie.lote.centro))}">${icone("external-link", "icone-p")}Abrir rota</a>
  </li>`).join("");
  return {
    html: `<div class="tela">
      ${cabecalho({ titulo: "Caminhos diários" })}
      <div class="tela-rolagem">
        <section class="cartao"><div class="cartao-corpo pilha">
          ${lista.length ? `<ul class="valores">${itens}</ul>` : `<p class="tipo-corpo apoio">Guarde os lugares aonde você vai toda semana. Ficam só neste aparelho.</p>`}
          <button class="botao botao-secundario tipo-botao" data-acao="adicionar-destino" aria-expanded="false">${icone("plus")}Adicionar destino</button>
          <div class="pilha" data-novo hidden>
            <input class="campo-linha tipo-corpo" name="destino" aria-label="Adicionar destino" autocomplete="off">
            <div class="mapa" data-mapa style="height:220px;border-radius:var(--raio-cartao)" aria-label="${h(enderecoDoDossie(dossie))}"></div>
          </div>
          <p class="tipo-apoio apoio">${TEXTO_ROTAS}</p>
        </div></section>
        <section class="cartao" data-fase="final"><div class="cartao-corpo pilha">
          <div class="linha">${etiquetaFase("final")}</div>
          <p class="tipo-corpo">Rotina de 3 pontos, isócronas a pé, trânsito típico, verificação da distância declarada</p>
        </div></section>
      </div>
      ${abas(dossie.id, "dossie")}
    </div>`,
    montar(raiz) {
      let mapa = null;
      raiz.addEventListener("click", (evento) => {
        const alvo = evento.target.closest("[data-acao=adicionar-destino]");
        if (!alvo) return;
        const caixa = raiz.querySelector("[data-novo]");
        caixa.hidden = false;
        alvo.setAttribute("aria-expanded", "true");
        caixa.querySelector("input").focus();
        if (mapa) return;
        mapa = montarMapa(caixa.querySelector("[data-mapa]"), dossie, {
          interativo: true, raios: [500, 1000], lotes: "confirmado", ajustar: 1100, destinos: [],
          aoTocarMapa([x, y]) {
            const campo = caixa.querySelector("input");
            const nome = campo.value.trim();
            if (!nome) {
              campo.focus();
              return;
            }
            aparelho.gravar("destinos", [...destinos(), { nome, coordenada: metrosParaCoordenada(dossie.lote.centro, x, y) }]);
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          },
        });
      });
      return () => mapa && mapa.destruir();
    },
  };
}

function valorNumerico(fato) {
  return fato && typeof fato.valor === "number" && fato.estado !== "nao_sabemos" ? fato.valor : null;
}

const LINHAS_COMPARAR = [
  { nome: "Preço", fato: (d) => d.anuncio.campos.aluguel || d.anuncio.campos.preco, unidade: (d, x) => `${formatarReais(x)} a mais${d.tipo === "aluguel" ? " por mês" : ""}`, mesmoTipo: true },
  { nome: "Área", fato: (d) => d.anuncio.campos.area, unidade: (d, x) => `${formatarNumero(x)} m² a mais` },
  { nome: "Andar", fato: (d) => d.anuncio.campos.andar },
  { nome: "Ano", fato: (d) => fatoDe(d, "predio", "ano") },
  { nome: "Pavimentos", fato: (d) => fatoDe(d, "predio", "pavimentos"), unidade: (d, x) => `${formatarNumero(x)} pavimentos a mais` },
  { nome: "Transmissões no prédio", fato: (d) => fatoDe(d, "transmissoes", "transmissoes_total"), unidade: (d, x) => `${formatarNumero(x)} avaliações fiscais a mais` },
  { nome: "Obras próximas", fato: (d) => fatoDe(d, "obras", "obras_total"), unidade: (d, x) => `${formatarNumero(x)} processos a mais` },
  { nome: "Defesa Civil no bairro", fato: (d) => fatoDe(d, "defesa_civil", "dc_total"), unidade: (d, x) => `${formatarNumero(x)} atendimentos a mais` },
  { nome: "O bairro", fato: (d) => fatoDe(d, "bairro", "crime_total"), unidade: (d, x) => `${formatarNumero(x)} ocorrências a mais`, fase: "final" },
];

export function telaComparar(rota) {
  const ids = (rota.query.get("ids") || "").split(",").filter((id) => estado.dossies.has(id)).slice(0, 3);
  const dossies = ids.map((id) => estado.dossies.get(id));
  const colunas = `repeat(${Math.max(dossies.length, 1)}, minmax(0, 1fr))`;
  const cabecas = dossies.map((d) => `<a class="comparar-col pressionavel" href="#/dossie/${d.id}">
    ${poligonoMini(d, loteConfirmado(d))}
    <span class="tipo-secao">${h(d.bairro)}</span>
    <span class="tipo-apoio apoio">${h(enderecoDoDossie(d))}</span>
    <span class="tipo-apoio apoio">${tipoDoDossie(d)}</span>
  </a>`).join("");
  const linhas = LINHAS_COMPARAR.map((linha) => {
    const fatos = dossies.map((d) => linha.fato(d));
    if (fatos.every((f) => !f)) return "";
    const valores = fatos.map((f) => `<span class="tipo-corpo">${f ? (f.estado === "nao_sabemos" ? textoNaoSabemos() : h(f.texto)) : textoNaoSabemos()}${f && f.ilustrativo ? ` ${pilulaIlustrativo()}` : ""}</span>`).join("");
    let diferenca = "";
    if (dossies.length === 2 && linha.unidade) {
      const [a, b] = fatos.map(valorNumerico);
      const comparavel = a !== null && b !== null && a !== b && (!linha.mesmoTipo || dossies[0].tipo === dossies[1].tipo);
      if (comparavel) {
        const maior = a > b ? dossies[0] : dossies[1];
        diferenca = `<p class="tipo-apoio apoio" style="margin-top:var(--espaco-1)">${h(maior.bairro)} tem ${h(linha.unidade(maior, Math.abs(a - b)))}.</p>`;
      }
    }
    return `<div class="comparar-linha"${linha.fase ? ` data-fase="${linha.fase}"` : ""}>
      <p class="tipo-apoio apoio linha">${linha.nome}${linha.fase ? etiquetaFase(linha.fase) : ""}</p>
      <div class="comparar-valores" style="grid-template-columns:${colunas}">${valores}</div>
      ${diferenca}
    </div>`;
  }).join("");
  return {
    html: `<div class="tela">
      ${cabecalho({ titulo: "Comparar" })}
      <div class="tela-rolagem">
        <div style="padding:0 var(--espaco-3)">
          <div class="comparar" style="grid-template-columns:${colunas}">${cabecas}</div>
          <div class="comparar-linhas">${linhas}</div>
        </div>
        <h2 class="titulo-grupo tipo-secao">Anúncios que você abriu</h2>
        <p class="tipo-corpo apoio" style="padding:0 var(--espaco-4)">Abra outros anúncios pelo Vereda para vê-los aqui.</p>
      </div>
    </div>`,
  };
}

function recorteDoFato(dossie, fato) {
  if (fato.id === "regua") return dossie.bairro;
  if (fato.id.startsWith("anuncio_")) return enderecoDoDossie(dossie);
  const secao = secaoDoFato(dossie, fato.id);
  if (secao && RECORTE_BAIRRO.has(secao.id)) return dossie.bairro;
  return enderecoDoDossie(dossie);
}

export function folhaFonte(rota) {
  const dossie = dossieOuErro(rota.params.id);
  const fato = acharFato(dossie, rota.params.fato);
  if (!fato) throw new Error(`Fato não encontrado: ${rota.params.fato}`);
  const f = fato.fonte;
  const linha = (nome, valor) => valor ? `<div class="valor-linha tipo-corpo"><span class="valor-nome">${nome}</span><span class="valor-dado">${valor}</span></div>` : "";
  const estadoFato = estadoDoFato(dossie.id, fato);
  const verificacao = estadoFato === "em_verificacao" ? linha("Em verificação", `${formatarData(hojeIso())}, ${formatarData(hojeIso())}; O valor está diferente do que vi`) : "";
  const base = [f.base, f.orgao, f.via].filter(Boolean).join(", ");
  const conteudo = `<div class="pilha">
    ${fato.ilustrativo ? `<p class="tipo-corpo">${TEXTO_ILUSTRATIVO}</p>` : ""}
    <div class="valores">
      ${linha("Base", h(base))}
      ${linha("Licença", h(f.licenca))}
      ${linha("Recorte", h(recorteDoFato(dossie, fato)))}
      ${fato.regua ? linha("Período", `${fato.regua.periodo_meses} meses`) : ""}
      ${fato.regua ? linha("N", formatarNumero(fato.regua.n)) : ""}
      ${linha("Consultado em", f.consultado_em ? formatarData(f.consultado_em) : "")}
      ${verificacao}
    </div>
    <p class="rodape-rotulo tipo-apoio apoio">${traco(fato.rotulo)}<span>${h(maiuscula(ROTULOS[fato.rotulo]))}</span></p>
    ${fato.escala ? `<p class="tipo-apoio apoio">${h(fato.escala)}</p>` : ""}
    ${f.url ? `<a class="botao botao-secundario tipo-botao" href="${h(f.url)}" target="_blank" rel="noopener noreferrer">${icone("external-link")}Abrir a base</a>` : ""}
  </div>`;
  return { html: folha({ titulo: "De onde vem", conteudo }) };
}

const MOTIVOS = ["O valor está diferente do que vi", "Não é deste prédio", "Está desatualizado", "A fonte não diz isso"];

export function folhaContestar(rota) {
  const dossie = dossieOuErro(rota.params.id);
  const fato = acharFato(dossie, rota.params.fato);
  if (!fato) throw new Error(`Fato não encontrado: ${rota.params.fato}`);
  const visivel = fato.id === "regua"
    ? `<p class="tipo-corpo">${h(fato.texto)}</p>`
    : linhaDeValor(dossie, fato, { secao: secaoDoFato(dossie, fato.id), nome: null });
  const conteudo = `<form class="pilha" data-form="contestar">
    <div class="valores">${visivel}</div>
    <fieldset class="opcoes" style="border:0;margin:0;padding:0">
      <legend class="oculto-leitor">Isso está errado</legend>
      ${MOTIVOS.map((m, i) => `<label class="opcao tipo-corpo"><input type="radio" name="motivo" value="${i}"><span>${m}</span></label>`).join("")}
    </fieldset>
    <button class="botao botao-principal tipo-botao" type="submit" disabled>Enviar</button>
  </form>`;
  return {
    html: folha({ titulo: "Isso está errado", conteudo }),
    montar(raiz) {
      const formulario = raiz.querySelector("[data-form=contestar]");
      formulario.addEventListener("change", () => { formulario.querySelector("[type=submit]").disabled = false; });
      formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        contestar(dossie.id, fato.id, MOTIVOS[Number(formulario.motivo.value)]);
        estado.recebido = `${dossie.id}/${fato.id}`;
        const secao = secaoDoFato(dossie, fato.id);
        if (secao) seccoesAbertas(dossie.id).add(secao.id);
        voltarPara(`#/dossie/${dossie.id}`);
      });
      return null;
    },
  };
}

function eventosDoPredio(dossie) {
  const eventos = [];
  const ano = fatoDe(dossie, "predio", "ano");
  if (ano) eventos.push({ ano: ano.texto, ordem: Number(ano.valor), texto: fatoDe(dossie, "linha_do_tempo", "lt_construcao")?.texto || secaoDe(dossie, "predio").resumo, fato: ano });
  const transmissoes = fatoDe(dossie, "transmissoes", "transmissoes_total");
  if (transmissoes) eventos.push({ ano: "2015-2026", ordem: 2015, texto: secaoDe(dossie, "transmissoes").resumo, fato: transmissoes });
  const dc = fatoDe(dossie, "defesa_civil", "dc_total");
  if (dc) eventos.push({ ano: "2024", ordem: 2024, texto: secaoDe(dossie, "defesa_civil").resumo, fato: dc });
  const demolicao = fatoDe(dossie, "obras", "obras_demolicao");
  if (demolicao) eventos.push({ ano: "2026", ordem: 2026, texto: demolicao.texto, fato: demolicao });
  return eventos.sort((a, b) => a.ordem - b.ordem);
}

export function telaLinhaDoTempo(rota) {
  const dossie = dossieOuErro(rota.params.id);
  const eventos = eventosDoPredio(dossie).map((e) => `<a class="evento pressionavel" href="#/dossie/${dossie.id}/fonte/${e.fato.id}">
    <span class="evento-ano tipo-secao">${h(e.ano)}</span>
    <span class="cresce pilha" style="gap:2px"><span class="tipo-corpo linha" style="flex-wrap:wrap">${traco(e.fato.rotulo)}${h(e.texto)}${e.fato.ilustrativo ? pilulaIlustrativo() : ""}</span><span class="tipo-apoio apoio">${h(linhaDaFonte(e.fato.fonte))}</span></span>
  </a>`).join("");
  return {
    html: `<div class="tela">
      ${cabecalho({ titulo: "Linha do tempo do prédio", fase: "final" })}
      <div class="tela-rolagem"><section class="cartao" style="overflow:hidden">${eventos}</section></div>
      ${abas(dossie.id, "dossie")}
    </div>`,
  };
}

const PESSOAS = ["1", "2", "3 a 4", "5 ou mais"];
const VEICULOS = ["0", "1", "2 ou mais"];

export function folhaDomicilio() {
  const dados = aparelho.ler("domicilio", {});
  const conteudo = `<form class="pilha" data-form="domicilio">
    <div class="linha">${etiquetaFase("final")}<p class="tipo-apoio apoio">Fica só neste aparelho.</p></div>
    <div class="pilha" style="gap:var(--espaco-2)"><p class="tipo-secao">Pessoas</p>${segmentado("pessoas", PESSOAS, dados.pessoas)}</div>
    ${alterna("crianca", "Criança em idade escolar", dados.crianca)}
    <div class="pilha" style="gap:var(--espaco-2)"><p class="tipo-secao">Veículos</p>${segmentado("veiculos", VEICULOS, dados.veiculos)}</div>
    ${alterna("deslocamento", "Deslocamento", dados.deslocamento)}
    ${alterna("pet", "Pet", dados.pet)}
    <p class="tipo-corpo" data-apagados role="status"></p>
    <button class="botao botao-principal tipo-botao" type="submit">Salvar</button>
    <button class="botao botao-secundario tipo-botao" type="button" data-acao="apagar-domicilio">Apagar</button>
  </form>`;
  return {
    html: folha({ titulo: "Dados do domicílio", conteudo }),
    montar(raiz) {
      const formulario = raiz.querySelector("[data-form=domicilio]");
      const escolhas = { pessoas: dados.pessoas, veiculos: dados.veiculos };
      formulario.addEventListener("click", (evento) => {
        const segmento = evento.target.closest("[data-acao=segmento]");
        if (segmento) {
          const grupo = segmento.closest("[data-nome]");
          escolhas[grupo.dataset.nome] = segmento.dataset.valor;
          grupo.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === segmento)));
        }
        if (evento.target.closest("[data-acao=apagar-domicilio]")) {
          aparelho.gravar("domicilio", {});
          formulario.querySelectorAll("[aria-pressed]").forEach((b) => b.setAttribute("aria-pressed", "false"));
          formulario.querySelectorAll("input[type=checkbox]").forEach((c) => { c.checked = false; });
          escolhas.pessoas = undefined;
          escolhas.veiculos = undefined;
          formulario.querySelector("[data-apagados]").textContent = "Dados apagados.";
        }
      });
      formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        aparelho.gravar("domicilio", {
          ...escolhas,
          crianca: formulario.crianca.checked,
          deslocamento: formulario.deslocamento.checked,
          pet: formulario.pet.checked,
        });
        raiz.querySelector("[data-acao=fechar-folha]").click();
      });
      return null;
    },
  };
}

function fontesDoApp() {
  const vistas = new Map();
  for (const dossie of estado.dossies.values()) {
    const fatos = [...Object.values(dossie.anuncio.campos), ...dossie.secoes.flatMap((s) => s.fatos), reguaComoFato(dossie)];
    for (const fato of fatos) {
      const f = fato.fonte;
      if (fato.ilustrativo || f.base === "anúncio" || f.base === TEXTO_ILUSTRATIVO) continue;
      const chave = `${f.base}|${f.orgao}`;
      if (!vistas.has(chave)) vistas.set(chave, f);
    }
  }
  return [...vistas.values()];
}

export function telaSobre() {
  const fontes = fontesDoApp().map((f) => {
    const corpo = `<span class="cresce pilha" style="gap:2px">
      <span class="tipo-secao">${h([f.base, f.orgao].filter(Boolean).join(", "))}</span>
      ${f.via ? `<span class="tipo-apoio apoio">${h(f.via)}</span>` : ""}
      ${f.licenca ? `<span class="tipo-apoio apoio">${h(f.licenca)}</span>` : ""}
    </span>`;
    return f.url
      ? `<a class="fonte-item pressionavel" href="${h(f.url)}" target="_blank" rel="noopener noreferrer">${corpo}${icone("external-link", "icone-p")}</a>`
      : `<div class="fonte-item">${corpo}</div>`;
  }).join("");
  return {
    html: `<div class="tela">
      ${cabecalho({ titulo: "Sobre os dados" })}
      <div class="tela-rolagem">
        <section class="cartao" style="overflow:hidden">${fontes}</section>
        <div class="area-botoes"><button class="botao botao-secundario tipo-botao" data-acao="apagar-tudo">${icone("trash")}Apagar dados do aparelho</button></div>
      </div>
      <div data-dialogo></div>
    </div>`,
    montar(raiz) {
      raiz.addEventListener("click", (evento) => {
        const acao = evento.target.closest("[data-acao]")?.dataset.acao;
        const caixa = raiz.querySelector("[data-dialogo]");
        if (acao === "apagar-tudo") {
          caixa.innerHTML = `<div class="folha-fundo" data-acao="cancelar"></div>
            <div class="dialogo" role="alertdialog" aria-modal="true" aria-labelledby="dialogo-texto">
              <p class="tipo-corpo" id="dialogo-texto">Apagar todos os dossiês e destinos deste aparelho? Não dá para desfazer.</p>
              <button class="botao botao-principal tipo-botao" data-acao="confirmar-apagar">Apagar</button>
              <button class="botao botao-secundario tipo-botao" data-acao="cancelar">Cancelar</button>
            </div>`;
          caixa.querySelector("[data-acao=cancelar].botao").focus();
        } else if (acao === "cancelar") {
          caixa.innerHTML = "";
        } else if (acao === "confirmar-apagar") {
          aparelho.apagarTudo();
          estado.apagado = true;
          estado.selecao = [];
          ir("#/");
        }
      });
      return null;
    },
  };
}
