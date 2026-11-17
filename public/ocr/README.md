# OCR privado e local

Recursos congelados do Tesseract.js 7.0.0 e respectivo `tesseract.js-core`, com modelo português `tessdata_fast` sob Apache-2.0. Hashes/tamanhos/origem estão em `manifesto.json`; as três licenças acompanham a distribuição. Não remover a variante não-SIMD: ela permite fallback em navegadores sem SIMD. Os núcleos LSTM contêm o WASM incorporado; OEM 1 não carrega o núcleo legado.

`node scripts/verificar-ocr-local.mjs` confere offline os recursos e a identidade do motor instalado. O modelo é identificado pelo hash do arquivo, não pela estabilidade do branch `main` da origem. Qualquer atualização exige revisão deliberada do modelo, manifesto e smoke real de OCR. O app não consulta essa URL nem baixa modelos de CDN.

Os recursos são servidos pela mesma origem do app e carregados só após escolher uma imagem. Cache do idioma não contém as imagens. Nada assegura uso no primeiro acesso sem rede: o pacote precisa estar disponível no servidor local/origem. Não existe service worker de cache offline de primeira instalação.

Suporte atual: PNG/JPEG/WebP até 10 MB/30 MP, texto português, revisão obrigatória, cancelamento e timeout. Sem OCR direto de PDF, backend/LLM, OCR nativo ou promessa de acurácia universal. Um PDF pode ser anexado privadamente; para OCR escolha uma imagem de uma página e preserve a página/origem no registro.
