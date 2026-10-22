import type { AnaliseV2 } from "../../dados/contratos";
import type { RevisaoDaImportacao } from "../../dados/backup";
export function BackupComArquivos(_props: { lista: AnaliseV2[]; importar: (r: RevisaoDaImportacao) => Promise<void>; disponivel: boolean }) {
  // Exportação binária nativa exige validação própria de compartilhamento/restauração.
  return null;
}
