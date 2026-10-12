# Plano do protótipo mockado (fase 0)

Fonte de verdade: `docs/PRD-PropSight.md` (versão 1.1) e `docs/CONTEXT.md`. Este plano só decide como construir a fase 0 do roteiro (seção 12 do PRD).

## O que será construído

Um aplicativo Expo (React Native, TypeScript estrito, Expo Router), Android primeiro, que também roda no navegador para gerar capturas. Não há backend: o app lê três dossiês derivados de dados públicos reais de Recife, guardados como JSON em `src/fixtures/` e validados na borda.

Telas, na ordem da jornada do PRD (seções 5 e 6):

1. Entrada: "compartilhe ou cole o link do anúncio", sem cadastro, com detecção de link na área de transferência ao abrir em primeiro plano.
2. Lendo o anúncio: campos aparecem um a um, cada um marcado "declarado pelo anunciante" e editável por toque.
3. Etapas do pipeline: anúncio lido, edifício resolvido, cadastro de edificações, cadastro fiscal, Defesa Civil, suscetibilidade, consistência, desconhecidos.
4. Confirmação do edifício: mapa cadastral com 2 ou 3 candidatas; só aparece com confiança média; grava origem "humano".
5. Dossiê em quatro blocos fixos, com camada 2 por cartão, "ver fonte" e "isso está errado".
6. Roteiro de visita: checklist com progresso.
7. Mensagem pronta para o corretor: editável, copiar e compartilhar; o app não envia nada sozinho.
8. Modo rua: o anúncio sem número, quando o usuário não reconhece nenhuma candidata.
9. Meus dossiês: os três dossiês com estado e motivo de descarte opcional.

Entrada e Meus dossiês ficam em duas abas inferiores ("Verificar" e "Meus dossiês"); as demais telas empilham por cima delas.

Entrada por compartilhamento: `expo-share-intent` em dev build, com limite de 4 horas de esforço. O campo de colar link funciona sempre.

## O que é dado real e o que é fixo

| Item | Origem |
|---|---|
| Campos dos 3 anúncios | Anúncios reais de Recife, abertos no navegador em outubro de 2026. O endereço da página fica fora do repositório |
| Edificação, lote, pavimentos, área construída | Prefeitura do Recife, Área Urbana (Edificações-Lotes, Edificações-Pavimentos, Lotes) |
| Unidades, ano de construção, área e IPTU por unidade | Prefeitura do Recife, IPTU 2026, só campos do imóvel |
| Atendimentos da Defesa Civil nas ruas que passam a até 150 m | Prefeitura do Recife, 2021 a 2024, ligados ao logradouro oficial; cada atendimento conta para a rua inteira dentro do bairro, porque o número do imóvel vem mascarado |
| Suscetibilidade | Carta SGB 2015 do Recife |
| Geometria do mapa e da silhueta do prédio | Quadras, lotes, edificações e trechos de logradouro da Prefeitura, reprojetados para metros locais; a altura de cada pavimento na silhueta é ilustrativa |
| Matriz de perguntas, textos dos cartões e da mensagem | Fixos, escritos a partir do PRD |
| Tempo das etapas do pipeline | Simulado; o resultado de cada etapa vem das fixtures |
| Estado do usuário (correções, roteiro, estado do dossiê) | Local no aparelho |

## Direção visual

Prancha cadastral viva. O app se comporta como uma folha de levantamento da Prefeitura que ganha vida no celular: o mapa não usa tiles de terceiros, é desenhado com a geometria real de quadras, lotes e edificações do cadastro municipal, com escala, norte, o código de 14 dígitos e coordenadas em fonte mono. A certeza é codificada pela forma da linha, nunca por cor de semáforo: traço contínuo é registro, tracejado é desconhecido, hachura é conflito entre fontes, e a voz do anunciante tem cor própria. A paleta vem de Recife: tinta de mangue no lugar do preto, azul de azulejo para registros oficiais, verde de maré para observação direta, jambo para o que o anunciante declara, e branco de cal frio como superfície, com um tema escuro de rio à noite. Tipografia: Bricolage Grotesque nos títulos (continuidade com o panfleto), Atkinson Hyperlegible no texto corrido (legibilidade para leigos) e IBM Plex Mono em dados, códigos e datas. Os dois momentos de impacto são o mapa, que se monta camada por camada até o alvo, e a barra de custo segmentada por origem; a silhueta isométrica do prédio, extrudada do contorno cadastral, mostra o andar anunciado aceso em jambo ou flutuando tracejado acima do último pavimento quando o cadastro não comporta o andar.

## Contrato das fixtures

Arquivos: `src/fixtures/dossies/<id>.json` e `src/fixtures/mapas/<id>.json`. O app valida os dois com zod ao carregar e falha com contexto se algo não bater.

### Dossiê

Segue a seção 8.2 do PRD, com campos adicionais marcados como "novo". O esquema executável em `src/dominio/esquema.ts` é a fonte de verdade; esta seção o resume. Os modelos de texto de cada cartão estão em `docs/CATALOGO-DE-CARTOES.md` e a matriz de perguntas em `scripts/dados/matriz_perguntas.json`.

```
dossie_id            string, igual ao nome do arquivo
gerado_em            ISO 8601 com fuso
versao_metodo        "0.1.0"
anuncio
  operacao           "aluguel" | "compra"
  codigo_anuncio     string só de dígitos (novo; reconhece o link colado sem guardar a URL)
  coletado_em        "AAAA-MM-DD" (novo)
  campos_declarados  preco, condominio, iptu, iptu_periodicidade ("mensal"|"anual"|null), area_m2,
                     quartos, suites, banheiros, vagas, andar, edificio, logradouro, numero,
                     complemento, bairro; ausente = null
  trechos_descricao  [{ campo, texto }] (novo; trechos factuais curtos da descrição, até 12 palavras)
identidade
  status             "resolvido" | "pendente_confirmacao"
  confianca          "alta" | "media" | "baixa"
  origem             "resolvedor" | null (o app grava "humano" ao confirmar)
  edificio           Edificio | null
  candidatas         Edificio[] (vazio quando resolvido)
cartoes              Cartao[] que valem para o anúncio, qualquer que seja o edifício
cartoes_por_candidata  { [id da candidata]: Cartao[] } (novo; só no anúncio com confirmação)
perguntas            Pergunta[]
resumo               contagem de cartões por categoria
```

Edificio: `id` ("alvo", "A", "B", "C"), `dsqfl` (14 dígitos), `endereco_oficial`, `pavimentos`, `area_construida_m2`, `ano_construcao`, `unidades`, `contorno` (novo; "edificacao" ou "lote", diz de onde vem o polígono), `evidencias` (frases curtas que explicam por que é candidata).

Cartao: `id`, `bloco` (1 a 4), `categoria` ("registro_oficial", "observacao_direta", "declarado_anunciante", "inconsistencia", "desconhecido", "precisa_especialista"), `titulo` (novo, até 5 palavras), `resumo` (novo, opcional, até 70 caracteres, usado na tela de etapas), `claim`, `fonte`, `url_fonte` (ou null), `data_ref` (data ISO, intervalo ISO "inicio/fim" ou null), `data_coleta`, `escala` ("unidade", "edificio", "lote", "rua", "microarea", "bairro", "municipio"), `metodo`, `limitacao`, `acao`, `pergunta_id` (novo, ou null) e `visual` opcional (novo):

- `{ tipo: "comparacao_area", itens: [{ rotulo, valor_m2, categoria }] }`
- `{ tipo: "ocorrencias", total, raio_m, periodo, por_ano: [{ ano, n }], por_tipo: [{ tipo, n }], ruas: [{ nome, n }] }`
- `{ tipo: "custo_mensal", parcelas: [{ rotulo, valor, faixa: [min, max] | null, origem: "informado_no_anuncio" | "do_cadastro_fiscal" | "nao_informado" }] }`

Pergunta: `id`, `texto`, `status` ("respondida", "parcial", "desconhecida"), `status_modo_rua` (novo, opcional), `evidencias` (ids de cartões), `acao` (`{ tipo: "documento" | "pergunta" | "visita" | "profissional", texto }`), `para_corretor` (novo; frase usada na mensagem ao corretor, ou null).

### Mapa

```
dossie_id, crs ("EPSG:31985"), origem_utm [E, N], origem_wgs84 [lon, lat], lado_m, fonte, data_ref
quadras        [[[x, y], ...]]          anel externo, metros relativos à origem, y para norte
lotes          [[[x, y], ...]]
edificacoes    [[[x, y], ...]]
logradouros    [{ nome, pontos: [[x, y], ...] }]
alvos          [{ id, dsqfl, pontos: [[x, y], ...] }]
ruas_com_ocorrencias [{ nome, n, trechos: [[[x, y], ...]] }]  trechos dentro do raio; n vale para a rua inteira no bairro, porque a Defesa Civil publica o número mascarado
centro_raio    [x, y]
raio_m         150
suscetibilidade [{ tipo, classe, pontos }]  vazio se a carta não for obtida
```

Coordenadas arredondadas a 0,1 m e polígonos simplificados a 0,4 m.

## Divisão do trabalho

| Quem | O quê |
|---|---|
| Subagente de dados | Baixar as bases para `data/` (fora do git), derivar com DuckDB e GeoPandas via uv, analisar onde a Defesa Civil tem mais atendimentos, resolver os 3 anúncios, gerar fixtures, scripts em `scripts/dados/` e `docs/FIXTURES.md` |
| Subagente de build Android | Criar um AVD a partir da imagem instalada, gerar o dev build com `expo-share-intent` e instalar no emulador, dentro do limite de 4 horas |
| Subagente de QA | Auditoria independente de linguagem e marcas, typecheck, lint, testes e percurso dos três fluxos |
| Integração (sessão principal) | Escolha dos anúncios no navegador, direção visual, sistema de design, telas, integração, capturas e revisão final |

## Verificação

- `npm run typecheck`, `npm run lint` e `npm test` sem erros; o teste de palavras proibidas cobre fixtures, textos e telas.
- Os três fluxos percorridos no emulador ou, se ele falhar, no navegador, com capturas em `docs/capturas/`.
- README com como rodar, dev build, real versus fixo e limitações.
