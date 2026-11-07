import { delay, http, HttpResponse, ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { cartKey, categories, networks, parseEth, scenarios, toEth } from '../domain'
import type { ApiError, CartItem, CheckoutDetails, DemoAction, Network, OrderEvent, OrderInput, VersionedEvent, Wallet } from '../domain'
import { couponError, findEdition, getQuote, hashPassword, loadDatabase, mergeGuestCart, readCart, resetDatabase, resolveDueOrders, saveDatabase, writeCart } from './store'
import type { Database, StoredOrder } from './store'

const root = '/api'
const socket = ws.link(location.origin.replace(/^http/, 'ws') + '/')
type SocketClient = ReturnType<typeof toSocketIo>['client']
const clients = new Map<SocketClient, { token: string; close: () => void }>()
let unavailableUntil = 0
let latestNft: VersionedEvent | undefined
let latestOrder: OrderEvent | undefined
let timer: number | undefined

function activeSession(db: Database, token: string) {
  const session = db.sessions[token]
  return session && session.expires > Date.now() ? session : undefined
}

function publishNft(resourceId: string, version: number) {
  latestNft = { id: `nft:${resourceId}:${version}`, resourceId, version }
  for (const client of clients.keys()) client.emit('nft.updated', latestNft)
}

function publishOrder(entry: StoredOrder) {
  const { id: resourceId, version } = entry.order
  latestOrder = { id: `order:${resourceId}:${version}`, resourceId, version, userId: entry.userId }
  const db = loadDatabase()
  for (const [client, { token }] of clients) {
    if (activeSession(db, token)?.userId === entry.userId) client.emit('order.updated', latestOrder)
  }
}

function advanceOrders() {
  clearTimeout(timer)
  const db = loadDatabase()
  const { completed, updated } = resolveDueOrders(db, Date.now())
  if (completed.length) saveDatabase(db)
  for (const nft of updated) publishNft(nft.id, nft.version)
  for (const entry of completed) publishOrder(entry)
  const due = Math.min(...Object.values(db.orders).filter(({ order }) => order.status === 'pending').map((entry) => entry.dueAt))
  if (Number.isFinite(due)) timer = window.setTimeout(advanceOrders, Math.max(0, due - Date.now()))
}

export function resumeOrders() {
  advanceOrders()
}

function error(status: number, code: string, message: string, fields?: Record<string, string>) {
  return HttpResponse.json<ApiError>({ code, message, fields }, { status })
}

function sessionFor(db: Database, request: Request) {
  return activeSession(db, request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '')
}

function guestFor(request: Request) {
  return 'guest:' + (request.headers.get('x-guest-id') ?? 'anonymous')
}

function ownerFor(db: Database, request: Request) {
  return sessionFor(db, request)?.userId ?? guestFor(request)
}

function validProfile(data: CheckoutDetails) {
  const fields: Record<string, string> = {}
  if (!data.name || data.name.trim().length < 2) fields.name = 'Digite seu nome completo.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? '')) fields.email = 'Digite um e-mail válido.'
  if (data.phone && !/^\+?[\d\s()-]{8,22}$/.test(data.phone)) fields.phone = 'Digite um telefone válido.'
  return fields
}

function openSession(db: Database, userId: string, request: Request) {
  const token = crypto.randomUUID()
  const previous = request.headers.get('authorization')?.replace(/^Bearer /, '')
  if (previous) delete db.sessions[previous]
  db.sessions[token] = { userId, expires: Date.now() + 4 * 60 * 60 * 1000 }
  mergeGuestCart(db, userId, guestFor(request))
  saveDatabase(db)
  return HttpResponse.json({ user: db.accounts[userId].profile, token })
}

type Handler = (args: { request: Request; params: Record<string, string | readonly string[] | undefined>; db: Database; owner: string }) => Response | Promise<Response>
type Method = 'get' | 'post' | 'patch' | 'delete'
function route(method: Method, path: string, handler: Handler, options: { private?: boolean; publicAuth?: boolean } = {}) {
  return http[method](root + path, async ({ request, params }) => {
    const scenario = loadDatabase().scenario
    const q = new URL(request.url).searchParams.get('q') ?? ''
    if (scenario === 'slow') await delay(1450)
    if (scenario === 'race' && path === '/nfts') await delay(q.length === 1 ? 1200 : 100)
    if (scenario === 'offline') return HttpResponse.error()
    if (scenario === 'httpError') return error(503, 'UNAVAILABLE', 'O serviço está temporariamente indisponível.')
    advanceOrders()
    const db = loadDatabase()
    if (!options.publicAuth && (options.private || request.headers.has('authorization')) && !sessionFor(db, request)) {
      return error(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
    }
    if (scenario === 'forbidden' && options.private) return error(403, 'FORBIDDEN', 'Esta conta não tem permissão para acessar este recurso.')
    return handler({ request, params, db, owner: ownerFor(db, request) })
  })
}

const required = { private: true }

export const handlers = [
  socket.addEventListener('connection', (connection) => {
    if (!connection.client.url.pathname.startsWith('/socket.io/')) {
      connection.server.connect()
      return
    }
    const { client, rawClient } = toSocketIo(connection)
    const close = () => rawClient.close(1012, 'Reconexão simulada')
    if (Date.now() < unavailableUntil) {
      queueMicrotask(close)
      return
    }
    clients.set(client, { token: rawClient.url.searchParams.get('session') ?? '', close })
    rawClient.addEventListener('close', () => clients.delete(client))
    // The binding opens the namespace. Answer Engine.IO heartbeats in long demos.
    const heartbeat = window.setInterval(() => rawClient.send('2'), 20_000)
    rawClient.addEventListener('close', () => clearInterval(heartbeat))
  }),
  route('get', '/session', ({ db, request }) => {
    const session = sessionFor(db, request)
    return HttpResponse.json(session ? db.accounts[session.userId].profile : null)
  }),
  route('post', '/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }
    const initial = loadDatabase()
    const account = Object.values(initial.accounts).find(({ profile }) => profile.email === email?.trim().toLowerCase())
    if (!account || await hashPassword(password ?? '', account.salt) !== account.passwordHash) {
      return error(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }
    const db = loadDatabase()
    if (db.accounts[account.profile.id]?.passwordHash !== account.passwordHash) return error(409, 'SESSION_CHANGED', 'Tente entrar novamente.')
    return openSession(db, account.profile.id, request)
  }, { publicAuth: true }),
  route('post', '/register', async ({ request }) => {
    const data = await request.json() as CheckoutDetails & { password: string }
    const fields = validProfile(data)
    if (!data.password || data.password.length < 8) fields.password = 'Use pelo menos 8 caracteres.'
    if (Object.keys(fields).length) return error(422, 'VALIDATION', 'Revise os dados informados.', fields)
    const salt = crypto.randomUUID()
    const passwordHash = await hashPassword(data.password, salt)
    const db = loadDatabase()
    const email = data.email.trim().toLowerCase()
    if (Object.values(db.accounts).some(({ profile }) => profile.email === email)) {
      return error(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' })
    }
    const id = crypto.randomUUID()
    db.accounts[id] = { salt, passwordHash, wallets: [], favorites: [], profile: { id, email, name: data.name.trim(), avatar: '', phone: data.phone ?? '' } }
    return openSession(db, id, request)
  }, { publicAuth: true }),
  route('post', '/logout', ({ request, db }) => {
    const token = request.headers.get('authorization')?.replace(/^Bearer /, '')
    if (token) delete db.sessions[token]
    saveDatabase(db)
    return HttpResponse.json({ ok: true })
  }, { publicAuth: true }),
  route('get', '/nfts', ({ request, db }) => {
    const params = new URL(request.url).searchParams
    const keyword = (params.get('q') ?? '').trim().toLocaleLowerCase('pt-BR')
    const selected = params.getAll('category')
    const page = Math.max(1, Number(params.get('page')) || 1)
    const feed = params.get('feed')
    const sort = params.get('sort')
    let min: bigint
    let max: bigint | undefined
    try {
      min = parseEth(params.get('min') || '0')
      max = params.get('max') ? parseEth(params.get('max')!) : undefined
    } catch {
      return error(422, 'INVALID_FILTER', 'Use valores decimais válidos para a faixa de preço.')
    }
    const nfts = db.scenario === 'empty' ? [] : db.nfts
    const items = nfts.filter((nft) => {
      const price = parseEth(nft.editions[0].price)
      return (!keyword || `${nft.title} ${nft.creator} ${nft.category}`.toLocaleLowerCase('pt-BR').includes(keyword))
        && (!selected.length || selected.includes(nft.category))
        && price >= min && (max === undefined || price <= max)
        && (feed !== 'new' || nft.listedAt >= 988)
        && (feed !== 'trending' || nft.popularity >= 50)
    })
    items.sort((a, b) => {
      if (sort === 'popular' || (sort === 'recent' && feed === 'trending')) return b.popularity - a.popularity
      if (sort === 'price-asc' || sort === 'price-desc') {
        const delta = parseEth(a.editions[0].price) - parseEth(b.editions[0].price)
        return (delta > 0n ? 1 : delta < 0n ? -1 : 0) * (sort === 'price-asc' ? 1 : -1)
      }
      return b.listedAt - a.listedAt
    })
    const pageSize = 9
    return HttpResponse.json({
      items: items.slice((page - 1) * pageSize, page * pageSize),
      featured: nfts.slice(0, 3),
      facets: Object.fromEntries(categories.map((category) => [category, nfts.filter((nft) => nft.category === category).length])),
      total: items.length,
      pages: Math.max(1, Math.ceil(items.length / pageSize)),
    })
  }),
  route('get', '/nfts/:id', ({ db, params }) => {
    const nft = db.nfts.find((item) => item.id === params.id)
    return nft ? HttpResponse.json(nft) : error(404, 'NFT_NOT_FOUND', 'Não encontramos esta obra.')
  }),
  route('get', '/favorites', ({ db, owner }) => HttpResponse.json(db.accounts[owner].favorites), required),
  route('post', '/favorites/:id', ({ db, params, owner }) => {
    if (db.scenario === 'favoriteFailure') return error(503, 'FAVORITE_FAILED', 'Não foi possível salvar o favorito. Tente de novo.')
    if (!db.nfts.some((nft) => nft.id === params.id)) return error(404, 'NFT_NOT_FOUND', 'Não encontramos esta obra.')
    const account = db.accounts[owner]
    account.favorites = [...new Set([...account.favorites, String(params.id)])]
    saveDatabase(db)
    return HttpResponse.json(account.favorites)
  }, required),
  route('delete', '/favorites/:id', ({ db, params, owner }) => {
    if (db.scenario === 'favoriteFailure') return error(503, 'FAVORITE_FAILED', 'Não foi possível remover o favorito. Tente de novo.')
    const account = db.accounts[owner]
    account.favorites = account.favorites.filter((id) => id !== params.id)
    saveDatabase(db)
    return HttpResponse.json(account.favorites)
  }, required),
  route('get', '/cart', ({ db, owner }) => HttpResponse.json(readCart(db, owner))),
  route('post', '/cart/items', async ({ request }) => {
    const data = await request.json() as CartItem & { mode: 'add' | 'set' }
    const db = loadDatabase()
    const owner = ownerFor(db, request)
    const found = findEdition(db, data.nftId, data.editionId)
    if (!found) return error(404, 'EDITION_NOT_FOUND', 'Esta edição não existe.')
    const cart = readCart(db, owner)
    const id = cartKey(data)
    const existing = cart.items.find((item) => cartKey(item) === id)
    const quantity = data.quantity + (data.mode === 'add' ? existing?.quantity ?? 0 : 0)
    if (!Number.isSafeInteger(data.quantity) || data.quantity < 1) return error(422, 'INVALID_QUANTITY', 'Digite uma quantidade inteira positiva.')
    if (quantity > found.edition.stock) return error(409, 'STOCK_CHANGED', `Quantidade indisponível. Restam ${found.edition.stock}.`)
    const item = { nftId: data.nftId, editionId: data.editionId, quantity }
    const items = existing ? cart.items.map((line) => cartKey(line) === id ? item : line) : [...cart.items, item]
    const next = writeCart(db, owner, items, cart.coupon)
    saveDatabase(db)
    return HttpResponse.json(next)
  }),
  route('delete', '/cart/items/:nftId/:editionId', ({ db, owner, params }) => {
    const cart = readCart(db, owner)
    const items = cart.items.filter((item) => item.nftId !== params.nftId || item.editionId !== params.editionId)
    const next = writeCart(db, owner, items, items.length ? cart.coupon : '')
    saveDatabase(db)
    return HttpResponse.json(next)
  }),
  route('patch', '/cart/coupon', async ({ request }) => {
    const { code } = await request.json() as { code: string }
    const coupon = code.trim().toUpperCase()
    const issue = couponError(coupon)
    if (issue) return error(422, 'INVALID_COUPON', issue, { code: issue })
    const db = loadDatabase()
    const owner = ownerFor(db, request)
    const next = writeCart(db, owner, readCart(db, owner).items, coupon)
    saveDatabase(db)
    return HttpResponse.json(next)
  }),
  route('get', '/quote', ({ db, request, owner }) => {
    const network = new URL(request.url).searchParams.get('network') ?? 'Ethereum'
    if (!networks.includes(network as Network)) return error(422, 'INVALID_NETWORK', 'Selecione uma rede válida.')
    return HttpResponse.json(getQuote(db, owner, network as Network))
  }),
  route('get', '/profile', ({ db, owner }) => HttpResponse.json(db.accounts[owner].profile), required),
  route('patch', '/profile', async ({ request, owner }) => {
    const data = await request.json() as CheckoutDetails & { avatar: string }
    const fields = validProfile(data)
    if (data.avatar && (!/^data:image\/(png|jpeg|webp);base64,/.test(data.avatar) || data.avatar.length > 750_000)) fields.avatar = 'Use PNG, JPG ou WebP com até 500 KB.'
    if (Object.keys(fields).length) return error(422, 'VALIDATION', 'Revise os dados informados.', fields)
    const db = loadDatabase()
    const email = data.email.trim().toLowerCase()
    if (Object.values(db.accounts).some(({ profile }) => profile.id !== owner && profile.email === email)) {
      return error(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' })
    }
    const account = db.accounts[owner]
    account.profile = { id: owner, name: data.name.trim(), email, avatar: data.avatar || '', phone: data.phone ?? '' }
    saveDatabase(db)
    return HttpResponse.json(account.profile)
  }, required),
  route('patch', '/profile/password', async ({ request, owner }) => {
    const { current, password } = await request.json() as { current: string; password: string }
    const { salt, passwordHash } = loadDatabase().accounts[owner]
    if (await hashPassword(current ?? '', salt) !== passwordHash) return error(422, 'VALIDATION', 'Senha atual incorreta.', { current: 'Senha atual incorreta.' })
    if (!password || password.length < 8 || password === current) return error(422, 'VALIDATION', 'Use uma nova senha com pelo menos 8 caracteres.', { password: 'Use uma nova senha com pelo menos 8 caracteres.' })
    const nextSalt = crypto.randomUUID()
    const nextHash = await hashPassword(password, nextSalt)
    const db = loadDatabase()
    const account = db.accounts[owner]
    if (account?.passwordHash !== passwordHash) return error(409, 'PASSWORD_CHANGED', 'A senha mudou. Atualize a página.')
    account.salt = nextSalt
    account.passwordHash = nextHash
    saveDatabase(db)
    return HttpResponse.json({ ok: true })
  }, required),
  route('get', '/wallets', ({ db, owner }) => HttpResponse.json(db.accounts[owner].wallets), required),
  route('post', '/wallets', async ({ request, owner }) => {
    const input = await request.json() as Omit<Wallet, 'id'>
    const fields: Record<string, string> = {}
    if (!input.label || input.label.trim().length < 2) fields.label = 'Digite um nome para a carteira.'
    if (!/^0x[0-9a-f]{40}$/i.test(input.address ?? '')) fields.address = 'Digite um endereço 0x com 40 caracteres hexadecimais.'
    if (input.kind !== 'primary' && input.kind !== 'secondary') return error(422, 'VALIDATION', 'Selecione o tipo de carteira.')
    if (Object.keys(fields).length) return error(422, 'VALIDATION', 'Revise os dados da carteira.', fields)
    const db = loadDatabase()
    const account = db.accounts[owner]
    if (account.wallets.some((wallet) => wallet.kind !== input.kind && wallet.address.toLowerCase() === input.address.toLowerCase())) {
      return error(409, 'WALLET_TAKEN', 'Este endereço já foi cadastrado.', { address: 'Este endereço já foi cadastrado.' })
    }
    const id = account.wallets.find((wallet) => wallet.kind === input.kind)?.id ?? crypto.randomUUID()
    const wallet = { ...input, label: input.label.trim(), id }
    account.wallets = [...account.wallets.filter((item) => item.kind !== input.kind), wallet]
    saveDatabase(db)
    return HttpResponse.json(account.wallets)
  }, required),
  route('post', '/wallets/:id/connect', async ({ request, owner, params }) => {
    const { network, approved } = await request.json() as { network: Network; approved: boolean }
    const db = loadDatabase()
    const session = sessionFor(db, request)
    if (!session) return error(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
    if (!networks.includes(network) || !db.accounts[owner].wallets.some((wallet) => wallet.id === params.id)) {
      return error(422, 'INVALID_WALLET', 'Selecione uma carteira e uma rede válidas.')
    }
    session.connection = approved ? { walletId: String(params.id), network } : undefined
    saveDatabase(db)
    return HttpResponse.json({ connected: Boolean(session.connection) })
  }, required),
  route('delete', '/wallets/connection', ({ request, db }) => {
    const session = sessionFor(db, request)
    if (session) delete session.connection
    saveDatabase(db)
    return HttpResponse.json({ connected: false })
  }, required),
  route('post', '/orders', async ({ request, owner }) => {
    const key = request.headers.get('idempotency-key')
    if (!key) return error(422, 'MISSING_KEY', 'Identificador de tentativa obrigatório.')
    const input = await request.json() as OrderInput
    const db = loadDatabase()
    if (!sessionFor(db, request)) return error(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
    const fingerprint = JSON.stringify([input.quoteId, input.walletId, input.network, input.collector?.name, input.collector?.email, input.collector?.phone])
    const existing = Object.values(db.orders).find((entry) => entry.key === key && entry.userId === owner)
    if (existing) {
      return existing.fingerprint === fingerprint
        ? HttpResponse.json(existing.order)
        : error(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa já foi usada com outros dados.')
    }
    if (!networks.includes(input.network)) return error(422, 'INVALID_NETWORK', 'Selecione uma rede válida.')
    const fields = validProfile(input.collector)
    if (!input.collector.phone) fields.phone = 'Digite seu telefone.'
    if (Object.keys(fields).length) return error(422, 'VALIDATION', 'Revise os dados de pagamento.', fields)
    const wallet = db.accounts[owner].wallets.find((item) => item.id === input.walletId)
    if (!wallet) return error(422, 'INVALID_WALLET', 'Selecione uma carteira cadastrada.')
    const connection = sessionFor(db, request)?.connection
    if (connection?.walletId !== input.walletId || connection.network !== input.network) return error(409, 'WALLET_DISCONNECTED', 'Conecte a carteira selecionada novamente.')
    const quote = getQuote(db, owner, input.network)
    if (!quote.items.length || quote.issues.length || quote.id !== input.quoteId) return error(409, 'QUOTE_CHANGED', 'A cotação mudou. Revise os valores e confirme novamente.')
    const id = crypto.randomUUID()
    const now = Date.now()
    const entry: StoredOrder = {
      userId: owner, key, fingerprint, dueAt: now + (db.scenario === 'pending' ? 90_000 : 2_500), decline: db.scenario === 'declined',
      order: { id, status: 'pending', quote, collector: input.collector, wallet, transaction: null, createdAt: now, version: 1 },
    }
    db.orders[id] = entry
    saveDatabase(db)
    advanceOrders()
    if (db.scenario === 'timeout') await delay(6500)
    return HttpResponse.json(entry.order, { status: 201 })
  }, required),
  route('get', '/orders/:id', ({ db, params, owner }) => {
    const entry = db.orders[String(params.id)]
    return entry?.userId === owner ? HttpResponse.json(entry.order) : error(404, 'ORDER_NOT_FOUND', 'Não encontramos este pedido.')
  }, required),
  http.get(root + '/__demo', () => HttpResponse.json({ scenario: loadDatabase().scenario })),
  http.post(root + '/__demo', async ({ request }) => {
    const action = await request.json() as DemoAction
    if (action.type === 'reset') {
      clearTimeout(timer)
      latestNft = undefined
      latestOrder = undefined
      unavailableUntil = 0
      await resetDatabase()
      for (const client of clients.keys()) client.emit('demo.reset')
      return HttpResponse.json({ ok: true })
    }
    const db = loadDatabase()
    if (action.type === 'scenario' && action.scenario in scenarios) {
      db.scenario = action.scenario
      if (action.scenario === 'expired') db.sessions = {}
      saveDatabase(db)
    }
    if (action.type === 'price' || action.type === 'stock') {
      const nft = db.nfts.find((item) => item.id === (action.nftId || 'emerald-ape'))
      if (!nft) return error(404, 'NFT_NOT_FOUND', 'Não encontramos esta obra.')
      const edition = nft.editions[0]
      if (action.type === 'price') edition.price = toEth(parseEth(edition.price) + parseEth('0.15'))
      if (action.type === 'stock') edition.stock = 0
      nft.version += 1
      saveDatabase(db)
      publishNft(nft.id, nft.version)
    }
    if (action.type === 'duplicate' || action.type === 'older') {
      const previousVersion = <T extends VersionedEvent>(event: T): T => action.type === 'older'
        ? { ...event, id: 'older:' + event.id, version: event.version - 1 }
        : event
      for (const [client, { token }] of clients) {
        if (latestNft) client.emit('nft.updated', previousVersion(latestNft))
        if (latestOrder && activeSession(db, token)?.userId === latestOrder.userId) {
          client.emit('order.updated', previousVersion(latestOrder))
        }
      }
    }
    if (action.type === 'disconnect') {
      unavailableUntil = Date.now() + 1000
      for (const { close } of clients.values()) close()
    }
    if (action.type === 'finish') {
      for (const entry of Object.values(db.orders)) {
        if (entry.userId === sessionFor(db, request)?.userId && entry.order.status === 'pending') entry.dueAt = Date.now()
      }
      saveDatabase(db)
      advanceOrders()
    }
    return HttpResponse.json({ ok: true })
  }),
]
