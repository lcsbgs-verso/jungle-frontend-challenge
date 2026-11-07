import { createRootRoute, createRoute, createRouter, Link, Outlet, redirect, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { categories, defaultSearch, feeds, sorts } from './domain'
import type { CatalogSearch, Collector, Feed, Sort } from './domain'
import { queryClient, sessionOptions, useSession } from './state'
import { getToken, problem } from './api'
import { Layout } from './components/layout'
import { ErrorState, Skeleton } from './components/shared'
import { Button } from './components/ui/button'
import { AuthPage, ProfilePage, safeNext, WalletsPage } from './features/account'
import { CartPage } from './features/cart'
import { CatalogPage } from './features/catalog'
import { CheckoutPage } from './features/checkout'
import { NftPage } from './features/nft'
import { OrderPage } from './features/order'

function NotFound() {
  return <div className="container-shell inner-page not-found"><p className="eyebrow">Erro 404</p><h1>Página não encontrada</h1><p className="muted">O endereço solicitado não está disponível.</p><Button asChild><Link to="/">Voltar ao início</Link></Button></div>
}
const rootRoute = createRootRoute({ component: Layout, notFoundComponent: NotFound })

function validateCatalog(search: Record<string, unknown>): CatalogSearch {
  const page = Number(search.page)
  return {
    q: typeof search.q === 'string' ? search.q.slice(0, 120) : '',
    categories: Array.isArray(search.categories) ? search.categories.filter((item) => categories.includes(item)).sort() : [],
    min: typeof search.min === 'string' ? search.min : '',
    max: typeof search.max === 'string' ? search.max : '',
    sort: sorts.includes(search.sort as Sort) ? search.sort as Sort : 'recent',
    feed: feeds.includes(search.feed as Feed) ? search.feed as Feed : 'all',
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
  }
}

const home = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalog,
  component: HomeRoute,
})
function HomeRoute() { return <CatalogPage search={home.useSearch()} /> }

const nft = createRoute({ getParentRoute: () => rootRoute, path: '/nft/$nftId', component: NftRoute })
function NftRoute() { return <NftPage id={nft.useParams().nftId} /> }

const cart = createRoute({ getParentRoute: () => rootRoute, path: '/carrinho', component: CartPage })

const nextSearch = (search: Record<string, unknown>) => ({ next: safeNext(search.next) })
const login = createRoute({ getParentRoute: () => rootRoute, path: '/entrar', validateSearch: nextSearch, component: LoginRoute })
function LoginRoute() { return <AuthPage key="login" mode="login" next={login.useSearch().next} /> }
const register = createRoute({ getParentRoute: () => rootRoute, path: '/cadastro', validateSearch: nextSearch, component: RegisterRoute })
function RegisterRoute() { return <AuthPage key="register" mode="register" next={register.useSearch().next} /> }

function PrivateLayout() {
  const session = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const redirected = useRef(false)
  useEffect(() => {
    if (session.isPending || session.data || getToken() || redirected.current) return
    redirected.current = true
    void navigate({ to: '/entrar', search: { next: location.href }, replace: true })
  }, [location.href, navigate, session.data, session.isPending])
  if (session.isError && getToken()) return <div className="container-shell inner-page"><ErrorState failure={session.error} retry={() => void session.refetch()} /></div>
  if (session.isPending) return <div className="container-shell inner-page"><Skeleton className="cart-skeleton" label="Carregando sessão" /></div>
  if (!session.data) return null
  return <Outlet />
}

const privateRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_private',
  beforeLoad: async ({ location }) => {
    const signIn = () => redirect({ to: '/entrar', search: { next: location.href }, replace: true })
    if (!getToken()) throw signIn()
    let user: Collector | null
    try {
      user = await queryClient.ensureQueryData(sessionOptions())
    } catch (failure) {
      if (!getToken() || problem(failure).code === 'SESSION_EXPIRED') throw signIn()
      return
    }
    if (!user) throw signIn()
  },
  component: PrivateLayout,
})
const checkout = createRoute({ getParentRoute: () => privateRoute, path: '/pagamento', component: CheckoutPage })
const profile = createRoute({ getParentRoute: () => privateRoute, path: '/perfil', component: ProfilePage })
const wallets = createRoute({ getParentRoute: () => privateRoute, path: '/carteiras', validateSearch: nextSearch, component: WalletsRoute })
function WalletsRoute() { return <WalletsPage next={wallets.useSearch().next} /> }
const order = createRoute({ getParentRoute: () => privateRoute, path: '/pedido/$orderId', component: OrderRoute })
function OrderRoute() { return <OrderPage key={order.useParams().orderId} id={order.useParams().orderId} /> }

export const router = createRouter({
  routeTree: rootRoute.addChildren([home, nft, cart, login, register, privateRoute.addChildren([checkout, profile, wallets, order])]),
  scrollRestoration: true,
  parseSearch: (search) => {
    const params = new URLSearchParams(search)
    const values: Record<string, unknown> = Object.fromEntries(params)
    const selected = params.getAll('category')
    delete values.category
    if (selected.length) values.categories = selected
    return values
  },
  stringifySearch: (search) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(search)) {
      if (key === 'categories' && Array.isArray(value)) {
        value.forEach((item) => params.append('category', String(item)))
      } else if (value !== undefined && value !== '' && value !== defaultSearch[key as keyof CatalogSearch] && !(key === 'next' && value === '/')) {
        params.set(key, String(value))
      }
    }
    return params.size ? '?' + params.toString() : ''
  },
  defaultPendingComponent: () => <div className="container-shell inner-page"><Skeleton className="cart-skeleton" label="Carregando página" /></div>,
})

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
