# 07 — Qualidade, testes e aceite

## Regra de entrega

Implementação só está concluída quando comportamento, dados e experiência foram verificados no alcance declarado. “Compilou”, “há um botão”, “funcionou com mock” e “passou no navegador” não certificam integração, aparelho ou realidade de campo.

Cada unidade recebe evidência proporcional ao risco. Não criar testes que apenas espelham JSX ou detalhes internos. Priorizar perda de dados, semântica, identidade, duplicação, cobrança, privacidade, limites de fonte e continuidade offline.

## Fixtures mínimas compartilhadas

Criar fábrica de fixtures no padrão de `tests/`, sem duplicar manualmente enormes objetos em cada suíte. Dados sintéticos pertencem a testes/exemplos, jamais ao índice real.

| ID | Caso | Invariante |
|---|---|---|
| QA01 | Aluguel 2.500 + condomínio 600; IPTU/seguro ausentes | Mensal conhecido 3.100 com duas pendências em todas as superfícies |
| QA02 | Mesmos campos, IPTU/seguro explicitamente zero | Zero conhecido, sem pendência artificial |
| QA03 | Compra com preço 500.000 e recorrentes parciais | Aquisição separada de mensal e caixa inicial |
| QA04 | Só bairro/área, nome longo de 100 caracteres | Sem prédio presumido, layout legível e continuidade manual |
| QA05 | Rua homônima, número ausente e candidatos acima do limite | Motivos/total/alternativas; abstenção quando necessária |
| QA06 | Conteúdo salvo e falha seletiva de preferência ativa | Resultado de conteúdo permanece salvo, sem rollback |
| QA07 | Caderno antigo, corrompido e versão futura | Migração segura ou recuperação, sem apagar bytes originais |
| QA08 | Fonte fora de cobertura e período antigo | Ausência não vira zero; consulta nova não muda referência |
| QA09 | Duas visitas/respostas divergentes | Histórico preservado e origem visível |
| QA10 | Documento de outro prédio e inspeção sem data | Identidade não aceita silenciosamente; data não inventada |
| QA11 | CNPJ com letras, múltiplas atividades e endereço aproximado | Identificador intacto; deduplicação e precisão |
| QA12 | GTFS feriado, 25:10 e serviço expirado | Calendário correto; sem previsão atual inventada |
| QA13 | Sem rede/sem permissão/sem sensor | Ferramenta manual e caderno disponíveis |
| QA14 | Importação repetida, anexo perdido e falha de quota | Idempotência, referência faltante explícita, sem perda do restante |
| QA15 | Conflito entre dispositivos e token revogado | Versões preservadas; acesso negado corretamente |
| QA16 | Duplo clique/webhook duplicado/falha tarifada | Uma cobrança conforme contrato; repetição segura |

## Camadas de verificação

1. **Domínio:** funções puras com limites, ausências, datas, unidades e fórmulas. Usar testes gerativos/propriedades quando reduzem risco real, como somas monetárias e migração idempotente.
2. **Persistência:** simular falhas em cada operação de escrita/leitura, concorrência e retomada. Testar com adapter real local quando disponível, não só mocks.
3. **Integração de dados:** schema, contagens, exclusões, geometrias, checksum, amostra auditada e licença. Fixture prova parser, não comprova fonte atual.
4. **Componentes/fluxo:** ação, estado, foco, rótulo e prevenção de duplicação. Snapshots não substituem asserção de comportamento.
5. **Ponta a ponta:** caderno vazio → importar/manual → revisar → salvar → dossiê → visita → comparar → compartilhar/exportar → reiniciar/recuperar.
6. **Visual e aparelho:** inspeção humana das capturas e testes nativos conforme matriz abaixo.

## Comandos e registro de execução

Conferir scripts no `package.json` antes de executar. Rodar testes focados por unidade, depois `npm run verificar` no fechamento de época. Para smoke, iniciar servidor local conforme README, verificar que responde e executar `npm run test:v1`; usar `POC_URL` quando a porta não for a padrão 8087. Registrar URL, configuração e resultado. Encerrar apenas processos iniciados pela própria execução.

Se uma dependência externa impedir verificação, registrar comando, erro, ambiente e alcance não testado; continuar testes independentes. Não chamar “passou” uma suíte pulada nem atribuir falha preexistente ao novo código sem investigar.

## Matriz visual e de plataformas

| Ambiente | Casos obrigatórios quando a superfície muda | Evidência |
|---|---|---|
| Web 375×812 | Completo, incompleto, erro/sem dados | Captura aberta e revisada |
| Web 1280×900 | Densidade, largura, hierarquia e alinhamento | Captura aberta e revisada |
| Web 360 px | Nome longo, ações, comparação | Sem corte ou sobreposição bloqueante |
| Texto 200% | Fluxo principal, gaveta e custos | Ações alcançáveis; nenhuma informação essencial perdida |
| Teclado físico | Tab/Shift+Tab, Enter/Espaço, Esc, abas | Ordem/foco/retorno documentados |
| Teclado virtual | Últimos campos, validação e confirmação | Rolagem e área segura adequadas |
| Android real/build | Compartilhar, arquivos, permissões, offline e sensores usados | Modelo/OS/build, passos e resultado |
| iOS real/build | Mesmos fluxos e diferenças de capacidade | Modelo/OS/build, passos e resultado |
| Leitor de tela | Títulos, estado, rótulos e ações alteradas | VoiceOver/TalkBack ou web disponível; limites explícitos |

Guardar capturas em `docs/plano-recife/execucoes/EPxx/capturas/` com nome de tela, dimensão e cenário. Não incluir dados privados. Se a ferramenta usa outro diretório, registrar caminhos duráveis e copiar somente artefatos próprios necessários. Testes de telas não comprovam que as imagens foram olhadas.

## Desempenho e limites

Metas iniciais propostas, sujeitas ao baseline real: feedback visual de ação local em até 100 ms; gravação comum em até 1 s; abertura de análise já local em até 2 s no aparelho de referência. Medir p95 com pelo menos 30 repetições após aquecimento, declarando amostra e modo. Não esconder outliers. Limites não são promessa comercial.

Testar 10/100/500 análises, até cinco fotos por análise quando suportado e documentos no limite. Medir memória e tamanho separadamente de tempo. Imagem fora da viewport não deve ser decodificada toda ao abrir lista. Índice municipal é particionado; cache público pode ser descartado, caderno pessoal não.

Não migrar para banco diferente apenas porque existe uma lista grande: identificar gargalo. Se a lista serializada ultrapassar capacidade, propor migração com integridade e rollback, sem comprometer o protocolo da época 02.

## Critérios para habilitar uma fonte

Checklist por fonte, sem exceção por ser gratuita:

- Direito de acesso/uso/armazenamento/redistribuição registrado conforme uso pretendido.
- Schema e dicionário conhecidos; período/cobertura/escala explícitos.
- Identidade/geocódigo compatíveis com a afirmação exibida; abstenção para ambiguidade.
- Transformação reproduzível e amostra auditada; números de qualidade com denominador.
- Estado sem cobertura/antigo/erro implementado e compreensível.
- Custo/cache/rate limit/indisponibilidade não impedem caderno local.
- Uma pergunta útil e ação na interface; nenhum número solto sem interpretação delimitada.

## Modelo de registro por época

```md
# Execução EPxx — título
Data / commit / versões / responsável:
Escopo autorizado e FIDs:
Estado inicial e alterações preexistentes:
| Unidade | Comportamento confirmado | Arquivos | Aceite | Estado |
Decisões e diferenças em relação ao plano:
Alterações realizadas (com caminhos):
Testes: comando, ambiente, resultado, evidência:
Dados: fonte, versão, licença, cobertura, qualidade:
Capturas examinadas: caminho, cenário e observações:
Não testado / bloqueios / dependência necessária:
Capacidades prontas, parciais e desabilitadas:
Próxima unidade sugerida (sem execução automática):
```

## Saída e gravidade

Bloqueadores: perda/corrupção de dados, exposição privada, cobrança duplicada, inferência apresentada como certeza em tema técnico, incapacidade de concluir fluxo essencial e ausência de licença necessária. Corrigir ou desabilitar apenas a capacidade afetada antes de liberar.

Problemas menores recebem evidência, prioridade e destino. Status “núcleo concluído; integração pendente” é válido e honesto; não soma como entrega integral. A revisão de 80 capacidades deve distinguir funcionamento verificado, experimento e mera documentação.
