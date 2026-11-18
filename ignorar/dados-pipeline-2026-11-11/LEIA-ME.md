# Pipeline de dados antigo (11/11/2026), arquivado em 18/11/2026

Primeiro pipeline exploratório do Vereda (`rodar-tudo.mjs`, scripts 01 a 13).
Arquivado porque o app não lê nada que ele produz: os dados publicados vêm de `scripts/dados/` para `src/dados/recife/`.
O plano de aplicação proíbe reaproveitar resultados dele como fato (classificação antiga de crime, contagens do GTFS
deslocadas, ruído do aeroporto vazio).

- `infra/`: scripts e o recado original. O cliente HTTP virou `scripts/dados/http.mjs`; `infra/scripts/http.mjs` só
  reexporta.
- `raw/osm-pois/` e `raw/temperatura/`: saídas brutas que só esse pipeline usava.

Apagados na mesma limpeza (estão no histórico do git): `docs/dados/processado/`, `docs/dados/raw/_cache/` (cache do
cliente HTTP), `docs/dados/raw/precos/fipezap-extracted/` (cópia descompactada do `.xlsx`, que ficou) e
`docs/dados/raw/ruido-aeroporto/` (cone com a pista uns 80 km ao sul do Recife; substituído por
`scripts/dados/pista-aeroporto-recife.mjs`). Outras fontes brutas do pipeline (`google-maps`, `imoveis`, `leiloes`,
`pesquisa-cientifica`, `seguranca`, `precos`) ficaram em `docs/dados/raw/` porque docs de execução e pareceres as citam.
