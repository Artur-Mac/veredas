/**
 * Classe para trabalhar com a camada de parcelamento de SP
 */
class CamadasParcelamentoSoloPE extends CamadaBasePoligonos {
    /**
     * Construtor da classe
     *
     * @param object oDados
     * @param Leaflet.Layer oDados.layer
     * @param object oDados.configCamadas
     * @param string oDados.tokenAuth
     * @param object oCamadasExibicao
     * @param GerenciadorRequisicoes oGerenciadorRequisicoes
     * @param GerenciadorCamadas oGerenciadorCamadas
     */
    constructor({
        layer,
        configCamadas,
        tokenAuth,
        mapa,
        oCamadasExibicao,
        oGerenciadorRequisicoes,
        oGerenciadorCamadas
    }) {
        super(...arguments);

        /**
         * Seta os nomes das camadas
         *
         * @type {object} listaMetodosCamada
         */
        this.listaMetodosCamada = {
            layer_parcelamento_solo_pe_recife_lotes: {
                active: oCamadasExibicao.bExibePoligonosParcelamentoSoloPeRecifeLotes,
                handler: this.criaPopup.bind(this),
                order: this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_lotes')?.ordemPopup,
                style: { color: '#35ed7c', fillColor: '#35ed7c' },
                styleDestaque: { color: '#4100cc', fillColor: '#4100cc' },
                zoomLevel: 6,
                order: 2,
                nomeCamada: this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_lotes')?.nomeCamadaPopUp || this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_lotes')?.nomeCamada || 'Parcelamento de Solo - Lotes',
                nomeOrigem: 'parcelamento_solo_pe_recife_lotes',
                campos: {
                    'objectid': {
                        nome: 'Id:',
                        format: (value) => value,
                    },
                    'sitimovel': {
                        nome: 'Situação Imóvel:',
                        format: (value) => value,
                    },
                    'distrito': {
                        nome: 'Distrito:',
                        format: (value) => value,
                    },
                    'setor': {
                        nome: 'Setor:',
                        format: (value) => value,
                    },
                    'quadra': {
                        nome: 'Quadra:',
                        format: (value) => value,
                    },
                    'face': {
                        nome: 'Face:',
                        format: (value) => value,
                    },
                    'lote': {
                        nome: 'Lote:',
                        format: (value) => value,
                    },
                    'numero': {
                        nome: 'Número:',
                        format: (value) => value,
                    },
                    'areatotalc': {
                        nome: 'Área Total (m²):',
                        format: (value) => value?.toLocaleString('pt-BR'),
                    },
                    'qtdpavimen': {
                        nome: 'Qtd. Pavimento:',
                        format: (value) => value,
                    },
                    'tipoempree': {
                        nome: 'Tipo Empreendimento:',
                        format: (value) => value,
                    },
                    'arealote': {
                        nome: 'Área Lote (m²):',
                        format: (value) => value?.toLocaleString('pt-BR'),
                    },
                    'testada': {
                        nome: 'Testada:',
                        format: (value) => value,
                    },
                    'dsqfl': {
                        nome: 'Concatenação (DSQFL):',
                        format: (value) => value,
                    },
                    'qtdunhab': {
                        nome: 'Qtd Subunidades:',
                        format: (value) => value,
                    },
                    'anoconstr': {
                        nome: 'Ano Contrução:',
                        format: (value) => value,
                    },
                    'qtdmultipl': {
                        nome: 'Qtd Múltiplas:',
                        format: (value) => value,
                    },
                    'nomeedific': {
                        nome: 'Nome da Edificação:',
                        format: (value) => value,
                    },
                    'endereco': {
                        nome: 'Endereço:',
                        format: (value) => value,
                    },
                    'descricao': {
                        nome: 'Descrição:',
                        format: (value) => value,
                    },
                    // 'SHAPE__Area': {
                    //     nome: 'Área (m²) <i class="fa fa-question-circle ocultar-imprimir icon-ajuda" aria-hidden="true" data-toggle="tooltip-popup" title="Valor calculado automaticamente. Sujeito a validação por levantamento de alta precisão ou por dados oficiais."></i>:',
                    //     format: (value) => parseFloat(value).toLocaleString('pt-BR'),
                    // },
                    // 'SHAPE__Length': {
                    //     nome: 'Perímetro (m) <i class="fa fa-question-circle ocultar-imprimir icon-ajuda" aria-hidden="true" data-toggle="tooltip-popup" title="Valor calculado automaticamente. Sujeito a validação por levantamento de alta precisão ou por dados oficiais."></i>:',
                    //     format: (value) => parseFloat(value).toLocaleString('pt-BR'),
                    // },
                },
                usaToken: true,
                popupContentFooter: ``,
            },

            layer_parcelamento_solo_pe_recife_edificacoes: {
                active: oCamadasExibicao.bExibePoligonosParcelamentoSoloPeRecifeEdificacoes,
                handler: this.criaPopup.bind(this),
                order: this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_edificacoes')?.ordemPopup,
                style: { color: '#20549e', fillColor: '#20549e' },
                styleDestaque: { color: '#4100cc', fillColor: '#4100cc' },
                zoomLevel: 12,
                order: 2,
                nomeCamada: this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_edificacoes')?.nomeCamadaPopUp || this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_edificacoes')?.nomeCamada || 'Parcelamento de Solo - Edificações',
                nomeOrigem: 'parcelamento_solo_pe_recife_edificacoes',
                campos: {
                    'DSQFL': {
                        nome: 'Concatenação (DSQFL):',
                        format: (value) => value,
                    },
                    'endereco': {
                        nome: 'Endereço:',
                        format: (value) => value,
                    },
                    // 'SHAPE__Area': {
                    //     nome: 'Área (m²) <i class="fa fa-question-circle ocultar-imprimir icon-ajuda" aria-hidden="true" data-toggle="tooltip-popup" title="Valor calculado automaticamente. Sujeito a validação por levantamento de alta precisão ou por dados oficiais."></i>:',
                    //     format: (value) => parseFloat(value).toLocaleString('pt-BR'),
                    // },
                    // 'SHAPE__Length': {
                    //     nome: 'Perímetro (m) <i class="fa fa-question-circle ocultar-imprimir icon-ajuda" aria-hidden="true" data-toggle="tooltip-popup" title="Valor calculado automaticamente. Sujeito a validação por levantamento de alta precisão ou por dados oficiais."></i>:',
                    //     format: (value) => parseFloat(value).toLocaleString('pt-BR'),
                    // },
                },
                usaToken: true,
                popupContentFooter: ``,
            },

            layer_parcelamento_solo_pe_recife_logradouros: {
                active: oCamadasExibicao.bExibePoligonosParcelamentoSoloPeRecifeLogradouros,
                handler: this.criaPopup.bind(this),
                order: this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_logradouros')?.ordemPopup,
                style: { color: '#43788d', fillColor: '#43788d' },
                styleDestaque: { color: '#4100cc', fillColor: '#4100cc' },
                zoomLevel: 6,
                order: 2,
                nomeCamada: this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_logradouros')?.nomeCamadaPopUp || this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_logradouros')?.nomeCamada || 'Parcelamento de Solo - Logradouros',
                nomeOrigem: 'parcelamento_solo_pe_recife_logradouros',
                campos: {
                    'objectid': {
                        nome: 'Id:',
                        format: (value) => value,
                    },
                    'codigolog': {
                        nome: 'Cod. Log:',
                        format: (value) => value,
                    },
                    'nomelogra': {
                        nome: 'Logradouro:',
                        format: (value) => value,
                    },
                    'pavimentac': {
                        nome: 'Pavimento:',
                        format: (value) => value,
                    },
                    'numerope': {
                        nome: 'Número PE:',
                        format: (value) => value,
                    },
                    // 'SHAPE__Area': {
                    //     nome: 'Área (m²) <i class="fa fa-question-circle ocultar-imprimir icon-ajuda" aria-hidden="true" data-toggle="tooltip-popup" title="Valor calculado automaticamente. Sujeito a validação por levantamento de alta precisão ou por dados oficiais."></i>:',
                    //     format: (value) => parseFloat(value).toLocaleString('pt-BR'),
                    // },
                    // 'SHAPE__Length': {
                    //     nome: 'Perímetro (m) <i class="fa fa-question-circle ocultar-imprimir icon-ajuda" aria-hidden="true" data-toggle="tooltip-popup" title="Valor calculado automaticamente. Sujeito a validação por levantamento de alta precisão ou por dados oficiais."></i>:',
                    //     format: (value) => parseFloat(value).toLocaleString('pt-BR'),
                    // },
                },
                usaToken: true,
                popupContentFooter: ``,
            },

            layer_parcelamento_solo_pe_recife_quadras: {
                active: oCamadasExibicao.bExibePoligonosParcelamentoSoloPeRecifeQuadras,
                handler: this.criaPopup.bind(this),
                order: this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_quadras')?.ordemPopup,
                style: { color: '#5db5d9', fillColor: '#5db5d9' },
                styleDestaque: { color: '#4100cc', fillColor: '#4100cc' },
                zoomLevel: 6,
                order: 2,
                nomeCamada: this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_quadras')?.nomeCamadaPopUp || this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_quadras')?.nomeCamada || 'Parcelamento de Solo - Quadras',
                nomeOrigem: 'parcelamento_solo_pe_recife_quadras',
                campos: {
                    'objectid': {
                        nome: 'Id:',
                        format: (value) => value,
                    },
                    'coddistri': {
                        nome: 'Cod. Distrito:',
                        format: (value) => value,
                    },
                    'codsetor': {
                        nome: 'Cod. Setor:',
                        format: (value) => value,
                    },
                    'codquadra': {
                        nome: 'Cod. Quadra:',
                        format: (value) => value,
                    },
                    'dsq': {
                        nome: 'Concatenação (DSQ):',
                        format: (value) => value,
                    },
                    'area': {
                        nome: 'Área (m²):',
                        format: (value) => parseFloat(value).toLocaleString('pt-BR'),
                    },
                    'perimetro': {
                        nome: 'Perímetro (m):',
                        format: (value) => parseFloat(value).toLocaleString('pt-BR'),
                    },
                    // 'SHAPE__Area': {
                    //     nome: 'Área (m²) <i class="fa fa-question-circle ocultar-imprimir icon-ajuda" aria-hidden="true" data-toggle="tooltip-popup" title="Valor calculado automaticamente. Sujeito a validação por levantamento de alta precisão ou por dados oficiais."></i>:',
                    //     format: (value) => parseFloat(value).toLocaleString('pt-BR'),
                    // },
                    // 'SHAPE__Length': {
                    //     nome: 'Perímetro (m) <i class="fa fa-question-circle ocultar-imprimir icon-ajuda" aria-hidden="true" data-toggle="tooltip-popup" title="Valor calculado automaticamente. Sujeito a validação por levantamento de alta precisão ou por dados oficiais."></i>:',
                    //     format: (value) => parseFloat(value).toLocaleString('pt-BR'),
                    // },
                },
                usaToken: true,
                popupContentFooter: ``,
            },

            layer_parcelamento_solo_pe_recife_bairros: {
                active: oCamadasExibicao.bExibePoligonosParcelamentoSoloPeRecifeBairros,
                handler: this.criaPopup.bind(this),
                order: this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_bairros')?.ordemPopup,
                style: { color: '#833d77', fillColor: '#833d77' },
                styleDestaque: { color: '#4100cc', fillColor: '#4100cc' },
                zoomLevel: 6,
                order: 2,
                nomeCamada: this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_bairros')?.nomeCamadaPopUp || this.oGerenciadorCamadas.getCamadaDadosPorIdentificador('parcelamento_solo_pe_recife_bairros')?.nomeCamada || 'Parcelamento de Solo - Bairros',
                nomeOrigem: 'parcelamento_solo_pe_recife_bairros',
                campos: {
                    'objectid': {
                        nome: 'Id:',
                        format: (value) => value,
                    },
                    'nomebairro': {
                        nome: 'Nome Bairro:',
                        format: (value) => value,
                    },
                    'codbairro': {
                        nome: 'Cod. Bairro:',
                        format: (value) => value,
                    },
                    'rpa': {
                        nome: 'RPA:',
                        format: (value) => value,
                    },
                    'microrregi': {
                        nome: 'Microrregião:',
                        format: (value) => value,
                    },
                    // 'SHAPE__Area': {
                    //     nome: 'Área (Km²) <i class="fa fa-question-circle ocultar-imprimir icon-ajuda" aria-hidden="true" data-toggle="tooltip-popup" title="Valor calculado automaticamente. Sujeito a validação por levantamento de alta precisão ou por dados oficiais."></i>:',
                    //     format: (value) => parseFloat(value / 1000000).toLocaleString('pt-BR'),
                    // },
                    // 'SHAPE__Length': {
                    //     nome: 'Perímetro (Km) <i class="fa fa-question-circle ocultar-imprimir icon-ajuda" aria-hidden="true" data-toggle="tooltip-popup" title="Valor calculado automaticamente. Sujeito a validação por levantamento de alta precisão ou por dados oficiais."></i>:',
                    //     format: (value) => parseFloat(value / 1000).toLocaleString('pt-BR'),
                    // },
                },
                usaToken: true,
                popupContentFooter: ``,
            },
        };

        /**
         * Zoom mínimo necessário para exibir os dados adicionais
         */
        this.zoomMinimoNecessarioLimiteExcedido = 17;
    }
}