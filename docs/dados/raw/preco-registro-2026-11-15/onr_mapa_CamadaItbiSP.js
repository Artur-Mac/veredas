/**
 * Classe para trabalhar com a camada de transações
 */
class CamadaItbiSP {
    /**
     * Construtor da classe
     *
     * @param object oDados
     * @param Leaflet.Layer oDados.layer
     * @param object oDados.configCamadas
     * @param string oDados.tokenAuth
     * @param GerenciadorRequisicoes oGerenciadorRequisicoes
     */
    constructor({
        layer,
        configCamadas,
        tokenAuth,
        mapa,
        ajaxUrl,
        mensagemErroPopup,
        iconesPin,
        oGerenciadorRequisicoes,
    }) {
        /**
         * Seta os nomes das camadas
         *
         * @type {object} listaMetodosCamada
         */
        this.listaMetodosCamada = {
            layer_transacoes: {
                handler: () => { },
                style: {}
            },
            // layer_registros_sp_itbi: {
            //     handler: () => { },
            //     style: {}
            // },
            // layer_registros_mg_itbi: {
            //     handler: () => { },
            //     style: {}
            // },
        };

        this.layer = layer;
        this.configCamadas = configCamadas;
        this.token = tokenAuth;
        this.mapa = mapa;
        this.ajaxUrl = ajaxUrl;
        this.mensagemErroPopup = mensagemErroPopup;
        this.iconesPin = iconesPin;

        /**
         * Faz o bind dos métodos para o this da classe
         */
        this.getData = this.getData.bind(this);
        this.createPopup = this.createPopup.bind(this);
        this.createPopupHtml = this.createPopupHtml.bind(this);
        this.handleLayerClick = this.handleLayerClick.bind(this);

        /**
         * Aplica a função de gerenciar o clique nos eventos do array
         */
        ['click', 'clusterclick'].forEach(sEvent => {
            /**
             * Remove as funções acionadas pelo evento do loop
             */
            //this.layer.off(sEvent);

            /**
             * Aplica o evento à camada
             */
            this.layer.on(sEvent, this.handleLayerClick);
        });

        /**
         * Seta a instância da classe de gerenciador de requisições
         *
         * @type {GerenciadorRequisicoes}
         */
        this.oGerenciadorRequisicoes = oGerenciadorRequisicoes;
    }

    /**
     * Transforma a request em promise
     */
    getData({ params, url }) {
        return new Promise(
            (resolve, reject) => {
                /**
                 * Tentativas de consulta
                 *
                 * @type {int}
                 */
                let iTentativas = 0;

                const enviar = () => {
                    // Incrementa as tentativas
                    iTentativas++;

                    this.mapa.validate_recaptcha(
                        (sToken) => {
                            $.post(url, {
                                ...params,
                                recaptchaToken: sToken
                            }, resolve).fail((oResultado) => {
                                /**
                                 * Verifica se há tentativas disponíveis
                                 */
                                if (iTentativas < 2) {
                                    /**
                                     * Faz uma nova tentativa
                                     */
                                    enviar();
                                    return;
                                }

                                const { responseJSON } = oResultado;

                                /**
                                 * Se falhou, exibe mensagem de erro
                                 */
                                if (responseJSON.hasOwnProperty('mensagem')) {
                                    alert("Ocorreu um erro!\n" + responseJSON.mensagem);
                                } else {
                                    alert("Ocorreu um erro!\nTente recarregar a página.");
                                }

                                reject(oResultado);
                            });
                        }
                    );
                };
                enviar();
            }
        );
    }

    /**
     * Método responsável por converter a query para promises
     *
     * @returns Promise<{error, featureCollection, response, camada}>
     */
    queryToPromise({ queryLayer, camada }) {
        /**
         * Cria a promise
         */
        return new Promise((resolve, reject) => {

            queryLayer.simplify(this.mapa, window.fFatorSimplificacao);

            /**
             * Executa a query
             *
             * @type {XMLHttpRequest} oQueryRequest
             */
            const oQueryRequest = queryLayer.run((error, featureCollection, response) => {
                /**
                 * Cria a resposta com os dados
                 *
                 * @type {object} oResponseData
                 */
                const oResponseData = {
                    error,
                    featureCollection,
                    response,
                    camada
                };

                if (error) return reject(oResponseData);
                return resolve(oResponseData);
            })

            this.oGerenciadorRequisicoes.addRequisicao(oQueryRequest);
        })
    }

    /**
     * Função responsável por executar os eventos de clique
     */
    async handleLayerClick(e) {
        // 0. Pega a raiz que disparou o grupo de eventos (geralmente o MarkerClusterGroup)
        const oInstanciaDisparadora = e.target;

        // 1. TRAVA DE SEGURANÇA: Se a classe já estiver processando um clique neste milissegundo, ignora as chamadas fantasmas
        if (oInstanciaDisparadora._isProcessingClick) {
            return;
        }

        // Verifica se é a camada de grupo de pontos correta.
        const targetMarker = e.layer.getAllChildMarkers ? e.layer.getAllChildMarkers()[0] : e.layer;
        const sNome = targetMarker.options?.nomeDaCamada;
        if (sNome !== 'IMOVEIS_TRANSFERIDOS') {
            return;
        }

        // Ativa a trava imediatamente para barrar as próximas 3 chamadas redundantes
        oInstanciaDisparadora._isProcessingClick = true;

        /**
         * Captura o tipo do evento
         *
         * @type {string} sEventType
         */
        const sEventType = e.type;

        let aIdsImoveis;
        let sCodigoIbge;
        
        if (sEventType !== 'click') {
            /**
             * Instância da classe para gerenciar o zoom do cluster
             *
             * @type {HandleClusterZoom} oHandleClusterZoom
             */
            const oHandleClusterZoom = new HandleClusterZoom(e.layer);

            /**
             * Aplica o zoom no cluster e verifica se o zoom foi aplicado
             *
             * @type {boolean} isZoomed
             */
            const isZoomed = oHandleClusterZoom
                .zoomToCluster()
                .isZoomed();

            /**
             * Verifica se o zoom foi aplicado e retorna
             * Para não exibir o popup
             */
            if (isZoomed) {
                /**
                 * Exibir mensagem de aviso para o usuário
                 * Ocultar depois de 3 segundos com um timeout
                 */
                $('.floating-aviso')
                    .css({ display: 'flex' })
                    .find('.mensagem')
                    .html(`Os registros serão exibidos a partir do nível de zoom ${oHandleClusterZoom.iLimiteZoomMaximo}`);

                /**
                 * Limpa o timeout de aviso de zoom, se definido
                 */
                if (this.mapa?.oTimeoutAvisoZoom) {
                    clearTimeout(this.mapa.oTimeoutAvisoZoom);
                }

                /**
                 * Timeout para ocultar a mensagem de aviso
                 *
                 * @type {Timeout} oTimeoutAvisoZoom
                 */
                const oTimeoutAvisoZoom = setTimeout(() => {
                    $('.floating-aviso').hide();
                }, 3000);

                /**
                 * Seta o timeout para a instância do mapa
                 */
                this.mapa.oTimeoutAvisoZoom = oTimeoutAvisoZoom;
                // Libera a trava caso seja apenas um evento de zoom
                oInstanciaDisparadora._isProcessingClick = false;
                return;
            }

            /**
             * Captura os ids dos imóveis presentes no cluster
             *
             * @type {array} aIdsImoveis
             */
            aIdsImoveis = e.layer
                .getAllChildMarkers()
                .map(child => {
                    const { properties } = child.feature
                    return ({
                        idLinha: properties.idLinha ?? properties.idlinha,
                        isItbi: !!properties?.codigoibge || false,
                        codigoIbge: properties?.codigoibge
                    })
                });
        } else {
            /**
             * Captura os ids dos imóveis presentes no cluster
             *
             * @type {array} aIdsImoveis
             */
            aIdsImoveis = [{
                idLinha: e.layer.feature.properties.idLinha ?? e.layer.feature.properties.idlinha,
                isItbi: !!e?.layer?.feature?.properties?.codigoibge || false,
                codigoIbge: e?.layer?.feature?.properties?.codigoibge
            }];
        }

        $('#overlay_loading').show();

        try {

            const sPopupHtml = await this.getDataPopup({
                aIdsImoveis,
                latlng: e.latlng
            });

            L.popup({
                closeButton: true,
                autoClose: true,
                className: 'imoveis-popup'
            })
                .setLatLng([e.latlng.lat, e.latlng.lng])
                .setContent(sPopupHtml)
                .openOn(this.mapa);

            if (e.layer._icon) {
                e.layer._icon.classList.add('cluster-selected');
            }

            $('#overlay_loading').hide();

            // 2. Libera a trava após concluir a renderização com sucesso
            oInstanciaDisparadora._isProcessingClick = false;
            return;
        } catch (error) {
            $('#overlay_loading').hide();
            console.log(error);
            // 3. Libera a trava caso a requisição PHP falhe, permitindo novos cliques futuros
            oInstanciaDisparadora._isProcessingClick = false;
        }

    }

    /**
     * Método responsável por consultar os dados e retornar
     * o conteúdo em HTML para o popup
     *
     * @param {{aIdsImoveis: string, latlng: object}} param0
     *
     * @returns {string} Conteúdo em HTML para o popup
     */
    async getDataPopup({
        aIdsImoveis,
        latlng
    }) {
        const oParams = {
            acao: 'consultaDadosImovelTransacoes',
            id: aIdsImoveis,
            ...latlng,
        }

        /**
         * Faz a consulta dos dados, em formato de promise
         */
        const { dados, mensagem, config } = await this.getData(
            { params: oParams, url: this.ajaxUrl }
        );

        const sPopupHtml = !dados
            ? `
                <div class="row border-popup">
                    <div class="col-sm-12" style="padding: 0px 5px;">
                        <p style="text-align: center; font-size: 14px; padding: 0px; margin: 0px;">
                            ${this.mensagemErroPopup}
                        </p>
                    </div>
                </div>
            `
            : this.createPopup({ dados, config });

        return sPopupHtml;

    }

    criaQueryLayer({ config }) {
        return L.esri.query({ url: config.path }).token(this.token);
    }

    createPopupHtml({ dado, config }) {
        const idLinha = dado.idLinha
        /**
         * Captura as configurações dos campos
         *
         * @type {object} oCamposConfig
         */
        const oCamposConfig = config.campos

        /**
         * Cria objeto chave/valor para as configurações
         *
         * @type {object} oCamposPosicao
         */
        const oCamposPosicao = {}

        /**
         * Verifica se existem configurações
         */
        if (oCamposConfig) {

            /**
             * Itera sobre as configurações, e adiciona no objeto chave/valor
             */
            Object.keys(oCamposConfig).forEach(iKeyCampo => {
                const sChave = oCamposConfig[iKeyCampo].campo
                const sValor = oCamposConfig[iKeyCampo].exibeMapa
                oCamposPosicao[sChave] = sValor
            })
        } else {
            /**
             * Itera sobre os dados, para exibir todos os campos
             */
            Object.keys(dado).forEach(sKeyCampo => {
                oCamposPosicao[sKeyCampo] = 1
            })
        }
        const bCamadaPontosNotDoi = dado.doiOriginal != 1

        /**
         * Função para criação de style de exibição dos campos
         *
         * @param {bool} bExibe Controlador da exibição do campo
         *
         * @return {string}
         */
        const fExibeLinha = (bExibe) => `style="display: ${bExibe == 1 ? 'flex' : 'none'}"`
        const bServentiaAntiga = dado.serventiaAntiga == 1 && !bCamadaPontosNotDoi
        const sServentia = `${dado.Serventia} - ${dado.nomeCartorio}`.trim() || '-';
        const sLocalCartorio = dado.cartorio_lat && dado.cartorio_long
            ? `
                <a href="#" class="link-centraliza-cartorio" data-lat="${dado.cartorio_lat}" data-lng="${dado.cartorio_long}">
                    ${sServentia}
                    <img src="${this.iconesPin.bigPin}" width="30" height="30" />
                </a>
            `
            : `${sServentia}`;

        const sCnmFormatado = `${dado.CNM.slice(0, 9)}<span title="Número da matrícula">${dado.CNM.slice(9, 16)}</span>${dado.CNM.slice(16)}`;

        const sPopupCluster = `
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.CNM)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">CNM</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${sCnmFormatado}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Matricula)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Matrícula</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.Matricula}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Serventia && oCamposPosicao.nomeCartorio)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">CNS / Serventia ${bServentiaAntiga ? '(<strong>antiga competência</strong>)' : ''}</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${sLocalCartorio}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Data_Lavratura)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Data Registro</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.Data_Lavratura}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Data_Alienacao)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Data Alienação</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.Data_Alienacao}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.tipoTransacaoDesc)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Tipo Transação</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.tipoTransacaoDesc}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Valor_Alienacao_Aquisicao)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Valor Alienação / Aquisição</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.Valor_Alienacao_Aquisicao}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Valor_ITBI_Nao_Consta_Nos_Documentos)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Valor ITBI</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.Valor_ITBI_Nao_Consta_Nos_Documentos}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Inscricao_NIRF)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Insc. municipal / NIRF</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.Inscricao_NIRF || 'Não informado'}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Endereco_Imovel_RET || oCamposPosicao.Numero_Imovel_RET || oCamposPosicao.Bairro_Imovel_RET)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Endereço</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${oCamposPosicao.Endereco_Imovel_RET && dado.Endereco_Imovel_RET}, ${oCamposPosicao.Numero_Imovel_RET && dado.Numero_Imovel_RET} - ${oCamposPosicao.Bairro_Imovel_RET && dado.Bairro_Imovel_RET}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Complemento_Imovel_RET)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Complemento</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.Complemento_Imovel_RET}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Municipio_Imovel_RET)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Cidade / UF</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.Municipio_Imovel_RET} - ${dado.UF_Imovel_RET}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.CEP_Imovel_RET)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">CEP</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.CEP_Imovel_RET}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.Area_Imovel)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">Área do Imóvel</div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.Area_Imovel}
                </div>
            </div>
            <div class="row border-popup align-items-center" ${fExibeLinha(oCamposPosicao.idLinha)}>
                <div class="col-md-5 col-sm-5" style="text-align: right; padding: 0px 5px;">
                    ID
                </div>
                <div class="col-md-7 col-sm-7" style="text-align: left; padding: 0px 5px;">
                    ${dado.idLinha}
                </div>
            </div>
            <div class="row ocultar-imprimir">
                <div class="col-md-5 col-sm-6 div-buttons" style="text-align: right; padding: 0px 5px;">
                    <a
                        class="btn btn-primary"
                        target="_blank"
                        href="https://ridigital.org.br/CertidaoDigital/frmPedidosCertidao.aspx?from=menu&digital=1"
                        style="background: #27255f; border-color: #27255f; margin-top: 10px !important; color: white; padding: 7.5px 15px"
                    >
                        Solicitar Certidão Digital
                    </a>
                </div>
                <div class="col-md-7 col-sm-6 div-buttons" style="padding: 0px 5px;">
                    <a
                        class="btn btn-primary"
                        target="_blank"
                        href="https://ridigital.org.br/VisualizarMatricula/DefaultVM.aspx?from=menu"
                        style="margin-top: 10px !important; color: white; background-color: #5bc0de; border-color: #5bc0de; padding: 7.5px 15px;"
                    >
                        Visualização de Matrícula
                    </a>
                </div>
            </div>
            <div class="row" style="border-top: 1px solid black; margin-top: 30px; margin-bottom: 25px; margin-right: 17px">
            </div>
        `;

        return sPopupCluster;
    }

    /**
     * Método responsável por fazer a criação do popup com as informações
     */
    createPopup({ dados, config }) {
        let sPopupCluster = '';
        if (dados.length && dados.length >= 0) {
            dados.forEach(oDado => {
                if (!oDado.idLinha) {
                    return;
                }
                sPopupCluster += this.createPopupHtml({ dado: oDado, config })
            })
        } else {
            if (!dados.idLinha) {
                return;
            }
            sPopupCluster = this.createPopupHtml({ dado: dados, config })
        }
        return sPopupCluster;
    }

    /**
     * Realiza a consulta das camadas declaradas
     *
     * @param Leaflet.LatLng searchBound
     */
    async consultaCamadas(searchBound) {
        /**
         * Limpa a camada
         */
        this.layer.clearLayers();

        /**
         * Captura as camadas para consulta nas configurações
         *
         * @type {array} aCamadas
         */
        const aCamadas = Object.keys(this.listaMetodosCamada);

        const aQueryPromises = aCamadas.map(sCamada => {
            /**
             * Captura a configuração da camada
             *
             * @type {object} oConfigCamada
             */
            const oConfigCamada = this.configCamadas[sCamada];

            /**
             * Verifica se a camada existe, para fazer a consulta
             *
             * @type {object} oLayer
             */
            const oLayer = this.criaQueryLayer({ config: oConfigCamada });

            /**
             * Aplica o filtro para os polígonos que contém a posição atual do
             * clique
             */
            oLayer.intersects(searchBound);

            return { layer: oLayer, camada: sCamada };
        });

        /**
         * Consulta o resultado das promises
         *
         * @type {array} aPromisesResult
         */
        const aPromisesResult = await Promise.all(
            aQueryPromises.map(query => this.queryToPromise({
                camada: query.camada,
                queryLayer: query.layer
            }))
        );

        /**
         * Itera sobre os resultados, e filtra para retornar somente os válidos
         */
        const aResults = aPromisesResult.map(
            ({ error, featureCollection, camada }) => {
                return featureCollection?.features?.length > 0
                    ? { features: featureCollection, camada }
                    : [];
            }
        ).filter(oFeature => oFeature?.features);

        /**
         * Itera pelos resultados válidos, e adiciona à camada
         */
        aResults.forEach(oResult => {
            this.layer.addLayer(
                L.geoJSON(
                    oResult.features,
                    {
                        style: this.listaMetodosCamada[oResult.camada].style,
                        pane: 'LayerPontosCluster',
                        onEachFeature: (props, layer) => { },
                        pointToLayer: (geoJSONPoint, latlng) => {
                            return L.marker(latlng, {
                                icon: L.divIcon({
                                    html: 1,
                                    className: 'cluster cluster-pontos digits-1',
                                    iconSize: [36, 36],
                                    iconAnchor: [18, 18],
                                }),
                                nomeDaCamada: 'IMOVEIS_TRANSFERIDOS'
                            })
                        }
                    }
                )
            )
        });
    }

    /**
     * Faz a renderização dos dados de acordo com o tipo de camada
     */
    renderizaCamada({ params, layer, camada, properties }) {
        /**
         * Captura o método a ser executado para renderizar a camada e os popups
         * para interação de usuários
         *
         * @type {string} sMetodo
         */
        const sMetodo = this.listaMetodosCamada[camada];

        /**
         * Verifica se o método foi identificado, juntamente com o seu handler,
         * e faz a invocação do handler
         */
        if (sMetodo && sMetodo.handler)
            sMetodo.handler({ params, layer, properties });
    }

    /**
     * Cria o html da row a ser exibida
     */
    criaRowExibicao({ label, valor }) {
        return `
            <div class= "row">
                <div class="col-5 popup-text-right">${label}</div>
                <div class="col-7 text-v-center"><b>${valor}</b></div>
            </>
        `;
    }

    /**
     * Cria o modelo do html de acordo com os dados da camada
     *
     * @param object oDados
     * @param string oDados.nomeCamada
     * @param [string, string] oDados.conteudoAdicional
     */
    criaHtmlModelo({ nomeCamada, conteudoAdicional }) {
        /**
         * Cria a row inicial da camada
         *
         * @type {string} sRowCamada
         */
        const sRowCamada = this.criaRowExibicao({
            label: 'Camada:',
            valor: nomeCamada
        });

        /**
         * Itera sobre os conteúdos, para criar a linha de conteudo e montar a
         * tabela com os dados
         *
         * @type {string} sConteudos
         */
        const sConteudos = conteudoAdicional.map(
            aContent => this.criaRowExibicao({
                label: aContent[0], valor: aContent[1]
            })
        ).join('');

        return `
            ${sRowCamada}
            ${sConteudos}
                                        `;
    }

    /**
     * Aplica o popup à camada, e realiza a abertura e exibição do popup
     */
    vincularPopup({ layer, content }) {
        layer.unbindPopup();

        const oOptions = {
            closeButton: true,
            autoClose: true,
            className: 'imoveis-popup'
        };

        layer.bindPopup(content, oOptions).openPopup();
    }

    /**
     * Método responsável por formatar a data
     *
     * @param {string} data
     *
     * @return string
     */
    formataData(data) {
        const sDefault = 'Não informado';

        if (!data) return sDefault;

        /**
         * Captura a data de aceitação
         *
         * @type {array} aDataAceitacao
         */
        const aDataAceitacao = data.toString().match(/(\d{4})(\d{2})(\d{2})/);

        /**
         * Verifica se é um array
         */
        const bIsArray = Object.prototype.toString.call(aDataAceitacao)
            .toLowerCase() == '[object array]';
        if (!bIsArray) return sDefault;

        /**
         * Verifica se tem registros
         */
        if (aDataAceitacao.length <= 4) return sDefault;

        /**
         * Cria a data no padrão pt-br
         */
        const sDataAceitacao = new Date(
            parseInt(aDataAceitacao[1]),
            parseInt(aDataAceitacao[2]) - 1,
            parseInt(aDataAceitacao[3])
        ).toLocaleDateString('pt-BR');

        return sDataAceitacao;
    }
}
