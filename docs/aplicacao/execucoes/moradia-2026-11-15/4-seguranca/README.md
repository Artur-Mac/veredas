# 4. Criminalidade: teste de um indicador direto

**Situação: depende de resposta externa.** Nenhuma fonte pública dá "Roubo a Transeunte" por bairro do Recife. O pedido à SDS-PE está pronto para o titular enviar: [pedido-sds-roubo-a-transeunte.md](pedido-sds-roubo-a-transeunte.md). Nada mudou no app.

## O que foi verificado em 15/11/2026

| Fonte | Unidade e cobertura | Licença | Resultado |
|---|---|---|---|
| SDS-PE/GGACE, painel "Estatísticas Criminais de Pernambuco" (Power BI) | Município e região; CVP desde jan/2014; consolidado até out/2026 (extração do Infopol em 05/11/2026) | Não declarada (o site só aponta para as páginas de LAI e LGPD) | "Roubo a Transeunte" é uma natureza do grupo CVP. **Não há bairro nem AIS.** Recife: 10.230 roubos a transeunte em 2025 e 4.390 de jan. a out. de 2026 (CVP total: 16.733 e 7.957). Capturas salvas. |
| Microdados de CVP (xlsx) | Contagens diárias por município e região, sem natureza | Não declarada | Recife 2025 = 16.733. O PDF anual dá 16.752 (diferença de 0,1%). |
| crimebrasil.com.br (arquivo antigo do projeto) | Diz usar boletins da SDS por bairro, de 2020 a set/2026 | Não declarada | **Não rastreável** a um arquivo público da SDS: o painel não tem bairro. Não usar. |
| Fogo Cruzado | Grande Recife desde abr/2018; **disparos de arma de fogo** | API com autorização prévia; termos não vistos | Não é indicador de roubo. Os campos de vítima são dados pessoais. Fica para depois da autorização, só com contagens. |

Arquivos e manifesto: [seguranca-2026-11-15](../../../../dados/raw/seguranca-2026-11-15/).

## O que já está no app e continua

"Voltando à noite" (VE08) mostra fatos da rota, sem linguagem de segurança (um teste garante): iluminação instalada, pedidos de "lâmpada apagada" no 156, travessias estimadas, a parada com ônibus entre 22h e 2h e atropelamentos registrados pela CTTU por rua.

## Teste pronto para quando a série chegar

Está descrito na minuta:
- a soma por bairro tem de fechar com o total municipal (±0,5%);
- o vínculo é exato aos 94 bairros oficiais, e nome sem correspondência é contado, nunca aproximado;
- só meses consolidados;
- célula suprimida aparece como "não divulgado", nunca como zero;
- a frase mostra contagem e período juntos, em linguagem de ocorrências registradas.
