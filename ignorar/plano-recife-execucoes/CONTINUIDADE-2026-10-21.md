# Execução contínua — épocas 00 a 14

Autorização: usuário pediu executar todas as épocas e validar sem relatórios por época no chat. Mantidos registros locais; nenhuma autorização para compras, mensagens, pagamentos reais ou infraestrutura remota. Não altera index raiz/pitch/motion.

## Antes de editar

| Época | Comportamento confirmado | Arquivos previstos | Aceite |
|---|---|---|---|
| 00 | Registro de outro executor presente; 34 suítes/1291 testes passam novamente nesta sessão | testes existentes; registros | preservar falha seletiva CHAVE_ATIVA e lote A |
| 01 | Casca/dossiê/abas e formulário existem; editor só em memória, não aceita salvar sem bairro | editar, casca, novo rascunho | retomar sem perder entradas; teclado e texto ampliado |
| 02 | Lista v2 serializada; sem backup integrado nem complementos persistentes | Analises, novos módulos de backup/complementos, tela de dados | importação idempotente/revisada, erro sem perda |
| 03 | Extrator/WebView/share existentes; OCR/extensão/feed não comprovados | leitor/extrator; adaptadores | revisão por campo e capacidade real |
| 04 | 5 bairros, CNEFE local em cache; qualidade espacial perde informação | scripts/índice/manifestos | schema, proveniência e lacunas explícitas |
| 05 | Mensal conhecido existente; cenários/entrada/Price ausentes | novos derivadores de orçamento, dossiê | fórmulas/ausências testadas; sem misturar compra/mensal |
| 06 | Cadastro/obras existem; documentos/CNPJ/cronologia pessoal ausentes | novos complementos e painel Edifício | identidade, datas/escopo; CNDT distinta de ações |
| 07 | A Rua já implementada | derivados/fontes/camadas | período/escala e não inferência |
| 08 | Sem serviços CNEFE exploráveis, GTFS não validado | scripts/serviços e Entorno | precisão/distância e falta de feed honestas |
| 09 | Uma visita no contrato v2; sem histórico de sessões | visita/complementos/observações | múltiplas sessões e manual offline |
| 10 | Comparação 2, descarte/restauração e mensagem existem | comparação/resumo/histórico | ausência e equivalência, envio deliberado |
| 11 | Sem OCR/LLM/consulta autenticada | normalização e revisão de evidências | nada extraído/consultado como fato sem revisão |
| 12 | Sem conta/backend/moderação; caderno é local | contratos de sync/capacidades | preservar versões; não fingir integração remota |
| 13 | Carteira demonstrativa existente; sem pagamento real | economia/capacidades | custos e limites, nenhuma cobrança alterada |
| 14 | Sem estudo novo nem dispositivos físicos | testes/smoke/capturas e matriz final | evidência real por capacidade e limitações |

## Baseline nesta sessão

`npm run verificar` passou: 34 suítes, 1.291 testes; log local `/tmp/vereda-verificar-inicial.log`. Resultados de outro executor permanecem no EP00 original. A análise de sensores nativos exige dispositivo não comprovado no ambiente. A primeira busca da skill para rascunho não teve resultado; nova busca de teclado/safe area trouxe recomendações aplicáveis. Identidade continua no protótipo.

## Resultados incrementais

Atualização de auditoria em 22/10/2026: **execução ampla parcial**. O baseline abaixo permanece histórico; não representa conclusão de todas as épocas. Resultados reproduzidos e correções recentes: [auditoria consolidada](AUDITORIA-2026-10-22.md). Escopo efetivo por capacidade: [matriz F01–F80](PRONTIDAO-2026-10-21.md), com registros EP01–EP14 parciais.

### Código local efetivamente acrescentado

- `src/estado/rascunho.ts` e editor: recuperação, ID estável, preservação de rascunho futuro e salvamento incompleto.
- `src/dados/caderno.ts`, `backup.ts`, `Analises.tsx` e `dados-do-caderno`: complemento opcional da v2, atualização na fila atual e restauração revisada/idempotente. `salvar` preserva o caderno mais recente; alterações de complementos usam `atualizar` e restauração usa `importar`.
- `src/plataforma/` e painéis `src/componentes/caderno/`: fotos/PDF privados, cópia web com arquivos/checksums, documentos, CNPJ/ocorrências manuais, observações, múltiplas visitas, destinos privados, diário/correções e resumo/PDF selecionado. Nativo não está certificado por teste web.
- `orcamento.ts`, `historicoDoAnuncio.ts`, comparação de três: hipóteses financeiras locais, histórico deliberado e comparação progressiva; preço de compra separado de recorrentes.
- Pipeline municipal: 94 partições geradas em staging; 72 / 7.206 edifícios no catálogo experimental local; 22 partições retidas. Arquivos imutáveis e reversão local disponíveis. Camada CNEFE: 5.661 pontos históricos de categorias amplas, nível 1.
- `protocoloDeSincronizacao.ts` e `economiaDaOferta.ts` são modelos internos locais, não conta, servidor ou cobrança reais. GTFS é inspeção exploratória; não habilita horários.

### Validação e limites

A auditoria atual reproduziu `npm run verificar` (41 suítes/1.330 testes), smoke v1 (50 etapas) e smoke ampliado (51 capturas/zero erros de navegador). Capturas alteradas foram de fato abertas; veja a lista específica no relatório. Artefatos duráveis: `execucoes/auditoria-2026-10-22/`.

Não foram feitos testes em aparelho, estudo com usuários, auditoria de campo das novas associações ou ativação de integrações/infraestrutura. Existem funções locais ainda não implementadas, além das dependências externas. Não classificar épocas 01–14 como integralmente concluídas. Código anterior e o EP00 de outro executor foram preservados.
