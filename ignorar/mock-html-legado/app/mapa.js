import { semente, formatarDistancia, h } from "./dados.js";

const SVG = "http://www.w3.org/2000/svg";
const geometrias = new Map();

function girar([x, y], angulo) {
  const c = Math.cos(angulo);
  const s = Math.sin(angulo);
  return [x * c - y * s, x * s + y * c];
}

function retangulo(cx, cy, largura, altura, angulo, rand) {
  const meiaL = largura / 2;
  const meiaA = altura / 2;
  const cantos = [[-meiaL, -meiaA], [meiaL, -meiaA], [meiaL, meiaA], [-meiaL, meiaA]];
  return cantos.map(([x, y]) => girar([cx + x + (rand() - 0.5) * 3, cy + y + (rand() - 0.5) * 3], angulo));
}

export function geometria(dossie) {
  if (geometrias.has(dossie.id)) return geometrias.get(dossie.id);
  const rand = semente(dossie.id);
  const angulo = ((rand() * 24) - 12) * Math.PI / 180;
  const passoX = 140;
  const passoY = 150;
  const posicoes = [[0, 0], [-44, 0], [44, 0], [0, -48], [0, 48], [-44, -48], [44, -48], [-44, 48], [44, 48]];
  const lotes = posicoes.map(([x, y]) => retangulo(x, y, 34 + rand() * 4, 38 + rand() * 6, angulo, rand));
  const ruas = [];
  for (let k = -20; k <= 20; k += 1) {
    ruas.push({ x1: passoX / 2 + k * passoX, y1: -3200, x2: passoX / 2 + k * passoX, y2: 3200, largura: k % 4 === 0 ? 20 : 9 });
    ruas.push({ x1: -3200, y1: passoY / 2 + k * passoY, x2: 3200, y2: passoY / 2 + k * passoY, largura: k % 4 === 1 ? 20 : 9 });
  }
  const pracas = [];
  while (pracas.length < 4) {
    const i = Math.round((rand() - 0.5) * 14);
    const j = Math.round((rand() - 0.5) * 12);
    if (Math.abs(i) < 2 && Math.abs(j) < 2) continue;
    pracas.push({ x: i * passoX - passoX / 2 + 12, y: j * passoY - passoY / 2 + 12, largura: passoX - 24, altura: passoY - 24 });
  }
  const litoral = dossie.id === "boa-viagem";
  let agua;
  if (litoral) {
    const pontos = [];
    for (let y = -3400; y <= 3400; y += 200) pontos.push([1650 + 70 * Math.sin(y / 700), y]);
    agua = { tipo: "mar", pontos };
  } else {
    const lado = rand() < 0.5 ? -1 : 1;
    const base = lado * (520 + rand() * 420);
    agua = { tipo: "rio", d: `M -3400 ${base + 300} C -1200 ${base - 400}, 900 ${base + 500}, 3400 ${base - 200}`, largura: 110 };
  }
  const predios = [];
  for (let i = -5; i <= 5; i += 1) {
    for (let j = -5; j <= 5; j += 1) {
      if (i === 0 && j === 0) continue;
      const quantos = 1 + Math.floor(rand() * 3);
      for (let n = 0; n < quantos; n += 1) {
        const cx = i * passoX + (rand() - 0.5) * 60;
        const cy = j * passoY + (rand() - 0.5) * 70;
        predios.push({ poligono: retangulo(cx, cy, 22 + rand() * 18, 22 + rand() * 18, angulo, rand), altura: 10 + rand() * 50 });
      }
    }
  }
  const calor = [];
  for (let x = -1100; x < 1100; x += 100) {
    for (let y = -1100; y < 1100; y += 100) {
      const ruido = 0.5 + 0.35 * Math.sin(x / 380 + rand()) * Math.cos(y / 460) + (rand() - 0.5) * 0.3;
      calor.push({ x, y, v: Math.min(1, Math.max(0, litoral && x > 1200 ? 0.05 : ruido)) });
    }
  }
  const resultado = { angulo, lotes, ruas, pracas, agua, predios, calor };
  geometrias.set(dossie.id, resultado);
  return resultado;
}

function caminho(pontos) {
  return `M ${pontos.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
}

export function caminhoDoLote(dossie, indice = 0) {
  return caminho(geometria(dossie).lotes[indice]);
}

export function poligonoMini(dossie, confirmado) {
  const lote = geometria(dossie).lotes[0];
  const xs = lote.map(([x]) => x);
  const ys = lote.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const largura = Math.max(...xs) - minX;
  const altura = Math.max(...ys) - minY;
  const escala = Math.min(34 / largura, 26 / altura);
  const pontos = lote.map(([x, y]) => [3 + (x - minX) * escala + (34 - largura * escala) / 2, 3 + (y - minY) * escala + (26 - altura * escala) / 2]);
  const estilo = confirmado
    ? `fill="var(--cor-azul-cadastral)" fill-opacity="0.18" stroke="var(--cor-azul-cadastral)" stroke-width="1.5"`
    : `fill="none" stroke="var(--cor-traco)" stroke-width="1.5" stroke-dasharray="3 3"`;
  return `<svg class="poligono-mini" viewBox="0 0 40 32" aria-hidden="true"><path d="${caminho(pontos)}" ${estilo} stroke-linejoin="round"/></svg>`;
}

const PINO = `<svg viewBox="0 0 28 36" aria-hidden="true"><path d="M14 35 C14 35 2 22.5 2 13.5 a12 12 0 0 1 24 0 C26 22.5 14 35 14 35 Z" fill="var(--cor-barro)" stroke="var(--cor-superficie)" stroke-width="2"/><circle cx="14" cy="13.5" r="4.5" fill="var(--cor-superficie)"/></svg>`;

function desenharMundo(dossie, opcoes) {
  const g = geometria(dossie);
  const graus = g.angulo * 180 / Math.PI;
  const partes = [];
  partes.push(`<rect x="-4000" y="-4000" width="8000" height="8000" fill="var(--mapa-terra)"/>`);
  partes.push(`<g transform="rotate(${graus.toFixed(2)})">`);
  for (const p of g.pracas) partes.push(`<rect x="${p.x}" y="${p.y}" width="${p.largura}" height="${p.altura}" rx="6" fill="var(--mapa-praca)"/>`);
  for (const r of g.ruas) partes.push(`<line x1="${r.x1}" y1="${r.y1}" x2="${r.x2}" y2="${r.y2}" stroke="var(--mapa-via)" stroke-width="${r.largura}"/>`);
  partes.push(`</g>`);
  if (g.agua.tipo === "mar") {
    const borda = g.agua.pontos;
    const praia = borda.map(([x, y]) => [x - 70, y]);
    partes.push(`<path d="M ${praia.map(([x, y]) => `${x} ${y}`).join(" L ")} L 4000 3400 L 4000 -3400 Z" fill="var(--mapa-praia)"/>`);
    partes.push(`<path d="M ${borda.map(([x, y]) => `${x} ${y}`).join(" L ")} L 4000 3400 L 4000 -3400 Z" fill="var(--mapa-mar)"/>`);
  } else {
    partes.push(`<path d="${g.agua.d}" fill="none" stroke="var(--mapa-mar)" stroke-width="${g.agua.largura}"/>`);
  }
  if (opcoes.camada === "calor" && opcoes.calor) {
    for (const c of g.calor) {
      partes.push(`<rect x="${c.x}" y="${c.y}" width="100" height="100" fill="var(--cor-texto)" fill-opacity="${(0.06 + c.v * 0.54).toFixed(2)}"/>`);
    }
  }
  if (opcoes.camada === "alagamento") {
    const id = `hachura-${dossie.id}`;
    partes.push(`<defs><pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="16" stroke="var(--cor-texto)" stroke-width="3" stroke-opacity="0.45"/></pattern></defs>`);
    if (g.agua.tipo === "mar") {
      const borda = g.agua.pontos;
      partes.push(`<path d="M ${borda.map(([x, y]) => `${x - 150} ${y}`).join(" L ")} L ${borda.slice().reverse().map(([x, y]) => `${x} ${y}`).join(" L ")} Z" fill="url(#${id})"/>`);
    } else {
      partes.push(`<path d="${g.agua.d}" fill="none" stroke="url(#${id})" stroke-width="${g.agua.largura + 120}"/>`);
      partes.push(`<path d="${g.agua.d}" fill="none" stroke="var(--mapa-mar)" stroke-width="${g.agua.largura}"/>`);
    }
  }
  if (opcoes.camada === "3d") {
    for (const p of g.predios) {
      const sombra = p.poligono.map(([x, y]) => [x + p.altura * 0.5, y + p.altura * 0.35]);
      partes.push(`<path d="${caminho(sombra)}" fill="var(--cor-texto)" fill-opacity="0.16"/>`);
    }
    for (const p of g.predios) partes.push(`<path d="${caminho(p.poligono)}" fill="var(--cor-superficie)" stroke="var(--cor-traco)" stroke-width="1" vector-effect="non-scaling-stroke"/>`);
  }
  if (opcoes.lotes === "candidatos") {
    g.lotes.forEach((lote, i) => {
      const selecionado = i === opcoes.selecionado;
      if (selecionado) return;
      const destaque = opcoes.destacarVizinhos;
      partes.push(`<path data-lote="${i}" d="${caminho(lote)}" fill="var(--cor-superficie)" fill-opacity="${destaque ? 0.9 : 0.5}" stroke="${destaque ? "var(--cor-texto)" : "var(--cor-traco)"}" stroke-width="${destaque ? 2 : 1.5}" stroke-dasharray="4 3" vector-effect="non-scaling-stroke" style="cursor:pointer"/>`);
    });
    const escolhido = g.lotes[opcoes.selecionado];
    partes.push(`<path data-lote="${opcoes.selecionado}" d="${caminho(escolhido)}" fill="var(--cor-azul-cadastral)" fill-opacity="0.18" stroke="var(--cor-azul-cadastral)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`);
  } else if (opcoes.lotes === "confirmado") {
    partes.push(`<path d="${caminho(g.lotes[0])}" fill="var(--cor-azul-cadastral)" fill-opacity="0.18" stroke="var(--cor-azul-cadastral)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`);
  }
  for (const raio of opcoes.raios) {
    partes.push(`<circle cx="0" cy="0" r="${raio}" fill="none" stroke="var(--cor-barro)" stroke-width="1.25" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`);
  }
  for (const destino of opcoes.destinos || []) {
    partes.push(`<circle cx="${destino.x}" cy="${destino.y}" r="5" fill="var(--cor-texto)" stroke="var(--cor-superficie)" stroke-width="2" vector-effect="non-scaling-stroke"/>`);
  }
  return partes.join("");
}

export function montarMapa(elemento, dossie, opcoesIniciais) {
  let opcoes = { raios: [500], lotes: "confirmado", selecionado: 0, camada: "ruas", interativo: false, ajustar: 560, ...opcoesIniciais };
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "mapa-mundo");
  svg.setAttribute("aria-hidden", "true");
  const mundo = document.createElementNS(SVG, "g");
  svg.appendChild(mundo);
  const sobre = document.createElement("div");
  sobre.className = "mapa-sobre";
  elemento.prepend(sobre);
  elemento.prepend(svg);

  let largura = 0;
  let altura = 0;
  let escala = 1;
  let centro = [0, 0];

  function aTela([x, y]) {
    return [largura / 2 + (x - centro[0]) * escala, altura / 2 + (y - centro[1]) * escala];
  }

  function aMundo([sx, sy]) {
    return [(sx - largura / 2) / escala + centro[0], (sy - altura / 2) / escala + centro[1]];
  }

  function posicionar() {
    mundo.setAttribute("transform", `translate(${(largura / 2 - centro[0] * escala).toFixed(2)} ${(altura / 2 - centro[1] * escala).toFixed(2)}) scale(${escala.toFixed(5)})`);
    const partes = [];
    if (opcoes.pino !== false) {
      const [px, py] = aTela([0, 0]);
      partes.push(`<div class="pino" style="left:${px}px;top:${py}px"${opcoes.aoTocarPino ? ` data-pino role="button" tabindex="0" aria-label="${h(opcoes.rotuloPino || "")}"` : ""}>${PINO}</div>`);
    }
    for (const raio of opcoes.raios) {
      const [rx, ry] = aTela([0, -raio]);
      if (ry < 14 || ry > altura - 14 || rx < 0 || rx > largura) continue;
      partes.push(`<span class="pilula-mapa tipo-apoio" style="left:${rx}px;top:${ry}px">${formatarDistancia(raio)} em linha reta</span>`);
    }
    sobre.innerHTML = partes.join("") + (opcoes.extraSobre || "");
  }

  function redesenhar() {
    mundo.innerHTML = desenharMundo(dossie, opcoes);
    posicionar();
  }

  function medir() {
    const caixa = elemento.getBoundingClientRect();
    if (!caixa.width || !caixa.height) return;
    const primeira = largura === 0;
    largura = caixa.width;
    altura = caixa.height;
    if (primeira) escala = (Math.min(largura, altura) / 2 - 14) / opcoes.ajustar;
    posicionar();
  }

  const observador = new ResizeObserver(medir);
  observador.observe(elemento);
  redesenhar();
  medir();

  const ponteiros = new Map();
  let arrastou = false;
  let inicio = null;

  function limitar() {
    escala = Math.min(4, Math.max(0.05, escala));
    centro = [Math.max(-2600, Math.min(2600, centro[0])), Math.max(-2600, Math.min(2600, centro[1]))];
  }

  function zoom(fator, sx, sy) {
    const antes = aMundo([sx, sy]);
    escala *= fator;
    limitar();
    const depois = aMundo([sx, sy]);
    centro = [centro[0] + antes[0] - depois[0], centro[1] + antes[1] - depois[1]];
    posicionar();
  }

  function local(evento) {
    const caixa = elemento.getBoundingClientRect();
    return [evento.clientX - caixa.left, evento.clientY - caixa.top];
  }

  if (opcoes.interativo) {
    elemento.addEventListener("pointerdown", (evento) => {
      if (evento.target.closest("button, a, [data-pino]")) return;
      elemento.setPointerCapture(evento.pointerId);
      ponteiros.set(evento.pointerId, local(evento));
      arrastou = false;
      inicio = local(evento);
    });
    elemento.addEventListener("pointermove", (evento) => {
      if (!ponteiros.has(evento.pointerId)) return;
      const anterior = ponteiros.get(evento.pointerId);
      const atual = local(evento);
      if (ponteiros.size === 1) {
        if (Math.hypot(atual[0] - inicio[0], atual[1] - inicio[1]) > 6) arrastou = true;
        centro = [centro[0] - (atual[0] - anterior[0]) / escala, centro[1] - (atual[1] - anterior[1]) / escala];
        limitar();
        posicionar();
      } else if (ponteiros.size === 2) {
        arrastou = true;
        const [outro] = [...ponteiros.entries()].filter(([id]) => id !== evento.pointerId).map(([, p]) => p);
        const antes = Math.hypot(anterior[0] - outro[0], anterior[1] - outro[1]);
        const depois = Math.hypot(atual[0] - outro[0], atual[1] - outro[1]);
        if (antes > 0) zoom(depois / antes, (atual[0] + outro[0]) / 2, (atual[1] + outro[1]) / 2);
      }
      ponteiros.set(evento.pointerId, atual);
    });
    const soltar = (evento) => {
      if (!ponteiros.has(evento.pointerId)) return;
      ponteiros.delete(evento.pointerId);
      if (arrastou || ponteiros.size > 0) return;
      const ponto = local(evento);
      const alvo = document.elementFromPoint(evento.clientX, evento.clientY);
      const lote = alvo && alvo.closest("[data-lote]");
      if (lote && opcoes.aoTocarLote) opcoes.aoTocarLote(Number(lote.dataset.lote));
      else if (opcoes.aoTocarMapa) opcoes.aoTocarMapa(aMundo(ponto));
    };
    elemento.addEventListener("pointerup", soltar);
    elemento.addEventListener("pointercancel", (evento) => ponteiros.delete(evento.pointerId));
    elemento.addEventListener("wheel", (evento) => {
      evento.preventDefault();
      const [sx, sy] = local(evento);
      zoom(Math.exp(-evento.deltaY * 0.0015), sx, sy);
    }, { passive: false });
  }

  elemento.addEventListener("click", (evento) => {
    if (evento.target.closest("[data-pino]") && opcoes.aoTocarPino) opcoes.aoTocarPino();
  });
  elemento.addEventListener("keydown", (evento) => {
    if ((evento.key === "Enter" || evento.key === " ") && evento.target.closest("[data-pino]") && opcoes.aoTocarPino) {
      evento.preventDefault();
      opcoes.aoTocarPino();
    }
  });

  return {
    atualizar(novas) {
      opcoes = { ...opcoes, ...novas };
      redesenhar();
    },
    destruir() {
      observador.disconnect();
    },
  };
}
