# Biblioteca de Referências de Motion Design — VEREDA

Este diretório e o arquivo [`references.json`](./references.json) formam a biblioteca central de referências visuais e técnicas do projeto audiovisual do VEREDA.

## Princípios de Manutenção

1. **Nunca descarte referências anteriores**: Novas referências devem ser acrescentadas ao array `references` em [`references.json`](./references.json) com um novo `id` sequencial (`REF-01`, `REF-02`, ..., `REF-07`, `REF-08`, etc.).
2. **Honestidade de Acesso**: Nunca afirme ter assistido a um vídeo se apenas o texto ou transcrição foi inspecionado. Utilize o campo `accessStatus`:
   - `available_inspected`: Material baixado, assistido ou decomposto em frames diretamente.
   - `available_inspected_via_transcript_and_spec`: Vídeo inacessível diretamente (ex.: paywall/bloqueio do X), mas especificação técnica, prompt original e metadados inspecionados via materiais públicos de apoio.
   - `unavailable`: Material não acessível; usar apenas as técnicas documentadas sem inventar detalhes.
3. **Extração de Gramática, não de Conteúdo**: Nós aproveitamos a física, o ritmo, o movimento de câmera e a tipografia das referências. O conteúdo, as marcas, os dados e a identidade visual são **100% autênticos do VEREDA** (Recife, dados cadastrais, DSQFL, IPTU, paleta papel técnico).

## Esquema de Registro de Nova Referência

Para adicionar uma nova referência via agente ou manualmente, adicione um objeto ao array `references`:

```json
{
  "id": "REF-09",
  "slug": "nome-curto-da-referencia",
  "title": "Título Completo da Obra",
  "creator": "Nome ou @ do autor",
  "type": "Classificação da referência",
  "originalUrl": "https://...",
  "accessibleSupportingUrl": "https://...",
  "accessStatus": "available_inspected | available_inspected_via_transcript_and_spec | unavailable",
  "evidenceInspected": "Detalhamento explícito do que foi lido, medido, extraído ou assistido",
  "visualTechniques": ["técnica 1", "técnica 2"],
  "technicalTechniques": ["física", "render", "câmera"],
  "proposedUseInVereda": "Como essa referência melhora especificamente uma cena ou transição do VEREDA"
}
```

## Referências Atuais Cadastradas

| ID | Título | Autor | Tipo | Status |
| :--- | :--- | :--- | :--- | :--- |
| **REF-01** | *Ravie's 5-year Showreel* | Ravie & Co. | Studio Showreel / 3D & Kinetic Motion | Inspecionado (47 frames extraídos e contact sheet) |
| **REF-02** | *"Comma" motion graphics* | seven | Monochromatic Minimal Motion | Inspecionado (25 frames extraídos e contact sheet) |
| **REF-07** | *Code-based UI motion design showreel* | zero (@twoclipping) | One-Shape UI Morphing / Code Animation | Inspecionado via prompt XML integral no JasonZhu.AI |
| **REF-08** | *Motion Design Studio Workflow* | Movez (@0xMovez) | Studio Pipeline / seek(t) / Review Loop | Inspecionado via transcrição integral no Thread Navigator |
