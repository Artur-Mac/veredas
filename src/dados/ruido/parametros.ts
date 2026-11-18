// Parâmetros do modelo de ruído estimado (decisão A2 do Samuel, 18/11/2026): todas as constantes num arquivo só, cada
// uma com a origem. Três origens possíveis:
//   [MS]  a metodologia publicada pelo Mapa Sossego em https://mapasossego.com.br/sobre, lida em 18/11/2026
//         (sha256 da página lida: 54aee7969211df05ae9104733affd4b4bc6460bcfb77b11fc79a979f8383a1b0);
//   [4.1] a especificação do trabalho (PROMPT-SESSAO-UNIFICACAO.md, seção 4.1), onde a página não fala do assunto;
//   [A CALIBRAR] nem a página nem a 4.1 publicam o número: é um valor de partida, com a justificativa ao lado, e muda
//         quando houver medição no Recife. Nenhum deles foi medido.
// Onde a 4.1 e a página divergem, vale a página; a divergência fica anotada na constante (procure "DIVERGÊNCIA").
// Este arquivo é lido pelo app e pelo pipeline (scripts/dados/ruido/rodar-ruido.mjs): só sintaxe que o Node apaga
// sozinho (sem enum, sem namespace) e nenhum import.

/** Distância de referência dos níveis de emissão, em metros. [MS] "nível de emissão de referência a 10 metros". */
export const DISTANCIA_DE_REFERENCIA_M = 10;

// ——— Vias ————————————————————————————————————————————————————————————————————————————————————————

export type ClasseDeVia = "rodovia" | "arterial" | "coletora" | "local" | "residencial";

/**
 * dB(A) a 10 m, de dia, por classe. [MS] "rodovias em torno de 78, vias arteriais 73, coletoras 68, ruas locais 61,
 * ruas residenciais 48". A 4.1 traz os mesmos números.
 */
export const NIVEL_DA_VIA_DB: Record<ClasseDeVia, number> = { rodovia: 78, arterial: 73, coletora: 68, local: 61, residencial: 48 };

/**
 * Etiqueta `highway` do OpenStreetMap → classe. As páginas de bairro do Mapa Sossego (lidas em 18/11/2026) chamam
 * `trunk` de "via expressa", `primary` de "via arterial", `secondary` de "via coletora", `tertiary` de "via local
 * principal" e `residential` de "rua residencial" (ex.: em /ruido/recife/casa-forte, Rua de Casa Forte e Praça Casa
 * Forte, `tertiary` no mapa, aparecem como "via local principal"). São as cinco classes da metodologia.
 * DIVERGÊNCIA: a 4.1 punha `tertiary` junto de `secondary` (68); vale o que o site publica, `tertiary` = rua local
 * (61). A página de metodologia não traz a tabela de etiquetas: a leitura vem dos rótulos das páginas de bairro.
 * `unclassified` = rua local (61) vem da 4.1. Os acessos (`*_link`) seguem a via a que servem e `living_street` segue
 * a rua residencial: decisão desta implementação. Fica de fora o que não é via de trânsito geral (service, pedestrian,
 * footway, cycleway, track, path, steps).
 */
export const CLASSE_POR_HIGHWAY: Record<string, ClasseDeVia> = {
  motorway: "rodovia", motorway_link: "rodovia", trunk: "rodovia", trunk_link: "rodovia",
  primary: "arterial", primary_link: "arterial",
  secondary: "coletora", secondary_link: "coletora",
  tertiary: "local", tertiary_link: "local", unclassified: "local",
  residential: "residencial", living_street: "residencial",
};

/** Como a classe aparece na tela ("Av. Eng. Domingos Ferreira, arterial, 28 m"). */
export const ROTULO_DA_CLASSE: Record<ClasseDeVia, string> = { rodovia: "via expressa", arterial: "arterial", coletora: "coletora", local: "via local", residencial: "rua residencial" };

/**
 * Noite (22h–7h): quanto cada classe perde. [MS] "rodovias e vias expressas perdem 6 dB, arteriais 7, coletoras 8,
 * ruas locais 9 e ruas residenciais 10". A 4.1 traz os mesmos números.
 */
export const QUEDA_DA_VIA_A_NOITE_DB: Record<ClasseDeVia, number> = { rodovia: 6, arterial: 7, coletora: 8, local: 9, residencial: 10 };

/**
 * Faixas. [MS] "Faixas extras e limites de velocidade altos aumentam o valor; zonas 30 reduzem", sem os números.
 * [A CALIBRAR] 10·log10(faixas ÷ 2) acima de 2 faixas, até +5 dB: supõe trânsito proporcional ao número de faixas da
 * etiqueta `lanes` (dobrar o fluxo soma 3 dB), partindo de uma via de 2 faixas.
 */
export const FAIXAS_DE_REFERENCIA = 2;
export const TETO_DA_CORRECAO_POR_FAIXAS_DB = 5;

/**
 * Velocidade. [MS] diz que limite alto aumenta, sem número. [A CALIBRAR] +1 dB a cada 10 km/h de `maxspeed` acima de
 * 60 km/h, até +3 dB: ordem de grandeza dos modelos de tráfego (o ruído de rolamento cresce com a velocidade).
 */
export const VELOCIDADE_SEM_CORRECAO_KMH = 60;
export const CORRECAO_POR_10_KMH_DB = 1;
export const TETO_DA_CORRECAO_POR_VELOCIDADE_DB = 3;

/**
 * Zona 30. [MS] "zonas 30 reduzem", sem número. [A CALIBRAR] −2 dB quando `maxspeed` ≤ 30 km/h: redução típica
 * relatada ao baixar o limite de 50 para 30 km/h.
 */
export const VELOCIDADE_DE_ZONA_30_KMH = 30;
export const CORRECAO_DE_ZONA_30_DB = -2;

// ——— Ônibus ———————————————————————————————————————————————————————————————————————————————————————

/**
 * Corredor de ônibus: uma parcela a mais sobre a via, 10·log10(partidas num dia útil) + este valor, somada em energia
 * ao nível da classe. [4.1] "correção a mais sobre a via, proporcional a 10·log10(partidas)"; o Mapa Sossego não tem
 * contagem nenhuma. [A CALIBRAR] 34 dB(A) a 10 m por partida: supõe ~81 dB(A) de nível de exposição (SEL) a 10 m na
 * passagem de um ônibus urbano, espalhado pelas 15 horas do dia (10·log10(54.000 s) = 47,3). Com 1.000 partidas dá
 * 64 dB(A): quase nada numa arterial (73), mas levanta uma rua "residencial" do mapa que carrega linha de ônibus.
 */
export const NIVEL_POR_PARTIDA_DE_ONIBUS_DB = 34;
/** A parada do GTFS vale para a via a até esta distância dela (m). Decisão desta implementação. */
export const RAIO_DA_PARADA_ATE_A_VIA_M = 40;
/** As partidas de uma parada valem para os trechos da mesma via a até esta distância dela (m): paradas a ~300–400 m. */
export const ALCANCE_DA_PARADA_NA_VIA_M = 400;

// ——— Trilho —————————————————————————————————————————————————————————————————————————————————————

/** Metrô e VLT (traçado CBTU): linha de 70 dB(A) a 10 m. [MS] "Ferrovias entram como fontes em linha de 70 dB(A)". */
export const NIVEL_DO_TRILHO_DB = 70;
/** [MS] "metrô de superfície e VLT, que param de madrugada, 6". */
export const QUEDA_DO_TRILHO_A_NOITE_DB = 6;

// ——— Fontes pontuais ——————————————————————————————————————————————————————————————————————————————

export type TipoDeFontePontual = "luse" | "bar" | "oficina" | "mercado";

/**
 * dB(A) a 10 m, de dia. [MS] diz só que "bares, restaurantes, igrejas, oficinas e mercados entram como fontes pontuais
 * de curto alcance", sem os níveis. [A CALIBRAR] valores de partida, escolhidos para o alcance ser curto (a 100 m
 * sobram 20 dB a menos, perto do piso urbano):
 * - bar ou venda de bebida (CNEFE): 62;
 * - local com licença de som (LUSE): 66 de dia e 70 à noite. O motor da frente visual (acustica3d.ts) usava 76 dB a
 *   10 m; aqui o número é o nível médio do período, não o pico de um evento, por isso o valor menor;
 * - oficina, borracharia ou serralheria: 65;
 * - supermercado ou atacado (carga e descarga): 62.
 */
export const NIVEL_DA_FONTE_PONTUAL_DB: Record<TipoDeFontePontual, number> = { luse: 66, bar: 62, oficina: 65, mercado: 62 };

/**
 * Noite: o que cada fonte pontual ganha (+) ou perde (−). [MS] "Bares e pubs ganham 3 dB e casas noturnas 4;
 * restaurantes perdem 1, igrejas 4, mercados 12 e oficinas 15". O LUSE segue a casa noturna (+4).
 */
export const DELTA_DA_FONTE_PONTUAL_A_NOITE_DB: Record<TipoDeFontePontual, number> = { luse: 4, bar: 3, oficina: -15, mercado: -12 };

/**
 * Bares em grupo. [MS] "Bares, pubs e casas noturnas em grupo ganham até 9 dB". [A CALIBRAR] a forma: 10·log10(bares
 * a até 150 m), com o teto de 9 dB da página (dez bares somam 10 dB em energia; a página corta em 9).
 */
export const TETO_DO_GRUPO_DE_BARES_DB = 9;

/** Raios em que as fontes pontuais entram (m), os mesmos do simulador andar × fachada: decisão do app, 15/11/2026. */
export const RAIO_DA_FONTE_PONTUAL_M: Record<TipoDeFontePontual, number> = { luse: 150, bar: 300, oficina: 150, mercado: 200 };

// ——— Aeroporto ————————————————————————————————————————————————————————————————————————————————————

/**
 * Sob a rota de pouso e decolagem. [MS] "um aeroporto de grande movimento deixa cerca de 71 dB(A) a 1 km da cabeceira,
 * 66 a 2,5 km e 60 a 5 km", com o avião subindo "6 metros a cada 100": 60 m, 150 m e 300 m de altura. O Recife está
 * na lista dos doze mais movimentados da página. A curva abaixo passa por esses três pontos em função da ALTURA do
 * avião (71 − 10·log10(h ÷ 60) − (h − 60) ÷ 60 dá 71,0, 65,5 e 60,0); a altura vem do cone de aproximação do Vereda
 * (src/dados/recife/aeroporto.ts, rampa de 3°). Abaixo de 60 m de altura o nível fica nos 71 dB(A): a página não
 * publica nada mais perto que 1 km, e não extrapolamos para cima.
 */
export const NIVEL_DO_AVIAO_A_60_M_DB = 71;
export const ALTURA_DE_REFERENCIA_DO_AVIAO_M = 60;
/** Parcela linear da curva acima: 1 dB a cada 60 m de altura (ajuste aos três pontos da página). */
export const QUEDA_DO_AVIAO_POR_60_M_DB = 1;
/** [MS] "uns 9 dB a menos 1 km para o lado". Aplicado em proporção ao afastamento do eixo dentro do cone. */
export const QUEDA_DO_AVIAO_POR_KM_DE_LADO_DB = 9;
/** [MS] "Aeroportos de grande movimento e de voo regular perdem 7 dB" à noite. */
export const QUEDA_DO_AVIAO_A_NOITE_DB = 7;

// ——— Vizinhança ———————————————————————————————————————————————————————————————————————————————————

/**
 * [MS] "50 dB(A) a 150 moradores por hectare, mais 20 dB a cada dez vezes mais gente, até 68. Abaixo de 38 moradores
 * por hectare não conta nada"; à noite "perde só 3 dB". NÃO APLICADO: o repositório tem a população por bairro e os
 * domicílios por setor, mas não a área dos setores censitários; sem densidade por setor, vale só o piso fixo abaixo.
 */
export const VIZINHANCA_DB_A_150_HAB_POR_HA = 50;
export const VIZINHANCA_DB_POR_DECADA = 20;
export const VIZINHANCA_TETO_DB = 68;
export const VIZINHANCA_DENSIDADE_MINIMA_HAB_POR_HA = 38;
export const VIZINHANCA_QUEDA_A_NOITE_DB = 3;

// ——— Propagação ———————————————————————————————————————————————————————————————————————————————————

/** Linha (via, trilho): 10·log10 da distância, ~3 dB a cada dobro. [MS] "cai cerca de 3 dB a cada vez que a distância dobra". */
export const QUEDA_DA_LINHA_POR_DECADA_DB = 10;
/** Ponto: 20·log10 da distância, 6 dB a cada dobro. [MS] "Fontes pontuais caem 6 dB por dobro de distância". */
export const QUEDA_DO_PONTO_POR_DECADA_DB = 20;
/**
 * Ar e solo. [MS] "para vias vale cerca de 1,8 dB a cada 100 metros". A página só dá o número das vias; a 4.1 diz
 * "ar e solo tiram ~1,8 dB a cada 100 m" para tudo, e é assim que entra aqui (vias, trilho e fontes pontuais).
 */
export const ABSORCAO_DB_POR_100_M = 1.8;
/**
 * Mais perto que a distância de referência o nível não sobe: uma via nunca passa do nível de referência da classe.
 * Decisão desta implementação (a página avisa que o próximo passo dela é "afastar o ponto de cálculo do eixo da via").
 */
export const DISTANCIA_MINIMA_M = DISTANCIA_DE_REFERENCIA_M;
/** Linhas a mais de 1,5 km não entram: uma rodovia (78) chega lá com menos de 30 dB(A), abaixo do piso noturno. */
export const RAIO_DAS_LINHAS_M = 1500;
/** Cada trecho de linha é cortado em pedaços de até este tamanho (m) para a absorção valer pela distância de cada um. */
export const PASSO_DA_LINHA_M = 25;

/** Piso de ruído urbano. [MS] "piso de ruído urbano de 38 dB(A)"; à noite "cai de 38 para 33 dB(A)". */
export const PISO_DE_DIA_DB = 38;
export const PISO_A_NOITE_DB = 33;

// ——— Andar e fachada ——————————————————————————————————————————————————————————————————————————————

/**
 * Metros por andar. [4.1] "a 3,1 m por andar, como o simulador já faz" (METROS_POR_PAVIMENTO do app).
 * DIVERGÊNCIA: a página usa 3 m ("a altura do receptor é o andar vezes 3 metros"). Fica 3,1 para o número bater com a
 * altura da janela que o simulador mostra; no 10º andar são 31 m contra 30 m, menos de 0,2 dB de diferença.
 */
export const METROS_POR_ANDAR = 3.1;
/**
 * [MS] "A atenuação do solo diminui com a altura, até 60% do valor da rua por volta do 10º andar". Linear do térreo
 * (100%) ao 10º andar (60%) e constante daí para cima.
 */
export const ANDAR_DA_ABSORCAO_MINIMA = 10;
export const FRACAO_MINIMA_DA_ABSORCAO = 0.6;

/** [MS] "Fontes até 60° da direção das janelas contam por inteiro; de lado, até 120°, perdem 3 dB". */
export const ANGULO_DE_FRENTE_GRAUS = 60;
export const ANGULO_DE_LADO_GRAUS = 120;
export const QUEDA_DE_LADO_DB = 3;
/**
 * Fundos: o próprio prédio como barreira. [MS] "atrás do prédio perdem 12 dB, a diferença típica entre fachada exposta
 * e fachada protegida". DIVERGÊNCIA: a 4.1 propunha 10 dB; vale o número da página. [A CALIBRAR] nos dois casos: a
 * barreira real depende da forma do prédio e dos vizinhos, que o modelo não vê.
 */
export const BARREIRA_DOS_FUNDOS_DB = 12;

// ——— Como aparece ——————————————————————————————————————————————————————————————————————————————————

/**
 * Faixa mostrada em volta do número. [4.1] "±5 dB: é o erro médio que o próprio Mapa Sossego mediu". [MS] "erro médio
 * absoluto de 4,8 dB" em 62 pontos de São Paulo, com o modelo "em média 2,8 dB acima do medido".
 */
export const FAIXA_DB = 5;
export const ERRO_MEDIO_ABSOLUTO_DO_MAPA_SOSSEGO_DB = 4.8;
export const PONTOS_DE_VALIDACAO_DO_MAPA_SOSSEGO = 62;

/** Nota de sossego 0–10. [MS] "48 dB(A) ou menos vale 100; 86 dB(A) ou mais vale 0", linear; aqui em escala 0–10. */
export const DB_DA_NOTA_10 = 48;
export const DB_DA_NOTA_0 = 86;

/**
 * Palavra de cada faixa da nota. [MS] "A escala": Muito tranquilo 85 a 100, Tranquilo 70 a 84, Moderado 50 a 69,
 * Agitado 30 a 49, Barulhento 0 a 29 (aqui divididos por 10).
 */
export const FAIXAS_DA_NOTA = [
  { aPartirDe: 8.5, rotulo: "Muito tranquilo" },
  { aPartirDe: 7, rotulo: "Tranquilo" },
  { aPartirDe: 5, rotulo: "Moderado" },
  { aPartirDe: 3, rotulo: "Agitado" },
  { aPartirDe: 0, rotulo: "Barulhento" },
] as const;

/** ABNT NBR 10151, área mista predominantemente residencial. [MS] "55 dB(A) de dia e 50 dB(A) à noite". */
export const LIMITE_NBR_10151_DE_DIA_DB = 55;
export const LIMITE_NBR_10151_A_NOITE_DB = 50;

/**
 * Vieses conhecidos do método. [MS] seção 9: "arteriais e vias expressas ficam 4 a 5 dB acima do medido" e as ruas
 * residenciais com trânsito de passagem "ficam 10 a 15 dB abaixo".
 */
export const VIES_PERTO_DE_AVENIDA_DB = [4, 5] as const;
export const VIES_EM_RUA_RESIDENCIAL_COM_PASSAGEM_DB = [10, 15] as const;

/** O aviso literal, o mesmo do Mapa Sossego. [4.1] */
export const AVISO_DE_ESTIMATIVA = "Estimativa com dados abertos, não medição";

/** Endereço e data da metodologia de referência. */
export const METODOLOGIA_DE_REFERENCIA = { nome: "Mapa Sossego, “Como funciona”", url: "https://mapasossego.com.br/sobre", lidaEm: "2026-11-18" } as const;
