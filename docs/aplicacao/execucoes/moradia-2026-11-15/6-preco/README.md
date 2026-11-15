# Preço: qual fonte prova um fechamento

Verificação feita em 15/11/2026, sem login, sem aceitar termos e sem comprar nada. Os arquivos estão em [preco-registro-2026-11-15](../../../../dados/raw/preco-registro-2026-11-15/), com manifesto.

## Os quatro valores e o que cada um prova

| Valor | Rótulo no app ([tiposDeValor.ts](../../../../../src/dados/tiposDeValor.ts)) | Fonte | Estado |
|---|---|---|---|
| Preço pedido / aluguel pedido | "Preço pedido no anúncio" / "Aluguel pedido no anúncio" | Anúncio lido pela pessoa; piloto ZAP/Óleo por bairro | **No app** (`anuncio.preco_pedido`, `anuncio.aluguel_pedido`). |
| Avaliação fiscal do ITBI | "Avaliação fiscal do ITBI (não é preço de venda)" | ITBI do Recife, ODbL, CSV de 2015 a 2026 | **No app**, como mediana por prédio em 36 meses, nunca por m². Já dito como "avaliação fiscal, não preço de mercado". |
| Preço registrado de venda | "Preço registrado na matrícula" | Ato R-n da matrícula (Registro de Imóveis) | **Fora do app.** Caminho legítimo identificado; não há amostra autorizada. |
| Aluguel contratado | "Aluguel contratado" | Contrato ou base contratual autorizada | **Fora do app.** Nenhuma fonte aberta. |
| Leilão | "Valor de leilão (outro mercado)" | Edital e resultado | Recorte próprio; não se mistura com os outros. |

Um teste garante que tipos diferentes nunca viram uma diferença ("desconto") calculada pelo app ([tipos-de-valor.test.ts](../../../../../tests/tipos-de-valor.test.ts)).

## ITBI do Recife: o que o arquivo aberto tem e o que não tem

- **Campos:** logradouro, número, complemento, `valor_avaliacao`, bairro, área, fração ideal, padrão, tipo, `data_transacao`, `sfh`, cod_logradouro, lat/lon, ano. O arquivo de 2026 tem 15.078 linhas, de 05/01 a 31/10/2026.
- **Valor declarado:** não existe. O arquivo traz só o valor de avaliação. Por isso o ITBI aberto **não prova preço de venda**.
- **Sequencial do imóvel:** aparece no dicionário como "criptografado", mas não está em nenhum CSV publicado (conferido em 2015, 2025 e 2026). O vínculo à unidade só pode ser feito por endereço, complemento, data e fração.
- **Campo `sfh`:** preenchido em cerca de 39% das linhas. Parece ser a parte financiada pelo SFH, mas isso não foi verificado.
- **Privacidade:** o complemento traz o número da unidade. O app usa o ITBI agregado por prédio e nunca expõe uma linha individual.

## Mapa do ONR e Provimento 195 do CNJ

- **Mapa do ONR** (<https://mapa.onr.org.br/>, a partir de <https://www.registrodeimoveis.org.br/servicos/mapa>):
  - A página do serviço diz que o mapa mostra as últimas vendas, a matrícula, o cartório responsável e o valor final da última transação, e que ainda está cadastrando cidades.
  - O código da camada de transações chama-se `CamadaItbiSP`. Para o Recife, só apareceram camadas cadastrais (lotes, edificações com DSQFL, logradouros, quadras e bairros), sem campo de preço.
  - **Não foi verificado se há camada de preço para o Recife**: a lista completa só carrega depois de aceitar os Termos de Uso, o que não foi feito.
- **Provimento 195/2025 do CNJ** (<https://atos.cnj.jus.br/atos/detalhar/6151>):
  - **Art. 343-J, V e §1:** cria a "informação eletrônica sobre negócios do mercado imobiliário". Por transação, traz data, preço, fração transacionada, tipo de ato, matrícula e endereço, sem dados pessoais (LGPD). O custo é o menor entre um pedido de busca e 1/20 da certidão digital.
    - **É o caminho legítimo para o "preço registrado" em escala.** Não foi verificado se o serviço já funciona nem se cobre o Recife.
  - **Art. 5:** os cartórios mandam ao ONR, todo mês, os atos registrados para formar índices.
  - **Art. 343-B:** a divulgação pública mínima trata de imóveis rurais e georreferenciamento, sem indicador de preço.

## Consulta no Recife, cobertura e custo

O Recife tem **7 Registros de Imóveis** (Lei PE 14.504/2011, art. 6). A lei define os limites por rios e avenidas, não por bairro. Por isso, a relação bairro → cartório não está verificada. Confirme caso a caso na "Busca cartórios" do RI Digital ou no próprio cartório.

| Serviço (RI Digital/SAEC; exige login ou certificado) | O que devolve | Custo (Prov. 127/2022 + tabela do TJPE de 2026) |
|---|---|---|
| Visualização de matrícula | Imagem da ficha da matrícula, com a situação até 3 dias úteis antes. Não vale como certidão. | 1/3 da certidão; estimativa ≈ R$ 78 de emolumentos (**não verificado** no simulador oficial) |
| Certidão digital de inteiro teor | Fé pública, vale 30 dias | Equivale à certidão vintenária de 6 páginas; estimativa ≈ R$ 234,58 de emolumentos, mais TSNR, selo e ISS (**não verificado**) |
| Informação de mercado (art. 343-J, V) | Data, preço, fração, tipo, matrícula e endereço | Menor valor entre o pedido de busca e 1/20 da certidão; estimativa ≈ R$ 11,73 por transação (**não verificado**; serviço não localizado) |

O simulador oficial de taxas (<https://www.ridigital.org.br/ConsultaTaxas/frmConsultaTaxas.aspx>) pede preenchimento de formulário. O valor exato deve ser confirmado lá pelo titular.

## Protocolo para uma amostra autorizada

1. **Consentimento:** consentimento escrito do vendedor ou do comprador. Do documento, guardar só o hash; nomes e CPF são descartados na leitura.
2. **O que ler:**
   - cartório (CNS) e número da matrícula;
   - endereço, unidade e fração ideal;
   - inscrição municipal (sequencial ou CIF);
   - do último ato R-n de compra e venda: tipo, data do registro, data do título, valor declarado, valor fiscal se constar, e se há alienação fiduciária (financiamento).
3. **Vínculo à unidade:**
   - sequencial do IPTU citado na matrícula, depois DSQFL no cadastro municipal (índice do VEREDA);
   - depois a linha do ITBI por endereço, complemento, `data_transacao` (até 60 dias antes do registro) e fração ideal.
   - Mais de uma linha candidata = **vínculo ambíguo**: a amostra fica fora do teste e é contada.
4. **Preço registrado** = valor de compra e venda declarado no R-n, numa transação onerosa simples com fração de 100% (ou proporcional). **Excluir:** permuta, doação, dação, integralização, leilão e venda em bloco.
5. **Teste:** para cada amostra válida, gravar lado a lado o preço pedido (se houver anúncio salvo), a avaliação do ITBI e o preço registrado, cada um com o seu rótulo. O app **não calcula** desconto entre tipos diferentes.

## O que a matrícula prova e o que não prova

- **Prova:** o tipo de ato, a data do registro, a fração transmitida e o valor declarado no título.
- **Não prova:**
  - o preço de mercado;
  - a data do acordo (só a do registro);
  - pagamentos fora do contrato, permutas ou pacotes de várias unidades;
  - nada sobre aluguel.

## ZAP/Óleo e leilões

- **ZAP/Óleo:** o piloto de oferta (medianas de primeiras páginas por bairro) continua como referência agregada de preço pedido, conforme permissões. Não se publica P25/P50/P75 sem amostra que sustente o cálculo.
- **Leilões:** ficam num universo próprio (CAIXA, editais judiciais), só quando o edital corresponde ao próprio imóvel.

## Nota de segurança

Na coleta, a página do Mapa do ONR trouxe chaves públicas do próprio site (Google Maps e reCAPTCHA, do ONR). Elas foram apagadas da cópia salva, e uma busca no diretório novo confirmou que não ficou nenhuma. Arquivos antigos de `docs/dados/raw/google-maps/` e `docs/dados/raw/leiloes/` têm textos com formato de chave de site embutidos nas páginas salvas. Não foram alterados; ficam para o titular decidir.
