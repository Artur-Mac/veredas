# Leitura do link no celular: o bloqueio dos portais e os caminhos sem formulário

Decisão do arquiteto, 20/10/2026, depois do primeiro teste num celular de verdade. Requisito do produto: a pessoa cola o link e já tem os dados do imóvel, sem preencher um formulário grande (Fatia 2B da [ordem](../../handoff/ORDEM_DO_ARQUITETO.md)).

## O que o teste mostrou

- No Expo Go, um link do ZAP abriu na WebView a página "Sorry, you have been blocked", da Cloudflare, com o título "Attention Required! | Cloudflare".
- O app tratava esse título como desafio ("O portal pediu uma verificação. Complete na página abaixo.") e esperava 120 s. Mas não havia verificação a completar: era bloqueio.
- O bloqueio é uma regra do portal contra apps de terceiros. Vale para ZAP, VivaReal e OLX, que são do mesmo grupo. A leitura pelo servidor já recebia 403 (ver [02](02-APIS-E-FORNECEDORES.md)).
- O link sozinho ainda rende tipo, quartos, área, bairro e código do anúncio (ZAP e VivaReal). Faltam preço, condomínio e IPTU.

## O que mudou no app

Mudança na branch `vereda/v1.0`, ainda sem commit.

| Mudança | Onde | Efeito |
|---|---|---|
| Bloqueio separado do desafio | `componentes/leitor/coletor.ts` (`paginaBloqueada`), `decidir.ts` (motivo `bloqueio`) | O app desiste na hora, sem pedir verificação impossível nem esperar prazo. A página bloqueada sai da tela. |
| "Abrir no navegador" | `app/(abas)/ler.tsx` | Abre o anúncio na aba do Safari (iOS) ou do Chrome (Android), que é o navegador de verdade, sem disfarce. A pessoa copia o trecho com os preços e volta. O app lê a área de transferência uma vez. |
| Filtro do que foi copiado | `dados/extrator/copiado.ts` | Só passa texto com valor em reais ou área. O resto (senha, conversa, endereço) é descartado sem aparecer nem ser guardado. |
| "Colar o que copiei" | `ler.tsx` | Um toque lê a área de transferência, se a leitura automática não pegou. |
| Formulário enxuto | `componentes/revisao/FormularioDeRevisao.tsx` (`essencial`) | Na leitura de um link aparecem só modalidade, bairro, preço, condomínio e IPTU. O resto fica em "Ver todos os campos", com a contagem de avisos. Em branco vira pergunta para a visita, e o IPTU do cadastro aparece quando o prédio é confirmado. |

O fluxo num portal que bloqueia passa a ser: colar o link, tocar em "Abrir no navegador", selecionar e copiar o trecho dos preços, voltar e conferir três números. Antes era o formulário inteiro, com 16 campos de digitar.

Verificação: tipos e lint limpos, 1.160 testes (3 falhas são da camada "rua" da v1.1, em construção em outra sessão) e o smoke da v1 nas 43 etapas.

## O que ainda não foi verificado no aparelho

1. Se a aba do navegador passa pelo bloqueio do ZAP, do VivaReal e da OLX. A expectativa é que sim, porque é o Chrome ou o Safari de verdade, mas só o teste diz.
2. A leitura automática na volta, no Android 10 ou mais novo. O sistema só entrega a área de transferência ao app com foco, por isso há uma espera de 0,5 s e o botão "Colar o que copiei".
3. No iOS 16 ou mais novo, o sistema pergunta "Permitir colar?" a cada leitura. É comportamento do sistema; não há como evitar sem o botão de colar nativo.
4. Se o QuintoAndar abre na WebView. Ele não é do mesmo grupo e provavelmente não bloqueia.

## Caminhos para zerar o atrito, em ordem de recomendação

| # | Caminho | Gestos da pessoa | Custo | Requer | Observação |
|---|---|---|---|---|---|
| 1 | **Compartilhar para o Vereda.** No iOS, uma extensão de compartilhamento do Safari roda um JavaScript de pré-processamento na página que a pessoa está vendo e devolve o texto e o JSON-LD. No Android, "Processar texto" põe o Vereda no menu de seleção. | 2 (compartilhar, Vereda) no iOS; 3 no Android (selecionar, Vereda) | 1 a 2 semanas; conta Apple (US$ 99/ano) e Google Play (US$ 25 uma vez) | Build de desenvolvimento (EAS), não roda no Expo Go | É a leitura que a pessoa já está fazendo, no navegador dela. O compartilhar do Chrome no Android manda só o link e o título, por isso "Processar texto". |
| 2 | **Captura de tela com leitura de texto (OCR).** A pessoa captura a tela do anúncio e escolhe no Vereda. | 2 a 3 | OCR no aparelho (ML Kit) sem custo por uso; modelo de visão no servidor custa por imagem e leva a imagem para fora do aparelho | Build de desenvolvimento para o ML Kit | Funciona em qualquer portal e também **dentro do app do ZAP**, onde muita gente procura e de onde o compartilhar só manda o link. |
| 3 | **Extensão de navegador no computador** | 1 | Baixo; loja do Chrome com taxa única | Publicação na loja | Resolve a web, mas a busca de imóvel é sobretudo no celular. |
| 4 | **Parceria de dados** com o grupo dos portais ou com sistemas de imobiliárias que já enviam os anúncios aos portais | 0 | Negociação | Contrato | Única forma de ler sem gesto nenhum. Condições a verificar. |

**Atualização, 20/10/2026:** o item 1 está no código, à espera do build e do teste no aparelho. Ver [08](08-COMPARTILHAR-PARA-O-VEREDA.md).

Recomendação: manter o caminho de hoje na v1.0 e fazer o item 1 na v1.1, junto com o primeiro build próprio do app, que a publicação nas lojas exige de qualquer forma. O item 2 entra quando o teste mostrar quanta gente procura pelo app do portal.

## Revisão com a pesquisa de viabilidade do usuário (20/10/2026)

O usuário trouxe uma pesquisa sobre a viabilidade técnica e jurídica da leitura por compartilhamento. O que entrou e o que não entrou:

| Recomendação da pesquisa | Decisão | Por quê |
|---|---|---|
| `about:blank` e `about:srcdoc` na lista de origens da WebView | **Feito** | Conferido no código da biblioteca: no iOS, cada quadro interno passa pelo filtro, e o `about:srcdoc` do desafio era recusado. Quadros internos agora carregam livres; a página continua presa ao portal. |
| Cookies e armazenamento ligados | **Feito em parte** | Armazenamento e JavaScript já vinham ligados. Os cookies de terceiros estavam desligados e agora seguem o padrão do Chrome. Os cookies da WebView continuam separados do navegador da pessoa. |
| User agent nativo, sem troca | Já era assim | Um teste confere. |
| `mixedContentMode="always"` | Não | Abre a página a conteúdo sem HTTPS, e o desafio não precisa disso. |
| Filtrar telefone, e-mail e CRECI antes da leitura | **Feito** | `dados/extrator/privacidade.ts`, dentro de `extrairDoTexto`: vale para colar, copiar, compartilhar e a página. Testes conferem que preço, área, CEP e ano ficam intactos. |
| Extensão do Safari com pré-processamento | No código | Ver [08](08-COMPARTILHAR-PARA-O-VEREDA.md): falta o build próprio e o teste no aparelho. |
| Leitura do texto livre por modelo de linguagem | Depois | Pega o nome do prédio escondido na descrição e as contradições, mas custa por anúncio e tira o texto do aparelho. Com o filtro de dados pessoais pronto, o risco cai. Candidato à v1.2. |
| Análise jurídica (LDA, LPI, LGPD) | Registro, não parecer | Reforça o que o produto já faz: leitura de um anúncio por vez, no aparelho, só campos do imóvel, nunca contornar proteção. A frase "descaracteriza qualquer infração" vai além do que a pesquisa sustenta: os termos de uso continuam sendo um contrato. O parecer segue pendente. |

A pesquisa não muda o principal: a página "Sorry, you have been blocked" é um bloqueio por regra do portal, não um desafio. Configuração nenhuma da WebView passa por ela sem disfarçar o app, e isso não se faz.

### Quanto vai ser "colar o link e pronto"

Estimativa sem dado de uso. O projeto não tem a fatia de cada portal no Recife, então os números abaixo são hipóteses a medir.

Hipótese de origem dos links: ZAP, VivaReal e OLX, juntos, de 55% a 70%; QuintoAndar de 20% a 30% (mais no aluguel); outros sites de 10% a 15%. iPhone em 25% a 35% do público da pesquisa (jovens profissionais e estudantes).

| Nível | O que a pessoa faz | Parte dos links (estimativa) |
|---|---|---|
| Só colar o link, a página é lida no app | Nada além de colar | **25% a 40% hoje** (QuintoAndar e sites que não bloqueiam) |
| Compartilhar do Safari ou "Ler no Vereda" no Android, ou o navegador com cópia | 2 ou 3 toques, sem digitar | **70% a 85%** com o build próprio |
| Digitar um número ou deixar em branco | Um a três campos | O restante, mais todo anúncio que não diz o condomínio ou o IPTU |

Os dados agregados (cadastro, IPTU do prédio, ITBI, obras, a rua) não dependem dessa leitura. Dependem do bairro e do prédio, e o link do ZAP e do VivaReal já traz bairro, tipo, quartos e área no próprio endereço. A leitura muda quanto a pessoa digita, não se o dossiê sai.

Como medir: o teste no celular com os quatro portais; a contagem de anúncios de aluguel nos cinco bairros em cada portal; e, na próxima pesquisa, a pergunta "em qual site ou app você encontrou o imóvel?".

## O que não fazer

- Trocar o user agent da WebView para se passar pelo Chrome. O teste do leitor confere que ele não é trocado.
- Proxy residencial, navegador "furtivo", resolver desafio anti-robô automaticamente, serviço que promete "passar pela Cloudflare".
- WebView escondida ou leitura pelo servidor.

Tudo isso contorna uma proteção que o portal pôs de propósito, viola os termos, pode ser tratado como acesso indevido e quebra a cada mudança da regra. Já está em "Fora, por decisão" no [roadmap](05-ROADMAP-PROXIMAS-VERSOES.md).

## Como testar no celular

1. No terminal: `source ~/.nvm/nvm.sh` e `npx expo start`. Abra no Expo Go.
2. Cole um link do ZAP. Esperado: o cartão "Abra o anúncio no navegador", sem a página bloqueada e sem o aviso de verificação.
3. Toque em "Abrir no navegador". No anúncio, selecione o trecho de aluguel, condomínio e IPTU, copie e feche a aba.
4. Esperado: "Lemos o texto que você copiou", com os três números preenchidos e a etiqueta "do anúncio".
5. Repita com um link do VivaReal, um da OLX e um do QuintoAndar. Anote para cada um: abriu na WebView, bloqueou, abriu no navegador, a leitura na volta funcionou.
