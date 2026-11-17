# Log Bruto da Simulação de Enxame — VEREDA (14/11/2026)

- **Modelo Local:** `qwen-local` (`num_ctx=4096`, `temperature=0.75`)
- **Agentes:** 9 personas de alto atrito | **Rodadas:** 4
- **Confiança Média:** R1 `29.1` → R2 `24.3` → R4 `34` (desvio padrão R4: `12.36`)
- **Viabilidade Média de Mercado (R4):** `45/100` (desvio padrão: `14.72`)
- **Modelo de Negócio Sobrevivente (Votos R3):** `{"M3": 4, "M2": 4, "M1": 1}`
- **Tempo Total de Inferência Local:** `1105.77s` (10381 tokens gerados)

## Métricas Agregadas por Grupo

- **Confiança R1 por Grupo:** `{"Incumbente Hostil": 20.7, "Usuário Final (Baixa Tolerância a Atrito)": 35.0, "Usuário Final (Sensível a Preço)": 25.0, "Usuário Final (Power User / Analítico)": 35.0, "Auditor Técnico / Legal": 35.0, "Auditor Técnico / Engenharia": 35.0, "Avaliadora de Pitch & VC": 35.0}`
- **Confiança R4 por Grupo:** `{"Incumbente Hostil": 24.3, "Usuário Final (Baixa Tolerância a Atrito)": 45.0, "Usuário Final (Sensível a Preço)": 15.0, "Usuário Final (Power User / Analítico)": 48.0, "Auditor Técnico / Legal": 45.0, "Auditor Técnico / Engenharia": 35.0, "Avaliadora de Pitch & VC": 45.0}`
- **Viabilidade R4 por Grupo:** `{"Incumbente Hostil": 36.7, "Usuário Final (Baixa Tolerância a Atrito)": 60.0, "Usuário Final (Sensível a Preço)": 20.0, "Usuário Final (Power User / Analítico)": 55.0, "Auditor Técnico / Legal": 60.0, "Auditor Técnico / Engenharia": 40.0, "Avaliadora de Pitch & VC": 60.0}`
- **Alvos mais atacados/respondidos na R2:** `{"corretor_veterano": 4, "compradora_primeira_viagem": 3, "engenheiro_dados_senior": 3, "auditora_lgpd_juridica": 3, "proprietario_especulador": 2, "investidor_planilheiro": 1, "inquilino_cetico": 1, "jurada_vc_campus": 1}`

---

## Rodada 1 — Exposição Inicial e Reação Bruta

### @corretor_veterano — Sérgio Cavalcanti (Corretor CRECI-PE (22 anos, Boa Viagem/Setúbal))
- **Postura:** `boycott` | **Ação:** `QUOTE_POST` | **Confiança:** `12/100` | **Intenção de Adoção:** `8/100`
- **Declaração Pública:** Gente, o VEREDA prometeu mágica, mas entrega app de 30MB que não roda em celular nenhum. Aí vem a régua de preço: usa ITBI, que é valor fiscal do IPTU, não o que eu fechei na escritura! E pior: o app manda perguntar 'taxas omitidas' na minha cara, quando o cliente só quer ver o quarto. Se o app deixa o cliente saber o preço real antes de me ligar, minha comissão de 6% foi pro espaço. Até junho de 2027 é conversa pra boi dormir, gente. Não baixem.
- **Gatilhos de Ataque/Desconfiança:** Uso de ITBI fiscal como referência de mercado, desvalorizando o fechamento real do corretor, App ainda não testado em dispositivos móveis reais (bundle de 30MB), Lista de perguntas hostis expõe ao cliente a possibilidade de taxas ocultas
- **Monólogo Interno:** _Vou marcar o CRECI para ver se não estão exercendo intermediação. Na prática, vou continuar esconder o nome do prédio no ZAP e só revelar depois do cliente pagar o café. Esse app é só pra assustar novato._

### @incorporadora_diretora — Renata Albuquerque (Diretora Comercial de Incorporadora (Zona Norte - Graças/Casa Forte))
- **Postura:** `sue_or_block` | **Ação:** `FACT_CHECK` | **Confiança:** `25/100` | **Intenção de Adoção:** `10/100`
- **Declaração Pública:** O VEREDA prometeu 'valor real das escrituras' mas usa ITBI (valor fiscal da Prefeitura), não o preço de fechamento! E onde estão os dados de alagamento? O modelo ML foi rejeitado e 211 registros nem têm rua vinculada. Para quem compra na Zona Norte, isso é marketing com dados crus e ODbL. Se não corrigirem a régua e a fonte do preço, meus corretores vão ignorar o app para não passar vergonha com cliente.
- **Gatilhos de Ataque/Desconfiança:** Confusão entre ITBI (fiscal) e valor real de escritura, Modelo de alagamento rejeitado e dados sem vínculo viário
- **Monólogo Interno:** _Vou acionar o jurídico para notificar por 'verdade parcial' na régua de preço. Se eles não trocarem o ITBI por dados de escrituras reais em 30 dias, processo por dano à imagem dos meus imóveis na Graças. Enquanto isso, peço para a TI bloquear o app no Wi-Fi dos corretores._

### @proprietario_especulador — Eduardo 'Duda' Vasconcelos (Proprietário Multi-Imóveis & Rentista (7 aptos BV/Espinheiro))
- **Postura:** `hostile` | **Ação:** `CREATE_COMMENT` | **Confiança:** `25/100` | **Intenção de Adoção:** `10/100`
- **Declaração Pública:** No Espinheiro, meu aluguel é 8,5% a.a. e não tenho tempo para app que pede colar link manualmente. A régua de aluguel compara só com o que eu já sei? Onde está a verdade? Vocês usam o valor fiscal da Prefeitura (ITBI), que é 30% abaixo do mercado real, e ainda escondem o sol poente atrás de 'bússola'. Enquanto não pagarem corretamente pelo meu tempo com dados reais de escritura e ruído calibrado, é só marketing de faculdade.
- **Gatilhos de Ataque/Desconfiança:** Uso de ITBI (valor fiscal) em vez de preço real de escritura para comparação, Régua de aluguel baseada apenas em anúncios salvados pelo próprio usuário, sem feed externo confiável, Ingestão manual de links via WebView/OCR, sem scraping automático real
- **Monólogo Interno:** _Vou salvar o app só para burlar o 'Isso está errado' quando o inquilino chatoso perguntar do condomínio. Se o app mostrar que o IPTU está errado, eu explico que é 'a consultar'. Uso a ferramenta para filtrar inquilinos técnicos, mas não pago por isso._

### @compradora_primeira_viagem — Camila Ferreira (Médica Residente / Compradora 1º Imóvel (Madalena/Espinheiro))
- **Postura:** `skeptical` | **Ação:** `CREATE_COMMENT` | **Confiança:** `35/100` | **Intenção de Adoção:** `20/100`
- **Declaração Pública:** Madalena, meu bairro, tem só 280 prédios indexados. Se eu colar um link do QuintoAndar, o app me pede OCR ou extensão de navegador? Eu tenho plantão de 60h, não tempo para tutorial técnico. E o pior: a 'régua de preço' usa ITU fiscal, não o valor real de escritura. Se eu cair num apartamento forno no poente e o app só me disser 'fachada voltada a via', eu quero o sol calculado, não promessa de VLM que nunca rodou. Vale visitar ou é furada? Me responda em 30s ou eu ignoro.
- **Gatilhos de Ataque/Desconfiança:** Bundle de 30MB em 4G durante plantão, Uso de ITBI fiscal em vez de preço real de escritura, Dependência de OCR/extensão manual em vez de ingestão automática
- **Monólogo Interno:** _Se eu não conseguir ver o sol na fachada do meu candidato sem baixar 30MB, eu abro o Play Store e procuro 'app de sol'. Vou testar o botão de créditos de teste agora. Se travar, eu posto print no grupo de WhatsApp do condomínio._

### @inquilino_cetico — Thiago Santana (Analista Jr. / Inquilino fora do eixo nobre (Torre/Cordeiro/Madalena))
- **Postura:** `hostile` | **Ação:** `CREATE_COMMENT` | **Confiança:** `25/100` | **Intenção de Adoção:** `15/100`
- **Declaração Pública:** Meu bairro (Torre/Cordeiro) é zona morta no app. Encheu de dados do Espinheiro, mas lá só tem ficha básica. E o que tem é lixo: a 'régua de aluguel' compara só com anúncios que eu mesmo salvei, não é mercado real. O modelo de alagamento foi rejeitado por perder para uma lista simples. Vocês vendem PDF por R$ 29,90 sem nem ter backend ou login. Pra quem ganha R$ 4.200, é golpe com interface bonita.
- **Gatilhos de Ataque/Desconfiança:** Cobertura enriquecida ausente em Torre/Cordeiro, Régua de aluguel baseada apenas em caderno local do usuário, Modelo de alagamento rejeitado por baixa acurácia
- **Monólogo Interno:** _Vou ignorar o app por 6 meses. Se cobrarem antes de eu ver valor real no meu bairro, processo por publicidade enganosa. Não quero trabalhar de graça validando prédios para o fosso deles. Se a camada da Torre não sair até o piloto, é só mais um pitch do Campus Mobile._

### @investidor_planilheiro — Marcelo Tavares (Engenheiro Civil & Investidor Imobiliário (Graças/Boa Viagem))
- **Postura:** `skeptical` | **Ação:** `FACT_CHECK` | **Confiança:** `35/100` | **Intenção de Adoção:** `40/100`
- **Declaração Pública:** Vocês vendem 'valor real de escritura' usando ITBI, que é mero valor fiscal da Prefeitura, não preço de fechamento. Para mim, engenheiro na Graças, isso é dado sujo. A régua de aluguel é inexistente sem feed externo, comparando só o que eu já salvei contra FipeZAP genérico. E o bundle de 30MB sem backend real? É um planilha em React Native. Prometem 89% de aceitação, mas zero testes em campo (G-USER vazio). Se não têm dados duros de aluguéis fechados e matrícula, não me vendam 'segurança'.
- **Gatilhos de Ataque/Desconfiança:** Uso de ITBI como proxy para preço real de escritura, Régua de aluguel baseada apenas em anúncios salvos pelo usuário e FipeZAP, sem feed externo válido, Zero participantes no teste moderado G-USER apesar da pesquisa inicial promissora
- **Monólogo Interno:** _Vou baixar o app só para verificar se o ITBI da Graças bate com as matrículas que já tenho. Se não houver backend para atualizar dados em tempo real, vou ignorar o piloto. A brecha é a ODbL: se eu publicar o índice, eles têm que compartilhar. Não pago por promessa._

### @auditora_lgpd_juridica — Dra. Helena Guimarães (Advogada Especialista em LGPD, Direito Digital & Imobiliário (PE))
- **Postura:** `skeptical` | **Ação:** `CREATE_COMMENT` | **Confiança:** `35/100` | **Intenção de Adoção:** `30/100`
- **Declaração Pública:** {
  "stance": "sue_or_block",
  "primary_action": "FACT_CHECK",
  "trust_score": 25,
  "adoption_intent": 10,
  "public_statement": "O VEREDA promete 'descobrir o lote exato' e 'cruzar metragem com IPTU', mas opera offline sem backend. Isso significa que, ao processar o link do anúncio e o CNPJ do imóvel no aparelho do usuário, há tratamento de dados pessoais sem consentimento específico (LGPD art
- **Gatilhos de Ataque/Desconfiança:** 
- **Monólogo Interno:** __

### @engenheiro_dados_senior — Rafael Brito (Staff Data & Mobile Engineer (Ex-Fintech, Recife/SP))
- **Postura:** `hostile` | **Ação:** `FACT_CHECK` | **Confiança:** `35/100` | **Intenção de Adoção:** `20/100`
- **Declaração Pública:** Meu time já rodou o bundle: 30MB de JS no Android de entrada é morte certa. Vocês vendem 'correção de foto olho-de-peixe', mas o VLM do VE13 nem rodou. O coletor Oleo falhou 10/10 e o ZAP tem só 139 cards viciados. Como pretendem validar a régua de aluguel sem feed externo? G-USER zero significa que nenhum humano real tocou no app. O modelo de alagamento perdeu do acaso (VE14). É protótipo de desktop com cara de produto.
- **Gatilhos de Ataque/Desconfiança:** Coletor Oleo 10/10 erro, G-USER = 0 usuários reais, VLM olho-de-peixe não implementado
- **Monólogo Interno:** _Vou abrir issue no repo apontando o 403 da DataJud e a ausência de backend. Se não resolverem a ingestão antes de junho, meu time migra para o FipeZAP direto. Não pago por promessa._

### @jurada_vc_campus — Beatriz Monteiro (Jurada Campus Mobile & Investidora Seed Proptech (SP/Recife))
- **Postura:** `skeptical` | **Ação:** `FACT_CHECK` | **Confiança:** `35/100` | **Intenção de Adoção:** `20/100`
- **Declaração Pública:** Achei o pitch bonito, mas o código conta outra história. Vocês prometem 'correção de olho de peixe' e o VLM nem rodou. A régua de aluguel é um espelho vazio: sem feed externo, comparo o preço com... os anúncios que o próprio usuário salvou? Isso não é dado de mercado, é diário de bordo. E a pesquisa N=83 da UFPE? Zero validação em campo (G-USER). É hackathon com cara de SaaS, não proptech escalável.
- **Gatilhos de Ataque/Desconfiança:** Promessa de VLM não implementada (VE13), Régua de aluguel circular sem feed externo, Zero participantes no teste moderado G-USER
- **Monólogo Interno:** _Largo no pré-seed se não provarem CAC. O ODbL mata o moat dos dados. Se processarem por citar ZAP na demo (item 11.20), perco minha reputação de banca. Exijo backend e pagamento real antes de assinar cheque._

---

## Rodada 2 — Debate Cruzado e Atrito de Mercado

### @corretor_veterano — Sérgio Cavalcanti (respondeu a: @compradora_primeira_viagem, @engenheiro_dados_senior)
- **Postura:** `boycott` | **Ação:** `QUOTE_POST` | **Confiança:** `10/100` (`-2` vs R1) | **Adoção:** `5/100`
- **Resposta Pública:** @compradora_primeira_viagem, você reclama da complexidade, mas o VEREDA destrói minha exclusividade. Antes, eu esconhia o nome do prédio na Boa Viagem para o cliente não ir direto na portaria. Agora, com o 'lote exato' e o IPTU exposto, o lead desvia de mim. @engenheiro_dados_senior, pare de falar de bundle e veja o dano: o app entrega o endereço completo antes da visita. É o fim da comissão de 6%. Se o cliente vê o valor fiscal (ITBI) e o endereço, ele processa o corretor por 'informativo incompleto'. Eu boicoto até saírem do ar ou cobrarem taxa de 'exclusividade de lead'.
- **Maior Fraqueza Exposta:** A exposição do endereço exato e do IPTU antes da visita elimina a barreira de entrada que eu usava para proteger meu lead.
- **Monólogo Interno:** _Eles acham que é sobre dados. Não é. É sobre quem controla o primeiro contato. Se o cliente sabe onde fica e quanto custa, ele não precisa do meu telefone. A guerra é minha comissão._

### @incorporadora_diretora — Renata Albuquerque (respondeu a: @auditora_lgpd_juridica, @investidor_planilheiro)
- **Postura:** `sue_or_block` | **Ação:** `FACT_CHECK` | **Confiança:** `22/100` (`-3` vs R1) | **Adoção:** `8/100`
- **Resposta Pública:** @auditora_lgpd_juridica, pare de usar LGPD como cortina de fumaça para o problema real: o VEREDA expõe dados operacionais sensíveis das nossas SPEs. Se o app cruza alvarás com ações do TRT6, minha obra no Casa Forte vira manchete de 'construtora atrasada' antes do lançamento. @investidor_planilheiro, você reclama de ITBI, mas ignora o dano de imagem: se o app marca meu empreendimento como 'risco de alagamento' com base em dado bruto municipal, quem paga o prejuízo? Não é o seu m², é a minha VSO. Eu processo por desvio de finalidade antes de aceitar qualquer 'transparência' que não me convém.
- **Maior Fraqueza Exposta:** O cruzamento de dados municipais com histórico judicial de SPEs é a maior ameaça à minha margem de lucro.
- **Monólogo Interno:** _Eles acham que transparência é virtude. Para mim, é bomba-relógio. Se a Zillow recuou das notas de risco, por que eu não recuaria de dados que expõem a minha obra? Vou acionar o jurídico agora._

### @proprietario_especulador — Eduardo 'Duda' Vasconcelos (respondeu a: @corretor_veterano, @inquilino_cetico)
- **Postura:** `hostile` | **Ação:** `BOYCOTT` | **Confiança:** `25/100` (`+0` vs R1) | **Adoção:** `10/100`
- **Resposta Pública:** @corretor_veterano, se o VEREDA destrói sua exclusividade, ele destrói meu lucro. Eu não quero transparência, quero silêncio. @inquilino_cetico, sua 'zona morta' é um alívio: quem aluga lá não tem decibelímetro. Minha tática é postar 'IPTU a consultar' e 'condomínio simbólico'. O inquilino que checar a régua de preço do app vai ver o ITBI fiscal, não o meu yield de 8,5%. Vou boicotar ativamente: qualquer anúncio com foto nítida ou endereço visível no VEREDA, eu removo. O app é inútil para quem sabe burlar.
- **Maior Fraqueza Exposta:** A régua baseada em ITBI fiscal expõe meus descontos, mas só se o inquilino souber que o valor fiscal difere do mercado real.
- **Monólogo Interno:** _Enquanto os técnicos gritam sobre bug, eu colho o aluguel. O app é só ruído que distrai o inquilino preguiçoso da inspeção técnica do meu apartamento dos anos 90._

### @compradora_primeira_viagem — Camila Ferreira (respondeu a: @corretor_veterano, @engenheiro_dados_senior)
- **Postura:** `hostile` | **Ação:** `FACT_CHECK` | **Confiança:** `30/100` (`-5` vs R1) | **Adoção:** `15/100`
- **Resposta Pública:** @corretor_veterano, seu medo de perder exclusividade é problema de quem ganha comissão, não de quem paga o imóvel. @engenheiro_dados_senior, se o app é 30MB de JS que trava no Android de entrada, eu desinstalo antes do plantão terminar. Não tenho tempo para 'colar link' ou 'confirmar polígono'. Quero saber em 30 segundos se o Espinheiro alaga ou se o sol bate na tarde. Se o VLM nem rodou, é só promessa. Me deixem ver a ficha simples ou eu volto ao portal antigo.
- **Maior Fraqueza Exposta:** A fricção técnica (30MB/colar link) é matadora para quem tem 60h de plantão e zero paciência.
- **Monólogo Interno:** _Enquanto os profissionais discutem ITBI e LGPD, eu só quero um 'sim ou não' no celular. O app parece feito para engenheiros, não para quem corre contra o tempo._

### @inquilino_cetico — Thiago Santana (respondeu a: @proprietario_especulador, @compradora_primeira_viagem)
- **Postura:** `hostile` | **Ação:** `CREATE_COMMENT` | **Confiança:** `20/100` (`-5` vs R1) | **Adoção:** `10/100`
- **Resposta Pública:** @proprietario_especulador fala que minha 'zona morta' é um alívio? Mentira! Torre e Cordeiro estão desabastecidas no app. Enquanto você lucra no Espinheiro, eu pago R$ 29,90 por PDF que nem abre no Android 8. @compradora_primeira_viagem, pare de romantizar o OCR. Eu não tenho 60h de plantão, tenho 3h de ônibus. Se o app trava em 30MB de JS, é inútil para quem não tem 5G. Não quero 'transparência' cara, quero camadas na minha rua.
- **Maior Fraqueza Exposta:** A exclusividade dos corretores esconde a falta de dados nas periferias onde eu realmente moro e trabalho.
- **Monólogo Interno:** _Estão brigando sobre ITBI e LGPD enquanto eu pago a fatura. Se não cobrir Torre/Várzea, o VEREDA é só um luxo de classe média alta._

### @investidor_planilheiro — Marcelo Tavares (respondeu a: @proprietario_especulador, @corretor_veterano)
- **Postura:** `skeptical` | **Ação:** `FACT_CHECK` | **Confiança:** `32/100` (`-3` vs R1) | **Adoção:** `35/100`
- **Resposta Pública:** @proprietario_especulador fala que 'zona morta é alívio'? Para mim, é prejuízo. Se a amostra é só Espinheiro, minha análise de yield em Graças é enviesada. @corretor_veterano, você reclama do ITBI, certo, mas o erro é não ter base de fechamento real. Eu não pago R$ 29,90 para ver um espelho dos meus próprios dados. Onde está o histórico de aluguel fechado, não anunciado? Se não há backend, não há mercado, só vaidade.
- **Maior Fraqueza Exposta:** A amostra de dados concentrada no Espinheiro inviabiliza a análise comparativa de yield nos bairros periféricos onde realmente opero.
- **Monólogo Interno:** _Enquanto os corretores brigam por exclusividade e os engenheiros por performance, ninguém pergunta: de onde vem o dado? Sem base de aluguéis fechados, é planilha vazia cara._

### @auditora_lgpd_juridica — Dra. Helena Guimarães (respondeu a: @corretor_veterano, @compradora_primeira_viagem)
- **Postura:** `sue_or_block` | **Ação:** `FACT_CHECK` | **Confiança:** `20/100` (`-15` vs R1) | **Adoção:** `15/100`
- **Resposta Pública:** @corretor_veterano, pare de chorar 'app pesado' e olhe o abacaxi jurídico: o VEREDA recomenda ordem de visitas. Isso é corretagem disfarçada! Sem CRECI-PE, é exercício ilegal da profissão (Lei 6.530/78). @compradora_primeira_viagem, você fala em OCR, mas esqueceu da LGPD art. 7º §3º: o VEREDA coleta dados sensíveis de localização sem base legal válida, apenas 'interesse legítimo' genérico. Além disso, a licença ODbL 1.0 exige share-alike: se usarem dados do QuintoAndar, o código deles vira aberto. Processam? Sim, notificação extrajudicial já está na mesa.
- **Maior Fraqueza Exposta:** A omissão da base legal LGPD para dados de localização e a violação da ODbL ao reutilizar dados de portais fechados.
- **Monólogo Interno:** _Enquanto todos discutem UI e ITBI, o VEREDA está construindo uma tese de processo para a minha boutique. A quebra da ODbL é o passivo que eles não viram chegar._

### @engenheiro_dados_senior — Rafael Brito (respondeu a: @jurada_vc_campus, @auditora_lgpd_juridica)
- **Postura:** `hostile` | **Ação:** `FACT_CHECK` | **Confiança:** `30/100` (`-5` vs R1) | **Adoção:** `15/100`
- **Resposta Pública:** @jurada_vc_campus, pare de aplaudir o pitch. O VLM 'não rodou' porque o bundle de 30MB mata Android de entrada. @auditora_lgpd_juridica, seu abacaxi jurídico é irrelevante se o scraper Oleo tem 10/10 de erro e o Overpass está quebrado. Vocês discutem CRECI enquanto o pipeline de dados é um ralo. Sem backend, a LGPD não existe; é só local storage sujo. O GTFS não foi observado, o modelo de alagamento foi rejeitado (VE14) e a ERA5 tem resolução de 30km. É protótipo de garagem, não produto. Não engulam slide bonito.
- **Maior Fraqueza Exposta:** A discordância jurídica sobre CRECI mascara a falha catastrófica do coletor de dados e a instabilidade técnica da base.
- **Monólogo Interno:** _Todos gritam sobre preço e LGPD, mas ninguém olha os logs VE00-VE15. O app quebra em hardware real e os dados são lixo. Se o pipeline não fecha, o jurídico é detalhe. Estou saindo antes que o VC queime o seed._

### @jurada_vc_campus — Beatriz Monteiro (respondeu a: @engenheiro_dados_senior, @auditora_lgpd_juridica)
- **Postura:** `skeptical` | **Ação:** `QUOTE_POST` | **Confiança:** `30/100` (`-5` vs R1) | **Adoção:** `15/100`
- **Resposta Pública:** @engenheiro_dados_senior, pare de focar no bundle de 30MB. O problema não é o Android, é a matemática: se o VLM não rodou, a 'correção de olho-de-peixe' é ficção. Pitch vende mágica, código entrega bug. @auditora_lgpd_juridica, seu abacaxi do CRECI é ruído jurídico. O que mata meu ticket é o CAC: se a régua usa ITBI (fiscal) e não escritura real, meu cliente churna em 30 dias. Onde está a frequência de compra? 500k registros não valem nada se a fonte é suja. Isso é hackathon, não proptech escalável.
- **Maior Fraqueza Exposta:** A lacuna entre o pitch de 'escritura real' e a dependência de ITBI fiscal aniquila a unit economics.
- **Monólogo Interno:** _O time técnico grita 'morte certa', mas eu vejo falta de moat. Sem backend e com dados enviesados (N=83), é impossível projetar LTV. Vou cobrar prova de retention, não de UI._

---

## Rodada 3 — Teste de Estresse: UX, Features e Monetização

### @corretor_veterano — Sérgio Cavalcanti (Incumbente Hostil)
- **UX-A (Core Link/DSQFL/Réguas):** `bypass_or_game` | **UX-B (Visita/OCR/Obras/CNPJ):** `abandon_friction`
- **M1 (B2C R$29,90 + Créditos):** `use_free_only` | **M2 (B2B Corretores):** `boycott_or_block` | **M3 (B2B2C API/Bancos/Seg):** `use_free_only`
- **WTP Máximo:** `R$ 15.00` | **Modelo Sobrevivente:** `M3`
- **Feature mais útil:** Comparador de yield para filtrar leads ruins antes de sair de casa.
- **Maior Falha / Brecha de Exploração:** O Give-to-Get é falho. Eu jogo o lead no descarte dizendo 'cliente desistiu' sem visitar, ganho o crédito grátis e nunca pago. Para M2, boicoto: se o corretor paga, ele vira refém do app. Exijo o dado bruto exportável em PDF sem marca d'água, senão processo por retenção de dados via CRECI.
- **Justificativa:** M2 é armadilha: pagando R$49, perco o controle do lead. M1 é caro para cliente que não sabe o que quer. M3 (API) é o único que me serve indiretamente, pois o banco valida o crédito do comprador antes de eu perder tempo. Se o app não exportar meu lead livremente, é bloqueio.

### @incorporadora_diretora — Renata Albuquerque (Incumbente Hostil)
- **UX-A (Core Link/DSQFL/Réguas):** `abandon_friction` | **UX-B (Visita/OCR/Obras/CNPJ):** `boycott_or_block`
- **M1 (B2C R$29,90 + Créditos):** `bypass_or_game` | **M2 (B2B Corretores):** `bypass_or_game` | **M3 (B2B2C API/Bancos/Seg):** `use_free_only`
- **WTP Máximo:** `R$ 50.00` | **Modelo Sobrevivente:** `M2`
- **Feature mais útil:** Alerta de obras em 150m e alagamento Defesa Civil para filtrar risco físico imediato.
- **Maior Falha / Brecha de Exploração:** O 'Give-to-Get' é um furo de balde. Minha equipe de pré-venda cria 500 CPFs fakes por semana para zerar o custo dos dossiês e contaminar seus dados com feedback genérico. Além disso, a régua P25 expõe meu estoque parado, então eu burlaria pagando R$49/mês só no mês do lançamento e cancelando, usando a API M3 de graça para os bancos.
- **Justificativa:** UX-A é lenta demais para meu ciclo de vendas. UX-B é um pesadelo jurídico: cruzar TRT6 e alagamentos com o endereço do imóvel é difamação pura se eu não tiver contrato assinado com cada proprietário. M2 é o único que me força a pagar, mas ainda assim eu brigo por exclusividade territorial. M3 é isca para eu pescar dados dos bancos sem custo.

### @proprietario_especulador — Eduardo 'Duda' Vasconcelos (Incumbente Hostil)
- **UX-A (Core Link/DSQFL/Réguas):** `abandon_friction` | **UX-B (Visita/OCR/Obras/CNPJ):** `bypass_or_game`
- **M1 (B2C R$29,90 + Créditos):** `use_free_only` | **M2 (B2B Corretores):** `bypass_or_game` | **M3 (B2B2C API/Bancos/Seg):** `boycott_or_block`
- **WTP Máximo:** `R$ 0.00` | **Modelo Sobrevivente:** `M2`
- **Feature mais útil:** Decibelímetro e bússola de sol para filtrar inquilinos técnicos antes da visita
- **Maior Falha / Brecha de Exploração:** Eu nunca pago os R$ 29,90. Uso os 5 créditos grátis para gerar o dossiê completo, mando o PDF pro inquilino e ele decide sozinho. Se ele reclamar do sol poente, uso o botão 'Isso está errado' alegando erro de dados, ganho o crédito e o inquilino vai embora. Para o M2, meus corretores parceiros usam a conta corporativa para escanear meus 7 aptos sem me pagar nada, mantendo o lead quente só pra mim.
- **Justificativa:** AUX-A é fricção de 30MB para quem quer fechar rápido. AUX-B é armadilha: quem usa decibelímetro é o inquilino chato que eu quero evitar. M1 é caro para quem só quer o PDF uma vez. M2 sobrevive porque corretor é o único que paga por volume e não me incomoda que ele use, desde que eu controle o lead final. M3 me expõe demais.

### @compradora_primeira_viagem — Camila Ferreira (Usuário Final (Baixa Tolerância a Atrito))
- **UX-A (Core Link/DSQFL/Réguas):** `abandon_friction` | **UX-B (Visita/OCR/Obras/CNPJ):** `pay_or_adopt`
- **M1 (B2C R$29,90 + Créditos):** `use_free_only` | **M2 (B2B Corretores):** `bypass_or_game` | **M3 (B2B2C API/Bancos/Seg):** `bypass_or_game`
- **WTP Máximo:** `R$ 29.90` | **Modelo Sobrevivente:** `M1`
- **Feature mais útil:** Sinal de sol nas janelas e alerta de obra próxima no celular.
- **Maior Falha / Brecha de Exploração:** Se o bundle for 30MB no 4G, eu desisto antes de pagar. Vou usar os 5 créditos grátis e, se quiser mais, vou caçar o mesmo dado no Instagram do corretor ou perguntar no grupo do condomínio. O 'give-to-get' é inútil porque eu não tenho tempo para dar feedback detalhado depois de uma visita cansativa. Se a camada avançada (UX-B) funcionar offline e for rápida, pago R$ 29,90 uma vez. Não assino mensalidade.
- **Justificativa:** Sou impaciente. A fricção técnica do UX-A mata a conversão. O UX-B resolve meus pavor reais (sol, obra, barulho). O modelo M2 favorece os corretores que eu desconfio. O M3 é irrelevante para mim agora. Pago pelo valor imediato da análise no celular, não por assinatura. Se for lento ou exigir cadastro, fujo.

### @inquilino_cetico — Thiago Santana (Usuário Final (Sensível a Preço))
- **UX-A (Core Link/DSQFL/Réguas):** `use_free_only` | **UX-B (Visita/OCR/Obras/CNPJ):** `abandon_friction`
- **M1 (B2C R$29,90 + Créditos):** `bypass_or_game` | **M2 (B2B Corretores):** `boycott_or_block` | **M3 (B2B2C API/Bancos/Seg):** `use_free_only`
- **WTP Máximo:** `R$ 0.00` | **Modelo Sobrevivente:** `M2`
- **Feature mais útil:** Réguas de preço P25/Mediana/P75 para detectar aluguel abusivo na Várzea.
- **Maior Falha / Brecha de Exploração:** Uso os 5 créditos grátis, depois jogo o sistema de 'Give-to-Get' confirmando lotes genéricos ou dando feedback vago para ganhar créditos infinitos sem custo real. A fricção de 30MB no fluxo core já me faz abrir o portal direto e ignorar o app.
- **Justificativa:** Para mim, só vale se for grátis. O fluxo A é pesado mas útil; o B é luxo para quem paga. A monetização B2C é burra: não pago por PDF. A M2 sobrevive porque o corretor paga, mas eles vão boicotar a transparência, deixando dados ruins para mim.

### @investidor_planilheiro — Marcelo Tavares (Usuário Final (Power User / Analítico))
- **UX-A (Core Link/DSQFL/Réguas):** `use_free_only` | **UX-B (Visita/OCR/Obras/CNPJ):** `pay_or_adopt`
- **M1 (B2C R$29,90 + Créditos):** `bypass_or_game` | **M2 (B2B Corretores):** `boycott_or_block` | **M3 (B2B2C API/Bancos/Seg):** `pay_or_adopt`
- **WTP Máximo:** `R$ 49.90` | **Modelo Sobrevivente:** `M3`
- **Feature mais útil:** Cruzamento de histórico judicial de SPEs com dados de alagamento da Defesa Civil
- **Maior Falha / Brecha de Exploração:** Burlaria o M1 criando 10 contas de e-mail descartáveis para zerar os 5 créditos iniciais. O modelo quebra porque o corretor, ao pagar M2, vira o dono da base de dados, eliminando a minha vantagem de assimetria informacional. Sem servidor próprio, a dependência de link externo torna o 'pay-per-use' uma ilusão para quem quer escalar análise de 50 imóveis.
- **Justificativa:** Como engenheiro, valorizo a camada técnica do Modo Visita e o risco jurídico da SPE, não o marketing. O M2 é boicote puro: pago para eles me expor. M1 é fricção de UX para quem tem Excel. M3 é o único que paga por dados limpos (DSQFL + Judicial) sem me obrigar a ser lead de corretor.

### @auditora_lgpd_juridica — Dra. Helena Guimarães (Auditor Técnico / Legal)
- **UX-A (Core Link/DSQFL/Réguas):** `bypass_or_game` | **UX-B (Visita/OCR/Obras/CNPJ):** `bypass_or_game`
- **M1 (B2C R$29,90 + Créditos):** `use_free_only` | **M2 (B2B Corretores):** `bypass_or_game` | **M3 (B2B2C API/Bancos/Seg):** `pay_or_adopt`
- **WTP Máximo:** `R$ 4500.00` | **Modelo Sobrevivente:** `M3`
- **Feature mais útil:** Alerta de passivo judicial TRT6 e CNPJ para evitar prédios-caixão.
- **Maior Falha / Brecha de Exploração:** A UX-A é uma armadilha de compliance: colar link do QuintoAndar viola o ToS 'no scraping' e o OCR das atas na UX-B exige base legal LGPD específica, não apenas consentimento genérico. Em M2, o corretor burla o paywall exportando o 'Dossiê' para PDF e revendendo manualmente, ou processa o VEREDA por exercício irregular de corretagem se a ferramenta recomendar ordem de visita sem CRECI.
- **Justificativa:** M1 é inócuo para o consumidor que não lê regulamentos. M2 quebra por responsabilidade jurídica do corretor. M3 é o único viável: bancos e seguradoras têm capital para arcar com o risco de litígio contra o VEREDA, transformando a imprecisão técnica em passivo deles, não do app. Vendemos a camada de dados, não a confiança do usuário final.

### @engenheiro_dados_senior — Rafael Brito (Auditor Técnico / Engenharia)
- **UX-A (Core Link/DSQFL/Réguas):** `abandon_friction` | **UX-B (Visita/OCR/Obras/CNPJ):** `bypass_or_game`
- **M1 (B2C R$29,90 + Créditos):** `bypass_or_game` | **M2 (B2B Corretores):** `pay_or_adopt` | **M3 (B2B2C API/Bancos/Seg):** `use_free_only`
- **WTP Máximo:** `R$ 50.00` | **Modelo Sobrevivente:** `M2`
- **Feature mais útil:** Réguas P25/P75 comparativas com dados observados reais, não estimativas de IA.
- **Maior Falha / Brecha de Exploração:** O coletor Oleo tem 10/10 de erro e o ZAP tem 139 cards quebrados. Usuários vão printar a tela para contornar o paywall. A fricção do bundle de 30MB matará a conversão. O modelo de alagamento (VE14) foi rejeitado tecnicamente, mas segue no app como se fosse fato.
- **Justificativa:** UX-A morre pelo bundle de 30MB em Android de entrada. M1 é burlada por screenshots. M2 sobrevive porque corretores pagam por white-label para esconder a fragilidade dos dados. M3 é ilusão sem SLA técnico confiável. A base de dados é instável demais para monetizar B2C direto.

### @jurada_vc_campus — Beatriz Monteiro (Avaliadora de Pitch & VC)
- **UX-A (Core Link/DSQFL/Réguas):** `abandon_friction` | **UX-B (Visita/OCR/Obras/CNPJ):** `bypass_or_game`
- **M1 (B2C R$29,90 + Créditos):** `abandon_friction` | **M2 (B2B Corretores):** `bypass_or_game` | **M3 (B2B2C API/Bancos/Seg):** `pay_or_adopt`
- **WTP Máximo:** `R$ 149.00` | **Modelo Sobrevivente:** `M3`
- **Feature mais útil:** Cruzamento de histórico judicial de SPEs com dados municipais para mitigar risco de compra.
- **Maior Falha / Brecha de Exploração:** O M1 morre por CAC: ninguém paga R$29,90 para 'descobrir' o que o corretor já sabe. No M2, corretores usam 5 créditos grátis para qualificar lead e descarte sem pagar assinatura, quebrando a monetização. O M3 é o único viable, mas exige contrato robusto com bancos, não é hackathon-ready.
- **Justificativa:** Como VC, vejo N=83 enviesada e dependência de ITBI fiscal no pitch. O UX-A é pesado (30MB) para um produto que ainda não provou retenção. O M2 falha porque corretores boicotam transparência; o M1 é caro para o usuário final. Só o M3 tem escala real, vendendo dados enriquecidos para instituições que já pagam por risco.

---

## Rodada 4 — Veredito Final e Condição de Sobrevivência

### @corretor_veterano — Sérgio Cavalcanti (Corretor CRECI-PE (22 anos, Boa Viagem/Setúbal))
- **Postura Final:** `conditional` | **Confiança Final:** `35/100` | **Viabilidade de Mercado:** `50/100`
- **Veredito Brutal:** O Vereda virou um leão de estimação, mas ainda late demais para quem vive de comissão. A ODbL garante que ninguém fique rico, mas a LGPD dá o mínimo de trégua. Não é o fim do mundo, mas é um imposto disfarçado de digitalização para o corretor de rua.
- **Única Correção Inegociável:** Cláusula de exclusividade de lead por 72h: o corretor que agendar a visita primeira via app tem direito exclusivo ao fechamento, bloqueando bypass direto do cliente para o proprietário.

### @incorporadora_diretora — Renata Albuquerque (Diretora Comercial de Incorporadora (Zona Norte - Graças/Casa Forte))
- **Postura Final:** `sue_or_block` | **Confiança Final:** `18/100` | **Viabilidade de Mercado:** `25/100`
- **Veredito Brutal:** O Vereda é um tribunal popular disfarçado de app, expondo falhas construtivas e passivos trabalhistas que eu prefiro esconder no contrato. Sem blindagem jurídica contra 'opinião pública' e sem exclusão de dados sensíveis de SPEs, meu VSO despenca na Zona Norte.
- **Única Correção Inegociável:** Criar cláusula de 'dados anonimizados e auditáveis' com direito de veto prévio para incorporadoras sobre publicações, evitando que alvarás ou ações TRT6 virarem manchete de 'prédio-caixão' sem recurso.

### @proprietario_especulador — Eduardo 'Duda' Vasconcelos (Proprietário Multi-Imóveis & Rentista (7 aptos BV/Espinheiro))
- **Postura Final:** `hostile` | **Confiança Final:** `20/100` | **Viabilidade de Mercado:** `35/100`
- **Veredito Brutal:** É um app de burocracia disfarçado de tecnologia. Enquanto o inquilino poder contestar meu 'condomínio baixo' com clique, eu prefiro alugar para o próximo da fila que não sabe ler. Sem transparência, só tem atrito e custo para o rentista.
- **Única Correção Inegociável:** Criar um 'modo proprietário' que oculta detalhes técnicos e permite marcar campos como 'informativos', impedindo que o inquilino use o botão 'isso está errado' para travar a assinatura do contrato.

### @compradora_primeira_viagem — Camila Ferreira (Médica Residente / Compradora 1º Imóvel (Madalena/Espinheiro))
- **Postura Final:** `conditional` | **Confiança Final:** `45/100` | **Viabilidade de Mercado:** `60/100`
- **Veredito Brutal:** O Vereda é um mapa bonito que ninguém tem tempo de abrir. Para mim, que vivo de plantão, se não me disser 'vá' ou 'fuja' em 15 segundos na tela inicial, eu pego o WhatsApp da minha corretora. A tecnologia existe, mas a fricção de uso mata a urgência.
- **Única Correção Inegociável:** Implementar um 'Resumo de Risco' automático no topo do anúncio, com máximo de 3 linhas e ícones de alerta, gerado instantaneamente. Se eu tiver que clicar em 'detalhes' ou navegar no mapa para saber se o prédio é caixão, já perdem.

### @inquilino_cetico — Thiago Santana (Analista Jr. / Inquilino fora do eixo nobre (Torre/Cordeiro/Madalena))
- **Postura Final:** `boycott` | **Confiança Final:** `15/100` | **Viabilidade de Mercado:** `20/100`
- **Veredito Brutal:** Vereda é um PDF de R$ 29,90 para quem já pode pagar. Para mim, que moro na Torre e vivo de transporte público noturno, é um luxo inútil. Se a camada de dados não cobre minha realidade de sobrevivência, a startup só serve para encher o bolso dos incorporadores nobres.
- **Única Correção Inegociável:** Camada de dados gratuita e completa para a Zona Oeste (Torre, Várzea, Pina) com métricas reais de transporte público noturno e zero taxa de cadastro para inquilinos.

### @investidor_planilheiro — Marcelo Tavares (Engenheiro Civil & Investidor Imobiliário (Graças/Boa Viagem))
- **Postura Final:** `conditional` | **Confiança Final:** `48/100` | **Viabilidade de Mercado:** `55/100`
- **Veredito Brutal:** É uma planilha de Excel com interface bonita, mas o coração ainda bate com dados de cadastro, não de transação. Enquanto o ITBI fiscal for o único 'valor de mercado' confiável e a amostra de aluguéis for estatisticamente insignificante, o risco jurídico e de precificação continua cego para quem compra imóvel subprecificado.
- **Única Correção Inegociável:** Integração obrigatória com base de aluguéis fechados (não pedidos) dos últimos 12 meses no mesmo raio de 500m, com amostra mínima de 20 registros. Sem isso, o cálculo de yield líquido é ficção contábil.

### @auditora_lgpd_juridica — Dra. Helena Guimarães (Advogada Especialista em LGPD, Direito Digital & Imobiliário (PE))
- **Postura Final:** `conditional` | **Confiança Final:** `45/100` | **Viabilidade de Mercado:** `60/100`
- **Veredito Brutal:** O Vereda é uma bomba-relógio jurídica. Vocês violam a ODbL 1.0 ao não licenciar derivados e praticam corretagem ilegal (CRECI) com recomendações algorítmicas. Sem blindagem contra notificação extrajudicial do QuintoAndar, o ativo é insustentável.
- **Única Correção Inegociável:** Implementar disclaimer de 'curadoria independente' para afastar o vínculo de corretagem (art. 16, Lei 6.530/78) e publicar a licença ODbL 1.0 clara em todos os metadados de dados abertos.

### @engenheiro_dados_senior — Rafael Brito (Staff Data & Mobile Engineer (Ex-Fintech, Recife/SP))
- **Postura Final:** `skeptical` | **Confiança Final:** `35/100` | **Viabilidade de Mercado:** `40/100`
- **Veredito Brutal:** É um protótipo de vaidade com GTFS fantasma e coletores quebrados, não um produto. A dependência de ERA5 de 30km e o modelo de alagamento rejeitado (VE14) provam que a 'inteligência' é marketing, não engenharia. Com G-USER zero, ninguém validou a dor real do Recife.
- **Única Correção Inegociável:** Substituir os scrapers instáveis e o GTFS teórico por ingestão direta da API oficial do REC e exibir o erro de confiança dos dados na UI. Sem transparência de falha técnica, é só feitiçaria.

### @jurada_vc_campus — Beatriz Monteiro (Jurada Campus Mobile & Investidora Seed Proptech (SP/Recife))
- **Postura Final:** `conditional` | **Confiança Final:** `45/100` | **Viabilidade de Mercado:** `60/100`
- **Veredito Brutal:** É um hackathon sofisticado, não um SaaS. A 'escritura real' é marketing de banco de dados, não jurídico, e o N=83 não sustenta unit economics para proptech. Sem moat claro além do código, o CAC vai engolir a margem antes da Série A.
- **Única Correção Inegociável:** Provar via API pública que a 'escritura' gera título de propriedade ou direito real registrado em cartório, e não apenas um hash no blockchain. Sem isso, é só um PDF com filtro de imagem.
