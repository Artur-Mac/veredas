export async function baixarBackup(texto: string, nome?: string): Promise<string> {
  const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome ?? `vereda-caderno-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "Arquivo preparado. Confira o download. Mídia não está incluída.";
}
