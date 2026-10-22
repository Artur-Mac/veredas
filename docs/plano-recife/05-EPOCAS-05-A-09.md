# 05 — Épocas 05 a 09: orçamento, contexto e visita

Aplicar contratos e matriz de qualidade dos documentos 02, 03 e 07. A regra para integrações é entregar o núcleo independente e manter a integração bloqueada/pendente pelo nome, sem substituir dados reais por demonstração.

## Época 05 — Orçamento completo e cenários

**Capacidades:** F21–F28. **Depende:** 01–02; 04 para referências externas. **Locais:** derivação atual em `src/dados/custos.ts`, componentes de custo/comparação, contratos; novos derivadores puros de cenários.

### EP05.01 — Mensal, entrada e capital imobilizado

- Reusar derivação de custo existente; inventariar todos os rótulos e consumidores antes de alterar. Definir categorias: recorrente, despesa inicial, reembolsável/imobilizado e aquisição.
- IPTU anual informado pode ser convertido em equivalente mensal com indicação de divisão por 12; não confundir equivalente com calendário de parcelas. Condomínio extraordinário tem duração/competência separada, sem duplicar o ordinário.
- Incluir mudança, instalações, taxas informadas e garantia. Caução reembolsável aumenta caixa necessário inicial, mas não despesa definitiva; condições de devolução permanecem hipótese.
- Aceite: 2.500+600=3.100 conhecido com IPTU/seguro ausentes em todas as superfícies; zero explícito não vira pendência; preço de compra nunca é somado ao mensal; soma em centavos não deriva por arredondamento divergente.

### EP05.02 — Horizonte, orçamento e consumo

- Cenário nomeado contém horizonte em meses, valores informados, estimados e fórmula. Mudança de hipótese não altera o anúncio original.
- Perfil doméstico opcional: número de pessoas, rotina, uso de aparelhos e destinos. Não exigir renda pessoal para usar custos. Orçamento informado pode mostrar comprometimento, sem limite universal de “saudável”.
- Água/energia/transporte: primeiro entrada manual de conta/consumo; depois tabela tarifária com concessionária, classe, data, componentes e exclusões. Sol/andar não determina gasto em ar-condicionado. Sem consumo/tarifa válida, mostrar hipótese editável, nunca estimativa automática assertiva.
- Aceite: horizonte zero/negativo rejeitado; despesa única não multiplica por meses; reajuste opcional mostra índice/taxa e data; cenário incompleto não vira total completo. Comparar cenários conserva mesmos pressupostos explicitamente.

### EP05.03 — Financiamento e comprar × alugar

- Simulação Price pura: principal = aquisição − entrada; taxa mensal efetiva `i`; parcela `P*i/(1-(1+i)^(-n))`; para `i=0`, `P/n`. Converter taxa anual efetiva por `(1+a)^(1/12)-1`; taxa nominal exige regime identificado, não conversão silenciosa.
- Validar principal≥0, entrada≤preço, prazo inteiro positivo e taxas dentro de limites de entrada documentados. Tratar estabilidade numérica perto de zero. Mostrar juros acumulados e saldo por período, com teste de amortização final e arredondamento.
- Separar seguros, tarifas, TR/outros indexadores, tributos, condomínio e custos de aquisição. “Parcela simulada” não significa CET nem proposta bancária.
- Comprar × alugar compara desembolso, saldo devedor, patrimônio líquido estimado e saldo de investimento no mesmo horizonte. Valorização, retorno líquido, inflação, venda e custos de transação são hipóteses editáveis. Não contar amortização como despesa e novamente como perda patrimonial.
- Aceite: taxa zero, quitação no prazo, entrada integral, horizonte menor que financiamento, retorno zero e compra/venda com custos. Mostrar sensibilidade para pelo menos três hipóteses definidas pela pessoa, sem recomendação automática.

### EP05.04 — Referências fiscais e comparáveis

- ITBI: manter valor fiscal por unidade compatível, N, período, tipologia e filtro. Não usar área cadastral com partes comuns para derivar R$/m² de mercado; não misturar valor declarado, avaliação fiscal e preço anunciado.
- Comparáveis pessoais vêm de análises salvas. Feed de mercado requer autorização/licença, janela, tipologia, área compatível, deduplicação de anúncio/unidade e tratamento de outliers documentado. N pequeno é exibido sem percentis enganosos; usar regra mínima existente no derivador fiscal e justificar mudanças por domínio, não reutilizar limiar indiscriminadamente.
- Testar duplicatas, unidade incompatível, área ausente, anúncio sem data e amostra pequena. Nenhum gráfico recebe título “preço justo”. Sem base válida, comparação pessoal continua disponível.
- Saída: contrato único de custos, testes de fórmulas e amostra de cenários revisada; fontes externas pendentes não bloqueiam orçamento manual.

## Época 06 — Edifício, cronologia e documentos

**Capacidades:** F07, F30–F34, F36–F37, F39. **Depende:** 02 e 04 para fatos cadastrais. **Locais:** dossiê/Edifício, derivadores de fatos e dados Recife; novos metadados/documentos.

### EP06.01 — Cadastro e linha do tempo

- Exibir tipologia, porte, área, idade quando fundamentada e origem. Ano cadastral não vira ano certo de entrega; mediana de IPTU do prédio não vira IPTU da unidade.
- Eventos tipados: cadastro, transação fiscal, processo, licença, documento apresentado e observação pessoal. Cada um mantém data, fonte e precisão temporal. Ordenar datas parciais sem inventar dia/mês; mostrar conflito entre fontes.
- Aceite: prédio com vários lotes, unidade sem cadastro, data incompleta e eventos conflitantes continuam compreensíveis. Não inferir reforma/segurança apenas por uma atualização cadastral.

### EP06.02 — Documentos e inspeção de engenharia

- Criar checklist por tipologia: laudo de inspeção quando aplicável, ART/RRT relacionada, habite-se, documentação de incêndio, manutenção de elevadores/equipamentos, atas/convenção/balancetes. Checklist é orientação, não declaração automática de obrigação legal; conteúdo normativo exige fonte vigente verificada.
- Registrar tipo, emissor informado, responsável, escopo, data da inspeção, emissão, validade quando explícita, identificação do imóvel, arquivo e páginas relevantes. Campo “não apresentado” difere de “não existe”.
- Mostrar **último documento apresentado ao VEREDA**, selecionado pela data de inspeção conhecida; documentos sem essa data ficam separados. Se só houver emissão, rotular como emissão. ART/RRT comprova registro de responsabilidade no alcance consultado, não aprovação técnica do prédio.
- Aceite: laudo recente sobre fachada não certifica estrutura; documento de outro endereço exige revisão; consulta indisponível não invalida arquivo recebido; inspeção sem data não ganha data atual.

### EP06.03 — Atas e finanças condominiais manuais

- Permitir registrar trecho/página sobre obras previstas, rateios, fundo de reserva, inadimplência declarada e decisões de assembleia. Cada achado é revisável e vinculado ao documento.
- Rateio aprovado pode alimentar cenário de custos só após confirmação da pessoa, com valor/duração e unidade beneficiada. Não somar novamente se já incluso em condomínio informado.
- Aceite: ata substituída, valor por unidade vs total do prédio, decisão não aprovada e balancete de período antigo não viram cobrança atual certa. Dados de moradores não aparecem em compartilhamento padrão.

### EP06.04 — Identidade jurídica, certidões e registro

- Aplicar o [adendo de CNPJ e ocorrências](10-CNPJ-E-OCORRENCIAS-DO-EDIFICIO.md): papéis jurídicos separados, vínculo ao imóvel e certidão TRT6 de ações distinta da CNDT de débitos. Esta unidade entrega também o caminho manual/documental; API judicial permanece na época 11.

- CNPJ do condomínio é informado/consultado e confirmado por nome/endereço/documento; guardar como texto compatível com formato alfanumérico, não sanitizar apenas dígitos. Não puxar sócios/CPF.
- PGFN/FGTS e matrícula: começar por roteiro de solicitação e anexação de resultado apresentado. Consulta automática depende de serviço legítimo, cobertura, custo, autorização e identidade. Autenticidade/validade de certidão não gera nota financeira/estrutural.
- Matrícula tem cartório, identificador, data e escopo; não presumir titularidade atual a partir de documento antigo. APIs ONR/Docket/Serpro são alternativas condicionais, não promessa de acesso aberto.
- Aceite: homônimo, CNPJ diferente, certidão vencida, ausência de resultado, PDF inválido e consulta paga repetida são tratados sem falsa certeza. Sem credencial, a parte manual é concluída e a automática permanece pendente.

## Época 07 — Rua, ambiente e infraestrutura

**Capacidades:** F40–F55. **Depende:** 04; reusar eventos de 06. **Locais:** `scripts/dados/rua/`, índices/derivadores de A Rua, dossiê/Entorno. **A Rua já existe:** ampliar e corrigir, não implementar de novo.

### EP07.01 — Reconciliar camadas existentes

- Auditar LUSE, pedidos 156, iluminação, coleta, sinistros, Defesa Civil e entorno censitário. Registrar janela real, método de associação e denominador. A janela 31/01/2025–30/01/2026 não é “últimos 12 meses” em outubro de 2026.
- Separar licença sonora de ruído medido; pedido de serviço de ocorrência confirmada; ponto cadastrado de lâmpada funcionando. Defesa Civil com endereço mascarado continua no alcance publicado; não reconstruir número.
- Deduplicar protocolos/republicações pela regra da fonte. Ausência de protocolo não prova ausência de problema. Percentuais por setor/face não são atributos da porta.
- Aceite: mesma rua com vários números, protocolo duplicado, dado antigo, setor cruzando bairro e camada indisponível. Fonte e período permanecem na interface.

### EP07.02 — Alagamento, drenagem e contexto climático

- Inventariar pontos catalogados, canais, mapas SGB, chuva APAC/Cemaden e maré: acesso, licença, resolução, CRS, datum, atualização e cobertura. Fazer EDA local antes do cruzamento: distribuição de datas, faltantes, distância às estações, amostra espacial e incompatibilidades.
- Entrega inicial: camadas separadas e contexto da visita. Mapa de suscetibilidade regional não estima lâmina no térreo. Chuva em estação não comprova chuva no apartamento. Não somar altitude e maré sem datum compatível.
- Criar pergunta sobre histórico de entrada de água, garagem, bombas e acesso em chuva; resposta pessoal permanece observação. Qualquer novo indicador composto requer especificação/validação própria antes de exposição.
- Aceite: cota ausente, mapa antigo, estação distante, evento fora da janela e limite de polígono. Sem dados tecnicamente compatíveis, mostrar contexto separado e registrar bloqueio do cruzamento.

### EP07.03 — Infraestrutura, calor e urbanismo

- Água: registrar cisterna, reservação, bombas, frequência observada e respostas do condomínio. Rodízio público só com área/data exatas; sem acessar contas de clientes Compesa.
- Energia: DEC/FEC por conjunto elétrico e período; associação exige geometria/mapeamento compatível, não bairro aproximado. Anatel é cobertura prevista no alcance declarado, sem garantia indoor.
- Arborização e calor: inventário de árvores e/ou dado térmico apropriado com resolução/horário; Sentinel-2 não fornece banda térmica. Temperatura de superfície não é temperatura interna nem conta de energia.
- Zoneamento/obras: norma/cartografia vigente, processo e estágio. Potencial construtivo não prova obra futura ou obstrução da janela. Exibir fonte e perguntar sobre canteiro observado.
- Aceite: prédio no limite do conjunto/zoneamento, camada sem cobertura, árvore removida segundo observação e obra apenas anunciada não produzem afirmação categórica.

### EP07.04 — Rotina da rua e contexto territorial sensível

- Feiras/coleta/eventos: calendário, trecho, horário e fonte; obra/coleta não implica barulho ou bloqueio permanente. Radares e classe viária indicam infraestrutura, não volume de tráfego medido.
- Segurança pública, arboviroses, renda e ocupação: somente dados agregados adequados, período/denominador e licença. Revisar viés de notificação e mudanças territoriais. Não ranquear moradores, rua “segura”, risco individual ou potencial de doença do comprador.
- Camadas sensíveis ficam em detalhe opcional, sem destaque automático alarmista. Mostrar utilidade concreta; se não responder pergunta útil ou não houver escala adequada, manter experimento não habilitado e registrar motivo.
- Aceite: números absolutos com populações diferentes, mudança de delimitação, baixa contagem e ausência de registro não viram comparação inválida. Mapas não expõem indivíduo.
- Saída: EDA, manifestos, mapa/lista acessível e matriz por camada; nenhuma fonte desconexa ocupa Destaques apenas por existir.

## Época 08 — Serviços e mobilidade de rotina

**Capacidades:** F44, F56–F61. **Depende:** 04; geometria/manifestos de 07. **Locais:** novos adaptadores de serviços/rotas, buscador Recife e Entorno.

### EP08.01 — CNEFE, CNAE e auditoria de proximidade

- Reutilizar EDA em `docs/produto/refinamento-2026-10-21/evidencias/`; atualizar sobre os arquivos efetivamente usados. CNEFE tem classes amplas: não distingue todo bar/oficina a partir de espécie genérica. Entorno urbanístico é produto separado, com junção na escala sustentada pelo dicionário.
- Receita: filtrar estabelecimentos do Recife/ativos conforme data, normalizar endereço, cruzar tabela de município e geocodificar; guardar precisão e método. CNPJ ativo é situação cadastral, não porta comprovadamente aberta.
- Mapear CNAEs em tabela versionada para serviços de rotina e atividades a verificar, com fonte dos códigos. Atividade principal/secundária não duplica estabelecimento nem mede ruído. Evitar publicar dados pessoais de empresário sem necessidade.
- Auditar pelo menos 150 associações estratificadas, incluindo ausências/ambiguidades, com evidência de revisão. Meta de engenharia proposta para liberar marcação pontual: ≥95% de associações corretas na amostra dos registros classificados como exatos; publicar denominador e incerteza amostral, não apresentar esse percentual como confiança de cada ponto. Se falhar, corrigir ou rebaixar alcance, sem esconder rejeitados.
- Aceite: número ausente, porta compartilhada, CNPJ alfanumérico, atividade secundária, geocódigo aproximado e atualização cadastral. Só afirmar “a X metros em linha reta” quando precisão permitir; nunca “colado” por distância de centroide.

### EP08.02 — Saúde, educação e vitalidade comercial

- Integrar CNES/INEP quando acesso/licença/esquema confirmados, deduplicando estabelecimento e registrando período. Ideb descreve edição/escola/etapa, não qualidade geral do bairro nem vaga disponível.
- Mostrar serviços selecionados pela rotina da pessoa em raio explícito (300 m é opção inicial, editável). Resultado inclui contagem por fonte e limites; não confundir distância reta com caminhada acessível.
- Aceite: escola fechada segundo observação, serviço dentro de shopping, múltiplos registros da mesma unidade e falta de horário. Oferecer confirmar na visita/consultar estabelecimento, não inventar disponibilidade.

### EP08.03 — GTFS e corredor de transporte

- Confirmar feed oficial/autorizado local, licença, data e cobertura ônibus/metrô/VLT; documentação genérica GTFS não prova que Recife oferece feed reutilizável atual. Guardar versão e validar referencial entre arquivos.
- Processar `stops`, `routes`, `trips`, `stop_times`, `calendar` e `calendar_dates`; lidar com horários após 24h, exceções, fuso de Recife, `frequencies` e `exact_times`. Deduplicar viagem que passa em paradas vizinhas; separar sentidos. Usar shapes quando disponíveis; sem shapes, não desenhar percurso exato.
- Entrega: paradas e partidas programadas por dia/faixa horária, conexão com destino quando motor válido. Fluxo programado de ônibus não é medição de ruído, diesel, pontualidade ou início universal às 5h.
- Aceite: feriado, serviço expirado, viagem 25:10, frequência sem horário exato, sentido oposto e shape ausente. Sem feed validado, paradas/contexto estático podem funcionar e horários permanecem indisponíveis.

### EP08.04 — Rotas, acessibilidade e comparação de rotina

- Destinos são privados e opcionais; armazenar apelido e precisão escolhida, evitando log de casa/trabalho. Começar com distância reta rotulada. Motor de rotas exige cobertura, licença/cache e modo real (a pé/bicicleta/transporte).
- Ciclovias, travessias, rampas e calçadas não garantem percurso contínuo; segmentos desconhecidos ficam visíveis. Isócrona depende de rede/velocidade/modelo, não círculo convertido em minutos.
- Aceite: rio/ponte, rota atravessando município, trecho sem calçada, horário de trânsito ausente, fornecedor indisponível e modo incompatível. Rotas anteriores mantêm data, sem falsa atualização.
- Saída: serviços e mobilidade respondem “o que preciso na rotina e como chegar”; perguntas sobre barulho/acesso geradas com origem, sem sentença sobre a rua.

## Época 09 — Visitas, evidências e instrumentos

**Capacidades:** F51, F60, F62–F67. **Depende:** 02; perguntas das épocas 05–08 entram incrementalmente. **Locais:** rota visita, derivadores/perguntas e novos adaptadores por plataforma.

### EP09.01 — Visitas repetidas e roteiro offline

- Modelo de sessão com ID, data/contexto e estados preparada/em andamento/pausada/concluída. Migrar respostas antigas preservando data desconhecida quando não disponível.
- Perguntas têm ID estável da evidência/assunto; permitem pendente, respondida e não aplicável. Resposta inclui autor local, origem, horário quando conhecido e anexo opcional. Nova informação corrige por nova versão, sem apagar histórico.
- Preparar roteiro por prioridades e faltas; durante visita priorizar resposta curta e registro rápido; resumo mostra o que mudou e o que falta. Offline é caminho normal, não erro global.
- Aceite: interromper/reabrir, duas visitas com respostas divergentes, remover fonte pública e nova pergunta similar não perdem histórico nem duplicam tudo.

### EP09.02 — Posição, foto e observação acústica

- GPS registra latitude/longitude, precisão horizontal e instante; associação ao cômodo é manual. Posição não prova presença na unidade, fachada ou andar.
- Registrar percepção sonora por cômodo, janela aberta/fechada, horário, duração e fonte percebida. Se implementar áudio, começar por medição relativa/dBFS claramente experimental; sem calibração e método válido não mostrar dB SPL ou comparação com limite normativo.
- Minimizar gravação: preferir metadados/medida local; gravação identificável exige escolha clara. Permissões são solicitadas no uso e podem ser negadas sem bloquear roteiro.
- Aceite: GPS impreciso/negado, microfone indisponível, interrupção e ambiente silencioso; nenhum zero por falta de sensor. Não usar telas demonstrativas como evidência de medição.

### EP09.03 — Orientação, sol e sombra

- Primeiro permitir direção informada e observação de sol na visita. Bússola precisa qualidade/calibração, norte magnético/verdadeiro e compatibilidade de aparelho; indicar quando direção é incerta.
- Cálculo solar usa latitude, longitude, data/hora/fuso e algoritmo validado com casos conhecidos. Incidência na fachada exige orientação; sombra exige geometria/altura dos obstáculos. Andar não determina altura exata.
- Entregar 2D antes de 3D. 3D só após amostra com geometria/alturas verificáveis, desempenho móvel e limites visíveis; alturas inferidas são intervalos/hipóteses. Sem insumos, não inventar horas de insolação.
- Aceite: norte/sul, datas sazonais, horário/fuso, orientação incerta e ausência de altura. Não exibir “poente crítico”, “brisa permanente” ou economia energética calculada sem modelo validado.

### EP09.04 — Conectividade por cômodo sem internet instalada

- Separar três perguntas: sinal móvel presente; Wi-Fi de um roteador disponível; possibilidade de contratar internet fixa. **Wi-Fi 5 GHz não é rede móvel 5G.** Sem roteador ligado não há Wi-Fi do imóvel a medir; sem conexão não há teste de velocidade.
- Núcleo manual funciona offline: cômodo, operadora informada, indicação vista no aparelho, janela, horário e observação de chamada/navegação. Rotular como registro da pessoa.
- Adaptadores: validar APIs Expo/native na versão do projeto. Tipo de rede não implica geração celular; web `effectiveType` é estimativa de conexão e não prova 5G. Android RSSI/frequência Wi-Fi exigem APIs/permissões reais; iOS não oferece essas medidas pelo simples `fetchCurrent` de SSID/BSSID. Não preencher campos inexistentes.
- Teste ativo de velocidade exige endpoint legítimo, consentimento para dados móveis, cancelamento e orçamento inicial proposto de 10 MB/15 s. Mostrar bytes/duração/servidor; esse limite pode impedir estimar links rápidos, então resultado limitado não vira capacidade máxima. Sem endpoint autorizado, implementar só registro/manual e capacidade disponível.
- Cobertura Anatel é contexto predito, diferente da observação indoor. Disponibilidade de fibra exige confirmação por endereço/provedor, sem promessa baseada em mapa genérico.
- Aceite em aparelho: modo avião, sem SIM, permissão negada, 4G/5G quando disponível, Wi-Fi 2,4/5 GHz quando exposto, sem internet e interrupção de teste. Onde não houver aparelho/rede, declarar não testado e manter recurso experimental/desabilitado.
- Saída: roteiro inteiro utilizável sem internet instalada; sensor é evidência limitada, nunca certificado técnico.
