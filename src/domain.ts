export const categories = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Colecionáveis', 'Generativa', 'Jogos', 'Assinaturas', 'Utilidade'] as const
export const networks = ['Ethereum', 'Polygon', 'Arbitrum'] as const
export const sorts = ['recent', 'price-asc', 'price-desc', 'popular'] as const
export const feeds = ['all', 'new', 'trending'] as const

export type Network = typeof networks[number]
export type Sort = typeof sorts[number]
export type Feed = typeof feeds[number]
export type Eth = string
export type NftEdition = { id: string; name: string; price: Eth; stock: number }
export type Nft = {
  id: string
  title: string
  creator: string
  category: string
  description: string
  image: string
  gallery: string[]
  editions: NftEdition[]
  popularity: number
  listedAt: number
  version: number
}

export type CatalogSearch = {
  q: string
  categories: string[]
  min: string
  max: string
  sort: Sort
  feed: Feed
  page: number
}
export type Catalog = {
  items: Nft[]
  featured: Nft[]
  facets: Record<string, number>
  total: number
  pages: number
}

export type CartItem = { nftId: string; editionId: string; quantity: number }
export type CartLine = CartItem & {
  title: string
  edition: string
  image: string
  unit: Eth
  amount: Eth
  available: number
  version: number
}
export type Cart = { items: CartItem[]; coupon: string; count: number }
export type Quote = {
  id: string
  items: CartLine[]
  subtotal: Eth
  discount: Eth
  fee: Eth
  total: Eth
  coupon: string
  network: Network
  issues: string[]
}
export type Collector = { id: string; name: string; email: string; avatar: string; phone: string }
export type Session = { user: Collector; token: string }
export type Wallet = { id: string; label: string; address: string; kind: 'primary' | 'secondary' }
export type CheckoutDetails = { name: string; email: string; phone: string }
export type OrderInput = {
  quoteId: string
  walletId: string
  network: Network
  collector: CheckoutDetails
}
export type OrderStatus = 'pending' | 'confirmed' | 'declined'
export type Order = {
  id: string
  status: OrderStatus
  quote: Quote
  collector: CheckoutDetails
  wallet: Wallet
  transaction: string | null
  createdAt: number
  version: number
  reason?: string
}
export type VersionedEvent = { id: string; resourceId: string; version: number }
export type OrderEvent = VersionedEvent & { userId: string }
export type ApiError = { code: string; message: string; fields?: Record<string, string> }

export const scenarios = {
  default: 'Padrão',
  empty: 'Catálogo vazio',
  slow: 'Carregamento lento',
  race: 'Respostas fora de ordem',
  offline: 'Falha de conexão',
  httpError: 'Falha HTTP 503',
  expired: 'Sessão expirada',
  favoriteFailure: 'Falha ao favoritar',
  timeout: 'Timeout após criar pedido',
  declined: 'Pagamento recusado',
  pending: 'Pedido pendente prolongado',
} as const
export type Scenario = keyof typeof scenarios
export type DemoAction =
  | { type: 'scenario'; scenario: Scenario }
  | { type: 'reset' }
  | { type: 'price' | 'stock'; nftId?: string }
  | { type: 'duplicate' | 'older' | 'disconnect' | 'finish' }

const wei = 10n ** 18n

export function parseEth(value: Eth): bigint {
  if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error('Valor em ETH inválido.')
  const [integer, decimal = ''] = value.split('.')
  return BigInt(integer) * wei + BigInt(decimal.padEnd(18, '0'))
}

export function toEth(value: bigint): Eth {
  const decimal = (value % wei).toString().padStart(18, '0').replace(/0+$/, '')
  return decimal ? `${value / wei}.${decimal}` : (value / wei).toString()
}

export function formatEth(value: Eth) {
  const [whole, fraction = ''] = value.split('.')
  return `${whole},${fraction.padEnd(2, '0')} ETH`
}

export function cartKey(item: CartItem) {
  return `${item.nftId}:${item.editionId}`
}

export const defaultSearch: CatalogSearch = { q: '', categories: [], min: '', max: '', sort: 'recent', feed: 'all', page: 1 }
