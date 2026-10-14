# VEREDA ? vers?o Impeccable

Segunda vers?o do frontend, preservando os dados fict?cios e a identidade editorial do projeto original. A aplica??o original continua na raiz do reposit?rio; esta vers?o fica em `veredas-impeccable/`.

## Executar

Na raiz do reposit?rio, execute em terminais separados:

```powershell
python -m http.server 8080 --bind 127.0.0.1
python -m http.server 8081 --bind 127.0.0.1 --directory veredas-impeccable
```

- Original: http://localhost:8080
- Segunda vers?o: http://localhost:8081
- Compara??o: http://localhost:8081/compare.html

Tamb?m ? poss?vel executar `./start.ps1` nesta pasta para iniciar a segunda vers?o. N?o h? depend?ncias de build.

## Altera??es

- Moldura mobile de 414 ? 880px, rolagem interna e navega??o na base.
- Tipografia, contraste, espa?amento e quebra de textos curtos revisados.
- ?cones SVG no lugar de emojis e caracteres decorativos.
- Valida??o de links, navega??o por teclado e gest?o de foco nos di?logos.
- C?pia efetiva da mensagem e recupera??o quando o acesso ? ?rea de transfer?ncia ? negado.
- Checklist salvo localmente e resumo pr?prio para o Pauliceia.

As orienta??es aplicadas do Impeccable incluem audit, typeset, layout, adapt, clarify, harden, document e polish. `PRODUCT.md` e `DESIGN.md` registram contexto e regras. O relat?rio hist?rico da primeira passagem est? em `reports/IMPECCABLE.md`; as altera??es posteriores de moldura e remo??o dos avisos de demonstra??o prevalecem sobre a descri??o inicial.

A aplica??o permanece est?tica, sem backend; os dados s?o os exemplos do projeto original. Fontes e fotografia usam recursos externos.

## Valida??o

JavaScript validado com `node --check impeccable.js`. Quinze verifica??es de comportamento em DOM simulado passaram na revis?o inicial. N?o foi poss?vel validar visualmente em navegador automatizado neste ambiente.
