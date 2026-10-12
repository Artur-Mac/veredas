import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pasta = join(raiz, 'docs', 'capturas', 'android');
const pacote = 'br.propsight.prototipo';
const atividade = `${pacote}/.MainActivity`;
const adb = process.env.ANDROID_HOME === undefined ? 'adb' : join(process.env.ANDROID_HOME, 'platform-tools', 'adb.exe');
const escalasDeAnimacao = ['animator_duration_scale', 'transition_animation_scale', 'window_animation_scale'];

const dossies = readdirSync(join(raiz, 'src', 'fixtures', 'dossies'))
  .filter((arquivo) => arquivo.endsWith('.json'))
  .map((arquivo) => JSON.parse(readFileSync(join(raiz, 'src', 'fixtures', 'dossies', arquivo), 'utf8')));

function exigir(dossie, descricao) {
  if (dossie === undefined) {
    throw new Error(`Nenhuma fixture para ${descricao}`);
  }
  return dossie;
}

const resolvido = exigir(
  dossies.find((d) => d.identidade.status === 'resolvido' && d.anuncio.operacao === 'aluguel'),
  'dossiê resolvido',
);
const pendente = exigir(
  dossies.find((d) => d.identidade.status === 'pendente_confirmacao'),
  'dossiê com confirmação',
);
const primeiraCandidata = exigir(pendente.identidade.candidatas[0], 'candidata do dossiê pendente');

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

function executar(...argumentos) {
  return execFileSync(adb, argumentos, { encoding: 'utf8' });
}

function capturar(nome) {
  const imagem = execFileSync(adb, ['exec-out', 'screencap', '-p']);
  writeFileSync(join(pasta, `${nome}.png`), imagem);
  console.log(`${nome}.png`);
}

function telaAtual() {
  try {
    executar('shell', 'uiautomator', 'dump', '/sdcard/propsight-tela.xml');
    return executar('shell', 'cat', '/sdcard/propsight-tela.xml');
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message.split('\n')[0] : String(erro);
    console.warn(`Leitura da tela falhou, nova tentativa: ${motivo}`);
    return '';
  }
}

function decodificar(texto) {
  return texto
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#10;', '\n')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function localizar(xml, alvo) {
  const padrao = /<node [^>]*?text="([^"]*)"[^>]*?content-desc="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
  for (const achado of xml.matchAll(padrao)) {
    const [, texto, descricao, ...limites] = achado;
    const [x1, y1, x2, y2] = limites.map(Number);
    const visivel = x2 > x1 && y2 > y1;
    if (visivel && (decodificar(texto) === alvo || decodificar(descricao).replace(/^[-\s,]+/u, '') === alvo)) {
      return { x: Math.round((x1 + x2) / 2), y: Math.round((y1 + y2) / 2), topo: y1 };
    }
  }
  return null;
}

async function esperarTexto(alvo, limiteMs = 30000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    const posicao = localizar(telaAtual(), alvo);
    if (posicao !== null) {
      return posicao;
    }
    await esperar(1500);
  }
  throw new Error(`"${alvo}" não apareceu na tela em ${limiteMs / 1000} s`);
}

async function tocar(alvo) {
  const { x, y } = await esperarTexto(alvo);
  executar('shell', 'input', 'tap', String(x), String(y));
}

const [largura, altura] = executar('shell', 'wm', 'size').trim().split(':').pop().trim().split('x').map(Number);

async function rolarAte(alvo, yDesejado) {
  const x = String(Math.round(largura / 2));
  let anterior = null;
  for (let tentativa = 0; tentativa < 10; tentativa += 1) {
    const posicao = localizar(telaAtual(), alvo);
    const parado = posicao !== null && anterior !== null && Math.abs(posicao.topo - anterior) < 8;
    if (posicao !== null && (Math.abs(posicao.topo - yDesejado) < 60 || parado)) {
      return;
    }
    anterior = posicao === null ? null : posicao.topo;
    const distancia = posicao === null ? 900 : Math.max(Math.min(posicao.topo - yDesejado, 1000), -1000);
    const inicio = distancia > 0 ? Math.round(altura * 0.62) : Math.round(altura * 0.3);
    executar('shell', 'input', 'swipe', x, String(inicio), x, String(inicio - distancia), '1400');
    await esperar(900);
  }
  throw new Error(`não foi possível rolar até "${alvo}"`);
}

function compartilhar(texto, comDestino) {
  const argumentos = ['shell', 'am', 'start', '-a', 'android.intent.action.SEND', '-t', 'text/plain', '--es', 'android.intent.extra.TEXT', `'${texto}'`];
  executar(...(comDestino ? [...argumentos, '-n', atividade] : argumentos));
}

const linkResolvido = `https://anuncio.exemplo/imovel/${resolvido.anuncio.codigo_anuncio}`;
const linkPendente = `https://anuncio.exemplo/imovel/${pendente.anuncio.codigo_anuncio}`;

rmSync(pasta, { recursive: true, force: true });
mkdirSync(pasta, { recursive: true });
for (const escala of escalasDeAnimacao) {
  executar('shell', 'settings', 'put', 'global', escala, '0');
}
try {
  executar('shell', 'pm', 'clear', pacote);
  executar('shell', 'am', 'start', '-W', '-n', atividade);
  await esperarTexto('Compartilhe ou cole o link do anúncio.', 60000);
  await esperar(1500);
  capturar('01-entrada');

  compartilhar(`Olha este: ${linkResolvido}`, true);
  await esperarTexto('Ver o que se sabe do prédio');
  await esperar(2500);
  capturar('02-recebido-com-o-app-aberto');

  await tocar('Ver o que se sabe do prédio');
  await esperarTexto('Abrir o dossiê', 40000);
  await esperar(1000);
  capturar('03-etapas');

  await tocar('Abrir o dossiê');
  await esperarTexto('Mensagem');
  await esperar(3500);
  capturar('04-dossie');
  await rolarAte('Identidade', 330);
  await esperar(1500);
  capturar('05-silhueta-do-predio');

  executar('shell', 'am', 'force-stop', pacote);
  compartilhar(linkPendente, true);
  await esperarTexto('Ver o que se sabe do prédio', 60000);
  await esperar(1500);
  capturar('06-recebido-com-o-app-fechado');

  await tocar('Ver o que se sabe do prédio');
  await tocar('Confirmar o prédio');
  await tocar(`Escolher a candidata ${primeiraCandidata.id} no mapa`);
  await esperar(2500);
  capturar('07-confirmacao-do-edificio');
  await rolarAte('Toque numa letra do mapa ou num cartão abaixo para escolher.', 330);
  await esperar(1500);
  capturar('08-candidatas-com-silhueta');

  compartilhar(linkResolvido, false);
  await esperar(3500);
  capturar('09-folha-de-compartilhamento');
  executar('shell', 'input', 'keyevent', 'KEYCODE_BACK');

  compartilhar('https://anuncio.exemplo/imovel/123456789', true);
  await esperarTexto('Este anúncio não está entre os exemplos.');
  await esperar(1500);
  capturar('10-link-fora-da-demonstracao');

  executar('shell', 'am', 'force-stop', pacote);
  executar('shell', 'am', 'start', '-W', '-n', atividade);
  await tocar('Meus dossiês');
  await rolarAte('Aparência', Math.round(altura * 0.5));
  await tocar('Escuro');
  compartilhar(linkResolvido, true);
  await tocar('Ver o que se sabe do prédio');
  await tocar('Abrir o dossiê');
  await esperarTexto('Mensagem');
  await esperar(3500);
  capturar('11-dossie-escuro');
  await rolarAte('Identidade', 330);
  await esperar(1500);
  capturar('12-silhueta-escuro');
} finally {
  for (const escala of escalasDeAnimacao) {
    executar('shell', 'settings', 'put', 'global', escala, '1');
  }
}
