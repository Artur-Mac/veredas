# ODbL 1.0 nas bases que o app embute

Levantamento de 18/11/2026. Não é parecer jurídico. Licença: <https://opendatacommons.org/licenses/odbl/1-0/>.

## O que é ODbL no app

| Base embutida | Pasta publicada | Fontes ODbL | Script que a gera |
|---|---|---|---|
| Índice de prédios | `src/dados/recife/indice-municipal/<versão>/` (versão em `publicacaoGerada.ts`) | Prefeitura do Recife: IPTU, ITBI, Licenciamento urbanístico, Lotes, Bairros, e as bases da rua (`meta.json`) | `scripts/dados/construir-indice-recife.mjs`, `scripts/dados/ativar-indice-municipal.mjs` |
| Mapa-base | `src/dados/recife/mapa-base/<versão>/` (versão em `mapaBaseGerado.ts`) | Prefeitura do Recife: conjuntos "Área urbana" (Bairros, Quadras, Lotes, Trechos de Logradouros, Recursos Hídricos, Pontes) e "Parques e Praças" | `scripts/dados/construir-mapa-base.mjs` (fontes em `scripts/dados/mapa-base/fontes.mjs`) |
| Ruído estimado | `src/dados/recife/ruido/<versão>/` (versão em `ruidoGerado.ts`) | OpenStreetMap (vias, extrato Geofabrik) e Prefeitura do Recife (LUSE e prédios do índice) | `scripts/dados/ruido/rodar-ruido.mjs` (núcleo em `scripts/dados/ruido/nucleo.ts`) |

O mapa-base **não usa OpenStreetMap**: as sete camadas vêm do portal dados.recife.pe.gov.br (`RECURSOS` em `scripts/dados/mapa-base/fontes.mjs`). Por isso o crédito do mapa cita só a Prefeitura. O OSM entra nas vias do ruído, na pista do aeroporto e na rede de ruas a pé.

IBGE, SDS-PE, ESIG e Landsat ficaram fora deste levantamento.

## Obrigações e onde estão cumpridas

1. **Atribuição (4.2, 4.3).** Textos em `src/dados/licencaOdbl.ts`.
   - Mapas: `CreditoDaBase` (`src/componentes/mapa/FundoDoMapa.tsx`) diz "Contém dados da Prefeitura do Recife (ODbL)".
   - Ficha do ruído (`src/dados/ruido/leitura.ts`): Prefeitura e "© colaboradores do OpenStreetMap", com o endereço da licença.
   - "Sobre os dados" (`src/app/sobre-os-dados.tsx`): as duas atribuições, o link "Ler a licença ODbL 1.0" e a oferta das bases derivadas.
2. **Share-alike e oferta da base derivada (4.4, 4.6).** `node scripts/dados/exportar-bases-odbl.mjs` monta em `.cache/bases-odbl/` (fora do git; `--saida <pasta>` muda o destino) as três bases publicadas, cada uma com um `LEIA-ME.txt` (fonte, data, licença, script) e um `SHA256SUMS.txt` geral. O "arquivo das alterações" (4.6) são os scripts da tabela acima, que refazem cada base a partir das fontes.
3. **Sem restrição ao reuso (4.7).** Em 18/11/2026 o app não tem termos de uso nem cláusula que proíba reuso dos dados, e o repositório não tem arquivo de licença que restrinja as bases. Se termos de uso forem escritos, eles precisam excluir as bases ODbL e não pôr DRM nelas (ou oferecer a cópia sem restrição, 4.7).

## Onde as bases serão oferecidas: decisão do Samuel

Ainda não decidido. Sugestão: anexar o pacote (zipado) a uma release do GitHub do repositório a cada versão nova das camadas. Ao decidir, preencha `LOCAL_DAS_BASES_DERIVADAS` em `src/dados/licencaOdbl.ts` com o endereço real; enquanto for `null`, "Sobre os dados" diz que o local está a definir.
