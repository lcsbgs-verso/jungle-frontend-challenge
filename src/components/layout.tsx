import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tantml:parameter>
import {
  FlaskConical,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, mocksEnabled, problem } from '../api'
import { defaultSearch, scenarios } from '../domain'
import type { DemoAction, Scenario } from '../domain'
import { LiveProvider, useLive } from '../realtime'
import { queryClient, scopeFor, sessionChanged, useCart, useSession } from '../state'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Field, Notice } from './shared'

function SearchDialog() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  function search(event: FormEvent) {
    event.preventDefault()
    setOpen(false)
    void navigate({ to: '/', search: { ...defaultSearch, q: value.trim() }, hash: 'catalogo' })
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Buscar NFTs">
          <Search size={21} />
        </Button>
      </DialogTrigger>
      <DialogContent title="Buscar NFTs" description="Encontre uma obra, coleção ou artista.">
        <form onSubmit={search} className="form-stack">
          <Field
            label="Buscar no marketplace"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Ex. Emerald Ape"
          />
          <Button type="submit">
            <Search size={16} /> Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Navigation() {
  const session = useSession()
  const scope = scopeFor(session.data)
  const cart = useCart(scope, !session.isPending)
  const location = useLocation()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [account, setAccount] = useState(false)
  const [info, setInfo] = useState('')
  const logout = useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      setAccount(false)
      setMenu(false)
      sessionChanged(null)
      void navigate({ to: '/' })
    },
  })
  const next =
    location.href.startsWith('/entrar') || location.href.startsWith('/cadastro')
      ? '/'
      : location.href
  const links = (
    <>
      <Link
        to="/"
        activeOptions={{ exact: true }}
        className="nav-link"
        onClick={() => setMenu(false)}
      >
        Início
      </Link>
      <Link to="/" hash="catalogo" className="nav-link" onClick={() => setMenu(false)}>
        Mercado
      </Link>
      <button
        type="button"
        className="nav-link"
        onClick={() => {
          setMenu(false)
          setInfo('Criadores')
        }}
      >
        Criadores
      </button>
      <button
        type="button"
        className="nav-link"
        onClick={() => {
          setMenu(false)
          setInfo('Aprenda')
        }}
      >
        Aprenda
      </button>
    </>
  )
  const accountLinks = (
    <>
      <Button asChild variant="outline">
        <Link
          to="/perfil"
          onClick={() => {
            setMenu(false)
            setAccount(false)
          }}
        >
          <UserRound size={16} /> Meu perfil
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link
          to="/carteiras"
          search={{ next: '/' }}
          onClick={() => {
            setMenu(false)
            setAccount(false)
          }}
        >
          <Wallet size={16} /> Minhas carteiras
        </Link>
      </Button>
      <Button variant="ghost" onClick={() => logout.mutate()} disabled={logout.isPending}>
        <LogOut size={16} /> Sair
      </Button>
    </>
  )
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="site-header">
        <div className="container-shell header-inner">
          <Link to="/" aria-label="Kurio, página inicial" className="wordmark">
            KURIO<span aria-hidden="true">.</span>
          </Link>
          <nav className="desktop-nav" aria-label="Menu principal">
            {links}
          </nav>
          <div className="header-actions">
            <SearchDialog />
            <Button asChild variant="ghost" size="icon" className="cart-icon">
              <Link to="/carrinho" aria-label={`Carrinho, ${cart.data?.count ?? 0} itens`}>
                <ShoppingCart size={21} />
                <span>{cart.data?.count ?? 0}</span>
              </Link>
            </Button>
            {session.data ? (
              <Dialog open={account} onOpenChange={setAccount}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="desktop-account">
                    <UserRound size={16} /> {session.data.name.split(' ')[0]}
                  </Button>
                </DialogTrigger>
                <DialogContent title="Minha conta">
                  <div className="form-stack">{accountLinks}</div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button asChild size="sm" className="desktop-account">
                <Link to="/entrar" search={{ next }}>
                  <LogIn size={16} /> Entrar
                </Link>
              </Button>
            )}
            <Dialog open={menu} onOpenChange={setMenu}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="mobile-menu" aria-label="Abrir menu">
                  <Menu size={23} />
                </Button>
              </DialogTrigger>
              <DialogContent title="Menu" drawer>
                <nav className="mobile-nav" aria-label="Menu principal">
                  {links}
                </nav>
                <div className="form-stack">
                  {session.data ? (
                    accountLinks
                  ) : (
                    <Button asChild>
                      <Link to="/entrar" search={{ next }} onClick={() => setMenu(false)}>
                        <LogIn size={16} /> Entrar
                      </Link>
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      <Dialog
        open={Boolean(info)}
        onOpenChange={(open) => {
          if (!open) setInfo('')
        }}
      >
        <DialogContent title={info}>
          <p className="muted">
            Esta seção editorial está indisponível na demonstração do marketplace.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DemoPanel() {
  const [open, setOpen] = useState(false)
  const live = useLive()
  const { data } = useQuery({ queryKey: ['demo'], queryFn: api.demo, enabled: open, staleTime: 0 })
  const action = useMutation({
    mutationFn: api.demoAction,
    onSuccess: (_, payload) => {
      if (payload.type === 'reset') {
        for (const key of Object.keys(localStorage))
          if (key.startsWith('kurio.attempt.')) localStorage.removeItem(key)
        sessionChanged(null)
        window.location.assign('/')
      }
      if (payload.type === 'scenario') void queryClient.invalidateQueries()
    },
  })
  const actions: { type: DemoAction['type']; label: string }[] = [
    { type: 'price', label: 'Alterar preço do Emerald Ape' },
    { type: 'stock', label: 'Esgotar edição do Emerald Ape' },
    { type: 'duplicate', label: 'Repetir último evento' },
    { type: 'older', label: 'Enviar evento antigo' },
    { type: 'disconnect', label: 'Interromper conexão em tempo real' },
    { type: 'finish', label: 'Finalizar pedido pendente' },
  ]
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FlaskConical size={15} /> Cenários da demo
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Cenários da demonstração"
        description="As ações abaixo modificam a simulação na camada de rede."
      >
        <div className="form-stack">
          <p role="status" className="live-status">
            <span className={live.connected ? 'live-dot online' : 'live-dot'} />
            {live.connected ? 'Tempo real conectado' : 'Tempo real desconectado'}
          </p>
          <label className="field">
            Condição da rede ou do pedido
            <select
              value={data?.scenario ?? 'default'}
              onChange={(event) =>
                action.mutate({ type: 'scenario', scenario: event.target.value as Scenario })
              }
            >
              {Object.entries(scenarios).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="demo-actions">
            {actions.map(({ type, label }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                disabled={action.isPending}
                onClick={() => action.mutate({ type } as DemoAction)}
              >
                {label}
              </Button>
            ))}
          </div>
          {action.isError && <Notice kind="error">{problem(action.error).message}</Notice>}
          {action.isSuccess && <Notice kind="success">Cenário atualizado.</Notice>}
          <Button
            variant="destructive"
            onClick={() => action.mutate({ type: 'reset' })}
            disabled={action.isPending}
          >
            Restaurar dados da demonstração
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container-shell footer-container">
        <div className="footer-features">
          <div className="footer-feature">
            <div className="feature-medallion">K</div>
            <h3>Arte selecionada</h3>
            <p>Uma curadoria de obras digitais e coleções únicas.</p>
          </div>
          <div className="feature-divider" />
          <div className="footer-feature">
            <div className="feature-medallion">S</div>
            <h3>Compra segura</h3>
            <p>Revise sua compra e acompanhe cada etapa.</p>
          </div>
          <div className="feature-divider" />
          <div className="footer-feature">
            <div className="feature-medallion">Z</div>
            <h3>Atualizações em tempo real</h3>
            <p>Veja preços e disponibilidade enquanto explora.</p>
          </div>
          <div className="footer-newsletter">
            <h3>Fique atualizado</h3>
            <form className="newsletter-form">
              <input type="email" placeholder="Seu e-mail" aria-label="E-mail para newsletter" />
              <button type="submit">→</button>
            </form>
            <p>Receba novidades sobre lançamentos e artistas.</p>
          </div>
        </div>
        
        <div className="footer-brand-band">
          <div className="brand-logo">KURIO</div>
          <div className="brand-tagline">Marketplace de NFTs</div>
          <div className="brand-email">contato@kurio.art</div>
          <div className="brand-phone">+55 11 98765-4321</div>
        </div>
        
        <div className="footer-links-section">
          <div className="footer-links-columns">
            <div className="footer-column">
              <h4>Mercado</h4>
              <ul>
                <li><a href="#explorar">Explorar</a></li>
                <li><a href="#artistas">Artistas</a></li>
                <li><a href="#colecoes">Coleções</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Minha conta</h4>
              <ul>
                <li><a href="#perfil">Perfil</a></li>
                <li><a href="#carteira">Carteiras</a></li>
                <li><a href="#favoritos">Favoritos</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Recursos</h4>
              <ul>
                <li><a href="#ajuda">Central de ajuda</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#docs">Documentação</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Empresa</h4>
              <ul>
                <li><a href="#sobre">Sobre</a></li>
                <li><a href="#carreira">Carreiras</a></li>
                <li><a href="#contato">Contato</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="social-chips">
              <a href="#twitter" className="social-chip">Twitter</a>
              <a href="#discord" className="social-chip">Discord</a>
              <a href="#instagram" className="social-chip">Instagram</a>
            </div>
            <div className="wallet-chips">
              <span className="wallet-chip">MetaMask</span>
              <span className="wallet-chip">WalletConnect</span>
              <span className="wallet-chip">Coinbase</span>
            </div>
          </div>
        </div>
        
        {mocksEnabled && (
          <div className="demo-panel-wrapper">
            <DemoPanel />
          </div>
        )}
      </div>
    </footer>
  )
}

export function Layout() {
  const session = useSession()
  const scope = scopeFor(session.data)
  const location = useLocation()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Mobile pages: no desktop header/footer (mobile components have their own layouts)
  const isMobilePage =
    isMobile &&
    (location.pathname === '/' ||
      location.pathname === '/entrar' ||
      location.pathname === '/cadastro')

  return (
    <LiveProvider key={scope} scope={scope} userId={session.data?.id}>
      {!isMobilePage && <Navigation />}
      <main id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>
      {!isMobilePage && <Footer />}
    </LiveProvider>
  )
}
