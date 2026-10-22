import { cadernoVazio, esquemaCaderno } from "./caderno";
import { esquemaAnaliseV2, type AnaliseV2 } from "./contratos";

export function prepararOutraVisita(a: AnaliseV2, em: string, id: string, rotulosDasPerguntas?: Record<string, string>): AnaliseV2 {
  const c = a.caderno ?? cadernoVazio();
  if (c.visitas.some(v => v.id === id)) return a;
  const visitaAnterior = { ...a.visita, id, arquivadaEm: em, ...(rotulosDasPerguntas ? { rotulosDasPerguntas } : {}) };
  const caderno = esquemaCaderno.parse({ ...c, visitas: [...c.visitas, visitaAnterior] });
  return esquemaAnaliseV2.parse({ ...a, atualizadaEm: em, caderno,
    visita: { ...a.visita, verificadas: [], respostas: {}, notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null } });
}
