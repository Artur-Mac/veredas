const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "1 obra" / "3 obras": o número com a palavra no singular ou no plural (sem "obra(s)" na tela). */
export const pl = (n: number, singular: string, plural: string): string => `${n} ${n === 1 ? singular : plural}`;

export function maiuscula(texto: string): string {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

export function formatarData(iso: string | null): string {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  if (!dia) return `${MESES[Number(mes) - 1]}/${ano}`;
  return `${dia}/${mes}/${ano}`;
}

export function formatarDiaMes(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export function hojeIso(agora: Date = new Date()): string {
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

export function formatarNumero(valor: number, casas = 0): string {
  const [inteira = "0", decimal] = Math.abs(valor).toFixed(casas).split(".");
  const comPontos = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sinal = valor < 0 && Number(Math.abs(valor).toFixed(casas)) !== 0 ? "-" : "";
  return `${sinal}${comPontos}${decimal ? `,${decimal}` : ""}`;
}

export function formatarReais(valor: number): string {
  return `R$ ${formatarNumero(Math.round(valor))}`;
}

/**
 * Formato compacto legível sem truncamento ("R$ 536 mil", "R$ 1,2 milhão", "R$ 3.850")
 * para cabeçalhos estreitos, cartões salvos e matrizes comparativas.
 */
export function formatarReaisCompacto(valor: number): string {
  const sinal = valor < 0 ? "-" : "";
  const abs = Math.abs(Math.round(valor));
  if (abs < 10_000) return `${sinal}R$ ${formatarNumero(abs)}`;
  if (abs < 999_500) {
    const mil = Math.round(abs / 1000);
    return `${sinal}R$ ${formatarNumero(mil)} mil`;
  }
  const milhoes = Math.round(abs / 100_000) / 10;
  const textoMilhoes = Number.isInteger(milhoes)
    ? formatarNumero(milhoes, 0)
    : formatarNumero(milhoes, 1);
  const unidade = milhoes >= 2 ? "milhões" : "milhão";
  return `${sinal}R$ ${textoMilhoes} ${unidade}`;
}
/** Para simulações e tarifas, não esconder centavos que mudam o resultado. */
export function formatarCentavos(valor: number): string {
  if (!Number.isSafeInteger(valor)) throw new Error("Valor monetário fora da precisão segura.");
  return `R$ ${(valor / 100).toLocaleString("pt-BR", { minimumFractionDigits: valor % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${formatarNumero(Math.round(metros / 10) * 10)} m`;
  const km = Math.round(metros / 100) / 10;
  return `${formatarNumero(km, Number.isInteger(km) ? 0 : 1)} km`;
}
