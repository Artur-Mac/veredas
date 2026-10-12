# PropSight

Verificação sob demanda de um único anúncio de apartamento em Recife, que entrega ao usuário o que se sabe, o que o anúncio declara e o que ainda precisa ser confirmado sobre aquele edifício.

## Language

### Produto

**Anúncio**:
A publicação de um imóvel em um portal ou site, identificada pela URL ou pelo texto compartilhado pelo usuário. É a entrada do produto.
_Avoid_: Listing, oferta

**Dossiê**:
O artefato de saída de uma verificação: o conjunto ordenado de cartões sobre um anúncio e seu edifício. Não contém veredito nem nota.
_Avoid_: Relatório, check, análise, laudo

**Cartão**:
A unidade mínima do dossiê. Cada cartão carrega um único claim com categoria de confiança, fonte, data, escala espacial e ação sugerida.
_Avoid_: Insight, alerta, item

### Identidade

**Edificação cadastrada**:
Uma edificação do cadastro municipal do Recife, identificada pelo seu código de 14 dígitos (distrito fiscal, setor, quadra, face, lote) e seu endereço oficial.
_Avoid_: Prédio do cadastro, footprint, polígono

**Edifício resolvido**:
Estado de um anúncio associado a exatamente uma edificação cadastrada e seu lote, por confiança alta do resolvedor ou por confirmação do usuário. Só um anúncio resolvido recebe cartões de escala edifício ou lote.
_Avoid_: Prédio identificado, match, geocodificado

**Confirmação do edifício**:
O toque do usuário escolhendo, entre candidatas no mapa, a edificação do anúncio. É a única entrada obrigatória além do anúncio e é registrada como origem humana da resolução.
_Avoid_: Validação, correção, rótulo

**Modo rua**:
Dossiê de um anúncio não resolvido: contém apenas cartões cuja escala é rua, microárea ou bairro, e declara que o edifício não foi identificado.
_Avoid_: Modo degradado, fallback

### Confiança

**Declarado pelo anunciante**:
Categoria de confiança para toda informação extraída do anúncio e ainda não verificada por outra fonte.
_Avoid_: Dado do anúncio, informação do corretor

### Documentos e créditos

**Leitor documental**:
Capacidade que lê atas, balancetes e convenção enviados pelo usuário e devolve eventos (obra, cota extra, inadimplência, litígio, manutenção) com página, trecho, data e status aparente. Nunca emite diagnóstico.
_Avoid_: Análise de documentos, auditoria, parecer

**Feedback pós-visita**:
Relato curto do usuário, depois de visitar o imóvel, sobre o que o dossiê acertou, errou ou deixou de dizer. É o primeiro ground truth do produto.
_Avoid_: Avaliação, review, comentário

**Crédito**:
Unidade de consumo de um dossiê. Há uma cota inicial gratuita; créditos são comprados ou ganhos por confirmação do edifício e por feedback pós-visita, nunca por envio de documentos.
_Avoid_: Token, consulta, moeda
