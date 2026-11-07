import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FlaskConical, LogIn, LogOut, Menu, Search, ShoppingCart, UserRound, Wallet } from 'lucide-react'
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
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Buscar NFTs"><Search size={21} /></Button></DialogTrigger>
    <DialogContent title="Buscar NFTs" description="Encontre uma obra, coleção ou artista.">
      <form onSubmit={search} className="form-stack">
        <Field label="Buscar no marketplace" autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="Ex. Emerald Ape" />
        <Button type="submit"><Search size={16} /> Buscar</Button>
      </form>
    </DialogContent>
  </Dialog>
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
  const next = location.href.startsWith('/entrar') || location.href.startsWith('/cadastro') ? '/' : location.href
  const links = <>
    <Link to="/" activeOptions={{ exact: true }} className="nav-link" onClick={() => setMenu(false)}>Início</Link>
    <Link to="/" hash="catalogo" className="nav-link" onClick={() => setMenu(false)}>Mercado</Link>
    <button type="button" className="nav-link" onClick={() => { setMenu(false); setInfo('Criadores') }}>Criadores</button>
    <button type="button" className="nav-link" onClick={() => { setMenu(false); setInfo('Aprenda') }}>Aprenda</button>
  </>
  const accountLinks = <>
    <Button asChild variant="outline"><Link to="/perfil" onClick={() => { setMenu(false); setAccount(false) }}><UserRound size={16} /> Meu perfil</Link></Button>
    <Button asChild variant="outline"><Link to="/carteiras" search={{ next: '/' }} onClick={() => { setMenu(false); setAccount(false) }}><Wallet size={16} /> Minhas carteiras</Link></Button>
    <Button variant="ghost" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut size={16} /> Sair</Button>
  </>
  return <>
    <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <header className="site-header">
      <div className="container-shell header-inner">
        <Link to="/" aria-label="Kurio, página inicial" className="wordmark">KURIO<span aria-hidden="true">.</span></Link>
        <nav className="desktop-nav" aria-label="Menu principal">{links}</nav>
        <div className="header-actions">
          <SearchDialog />
          <Button asChild variant="ghost" size="icon" className="cart-icon">
            <Link to="/carrinho" aria-label={`Carrinho, ${cart.data?.count ?? 0} itens`}><ShoppingCart size={21} /><span>{cart.data?.count ?? 0}</span></Link>
          </Button>
          {session.data ? <Dialog open={account} onOpenChange={setAccount}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="desktop-account"><UserRound size={16} /> {session.data.name.split(' ')[0]}</Button></DialogTrigger>
            <DialogContent title="Minha conta"><div className="form-stack">{accountLinks}</div></DialogContent>
          </Dialog> : <Button asChild size="sm" className="desktop-account"><Link to="/entrar" search={{ next }}><LogIn size={16} /> Entrar</Link></Button>}
          <Dialog open={menu} onOpenChange={setMenu}>
            <DialogTrigger asChild><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Abrir menu"><Menu size={23} /></Button></DialogTrigger>
            <DialogContent title="Menu" drawer>
              <nav className="mobile-nav" aria-label="Menu principal">{links}</nav>
              <div className="form-stack">{session.data ? accountLinks : <Button asChild><Link to="/entrar" search={{ next }} onClick={() => setMenu(false)}><LogIn size={16} /> Entrar</Link></Button>}</div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
    <Dialog open={Boolean(info)} onOpenChange={(open) => { if (!open) setInfo('') }}>
      <DialogContent title={info}><p className="muted">Esta seção editorial está indisponível na demonstração do marketplace.</p></DialogContent>
    </Dialog>
  </>
}

function DemoPanel() {
  const [open, setOpen] = useState(false)
  const live = useLive()
  const { data } = useQuery({ queryKey: ['demo'], queryFn: api.demo, enabled: open, staleTime: 0 })
  const action = useMutation({
    mutationFn: api.demoAction,
    onSuccess: (_, payload) => {
      if (payload.type === 'reset') {
        for (const key of Object.keys(localStorage)) if (key.startsWith('kurio.attempt.')) localStorage.removeItem(key)
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
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" size="sm"><FlaskConical size={15} /> Cenários da demo</Button></DialogTrigger>
    <DialogContent title="Cenários da demonstração" description="As ações abaixo modificam a simulação na camada de rede.">
      <div className="form-stack">
        <p role="status" className="live-status"><span className={live.connected ? 'live-dot online' : 'live-dot'} />{live.connected ? 'Tempo real conectado' : 'Tempo real desconectado'}</p>
        <label className="field">Condição da rede ou do pedido
          <select value={data?.scenario ?? 'default'} onChange={(event) => action.mutate({ type: 'scenario', scenario: event.target.value as Scenario })}>
            {Object.entries(scenarios).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <div className="demo-actions">
          {actions.map(({ type, label }) => <Button key={type} variant="outline" size="sm" disabled={action.isPending} onClick={() => action.mutate({ type } as DemoAction)}>{label}</Button>)}
        </div>
        {action.isError && <Notice kind="error">{problem(action.error).message}</Notice>}
        {action.isSuccess && <Notice kind="success">Cenário atualizado.</Notice>}
        <Button variant="destructive" onClick={() => action.mutate({ type: 'reset' })} disabled={action.isPending}>Restaurar dados da demonstração</Button>
      </div>
    </DialogContent>
  </Dialog>
}

function Footer() {
  const [email, setEmail] = useState('')
  
  return <footer className="site-footer">
    <div className="container-shell footer-container">
      <div className="footer-features">
        <div className="footer-feature">
          <div className="feature-medallion">W</div>
          <h3>Segurança da carteira</h3>
          <p>Proteja sua carteira e colecione arte digital verificada com confiança.</p>
        </div>
        <div className="feature-divider" />
        <div className="footer-feature">
          <div className="feature-medallion">C</div>
          <h3>Criadores em destaque</h3>
          <p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p>
        </div>
        <div className="feature-divider" />
        <div className="footer-feature">
          <div className="feature-medallion">D</div>
          <h3>Alertas de lançamentos</h3>
          <p>Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.</p>
        </div>
        <div className="feature-divider" />
        <div className="footer-newsletter">
          <h3>Antecipe-se ao próximo lançamento</h3>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="digite seu e-mail..." 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="button">Enviar</button>
          </div>
          <p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
        </div>
      </div>
      
      <div className="footer-brand-band">
        <div className="brand-logo">KURIO</div>
        <div className="brand-tagline">Feito para colecionadores,<br />criadores e cultura</div>
        <a href="mailto:contato@email.com" className="brand-email">contato@email.com</a>
        <div className="brand-phone">+55 11 4002 8922</div>
      </div>
      
      <div className="footer-links-section">
        <div className="footer-links-columns">
          <div className="footer-column">
            <h4>Meu perfil</h4>
            <ul>
              <li><a href="#perfil">Meu perfil</a></li>
              <li><a href="#colecao">Minha coleção</a></li>
              <li><a href="#atividade">Atividade</a></li>
              <li><a href="#criador">Estúdio do criador</a></li>
              <li><a href="#interesse">Lista de interesse</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Central de ajuda</h4>
            <ul>
              <li><a href="#ajuda">Central de ajuda</a></li>
              <li><a href="#comprar">Como comprar NFTs</a></li>
              <li><a href="#carteira">Carteira e segurança</a></li>
              <li><a href="#politica">Política do mercado</a></li>
              <li><a href="#denunciar">Denunciar item</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Recursos</h4>
            <ul>
              <li><a href="#recursos">Recursos</a></li>
              <li><a href="#biblioteca">Biblioteca de conteúdo</a></li>
              <li><a href="#tecnologia">Tecnologia e segurança</a></li>
              <li><a href="#taxas">Taxas e comissões</a></li>
              <li><a href="#criadores">Para criadores</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Corporativo</h4>
            <ul>
              <li><a href="#empresa">Sobre a empresa</a></li>
              <li><a href="#privacidade">Privacidade</a></li>
              <li><a href="#termos">Termos de uso</a></li>
              <li><a href="#imprensa">Kit de imprensa</a></li>
              <li><a href="#carreiras">Carreiras</a></li>
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
            <button type="button" className="wallet-chip">MetaMask</button>
            <button type="button" className="wallet-chip">Coinbase</button>
            <button type="button" className="wallet-chip">WalletConnect</button>
          </div>
        </div>
      </div>
    </div>
    {mocksEnabled && <div className="demo-panel-wrapper"><DemoPanel /></div>}
  </footer>
}

export function Layout() {
  const session = useSession()
  const scope = scopeFor(session.data)
  return <LiveProvider key={scope} scope={scope} userId={session.data?.id}>
    <Navigation />
    <main id="conteudo" tabIndex={-1}><Outlet /></main>
    <Footer />
  </LiveProvider>
}
