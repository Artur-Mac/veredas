// Fatos usados no POC-01, com a origem de cada um.
// Reais: consultados em 15/10/2026 pela equipe (docs/ui-ux.md, seção 8.4; index.html, PROPERTIES[0]).
// Ilustrativos: vêm do protótipo sem consulta a fonte e aparecem marcados na tela.

export const IMOVEL = {
  endereco: 'Imóvel em análise',
  bairro: 'Boa Viagem · Recife',
  foto: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=84', // PROPERTIES[0].image, foto de banco (Unsplash), ilustrativa
};

// Campos do anúncio: declarados pelo anunciante (anúncio de venda real lido em 15/10/2026).
export const ANUNCIO = {
  area: '125 m²', quartos: '4 qtos', banheiros: '1 ban', vagas: '3 vg',
  aluguel: 'R$ 4.500', // ilustrativo no protótipo
  condominio: 'R$ 1.190/mês',
  iptu: 'R$ 288',
  iptuNota: 'período não informado',
  lidoEm: '15/10/2026',
};

// Registros oficiais da Prefeitura do Recife, consultados em 15/10/2026.
export const REGISTRO = {
  iptuAno: 'R$ 3.934 a R$ 4.457',          // IPTU 2026 cobrado no prédio, por ano
  iptuMes: 'R$ 328 a R$ 371 por mês',      // a mesma faixa dividida por 12 (index.html, q-bv-2)
  areaIptu: '124,81 m²',                   // área construída das unidades no IPTU 2026
  unidades: '44 unidades', ano: '2010', padrao: 'padrão Superior',
  itbiN: '56 avaliações no ITBI desde 2015', itbiMediana: 'mediana de R$ 4.339/m²',
  obras150: '49 registros de obra em 150 m desde 2018',
  demolicoes: 'alvarás de demolição deferidos em 2026, entre 118 m e 140 m',
  demolicoesN: '4', demolicaoMin: 118, demolicaoMax: 140,
  consultado: '15/10/2026',
};

// Medidas do lote: área de 1.280 m² e 32 m de frente vêm de index.html e são ilustrativas
// (docs/ui-ux.md 8.5: polígono e DSQFL não foram consultados).
export const LOTE = { frente: 32, fundo: 40, pavimentos: 12 };

// Entorno (reais, consultados em 15/10/2026; docs/ui-ux.md 8.4 e docs/mock/dossies/boa-viagem.json)
export const BAIRRO = {
  ocorrencias: '2.165', porMil: '17,2', periodo: 'out/2025 a set/2026',
  fonteCrime: 'registros da SDS-PE compilados pelo Crime Brasil · moradores: Censo 2022',
  // vizinhos de divisa, ordem do mapa (norte → sul), taxa por mil moradores
  vizinhos: [['Pina', 22.4, 654], ['Imbiribeira', 17.4, 905], ['Ibura', 18.0, 820], ['Boa Viagem', 17.2, 2165], ['Jordão', 12.8, 261]],
  defesaCivil: { total: 206, ano: 2024, fatias: [['Atendimento social', 65], ['Análise visual estrutural', 63], ['Encaminhamentos aos parceiros', 44], ['Ações porta a porta', 19], ['Outros', 15]] },
  calorAmplitude: '6,6 °C', calorFonte: 'Landsat 8 e 9, pesquisa de viabilidade (inv5), P90 − P10 das células de 100 m do bairro',
};
// O protótipo mostra números inventados no Entorno (−1,8 °C, 34/100, 38 árvores, 64% furto,
// 0 pontos críticos, rota 7,9 km). Não usar como dado real.
export const NAO_USAR_COMO_REAL = ['−1,8 °C', '34/100', '38 árvores', '64% furto patrimonial', 'Sem pontos críticos no quarteirão', '52 transmissões', 'desde 2017', '12 pavimentos'];
