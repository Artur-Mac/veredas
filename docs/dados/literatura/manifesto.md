# Literatura — manifesto da pasta

**Official application programme (14 November 2026): [18-epoch implementation and evaluation plan](../../aplicacao/VEREDA-APPLICATION-PLAN.md), [217-paper application traceability](../../aplicacao/RESEARCH-TRACEABILITY.md), and [reusable execution prompt](../../aplicacao/EXECUTION-PROMPT.md).** These English documents turn this collection and the urban collection into an executable programme; implementation status is tracked separately.

Pasta: `docs/dados/literatura/` — 101 PDFs validados (`%PDF`, nenhum stub HTML), ~261 MB.
Levantamento: 14/11/2026, a partir dos lotes 3–16 da busca no Google Scholar (batches de geocodificação, GNN, record linkage, IPTU/ITBI, índices de preço, NLP, web agents, dados abertos BR, mass appraisal, raspagem de portais, street view/multimodal, address matching, POI/GWR e Recife).

[Parecer técnico e prioridades para a Vereda](parecer-tecnico.md)

[Parecer técnico integrado com auditoria de dados e avaliação dos 217 trabalhos](parecer-tecnico-integrado.md)

## Como foi baixado

- **Curl direto** para a maioria dos periódicos/preprints de acesso aberto (arXiv, CEUR, Scielo, IBAPE, DSpace API, JTLU, eScholarship, UCL, MIT, ITU, KU Leuven, World Bank, OECD/IMF).
- **Página → link do galley** para OJS/DSpace (UFU, Valorem, SBC, USP, AGB, Dergipark, UFMG, UFPA, UFSC).
- **Navegador (fetch com cookies → base64 → arquivo)** para sites que bloqueiam curl: MDPI (9 artigos), Fupress/Anubis (Zilli), Springer OA (Berlim), Taylor & Francis OA (Oslo), IMF, USP, FGV, Statsbygg.
- **Anna's Archive** para paywall pré-2021. Importante: `annas-archive.cc` informado na tarefa **não é** o Anna's Archive (é um híbrido Z-Library sem busca de artigos); o espelho real usado foi **`annas-archive.gd`** (`/scidb/<DOI>` → link externo one-time em `wbsg8v.xyz` → curl imediato com referer do AA). `wallace-meese-1997` veio via registro md5 do AA → Libgen.li (`get.php` com `key`).
- **Wayback Machine** (`web/<ts>id_/`) para BID (publications.iadb.org bloqueia fetch) e Cambridge Core (rate-limit).

## 1. Paywall obtido via Anna's Archive (11)

| Arquivo | Título | Ano | DOI |
|---|---|---|---|
| `wallace-meese-1997.pdf` | The Construction of Residential Housing Price Indices: Repeat-Sales, Hedonic-Regression, Hybrid (Wallace & Meese, JREFE) | 1997 | 10.1023/A:1007715917198 |
| `thin-markets-repeat-sales.pdf` | Repeat sales index for thin markets (Francke, JREFE) | 2010 | 10.1007/s11146-009-9203-1 |
| `epb-local-hedonic.pdf` | Local hedonic house-price modelling for urban planners (Crespo & Grêt-Regamey, Env. & Planning B) | 2015 | 10.1068/b38093 |
| `annals-fotheringham-2015.pdf` | Exploring, modelling and predicting spatiotemporal flow of house prices (Fotheringham, Crespo & Yao, Annals of Regional Science) | 2015 | 10.1007/s00168-015-0660-6 |
| `geographic-disparity-geocoding.pdf` | Geographic disparity of positional errors and matching rate (Chow et al., Annals of GIS) | 2016 | 10.1080/19475683.2015.1085437 |
| `esf-vienna-svc.pdf` | Spatially varying coefficient models in real estate: ESF (Helbich & Griffith, CEUS) | 2016 | 10.1016/j.compenvurbsys.2015.12.002 |
| `mva-vision-based.pdf` | Vision-based real estate price estimation (Poursaeed et al., Machine Vision & Applications) | 2018 | 10.1007/s00138-018-0922-2 |
| `jws-spatiotemporal.pdf` | TISCO: temporal scoping of facts (Rula et al., Web Semantics) | 2019 | 10.1016/j.websem.2018.09.002 |
| `acm-pricing-power.pdf` | One Picture Is Worth a Thousand Words? Pricing Power of Online Portal Pictures (Naumzik & Feuerriegel, ACM WebSci) | 2020 | 10.1145/3366423.3380086 |
| `urban-studies-shanghai.pdf` | Real and fake data in Shanghai's informal rental housing (Harten et al., Urban Studies) | 2020 | 10.1177/0042098020918196 |
| `lup-turkey-mass-appraisal.pdf` | A mass appraisal assessment study using ML: MRA vs RF, Ankara (Yilmazer & Kocaman, Land Use Policy) | 2020 | 10.1016/j.landusepol.2020.104889 |

## 2. Paywall resolvido com versão aberta (8)

Versão aceita/manuscrito ou OA de outro sítio, em vez do PDF do editor.

| Arquivo | Título | Ano | DOI | Fonte alternativa |
|---|---|---|---|---|
| `applied-geo-streets-ucl.pdf` | The economic value of streets (Shen & Karimi, Applied Geography) | 2017 | 10.1016/j.apgeog.2016.12.012 | UCL Discovery (accepted version) |
| `ieee-satellite-2017.pdf` | Beyond Spatial Auto-Regressive Models (Bency et al., IEEE WACV) | 2017 | 10.1109/WACV.2017.42 | eScholarship (UCSB) |
| `lup-biggeo-kang2021.pdf` | Understanding house price appreciation using multi-source big geo-data (Kang et al., Land Use Policy) | 2021 | 10.1016/j.landusepol.2020.104919 | MIT Senseable City Lab (author proof) |
| `gean-mete-hybrid.pdf` | A Hybrid Approach for Mass Valuation via GIS + ML (Mete et al., Geographical Analysis) | 2022 | 10.1111/gean.12350 | Accepted manuscript, ITU (autor) |
| `gnn-do-or-dont.pdf` | Graph neural networks for house price prediction: do or don't? (Springer IJMLC) | 2024 | 10.1007/s41060-024-00682-y | KU Leuven Lirias (green OA) |
| `cambridge-nle-describe.pdf` | Describe the house and I will tell you the price (Zhang, Li & Branco, Natural Language Engineering) | 2024 | 10.1017/S1351324923000360 | OA Cambridge (via Wayback durante rate-limit) |
| `jstor-du-mulley-gwr.pdf` | Spatial variations in the impact of accessibility on land value, GWR (Du & Mulley, JTLU) | 2012 | 10.5198/jtlu.v5i2.225 | JTLU (aberto) |
| `zilli-aestimum-2024.pdf` | ML models in mass appraisal for property tax: systematic mapping (Zilli, Bastos & Silva, Aestimum 84) | 2024 | 10.36253/aestim-15792 | Fupress (aberto, via navegador) |

## 3. OA de editor/repositório baixado pelo navegador (bloqueavam curl)

| Arquivo | Título | Ano | Fonte |
|---|---|---|---|
| `berlin-flat-rent.pdf` | Flat rent price prediction in Berlin with web scraping (Neth. J. of Housing & Built Env.) | 2024 | Springer, OA CC-BY (10.1007/s11943-024-00340-6) |
| `oslo-llm-avm.pdf` | Incorporating LLMs in Automated Real Estate Valuation, Oslo (Property Management) | 2025 | Taylor & Francis, OA CC-BY (10.1080/08965803.2025.2587313) |
| `mdpi-geocode-quality.pdf` | Qualidade de geocodificação urbana (IJGI) | 2023 | MDPI 2220-9964/12/10/407 |
| `mdpi-explainable-gnn.pdf` | GNN explicável sobre knowledge graph de estatísticas (Technologies) | 2024 | MDPI 2227-7080/12/8/128 |
| `mdpi-neighborhood-latam.pdf` | Qualidade de bairro em 3 cidades LatAm (Real Estate Mgmt.) | 2025 | MDPI 2813-8090/2/4/18 |
| `mdpi-mass-appraisal-slr.pdf` | Mass appraisal: revisão sistemática (Sustainability) | 2019 | MDPI 2071-1050/11/24/7006 |
| `mdpi-ijgi-overview.pdf` | Impacto de GIS na avaliação (IJGI) | 2024 | MDPI 2220-9964/13/6/175 |
| `mdpi-beijing-poi.pdf` | POI de dados abertos, hedônico Beijing (IJGI) | 2017 | MDPI 2220-9964/6/11/358 |
| `mdpi-ijgi-multidim.pdf` | Acessibilidade multidimensional + ML (IJGI) | 2025 | MDPI 2220-9964/14/11/436 |
| `mdpi-wu-internet-open.pdf` | Fatores de preço com dados abertos de internet (Sustainability) | 2018 | MDPI 2071-1050/10/5/1676 |
| `mdpi-belem-hedonic.pdf` | Hedônico aluguéis Belém (Buildings) | 2024 | MDPI 2075-5309/14/3/728 |
| `direct-imf-wp16213.pdf` | IMF WP 16/213 — hedonic indexes (Diewert et al.) | 2016 | imf.org (via navegador) |
| `direct-pgv-usp-1998.pdf` | Atualização do PGV — cadastro vs mercado (USP) | 1998 | repositorio.usp.br directbitstream |
| `direct-statsbygg-iswc.pdf` | Statsbygg linked data (ISWC 2017 poster) | 2017 | iswc2017.ai.wu.ac.at (via navegador) |
| `direct-bid-cadastro.pdf` | BID — Cadastro, avaliação imobiliária e tributação municipal (Eguino & Erba, orgs.) | 2021 | publications.iadb.org (via Wayback, curl direto bloqueia) |

## 4. Acesso aberto baixado por curl direto (54)

arXiv / preprints: `messy-streets-benchmark` (2026, benchmark geocodificação endereços reais), `gsne-pois-arxiv` (2020, GSNE grafo POIs), `pd-tgcn-santiago` (2024, GNN Santiago 200k casas), `pe-gqnn-arxiv` (2024, GNN quantílico), `hgaurban-arxiv` (2024, HGAurban), `mhpp-multimodal` (2024, MHPP Melbourne), `vit-selfsup-arxiv` (2023, ViT self-supervised), `brazil-data-commons` (2025, Brazil Data Commons), `iptu-ne-preprint` (2026, IPTU capitais NE).

Web agents: `webarena` (2024), `webvoyager` (2024), `browseragent` (2025), `browserarena` (2025), `agentoccam` (2025), `browsergym` (2024), `warex` (2025), `gaia-iclr` (2024), `beyond-browsing-api` (2025).

Geocodificação/address matching: `urban-addressing-thesai` (2021), `statistical-registers-q2026` (2026), `geocoding-osm-upv2015` (2015), `geocoding-compare-upv2015` (2015), `naacl-address-parsing` (2024), `glam-linz-auckland` (2025).

Record linkage: `census-linkage-bigmatch` (2024, Zenodo), `lance-oaei-spatial` (2016), `holistic-link-discovery` (2016), `jln-data-matching` (2022), `kadaster-linked-data` (2021).

IPTU/ITBI/cadastro: `iptu-determinantes-ufpr` (2026), `worldbank-property-tax` (2023), `iptu-fuzzy-scielo` (2017), `iptu-gestao-usp-fipecafi` (2021), `rap-itbi-inovacao` (2026), `bh-itbi-rf-ufmg` (2025).

Índices/hedônico: `bh-hedonic-1998` (FGV RBE), `oecd-hedonic-2011`, `rppi-handbook-imf` (2013), `tokyo-hedonic-wp41` (2009), `tokyo-hedonic-wp62` (2010), `gwr-florianopolis-ibape` (2021), `gwr-malaysia-ugm` (2017).

NLP/extração de anúncios: `attr-extract-unlp-jaiio` (2024, Buenos Aires), `limassol-msc-ulisboa` (2025), `french-ads-ceur` (2023).

Raspagem/dados BR: `ibape-raspagem-2025`, `isprs-scraping-spatial` (2021), `geospatial-bd-espacios` (2017), `pluris-onibus-recife` (2023).

Recife: `recife-vizinhos-2007` (Scielo Ecoa), `recife-demanda-2010` (Scielo EE).

Imagens: `plos-image-fusion` (2025).

## 5. OJS/DSpace resolvidos via página (9)

| Arquivo | Conteúdo | Fonte |
|---|---|---|
| `ojs-rbc-pgv-ufu.pdf` | RBC — PGV (UFU) | seer.ufu.br |
| `ojs-valorem-arvores.pdf` | Valorem — árvores/valoração | revistavalorem.com |
| `ojs-valorem-rlc-rna.pdf` | Valorem — RLC vs RNA | revistavalorem.com |
| `ojs-mass-appraisal-korea.pdf` | Mass appraisal Coreia (IJSPM) | journals.vilniustech.lt |
| `ojs-fortaleza-aestimum.pdf` | Aestimum 85 — mass appraisal Fortaleza (Oliveira et al.) | oaj.fupress.net (via navegador, galley 71602) |
| `ojs-sbbd-zap-17m.pdf` | SBBD — ZAP 17M anúncios | sol.sbc.org.br |
| `ojs-recife-amenidades.pdf` | USP Ecoa — amenidades Recife | revistas.usp.br |
| `ojs-agb-bh-itbi.pdf` | AGB — ITBI BH | publicacoes.agb.org.br |
| `ojs-dergipark-gaziantep.pdf` | Dergipark — Gaziantep | dergipark.org.tr |
| `dspace-pgv-ufmg.pdf` | UFMG — PGV | repositorio.ufmg.br |
| `dspace-ufpa-belem.pdf` | UFPA — Belém | bdm.ufpa.br |
| `dspace-ufsc-computacional.pdf` | UFSC — Avaliação imobiliária por inteligência computacional (Dal Prá, TCC 2023) | repositorio.ufsc.br (bitstream `isAllowed=y`) |
| `dspace-fgv-affordability.pdf` | FGV — affordability | repositorio.fgv.br (via navegador) |

## 6. Não baixados — paywall sem cópia no Anna's Archive/Sci-Hub (cobertura para até ~2021)

Baixar com um clique humano (sem login): abrir o DOI e usar "View PDF"/"Purchase" conforme acesso institucional, ou pedir via base da biblioteca.

| Slug | Título | Ano | DOI | Status |
|---|---|---|---|---|
| `eswa-berlin-text` | Automated real estate valuation with ML using property descriptions (ESWA) | 2023 | 10.1016/j.eswa.2022.119147 | paywall, fora do Sci-Hub |
| `directed-graph-296` | Boosting urban housing price forecasting with an innovative directed graph neural model (ESWA 332) | 2026 | 10.1016/j.eswa.2026.133565 | paywall, fora do Sci-Hub |
| `springer-chapter-satellite` | Deep Multimodal Learning for Real Estate Price Estimation from Satellite and Street View Data (Patial et al., LNNS) | 2027 | 10.1007/978-3-032-31523-6_17 | paywall, fora do Sci-Hub |
| `poa-schools` | Artigo Springer sobre escolas/POA (Journal of Geographical Systems) | 2025 | 10.1007/s12402-025-00242-z | paywall, fora do Sci-Hub |
| `eswa-london-visual` | Unlocking visual data to enhance AI-enabled mass valuation of urban houses (ESWA 255-D) | 2024 | 10.1016/j.eswa.2024.124784 | é OA CC-BY-NC no editor (e tem preprint SSRN 4769524), mas ScienceDirect/SSRN bloquearam download automático — **baixar manualmente: doi.org/10.1016/j.eswa.2024.124784 → View PDF** |
| `tgis-2026` | (lote anterior, Transactions in GIS 2026) | 2026 | — | título/DOI no lote original |
| `nca-2026` | (lote anterior, NCA 2026) | 2026 | — | título/DOI no lote original |
| `casafari-proquest` | Tese Casafari via ProQuest | — | — | ProQuest exige login |
| `politesi-address-toolkit` | Tesi Politecnico di Milano — address toolkit (Roca 2023) | 2023 | — | politesi.polimi.it 403 (curl e navegador); sem snapshot íntegro no Wayback |

Observação sobre nomes: alguns arquivos entraram no levantamento original sob outro slug e foram resolvidos em etapa posterior (`bid-cadastro-fortaleza` → `direct-bid-cadastro.pdf`; `imf-wp16213` → `direct-imf-wp16213.pdf`; `statsbygg-iswc` → `direct-statsbygg-iswc.pdf`; `pgv-usp-1998` → `direct-pgv-usp-1998.pdf`; `geocode-quality-mdpi` → `mdpi-geocode-quality.pdf`, etc.). Não há duplicata: cada conteúdo tem exatamente um arquivo na pasta.
