const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

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

export function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${formatarNumero(Math.round(metros / 10) * 10)} m`;
  const km = Math.round(metros / 100) / 10;
  return `${formatarNumero(km, Number.isInteger(km) ? 0 : 1)} km`;
}
