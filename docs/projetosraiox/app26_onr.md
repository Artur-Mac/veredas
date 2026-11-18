# app26 — ONR / SREI (Registro de Imóveis Eletrônico)

Coleta: 17/11/2026. Fontes: `onr.org.br` (home, `/registro-de-imoveis-brasileiro/`, `/registro-de-imoveis-eletronico/`, `/o-projeto-srei-.../`, `/projetos/`, `/tokenizacao-imobiliaria/`), `cnm.onr.org.br` (PGV-CNM), `mapa.onr.org.br`, `ridigital.org.br`, `indisponibilidade.onr.org.br`, `penhoraonline.org.br`, `oficioeletronico.com.br`.

## 1. Identificação da Solução

- **Nome:** **ONR** — Operador Nacional do Sistema de Registro Eletrônico de Imóveis (CNPJ 37.318.313/0001-00).
- **Base legal:** **Lei 13.465/2017, art. 76**, que instituiu o ONR como "instituição oficial encarregada de projetar e implementar o Sistema de Registro Eletrônico de Imóveis (SREI) no país", centralizando o acesso a **todas as unidades registrais** em **um único ponto na internet**.
- **URL:** https://www.onr.org.br.
- **Público-alvo:** cidadão, empresa, notário, advogado, banco, Judiciário e Administração Pública.
- **Proposta central:** o registro de imóveis brasileiro é **uno como sistema** e **fracionado como operação** (os cartórios). O ONR existe para **padronizar, interoperar e dar ponto único de acesso** — sem extinguir a serventia.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 As sete plataformas
| Plataforma | Função |
|---|---|
| **RI Digital** | pedido e recebimento de certidão e informação registral **online**, de qualquer cartório do país |
| **Ofício Eletrônico** | canal de **comunicação formal** entre o cartório e instituições (banco, Judiciário, Administração) |
| **CNIB** | **Central Nacional de Indisponibilidade de Bens** — consulta por pessoa |
| **Penhora Online** | comunicação de penhora e averbação |
| **PGV-CNM** | geração e validação do **Código Nacional de Matrícula** |
| **Mapa ONR** | visualizador geográfico de camadas do registro e de parceiros |
| **App "Reg. de Imóveis ONR"** | acesso móvel ao RI Digital |

### 2.2 O CNM — o dado mais importante do dossiê
- **Código Nacional de Matrícula**: identificador **único e nacional** do imóvel, gerado e validado pelo PGV-CNM.
- Objetivo declarado: "assegurar a **identificação única dos imóveis**", com padronização, segurança jurídica e integração entre cartórios.
- A plataforma permite **validar um código** (há campo "Valide Seu Código Hash") e exibe um **contador público** de CNMs cadastrados.
- Em 17/11/2026 o contador exibia **95.866.215** CNMs cadastrados.

Por que isso importa: o Brasil passa a ter **duas chaves** para o mesmo imóvel — a **municipal** (cadastro/IPTU, no Recife o DSQFL de 14 dígitos) e a **nacional registral** (CNM). Nenhuma das duas é suficiente sozinha, e o produto que não diz **qual chave usou** perde a discussão de identidade.

### 2.3 CNIB — indisponibilidade por pessoa
- Consulta por **CPF/CNPJ** para saber se há **indisponibilidade** (bloqueio) decretada sobre bens daquela pessoa.
- É proteção contra fraude: o comprador verifica se o vendedor tem bens bloqueados.
- O objeto da consulta é a **pessoa**, não o imóvel — e isso é uma questão de LGPD, não de tecnologia.

### 2.4 Mapa ONR — o precedente de visualizador público
- Visualizador de camadas geográficas do registro **integradas a camadas de órgãos públicos, instituições privadas e financeiras**.
- Interface com **seleção de camadas** ("Camada para busca", "Camadas selecionadas") e zoom.
- Termo de uso obrigatório, com duas cláusulas que valem cópia:
  1. "o ONR **não se responsabiliza** pela geoinformação em camadas produzidas por órgãos públicos e/ou instituições privadas e financeiras integradas";
  2. "**tampouco pelas decisões tomadas** a partir dos dados publicados".

### 2.5 Tokenização imobiliária
O ONR mantém uma frente pública sobre **tokenização de imóvel** — sinal de que o registro está se preparando para representar participação fracionada. Não é produto, é direção.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** CNM, número de matrícula, nome/CPF/CNPJ, endereço, código de cartório, e o pedido (certidão, informação, penhora, ofício).

**Fontes cruzadas:** matrícula e livros de cada serventia, base de indisponibilidade (CNIB), sistema de penhora, cadastro de cartórios, e camadas geográficas de parceiros.

**Artefato final:** **certidão** (documento com fé pública, emitido por cartório, mediante emolumento), resposta de indisponibilidade, averbação, CNM válido, e camada no mapa.

**Ponto crítico:** o artefato final **não é dado aberto**. É documento pago, com emissor identificado e responsabilidade legal. É o oposto do modelo do VEREDA.

## 4. Mecânica de UI/UX e Visualização

- **Ponto único**: um site para todos os cartórios do país.
- **Seleção de camadas** no mapa, com termo de aceite antes de ver.
- **Contador público de CNMs** — indicador de adoção que dá credibilidade ao padrão.
- **Validação de código** como serviço de primeira classe (não é só consulta: é verificação de autenticidade).
- **App móvel** para o mesmo fluxo.
- **Disclaimer duplo** (não responsável pelo dado de terceiro; não responsável pela decisão).

## 5. Regras de Negócio e Monetização

- **Modelo:** entidade do sistema registral, financiada por **emolumentos** e pela operação do SREI; não é SaaS.
- **Gatilho:** obrigação legal e padronização nacional.
- **Moat:** monopólio legal do padrão de identificação e interoperabilidade. Não é copiável — é instituição.
- **Consequência para o mercado:** qualquer produto que precise de matrícula **depende** do ONR/cartório, e qualquer produto que queira identificar imóvel de forma estável deve adotar o CNM quando disponível.

## 6. Aplicação Direta no VEREDA

Este dossiê não é sobre um concorrente: é sobre **a chave do imóvel**. É a peça que faltava para o VEREDA parar de tratar identidade cadastral como detalhe.

### 6.1 Duas chaves, e o VEREDA precisa dizer qual usou
| Chave | Escopo | Quem mantém | O VEREDA tem? |
|---|---|---|---|
| **DSQFL** (14 dígitos) | municipal, fiscal | Prefeitura do Recife | **sim** — é a chave atual |
| **CNM** | nacional, registral | ONR | **não** |

Recomendação: todo dossiê e todo pacote deve exibir a chave usada e o que ela **não** cobre:

```
Identificação do imóvel
Inscrição municipal (DSQFL)   01.02.003.0045.001.0001-2
Registro de imóveis            não vinculado — peça a matrícula ao vendedor
```

Essa linha resolve três problemas de uma vez: (a) deixa claro que cadastro municipal não é registro; (b) cria o gancho para o usuário trazer a matrícula (que o `LeitorDeAta` lê); (c) evita que o VEREDA seja confundido com certidão.

### 6.2 O CNM deve ser campo opcional no `LeitorDeAta`
Quando o usuário colar uma matrícula, o leitor deve tentar extrair o **CNM** e a **matrícula/registro**. Com isso:
- o imóvel ganha uma **segunda chave** e passa a ser comparável fora do Recife;
- o pacote pode dizer "matrícula 45.231, CNM …";
- no futuro, qualquer verificação registral usa a chave certa.

### 6.3 A lição de CNIB é de privacidade, não de feature
A CNIB consulta **pessoa**. O VEREDA não deve fazer consulta por CPF — nem local, nem em tela. Se o usuário quiser checar indisponibilidade do vendedor, o caminho correto é **orientá-lo a consultar a CNIB** (link e o que significa), sem o VEREDA intermediar. Isso mantém o produto fora do território de dado pessoal e ainda entrega valor.

### 6.4 O termo do Mapa ONR é o modelo do rodapé do VEREDA
Duas frases, copiadas na estrutura (não no texto):

> Este produto reúne dados de fontes públicas e privadas identificadas em cada camada. Não nos responsabilizamos pelo dado de terceiro nem pelas decisões tomadas a partir dele.

Isso complementa o disclaimer do Docket (`app20`, §6.3) — e, junto, forma o padrão mínimo de compliance do produto.

### 6.5 Contador público como sinal de adoção
O ONR publica "quantos CNMs existem". O VEREDA pode publicar os seus: **7.206 edifícios, 72 bairros, 2.825 edifícios em seis áreas, 15 telas, 2,3 GB de camadas**. Números de inventário criam confiança e são honestos — desde que atualizados.

### 6.6 O que **não** copiar
- **Emitir certidão**: é do cartório, com fé pública e emolumento.
- **Consultar indisponibilidade por CPF**: dado pessoal.
- **Intermediar pedido registral**: o Docket já faz (`app20`); o VEREDA não deve.
- **Mapa de camadas de parceiros privados**: o VEREDA trabalha com fonte pública identificada.
- **Tokenização**: fora de escopo e sem base jurídica madura para o comprador final.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Linha "duas chaves" no dossiê e no pacote | nenhum | pequeno |
| Extração de CNM/matrícula no `LeitorDeAta` | nenhum | pequeno |
| Orientação sobre CNIB (texto + link) | nenhum | pequeno |
| Rodapé de responsabilidade (com `app20`) | nenhum | pequeno |
| Contador público de inventário | nenhum | pequeno |
