# Kurio Marketplace

Marketplace de NFTs para o [desafio frontend da Jungle Gaming](https://github.com/junglegaming/frontend-challenge). A interface segue o [Figma do desafio](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1). Catálogo, conta, carteiras, pagamento e eventos são simulados localmente no navegador.

## Executar

Use Node.js 22.12 ou superior e Chromium para os testes.

```sh
npm ci
npm run dev
```

O Vite indica o endereço no terminal. A demonstração ativa o MSW por padrão. O arquivo `.env.example` descreve as variáveis disponíveis.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Ativa a API e o Socket.IO simulados. Com `false`, a aplicação espera serviços que implementem os contratos. |
| `VITE_API_URL` | `/api` | Endereço da API REST. Mantenha o padrão para a demo. |
| `VITE_SOCKET_URL` | Origem da página | Origem do servidor Socket.IO. Mantenha o padrão para a demo. |

## Dados fictícios

| Conta | E-mail | Senha |
| --- | --- | --- |
| Alice | `alice@kurio.test` | `Kurio2026!` |
| Bruno | `bruno@kurio.test` | `Kurio2026!` |

As duas contas começam com duas carteiras cadastradas. O cupom `KURIO10` concede 10% de desconto, `EXPIRADO` simula um cupom vencido e qualquer outro código retorna um erro de validação.

## Reproduzir cenários

Abra **Cenários da demo** no rodapé. O painel envia ações de controle à API simulada. **Restaurar dados da demonstração** volta aos preços, estoques, contas e demais dados iniciais no navegador.

| Fluxo | Como reproduzir |
| --- | --- |
| Compra confirmada | Adicione Emerald Ape ao carrinho. Entre como Alice, conecte uma carteira, revise e confirme. Acompanhe a transição de pendente para confirmado. |
| Cotação alterada | Adicione Emerald Ape, abra o pagamento e acione **Alterar preço do Emerald Ape** no painel. O resumo é atualizado. Se a revisão já estiver aberta, ela bloqueia a confirmação até uma nova revisão. |
| Edição esgotada | Adicione a edição original de Emerald Ape e acione **Esgotar edição do Emerald Ape**. O carrinho informa o conflito e bloqueia o pagamento. |
| Timeout após envio | Selecione **Timeout após criar pedido**. Depois de confirmar, aguarde o erro e clique em **Recuperar pedido**, inclusive após recarregar a página. A tentativa reutiliza a mesma chave. |
| Pagamento recusado | Selecione **Pagamento recusado** e envie um pedido. A recusa preserva os itens. |
| Reconexão | Selecione **Pedido pendente prolongado** e faça uma compra. Acione **Interromper conexão em tempo real**, depois **Finalizar pedido pendente**. O pedido é recuperado pela consulta REST ao reconectar ou atualizar a página. |
| Sessão expirada | Na etapa de pagamento, selecione **Sessão expirada**. O próximo acesso privado pede login. Entre com a mesma conta para retomar o fluxo. |
| Favorito com erro | Entre na conta, abra uma obra e selecione **Falha ao favoritar**. O controle reverte para o estado anterior quando a API retorna a falha. |
| Carregamento, vazio e falhas | Selecione o cenário correspondente e navegue ou recarregue a página. Após uma falha, volte para **Padrão** e tente novamente. |

## Verificar

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
npx playwright install chromium
npm test
npm run test:report
npm run audit:lighthouse
```

O Playwright inicia um build otimizado e testa desktop de 1440 px e mobile de 390 px. Há também uma verificação de tablet a 768 px. As baselines de início, detalhe, carrinho e pagamento ficam em `tests/baselines`. Para usar o Chrome instalado, execute `PLAYWRIGHT_CHROME_CHANNEL=chrome npm test`. O relatório HTML e os traces de falhas são gerados em `playwright-report` e `test-results`.

A auditoria Lighthouse usa o build de produção gerado por `npm run build`. Ela inicia um preview local e registra três execuções por página e perfil. Os relatórios ficam em `audits`. `CHROME_PATH` pode apontar para um Chromium instalado e `LIGHTHOUSE_URL` pode apontar para uma demo publicada.

Os contratos e as decisões de projeto estão em [ARCHITECTURE.md](ARCHITECTURE.md). Os resultados da validação e os relatórios estão em [reports/README.md](reports/README.md).

A validação local concluiu 48 testes com sucesso, incluindo comparação visual, nos três tamanhos de tela previstos. As artes do catálogo são recriações geradas e estão documentadas nas decisões de projeto.
