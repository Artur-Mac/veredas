# Mock em HTML do Vereda

Mock clicável de [docs/ui-ux.md](../ui-ux.md), claro e escuro, sem build. Carrega os dossiês de `dossies/*.json` direto, por isso precisa de um servidor estático (o navegador bloqueia `fetch` em `file://`).

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Rode na raiz do repositório e abra `http://127.0.0.1:8765/docs/mock/`. As telas abrem pelas âncoras da seção 3.4, por exemplo `#/dossie/boa-viagem/mapa`.

| Pasta | Conteúdo |
| --- | --- |
| `app/` | CSS com os tokens da seção 2.6 e os módulos JS (dados, componentes, mapa, telas, rotas) |
| `app/icones.js` | Ícones Tabler de contorno usados no mock (licença MIT em `app/icones-LICENSE.txt`) |
| `fontes/` | As 5 instâncias estáticas da Archivo, do repositório oficial (licença OFL em `fontes/OFL.txt`) |

A barra ao lado do aparelho é do mock, não do app: tema (sistema, claro, escuro), "Mostrar o Final", estado forçado (padrão, carregando, contestado, em verificação), dossiê e a lista de telas.
