# Recortes solares derivados

Dados públicos da Prefeitura da Cidade do Recife, Secretaria de Infraestrutura. Licença **Open Database License (ODbL)**, conforme o [catálogo oficial](https://dados.recife.pe.gov.br/dataset/area-urbana). A atribuição também aparece no painel de entorno do aplicativo.

Fontes publicadas em 02/03/2026:

- Edificações–Lotes: `76280b81-d3d3-4719-b686-8adb58e57b7f`.
- Edificações–Pavimentos: `319077bd-4ec7-4e06-8544-c36a5077b47a`.

Preparação reproduzível: `scripts/dados/preparar-sol-recife.py`. Arquivos brutos ficam fora do repositório, em `/tmp/vereda-sol-fontes`. O relatório `docs/produto/sol-nas-janelas-2026-10-27/evidencias/geometrias.json` registra fontes, hashes, rejeições e amostras de associação. A data de publicação não demonstra data de levantamento de cada feição.

Formato 1: cada volume é `[id, índiceDoLote, pavimentosOuNull, associaçãoValidada, anéis]`. As coordenadas são inteiros relativos a `origem`, divididos por `escala`. A resolução de aproximadamente 0,11 m é de representação, não precisão física do levantamento. Os contornos são de edificações, não dos lotes do índice residencial.

`associaçãoValidada` significa chave válida e compatibilidade espacial com cadastro/lote e contorno construído, sem ambiguidade entre os endereços indexados. Não é uma inspeção em campo. Anexos, construções em andamento e classes sem semântica suficiente conservam altura nula. Alturas dos demais volumes são cenários derivados de pavimentos; não foram medidas.

Cobertura preparada: Graças, Casa Forte, Espinheiro e Boa Viagem, com margem no entorno das áreas indexadas. O aplicativo usa apenas um recorte de até 300 m em torno do imóvel. A base é parcial, inclusive quanto à atualidade e à vegetação. Outros bairros continuam com direção e percurso solar, sem sombras personalizadas nesta versão.

Atualização (VE16): Madalena (VE07) e Torre (VE16) também têm recorte, gerados pelo mesmo preparador a partir das mesmas fontes locais; a lista de áreas vem de `scripts/dados/areas.json` pelo ciclo `scripts/dados/ciclo.mjs`.
