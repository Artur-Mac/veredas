# Handoff: o que ficou pendente da unificação de 19/11/2026

Para a próxima sessão. Leia antes: `AGENTS.md` (raiz), `docs/aplicacao/unificacao-2026-11-19/README.md` (o que foi feito e as decisões) e este arquivo.

## Estado

- PR #6 (`integracao/2026-11-19` → `main`): https://github.com/Artur-Mac/veredas/pull/6. Junta PR #4, segurança e aeroporto, mapa-base (PR #5) e a frente visual.
- Portões na última medição: `npx tsc --noEmit` 0 erros; `npm run lint` 0 erros; `npx jest` 120 suítes, 2.971 passando, 0 falhas; `node scripts/dados/publicar-camadas.cjs --conferir` sem problemas.
- Hub (projeto Vereda, `8c0a06e6-76eb-4673-a858-d2dc65d0ea81`) atualizado em 18/11/2026: dB estimado incluído, regra nova das notas, features da frente visual, impedimento ODbL, documento das decisões D1–D4 e A1–A13, tarefa "Pendências da unificação (PR #6)".
- Núcleo offline (SQLite, Drizzle, PMTiles, MapLibre): decisão do Samuel de 18/11/2026, **não será feito agora**. Está na branch `arquivo/nucleo-offline-2026-11-18`. Não reintroduzir.

## Como trabalhar

- Clone próprio fora do OneDrive (ex.: `C:\Users\ssamu\vereda-unificacao`, que já existe e está em dia). Nunca na pasta `OneDrive\Desktop\repos\veredas`.
- Branch nova a partir de `main` depois do merge do PR #6 (ou de `integracao/2026-11-19` se ainda não entrou).
- No Windows, o `.gitattributes` exige LF em `src/`, `tests/`, `scripts/`: num clone novo isso já vale; se `tests/camadas.test.ts` falhar, rode `node scripts/dados/publicar-camadas.cjs`.
- Web para fotos: `CI=1 npx expo start --web --port 8096`. Com `CI=1` o servidor **não recarrega** arquivo alterado: reinicie antes de fotografar. Roteiros: `docs/aplicacao/unificacao-2026-11-19/scripts/capturar-telas-novas.mjs` (telas novas a 390 px, com checagens de texto) e `docs/aplicacao/mapa-base-2026-11-18/scripts/capturar.mjs` (mapas).
- Regras que valem: todo dB na tela com "estimativa"; nota 0–10 só com dado do imóvel e ficha de método; "sem leitura" em vez de valor fixo; nenhum preço-alvo; não inventar fonte de lei; não afrouxar teste.

## Pendências, por prioridade

### 1. Andar e fachada sem estado único (defeito confirmado)

O mesmo dossiê pode mostrar duas notas de sossego sem a pessoa tocar em nada.

- Placar: `src/app/(abas)/dossie.tsx` usa `analise.declarados.andar.valor ?? 4` (`andarSimulado`) e a fachada inferida (`fachadaAtiva`).
- Simulador andar × fachada: `src/componentes/dossie-v1/SimuladorDaUnidade.tsx` (~46-47) começa em `ceil(max/2)` e sem fachada.
- Exemplo: prédio `12955-45` (Boa Viagem): placar "Muito tranquilo · ~50 dB(A) · 9,4/10", simulador ~60 dB(A) "6,9/10".
- Comparar (`src/app/(abas)/comparar.tsx`, função `montar`): usa a fachada sugerida no conforto e o grau cru da bússola no ruído; o dossiê usa a fachada inferida mais próxima da bússola para tudo. Exemplo: prédio `10227-187`, bússola 20°: "Quente à tarde" no dossiê, "Clima agradável" no Comparar.

Fazer: uma função pura e testada que escolhe o andar e a fachada ativos de uma análise (andar declarado; sem ele, suposição dita na tela; fachada escolhida pela pessoa, senão a da bússola aproximada à inferida, senão a sugerida), usada pelo dossiê, pelo simulador (valor inicial) e pelo Comparar, para conforto e ruído. O placar diz qual andar e fachada usou. Trocar o teste fraco "o mesmo prédio tem o mesmo selo de conforto no dossiê e no Comparar" (`tests/unificacao-notas.test.ts`) por um que monta as entradas das duas telas, com e sem bússola.

### 2. Avião só dentro do cone de aproximação (defeito confirmado)

`src/dados/ruido/estimativa.ts` (~49-55) e `src/dados/recife/aeroporto.ts` (~76-88): fora do cone a parcela do avião é zero. 322 prédios a até 1 km da pista ficam sem avião na nota (237 saem "Tranquilo" ou "Muito tranquilo"), e há um degrau na borda (prédio `64823-1080`: 0 fora, ~69 dB(A) 27 m para dentro).

Fazer: queda lateral contínua fora do cone onde a metodologia do Mapa Sossego dá base ("uns 9 dB a menos 1 km para o lado"); onde não dá (ao lado da pista), não inventar número: a tela e a ficha dizem que o aeroporto ao lado da pista não entra e que a nota é um piso. Atualizar `ruido-conferencia.md`.

### 3. Restos do ruído

- `src/dados/cidadao/tradutorCidadao.ts` (~281): a manchete "Rota de aviões" dispara com qualquer nível (ex.: 34 dB(A) de avião contra 52 do chão). Só quando o avião for a fonte que mais pesa.
- `src/componentes/visita-v1/MedidorDeRuido.tsx` (~94): ainda diz "Nível da rua em dB(A): Sem leitura publicada nesta área ainda". Mostrar a estimativa do prédio ou tirar.
- `src/componentes/visual/PlacarHeroi5Segundos.tsx`: a cor da célula de sossego ainda sai de `ruidoDormitorioDb > 45`; usar a palavra da nota.
- `src/nucleo/motores/acustica3d.ts:203`: `atendeReferenciaNoturnaNbr10151` passou a `nivelExternoCombinado <= 50` na última hora, sem teste próprio: confirmar que esse nível é o da noite e cobrir com teste (nenhum prédio com "dentro da referência" e "N dB a mais à noite" na mesma tela).
- Números de pontos diferentes (rua, janela, quarto) aparecem em abas diferentes sem dizer o ponto; a altura do 9º andar aparece como "~26 m" e "~29,4 m".
- Decisão do Samuel pendente: a classe `tertiary` ficou em 61 dB (inferido dos rótulos do site) e não nos 68 do pedido.

### 4. Verificação que faltou

- Segunda rodada de revisão independente (código e visual) e correção dos três piores de cada uma.
- Refazer as 144 fotos do mapa-base e as fotos das telas novas na branch final; confirmar zero erro de console.
- Nada rodou em celular físico nem com leitor de tela de verdade.

### 5. Achados menores da revisão

- "Economia de ITBI" do SFH medida contra 3% sobre tudo (`src/municipios/recife/motores/econometriaItbi.ts` ~335): provável exagero; a base certa é 1% no financiado + 3% no resto.
- `tests/leis-conferidas.test.ts` (~230-239) e `tests/ruido-telas.test.ts` (~120-124): asserção por regex sobre o código; trocar por render.
- Visuais: IPTU descrito de formas diferentes entre cartões; distâncias duplicadas e com unidades diferentes no Entorno; plurais "(s)"; alvos de toque de 25–30 px na triagem do Explorar; jargão (CNM, CNIB, SFH); Comparar chama os imóveis pelo bairro ("Torre leva vantagem" ao lado do Golden Tower); o Duelo conta o trajeto só até o Recife Antigo.
- A rotina de dois destinos tem piso de 12 min por trecho: imóveis muito perto do destino empatam.

### 6. Decisões do Samuel em aberto

- Normas pagas não conferidas, que ficaram na tela: NBR 15575-1 e 6118, NBR 15575-4, NBR 14653-2, EN 17037, Anexo 14 da ICAO (onde aparecem: fim de `leis-conferidas.md`).
- Água: a troca Compesa → AQUA Pernambuco está marcada para 23/11/2026; conferir depois do dia 23.
- Viés dos pesos das notas (tarefa no hub).
- Parecer ODbL (impedimento no hub).

### 7. Limpeza

- Fechar os PRs #4 e #5 como incorporados depois do merge do #6.
- Apagar as cópias `C:\Users\ssamu\vereda-mapa-base`, `vereda-colega`, `vereda-ensaio`, `vereda-unificacao-ruido`, `vereda-unificacao-mapa` e as branches locais `integracao/ruido-estimado`, `integracao/pendencias-mapa`, `integracao/leis-conferidas`.
- A pasta real do Samuel tem `AGENTS.md`, `README.md` e `.github/` sem commit na branch `feat/seguranca-aeroporto-limpeza`: o conteúdo já entrou no PR #6; lá basta descartar ou trocar de branch.

## Ao terminar cada item

Portões verdes, fotos olhadas, `docs/aplicacao/FEATURE-REGISTER.md` e o hub atualizados (mostrar ao Samuel antes de gravar), e a tarefa "Pendências da unificação (PR #6)" movida no quadro "Macro".
