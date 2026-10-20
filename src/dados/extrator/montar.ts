import {
  camposVazios,
  esquemaExtracao,
  type Anomalia,
  type CamposExtraidos,
  type ChaveDeCampo,
  type Cobertura,
  type ExtracaoAnuncio,
  type LeituraParcial,
  type Portal,
} from "../contratos";
import { eCoberto } from "../recife/bairros";
import { mapaNaoInformados } from "./texto";

const CAMPOS_IDENTIFICACAO: ChaveDeCampo[] = [
  "modalidade",
  "tipologia",
  "bairro",
  "cidade",
  "logradouro",
  "numero",
  "nomeEdificio",
];

const CAMPOS_NUMERICOS_E_CUSTO: ChaveDeCampo[] = [
  "area",
  "quartos",
  "suites",
  "banheiros",
  "vagas",
  "andar",
  "anoConstrucao",
  "preco",
  "condominio",
  "iptu",
  "seguroIncendio",
  "taxaServico",
  "totalInformado",
];

/**
 * Como o valor aparece em `Anomalia.valorLido`: o IPTU é um objeto (valor e período) e vira "R$ 288/mês" ou "R$ 3456/ano"
 * ("R$ 288" quando o período é desconhecido); os demais campos, o texto do próprio valor. Nunca passa de 80 caracteres.
 */
function textoDoValorLido(chave: ChaveDeCampo, valor: unknown): string {
  if (chave === "iptu" && valor !== null && typeof valor === "object") {
    const { valor: reais, periodo } = valor as { valor: number; periodo: string };
    const sufixo = periodo === "mes" ? "/mês" : periodo === "ano" ? "/ano" : "";
    return `R$ ${reais}${sufixo}`;
  }
  return String(valor).slice(0, 80);
}

export function montarExtracao(
  url: string,
  leituras: LeituraParcial[],
  agora: Date,
): ExtracaoAnuncio {
  // Ordena leituras: url, json_ld, texto
  const ordemMetodos: Record<string, number> = { url: 0, json_ld: 1, texto: 2 };
  const ordenadas = [...leituras].sort(
    (a, b) => (ordemMetodos[a.metodo] ?? 99) - (ordemMetodos[b.metodo] ?? 99),
  );

  const metodos: ("url" | "texto" | "json_ld")[] = [];
  for (const l of ordenadas) {
    if (!metodos.includes(l.metodo)) {
      metodos.push(l.metodo);
    }
  }

  // Portal e idNoPortal
  let portalEscolhido: Portal = "outro";
  let idEscolhido: string | null = null;
  for (const l of ordenadas) {
    if (l.portal !== "outro" && portalEscolhido === "outro") {
      portalEscolhido = l.portal;
    }
    if (l.idNoPortal && !idEscolhido) {
      idEscolhido = l.idNoPortal;
    }
  }

  const camposFinais: CamposExtraidos = camposVazios();
  const origemDosCampos: Partial<Record<ChaveDeCampo, "link" | "texto">> = {};
  const anomalias: Anomalia[] = [];

  // Mapeia origem para "link" ou "texto"
  const paraOrigem = (m: "url" | "texto" | "json_ld"): "link" | "texto" =>
    m === "url" ? "link" : "texto";

  // 1. Identificação: primeiro não nulo (url > json_ld > texto)
  for (const chave of CAMPOS_IDENTIFICACAO) {
    for (const l of ordenadas) {
      const val = (l.campos as any)[chave];
      if (val !== null && val !== undefined) {
        if ((camposFinais as any)[chave] === null) {
          (camposFinais as any)[chave] = val;
          origemDosCampos[chave] = paraOrigem(l.metodo);
        }
      }
    }
  }

  // BairroTexto (identificação textual, sem registro em origemDosCampos)
  for (const l of ordenadas) {
    if (l.campos.bairroTexto && !camposFinais.bairroTexto) {
      camposFinais.bairroTexto = l.campos.bairroTexto;
    }
  }

  // 2. Numéricos e de custo: último não nulo (texto > json_ld > url)
  // Como ordenadas está em [url, json_ld, texto], percorremos na ordem e sobrescrevemos
  for (const chave of CAMPOS_NUMERICOS_E_CUSTO) {
    for (const l of ordenadas) {
      const val = (l.campos as any)[chave];
      if (val !== null && val !== undefined) {
        (camposFinais as any)[chave] = val;
        origemDosCampos[chave] = paraOrigem(l.metodo);
      }
    }
  }

  // 3. Comodidades: união preservando ordem sem repetição
  const comodidadesUniao: string[] = [];
  for (const l of ordenadas) {
    for (const c of l.campos.comodidades) {
      if (!comodidadesUniao.includes(c)) {
        comodidadesUniao.push(c);
      }
    }
  }
  camposFinais.comodidades = comodidadesUniao;

  // 4. Incoerência entre leituras
  // "Dois valores não nulos diferentes geram anomalia incoerente no campo (área: diferença > 1 m²)."
  const todasAsChaves = [...CAMPOS_IDENTIFICACAO, ...CAMPOS_NUMERICOS_E_CUSTO];
  for (const chave of todasAsChaves) {
    const valoresNaoNulos: { valor: any; metodo: string }[] = [];
    for (const l of ordenadas) {
      const val = (l.campos as any)[chave];
      if (val !== null && val !== undefined) {
        valoresNaoNulos.push({ valor: val, metodo: l.metodo });
      }
    }

    if (valoresNaoNulos.length >= 2) {
      let incoerente = false;
      const primeiroItem = valoresNaoNulos[0];
      if (primeiroItem) {
        const primeiro = primeiroItem.valor;

        for (let i = 1; i < valoresNaoNulos.length; i++) {
          const outroItem = valoresNaoNulos[i];
          if (!outroItem) continue;
          const outro = outroItem.valor;
          if (chave === "area") {
            if (Math.abs(Number(primeiro) - Number(outro)) > 1) {
              incoerente = true;
            }
          } else if (chave === "preco") {
            if (Math.abs(Number(primeiro) - Number(outro)) > 0.01) {
              incoerente = true;
            }
          } else if (chave === "iptu") {
            if (primeiro.valor !== outro.valor || primeiro.periodo !== outro.periodo) {
              incoerente = true;
            }
          } else if (primeiro !== outro) {
            incoerente = true;
          }
        }

        if (incoerente) {
          const ultimoItem = valoresNaoNulos[valoresNaoNulos.length - 1];
          const valorLido = textoDoValorLido(chave, ultimoItem ? ultimoItem.valor : "");
          anomalias.push({
            campo: chave,
            tipo: "incoerente",
            valorLido,
            mensagem: `O valor de ${chave} difere entre as fontes lidas.`,
          });
        }
      }
    }
  }

  // 5. Auditoria (nesta ordem estrita)
  // R1: "Não informado" / "Consulte" / "Sob consulta" -> campo null, anomalia nao_informado
  for (const l of ordenadas) {
    const naoInf = mapaNaoInformados.get(l);
    if (naoInf) {
      for (const [campo, textoOriginal] of naoInf.entries()) {
        (camposFinais as any)[campo] = null;
        delete origemDosCampos[campo];
        anomalias.push({
          campo,
          tipo: "nao_informado",
          valorLido: textoOriginal,
          mensagem: `O anúncio informa "${textoOriginal}" para ${campo}.`,
        });
      }
    }
  }

  // R2: custo recorrente <= R$ 10, ou preço < R$ 100 -> null, anomalia valor_simbolico
  if (camposFinais.condominio !== null && camposFinais.condominio <= 10) {
    const lido = `R$ ${camposFinais.condominio}`;
    camposFinais.condominio = null;
    delete origemDosCampos["condominio"];
    anomalias.push({
      campo: "condominio",
      tipo: "valor_simbolico",
      valorLido: lido,
      mensagem: `Condomínio de ${lido} parece valor simbólico.`,
    });
  }

  if (camposFinais.iptu !== null && camposFinais.iptu.valor <= 10) {
    const lido = `R$ ${camposFinais.iptu.valor}`;
    camposFinais.iptu = null;
    delete origemDosCampos["iptu"];
    anomalias.push({
      campo: "iptu",
      tipo: "valor_simbolico",
      valorLido: lido,
      mensagem: `IPTU de ${lido} parece valor simbólico.`,
    });
  }

  if (camposFinais.preco !== null && camposFinais.preco < 100) {
    const lido = `R$ ${camposFinais.preco}`;
    camposFinais.preco = null;
    delete origemDosCampos["preco"];
    anomalias.push({
      campo: "preco",
      tipo: "valor_simbolico",
      valorLido: lido,
      mensagem: `Preço de ${lido} parece valor simbólico.`,
    });
  }

  if (camposFinais.seguroIncendio !== null && camposFinais.seguroIncendio <= 10) {
    const lido = `R$ ${camposFinais.seguroIncendio}`;
    camposFinais.seguroIncendio = null;
    delete origemDosCampos["seguroIncendio"];
    anomalias.push({
      campo: "seguroIncendio",
      tipo: "valor_simbolico",
      valorLido: lido,
      mensagem: `Seguro incêndio de ${lido} parece valor simbólico.`,
    });
  }

  if (camposFinais.taxaServico !== null && camposFinais.taxaServico <= 10) {
    const lido = `R$ ${camposFinais.taxaServico}`;
    camposFinais.taxaServico = null;
    delete origemDosCampos["taxaServico"];
    anomalias.push({
      campo: "taxaServico",
      tipo: "valor_simbolico",
      valorLido: lido,
      mensagem: `Taxa de serviço de ${lido} parece valor simbólico.`,
    });
  }

  // R3: condomínio < R$ 1,50 por m² (com área conhecida e tipologia != casa) -> mantém valor, anomalia valor_atipico
  if (
    camposFinais.condominio !== null &&
    camposFinais.area !== null &&
    camposFinais.tipologia !== "casa" &&
    camposFinais.condominio / camposFinais.area < 1.5
  ) {
    anomalias.push({
      campo: "condominio",
      tipo: "valor_atipico",
      valorLido: `R$ ${camposFinais.condominio}`,
      mensagem: `O anúncio informa R$ ${camposFinais.condominio} de condomínio para ${camposFinais.area} m².`,
    });
  }

  // R4: IPTU com período desconhecido -> mantém, anomalia periodo_desconhecido
  if (camposFinais.iptu !== null && camposFinais.iptu.periodo === "desconhecido") {
    anomalias.push({
      campo: "iptu",
      tipo: "periodo_desconhecido",
      valorLido: `R$ ${camposFinais.iptu.valor}`,
      mensagem: `IPTU sem indicação se o valor é mensal ou anual.`,
    });
  }

  // R5: IPTU igual ao condomínio e > R$ 10 -> anomalia valor_repetido nos dois
  if (
    camposFinais.iptu !== null &&
    camposFinais.condominio !== null &&
    camposFinais.iptu.valor === camposFinais.condominio &&
    camposFinais.condominio > 10
  ) {
    anomalias.push({
      campo: "condominio",
      tipo: "valor_repetido",
      valorLido: `R$ ${camposFinais.condominio}`,
      mensagem: `Valor de condomínio idêntico ao do IPTU.`,
    });
    anomalias.push({
      campo: "iptu",
      tipo: "valor_repetido",
      valorLido: `R$ ${camposFinais.iptu.valor}`,
      mensagem: `Valor de IPTU idêntico ao do condomínio.`,
    });
  }

  // 6. Lacunas: preco, condominio, iptu, area, bairro que ficaram nulos
  const chavesLacunas: ChaveDeCampo[] = ["preco", "condominio", "iptu", "area", "bairro"];
  const lacunas: ChaveDeCampo[] = [];
  for (const c of chavesLacunas) {
    if ((camposFinais as any)[c] === null) {
      lacunas.push(c);
    }
  }

  // 7. Cobertura:
  // - coberto se bairro em BAIRROS_COBERTOS
  // - recife_fora se é outro bairro do Recife
  // - fora_do_recife se a cidade é outra
  // - senão desconhecida
  let coberturaFinal: Cobertura = "desconhecida";
  if (camposFinais.bairro && eCoberto(camposFinais.bairro)) {
    coberturaFinal = "coberto";
  } else if (camposFinais.bairro) {
    coberturaFinal = "recife_fora";
  } else if (
    camposFinais.cidade &&
    camposFinais.cidade.toLowerCase() !== "recife"
  ) {
    coberturaFinal = "fora_do_recife";
  } else if (
    camposFinais.bairroTexto &&
    (camposFinais.bairroTexto.includes("salvador") ||
      camposFinais.bairroTexto.includes("brasilia") ||
      camposFinais.bairroTexto.includes("sao-paulo") ||
      camposFinais.bairroTexto.includes("rio-de-janeiro"))
  ) {
    coberturaFinal = "fora_do_recife";
  }

  // Se URL tem cidade diferente explicitamente
  if (coberturaFinal === "desconhecida" && url) {
    const u = url.toLowerCase();
    if (u.includes("quintoandar.com.br") && !u.includes("-recife")) {
      coberturaFinal = "fora_do_recife";
    }
  }

  const resultado: ExtracaoAnuncio = {
    url,
    portal: portalEscolhido,
    idNoPortal: idEscolhido,
    coletadoEm: agora.toISOString(),
    metodos: metodos.length > 0 ? (metodos as [any, ...any[]]) : ["texto"],
    campos: camposFinais,
    origemDosCampos,
    anomalias,
    lacunas,
    cobertura: coberturaFinal,
  };

  return esquemaExtracao.parse(resultado);
}
