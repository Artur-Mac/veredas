#!/usr/bin/env python3
"""
Vereda Multi-Agent Market & Society Swarm Simulation (Headless CLI Runner).

Adapted from Viralix's swarm orchestration, anti-echo, cascade pressure,
and structured SocialAgent decision loop to run headlessly against local
llama-server (Qwen3.8-27B-Uncensored) with strict VRAM context bounds.
"""
from __future__ import annotations

import json
import os
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

LLM_URL = os.environ.get("VEREDA_LLM_URL", "http://127.0.0.1:9931/v1/chat/completions")
LLM_MODEL = os.environ.get("VEREDA_LLM_MODEL", "qwen-local")
TEMPERATURE = 0.75
NUM_CTX = 4096

OUT_DIR = Path(__file__).resolve().parent
RAW_JSON_PATH = OUT_DIR / "vereda_raw_debate.json"
RAW_MD_PATH = OUT_DIR / "vereda_raw_debate.md"

# Ground Truth extracted from the Vereda repository on 2026-11-14
VEREDA_GROUND_TRUTH = """
VEREDA (Estado real em 14/11/2026 — Código Expo/React Native + Plano VE00–VE17 + Pitch 18/10/2026):

1. O QUE O PITCH PROMETE (roteiro 120s, Campus Mobile):
- "Você cola o link do anúncio e em segundos revelamos tudo: corrige fotos esticadas em olho de peixe, descobre o lote exato, cruza metragem com IPTU, taxas omitidas, valor real das escrituras do edifício, alvará de obra/demolição, alagamentos, ilha de calor, segurança, custo de vida."
- "Monta no WhatsApp a lista de perguntas para o corretor. Pay-per-use com teste grátis + créditos para quem valida dados em campo (89% aceitaram na pesquisa UFPE N=83, nota 4,7/5) + fase 2 licenciando dados para bancos, seguradoras e imobiliárias. Piloto na rua até jun/2027."

2. O QUE REALMENTE EXISTE NO REPOSITÓRIO HOJE (VE00–VE15):
- Arquitetura atual 100% local/offline no aparelho (Expo SDK 57 / React Native, AsyncStorage, sem backend nem login nem gateway de pagamento). Bundle web atual pesa 30,1 MB JS (7,4 MB gzip), causando demora na primeira carga; ZERO testes em aparelho celular real (Android/iOS só não rodados ainda; testes só em desktop/375px Playwright).
- Cobertura geográfica: índice básico de 7.206 prédios em 72 bairros, mas camadas enriquecidas cobrem só 5 bairros piloto (Boa Viagem 1.879 prédios, Graças 291, Madalena 280, Espinheiro 156, Casa Forte 82 = 2.688 prédios; 2.516 com vínculo forte à rede de pedestres). Fora dos 5 bairros, só ficha básica ou fora de cobertura.
- Ingestão de anúncios: Portais (QuintoAndar ToS jan/2026, OLX ToS fev/2025) proíbem scraping e usam bloqueios/CAPTCHA. App usa importação deliberada no cliente (WebView no celular, Share Intent Safari/Android, copiar/colar trecho, extensão Chrome desktop, OCR local ou entrada manual). NÃO existe correção automática de foto olho-de-peixe implementada (VE13 VLM não rodou).
- Preços & Réguas: "Posição é fato, adjetivo é veredito" — sem notas 0–10, usa quartis (P25, Mediana, P75). Porém:
  * Compra usa ITBI (valor de avaliação fiscal da Prefeitura, NÃO preço real de escritura/fechamento!), disponível em apenas 1.319/2.688 prédios piloto (630 elegíveis homogêneos; 410 em Boa Viagem vs. apenas 26 em Casa Forte).
  * Aluguel: NÃO há feed externo de ofertas permitidas! Coletor Oleo falhou 10/10, ZAP tem só 139 resumos viciados de página 1, D034 bloqueou exibição de faixas externas de mercado. Hoje a régua de aluguel compara apenas contra os anúncios que o próprio usuário salvou no caderno + FipeZAP agregado da cidade.
- Entorno & Clima:
  * Alagamento: Defesa Civil tem 1.645 registros -> 31 episódios (14 registros em apenas 2 datas administrativas; 211/394 sem vínculo à rua). Modelo ML de alagamento (VE14) foi REJEITADO porque perdeu para recorrência simples (7/50 vs 8/50).
  * Calor/Ruído/Segurança: ERA5 temperatura caiu na mesma célula de 25-30km para os 5 bairros; Landsat superfície != temperatura interna. Sem decibelímetro calibrado no entorno (apenas aponta fachada voltada a via arterial <=80m ou LUSE <=150m; cone do aeroporto estava vazio). Sombra na rota a pé foi CANCELADA (D030: ganho de 1-3,6 min em só 6/80 casos, sem dados de copas de árvores). Motor solar de fachadas + bússola `/sol` funciona nos 5 bairros.
  * Prédio-Caixão: sinal cadastral (<=4 pavimentos, pré-2005, padrão simples/médio), nunca laudo.
  * CNPJ / Processos TRT6 / Atas: modelado e com upload manual opcional, mas DataJud deu 403, TST exige CAPTCHA, Infosimples/JUDIT não testados; extração de atas reais (VE15.02) não executada.
- Validação com Usuários & Créditos:
  * Pesquisa inicial N=83 (Google Forms UFPE/WhatsApp) deu WTP média ~R$28 e 89% interesse, mas G-USER (teste moderado com usuários reais no app VE01–VE15) = ZERO participantes até hoje!
  * Carteira de créditos atual é só de teste ("sem valor em dinheiro"): confirmar prédio custa -1, informar motivo de descarte dá +1, botão recarrega +3 créditos de teste.
- Restrições Legais:
  * ODbL 1.0 (IPTU/ITBI/Licenciamento Recife): índice derivado publicado aciona cláusula share-alike (§4.6b) — o dado bruto não é fosso defensável!
  * Lei 6.530/78 (CRECI): proibição de parecer corretagem/intermediação.
  * Campus Mobile item 11.20(iv): proíbe citar marcas terceiras na submissão/demo, mas a tela Explorar (`index.tsx`) ainda exibe "Cole o link do ZAP, VivaReal, QuintoAndar ou OLX".
""".strip()

PERSONAS: List[Dict[str, Any]] = [
    {
        "id": "corretor_veterano",
        "name": "Sérgio Cavalcanti",
        "role": "Corretor CRECI-PE (22 anos, Boa Viagem/Setúbal)",
        "group": "Incumbente Hostil",
        "swarm": "brand",
        "contrarian_score": 0.90,
        "bio": "52 anos, corretor autônomo de alto volume em Boa Viagem. Vive de comissão de 5-6% na venda e 1º aluguel; esconde nome do prédio e número nos anúncios do ZAP/OLX para não levar bypass direto na portaria.",
        "self_interest": "Proteger exclusividade do lead, comissão e fechamento rápido. Odeia qualquer app que desmascare número do prédio antes da visita, exponha ITBI abaixo do valor pedido ou coloque perguntas hostis na boca do cliente.",
        "action_hint": "BOYCOTT / QUOTE_POST / CREATE_COMMENT agressivo; pense em como bloquear, contornar ou denunciar no CRECI.",
    },
    {
        "id": "incorporadora_diretora",
        "name": "Renata Albuquerque",
        "role": "Diretora Comercial de Incorporadora (Zona Norte - Graças/Casa Forte)",
        "group": "Incumbente Hostil",
        "swarm": "brand",
        "contrarian_score": 0.85,
        "bio": "41 anos, lidera vendas de incorporadora média no Recife (SPEs, estoque pronto e lançamentos na Zona Norte). Acompanha proptechs e lembra perfeitamente da Zillow recuando das notas de risco climático em 2025 após pressão do setor.",
        "self_interest": "Impedir que dados municipais crus (alvarás, ações trabalhistas TRT6 de SPEs/construtoras, sinais de alagamento ou 'prédio-caixão') derrubem velocidade de vendas (VSO) e valor de m². Pronta para acionar jurídico por difamação/desvio de finalidade.",
        "action_hint": "BOYCOTT / FACT_CHECK corporativo; ataque riscos de dano à imagem e contestação jurídica.",
    },
    {
        "id": "proprietario_especulador",
        "name": "Eduardo 'Duda' Vasconcelos",
        "role": "Proprietário Multi-Imóveis & Rentista (7 aptos BV/Espinheiro)",
        "group": "Incumbente Hostil",
        "swarm": "retail",
        "contrarian_score": 0.85,
        "bio": "58 anos, investe em apartamentos antigos dos anos 80/90 no Recife para maximizar yield de aluguel (8,5% a.a.). Costuma colocar 'IPTU a consultar', 'condomínio baixinho' e omitir cota extra de fachada até a hora da assinatura.",
        "self_interest": "Fechar locação pelo maior valor sem desconto nem questionamento técnico sobre sol poente, ruído ou rateio futuro. Se um inquilino aparecer com decibelímetro e pergunta da Lei do Inquilinato art. 22 IX, ele prefere alugar para o próximo da fila.",
        "action_hint": "BOYCOTT / CREATE_COMMENT pragmático e cínico; explique como recusaria inquilinos 'chatos' ou burlaria o botão 'Isso está errado'.",
    },
    {
        "id": "compradora_primeira_viagem",
        "name": "Camila Ferreira",
        "role": "Médica Residente / Compradora 1º Imóvel (Madalena/Espinheiro)",
        "group": "Usuário Final (Baixa Tolerância a Atrito)",
        "swarm": "public",
        "contrarian_score": 0.45,
        "bio": "29 anos, faz plantão de 60h/semana. Tem pavor de cair em prédio-caixão, apartamento forno no poente ou obra ao lado, mas tem zero paciência para tutorial técnico, extensão de navegador ou planilha.",
        "self_interest": "Quer resposta rápida e clara no celular em 30 segundos ('vale visitar ou é furada?'). Odeia ter que copiar/colar texto manualmente do portal, confirmar polígono no mapa sem saber o endereço ou baixar 30MB no 4G.",
        "action_hint": "CREATE_COMMENT / EXPRESS_PURCHASE_INTENT / FACT_CHECK emocional e impaciente; teste fricção de UX real.",
    },
    {
        "id": "inquilino_cetico",
        "name": "Thiago Santana",
        "role": "Analista Jr. / Inquilino fora do eixo nobre (Torre/Cordeiro/Madalena)",
        "group": "Usuário Final (Sensível a Preço)",
        "swarm": "public",
        "contrarian_score": 0.70,
        "bio": "26 anos, ganha R$ 4.200/mês e busca aluguel de até R$ 2.100 com transporte público bom à noite e zero taxa surpresa. Cético com startup que cobra R$ 29,90 por PDF enquanto ele já paga caro na mudança.",
        "self_interest": "Não quer pagar nada antes de ver valor real, não quer trabalhar de graça cadastrando prédio para startup ganhar dinheiro depois, e fica furioso se o bairro onde ele realmente pode pagar (Torre/Várzea/Pina) estiver sem camadas.",
        "action_hint": "FACT_CHECK / DISLIKE_POST / CREATE_COMMENT ácido de usuário duro na queda.",
    },
    {
        "id": "investidor_planilheiro",
        "name": "Marcelo Tavares",
        "role": "Engenheiro Civil & Investidor Imobiliário (Graças/Boa Viagem)",
        "group": "Usuário Final (Power User / Analítico)",
        "swarm": "academic",
        "contrarian_score": 0.75,
        "bio": "46 anos, engenheiro, compra imóveis subprecificados e avalia yield líquido. Acostumado a ler matrícula no RI Digital, balancete condominial e usar Excel avançado.",
        "self_interest": "Só paga por dado duro que economize tempo ou revele assimetria real de preço/risco jurídico. Detecta imediatamente quando ITBI fiscal é vendido como 'valor real de escritura' ou quando falta base real de aluguéis fechados.",
        "action_hint": "FACT_CHECK técnico / QUOTE_POST analítico; aponte furos entre dado fiscal, amostra de aluguel e promessa do pitch.",
    },
    {
        "id": "auditora_lgpd_juridica",
        "name": "Dra. Helena Guimarães",
        "role": "Advogada Especialista em LGPD, Direito Digital & Imobiliário (PE)",
        "group": "Auditor Técnico / Legal",
        "swarm": "regulator",
        "contrarian_score": 0.85,
        "bio": "39 anos, sócia de boutique jurídica no Recife atendendo imobiliárias e startups. Conhece a fundo ODbL 1.0, LGPD art. 7º §3º, Lei 6.530/78 (CRECI), CDC e termos de uso de portais.",
        "self_interest": "Identificar passivos fatais de processo judicial, notificação extrajudicial dos portais (QuintoAndar/OLX ToS), quebra de share-alike da ODbL, exercício ilegal de corretagem ao recomendar 'visite A antes de B' e danos morais a condomínios/SPEs.",
        "action_hint": "FACT_CHECK jurídico implacável; cite normas concretas (ODbL, LGPD, CRECI, ToS, CDC).",
    },
    {
        "id": "engenheiro_dados_senior",
        "name": "Rafael Brito",
        "role": "Staff Data & Mobile Engineer (Ex-Fintech, Recife/SP)",
        "group": "Auditor Técnico / Engenharia",
        "swarm": "spy",
        "contrarian_score": 0.80,
        "bio": "37 anos, arquiteto de pipelines de dados e apps mobile em produção. Leu os logs VE00–VE15 do repositório e sabe exatamente onde scrapers quebram e onde bundles de 30MB morrem em Android de entrada.",
        "self_interest": "Não engole slide bonito de arquitetura. Aponta falhas do coletor Oleo (10/10 erro), Overpass quebrado, ZAP de 139 cards, GTFS vs dados não observados, modelo de alagamento rejeitado (VE14), ERA5 de 30km e G-USER = 0 usuários testados.",
        "action_hint": "FACT_CHECK técnico direto nos números do repo (VE00–VE15); sem elogio genérico.",
    },
    {
        "id": "jurada_vc_campus",
        "name": "Beatriz Monteiro",
        "role": "Jurada Campus Mobile & Investidora Seed Proptech (SP/Recife)",
        "group": "Avaliadora de Pitch & VC",
        "swarm": "media",
        "contrarian_score": 0.80,
        "bio": "35 anos, investidora de early-stage e avaliadora rigorosa de competições como Campus Mobile (Instituto Claro/LSI-TEC). Já viu 200 startups de proptech morrerem por CAC alto e baixa frequência de compra.",
        "self_interest": "Separar projeto de hackathon com pesquisa N=83 enviesada de negócio escalável real. Cobra coerência entre o pitch ('corrige foto olho de peixe', 'escritura real', '500k registros') e o código, além de risco de desclassificação pelo item 11.20(iv) e unit economics.",
        "action_hint": "QUOTE_POST / FACT_CHECK estratégico de banca e VC; exponha lacuna pitch-vs-código, moat e monetização.",
    },
]

SWARM_SYSTEM_BASE = """Você participa de uma simulação de mercado realista e SEM CENSURA sobre o aplicativo VEREDA no Recife (novembro de 2026).
REGRAS INEGOCIÁVEIS:
1. Aja 100% pelo seu autointeresse econômico, viés profissional e realidade local do Recife.
2. PROIBIDO consenso educado de IA, elogios diplomáticos vazios ("a iniciativa é louvável", "tem potencial se ajustar...") ou linguagem neutra de consultoria.
3. Se você boicotaria, processaria, ignoraria, exploraria uma brecha ou acharia inútil/caro, DIGA ISSO NA CARA e explique exatamente como.
4. Use apenas fatos presentes no dossiê técnico fornecido ou no debate — nunca invente números de outra cidade ou funcionalidades inexistentes.
5. Responda ESTRITAMENTE em JSON válido (sem ```json, sem texto antes ou depois). Tudo em português do Brasil natural e incisivo."""


def call_local_llm(system_prompt: str, user_prompt: str, max_tokens: int = 340) -> Dict[str, Any]:
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": TEMPERATURE,
        "num_ctx": NUM_CTX,
        "max_tokens": max_tokens,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        LLM_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=240) as resp:
        raw = json.loads(resp.read().decode("utf-8"))
    elapsed = round(time.time() - t0, 2)
    content = raw["choices"][0]["message"]["content"].strip()
    usage = raw.get("usage", {})
    parsed = extract_json(content)
    return {
        "parsed": parsed,
        "raw_text": content,
        "usage": usage,
        "elapsed_s": elapsed,
    }


def extract_json(text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        obj = json.loads(cleaned)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass
    m = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if m:
        candidate = m.group(0)
        try:
            obj = json.loads(candidate)
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            pass
    return {"_parse_error": True, "raw_fallback": cleaned}


def persona_header(p: Dict[str, Any]) -> str:
    return (
        f"SUA PERSONA: {p['name']} (@{p['id']}) — {p['role']} [{p['group']}]\n"
        f"BIO: {p['bio']}\n"
        f"SEU INTERESSE PRÓPRIO REAL: {p['self_interest']}\n"
        f"ESTILO DE AÇÃO ({p['swarm']}): {p['action_hint']} | Tendência contrária: {p['contrarian_score']}"
    )


def save_checkpoint(state: Dict[str, Any]) -> None:
    RAW_JSON_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def clamp_int(val: Any, lo: int = 0, hi: int = 100, default: int = 50) -> int:
    try:
        n = int(round(float(val)))
        return max(lo, min(hi, n))
    except (TypeError, ValueError):
        return default


def run_round_1(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    print("\n=== ROUND 1: Exposição Inicial & Reação Bruta ===", flush=True)
    entries: List[Dict[str, Any]] = []
    for idx, p in enumerate(PERSONAS, 1):
        sys_p = f"{SWARM_SYSTEM_BASE}\n\n{persona_header(p)}"
        usr_p = f"""CONTEXTO DO PRODUTO VEREDA (Novembro/2026):
{VEREDA_GROUND_TRUTH}

RODADA 1 — EXPOSIÇÃO INICIAL:
Você acabou de ver o pitch do VEREDA e testar/inspecionar a versão atual do aplicativo no Recife.
Reaja imediatamente com base no seu interesse próprio, sem filtro nem cortesia.

Retorne EXATAMENTE este JSON:
{{
  "stance": "adopt | conditional | skeptical | hostile | boycott | sue_or_block",
  "primary_action": "ENDORSE | CREATE_COMMENT | FACT_CHECK | QUOTE_POST | BOYCOTT | EXPRESS_PURCHASE_INTENT | DO_NOTHING",
  "trust_score": 0-100,
  "adoption_intent": 0-100,
  "public_statement": "Sua reação pública direta (máximo 110 palavras, específica ao Recife e aos fatos acima)",
  "distrust_or_attack_triggers": ["gatilho concreto 1", "gatilho concreto 2"],
  "internal_monologue": "O que você realmente faria nos bastidores: brecha que exploraria, processo que abriria ou motivo pelo qual largaria o app (máximo 55 palavras)"
}}"""
        print(f"  [{idx}/{len(PERSONAS)}] @{p['id']}...", end=" ", flush=True)
        res = call_local_llm(sys_p, usr_p, max_tokens=360)
        d = res["parsed"]
        if d.get("_parse_error"):
            # Retry once with stricter repair hint
            res = call_local_llm(sys_p, usr_p + "\nATENÇÃO: Retorne APENAS um objeto JSON válido com as chaves pedidas, sem comentários.", max_tokens=360)
            d = res["parsed"]
        entry = {
            "round": 1,
            "agent_id": p["id"],
            "name": p["name"],
            "role": p["role"],
            "group": p["group"],
            "swarm": p["swarm"],
            "stance": str(d.get("stance", "skeptical")).lower(),
            "primary_action": str(d.get("primary_action", "CREATE_COMMENT")).upper(),
            "trust_score": clamp_int(d.get("trust_score"), 0, 100, 35),
            "adoption_intent": clamp_int(d.get("adoption_intent"), 0, 100, 30),
            "public_statement": d.get("public_statement") or d.get("raw_fallback", "")[:400],
            "distrust_or_attack_triggers": d.get("distrust_or_attack_triggers", [])[:3],
            "internal_monologue": d.get("internal_monologue", ""),
            "elapsed_s": res["elapsed_s"],
            "usage": res["usage"],
        }
        entries.append(entry)
        state["rounds"]["round_1_initial_exposure"] = entries
        save_checkpoint(state)
        print(f"stance={entry['stance']} trust={entry['trust_score']} intent={entry['adoption_intent']} ({entry['elapsed_s']}s)", flush=True)
    return entries


def build_round2_digest(r1_entries: List[Dict[str, Any]], self_id: str) -> str:
    # Show every other agent's compact stance + statement so cross-agent conflict ignites
    lines = []
    for e in r1_entries:
        if e["agent_id"] == self_id:
            continue
        stmt = str(e["public_statement"]).replace("\n", " ")[:240]
        lines.append(f"- @{e['agent_id']} ({e['role']} | {e['stance']} | trust={e['trust_score']}): \"{stmt}\"")
    return "\n".join(lines)


def run_round_2(state: Dict[str, Any], r1_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    print("\n=== ROUND 2: Debate Cruzado & Atrito de Mercado ===", flush=True)
    entries: List[Dict[str, Any]] = []
    r1_by_id = {e["agent_id"]: e for e in r1_entries}
    # Cascade pressure summary (Viralix-style)
    hostile_cnt = sum(1 for e in r1_entries if e["stance"] in ("hostile", "boycott", "sue_or_block"))
    adopt_cnt = sum(1 for e in r1_entries if e["stance"] in ("adopt", "conditional"))
    cascade_summary = f"Pressão de cascata R1: {hostile_cnt}/9 atores hostis/boicote/processo vs {adopt_cnt}/9 adoção/condicional."

    for idx, p in enumerate(PERSONAS, 1):
        prev = r1_by_id[p["id"]]
        peer_digest = build_round2_digest(r1_entries, p["id"])
        # Also include already-posted Round 2 remarks (up to 3 latest) to trigger intra-round cascade
        intra_round = ""
        if entries:
            latest = entries[-3:]
            intra_lines = [f"- @{x['agent_id']} acabou de responder: \"{str(x['public_reply'])[:180]}\"" for x in latest]
            intra_round = "\nMOVIMENTOS RECENTES NESTA RODADA 2:\n" + "\n".join(intra_lines)

        sys_p = f"{SWARM_SYSTEM_BASE}\n\n{persona_header(p)}"
        usr_p = f"""{cascade_summary}
SUA POSIÇÃO ANTERIOR NA R1: stance={prev['stance']}, trust={prev['trust_score']}, intent={prev['adoption_intent']}.

O QUE OS OUTROS ATORES DO MERCADO DISSERAM NA RODADA 1:
{peer_digest}
{intra_round}

REGRA ANTI-ECO: NÃO repita o que os outros já disseram nem faça discurso genérico. Ataque ou rebata DIRETAMENTE pelo menos 2 atores pelo @id (ex: @corretor_veterano, @auditora_lgpd_juridica, @compradora_primeira_viagem, @engenheiro_dados_senior), defendendo seu interesse ou expondo contradições entre o pitch e o app real.

Retorne EXATAMENTE este JSON:
{{
  "replied_to": ["@id1", "@id2"],
  "stance": "adopt | conditional | skeptical | hostile | boycott | sue_or_block",
  "primary_action": "CREATE_COMMENT | FACT_CHECK | QUOTE_POST | BOYCOTT | ENDORSE | DO_NOTHING",
  "trust_score": 0-100,
  "adoption_intent": 0-100,
  "public_reply": "Resposta direta e combativa citando os @ids e fatos do debate (máximo 125 palavras)",
  "biggest_weakness_exposed": "Qual argumento adversário mais abalou ou reforçou sua visão (máximo 35 palavras)",
  "internal_monologue": "Sua leitura privada da guerra de interesses nesta thread (máximo 45 palavras)"
}}"""
        print(f"  [{idx}/{len(PERSONAS)}] @{p['id']}...", end=" ", flush=True)
        res = call_local_llm(sys_p, usr_p, max_tokens=370)
        d = res["parsed"]
        if d.get("_parse_error"):
            res = call_local_llm(sys_p, usr_p + "\nRetorne APENAS JSON válido.", max_tokens=370)
            d = res["parsed"]
        entry = {
            "round": 2,
            "agent_id": p["id"],
            "name": p["name"],
            "role": p["role"],
            "group": p["group"],
            "replied_to": d.get("replied_to", []),
            "stance": str(d.get("stance", prev["stance"])).lower(),
            "primary_action": str(d.get("primary_action", "FACT_CHECK")).upper(),
            "trust_score": clamp_int(d.get("trust_score"), 0, 100, prev["trust_score"]),
            "adoption_intent": clamp_int(d.get("adoption_intent"), 0, 100, prev["adoption_intent"]),
            "trust_delta_from_r1": clamp_int(d.get("trust_score"), 0, 100, prev["trust_score"]) - prev["trust_score"],
            "public_reply": d.get("public_reply") or d.get("raw_fallback", "")[:420],
            "biggest_weakness_exposed": d.get("biggest_weakness_exposed", ""),
            "internal_monologue": d.get("internal_monologue", ""),
            "elapsed_s": res["elapsed_s"],
            "usage": res["usage"],
        }
        entries.append(entry)
        state["rounds"]["round_2_cross_debate"] = entries
        save_checkpoint(state)
        print(f"stance={entry['stance']} trust={entry['trust_score']} (delta={entry['trust_delta_from_r1']:+d}) ({entry['elapsed_s']}s)", flush=True)
    return entries


def run_round_3(state: Dict[str, Any], r2_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    print("\n=== ROUND 3: Stress-Test de Features & Monetização ===", flush=True)
    entries: List[Dict[str, Any]] = []
    r2_by_id = {e["agent_id"]: e for e in r2_entries}

    # Condensed R2 friction points so agents test features/pricing with full debate memory
    r2_highlights = "\n".join(
        f"- @{e['agent_id']} ({e['stance']}, trust={e['trust_score']}): {str(e['biggest_weakness_exposed'])[:130]}"
        for e in r2_entries
    )

    for idx, p in enumerate(PERSONAS, 1):
        prev = r2_by_id[p["id"]]
        sys_p = f"{SWARM_SYSTEM_BASE}\n\n{persona_header(p)}"
        usr_p = f"""RESUMO DOS ATRITOS DA RODADA 2:
{r2_highlights}

RODADA 3 — TESTE DE ESTRESSE DE PRODUTO, UX E MONETIZAÇÃO:
Vote com honestidade brutal e diga se usaria, pagaria, burlaria ou bloquearia cada proposta real do VEREDA:

[UX-A] Fluxo Core Atual (sem servidor): Colar link -> abrir portal no navegador/Share Intent/copiar texto -> confirmar polígono do lote DSQFL no mapa -> ler Réguas P25/Mediana/P75 + Comparar "Qual visitar primeiro" + "Já tem a resposta?" (bundle web atual ~30MB).
[UX-B] Camada Avançada & Campo: Modo Visita (GPS no prédio, decibelímetro dB, bússola sol nas janelas) + upload manual/OCR de atas/balancetes + alertas de obras em 150m, alagamento Defesa Civil, CNPJ/TRT6 e sinal de "prédio-caixão".
[M1] B2C Pay-per-Use + Give-to-Get: 5 créditos grátis; depois R$ 29,90/dossiê ou R$ 49,90/passe 30 dias (até 5 análises), ou ganha +1 crédito por confirmar lote / motivo de descarte / feedback pós-visita.
[M2] B2B Corretores/Imobiliárias: assinatura R$ 49 a R$ 129/mês por corretor para gerar "Dossiê de Transparência" white-label e qualificar leads.
[M3] B2B2C / Licenciamento de Dados & Parcerias: vender API/camada predial DSQFL enriquecida para bancos (crédito), seguradoras (fiança locatícia), vistoriadoras ou assessorias do comprador (modelo MySide) e B2G (Prefeitura/Procon).

Para cada item, escolha um voto exato: "pay_or_adopt" | "use_free_only" | "abandon_friction" | "bypass_or_game" | "boycott_or_block".

Retorne EXATAMENTE este JSON:
{{
  "ux_a_vote": "...",
  "ux_b_vote": "...",
  "m1_b2c_vote": "...",
  "m2_b2b_brokers_vote": "...",
  "m3_b2b2c_api_vote": "...",
  "max_wtp_brl": 0,
  "most_useful_feature": "qual único recurso tem valor real para você ou seu mercado (15 palavras)",
  "biggest_failure_or_loophole": "como você burlaria o sistema de créditos/UX ou qual modelo quebra na prática (máximo 95 palavras)",
  "surviving_business_model": "M1 | M2 | M3 | NENHUM",
  "rationale": "Justificativa direta dos seus votos (máximo 80 palavras)"
}}"""
        print(f"  [{idx}/{len(PERSONAS)}] @{p['id']}...", end=" ", flush=True)
        res = call_local_llm(sys_p, usr_p, max_tokens=380)
        d = res["parsed"]
        if d.get("_parse_error"):
            res = call_local_llm(sys_p, usr_p + "\nRetorne APENAS JSON válido.", max_tokens=380)
            d = res["parsed"]
        try:
            wtp = round(float(d.get("max_wtp_brl", 0)), 2)
        except (TypeError, ValueError):
            wtp = 0.0
        entry = {
            "round": 3,
            "agent_id": p["id"],
            "name": p["name"],
            "role": p["role"],
            "group": p["group"],
            "ux_a_vote": str(d.get("ux_a_vote", "abandon_friction")).lower(),
            "ux_b_vote": str(d.get("ux_b_vote", "use_free_only")).lower(),
            "m1_b2c_vote": str(d.get("m1_b2c_vote", "bypass_or_game")).lower(),
            "m2_b2b_brokers_vote": str(d.get("m2_b2b_brokers_vote", "boycott_or_block")).lower(),
            "m3_b2b2c_api_vote": str(d.get("m3_b2b2c_api_vote", "use_free_only")).lower(),
            "max_wtp_brl": max(0.0, wtp),
            "most_useful_feature": d.get("most_useful_feature", ""),
            "biggest_failure_or_loophole": d.get("biggest_failure_or_loophole", ""),
            "surviving_business_model": str(d.get("surviving_business_model", "NENHUM")).upper(),
            "rationale": d.get("rationale") or d.get("raw_fallback", "")[:350],
            "elapsed_s": res["elapsed_s"],
            "usage": res["usage"],
        }
        entries.append(entry)
        state["rounds"]["round_3_feature_monetization_stress"] = entries
        save_checkpoint(state)
        print(f"survives={entry['surviving_business_model']} wtp=R${entry['max_wtp_brl']} ({entry['elapsed_s']}s)", flush=True)
    return entries


def run_round_4(state: Dict[str, Any], r2_entries: List[Dict[str, Any]], r3_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    print("\n=== ROUND 4: Veredito Final & Condição de Sobrevivência ===", flush=True)
    entries: List[Dict[str, Any]] = []
    r2_by_id = {e["agent_id"]: e for e in r2_entries}
    r3_by_id = {e["agent_id"]: e for e in r3_entries}

    # Aggregate R3 model survival tally to force final confrontation
    model_tally = Counter(e["surviving_business_model"] for e in r3_entries)
    tally_str = ", ".join(f"{k}:{v}" for k, v in model_tally.most_common())

    for idx, p in enumerate(PERSONAS, 1):
        r2 = r2_by_id[p["id"]]
        r3 = r3_by_id[p["id"]]
        sys_p = f"{SWARM_SYSTEM_BASE}\n\n{persona_header(p)}"
        usr_p = f"""PLACAR DA RODADA 3 (Modelo que sobrevive): {tally_str}.
Sua trajetória até aqui: R2 stance={r2['stance']}, trust={r2['trust_score']}, intent={r2['adoption_intent']} | R3 voto={r3['surviving_business_model']}, WTP=R${r3['max_wtp_brl']}.

RODADA 4 — VEREDITO FINAL:
Após ouvir todos os interesses do Recife (corretores, incorporadora, rentista, moradores, advogada LGPD/ODbL, engenheiro de dados e investidora), dê seu veredito brutal final.

Retorne EXATAMENTE este JSON:
{{
  "final_stance": "adopt | conditional | skeptical | hostile | boycott | sue_or_block",
  "final_trust_score": 0-100,
  "final_market_viability_score": 0-100,
  "brutal_verdict": "Seu veredito em 2-3 frases secas sobre o estado atual do Vereda (máximo 75 palavras)",
  "single_non_negotiable_fix": "A ÚNICA mudança técnica, jurídica ou de produto obrigatória para você não descartar/atacar/reprovar o Vereda (máximo 50 palavras)"
}}"""
        print(f"  [{idx}/{len(PERSONAS)}] @{p['id']}...", end=" ", flush=True)
        res = call_local_llm(sys_p, usr_p, max_tokens=260)
        d = res["parsed"]
        if d.get("_parse_error"):
            res = call_local_llm(sys_p, usr_p + "\nRetorne APENAS JSON válido.", max_tokens=260)
            d = res["parsed"]
        entry = {
            "round": 4,
            "agent_id": p["id"],
            "name": p["name"],
            "role": p["role"],
            "group": p["group"],
            "final_stance": str(d.get("final_stance", r2["stance"])).lower(),
            "final_trust_score": clamp_int(d.get("final_trust_score"), 0, 100, r2["trust_score"]),
            "final_market_viability_score": clamp_int(d.get("final_market_viability_score"), 0, 100, 40),
            "brutal_verdict": d.get("brutal_verdict") or d.get("raw_fallback", "")[:300],
            "single_non_negotiable_fix": d.get("single_non_negotiable_fix", ""),
            "elapsed_s": res["elapsed_s"],
            "usage": res["usage"],
        }
        entries.append(entry)
        state["rounds"]["round_4_final_verdict"] = entries
        save_checkpoint(state)
        print(f"final={entry['final_stance']} trust={entry['final_trust_score']} viability={entry['final_market_viability_score']} ({entry['elapsed_s']}s)", flush=True)
    return entries


def compute_metrics(state: Dict[str, Any]) -> Dict[str, Any]:
    r1 = state["rounds"]["round_1_initial_exposure"]
    r2 = state["rounds"]["round_2_cross_debate"]
    r3 = state["rounds"]["round_3_feature_monetization_stress"]
    r4 = state["rounds"]["round_4_final_verdict"]

    def group_stats(rows: List[Dict[str, Any]], score_key: str) -> Dict[str, Any]:
        by_g: Dict[str, List[float]] = defaultdict(list)
        for row in rows:
            by_g[row["group"]].append(float(row[score_key]))
        return {g: round(statistics.mean(vals), 1) for g, vals in by_g.items()}

    r1_trusts = [e["trust_score"] for e in r1]
    r2_trusts = [e["trust_score"] for e in r2]
    r4_trusts = [e["final_trust_score"] for e in r4]
    r4_viab = [e["final_market_viability_score"] for e in r4]

    # Polarization index: std dev of final trust & viability scores (0-50 max theoretical -> normalized 0-100)
    trust_stdev = round(statistics.pstdev(r4_trusts), 2) if len(r4_trusts) > 1 else 0.0
    viab_stdev = round(statistics.pstdev(r4_viab), 2) if len(r4_viab) > 1 else 0.0

    # Interaction graph metrics (adapted from Viralix cascade_metrics)
    reply_edges: List[Dict[str, str]] = []
    in_degree: Counter = Counter()
    for e in r2:
        for target in e.get("replied_to", []):
            clean_t = str(target).lstrip("@").strip()
            reply_edges.append({"source": e["agent_id"], "target": clean_t})
            if clean_t:
                in_degree[clean_t] += 1

    wtps = [e["max_wtp_brl"] for e in r3]
    end_user_wtps = [e["max_wtp_brl"] for e in r3 if "Usuário Final" in e["group"]]

    return {
        "agent_count": len(PERSONAS),
        "rounds_completed": 4,
        "stance_distribution_r1": dict(Counter(e["stance"] for e in r1)),
        "stance_distribution_r2": dict(Counter(e["stance"] for e in r2)),
        "stance_distribution_r4": dict(Counter(e["final_stance"] for e in r4)),
        "action_distribution_r1": dict(Counter(e["primary_action"] for e in r1)),
        "action_distribution_r2": dict(Counter(e["primary_action"] for e in r2)),
        "mean_trust_r1": round(statistics.mean(r1_trusts), 1),
        "mean_trust_r2": round(statistics.mean(r2_trusts), 1),
        "mean_trust_r4": round(statistics.mean(r4_trusts), 1),
        "mean_viability_r4": round(statistics.mean(r4_viab), 1),
        "trust_stdev_r4": trust_stdev,
        "viability_stdev_r4": viab_stdev,
        "mean_trust_by_group_r1": group_stats(r1, "trust_score"),
        "mean_trust_by_group_r4": group_stats(r4, "final_trust_score"),
        "mean_viability_by_group_r4": group_stats(r4, "final_market_viability_score"),
        "votes_ux_a": dict(Counter(e["ux_a_vote"] for e in r3)),
        "votes_ux_b": dict(Counter(e["ux_b_vote"] for e in r3)),
        "votes_m1_b2c": dict(Counter(e["m1_b2c_vote"] for e in r3)),
        "votes_m2_b2b_brokers": dict(Counter(e["m2_b2b_brokers_vote"] for e in r3)),
        "votes_m3_b2b2c_api": dict(Counter(e["m3_b2b2c_api_vote"] for e in r3)),
        "surviving_business_model_votes": dict(Counter(e["surviving_business_model"] for e in r3)),
        "wtp_all_mean_brl": round(statistics.mean(wtps), 2),
        "wtp_end_users_mean_brl": round(statistics.mean(end_user_wtps), 2) if end_user_wtps else 0.0,
        "wtp_by_agent": {e["agent_id"]: e["max_wtp_brl"] for e in r3},
        "reply_network_most_targeted": dict(in_degree.most_common()),
        "reply_edges_count": len(reply_edges),
        "total_llm_elapsed_s": round(
            sum(e["elapsed_s"] for rnd in [r1, r2, r3, r4] for e in rnd), 2
        ),
        "total_completion_tokens": sum(
            e.get("usage", {}).get("completion_tokens", 0)
            for rnd in [r1, r2, r3, r4]
            for e in rnd
        ),
    }


def write_markdown_transcript(state: Dict[str, Any]) -> None:
    m = state["metrics"]
    lines: List[str] = [
        "# Log Bruto da Simulação de Enxame — VEREDA (14/11/2026)",
        "",
        f"- **Modelo Local:** `{state['metadata']['llm_model']}` (`num_ctx={NUM_CTX}`, `temperature={TEMPERATURE}`)",
        f"- **Agentes:** {m['agent_count']} personas de alto atrito | **Rodadas:** {m['rounds_completed']}",
        f"- **Confiança Média:** R1 `{m['mean_trust_r1']}` → R2 `{m['mean_trust_r2']}` → R4 `{m['mean_trust_r4']}` (desvio padrão R4: `{m['trust_stdev_r4']}`)",
        f"- **Viabilidade Média de Mercado (R4):** `{m['mean_viability_r4']}/100` (desvio padrão: `{m['viability_stdev_r4']}`)",
        f"- **Modelo de Negócio Sobrevivente (Votos R3):** `{json.dumps(m['surviving_business_model_votes'], ensure_ascii=False)}`",
        f"- **Tempo Total de Inferência Local:** `{m['total_llm_elapsed_s']}s` ({m['total_completion_tokens']} tokens gerados)",
        "",
        "## Métricas Agregadas por Grupo",
        "",
        f"- **Confiança R1 por Grupo:** `{json.dumps(m['mean_trust_by_group_r1'], ensure_ascii=False)}`",
        f"- **Confiança R4 por Grupo:** `{json.dumps(m['mean_trust_by_group_r4'], ensure_ascii=False)}`",
        f"- **Viabilidade R4 por Grupo:** `{json.dumps(m['mean_viability_by_group_r4'], ensure_ascii=False)}`",
        f"- **Alvos mais atacados/respondidos na R2:** `{json.dumps(m['reply_network_most_targeted'], ensure_ascii=False)}`",
        "",
        "---",
        "",
        "## Rodada 1 — Exposição Inicial e Reação Bruta",
        "",
    ]

    for e in state["rounds"]["round_1_initial_exposure"]:
        lines += [
            f"### @{e['agent_id']} — {e['name']} ({e['role']})",
            f"- **Postura:** `{e['stance']}` | **Ação:** `{e['primary_action']}` | **Confiança:** `{e['trust_score']}/100` | **Intenção de Adoção:** `{e['adoption_intent']}/100`",
            f"- **Declaração Pública:** {e['public_statement']}",
            f"- **Gatilhos de Ataque/Desconfiança:** {', '.join(str(x) for x in e.get('distrust_or_attack_triggers', []))}",
            f"- **Monólogo Interno:** _{e['internal_monologue']}_",
            "",
        ]

    lines += ["---", "", "## Rodada 2 — Debate Cruzado e Atrito de Mercado", ""]
    for e in state["rounds"]["round_2_cross_debate"]:
        lines += [
            f"### @{e['agent_id']} — {e['name']} (respondeu a: {', '.join(str(x) for x in e.get('replied_to', []))})",
            f"- **Postura:** `{e['stance']}` | **Ação:** `{e['primary_action']}` | **Confiança:** `{e['trust_score']}/100` (`{e['trust_delta_from_r1']:+d}` vs R1) | **Adoção:** `{e['adoption_intent']}/100`",
            f"- **Resposta Pública:** {e['public_reply']}",
            f"- **Maior Fraqueza Exposta:** {e['biggest_weakness_exposed']}",
            f"- **Monólogo Interno:** _{e['internal_monologue']}_",
            "",
        ]

    lines += ["---", "", "## Rodada 3 — Teste de Estresse: UX, Features e Monetização", ""]
    for e in state["rounds"]["round_3_feature_monetization_stress"]:
        lines += [
            f"### @{e['agent_id']} — {e['name']} ({e['group']})",
            f"- **UX-A (Core Link/DSQFL/Réguas):** `{e['ux_a_vote']}` | **UX-B (Visita/OCR/Obras/CNPJ):** `{e['ux_b_vote']}`",
            f"- **M1 (B2C R$29,90 + Créditos):** `{e['m1_b2c_vote']}` | **M2 (B2B Corretores):** `{e['m2_b2b_brokers_vote']}` | **M3 (B2B2C API/Bancos/Seg):** `{e['m3_b2b2c_api_vote']}`",
            f"- **WTP Máximo:** `R$ {e['max_wtp_brl']:.2f}` | **Modelo Sobrevivente:** `{e['surviving_business_model']}`",
            f"- **Feature mais útil:** {e['most_useful_feature']}",
            f"- **Maior Falha / Brecha de Exploração:** {e['biggest_failure_or_loophole']}",
            f"- **Justificativa:** {e['rationale']}",
            "",
        ]

    lines += ["---", "", "## Rodada 4 — Veredito Final e Condição de Sobrevivência", ""]
    for e in state["rounds"]["round_4_final_verdict"]:
        lines += [
            f"### @{e['agent_id']} — {e['name']} ({e['role']})",
            f"- **Postura Final:** `{e['final_stance']}` | **Confiança Final:** `{e['final_trust_score']}/100` | **Viabilidade de Mercado:** `{e['final_market_viability_score']}/100`",
            f"- **Veredito Brutal:** {e['brutal_verdict']}",
            f"- **Única Correção Inegociável:** {e['single_non_negotiable_fix']}",
            "",
        ]

    RAW_MD_PATH.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    print(f"Starting Vereda Swarm Simulation against {LLM_URL} (model={LLM_MODEL}, num_ctx={NUM_CTX}, temp={TEMPERATURE})", flush=True)
    state: Dict[str, Any] = {
        "metadata": {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "llm_url": LLM_URL,
            "llm_model": LLM_MODEL,
            "temperature": TEMPERATURE,
            "num_ctx": NUM_CTX,
            "reference_engine": "viralix-adapted headless Python swarm",
            "ground_truth_date": "2026-11-14",
        },
        "personas": PERSONAS,
        "ground_truth_brief": VEREDA_GROUND_TRUTH,
        "rounds": {
            "round_1_initial_exposure": [],
            "round_2_cross_debate": [],
            "round_3_feature_monetization_stress": [],
            "round_4_final_verdict": [],
        },
        "metrics": {},
    }
    save_checkpoint(state)

    r1 = run_round_1(state)
    r2 = run_round_2(state, r1)
    r3 = run_round_3(state, r2)
    run_round_4(state, r2, r3)

    state["metrics"] = compute_metrics(state)
    save_checkpoint(state)
    write_markdown_transcript(state)

    print("\n=== SIMULATION COMPLETE ===", flush=True)
    print(json.dumps(state["metrics"], ensure_ascii=False, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
