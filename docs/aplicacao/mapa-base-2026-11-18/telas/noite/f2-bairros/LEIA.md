# Fundo do mapa em bairros de tipos diferentes (F2, 18/11/2026)

`folha-de-contato.png`: 12 cenas montadas com os arquivos publicados do mapa-base (o bairro, os bairros cuja caixa toca o quadro e a cidade), quadro de 340 × 260 px, desenhadas pela mesma tabela de estilo do app (`svgDaCena`, fontes do app). Oito lugares no nível de lote (300 m na largura) e quatro no nível de quadras (2 km), claro e escuro. Centro: o caso `casa-forte-divisa` e o caso `pina-sem-lote` de `scripts/casos.json`, o meio entre Torre e Madalena e o meio da caixa dos demais bairros. As 32 vistas completas (8 lugares, 2 níveis, 2 temas) foram olhadas fora do repositório.

O que foi conferido a olho: lotes dentro das quadras; nomes de rua no vão entre quadras; água por cima das quadras; pontes fechando as travessias (Santo Antônio, Torre e Madalena, Pina); quadra sem lote só como quadra (Pina, Nova Descoberta); a divisa do bairro do imóvel em ferrugem; junto à divisa, o vizinho com chão de rua (não hachurado), divisa tracejada e nome (Casa Forte e Parnamirim); hachura só fora do Recife (Coqueiral, a oeste: Jaboatão).

Corrigido no desenho nesta rodada: ids dos caminhos dos rótulos repetidos entre dois fundos na mesma página (na web um rótulo seguia o caminho do outro fundo); chão do vizinho junto à divisa.

Do dado, sem correção no desenho:
- Recife (bairro do porto): a bacia do porto, entre o cais e o molhe, está dentro da divisa do bairro e não tem polígono de água nem quadra; aparece como chão de rua (branco no nível de lote, tingido no nível de quadras).
- Nova Descoberta (morro) e Coqueiral: quase sem lote; algumas ruas do morro passam sobre quadra (o traçado da rua não coincide com o vão entre quadras).
