import AsyncStorage from "@react-native-async-storage/async-storage";

export async function lerJson(chave: string): Promise<unknown> {
  const texto = await AsyncStorage.getItem(chave);
  if (texto === null) return null;
  return JSON.parse(texto) as unknown;
}

export async function gravarJson(chave: string, valor: unknown): Promise<void> {
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}

export async function apagar(chave: string): Promise<void> {
  await AsyncStorage.removeItem(chave);
}

// ——— Leitura que nunca confunde "não consegui ler" com "está vazio" ————————————————————————————————————————————
// `lerJson` serve para o que pode ser refeito (preferências, aparelho). O caderno do usuário não: se a leitura falha, quem
// grava depois por cima apaga o que estava lá. Estas funções devolvem o motivo da falha em vez de lançar, e guardam o
// texto original antes de qualquer decisão.

export type LeituraSegura =
  /** A chave não existe (primeiro uso). Gravar nela não apaga nada. */
  | { estado: "ausente" }
  /** Leu e o texto é um JSON válido. `texto` é o original, byte a byte. */
  | { estado: "lido"; valor: unknown; texto: string }
  /**
   * Não leu. `armazenamento`: o próprio armazenamento falhou (sem texto para guardar). `json_invalido`: o texto veio,
   * mas não é JSON (o `texto` segue aqui para ser copiado). Quem recebe isto não pode gravar nesta chave.
   */
  | { estado: "ilegivel"; motivo: "armazenamento" | "json_invalido"; texto: string | null };

export async function lerSeguro(chave: string): Promise<LeituraSegura> {
  let texto: string | null;
  try {
    texto = await AsyncStorage.getItem(chave);
  } catch {
    return { estado: "ilegivel", motivo: "armazenamento", texto: null };
  }
  if (texto === null) return { estado: "ausente" };
  try {
    return { estado: "lido", valor: JSON.parse(texto) as unknown, texto };
  } catch {
    return { estado: "ilegivel", motivo: "json_invalido", texto };
  }
}

/** "2026-10-20T15:30:00.000Z" vira "2026-10-20T15-30-00-000Z": sem ":" nem "." numa chave de armazenamento. */
function carimboDaChave(agora: Date): string {
  return agora.toISOString().replace(/[:.]/g, "-");
}

/**
 * Copia o texto bruto para `<prefixo>-<data>` (com sufixo "-2", "-3"… se a chave já existe; uma cópia nunca
 * sobrescreve outra). Se já existe uma cópia com exatamente este texto, devolve a chave dela em vez de empilhar outra
 * a cada abertura do app. Devolve `null` se não foi possível guardar: quem chama não deve afirmar à pessoa que existe
 * cópia nesse caso.
 */
export async function guardarCopiaBruta(prefixo: string, texto: string, agora: Date): Promise<string | null> {
  const base = `${prefixo}-${carimboDaChave(agora)}`;
  try {
    for (const existente of await AsyncStorage.getAllKeys()) {
      if (!existente.startsWith(`${prefixo}-`)) continue;
      if ((await AsyncStorage.getItem(existente)) === texto) return existente;
    }
    for (let n = 1; n <= 20; n += 1) {
      const chave = n === 1 ? base : `${base}-${n}`;
      if ((await AsyncStorage.getItem(chave)) !== null) continue;
      await AsyncStorage.setItem(chave, texto);
      return chave;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Acrescenta `itens` (intactos, como vieram) à lista guardada em `chave`. Nunca sobrescreve o que já está lá:
 * - um item idêntico a outro já guardado não entra de novo (a mesma carga repetida a cada abertura não infla a lista);
 * - se o conteúdo atual da chave não é uma lista legível, ele é copiado para `<chave>-ilegivel-<data>` ANTES de a lista
 *   nova ser gravada; se nem essa cópia sai, lança e nada é gravado.
 * Lança se qualquer leitura ou gravação falhar: o chamador trata como "os itens não estão a salvo".
 */
export async function acrescentarNaQuarentena(chave: string, itens: readonly unknown[], agora: Date): Promise<void> {
  if (itens.length === 0) return;
  const atual = await AsyncStorage.getItem(chave);
  let guardados: unknown[] = [];
  if (atual !== null) {
    let lido: unknown;
    try {
      lido = JSON.parse(atual) as unknown;
    } catch {
      lido = undefined;
    }
    if (Array.isArray(lido)) {
      guardados = lido;
    } else {
      const copia = await guardarCopiaBruta(`${chave}-ilegivel`, atual, agora);
      if (copia === null) throw new Error("A área de itens guardados à parte está ilegível e não pôde ser copiada.");
    }
  }
  const vistos = new Set(guardados.map((g) => JSON.stringify(g)));
  const novos: unknown[] = [];
  for (const item of itens) {
    const assinatura = JSON.stringify(item);
    if (vistos.has(assinatura)) continue;
    vistos.add(assinatura);
    novos.push(item);
  }
  if (novos.length === 0) return;
  await AsyncStorage.setItem(chave, JSON.stringify([...guardados, ...novos]));
}
