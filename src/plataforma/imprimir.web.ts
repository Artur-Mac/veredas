export async function imprimirResumo(html: string): Promise<void> {
  const janela = window.open("", "_blank");
  if (!janela) throw new Error("Permita abrir a janela de impressão ou copie o resumo.");
  janela.opener = null;
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
  for (const fonte of document.fonts) {
    // Alguns navegadores recusam compartilhar uma face vinculada à folha CSS.
    // A impressão continua com as fontes de reserva declaradas no documento.
    try { janela.document.fonts.add(fonte); } catch { /* Fonte de reserva. */ }
  }
  janela.focus();
  await janela.document.fonts.ready;
  if (!janela.closed) janela.print();
}
