# Planos e tasks

Artefatos do [método de entrega por task](../metodo/README.md): uma pasta por feature do hub, uma subpasta por tarefa.

```text
docs/planos/
└── F-xxxxxxxx-nome-curto/        feature no hub (8 primeiros caracteres do id)
    ├── plano.md
    └── tasks/
        └── T-xxxxxxxx/           tarefa no quadro "Macro" (8 primeiros caracteres do id)
            ├── funcional.md
            ├── tecnico.md
            └── validacao.md
```

- Use os [modelos](../metodo/templates/) e os IDs reais do hub. As regras estão no [fluxo](../metodo/fluxo-entrega.md).
- Um arquivo aqui não é aprovação. A aprovação é a decisão de uma pessoa, registrada com autor e link no próprio documento.
- O hub continua sendo a fonte da verdade do escopo e das decisões. Estas pastas guardam a especificação e a evidência de cada tarefa.
- Os planos anteriores a este método ([`plano-recife/`](../plano-recife/README.md) e [`aplicacao/`](../aplicacao/README.md)) ficam onde estão.

Ainda não há plano nesta pasta.
