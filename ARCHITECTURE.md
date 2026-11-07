# Arquitetura — Kurio NFT Marketplace

Implementação do [desafio frontend da Jungle Gaming](https://github.com/junglegaming/frontend-challenge).

**Versão**: 1.0  
**Última atualização**: 2026-11-07

## Visão Geral

Aplicação React SPA construída com TypeScript, simulando um marketplace de NFTs com descoberta, compra e gerenciamento de conta. Toda a comunicação backend é simulada via MSW (Mock Service Worker) com suporte a Socket.IO para atualizações em tempo real.

### Stack Tecnológica

| Responsabilidade | Tecnologia | Versão | Uso Efetivo |
|------------------|------------|--------|-------------|
| Interface | React | 19.3.1 | Componentes funcionais, hooks |
| Linguagem | TypeScript | 6.0.3 | 100% tipado, strict mode |
| Roteamento | TanStack Router | 1.170.46 | Todas as rotas, search params, guards |
| Estado Remoto | TanStack Query | 5.107.1 | Todas as queries e mutations |
| HTTP | Axios | 1.21.0 | Cliente configurado, interceptors |
| Tempo Real | Socket.IO | 4.8.4 | Eventos nft.updated, order.updated |
| Estilização | Tailwind CSS | 4.3.5 | Utility-first, custom tokens |
| Componentes | shadcn/ui | - | Dialog, Button (Radix UI) |
| Mocking | MSW | 2.15.0 | REST + Socket.IO, 11 cenários |
| Testes E2E | Playwright | 1.65.0 | Desktop + Mobile viewports |
| Auditoria | Lighthouse | 13.6.0 | Performance e acessibilidade |

## Arquitetura de Dados

### Camadas

```
┌─────────────────────────────────────────────────┐
│              Componentes React                  │
│  (features/, components/, UI state)             │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           TanStack Query Layer                  │
│  (queryClient, hooks, cache, invalidation)      │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│  Axios HTTP  │  │  Socket.IO    │
│   (api.ts)   │  │ (realtime.tsx)│
└───────┬──────┘  └──────┬────────┘
        │                 │
        └────────┬────────┘
                 │
┌────────────────▼────────────────────────────────┐
│                   MSW Layer                     │
│  (handlers.ts, store.ts, fixtures.ts)           │
│      REST Endpoints + Socket.IO Events          │
└─────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Leitura**: Componente → TanStack Query hook → Axios → MSW handler → Resposta simulada
2. **Escrita**: Componente → Mutation hook → Axios POST/PUT/DELETE → MSW handler → TanStack Query invalidation
3. **Tempo Real**: MSW Socket.IO binding → Socket.IO client → Event handler → TanStack Query invalidation → Componente re-render

## Contratos REST API

Base URL: `/api` (interceptado pelo MSW)

### Autenticação e Sessão

#### `POST /api/auth/register`
Cria nova conta de colecionador.

**Request**:
```typescript
{
  name: string      // 2-50 caracteres
  email: string     // formato válido
  password: string  // mínimo 8 caracteres, 1 maiúscula, 1 número
}
```

**Response 201**:
```typescript
{
  user: Collector
  token: string
}
```

**Errors**: `409` (email já existe), `400` (validação)

#### `POST /api/auth/login`
Autentica usuário existente.

**Request**:
```typescript
{
  email: string
  password: string
}
```

**Response 200**:
```typescript
{
  user: Collector
  token: string
}
```

**Errors**: `401` (credenciais inválidas), `400` (validação)

#### `GET /api/auth/session`
Retorna sessão atual (requer autenticação).

**Headers**: `Authorization: Bearer <token>`

**Response 200**:
```typescript
{
  user: Collector
}
```

**Errors**: `401` (token inválido ou expirado)

#### `POST /api/auth/logout`
Invalida token atual (simulado).

**Response 204**: No content

### Catálogo de NFTs

#### `GET /api/nfts`
Lista NFTs com busca, filtros, ordenação e paginação.

**Query Params**:
```typescript
{
  q?: string              // busca em title/creator/description
  categories?: string[]   // filtro por categorias (combináveis)
  min?: string           // preço mínimo em ETH
  max?: string           // preço máximo em ETH
  sort?: 'recent' | 'price-asc' | 'price-desc' | 'popular'
  feed?: 'all' | 'new' | 'trending'
  page?: number          // padrão 1, itens por página: 12
}
```

**Response 200**:
```typescript
{
  items: Nft[]
  featured: Nft[]        // destaques (não paginados)
  facets: Record<string, number>  // contagem por categoria
  total: number          // total de itens matching
  pages: number          // total de páginas
}
```

#### `GET /api/nfts/:id`
Retorna detalhes de um NFT específico.

**Response 200**:
```typescript
{
  nft: Nft
}
```

**Errors**: `404` (NFT não encontrado)

### Favoritos

#### `GET /api/favorites`
Lista IDs dos NFTs favoritados pelo usuário (requer autenticação).

**Response 200**:
```typescript
{
  nftIds: string[]
}
```

#### `POST /api/favorites/:nftId`
Adiciona NFT aos favoritos.

**Response 200**:
```typescript
{
  nftIds: string[]
}
```

#### `DELETE /api/favorites/:nftId`
Remove NFT dos favoritos.

**Response 200**:
```typescript
{
  nftIds: string[]
}
```

### Carrinho

#### `GET /api/cart`
Retorna carrinho atual (usa localStorage para visitantes, sessão para autenticados).

**Response 200**:
```typescript
{
  items: CartItem[]
  coupon: string
  count: number
}
```

#### `POST /api/cart`
Adiciona item ao carrinho.

**Request**:
```typescript
{
  nftId: string
  editionId: string
  quantity: number
}
```

**Response 200**:
```typescript
{
  cart: Cart
}
```

#### `PATCH /api/cart/:nftId/:editionId`
Atualiza quantidade de item.

**Request**:
```typescript
{
  quantity: number
}
```

**Response 200**:
```typescript
{
  cart: Cart
}
```

#### `DELETE /api/cart/:nftId/:editionId`
Remove item do carrinho.

**Response 200**:
```typescript
{
  cart: Cart
}
```

#### `POST /api/cart/coupon`
Aplica cupom de desconto.

**Request**:
```typescript
{
  code: string
}
```

**Response 200**:
```typescript
{
  cart: Cart
}
```

**Errors**: `400` (cupom inválido ou expirado)

#### `DELETE /api/cart/coupon`
Remove cupom aplicado.

**Response 200**:
```typescript
{
  cart: Cart
}
```

### Cotação e Pedidos

#### `POST /api/quote`
Valida carrinho e calcula valores finais.

**Request**:
```typescript
{
  items: CartItem[]
  coupon: string
  network: Network
}
```

**Response 200**:
```typescript
{
  quote: Quote  // inclui subtotal, desconto, taxa, total, issues
}
```

**Errors**: `400` (itens indisponíveis, cupom inválido)

#### `POST /api/orders`
Cria pedido (idempotente via `X-Idempotency-Key`).

**Headers**:
```
Authorization: Bearer <token>
X-Idempotency-Key: <uuid>
```

**Request**:
```typescript
{
  quoteId: string
  walletId: string
  network: Network
  collector: CheckoutDetails
}
```

**Response 201**:
```typescript
{
  order: Order  // status: 'pending'
}
```

**Response 200** (idempotency hit):
```typescript
{
  order: Order  // mesmo pedido, estado atual
}
```

**Errors**: `409` (chave reutilizada com payload diferente), `400` (validação), `402` (preço/disponibilidade mudou)

#### `GET /api/orders/:id`
Consulta estado de um pedido.

**Response 200**:
```typescript
{
  order: Order  // status: 'pending' | 'confirmed' | 'declined'
}
```

### Perfil e Carteiras

#### `GET /api/profile`
Retorna perfil do usuário autenticado.

**Response 200**:
```typescript
{
  user: Collector
}
```

#### `PATCH /api/profile`
Atualiza dados do perfil.

**Request** (todos opcionais):
```typescript
{
  name?: string
  phone?: string
  avatar?: string  // URL ou data URI
}
```

**Response 200**:
```typescript
{
  user: Collector
}
```

#### `POST /api/profile/password`
Altera senha.

**Request**:
```typescript
{
  currentPassword: string
  newPassword: string
}
```

**Response 204**: No content

**Errors**: `401` (senha atual incorreta)

#### `GET /api/wallets`
Lista carteiras cadastradas.

**Response 200**:
```typescript
{
  wallets: Wallet[]
}
```

#### `POST /api/wallets`
Cadastra nova carteira.

**Request**:
```typescript
{
  label: string
  address: string  // formato 0x...
  kind: 'primary' | 'secondary'
}
```

**Response 201**:
```typescript
{
  wallet: Wallet
}
```

#### `PATCH /api/wallets/:id`
Atualiza carteira existente.

**Request** (todos opcionais):
```typescript
{
  label?: string
  address?: string
  kind?: 'primary' | 'secondary'
}
```

**Response 200**:
```typescript
{
  wallet: Wallet
}
```

## Eventos Socket.IO

Namespace: `/` (raiz)

### Client → Server

#### `subscribe`
Cliente se inscreve em atualizações de NFTs e pedidos.

```typescript
socket.emit('subscribe', { nftIds: string[], orderIds: string[] })
```

### Server → Client

#### `nft.updated`
NFT teve preço ou disponibilidade alterados.

```typescript
{
  id: string           // ID do evento (para deduplicação)
  resourceId: string   // ID do NFT
  version: number      // versão monotônica crescente
  nft: Nft            // estado completo atualizado
}
```

**Efeito esperado**:
- Atualizar cache TanStack Query para queries de catálogo e detalhe
- Se NFT está no carrinho, atualizar cotação e notificar usuário
- Cliente descarta eventos com version ≤ versão já conhecida

#### `order.updated`
Pedido mudou de estado (pending → confirmed/declined).

```typescript
{
  id: string           // ID do evento
  resourceId: string   // ID do pedido
  version: number      // versão monotônica crescente
  userId: string       // ID do usuário dono do pedido
  order: Order        // estado completo atualizado
}
```

**Efeito esperado**:
- Cliente verifica se userId corresponde ao usuário logado (isolamento)
- Atualizar cache TanStack Query para query do pedido
- Se order.status === 'confirmed', mostrar confirmação e limpar carrinho
- Se order.status === 'declined', mostrar erro e preservar itens no carrinho
- Cliente descarta eventos com version ≤ versão já conhecida ou userId diferente

### Reconciliação REST + Socket.IO

1. **Após reconexão**: Cliente re-fetcha recursos ativos (NFTs visíveis, pedido pendente)
2. **Deduplicação**: Eventos usam `id` único; cliente mantém Set de IDs processados
3. **Ordenação temporal**: Campo `version` garante que estado mais recente prevalece
4. **Isolamento**: Eventos `order.updated` só afetam o usuário correto (verificação de userId)

## Gerenciamento de Estado

### TanStack Query

#### Configuração

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s: considerar dados frescos
      gcTime: 5 * 60_000,       // 5min: garbage collection
      retry: 2,                 // 2 retentativas em falhas
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,  // mutations não retentam automaticamente
    },
  },
})
```

#### Query Keys

| Query | Key | Invalidação |
|-------|-----|-------------|
| Sessão | `['session']` | Logout, login, register |
| Catálogo | `['nfts', search]` | Socket.IO nft.updated |
| NFT Detail | `['nft', nftId]` | Socket.IO nft.updated |
| Favoritos | `['favorites']` | Mutation favorites, logout |
| Carrinho | `['cart']` | Mutations carrinho, Socket.IO nft.updated |
| Cotação | `['quote', items, coupon, network]` | Mutation carrinho, Socket.IO nft.updated |
| Pedido | `['order', orderId]` | Socket.IO order.updated |
| Perfil | `['profile']` | Mutation profile, logout |
| Carteiras | `['wallets']` | Mutation wallets, logout |

#### Atualização Otimista

**Favoritos**: Toggle de favorito atualiza UI imediatamente, com rollback em caso de falha.

```typescript
onMutate: async (nftId) => {
  await queryClient.cancelQueries({ queryKey: ['favorites'] })
  const previous = queryClient.getQueryData(['favorites'])
  queryClient.setQueryData(['favorites'], (old) => toggleFavorite(old, nftId))
  return { previous }
}
onError: (err, nftId, context) => {
  queryClient.setQueryData(['favorites'], context.previous)
}
```

### Sessão e Autenticação

- **Storage**: Token JWT armazenado em `localStorage.getItem('kurio.session')`
- **Interceptor Axios**: Adiciona `Authorization: Bearer <token>` automaticamente
- **Expiração**: Servidor retorna `401` com código `SESSION_EXPIRED`, cliente redireciona para login
- **Proteção de rotas**: `beforeLoad` do TanStack Router verifica token e busca sessão
- **Logout**: Limpa token, invalida todas as queries privadas, desconecta Socket.IO

### Carrinho

- **Visitante**: Itens em `localStorage.getItem('kurio.cart')`, apenas estrutura básica
- **Autenticado**: Merge de localStorage com sessão do servidor no primeiro login
- **Persistência**: Sobrevive a refresh via localStorage (visitante) ou API (autenticado)
- **Sincronização**: Após mutation, re-fetch para garantir consistência com servidor
- **Preço em tempo real**: Socket.IO nft.updated invalida query `['quote']`, forçando recálculo

## Mocking com MSW

### Arquitetura

```
src/mocks/
├── browser.ts     # Worker setup, inicialização
├── fixtures.ts    # Dados de demonstração (27 NFTs, 2 users)
├── handlers.ts    # REST handlers + Socket.IO binding
└── store.ts       # Estado em memória, persistência opcional
```

### Estado Simulado

- **Usuários**: 2 contas (alice, bruno) com senha `Kurio2026!`
- **NFTs**: 27 itens com preços, edições, estoque
- **Persistência**: `localStorage` para manter estado entre refreshes
- **Reset**: Endpoint `POST /api/__demo` com `{ type: 'reset' }` restaura fixtures

### Cenários Disponíveis

Seleção via `POST /api/__demo` ou UI de cenários no rodapé:

| Cenário | Comportamento |
|---------|---------------|
| `default` | Comportamento normal, latência ~100-300ms |
| `empty` | Catálogo vazio (0 NFTs) |
| `slow` | Latência 2000-4000ms em todas as requisições |
| `race` | Respostas fora de ordem (delay aleatório) |
| `offline` | Falha de conexão (network error) |
| `httpError` | Todas as requisições retornam HTTP 503 |
| `expired` | Sessão expira em qualquer requisição autenticada |
| `favoriteFailure` | Mutation de favoritos sempre falha (HTTP 500) |
| `timeout` | Pedido criado, mas resposta demora 5s (simula timeout com recovery) |
| `declined` | Pagamento sempre recusado |
| `pending` | Pedido fica pendente indefinidamente (sem transição) |

### Socket.IO Mocking

Usa `@mswjs/socket.io-binding` para interceptar `socket.io-client`:

```typescript
import { io } from 'socket.io-client'
import { bindSocketIOServer } from '@mswjs/socket.io-binding'

const server = bindSocketIOServer(io)
server.on('connection', (socket) => {
  // Emitir eventos para simular atualizações
  socket.on('subscribe', ({ nftIds }) => {
    // Cliente se inscreveu
  })
})
```

**Ações de demonstração**:
- `{ type: 'price', nftId? }`: Altera preço de um NFT específico ou aleatório
- `{ type: 'stock', nftId? }`: Altera disponibilidade de um NFT
- `{ type: 'duplicate' }`: Envia evento duplicado (para testar deduplicação)
- `{ type: 'older' }`: Envia evento com version antiga (para testar ordenação)
- `{ type: 'disconnect' }`: Desconecta Socket.IO forçadamente
- `{ type: 'finish' }`: Completa pedido pendente (pending → confirmed/declined)

### Limitações do Mock

- **Autenticação**: JWT não é validado criptograficamente, apenas presença
- **Idempotência**: Implementada em memória, perde estado em refresh completo
- **Carteira blockchain**: Conexão simulada com delay de 1s, sempre bem-sucedida (ou rejeitada em cenário específico)
- **Eventos Socket.IO**: Enviados sob demanda via ações de demo, não baseados em triggers reais
- **Concorrência**: Não há transações ACID; race conditions podem ocorrer em testes paralelos

## Decisões de Implementação

### Responsividade

#### Viewports Testados

| Largura | Dispositivo de Referência | Breakpoint Tailwind | Notas |
|---------|---------------------------|---------------------|-------|
| 390px | iPhone 12/13/14 | `sm:` (640px) não ativo | Figma mobile é 414px; 390px requer ajustes manuais |
| 414px | Figma Mobile | `sm:` não ativo | Referência exata do design |
| 768px | iPad Mini | `md:` (768px) ativo | Sem frame Figma específico; comportamento híbrido |
| 1440px | Figma Desktop | `xl:` (1280px) ativo | Referência exata do design |

#### Estratégia de Adaptação

- **390px → 414px**: Grid mobile mantém 2 colunas, reduz padding horizontal de 24px para 20px
- **768px (tablet)**: Mantém layout desktop com ajuste de grid para 2 colunas em vez de 3
- **414px vs 390px**: Implementação documenta que 414px é referência primária; 390px é ajuste posterior

#### Telas Sem Frame Mobile no Figma

As seguintes telas não possuem design mobile específico no Figma:
- **Confirmação de Pedido** (11:4385)
- **Perfil do Colecionador** (9:1238)
- **Carteiras** (9:1670)

**Decisão de Implementação**:
- **Confirmação**: Modal full-screen em mobile, mantém mesma estrutura de informações do desktop
- **Perfil**: Sidebar converte para tabs horizontais em mobile
- **Carteiras**: Formulários empilham verticalmente, mesmos campos e validações

### Tipografia

**Alteração**: Design original especificava **IBM Plex Mono**, mas análise do Figma revelou **Roboto Mono**.

**Decisão**: Implementação utiliza **Roboto Mono** (400, 500, 700) via `@fontsource/roboto-mono` para fidelidade exata ao design fornecido.

### Cores

Tokens extraídos do Figma e mapeados para CSS custom properties. Cores originais da implementação foram substituídas pelos valores exatos do design system.

Ver `src/styles.css` para mapeamento completo.

### Acessibilidade

#### Navegação por Teclado

- Todos os elementos interativos são alcançáveis via Tab
- Ordem de foco segue ordem visual
- `Escape` fecha diálogos e drawers
- `Enter`/`Space` ativam botões

#### ARIA e Semântica

- Diálogos usam `role="dialog"`, `aria-labelledby`, `aria-describedby`
- Formulários têm `<label>` associados via `for` ou wrapping
- Erros de validação vinculados via `aria-describedby`
- Regiões principais marcadas com `<main>`, `<nav>`, `<aside>`
- Atualizações dinâmicas anunciadas via `aria-live="polite"`

#### Contraste

Todas as combinações de texto/background testadas contra WCAG 2.2 Level AA (4.5:1 para texto normal, 3:1 para texto grande).

#### Movimento Reduzido

Skeletons com shimmer effect respeitam `@media (prefers-reduced-motion: reduce)`.

## Performance

### Estratégias de Otimização

- **Code Splitting**: Rotas carregam componentes sob demanda via `React.lazy()` (se aplicável)
- **Image Optimization**: WebP format para assets, lazy loading nativo
- **Query Prefetching**: TanStack Router prefetch em hover de links
- **Cache HTTP**: MSW retorna headers de cache apropriados
- **Bundle Size**: Treeshaking automático do Vite

### Metas Lighthouse

| Categoria | Alvo | Mobile | Desktop |
|-----------|------|--------|---------|
| Performance | ≥90 | TBD | TBD |
| Accessibility | ≥95 | TBD | TBD |
| Best Practices | ≥95 | TBD | TBD |
| SEO | ≥90 | TBD | TBD |

Resultados completos em `lighthouse-reports/` após execução de `npm run audit:lighthouse`.

## Testes

### Playwright E2E

**Viewports**:
- Desktop: 1440 × 900 (Chromium)
- Mobile: 390 × 844 (Chromium, Pixel 7 profile)

**Configuração**: `playwright.config.ts`
- Timeout: 55s por teste
- Workers: 3 paralelos
- Reporter: List + HTML
- Traces: Retidos em falhas

**Cobertura Obrigatória** (12 cenários):
1. ✅ Busca, filtros, ordenação, paginação, histórico
2. ✅ Acesso direto ao detalhe, NFT inexistente
3. ✅ Cadastro, login, expiração, logout, troca de usuário
4. ✅ Favoritos com falha e recuperação
5. ✅ Carrinho: quantidades, remoção, cupom, persistência
6. ✅ Compra completa até recibo confirmado
7. ✅ Falha de pagamento, cliques repetidos, timeout com recovery
8. ✅ Edição de perfil, avatar, senha, carteiras com validação
9. ✅ Alteração de preço/disponibilidade via Socket.IO durante checkout
10. ✅ Eventos duplicados/antigos, desconexão, retomada de pendente
11. ✅ Navegação por teclado, foco de diálogos, validação
12. ✅ Skeletons, feedback de falha, retry

**Execução**: `npm test`

**Regressão Visual**: Baselines em `tests/baselines/{desktop,mobile}/`

## Limitações Conhecidas

1. **Mock Socket.IO**: Eventos são disparados manualmente via ações de demonstração; não há simulação de delay de rede realista
2. **Idempotência**: Chaves de idempotência perdem estado em refresh completo (somente em memória)
3. **Paginação**: Limitada a 12 itens por página; não configurável
4. **Upload de Avatar**: Aceita data URIs, mas não há armazenamento persistente real
5. **Validação de Endereço de Carteira**: Apenas verifica formato `0x...`, não valida checksum Ethereum
6. **ETH Precision**: Usa strings decimais, mas interface não suporta mais de 18 casas decimais
7. **Internacionalização**: Apenas português (pt-BR), textos hardcoded

## Próximos Passos (Fora do Escopo)

- Integração com backend real (REST + WebSocket)
- Autenticação OAuth (Google, Facebook)
- Conexão com carteiras reais (MetaMask, Coinbase Wallet)
- Upload de imagens para CDN
- Suporte multilíngue (i18n)
- Testes de integração com API real
- Monitoramento e analytics
- CI/CD pipeline completo

## Referências

- [Desafio Oficial](https://github.com/junglegaming/frontend-challenge)
- [Figma Design](https://www.figma.com/design/CeU18pBkD6qZT9nJvCm4qn/Frontend-Challenge--Copy-)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [MSW Docs](https://mswjs.io)
- [Socket.IO Docs](https://socket.io)
- [Playwright Docs](https://playwright.dev)
- [Lighthouse Docs](https://developer.chrome.com/docs/lighthouse)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
