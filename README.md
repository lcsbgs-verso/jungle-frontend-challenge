# Kurio Marketplace

Implementação do [desafio frontend da Jungle Gaming](https://github.com/junglegaming/frontend-challenge), com catálogo de NFTs, conta de colecionador e compra simulada.

## Executar localmente

Use Node.js 22.12 ou superior.

```sh
npm ci
npm run dev
```

A aplicação abre no endereço indicado pelo Vite. Os mocks são ativados por padrão. Use `.env.example` como referência para a configuração.

## Conta de demonstração

- Alice · `alice@kurio.test`
- Bruno · `bruno@kurio.test`
- Senha para as duas contas · `Kurio2026!`

Use `KURIO10` para aplicar 10% de desconto no carrinho. Abra **Cenários da demo** no rodapé para selecionar falhas ou restaurar os dados iniciais.

## Verificação

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
npx playwright install chromium
npm test
```

O projeto está em validação. O primeiro fluxo de compra completo já foi verificado no navegador. O teste de atualização em tempo real ainda está em investigação.
