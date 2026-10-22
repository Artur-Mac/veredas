/** Uma tabela vazia tem zero páginas, não uma página com offset indefinido. */
export function planejarPaginas(total, limite, primeirosRegistros) {
  if (!Number.isInteger(total) || total < 0 || !Number.isInteger(limite) || limite <= 0 || !Array.isArray(primeirosRegistros))
    throw new Error("Paginação sem total, limite ou primeira página válidos.");
  if (primeirosRegistros.length !== Math.min(total, limite)) throw new Error("Primeira página incompleta ou incompatível com o total.");
  const offsets = [];
  for (let off = 0; off < total; off += limite) offsets.push(off);
  const paginas = new Array(offsets.length);
  if (total > 0) paginas[0] = primeirosRegistros;
  return { offsets, paginas };
}
