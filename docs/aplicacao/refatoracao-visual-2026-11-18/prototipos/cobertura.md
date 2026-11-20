# Cobertura de features: Opção A e Opção B

Mapa de onde cada feature `incluida` do hub aparece nos dois protótipos. Features lidas no Enemyhub em 19/11/2026 (60 `incluida`: 6 de negócio, 54 de produto).
Colunas: a rota do protótipo vem em `código` (`tela`, `tela+gaveta`, `tela@seção`), seguida do nome da linha ou do bloco entre aspas. "Hoje" usa a matriz da seção 6 de `auditoria/auditoria.md`. "Toques" conta a partir do imóvel aberto (`ficha` em A, `painel` em B): 0 = já está na tela; em A, tocar no índice da ficha conta 1.
Resultado: na Opção A, 52 das 60 têm lugar na navegação (48 de produto e 4 de negócio), 2 ficam fora da navegação principal (pelo Menu) e 6 não têm tela. Na Opção B, 54 têm lugar na navegação (50 de produto e 4 de negócio), nenhuma fica fora e as mesmas 6 não têm tela. Das 6 sem tela, 4 são de dado, plataforma ou regra de design e 2 são decisões de negócio.
Conferência automática: `node ferramentas/conferir-cobertura.mjs` confere se toda rota citada nas tabelas existe e se todo texto entre aspas está no HTML da opção (293 rotas e 435 citações, nenhum problema). Ela não julga se a feature está bem resolvida: isso é leitura de quem revisa.

## Features de produto (54)

### Entrada e caderno

| Feature (id) | Hoje | Opção A | Opção B | Toques A / B |
|---|---|---|---|---|
| Ler o anúncio pelo link e pelo texto colado (`F-4ff8e63f`) | Ler | `entrada` · campo "Link do anúncio, prédio ou rua", "ZAP, VIVAREAL, QUINTOANDAR E OLX"; `leitura` · "Anúncio lido · zapimoveis.com.br", "Corrigir dados", "Colar o texto" | `painel+novo` · "Colar link", "Colar o texto" com o apoio "quando o link não abre"; `painel+confirmar` · "Anúncio lido", "Corrigir dados", "Colar o texto" | 2 / 1 |
| Leitura automática da página do anúncio no celular (`F-652a6d39`) | Ler | `leitura` · "Anúncio lido · zapimoveis.com.br" (o resultado) e a saída "Colar o texto"; a página do portal aberta no app não está desenhada | `painel+confirmar` · "Anúncio lido" (o resultado) e a saída "Colar o texto"; a página do portal não está desenhada | 3 / 2 |
| Explorar: busca por prédio, rua ou bairro sem anúncio (`F-bcf5f423`) | Explorar | `entrada` · "Cole o link ou busque o prédio"; `entrada-buscando` · "Procurando no cadastro"; `entrada-resultados` · "1 de 12 prédios nesta avenida", filtros "Até 6 andares", "7 a 14", "15 ou mais" | `painel-vazio` · "Buscar prédio"; `painel+novo-buscando` · "Procurando no cadastro"; `painel+novo-resultados` · "1 de 12 prédios nesta avenida", "Mais 11 prédios" | 2 / 1 |
| Encontrar e confirmar o prédio (`F-9d34be3f`) | Ler; Prédio | `leitura` · "É este o prédio?", "É este prédio", "Não é este"; `ficha-sem-predio` · "Confirmar prédio", "qual é a rua e o número?" | `painel+confirmar` · "É este o prédio?", "É este prédio", "Não é este"; `painel@cf` · "confirme o prédio", "qual é a rua e o número?" | 3 / 2 (sem prédio: 0 / 0) |
| Caderno local de imóveis (`F-41619f71`) | Salvos (pelo menu) | `caderno` · "4 IMÓVEIS · GUARDADOS SÓ NESTE APARELHO", filtros "Todos", "Comprar", "Alugar", "Novo imóvel"; `caderno+descartados` · "Restaurar"; `entrada` · "Digitar sem link" | `caderno` · filtros "Todos", "Comprar", "Alugar", "Novo imóvel"; `caderno+descartados` · "Restaurar"; `painel+novo` · "Digitar sem link" | 1 / 1 |
| Triagem do cartão: favoritar, anotar, descartar e etapas (`F-0752f693`) | Explorar › "Análises Recentes" | `ficha+triagem` e `caderno+triagem` · "Favorito", "Etapa" (Triagem, Visita, Visitado, Negociando), "Anotar", "Descartar imóvel"; `caderno` agrupa por etapa ("1 Visita marcada", "3 Triagem"), sem filtro por etapa | `painel+triagem` (faixa do topo "Triagem") · "Favorito", etapas, "Anotar", "Descartar imóvel"; `caderno` · filtros "Triagem", "Visita"; `caderno-deslize` · "Favoritar", "Descartar" | 1 / 1 |
| Descarte com motivo e créditos de teste (`F-5d16ce4d`) | Menu › "Carteira de créditos" | `caderno+descartar` · "Por que saiu da lista?", "COM O MOTIVO, VOLTA 1 CRÉDITO DE TESTE"; `leitura` · "USA 1 CRÉDITO DE TESTE"; `caderno+creditos` · "3 créditos de teste" (pelo Menu) | `painel+descartar` · "Por que saiu da lista?", "COM O MOTIVO, VOLTA 1 CRÉDITO DE TESTE"; `painel+confirmar` · "USA 1 CRÉDITO DE TESTE"; `caderno+creditos` · "Créditos de teste" | descarte 2 / 2; créditos 3 / 2 |
| Desde que você guardou (`F-d221af9c`) | Destaques › "Guarde o que este dossiê mostra hoje" | `ficha@perguntas` › `ficha+mudou` · "O que mudou", "GUARDADO EM 12/11/2026", "Guardar de novo" | `painel+perguntas` › `painel+mudou` · "O que mudou" | 2 / 2 |
| Exportar e importar o caderno (`F-206ddab8`) | Menu › "Cópia do meu caderno" | fora da navegação principal, acessível por `caderno` › "Menu" › `caderno+copia` · "Exportar caderno", "Restaurar de arquivo" | `caderno` › "Dados e ajustes" › `caderno+copia` · "Exportar caderno", "Restaurar de arquivo" | 3 / 2 |
| Sem cadastro obrigatório, dados só no aparelho (`F-dfa92daa`) | Menu | `caderno` · "4 IMÓVEIS · GUARDADOS SÓ NESTE APARELHO"; `caderno+menu` · "SEM CADASTRO · DADOS SÓ NESTE APARELHO"; `caderno+copia` · "SEM CONTA, A CÓPIA É O ÚNICO JEITO DE TROCAR DE APARELHO" | `caderno` · "SEM CADASTRO · DADOS SÓ NESTE APARELHO"; `caderno+copia` · mesma frase de A | 1 / 1 |
| Cinco dossiês de exemplo (`F-5aec2ab7`) | Explorar | `entrada` e `caderno-vazio` · "Exemplos" (Parque Atlântico, Ana Elizabeth, Viena); `caderno+menu` · "Exemplos"; o Viena abre `ficha-aluguel`. São 3 exemplos, como diz o hub sobre o Explorar | `painel-vazio` e `painel+novo` · "Exemplos" (os mesmos 3) | 2 / 1 |
| Perfil de acessibilidade da família (`F-d96f0420`) | Perfil da casa | fora da navegação principal, acessível por `caderno` › "Menu" › `caderno+perfil` · "Acessibilidade": "Mobilidade", "Visão", "FICA SÓ NO APARELHO · NUNCA É COMPARTILHADO"; também por `entrada+onde` › "Abrir perfil" | `caderno` › "Dados e ajustes" › `caderno+perfil` · "Acessibilidade": "Mobilidade", "Visão" | 3 / 2 |

### 1 Cabe no bolso?

| Feature (id) | Hoje | Opção A | Opção B | Toques A / B |
|---|---|---|---|---|
| Valores de fachada viram "a confirmar" (`F-bdf5377a`) | Dossiê › topo › custo | `caderno` · Viena "Aluguel · IPTU a confirmar"; `ficha-aluguel` · "IPTU a confirmar"; `ficha-sem-predio` · "IPTU de R$ 154, período a confirmar" | `painel@viena` · "IPTU a confirmar"; `painel@cf` · "IPTU de R$ 154, período a confirmar" | 1 / 0 |
| Custo mensal por parcelas (`F-9cf88b40`) | Dossiê › topo › custo; placar | `ficha` · "1 Bolso ~ R$ 6.805 por mês"; `ficha@bolso` · "O anúncio mostra R$ 1.075. Faltam a parcela e a luz.", lançamentos "Parcela do banco", "Condomínio", "IPTU", "Luz", "Soma"; aluguel em `ficha-aluguel` · "R$ 4.895", "aluguel de R$ 3.600" | `painel` · "Bolso · por mês ~R$ 6.805"; `painel+bolso` aba "Por mês" · "Parcela do banco", "Condomínio", "Luz", "IPTU"; aluguel em `painel@viena` · "Bolso · aluguel e taxas por mês" | 0 / 0 (parcelas 1 / 1) |
| Custo total da compra (preço + ITBI) (`F-10eb264e`) | Destaques › "Dinheiro à vista" | `ficha@bolso` › `ficha+para-entrar` · "ITBI", "Escritura e registro A confirmar", "Custo total da compra R$ 733 a 742 mil", "Pedindo o ITBI em até 180 dias, paga 1,8%" | `painel+bolso` aba "Para entrar" · os mesmos lançamentos e a frase dos 180 dias | 2 / 2 |
| Simulador de financiamento (Price) (`F-f29bbb9b`) | "10 pontos" › simulador | `ficha@bolso` · "Simular financiamento" ou "Parcela do banco" › `ficha+financiamento` · "Entrada" 10 a 50%, "Prazo" 15 a 35 anos, "Total pago ao banco", "Juros", "BANCO CENTRAL, AGO/2026" | `painel+bolso` · "Parcela do banco" › `painel+financiamento` · os mesmos campos | 2 / 2 |
| Bolso: entrada, saída mensal e custo em 10 anos (`F-11be75a8`) | Destaques › "Saída do bolso", "Visão de 10 anos"; Explorar › "Simular" | `ficha` · "para entrar, R$ 152 mil"; `ficha@bolso` · "Para entrar", "Em 10 anos"; `ficha+dez-anos` · "Comprar ou alugar e aplicar?", 0%, 3%, 5%; `entrada` · "Simular o bolso sem anúncio" | `painel` · "para entrar, R$ 152 mil"; `painel+bolso` abas "Por mês", "Para entrar", "Em 10 anos" (0%, 3%, 5%); `painel+novo` · "Simular o bolso sem anúncio" | 0 / 0 (10 anos 2 / 2) |

### 2 O prédio é confiável?

| Feature (id) | Hoje | Opção A | Opção B | Toques A / B |
|---|---|---|---|---|
| Ano, porte, unidades e padrão do prédio (`F-5f171d0b`) | Prédio; Dossiê › topo | `ficha` · "FICHA 6.1755.205.02.0130" (chave), "2 Prédio 2016 29 andares"; `ficha@predio` · "29 andares, 103 apartamentos, padrão médio." | `painel` · "Prédio 10 anos 2016 · 29 andares"; `painel+predio` · "2016 · 29 andares · 103 apartamentos · padrão médio", "CHAVE CADASTRAL 6.1755.205.02.0130" | 0 / 0 |
| IPTU do cadastro comparado ao anúncio (`F-333177a5`) | Destaques › "Divergências" | `ficha` · "1 achado: IPTU não confere"; `ficha@bolso` · "Não confere": "O anúncio diz IPTU de R$ 95. No cadastro, apartamentos de 58 m² pagam R$ 142." | `painel` · "IPTU não confere"; `painel+perguntas` · "IPTU não confere anúncio R$ 95 · cadastro R$ 142 para 58 m²" | 0 / 0 |
| Sinais de alvenaria resistente (alerta de estrutura) (`F-9476ce2c`) | Edifício | `ficha@predio` · linha "Estrutura": "sem alerta de alvenaria resistente (29 andares)". Em prédio de até 4 pavimentos, anterior a 2005 e padrão Simples ou Médio, o alerta entra nesta linha | `painel+predio` · linha "Estrutura", mesmo texto; o alerta entraria nesta linha | 1 / 1 |
| Valor das escrituras do prédio (ITBI), só na compra (`F-cf4a8c31`) | Destaques › "Raio-X"; Edifício | `ficha` · "12% acima das escrituras"; `ficha@predio` · "Preço e escrituras do prédio", "12 VENDAS EM 36 MESES · VALOR FISCAL, NÃO PREÇO DE MERCADO"; `ficha+metodo-predio` | `painel+predio` · "Preço e escrituras do prédio", mesmo código; `painel+metodo-predio` | 0 / 1 |
| Ficha viva do edifício (`F-8109a4b0`) | Destaques › "Relógio do prédio", "Raio-X" | `ficha` · leitura rápida "1 Bolso" a "5 Perguntas" e "Pulso"; fatos em `ficha@predio` · "Condomínio por m²", "MEDIANA DO BAIRRO: SEM LEITURA · PRECISA DE 5 NO CADERNO"; em `ficha@conforto` · "Via mais perto 45 m", "quadra 2,2 °C mais fresca que o bairro", "Altura do terreno 14,6 m", "Água mapeada mais perto" | `painel` · 7 mostradores e "Pulso da quadra"; `painel+predio` · "Condomínio por m²", "mediana do bairro: Sem leitura · precisa de 5 no caderno"; `painel+calor` · "Quadra em relação ao bairro · satélite −2,2 °C"; `painel+chuva` · "Altura do terreno", "Água mapeada mais perto 566 m" | 0 / 0 |
| Linha do tempo da estrutura (`F-97694a03`) | Edifício | `ficha@predio` › `ficha+linha-do-tempo` · "Linha do tempo", "Nenhum laudo, vistoria ou interdição guardado.", "Registrar documento" | `painel+predio` › `painel+linha-do-tempo` · "Linha do tempo · Parque Atlântico", mesmos textos | 2 / 2 |
| Leitor de ata e regimento por texto colado (sem IA) (`F-c0ce9044`) | Destaques › "Documentação e caixa"; Edifício | `ficha@predio` › `ficha+ata` · "Ler ata", "Cole o texto da ata, do regimento ou do boleto", "LIDO NO APARELHO, POR REGRAS · SEM SERVIDOR" | `painel+predio` › `painel+ata` · "Ler ata", mesmos textos | 2 / 2 |
| Mapa do lote em 2D e volume 2.5D (`F-ad9ed0d4`) | Destaques › "Raio-X"; Edifício | `ficha` · mapa do cabeçalho › `ficha+mapa` · "Planta", "Manhã", "Meio-dia", "Tarde", "Obra licenciada 116 m", "MAPA ATUAL DO APP, SEM MUDANÇA" | `painel` · "Abrir o mapa do lote" › `painel+mapa` · mesmas vistas e linhas | 1 / 1 |

### 3 Como é a rua (dia e noite)?

| Feature (id) | Hoje | Opção A | Opção B | Toques A / B |
|---|---|---|---|---|
| Mapa de serviços e caminhos diários (`F-4cfce3b1`) | Destaques › "A pé"; Entorno › "Por perto", "A pé" | `ficha` · "mercado a 5 min · ônibus a 4"; `ficha@rua` · "De dia, a pé 6,9 de 10"; `ficha+por-perto` · "A pé, da porta": "Mercado", "outra opção a 5 min" (o plano B), "Mercado e farmácia juntos", "em vez de 1,6 km em duas idas" (a cadeia de tarefas); "Equipamentos públicos": "Bicicleta de aluguel", "Ciclofaixa"; `comparar+rotina` · "Tempo de trajeto"; `entrada+onde` · "Onde mais procurar" 20, 30, 45 min | `painel` · "A pé 6,9 de 10 mercado a 5 min"; `painel+rua`; `painel+por-perto` · "A pé, da porta" e "Equipamentos públicos", com as mesmas linhas; `comparar+rotina` · "Tempo de trajeto"; `painel+onde` · "Onde mais procurar" | 0 / 0 (por perto 2 / 2) |
| A rua, em linguagem simples (`F-587e1f40`) | Entorno › "A rua" | `ficha@rua` · "Registros a até 150 m, em 12 meses": "Lâmpada apagada", "Drenagem", "Sinistros com vítima", "Obra licenciada"; detalhe em `ficha+fonte`. Fatos de rampa entrariam aqui com "Mobilidade" marcada no perfil | `painel+rua` · "Registros a até 150 m, em 12 meses": "Drenagem", "Entulho", "Sinistros com vítima", "Obra licenciada"; "Lâmpada apagada" em `painel+noite` | 1 / 1 |
| Obras e demolições licenciadas a 150 m (`F-bfdb0e12`) | Entorno | `ficha@rua` · "Obra licenciada 1 acréscimo a 116 m · licença de nov/2024"; `ficha+mapa` · "licença vencida em 01/2025"; `caderno` · Ana Elizabeth "5 obras em volta" | `painel+rua` · "Obra licenciada acréscimo a 116 m"; `painel+mapa`; `painel@ae` · "5 obras em volta" | 1 / 1 |
| Segurança no bairro (`F-d4202eac`) | Entorno › "Segurança" | `ficha@rua` · "No bairro 17,1 registros policiais por mil moradores", "SDS-PE COMPILADO PELO CRIME BRASIL"; "Bairros vizinhos" › `ficha+vizinhos` · "ORDEM ALFABÉTICA", "Mediana dos bairros do Recife: 17,4." | `painel+noite` · "Registros policiais" › `painel+vizinhos` · mesmos textos | 1 / 1 (vizinhos 2 / 2) |
| Bares, oficinas e comércio em volta (`F-cb5d3d5d`) | Entorno › "Bares" | `ficha@rua` · "Comércio em volta 1 bar a 120 m" › `ficha+comercio` · "Bar ou venda de bebida", "Padaria, farmácia ou mercadinho", "CENSO 2022 (IBGE) · SÓ A CATEGORIA, SEM NOME" | `painel+rua` · "Comércio em volta" › `painel+comercio` · mesmas linhas | 1 / 1 (detalhe 2 / 2) |
| Renda e ocupação do setor censitário (`F-dbbe4bad`) | Entorno | `ficha@rua` · "Renda do setor mediana de R$ 15.000" › `ficha+renda` · "Domicílios no setor", "Moradores por domicílio" | `painel+rua` · "Renda do setor" › `painel+renda` · mesmas linhas | 1 / 1 (detalhe 2 / 2) |
| "Isso bate com a rua hoje?" (`F-17ccbbbc`) | Entorno › "Isso bate" | `ficha@rua` · "Isso bate com a rua hoje?", "Bate", "Não bate"; ao marcar "Não bate", o campo "Por quê? (opcional)" | `painel+rua` · mesma pergunta, botões e campo | 1 / 1 |
| Voltando à noite (`F-d380927b`) | Entorno › "Voltando à noite"; Edifício › "De que lado vem o barulho" | `ficha@rua` · "De noite 4 min até o ônibus · último às 23:58, com 2 travessias", "Lâmpada apagada", "Sinistros com vítima 10 chamados da CTTU"; lado do barulho em `ficha@conforto` · "Via mais perto 45 m Rua dos Navegantes, lado noroeste" | `painel` · "Noite e ruído" › `painel+noite` · "Voltando à noite": "Ônibus mais perto", "Lâmpada apagada"; CTTU em `painel+rua` · "Sinistros com vítima"; lado do barulho em `painel+noite` · "Via mais perto", "Rua dos Navegantes, lado noroeste" | 1 / 1 |

### 4 Barulho, calor e chuva

| Feature (id) | Hoje | Opção A | Opção B | Toques A / B |
|---|---|---|---|---|
| Ruído em dB(A) estimado por andar e fachada (`F-ed55eac4`) | placar; Destaques › "Sossego à noite" | `ficha` · "4 Conforto ~ 58 dB(A) à noite estimativa"; `ficha@conforto` · "~ 58 dB(A) à noite, na janela", "FAIXA DE ±5 dB", "Sossego à noite 7,3 de 10", "De dia, na janela", "No quarto, janela fechada"; `ficha+metodo` | `painel` · "Noite e ruído ~58 dB(A) estimativa, à noite"; `painel+noite` · "À noite", "De dia", "Na rua", "Na janela", "No quarto, janela fechada", "Sossego à noite 7,3 de 10"; `painel+metodo-noite` | 0 / 0 |
| Ruído do aeroporto (`F-3ea48fa0`) | Entorno › "Andar × fachada" | `ficha@conforto` · "Avião não entra fora da linha de pouso · não pesa neste prédio". Em prédio na linha de pouso, distância e altura entram nesta linha | `painel+noite` · "Avião fora da linha de pouso · não pesa neste prédio"; mesma regra | 1 / 1 |
| Simulador andar × fachada (`F-7afb81ed`) | Entorno › "Andar × fachada" | `ficha@conforto` · "Andar e fachada 14º · sudeste" › `ficha+andar` · "14º andar", "Baixo", "Meio", "Topo", "Para que lado fica a janela?", "Na janela, à noite", "Sol direto", "Brisa" | `painel+noite` ou `painel+calor` · "Andar e fachada" › `painel+andar` · mesmos campos | 2 / 2 |
| Calor, sol e sombra (`F-514b31b0`) | Destaques › "Sol, sombra e brisa", "Conforto térmico" | `ficha` · "calor 9,2 de 10"; `ficha@conforto` · "Calor 9,2 de 10 · fresco e ventilado"; `ficha+andar` · "Sol direto ~ 5,5 h"; `visita-no-imovel+sol` · "Sol nas janelas", "À tarde sombra"; `ficha+metodo-calor` | `painel` · "Calor 9,2 de 10"; `painel+calor` · "Fachada sudeste (116°)", "Sol direto por dia, no equinócio", "Quadra em relação ao bairro · satélite −2,2 °C"; `painel+metodo-calor` | 0 / 0 |
| Alagamento da rua ("Se a rua alagar") (`F-999074ea`) | Edifício; Entorno | `ficha@conforto` · "Chuva": "Sem alagamento registrado na rua.", "Altura do terreno", "Defesa Civil na avenida", "Sem registro não garante que a rua não alaga: pergunte na visita." | `painel` · "Chuva 0 alagamentos"; `painel+chuva` · mesmas linhas e "Pedidos de drenagem à Central 156"; `painel@viena` · "Chuva 20 pedidos de drenagem" | 1 / 0 |

### 5 O que perguntar e conferir

| Feature (id) | Hoje | Opção A | Opção B | Toques A / B |
|---|---|---|---|---|
| Perguntas e mensagem pronta para o corretor (`F-749334ff`) | Destaques › "Divergências", "Antes de decidir"; Edifício | `ficha` · "5 Perguntas 12 para a visita"; `ficha@perguntas` · "Para o corretor" (4 perguntas), "Copiar mensagem" › `ficha+mensagem` · "Copiar mensagem", "Abrir WhatsApp"; `visita+mensagem` | `painel` · "Perguntas 12 para a visita"; `painel+perguntas` · "Para o corretor" › `painel+mensagem` · "Copiar mensagem", "Abrir WhatsApp"; `visita` · "Mensagem ao corretor 4 perguntas antes de ir" | 0 / 0 (mensagem 2 / 2) |
| Preparar a negociação (`F-186cc5c7`) | Destaques › "Preparar a negociação" | `ficha@perguntas` › `ficha+negociacao` · "Fatos para levar", "O VEREDA NÃO SUGERE PREÇO NEM VALOR DE PROPOSTA", "Montar mensagem" | `painel+perguntas` › `painel+negociacao` · mesmos textos | 2 / 2 |
| Pacote para especialista (advogado ou vistoriador) (`F-cd726b51`) | Destaques › "Exportar dossiê técnico" | `ficha@perguntas` › `ficha+pacote` · "Imprimir", "Copiar texto", "Baixar arquivo", "FICAM DE FORA: PERFIL DA CASA, FOTOS E DIÁRIO" | `painel+perguntas` › `painel+pacote` · mesmos textos | 2 / 2 |
| Roteiro de visita no imóvel (`F-d34971df`) | Visita; "10 pontos" › roteiro | `visita` · "12 pontos para conferir", "Começar visita"; `visita-no-imovel` · "No imóvel há 00:12:40", lista com caixas, "Como soa lá dentro?", "Suas impressões"; `visita-resumo` · "9 de 12 conferidos"; também `ficha@perguntas` · "Roteiro da visita" | `visita` · "12 pontos para conferir", "Todos os pontos" (`visita+roteiro`); `visita-ponto` · "Ponto 4 de 12", "Tudo certo", "Atenção", "Não vi", campo "Anotar"; `visita-resumo` · "9 de 12 conferidos" | 1 / 1 |
| Sensores na visita (localização, microfone, bússola) (`F-5013510b`) | Explorar; Visita | localização: `entrada` · "Usar minha localização prédio a até 250 m" e `entrada-sem-permissao`; microfone: `visita-no-imovel` · "Ruído: janela aberta e fechada", "−9 dB"; bússola: `visita-no-imovel` · "Fachada da sala 116° sudeste bússola do aparelho"; checagens de risco: os 2 primeiros pontos de `visita`, "A água da rua entra na garagem?" e "Internet no cômodo" | localização: `painel+novo` · "Usar minha localização" e `painel+novo-sem-permissao`; microfone: `visita-ruido` · "Medir aberta", "Medir fechada", "O MICROFONE NÃO É CALIBRADO"; bússola: `visita-bussola` · "116° sudeste", "Guardar janela"; checagens de risco: os 2 primeiros pontos de `visita`, com os mesmos nomes | localização 2 / 1; microfone 2 / 3; bússola 2 / 4; checagens 1 / 1 |
| Internet onde você vai usar (`F-20117aaa`) | Visita | `visita` · ponto 2, "Internet no cômodo"; `visita-no-imovel` · "Teste de internet" › `visita-no-imovel+internet` · "Fibra no endereço", "Sinal de celular na rua", "Medido no cômodo" | `visita` · ponto 2, "Internet no cômodo" › `visita+internet` · mesmas linhas | 3 / 2 |

### 6 Qual dos dois?

| Feature (id) | Hoje | Opção A | Opção B | Toques A / B |
|---|---|---|---|---|
| Comparar dois imóveis lado a lado (`F-00a8ea24`) | Comparar | `comparar` · "2 IMÓVEIS DE COMPRA", tabela "01 Bolso" a "04 Conforto"; `comparar+trocar` · "VIENA É ALUGUEL: COMPARA SÓ COM ALUGUEL" | `comparar` · "Por mês", "Preço por m²", "Idade do prédio", "Terreno", "Sossego à noite", "Calor", "Também muda"; `comparar+trocar` · mesma frase | 1 / 1 |
| Para decidir: resumo, prioridade e pergunta decisiva (`F-48b62c50`) | Comparar | `comparar` · "O que pesa mais" (Custo, Conforto, Documentos), "A pergunta que decide", "Já sei", "Perguntar"; `comparar+rotina` · "Tempo de trajeto" | `comparar` · mesmos blocos; `comparar+rotina` · "Tempo de trajeto" | 1 / 1 |
| Sala de decisão (compartilhar sem servidor) (`F-b26742c6`) | Comparar | `comparar+sala` · "Decidir a dois", "Copiar link", "QUEM RECEBE RESPONDE: FAZ SENTIDO, DÚVIDA OU DESCARTAR", "Abrir resposta" | `comparar+sala` · mesmos textos | 2 / 2 |

### De onde vem cada número

| Feature (id) | Hoje | Opção A | Opção B | Toques A / B |
|---|---|---|---|---|
| Ver a fonte de cada número e "Sobre os dados" (`F-51b0bec9`) | gaveta "Ver a fonte"; Menu › "Sobre os dados" | `ficha+fonte` · "Órgão", "Licença ODbL", "Base modificada em", "Consultada em", "Sobre os dados"; `sobre` · "14 bases públicas, lidas no aparelho.", "Fora da cobertura" (pelo Menu ou pela fonte) | `painel+fonte` · mesmos campos; `sobre` · "Fora da cobertura" (pelo Caderno ou pela fonte) | fonte 2 / 2; sobre 3 / 2 |
| Notas 0–10 com ficha de método (placar, pulso, conforto, caminhada, Comparar) (`F-6c9be706`) | fichas espalhadas pelos blocos | `ficha` · "Pulso 7,9 de 10" › `ficha+pulso` · "LEITURA SEM DADO FICA FORA DA MÉDIA" › `ficha+metodo-pulso`; `ficha+metodo`, `ficha+metodo-rua`, `ficha+metodo-calor`; `comparar+metodo-comparar` · "Vantagem em 3 de 6"; `ficha-sem-predio` · "Sem leitura" | `painel` · "Pulso da quadra 7,9 de 10" › `painel+pulso` › `painel+metodo-pulso`; `painel+metodo-noite`, `painel+metodo-rua`, `painel+metodo-calor`; `comparar+metodo-comparar`; `painel@cf` · "Sem leitura" | 0 / 0 (ficha 2 / 2) |
| Conformidade ODbL das bases derivadas (`F-6461d956`) | crédito no mapa | `ficha` · "Contém dados da Prefeitura do Recife (ODbL)" no mapa; `sobre` · "Baixar as bases ODbL", "CONTÉM DADOS DA PREFEITURA DO RECIFE (ODbL) · © COLABORADORES DO OPENSTREETMAP" | `painel+mapa` · "CONTÉM DADOS DA PREFEITURA DO RECIFE (ODbL)"; `sobre` · "Baixar as bases ODbL", mesmo crédito | 0 / 1 |

### Sem tela (dados e plataforma)

| Feature (id) | Hoje | Opção A | Opção B | Toques A / B |
|---|---|---|---|---|
| Índice cadastral (72 bairros habilitados) (`F-2ee4f211`) | sem tela própria | sem tela; aparece como dado em `ficha@perguntas` · "ÍNDICE DE 15/11/2026" e em `sobre` · "Bairros cobertos 72 de 94" | sem tela; aparece em `sobre` · "Bairros cobertos 72 de 94" | n/a |
| Ciclo de atualização dos dados com ponto de restauração (`F-fa948d23`) | sem tela | sem tela (script) | sem tela (script) | n/a |
| Varredura LGPD dos dados publicados (`F-f5dfc2e3`) | sem tela | sem tela (checagem em `npm run verificar`) | sem tela | n/a |
| index.html como única referência de design e experiência (`F-dc967401`) | regra de design | regra de design, sem tela; ver a seção Divergência com o hub | regra de design, sem tela; ver a seção Divergência com o hub | n/a |

## Features de negócio (6)

| Feature (id) | Como aparece nos protótipos |
|---|---|
| Foco principal em B2C (`F-11d4f446`) | Decisão de negócio, sem tela. Nenhuma tela para corretor ou imobiliária em A ou B. |
| Primeiro recorte: aluguel (`F-e0577bca`) | Imóvel de aluguel Viena: em A, `caderno` · "Viena R$ 3.600", "R$ 4.895/mês" e `ficha-aluguel` · "R$ 4.895", "aluguel de R$ 3.600"; em B, `painel@viena` · "Bolso · aluguel e taxas por mês R$ 4.895". Custo por parcelas em `ficha@bolso` e `painel+bolso`. `comparar+trocar` · "VIENA É ALUGUEL: COMPARA SÓ COM ALUGUEL". |
| Recife como território, começando por 6 bairros (`F-73eb8454`) | `sobre` (A e B) · "Bairros cobertos 72 de 94"; exemplos em Boa Viagem, Graças e Madalena. |
| Atuar depois do anúncio, sem ser portal (`F-fcf61e8a`) | A entrada começa pelo anúncio: `entrada` · "Cole o link ou busque o prédio" (A); `painel-vazio` · "Cole o link do anúncio" (B). Nenhuma tela de catálogo. |
| v1.0 como prova de conceito interna, educacional e gratuita (`F-0fed0d75`) | Códigos "SEM CADASTRO · DADOS SÓ NESTE APARELHO" (`caderno+menu` em A, `caderno` em B); `caderno+creditos` · "Créditos de teste", "NÃO TÊM VALOR EM DINHEIRO". |
| Pitch demonstrativo, sem avisos de "ilustrativo" (`F-a2ec9d96`) | Decisão de negócio, sem tela. Vale para o pitch, não para o app. |

## Conferência das 54

- [x] Linhas da tabela de produto: 12 + 5 + 8 + 8 + 5 + 6 + 3 + 3 + 4 = 54.
- [x] Features `incluida` de produto no arquivo do hub (19/11/2026): 54. Bate.
- [x] Linhas da tabela de negócio: 6. Features `incluida` de negócio no hub: 6. Bate.
- [x] Cada id aparece uma vez só nas tabelas.

### Sem destino

Nenhuma. Todas as 60 têm lugar nas duas opções, ficam fora da navegação principal com caminho escrito ou não têm tela por natureza.

### Partes de feature que os protótipos não desenham

A feature tem lugar nas duas opções, mas um item da descrição do hub não está desenhado. A primeira versão desta lista tinha 10 itens; 8 foram desenhados na rodada 3 da revisão (`revisao.md`).

- Leitura automática da página do anúncio (`F-652a6d39`): a página do portal aberta dentro do app não está desenhada (é a página do portal, não uma tela do Vereda). O resultado da leitura e a saída "Colar o texto" estão nas duas opções.
- Mapa do lote (`F-ad9ed0d4`): zoom e arrasto não aparecem. O mapa entra como captura do mapa atual ("MAPA ATUAL DO APP, SEM MUDANÇA"), por decisão do pedido.
- Sala de decisão (`F-b26742c6`): estão desenhados o envio, as três respostas possíveis e "Abrir resposta". A tela de quem recebe o link e as linhas gravadas no diário, não.
- Ficha viva do edifício (`F-8109a4b0`): "Condomínio por m²" aparece no estado "Sem leitura" (o caderno do exemplo não tem 5 imóveis do bairro). O estado com a mediana não está desenhado.
- Sensores na visita (`F-5013510b`): o Parque Atlântico tem 2 checagens de risco (água na garagem e internet); a terceira, "Pressão da água e fachada", só entra em prédio com mais de 25 anos (Ana Elizabeth e Viena) e não aparece em nenhuma tela.
- Triagem do cartão (`F-0752f693`): na Opção A o Caderno agrupa por etapa, mas não filtra por etapa. Na B há o filtro.

Limites do protótipo, que valem para qualquer feature:

- Só o Parque Atlântico tem o detalhe desenhado. Na Opção A, a ficha do aluguel (`ficha-aluguel`, Viena) tem só o topo, e as linhas dela levam às seções do Parque Atlântico. Na Opção B, os painéis de Ana Elizabeth e do Viena estão inteiros, mas as gavetas abertas a partir deles mostram os dados do Parque Atlântico.
- Algumas combinações de tela e gaveta funcionam, mas não estão em `window.TELAS` e por isso não têm captura própria: 3 na Opção A (`caderno-vazio+menu`, `ficha-sem-predio+triagem`, `ficha-sem-predio+mensagem`) e 8 na B (`painel-vazio+novo-buscando`, `visita+trocar`, `visita+mensagem`, `visita-ponto+roteiro`, `caderno+novo`, `caderno+triagem`, `caderno-deslize+descartar`, `comparar+fonte`). A mesma gaveta está capturada sobre outra tela.

## O que não é `incluida` e aparece, ou não aparece

### Aparece nos protótipos sem ser `incluida`

| Item | Feature do hub (veredito) | Opção A | Opção B |
|---|---|---|---|
| Rateio de obra | Frente visual… `F-ae35a34b` (`em_aberto`) | `ficha+documentos` · "Rateio de obra ~R$ 1.942 por apartamento" | `painel+documentos` · "Rateio de obra" |
| Documentos antes do sinal | `F-ae35a34b` (`em_aberto`) | `ficha@predio` · "Documentos do sinal 0 de 4" › `ficha+documentos` · "Matrícula atualizada", "Travas" | `painel+predio` · "Documentos do sinal 0 de 4" › `painel+documentos` |
| Tempo de trajeto a dois destinos | `F-ae35a34b` (`em_aberto`); a rotina até o destino também está em `F-48b62c50` e `F-4cfce3b1` (`incluida`) | `comparar+rotina` · "Tempo de trajeto", "ESTIMATIVA: LINHA RETA × 1,38" | `comparar+rotina` · "Tempo de trajeto", mesmo código |
| Simulação do bolso sem anúncio | `F-ae35a34b` (`em_aberto`); o simulador do Explorar também está em `F-11be75a8` (`incluida`) | `entrada` · "Simular o bolso sem anúncio" | `painel+novo` · "Simular o bolso sem anúncio" |
| Horizonte da janela (radar de vista) | `F-ae35a34b` (`em_aberto`) | `ficha@predio` · "Torre nova à frente Sem leitura" | `painel+predio` · "Torre nova à frente", "Sem leitura" |
| Linha unificada do lote (vendas, Defesa Civil, licença, próxima obra) | `F-ae35a34b` (`em_aberto`), junto da Linha do tempo da estrutura `F-97694a03` | `ficha+linha-do-tempo` · "117 vendas registradas", "Primeira obra de fachada"; `ficha@predio` · "Próxima obra grande 2031" | `painel+linha-do-tempo` · mesmas linhas |
| Bússola solar na visita | `F-ae35a34b` (`em_aberto`) | `visita-no-imovel+sol` · "Sol nas janelas" | `visita-bussola` · "sol da manhã, ~5,5 h por dia" |
| Resposta à pergunta ("Já sei" / "Perguntar") e "Sem resposta" | parte de Fila de dúvidas com resposta e fonte `F-c0867765` (`em_aberto`) | `comparar` · "Já sei", "Perguntar"; `visita-resumo` · "Sem resposta" | `comparar` · "Já sei", "Perguntar"; `visita-resumo` · "Sem resposta" |
| Créditos de teste | Créditos em troca de dados confirmados em campo `F-603937da` (`em_aberto`); a carteira de teste está em `F-5d16ce4d` (`incluida`) | `caderno+creditos` · "NÃO TÊM VALOR EM DINHEIRO" | `caderno+creditos` · mesmo texto |

### Não aparece, como deve

| Feature (veredito) | Conferência nos dois arquivos |
|---|---|
| Ranking de bairros, adjetivo sobre bairro, previsão de preço e preço-alvo (`F-41538d7e`, `excluida`) | Nenhum ranking, nenhum adjetivo de segurança sobre bairro, nenhum preço-alvo nem contraproposta. Os vizinhos vêm em "ORDEM ALFABÉTICA"; "O VEREDA NÃO SUGERE PREÇO NEM VALOR DE PROPOSTA"; "O Vereda não prevê preço: a valorização é escolha sua." |
| Diagnóstico e previsão apresentados como perícia (`F-31246d36`, `excluida`) | Ausente. Os textos dizem "ESTIMATIVA COM DADOS ABERTOS, NÃO MEDIÇÃO" e "Sem registro não garante que a rua não alaga". |
| Rotas sombreadas a pé (`F-245df111`, `excluida`) | Ausente. |
| Raspagem de portais por servidor (`F-78ee09ba`, `excluida`) | Ausente; a ata é "LIDO NO APARELHO, POR REGRAS · SEM SERVIDOR". |
| Foto do imóvel no cartão (`F-0fcb6267`, `adiada`) | Ausente; o cartão usa o desenho do lote. "Fotos" só aparece em "FICAM DE FORA: PERFIL DA CASA, FOTOS E DIÁRIO". |
| Conta, compra de créditos e pagamento (`F-263bd684`, `adiada`) | Ausente: nenhum login, pagamento nem preço de pacote. |
| Ler atas e boletos com IA (`F-175a00d6`, `adiada`) | Ausente; só texto colado. |
| Aluguel comparado ao mercado do entorno (`F-48a6be39`, `adiada`) | Ausente. |
| Corrigir fotos distorcidas (`F-68832d71`, `em_aberto`) | Ausente. |

## Divergência com o hub

`F-dc967401` ("index.html como única referência de design e experiência", `incluida`) fixa "cartões brancos" e "dock de quatro abas".
A Opção A tem 3 abas de texto (Caderno, Comparar, Visita) e nenhum cartão. A Opção B tem 4 abas (Painel, Comparar, Visita, Caderno), com destinos diferentes dos do `index.html`.
Escolhida uma opção, a redação dessa feature no hub precisa mudar, e a decisão é do usuário.
