import axios from 'axios'
import type {
  ApiError,
  Cart,
  CartItem,
  Catalog,
  CatalogSearch,
  CheckoutDetails,
  Collector,
  DemoAction,
  Network,
  Nft,
  Order,
  OrderInput,
  Quote,
  Scenario,
  Session,
  Wallet,
} from './domain'

const sessionKey = 'kurio.session'
const guestKey = 'kurio.guest'
let token = localStorage.getItem(sessionKey) ?? ''
let guest = localStorage.getItem(guestKey) ?? crypto.randomUUID()
localStorage.setItem(guestKey, guest)
let sessionExpired: () => void = () => {}

export const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false'
export const getToken = () => token

export function storeToken(next: string) {
  token = next
  if (token) localStorage.setItem(sessionKey, token)
  else localStorage.removeItem(sessionKey)
}

export function rotateGuest() {
  guest = crypto.randomUUID()
  localStorage.setItem(guestKey, guest)
}

export function onSessionExpired(callback: () => void) {
  sessionExpired = callback
}

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 4200 })
http.interceptors.request.use(
  (config) => {
    config.headers.set('x-guest-id', guest)
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
    return config
  },
  undefined,
  { synchronous: true },
)
http.interceptors.response.use(undefined, (failure: unknown) => {
  if (
    axios.isAxiosError<ApiError>(failure) &&
    failure.response?.data?.code === 'SESSION_EXPIRED' &&
    token &&
    failure.config?.headers.get('Authorization') === `Bearer ${token}`
  )
    sessionExpired()
  return Promise.reject(failure)
})

export function problem(failure: unknown): ApiError {
  if (axios.isAxiosError<ApiError>(failure)) {
    if (failure.response?.data?.message) return failure.response.data
    if (failure.code === 'ECONNABORTED' || failure.code === 'ETIMEDOUT')
      return { code: 'TIMEOUT', message: 'O servidor demorou para responder. Tente novamente.' }
    return {
      code: 'NETWORK',
      message: 'Não foi possível conectar. Verifique a conexão e tente novamente.',
    }
  }
  return { code: 'UNEXPECTED', message: 'Ocorreu um erro. Tente novamente.' }
}

const path = encodeURIComponent

export const api = {
  catalog: (search: CatalogSearch, signal?: AbortSignal) => {
    const params = new URLSearchParams({
      q: search.q,
      page: String(search.page),
      sort: search.sort,
      feed: search.feed,
    })
    search.categories.forEach((category) => params.append('category', category))
    if (search.min) params.set('min', search.min)
    if (search.max) params.set('max', search.max)
    return http.get<Catalog>('/nfts', { params, signal }).then(({ data }) => data)
  },
  nft: (id: string, signal?: AbortSignal) =>
    http.get<Nft>(`/nfts/${path(id)}`, { signal }).then(({ data }) => data),
  session: (signal?: AbortSignal) =>
    http.get<Collector | null>('/session', { signal }).then(({ data }) => data),
  login: (credentials: { email: string; password: string }) =>
    http.post<Session>('/login', credentials).then(({ data }) => data),
  register: (details: CheckoutDetails & { password: string }) =>
    http.post<Session>('/register', details).then(({ data }) => data),
  logout: () => http.post('/logout'),
  favorites: (signal?: AbortSignal) =>
    http.get<string[]>('/favorites', { signal }).then(({ data }) => data),
  favorite: (id: string, saved: boolean) =>
    http
      .request<string[]>({ method: saved ? 'post' : 'delete', url: `/favorites/${path(id)}` })
      .then(({ data }) => data),
  cart: (signal?: AbortSignal) => http.get<Cart>('/cart', { signal }).then(({ data }) => data),
  cartItem: (data: CartItem & { mode: 'add' | 'set' }) =>
    http.post<Cart>('/cart/items', data).then((response) => response.data),
  removeItem: (item: CartItem) =>
    http
      .delete<Cart>(`/cart/items/${path(item.nftId)}/${path(item.editionId)}`)
      .then(({ data }) => data),
  coupon: (code: string) => http.patch<Cart>('/cart/coupon', { code }).then(({ data }) => data),
  quote: (network: Network, signal?: AbortSignal) =>
    http.get<Quote>('/quote', { params: { network }, signal }).then(({ data }) => data),
  profile: (signal?: AbortSignal) =>
    http.get<Collector>('/profile', { signal }).then(({ data }) => data),
  saveProfile: (details: CheckoutDetails & { avatar: string }) =>
    http.patch<Collector>('/profile', details).then(({ data }) => data),
  password: (details: { current: string; password: string }) =>
    http.patch('/profile/password', details),
  wallets: (signal?: AbortSignal) =>
    http.get<Wallet[]>('/wallets', { signal }).then(({ data }) => data),
  saveWallet: (input: Omit<Wallet, 'id'>) =>
    http.post<Wallet[]>('/wallets', input).then(({ data }) => data),
  connectWallet: (walletId: string, network: Network, approved: boolean) =>
    http
      .post<{ connected: boolean }>(`/wallets/${path(walletId)}/connect`, { network, approved })
      .then(({ data }) => data),
  disconnectWallet: () => http.delete('/wallets/connection'),
  order: (id: string, signal?: AbortSignal) =>
    http.get<Order>(`/orders/${path(id)}`, { signal }).then(({ data }) => data),
  placeOrder: (input: OrderInput, key: string) =>
    http
      .post<Order>('/orders', input, { headers: { 'Idempotency-Key': key } })
      .then(({ data }) => data),
  demo: () => http.get<{ scenario: Scenario }>('/__demo').then(({ data }) => data),
  demoAction: (action: DemoAction) => http.post('/__demo', action),
}
