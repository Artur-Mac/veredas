import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pasta = join(raiz, 'docs', 'capturas');
const canal = process.env.PROPSIGHT_NAVEGADOR ?? 'msedge';
const pastaWeb = join(raiz, 'dist');

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function servirExportacao() {
  if (!existsSync(join(pastaWeb, 'index.html'))) {
    throw new Error('Rode "npx expo export --platform web" antes das capturas, ou defina PROPSIGHT_URL.');
  }
  const servidor = createServer((pedido, resposta) => {
    const caminho = normalize(decodeURIComponent((pedido.url ?? '/').split('?')[0])).replace(/^([/\\])+/, '');
    const arquivo = join(pastaWeb, caminho);
    const existe = arquivo.startsWith(pastaWeb) && existsSync(arquivo) && statSync(arquivo).isFile();
    const final = existe ? arquivo : join(pastaWeb, 'index.html');
    resposta.writeHead(200, { 'Content-Type': tipos[extname(final)] ?? 'application/octet-stream' });
    resposta.end(readFileSync(final));
  });
  return new Promise((resolver) => {
    servidor.listen(0, '127.0.0.1', () => {
      const endereco = servidor.address();
      resolver({ servidor, url: `http://127.0.0.1:${endereco.port}` });
    });
  });
}

const exportacao = process.env.PROPSIGHT_URL === undefined ? await servirExportacao() : null;
const base = process.env.PROPSIGHT_URL ?? exportacao.url;

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
  dossies.find((d) => d.identidade.status === 'resolvido' && d.anuncio.operacao === 'aluguel') ??
    dossies.find((d) => d.identidade.status === 'resolvido'),
  'dossiê resolvido',
);
const compra = exigir(dossies.find((d) => d.anuncio.operacao === 'compra'), 'dossiê de compra');
const pendente = exigir(dossies.find((d) => d.identidade.status === 'pendente_confirmacao'), 'dossiê com confirmação');

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function abrir(pagina, caminho, espera = 2500) {
  await pagina.goto(`${base}${caminho}`, { waitUntil: 'networkidle' });
  await esperar(espera);
}

async function rolarAte(pagina, texto) {
  const alvo = pagina.getByText(texto, { exact: true }).first();
  await alvo.evaluate((elemento) => elemento.scrollIntoView({ block: 'start' }));
  await pagina.evaluate(() => {
    const rolaveis = [...document.querySelectorAll('div')].filter((el) => el.scrollHeight > el.clientHeight + 20 && getComputedStyle(el).overflowY !== 'visible');
    const principal = rolaveis.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    if (principal !== undefined) {
      principal.scrollTop = Math.max(principal.scrollTop - 72, 0);
    }
  });
  await esperar(900);
}

async function sessao(navegador, tema, roteiro) {
  const contexto = await navegador.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: tema === 'claro' ? 'light' : 'dark',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (erro) => erros.push(erro.message));
  const capturar = async (nome) => {
    await pagina.screenshot({ path: join(pasta, `${nome}-${tema}.png`) });
    console.log(`${nome}-${tema}.png`);
  };
  await roteiro(pagina, capturar);
  await contexto.close();
  if (erros.length > 0) {
    throw new Error(`Erros de página no tema ${tema}:\n${erros.join('\n')}`);
  }
}

async function fluxoCompleto(pagina, capturar) {
  await abrir(pagina, '/');
  await pagina.evaluate((texto) => navigator.clipboard.writeText(texto), `https://anuncio.exemplo/imovel/${resolvido.anuncio.codigo_anuncio}`);
  await abrir(pagina, '/', 3000);
  await capturar('01-entrada');

  await abrir(pagina, `/anuncio/${resolvido.dossie_id}`, 5200);
  await capturar('02-lendo-o-anuncio');

  await abrir(pagina, `/anuncio/${resolvido.dossie_id}/etapas`, 6800);
  await capturar('03-etapas');

  await abrir(pagina, `/dossie/${resolvido.dossie_id}`, 4200);
  await capturar('04-dossie-identidade');
  await rolarAte(pagina, 'Identidade');
  await capturar('04b-dossie-silhueta-do-predio');
  await rolarAte(pagina, 'Registros oficiais');
  await capturar('05-dossie-registros-oficiais');
  await rolarAte(pagina, 'O que o anúncio declara e o que não bate');
  await capturar('06-dossie-anuncio-e-custo');
  await rolarAte(pagina, 'O que ainda não sabemos');
  await capturar('07-dossie-desconhecidos');

  await abrir(pagina, `/dossie/${resolvido.dossie_id}/cartao/c_defesa_civil`, 2000);
  await capturar('08-camada-2-do-cartao');

  await abrir(pagina, `/dossie/${resolvido.dossie_id}/contestar/c_defesa_civil`, 1500);
  await pagina.getByLabel('Descreva o que está errado').fill('A rua alagou em junho e não aparece aqui.');
  await capturar('09-isso-esta-errado');

  await abrir(pagina, `/dossie/${resolvido.dossie_id}/roteiro`, 2000);
  const itens = pagina.getByRole('checkbox');
  if ((await itens.count()) > 1) {
    await itens.nth(0).click();
    await itens.nth(1).click();
  }
  await esperar(700);
  await capturar('10-roteiro-de-visita');

  await abrir(pagina, `/dossie/${resolvido.dossie_id}/mensagem`, 1800);
  await capturar('11-mensagem-ao-corretor');

  await abrir(pagina, `/dossie/${compra.dossie_id}${compra.identidade.status === 'resolvido' ? '' : '?edificio=A'}`, 4200);
  await capturar('12-compra-dossie');
  await rolarAte(pagina, 'O que ainda não sabemos');
  await capturar('13-compra-desconhecidos');

  await abrir(pagina, `/anuncio/${pendente.dossie_id}/confirmacao`, 3500);
  const segunda = pendente.identidade.candidatas[1] ?? pendente.identidade.candidatas[0];
  await pagina.getByRole('button', { name: `Escolher a candidata ${segunda.id} no mapa` }).click();
  await pagina.evaluate(() => {
    for (const el of document.querySelectorAll('div')) {
      if (el.scrollHeight > el.clientHeight + 20) {
        el.scrollTop = 0;
      }
    }
  });
  await esperar(900);
  await capturar('14-confirmacao-do-edificio');

  await abrir(pagina, `/dossie/${pendente.dossie_id}?edificio=${segunda.id}`, 4200);
  await capturar('15-dossie-confirmado-por-voce');
  await rolarAte(pagina, 'Identidade');
  await capturar('15b-andar-acima-do-cadastro');

  await abrir(pagina, `/dossie/${pendente.dossie_id}?modo=rua`, 4200);
  await capturar('16-modo-rua');
  await rolarAte(pagina, 'Registros oficiais');
  await capturar('17-modo-rua-registros');

  await abrir(pagina, '/dossies', 1800);
  const alternadores = pagina.getByText('mudar estado');
  await alternadores.nth(2).click();
  await pagina.getByRole('radio', { name: 'descartado' }).click();
  await pagina.getByPlaceholder('Ex.: condomínio acima do que posso pagar').fill('andar do anúncio não confere com o cadastro');
  await pagina.getByPlaceholder('Ex.: condomínio acima do que posso pagar').press('Tab');
  await esperar(600);
  await capturar('18-meus-dossies');

  await abrir(pagina, '/demonstracao?codigo=123456789', 1500);
  await capturar('19-link-fora-da-demonstracao');
}

async function fluxoEscuro(pagina, capturar) {
  await abrir(pagina, '/');
  await capturar('01-entrada');
  await abrir(pagina, `/dossie/${resolvido.dossie_id}`, 4200);
  await capturar('04-dossie-identidade');
  await rolarAte(pagina, 'Identidade');
  await capturar('04b-dossie-silhueta-do-predio');
  await rolarAte(pagina, 'O que o anúncio declara e o que não bate');
  await capturar('06-dossie-anuncio-e-custo');
  await abrir(pagina, `/anuncio/${pendente.dossie_id}/confirmacao`, 3500);
  const primeira = pendente.identidade.candidatas[0];
  await pagina.getByRole('button', { name: `Escolher a candidata ${primeira.id} no mapa` }).click();
  await esperar(900);
  await capturar('14-confirmacao-do-edificio');
  await abrir(pagina, `/dossie/${pendente.dossie_id}?modo=rua`, 4200);
  await capturar('16-modo-rua');
  await abrir(pagina, `/dossie/${resolvido.dossie_id}/mensagem`, 1800);
  await capturar('11-mensagem-ao-corretor');
}

mkdirSync(pasta, { recursive: true });
const navegador = await chromium.launch({ channel: canal, headless: true });
try {
  await sessao(navegador, 'claro', fluxoCompleto);
  await sessao(navegador, 'escuro', fluxoEscuro);
} finally {
  await navegador.close();
  exportacao?.servidor.close();
}
