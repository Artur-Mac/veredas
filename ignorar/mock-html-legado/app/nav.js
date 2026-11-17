const pilha = [];
let substituindo = false;

export function ir(hash, substituir = false) {
  if (substituir) {
    substituindo = true;
    location.replace(hash);
  } else {
    location.hash = hash;
  }
}

export function registrarVisita(hash) {
  if (substituindo) {
    substituindo = false;
    pilha[Math.max(pilha.length - 1, 0)] = hash;
    return;
  }
  if (pilha.length > 1 && pilha[pilha.length - 2] === hash) {
    pilha.pop();
    return;
  }
  if (pilha[pilha.length - 1] !== hash) pilha.push(hash);
}

export function voltarPara(hash) {
  if (pilha.length > 1 && pilha[pilha.length - 2] === hash) history.back();
  else ir(hash, true);
}

export function voltar(paiPadrao) {
  if (pilha.length > 1) history.back();
  else ir(paiPadrao, true);
}
