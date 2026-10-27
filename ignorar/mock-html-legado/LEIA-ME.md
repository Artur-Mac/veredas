# Mock em HTML do Vereda

Mock clicável de [docs/ui-ux.md](../ui-ux.md), claro e escuro, sem build. Carrega os dossiês de `dossies/*.json` direto, por isso precisa de um servidor estático (o navegador bloqueia `fetch` em `file://`).

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Rode na raiz do repositório e abra `http://127.0.0.1:8765/docs/mock/`. As telas abrem pelas âncoras da seção 3.4, por exemplo `#/dossie/boa-viagem/mapa` ou `#/creditos`.

| Pasta | Conteúdo |
| --- | --- |
| `app/` | CSS com os tokens da seção 2.6 e os módulos JS (dados, componentes, mapa, telas, rotas) |
| `dossies/` e `creditos.json` | Os cinco dossiês e o extrato de créditos (seção 8) |
| `app/icones.js` | Ícones Tabler de contorno usados no mock (licença MIT em `app/icones-LICENSE.txt`) |
| `fontes/` | As 5 instâncias estáticas da Archivo, do repositório oficial (licença OFL em `fontes/OFL.txt`) |

A barra ao lado do aparelho é do mock, não do app: tema (sistema, claro, escuro), "Mostrar o Final", estado forçado (padrão, carregando, contestado, em verificação), dossiê e a lista de telas.

## Referência de fotos no app Expo

O arquivo `anuncios/quintoandar-895773394.json` registra o anúncio fornecido pelo usuário, consultado em 17/10/2026: endereço, valores e URLs públicas de dez fotos do QuintoAndar. É uma captura dos campos do anúncio nessa data; não há leitura automática de outros links nem cópia local das imagens.

No app Expo, cole o link desse imóvel na Home ou abra **Controles do mock → Fotos do anúncio → Ver exemplo com fotos**. A prévia permite deslizar, usar anterior/próxima e ampliar as imagens. Como o imóvel fica no Brás, em São Paulo, a prévia informa a cobertura atual de Recife e não cria um dossiê com dados municipais para ele. Os cinco dossiês continuam com o mapa quando não possuem fotos.
