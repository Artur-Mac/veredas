export async function podeLerAreaDeTransferencia(): Promise<boolean> {
  if (typeof navigator === 'undefined' || navigator.permissions === undefined || navigator.clipboard === undefined) {
    return false;
  }
  try {
    const estado = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
    return estado.state === 'granted';
  } catch (erro: unknown) {
    if (erro instanceof TypeError) {
      return false;
    }
    throw erro;
  }
}
