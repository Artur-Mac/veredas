# 03 — Arquitetura e contratos de dados

## Partir do código, sem reconstrução de conveniência

Baseline observado: Expo 57, React Native 0.86, Expo Router, Zod, AsyncStorage; contratos ativos em `src/dados/contratos.ts`, com `AnaliseV2` estrito; estado em `src/estado/Analises.tsx`; derivadores de custos e comparação existentes. `src/dados/esquema.ts` e especificações antigas não substituem esse contrato. Conferir versões no lockfile ao executar, pois o checkout pode avançar.

Evoluir por funções puras de domínio, adaptadores de armazenamento/fornecedor e componentes existentes. Não introduzir FastAPI, PostGIS, banco móvel, fila remota ou nova navegação como pré-requisito geral. Um servidor só é necessário quando houver segredo, autorização central, sincronização, pagamento ou operação que justifique isso. Módulos citados como novos nas épocas são sugestões, não arquivos já existentes.

## Identidades separadas

| Entidade | Chave e relação | Regra |
|---|---|---|
| Análise pessoal | ID local estável | Pode existir sem anúncio, prédio ou conta |
| Anúncio | ID/fonte/URL normalizada e snapshots | Duas URLs podem tratar do mesmo imóvel; deduplicação é revisável |
| Lote cadastral | DSQFL e município | Não equivale automaticamente a torre, condomínio ou unidade |
| Prédio/torre | ID do índice + vínculo de lote | Associação pode ser ambígua; preservar alternativa |
| Unidade | Campos informados, relação opcional | Área privativa não vira área cadastral total |
| Condomínio/pessoa jurídica | CNPJ textual e confirmação de identidade | CNPJ não é prova isolada do imóvel; aceitar evolução alfanumérica |
| Visita | UUID, análise, início/fim/contexto | Múltiplas sessões; data desconhecida legada não vira data de migração |
| Observação/resposta | UUID, pergunta, visita opcional, origem | Histórico append-only lógico; correção referencia versão anterior |
| Evidência pública | ID estável composto de fonte/registro/versão | A mesma evidência não gera perguntas duplicadas |
| Documento privado | UUID, análise, arquivo, tipo, datas | Datas de inspeção/emissão/registro/consulta distintas |
| Cenário | UUID, versão, entradas e hipóteses | Resultado derivado; não sobrescreve fatos |

Não armazenar todas essas entidades como arrays gigantes dentro de cada análise. Primeiro medir o caderno atual; manter metadados leves na análise e coleções/arquivos com referências quando o volume exigir. Uma mudança de armazenamento exige comparação, migração e ensaio de falha, não apenas preferência por tecnologia.

## Representação de fatos, ausência e tempo

Reusar `Fato`, `Pergunta`, `Achado` e `VisaoDoDossie`, estendendo somente o necessário. Proposta semântica a adaptar aos tipos existentes:

```ts
type EstadoValor = 'conhecido' | 'desconhecido' | 'nao_aplicavel';
type PrecisaoEspacial = 'unidade_informada' | 'predio' | 'lote' |
  'endereco' | 'logradouro' | 'face' | 'setor' | 'bairro' | 'municipio';
// Campo conhecido exige valor válido; 0 é um valor. Ausência não usa 0/NaN/"".
// A origem deve distinguir anúncio, cadastro, pessoa, visita, documento e derivação.
```

Toda derivação deve listar IDs das entradas, versão do método, unidade e hipóteses. Registrar `referenciaInicio/referenciaFim`, `publicadoEm` quando conhecido, `obtidoEm` e `observadoEm` separadamente. Não inventar data ausente. Distância em metros, dinheiro em centavos inteiros, percentuais com escala declarada; arredondar somente na apresentação quando possível.

Precisão não é probabilidade. Qualidade de coordenada, critério de associação e confiança de OCR são campos distintos. Um score ordinal do buscador nunca se converte em porcentagem de chance do prédio estar certo.

## Persistência e evolução do caderno

1. Preservar serialização existente. A gravação da lista é o resultado principal; preferência de análise ativa é recuperável e não provoca rollback da lista.
2. Se o novo recurso couber no contrato existente, não migrar por estética. Quando necessário, introduzir versão v3 explícita, com migrador puro, fixture legada e armazenamento de recuperação.
3. Migração proposta: ausência de v3 → ler v2 → validar → migrar em memória → validar v3 → gravar chave nova → reler/verificar → promover autoridade para v3. Manter v2 como recuperação. Falha em qualquer passo não apaga nem regrava o original.
4. Se v3 existe mas é inválido, oferecer recuperação em modo seguro; não carregar silenciosamente v2 desatualizado e sobrescrever v3. Versão futura desconhecida permanece intacta, com exportação dos bytes originais.
5. Não fazer dual-write permanente sem protocolo explícito. Evitar alterações simultâneas de carteira e análise como se AsyncStorage oferecesse transação entre chaves.
6. Importação valida em área temporária; mostra contagem, colisões e estratégia. Mesmo ID/conteúdo igual é idempotente; conflito permite manter ambos ou escolher após revisão. Créditos não são importados como dinheiro.
7. Exclusão de análise solicita confirmação clara, preserva possibilidade de restauração definida e só remove arquivos sem referências. Importação, falha de quota ou migração não executam limpeza oportunista.

Fazer teste de falha por operação, inclusive escrita da preferência após lista, escrita incompleta de mídia, promoção de versão e importação interrompida. Não depender apenas de happy path.

## Arquivos e backup

Mídia própria vai para armazenamento persistente de arquivos, não URI temporária do seletor, nem base64 no JSON central. Persistir arquivo antes de gravar referência; se falhar, não anunciar anexo salvo. Se metadado falhar, registrar órfão para limpeza posterior segura, sem apagar arquivo potencialmente compartilhado.

Limites iniciais propostos, configuráveis após medição: cinco fotos por análise, lado maior 1.600 px e alvo de até 500 kB por cópia otimizada; manter original apenas por opção explícita. Documentos: até 20 MB/arquivo e 50 páginas processadas por execução; rejeição explica limite e mantém documento original quando possível. Validar tamanho, MIME real, extensão, páginas e capacidade do aparelho. Não implementar descompressão arbitrária.

Backup inicial JSON de metadados até 10 MB informa claramente que não inclui mídia; referências ausentes são visíveis após restauração. Depois implementar pacote com manifesto/checksum, arquivos e limites de expansão, sem path traversal. Validar o pacote inteiro antes de alterar o caderno. Exclusão e exportação devem abranger anexos e observações quando oferecidas como completas.

## Contrato de camada pública

Cada camada habilitada tem manifesto versionado: `id`, fornecedor, URL de origem, licença/condições verificadas, cobertura espacial, período, frequência esperada, esquema, checksum, contagens, critérios de exclusão, campos publicados e limitações. O pipeline gera relatório de cobertura por bairro e por camada; baixar um arquivo não significa que ele foi integrado.

Pipeline: obter → preservar fonte/hash → validar esquema → normalizar → relacionar geograficamente → auditar amostra → gerar partições/manifesto → verificar integridade → publicar versão completa. O app só ativa versão integral validada. Manter versão anterior para rollback do índice, separado do caderno pessoal. Falha numa camada não invalida todo o dossiê.

CNEFE mantém `NV_GEO_COORD` e demais indicadores necessários à qualidade. Receita não fornece universalmente latitude/longitude: usar endereço e geocodificação auditada, preservando método e ambiguidade. Código municipal da Receita exige tabela de correspondência; não tratá-lo como código IBGE. Pontos em limites, vias homônimas, apartamentos e múltiplas portas precisam de fixtures.

GeoJSON externo deve ter CRS conhecido, geometria válida e ordem longitude/latitude verificada. Não cruzar cota/maré sem datum vertical compatível. Indexação espacial deve reduzir candidatos antes de distância exata. Distância reta e rota são campos diferentes. Recortes Recife não apagam contexto necessário de uma rota que cruza a fronteira.

## Capacidades e fornecedores

Um registro de capacidades declara plataforma, disponibilidade real, permissões, versão, custo, retenção e fallback. Não mostrar ferramenta de sensor/consulta como habilitada apenas porque há ícone. Separar adaptador público, arquivo local, servidor e sandbox.

Adaptadores retornam resultado tipado: disponível/parcial/sem cobertura/indisponível, período, custo conhecido quando aplicável e proveniência. Configurar timeout, cancelamento, orçamento de chamadas e cache permitido por contrato. Segredos ficam fora do cliente. Consultas pagas precisam chave de idempotência e política explícita de repetição; erro não dispara compras repetidas.

Nominatim/Overpass públicos não são infraestrutura ilimitada. Geocoding temporário não pode ser armazenado quando o contrato proíbe; contratar modo permanente exige decisão própria. Mapbox Geocoding v6 não resolve busca de POIs por si só. Kenlo depende de acesso autorizado e cobertura demonstrada; não presumir que uma documentação pública concede acesso aos anúncios.

## Privacidade e observabilidade

Caderno, documentos, notas e destinos são privados por padrão. Não colocar nada disso em índices públicos, logs de erro, analytics ou prompts remotos sem consentimento adequado. Não coletar CPF, sócios ou dados de moradores para “enriquecer” imóvel. CNPJ de atividade econômica não elimina necessidade de minimização de dados.

Observabilidade local deve registrar código de erro/versão/duração sem conteúdo pessoal. Métricas remotas ficam desligadas até operação definida. Manter exportação e exclusão acessíveis; conta é opcional. Recursos pagos ou conta indisponível não bloqueiam acesso às próprias anotações.

Limites de privacidade e afirmações técnicas devem ser revisados com especialistas quando a operação exigir; essa revisão é uma dependência específica, não pretexto para bloquear os fluxos locais independentes.
