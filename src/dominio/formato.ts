const meses = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

function agruparMilhares(inteiro: number): string {
  return Math.trunc(Math.abs(inteiro))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function numero(valor: number, casas = 0): string {
  const sinal = valor < 0 ? '-' : '';
  const fixo = Math.abs(valor).toFixed(casas);
  const [inteiro, decimal] = fixo.split('.');
  const parteInteira = agruparMilhares(Number(inteiro));
  return decimal === undefined ? `${sinal}${parteInteira}` : `${sinal}${parteInteira},${decimal}`;
}

export function moeda(valor: number): string {
  const casas = Number.isInteger(valor) ? 0 : 2;
  return `R$ ${numero(valor, casas)}`;
}

export function faixaMoeda(minimo: number, maximo: number): string {
  if (Math.round(minimo) === Math.round(maximo)) {
    return moeda(Math.round(minimo));
  }
  return `${moeda(Math.round(minimo))} a ${moeda(Math.round(maximo))}`;
}

export function area(valor: number): string {
  const casas = Number.isInteger(valor) ? 0 : 1;
  return `${numero(valor, casas)} m²`;
}

export function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  if (ano === undefined || mes === undefined || dia === undefined) {
    throw new Error(`data inválida: ${iso}`);
  }
  return `${dia} ${meses[mes - 1]} ${ano}`;
}

export function dataReferencia(dataRef: string | null): string {
  if (dataRef === null) {
    return 'sem data de referência';
  }
  const [inicio, fim] = dataRef.split('/');
  if (inicio === undefined) {
    throw new Error(`data de referência inválida: ${dataRef}`);
  }
  if (fim === undefined) {
    return dataCurta(inicio);
  }
  const anoInicio = inicio.slice(0, 4);
  const anoFim = fim.slice(0, 4);
  return anoInicio === anoFim ? anoInicio : `${anoInicio}–${anoFim}`;
}

export function enderecoCurto(endereco: string): string {
  const semCidade = endereco.split(/,\s*Recife\b/i)[0] ?? endereco;
  return semCidade.replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
}

export function codigoEdificacao(dsqfl: string): string {
  return `${dsqfl.slice(0, 7)} ${dsqfl.slice(7)}`;
}

export function plural(quantidade: number, singular: string, pluralForma: string): string {
  return `${numero(quantidade)} ${quantidade === 1 ? singular : pluralForma}`;
}

export function ruaENumero(endereco: string): string {
  return enderecoCurto(endereco).split(',').slice(0, 2).map((parte) => parte.trim()).join(', ');
}
