import { cartKey, parseEth, toEth } from '../domain'
import type {
  Cart,
  CartItem,
  Collector,
  Network,
  Nft,
  Order,
  Quote,
  Scenario,
  Wallet,
} from '../domain'
import { demoCredentials, demoNfts, demoUsers, demoWallets } from './fixtures'

type Account = {
  profile: Collector
  salt: string
  passwordHash: string
  wallets: Wallet[]
  favorites: string[]
}
export type StoredOrder = {
  order: Order
  userId: string
  key: string
  fingerprint: string
  dueAt: number
  decline: boolean
}
export type Database = {
  nfts: Nft[]
  accounts: Record<string, Account>
  sessions: Record<
    string,
    { userId: string; expires: number; connection?: { walletId: string; network: Network } }
  >
  carts: Record<string, Cart>
  orders: Record<string, StoredOrder>
  scenario: Scenario
}
const key = 'kurio.mock.db.v1'
const feeByNetwork = { Ethereum: '0.018', Polygon: '0.003', Arbitrum: '0.006' }
export const emptyCart = (): Cart => ({ items: [], coupon: '', count: 0 })

export async function hashPassword(password: string, salt: string) {
  const encoder = new TextEncoder()
  const input = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    input,
    256,
  )
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function resetDatabase(): Promise<Database> {
  const accounts = demoUsers.map((profile) => {
    const credentials = demoCredentials[profile.id]
    const account: Account = {
      profile,
      salt: credentials.salt,
      passwordHash: credentials.passwordHash,
      wallets: demoWallets(profile.id),
      favorites: [],
    }
    return [profile.id, account] as const
  })
  const db: Database = {
    nfts: demoNfts(),
    accounts: Object.fromEntries(accounts),
    sessions: {},
    carts: {},
    orders: {},
    scenario: 'default',
  }
  saveDatabase(db)
  return db
}

export function loadDatabase(): Database {
  const raw = localStorage.getItem(key)
  if (!raw) throw new Error('A base simulada precisa ser inicializada.')
  return JSON.parse(raw) as Database
}

export function saveDatabase(db: Database) {
  localStorage.setItem(key, JSON.stringify(db))
}

export async function startDatabase() {
  if (!localStorage.getItem(key)) await resetDatabase()
}

export function readCart(db: Database, owner: string) {
  return db.carts[owner] ?? emptyCart()
}

export function writeCart(db: Database, owner: string, items: CartItem[], coupon: string) {
  db.carts[owner] = { items, coupon, count: items.reduce((sum, item) => sum + item.quantity, 0) }
  return db.carts[owner]
}

export function findEdition(db: Database, nftId: string, editionId: string) {
  const nft = db.nfts.find((item) => item.id === nftId)
  const edition = nft?.editions.find((item) => item.id === editionId)
  return nft && edition ? { nft, edition } : undefined
}

export function mergeGuestCart(db: Database, userId: string, guest: string) {
  if (!guest || !db.carts[guest]) return
  const previous = readCart(db, userId)
  const guestCart = readCart(db, guest)
  const merged = new Map(previous.items.map((item) => [cartKey(item), item]))
  for (const item of guestCart.items) {
    const id = cartKey(item)
    const existing = merged.get(id)
    const stock = findEdition(db, item.nftId, item.editionId)?.edition.stock ?? 0
    const quantity = Math.max(
      existing?.quantity ?? 0,
      Math.min(stock, (existing?.quantity ?? 0) + item.quantity),
    )
    if (quantity) merged.set(id, { ...item, quantity })
  }
  writeCart(db, userId, [...merged.values()], previous.coupon || guestCart.coupon)
  delete db.carts[guest]
}

export function couponError(code: string) {
  if (!code || code === 'KURIO10') return ''
  return code === 'EXPIRADO' ? 'Este cupom expirou.' : 'Cupom inválido.'
}

export function getQuote(db: Database, owner: string, network: Network): Quote {
  const cart = readCart(db, owner)
  const issues: string[] = []
  let subtotal = 0n
  const items = cart.items.flatMap((item) => {
    const result = findEdition(db, item.nftId, item.editionId)
    if (!result) {
      issues.push('Uma obra no carrinho deixou de estar disponível.')
      return []
    }
    const { nft, edition } = result
    if (edition.stock < item.quantity)
      issues.push(`Disponibilidade alterada para ${nft.title}. Restam ${edition.stock}.`)
    const amount = parseEth(edition.price) * BigInt(item.quantity)
    subtotal += amount
    return [
      {
        ...item,
        title: nft.title,
        image: nft.image,
        edition: edition.name,
        unit: edition.price,
        amount: toEth(amount),
        available: edition.stock,
        version: nft.version,
      },
    ]
  })
  const invalidCoupon = couponError(cart.coupon)
  if (invalidCoupon) issues.push(invalidCoupon)
  const discount = cart.coupon === 'KURIO10' ? subtotal / 10n : 0n
  const fee = items.length ? parseEth(feeByNetwork[network]) : 0n
  const signature = JSON.stringify([
    network,
    cart.coupon,
    items.map((item) => [cartKey(item), item.quantity, item.version, item.unit, item.available]),
    fee.toString(),
    issues,
  ])
  return {
    id: signature,
    items,
    subtotal: toEth(subtotal),
    discount: toEth(discount),
    fee: toEth(fee),
    total: toEth(subtotal - discount + fee),
    coupon: cart.coupon,
    network,
    issues,
  }
}

export function resolveDueOrders(db: Database, now: number) {
  const completed: StoredOrder[] = []
  const updated = new Set<Nft>()
  for (const entry of Object.values(db.orders)) {
    const { order, userId } = entry
    if (order.status !== 'pending' || entry.dueAt > now) continue
    const outOfStock = order.quote.items.some(
      (item) => (findEdition(db, item.nftId, item.editionId)?.edition.stock ?? 0) < item.quantity,
    )
    order.version += 1
    if (entry.decline || outOfStock) {
      order.status = 'declined'
      order.reason = outOfStock
        ? 'Uma edição esgotou antes da confirmação.'
        : 'O pagamento foi recusado pela carteira simulada.'
    } else {
      order.status = 'confirmed'
      order.transaction =
        '0x' + crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
      const cart = readCart(db, userId)
      const purchased = new Map(order.quote.items.map((item) => [cartKey(item), item.quantity]))
      const remaining = cart.items.flatMap((item) => {
        const quantity = item.quantity - (purchased.get(cartKey(item)) ?? 0)
        return quantity > 0 ? [{ ...item, quantity }] : []
      })
      writeCart(db, userId, remaining, remaining.length ? cart.coupon : '')
      for (const item of order.quote.items) {
        const result = findEdition(db, item.nftId, item.editionId)
        if (!result) continue
        result.edition.stock -= item.quantity
        result.nft.version += 1
        updated.add(result.nft)
      }
    }
    completed.push(entry)
  }
  return { completed, updated }
}
