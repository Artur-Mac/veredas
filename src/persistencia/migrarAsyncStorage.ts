import { esquemaAnaliseV2, type AnaliseV2 } from "../dados/contratos";
import { esquemaOfferSnapshot } from "../nucleo/contratosCanonicos";
import type { CofreUsuarioLocal } from "./cofreUsuario";

/**
 * Migração idempotente e não destrutiva dos dados do AsyncStorage (`vereda-analises-*`, `vereda-perfil-domicilio-v1`)
 * para o `user_vault.db` SQLite. Mantém as chaves antigas intactas para rollback seguro.
 */

export const CHAVE_MIGRACAO_CONCLUIDA = "migracao_asyncstorage_v1";

export async function migrarAsyncStorageParaCofre(opts: {
  listarChaves: () => Promise<string[]>;
  lerJson: (chave: string) => Promise<unknown>;
  cofre: CofreUsuarioLocal;
}): Promise<{
  jaMigradoAntes: boolean;
  ofertasMigradas: number;
  perfisMigrados: number;
  ignoradosCorrompidos: number;
}> {
  const marca = opts.cofre.lerMeta(CHAVE_MIGRACAO_CONCLUIDA);
  if (marca) {
    return { jaMigradoAntes: true, ofertasMigradas: 0, perfisMigrados: 0, ignoradosCorrompidos: 0 };
  }

  const chaves = await opts.listarChaves();
  let ofertasMigradas = 0;
  let perfisMigrados = 0;
  let ignorados = 0;

  for (const ch of chaves) {
    if (!ch.startsWith("vereda-")) continue;

    let bruto: unknown = null;
    try {
      bruto = await opts.lerJson(ch);
    } catch {
      ignorados += 1;
      continue;
    }

    if (ch === "vereda-perfil-domicilio-v1" && bruto && typeof bruto === "object") {
      opts.cofre.gravarMeta("perfil_domicilio_json", JSON.stringify(bruto));
      perfisMigrados += 1;
      continue;
    }

    if (ch.startsWith("vereda-analises") || ch.startsWith("vereda-caderno")) {
      const lista = Array.isArray(bruto) ? bruto : bruto && typeof bruto === "object" ? [bruto] : [];
      for (const item of lista) {
        const parsed = esquemaAnaliseV2.safeParse(item);
        if (!parsed.success) {
          ignorados += 1;
          continue;
        }
        const a: AnaliseV2 = parsed.data;
        const offer = esquemaOfferSnapshot.parse({
          offer_id: a.id,
          share_url: a.url,
          captured_at: a.atualizadaEm.endsWith("Z") ? a.atualizadaEm : new Date(a.atualizadaEm).toISOString(),
          capture_method: "link_usuario",
          asking_price_brl: a.declarados.preco.valor,
          condo_fee_brl: a.declarados.condominio.valor,
          iptu_declared_brl: a.declarados.iptu.valor,
          area_declared_m2: a.declarados.area.valor,
          floor_declared: a.declarados.andar.valor,
          sun_declared: null,
          perceptual_img_hash: null,
          canonical_unit_id: a.vinculo.estado === "confirmado" ? a.vinculo.edificioId : null,
          epistemic_tag: "declarado",
        });
        opts.cofre.salvarOfertaSnapshot(offer, a);
        ofertasMigradas += 1;
      }
    }
  }

  opts.cofre.gravarMeta(
    CHAVE_MIGRACAO_CONCLUIDA,
    JSON.stringify({ migradoEm: new Date().toISOString(), ofertasMigradas, perfisMigrados, ignorados }),
  );

  return { jaMigradoAntes: false, ofertasMigradas, perfisMigrados, ignoradosCorrompidos: ignorados };
}
