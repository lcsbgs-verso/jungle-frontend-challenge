# Arquitetura

## Camadas

- **TanStack Router** representa busca, coleções, ordenação, vitrine, faixa de preço e página na URL. A guarda das rotas privadas consulta a sessão e preserva o destino para depois do login.
- **TanStack Query** gerencia os dados remotos e estados das operações. **Axios** centraliza as chamadas REST, os identificadores de sessão e visitante e o tratamento de erros.
- **MSW** intercepta REST e WebSocket. A API simulada mantém um único modelo de catálogo, carrinho, conta e pedido para o uso local, a demo e o Playwright.
- **Tailwind CSS** fornece a base de estilo e utilitários. Componentes Button e Dialog seguem a estrutura shadcn/ui, com variantes CVA, Slot e Dialog do Radix.

## REST

A API padrão usa o prefixo `/api`. Requisições autenticadas levam `Authorization: Bearer <token>`. O cabeçalho `X-Guest-Id` identifica o carrinho visitante. As respostas de erro usam `{ code, message, fields? }`, com `fields` indexado pelo nome de cada campo.

| Método e rota | Entrada e resposta |
| --- | --- |
| `GET /session` | Perfil da sessão ou `null` para visitante. |
| `POST /register` | Nome, e-mail, telefone opcional e senha. Retorna perfil e token. |
| `POST /login` · `POST /logout` | Login recebe e-mail e senha, devolve perfil e token. Logout revoga a sessão atual. |
| `GET /nfts` | `q`, `category` repetível, `min`, `max`, `sort`, `feed` e `page`. Retorna obras, destaques, contagens e paginação. |
| `GET /nfts/:id` | Galeria, dados da obra, edições, preço e estoque. |
| `GET /favorites` · `POST /favorites/:id` · `DELETE /favorites/:id` | Lista e modifica os IDs de NFTs favoritos do usuário. |
| `GET /cart` · `POST /cart/items` · `DELETE /cart/items/:nftId/:editionId` | Consulta, adiciona, altera e remove quantidades por NFT e edição. A inclusão aceita `mode: add\|set`. |
| `PATCH /cart/coupon` | Recebe `{ code }`. O código vazio remove o cupom. Retorna o carrinho atualizado. |
| `GET /quote?network=Ethereum` | Retorna identificador da cotação, linhas, disponibilidade, subtotal, desconto, taxa, total e conflitos. |
| `GET /profile` · `PATCH /profile` | Consulta e edita nome, e-mail, telefone e avatar. |
| `PATCH /profile/password` | Recebe senha atual e nova senha. |
| `GET /wallets` · `POST /wallets` | Consulta e cadastra ou edita por tipo, com rótulo e endereço hexadecimal. |
| `POST /wallets/:id/connect` · `DELETE /wallets/connection` | Autoriza ou recusa a conexão simulada da carteira e rede, ou encerra a conexão. |
| `POST /orders` | Recebe cotação, carteira, rede e dados do colecionador. Exige `Idempotency-Key`. |
| `GET /orders/:id` | Retorna estado e snapshot do pedido do titular. |
| `GET /__demo` · `POST /__demo` | Consulta cenário e executa ações do simulador. Disponível no MSW. |

Validações retornam 422. Sessões expiradas retornam 401. A falta de permissão retorna 403. Recursos ausentes ou pedidos de terceiros retornam 404. Conflitos de cadastro, cotação, estoque e idempotência retornam 409. O painel oferece falhas de conexão e HTTP 503.

## Sessão e cache

A sessão simulada dura quatro horas. Identificadores opacos persistem localmente para sobreviver a recarregamentos. As senhas de demonstração são verificadas por PBKDF2 com salt e persistidas como hash. Os dados privados no cache são separados por usuário e sessão, cancelados e descartados ao trocar de conta. O socket de uma sessão antiga é desmontado quando o escopo muda. Rascunhos de checkout são separados por usuário na sessão do navegador.

O cache remoto fica fresco por 25 segundos por padrão. A consulta cancela chamadas abandonadas pelo sinal de Axios e permite uma nova tentativa para falhas transitórias. Mutações exigem ação do usuário para tentar novamente. Favoritos usam atualização otimista com snapshot para reversão. Catálogo e detalhe usam chaves independentes dos dados privados.

## Carrinho, cotação e pedido

O carrinho visitante é mesclado após o login, respeitando o limite de estoque. Valores em ETH são strings decimais no contrato. Cálculos usam BigInt em wei, com truncamento do desconto na precisão mínima de wei. O carrinho depende da cotação REST para disponibilidade, descontos e totais.

A revisão consulta a cotação atual. O envio verifica novamente a cotação e a conexão da carteira no simulador. A tentativa, com chave e conteúdo, é salva antes do envio. Uma repetição idêntica devolve o pedido existente, inclusive após timeout ou recarregamento. Conteúdo diferente com a mesma chave gera 409. Pedidos confirmados e recusados são terminais. O snapshot do pedido preserva linhas e valores, e o simulador só desconta as quantidades compradas do carrinho após confirmar.

## Socket.IO

O navegador usa `socket.io-client` sobre WebSocket. O MSW intercepta a conexão e `@mswjs/socket.io-binding` implementa o enquadramento Socket.IO e a abertura da sessão Engine.IO. O mock usa o namespace padrão, eventos em texto e heartbeat local. A aplicação carrega o cliente Socket.IO depois de iniciar o MSW, pois o Engine.IO captura o construtor de WebSocket ao carregar o módulo.

| Evento | Conteúdo e efeito |
| --- | --- |
| `nft.updated` | `id`, `resourceId` e `version`. Invalida catálogo, detalhe e cotação, com feedback quando a obra está no carrinho. |
| `order.updated` | Identidade, recurso, versão e `userId`. Vai apenas às sessões ativas do titular e invalida pedido, carrinho e cotação. |

O cliente descarta IDs repetidos e versões inferiores, e reconcilia consultas ativas com REST ao conectar ou reconectar. A consulta periódica do pedido pendente também permite recuperação durante interrupções. O simulador atualiza seu estado antes de publicar cada evento.

## Decisões e limites

- Os retratos do catálogo são recriações geradas para o desafio. A visualização pública do Figma permitiu examinar o layout, com exportação de assets indisponível na sessão consultada. As imagens são WebP locais, e a tipografia usa IBM Plex Mono local.
- Filtros móveis e menus usam drawers com gerenciamento de foco. Estados de vazio, rede, revisão e conflito seguem a mesma paleta do projeto. A faixa de preço aceita limites decimais por campo.
- Cada navegador tem uma base de demonstração local. Transações, endereços e recibos são fictícios. A persistência de múltiplas abas compartilha dados via armazenamento local, com sincronização de eventos concentrada na aba que executa o simulador.
- A demonstração requer um contexto seguro para service worker e Web Crypto, como localhost ou HTTPS. O deploy serve o build Vite e usa fallback para acesso direto às rotas.
