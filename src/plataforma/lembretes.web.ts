import type { AnaliseV2 } from "../dados/contratos";
export async function reconciliarLembretes(_lista: readonly AnaliseV2[]): Promise<void> {}
export async function cancelarAvisosDoCaderno(): Promise<void> {}
export async function permitirLembretes(): Promise<string> { return "Este navegador mantém a anotação; não agenda avisos com a página fechada. Use o aplicativo nativo para notificações locais."; }
export function estadoLembretes(): string { return "Anotações locais. Avisos com navegador fechado não estão disponíveis nesta versão web."; }
