export interface Paleta {
  fundo: string;
  superficie: string;
  superficieElevada: string;
  tinta: string;
  tintaSuave: string;
  tintaFraca: string;
  linha: string;
  linhaForte: string;
  azulejo: string;
  azulejoFundo: string;
  mare: string;
  mareFundo: string;
  jambo: string;
  jamboFundo: string;
  grafite: string;
  grafiteFundo: string;
  sobreTinta: string;
  grade: string;
  mapaQuadra: string;
  mapaEdificacao: string;
  mapaEdificacaoBorda: string;
  mapaRotulo: string;
  sombra: string;
}

export const paletaClara: Paleta = {
  fundo: '#EEF2F0',
  superficie: '#FAFCFB',
  superficieElevada: '#FFFFFF',
  tinta: '#0E1F1B',
  tintaSuave: '#3A4E49',
  tintaFraca: '#6A7E78',
  linha: '#C8D3CF',
  linhaForte: '#97AAA4',
  azulejo: '#1B43C0',
  azulejoFundo: '#E0E7FB',
  mare: '#08705F',
  mareFundo: '#D3ECE6',
  jambo: '#A21D59',
  jamboFundo: '#F7DFEA',
  grafite: '#566562',
  grafiteFundo: '#E4EAE8',
  sobreTinta: '#F4F8F6',
  grade: '#DCE4E1',
  mapaQuadra: '#E1E8E5',
  mapaEdificacao: '#C7D3CF',
  mapaEdificacaoBorda: '#94A8A2',
  mapaRotulo: '#5B6E69',
  sombra: 'rgba(14, 31, 27, 0.10)',
};

export const paletaEscura: Paleta = {
  fundo: '#0A1412',
  superficie: '#101D1A',
  superficieElevada: '#152622',
  tinta: '#E2ECE9',
  tintaSuave: '#ADBFBA',
  tintaFraca: '#7B908A',
  linha: '#243631',
  linhaForte: '#3A524B',
  azulejo: '#8DA5FF',
  azulejoFundo: '#16224A',
  mare: '#4CCDB8',
  mareFundo: '#0E322B',
  jambo: '#F27BB0',
  jamboFundo: '#3C1428',
  grafite: '#97A8A3',
  grafiteFundo: '#1A2925',
  sobreTinta: '#0A1412',
  grade: '#15241F',
  mapaQuadra: '#12211D',
  mapaEdificacao: '#21342E',
  mapaEdificacaoBorda: '#3C574F',
  mapaRotulo: '#8BA19B',
  sombra: 'rgba(0, 0, 0, 0.45)',
};
