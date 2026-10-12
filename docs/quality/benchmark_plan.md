# Plano de Qualidade Técnica e Protocolo de Benchmarks — VEREDA

> **Projeto:** VEREDA (Campus Mobile 15ª Edição)  
> **Área:** Engenharia de Qualidade, Acessibilidade & Desempenho Frontend  
> **Data:** Outubro de 2026

---

## 1. Objetivos do Benchmark

Garantir que o protótipo do **VEREDA** atenda aos mais altos padrões de engenharia de software móvel, acessibilidade visual e confiabilidade metodológica antes da submissão à banca avaliadora do Campus Mobile.

O plano foi estruturado em 4 dimensões não-negociáveis:

1. **Eficiência e Desempenho Frontend (Zero Bloat):** Avaliar tempo de carregamento e pegada de memória em conexões 4G móveis brasileiras, eliminando dependências pesadas de bibliotecas terceirizadas (como Chart.js ou D3.js) em favor de SVGs vetoriais nativos.
2. **Acessibilidade e Ergonomia Visual (WCAG 2.1 AA):** Medir o contraste de cores das superfícies e textos em conformidade com as diretrizes internacionais de legibilidade para uso sob luz solar direta em vistorias de rua.
3. **Integridade Estrutural e Arquitetura de Telas:** Verificar se as 6 telas centrais do fluxo e os 3 modais de intervenção crítica respondem a eventos sem quebras de layout.
4. **Rigor da Tríade Editorial:** Garantir que 100% dos achados e evidências cumpram a regra estrutural: *Fato Oficial com Fonte* ➔ *Impacto Real no Bolso/Rotina* ➔ *Ação Específica para a Visita*.

---

## 2. Metodologia de Medição

O script automatizado [`tests/run_benchmarks.py`](../../tests/run_benchmarks.py) foi construído em Python padrão para executar testes estáticos e dinâmicos determinísticos sobre o código-fonte da aplicação.

### Critérios de Aceite:
* **Peso Total do Bundle:** Menor que 150 KB.
* **Tempo de Renderização Inicial (FCP estimado):** < 0,5 segundos.
* **Contraste de Texto Primário:** Mínimo de 4.5:1 (WCAG AA).
* **Cobertura de Telas:** 6/6 telas ativas.
* **Cobertura de Modais:** 3/3 modais funcionais.
* **Cobertura de Cidades Piloto:** São Paulo (2 perfis) e Recife (1 perfil).
