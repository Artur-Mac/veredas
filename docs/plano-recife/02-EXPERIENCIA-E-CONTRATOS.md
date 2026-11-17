# 02 — Experiência e contratos de interface

## Jornada e arquitetura da informação

O produto responde, nesta ordem: **qual imóvel estou considerando; o que já sei; quanto compromete meu orçamento; o que preciso confirmar; como comparar e decidir**. As fontes enriquecem essas respostas. Nomes de bases e fornecedores não viram itens de navegação principal.

Manter as quatro entradas principais atuais: Explorar, Dossiê, Comparar e Visita. Salvos é o caderno acessível pelo cabeçalho e pelos fluxos vazios. Manter no dossiê Destaques, Entorno e Edifício. Antes de mudar estrutura ou interação, comparar com `index.html`; ele é a referência exclusiva de identidade e experiência, não uma base de fatos. Adaptar a expansão funcional sem transplantar imóveis/números demonstrativos.

| Local | Conteúdo principal | Conteúdo secundário / ação |
|---|---|---|
| Explorar | Retomar rascunho, adicionar por link/texto/imagem/manual | Dados cobertos no Recife, importação, acesso ao caderno |
| Salvos | Imóveis, situação pessoal, mensal conhecido, pendências | Filtrar, comparar, restaurar descartados, exportar |
| Dossiê / Destaques | Identificação com grau de precisão, mensal conhecido, até três questões prioritárias | Abrir orçamento/cenários; preparar visita; demais achados expansíveis |
| Dossiê / Entorno | Rua e ambiente; serviços; mobilidade | Mapa com uma camada selecionada, legenda e lista equivalente |
| Dossiê / Edifício | Cadastro, cronologia, documentos apresentados | Pedir documento, registrar resposta, ver origem e divergência |
| Visita | Preparar → no imóvel → resumo | Instrumentos opcionais por cômodo; histórico de sessões |
| Comparar | Dois imóveis por padrão, terceiro opcional | Escolher assunto, abrir origem, diferenças e pendências |
| Ajustes / Dados | Backup, arquivos, fontes, permissões | Conta opcional, recursos experimentais e profissional quando disponíveis |

Não criar uma aba por API. Em Entorno, apresentar grupos recolhíveis; mapa e lista compartilham seleção. A pessoa deve encontrar uma informação em até um grupo temático após a aba, sem árvore de submenus. Um novo cartão precisa justificar uma decisão ou uma pergunta; informação sem uso demonstrável permanece no detalhe de fonte ou no experimento.

## Hierarquia visual

Usar os componentes de `src/componentes/casca/`, os tokens de `src/tema/tokens.ts` e o vocabulário existente em `src/componentes/dossie-v1/textos.ts`. Conferir o protótipo raiz antes de alterar componentes. Referência: papel `#F2EBDD`, superfície `#FFFFFF`, texto `#171717`, laranja `#F47745`, ferrugem `#B94E36`, azul cadastral `#2E5A85`; Fraunces, Plus Jakarta Sans e JetBrains Mono nos papéis do protótipo. Não introduzir paleta ou biblioteca de componentes paralela.

- Cabeçalho compacto com identificação e estado de salvamento; ações principais têm um verbo claro. Uma ação primária por etapa, secundárias em texto/menu contextual.
- Nome longo quebra em linhas; endereço, prédio e apelido pessoal são campos distintos. Não diminuir a fonte para caber nem depender de tooltip.
- Resumo primeiro; origem, método e limitações no detalhe alcançável por teclado. Não usar bloco de ressalvas repetido em todos os cartões.
- Cor não é o único significado. Evitar vermelho/verde como julgamento do imóvel. Usar “confirmar”, “informado”, “sem informação” e “referência de 2022”.
- Animação é discreta e respeita redução de movimento. Não tocar no código de motion do pitch.
- Fotos são próprias e opcionais. Sem foto, usar composição tipográfica útil, sem imagem de outro imóvel.

## Contrato comum de evidência

Cada apresentação tem: título/pergunta, valor ou estado explícito, unidade, alcance espacial, período de referência, origem e ação compatível. O resumo pode omitir detalhes que permanecem acessíveis. Uma ficha de origem mostra fornecedor/base, URL pública quando cabível, data de referência, consulta, transformação, precisão e limitações.

Exemplos de linguagem obrigatória:

| Situação | Texto permitido | Texto vedado |
|---|---|---|
| Aluguel 2.500, condomínio 600, IPTU/seguro ausentes | “Mensal conhecido R$ 3.100 · faltam IPTU e seguro” | “Custo total R$ 3.100” |
| Correspondência de endereço | “Rua e número coincidem; nome diverge” | “92% de certeza” derivado de pontos |
| Entrada só por bairro | “Informe rua/número para procurar o prédio” + “Continuar sem prédio” | Escolher candidato só porque teve maior pontuação |
| CNEFE | “Estabelecimento de ensino registrado no Censo 2022” | “Escola funcionando hoje ao lado” |
| GTFS | “Partidas programadas para terça-feira” | “Ônibus passa pontualmente a cada X minutos” |
| Laudo | “Último documento apresentado: inspeção em…” | “Prédio seguro” ou “última inspeção existente” |
| Ausência de ocorrência | “Nenhum registro nesta fonte e período” | “Rua sem alagamento/barulho/crime” |

## Estados que todo módulo deve implementar

1. **Disponível:** fato contextualizado, fonte e ação.
2. **Parcial:** partes conhecidas visíveis; pendências nomeadas. Zero informado continua zero.
3. **Sem cobertura:** informar qual região/fonte falta e oferecer observação/pergunta; não procurar indefinidamente.
4. **Desatualizado:** preservar período e permitir consulta/registro novo; não renomear como atual porque foi baixado hoje.
5. **Carregando:** manter conteúdo anterior identificado, impedir confirmação duplicada, não bloquear todo o caderno.
6. **Erro:** separar falha de leitura, gravação, preferência e fornecedor. Permitir repetição segura e preservar edição.
7. **Não aplicável:** escolha explícita com motivo opcional, sem converter em desconhecido.
8. **Sem permissão/capacidade:** alternativa manual; não repetir solicitação de permissão em loop.

Estado da base e estado do item pessoal são independentes: a fonte pode estar disponível e a pergunta ainda pendente; a pessoa pode ter uma resposta local mesmo com a API fora do ar.

## Contratos de interação por fluxo

**Cadastro:** aceitar incompleto; passos curtos por identidade, negócio/custos e revisão. Salvar rascunho recuperável. Origem por campo e conflitos antes da substituição. Voltar preserva entradas. Cancelar não apaga uma análise existente. Repetir compartilhamento mostra a proposta existente, não duplica automaticamente.

**Identificação:** mostrar motivos, contagem total antes do limite e alternativas. Destacar precisão de localização separada da associação a um prédio. Confirmação deliberada mantém a cobrança única vigente; visualizar/tentar candidatos não cobra. Sem prédio confirmado, custos, caderno e visita continuam.

**Orçamento:** mensal conhecido na superfície principal. Detalhe separa mensal recorrente, desembolso inicial, valor imobilizado reembolsável e preço de aquisição. Cenário tem nome, entradas editáveis e data; não modifica silenciosamente o dado do anúncio.

**Entorno:** distância em linha reta rotulada; não dizer “a pé” sem rota. Um filtro ativo mostra o que está e o que não está contado. Selecionar ponto abre origem e pergunta útil, não uma ficha cadastral enorme. Denominador e período ficam junto de percentuais.

**Documentos:** lista por tipo/data com status “solicitado”, “recebido”, “lido”, “a confirmar”. Registrar data de inspeção separada da emissão. Leitor abre a página do achado. Um documento anexado não vira evidência oficial automaticamente.

**Visita:** abrir sem rede, retomar sessão, salvar a cada confirmação serializada. Registrar cômodo, horário e contexto sem exigir sensor. Respostas anteriores aparecem com data; nova visita não as sobrescreve. Sensores são ferramentas opcionais e nunca bloqueiam conclusão.

**Comparação:** linhas de mesma semântica e unidade, células ausentes explícitas. Em 360 px usar seleção de assunto e cartões alinhados, ou tabela com primeira coluna preservada e rolagem indicada; testar alternativa, não comprimir três colunas ilegíveis. Não escolher vencedor automaticamente.

**Compartilhamento:** selecionar conteúdo, pré-visualizar, copiar/abrir compartilhamento e deixar envio para a pessoa. Assinatura padrão “Mensagem preparada com o VEREDA.” editável no texto. Não adicionar notas privadas, arquivos ou localização de visita por padrão. Cancelamento não conta como envio.

## Acessibilidade e revisão visual obrigatórias

Verificar 375×812, 1280×900 e 360 px; nome longo; dados incompletos; texto ampliado a 200%; teclado físico e virtual; leitor de tela nos fluxos alterados. A ampliação não pode ocultar botões ou prender a pessoa em gaveta. Foco retorna ao acionador ao fechar modal, Esc/voltar funciona, foco permanece visível. Manter comportamento de setas/Home/End nas abas quando já existente.

Alvos de toque: pelo menos 44 pt no iOS e 48 dp no Android; web com área equivalente confortável. Contraste mínimo WCAG AA para texto/controles aplicáveis, verificado sobre as cores reais. Respeitar áreas seguras e teclado; ação final permanece alcançável por rolagem. Ícones têm rótulo acessível. Mapa nunca é a única maneira de obter informação.

Para cada época de interface, salvar captura antes/depois com fixture identificada, abrir e examinar os arquivos. Registrar três problemas observados ou declarar explicitamente que não encontrou problemas nas capturas examinadas, sem inventar defeitos. Teste automatizado não substitui essa inspeção. Ver matriz completa no documento 07.
