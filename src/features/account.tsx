import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowRight, Camera, KeyRound, LogIn, Plus, UserRound, Wallet as WalletIcon } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, problem } from '../api'
import { defaultSearch } from '../domain'
import type { Collector, Wallet } from '../domain'
import { privateKey, queryClient, scopeFor, sessionChanged, sessionKey, useSession, useWallets } from '../state'
import { Breadcrumb, ErrorState, Field, Notice, PageHeading, Skeleton } from '../components/shared'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { CatalogPage } from './catalog'
import { DesktopLoginModal, DesktopRegisterModal } from './auth-modals'
import { MobileLoginPage, MobileRegisterPage } from './auth-mobile'

export function safeNext(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  try {
    const url = new URL(value, location.origin)
    if (url.origin !== location.origin || ['/entrar', '/cadastro'].includes(url.pathname)) return '/'
    return url.pathname + url.search + url.hash
  } catch { return '/' }
}

export function AuthPage({ mode, next }: { mode: 'login' | 'register'; next: string }) {
  const navigate = useNavigate()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const registering = mode === 'register'
  const closeTo = next.startsWith('/pagamento') ? '/carrinho' : /^\/(perfil|carteiras|pedido)(\/|\?|$)/.test(next) ? '/' : next
  
  // Use new mobile/desktop components
  if (isMobile) {
    return mode === 'login' ? <MobileLoginPage /> : <MobileRegisterPage />
  }
  
  const handleClose = () => void navigate({ to: closeTo, replace: true })
  if (mode === 'login') {
    return <>
      <CatalogPage search={defaultSearch} />
      <DesktopLoginModal onClose={handleClose} />
    </>
  }
  if (mode === 'register') {
    return <>
      <CatalogPage search={defaultSearch} />
      <DesktopRegisterModal onClose={handleClose} />
    </>
  }
  
  // Fallback to old code below
  const [fields, setFields] = useState<Record<string, string>>({})
  const auth = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; phone: string }) => registering ? api.register(data) : api.login(data),
    onSuccess: (session) => {
      sessionChanged(session)
      void navigate({ href: next, replace: true })
    },
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    auth.reset()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '')
    const email = String(data.get('email') ?? '')
    const password = String(data.get('password') ?? '')
    const phone = String(data.get('phone') ?? '')
    const issues: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) issues.email = 'Digite um e-mail válido.'
    if (!password || (registering && password.length < 8)) issues.password = registering ? 'Use pelo menos 8 caracteres.' : 'Digite sua senha.'
    if (registering && name.trim().length < 2) issues.name = 'Digite seu nome completo.'
    if (registering && password !== data.get('confirm')) issues.confirm = 'As senhas precisam ser iguais.'
    setFields(issues)
    if (Object.keys(issues).length) {
      const form = event.currentTarget
      requestAnimationFrame(() => form.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus())
      return
    }
    auth.mutate({ name, email, password, phone })
  }
  const server = auth.isError ? problem(auth.error) : undefined
  return <>
    <CatalogPage search={defaultSearch} />
    <Dialog open onOpenChange={(open) => { if (!open) void navigate({ href: closeTo, replace: true }) }}>
      <DialogContent title={registering ? 'Crie sua conta' : 'Entre na sua conta'} description={registering ? 'Comece sua coleção de arte digital.' : 'Entre para continuar sua coleção na Kurio.'}>
        <form className="form-stack" onSubmit={submit} noValidate>
          {registering && <Field label="Nome completo" name="name" autoFocus autoComplete="name" error={fields.name ?? server?.fields?.name} />}
          <Field label="E-mail" name="email" autoFocus={!registering} type="email" autoComplete="email" error={fields.email ?? server?.fields?.email} />
          {registering && <Field label="Telefone (opcional)" name="phone" type="tel" autoComplete="tel" error={server?.fields?.phone} />}
          <Field label="Senha" name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} error={fields.password ?? server?.fields?.password} />
          {registering && <Field label="Confirme sua senha" name="confirm" type="password" autoComplete="new-password" error={fields.confirm} />}
          {server && <Notice kind="error">{server.message}</Notice>}
          <Button type="submit" disabled={auth.isPending}><LogIn size={16} /> {auth.isPending ? 'Aguarde…' : registering ? 'Criar conta' : 'Entrar'}</Button>
          {!registering && <p className="demo-credentials">Demo: <strong>alice@kurio.test</strong> · <strong>Kurio2026!</strong></p>}
          <p className="auth-switch">{registering ? 'Já tem conta?' : 'Novo na Kurio?'}{' '}
            <Link to={registering ? '/entrar' : '/cadastro'} search={{ next }} replace>{registering ? 'Entrar' : 'Criar conta'}</Link>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  </>
}

function ProfileForm({ profile }: { profile: Collector }) {
  const scope = scopeFor(profile)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [avatarError, setAvatarError] = useState('')
  const profileMutation = useMutation({
    mutationFn: api.saveProfile,
    onSuccess: (saved) => {
      queryClient.setQueryData(privateKey(scope, 'profile'), saved)
      queryClient.setQueryData(sessionKey, saved)
    },
  })
  const passwordMutation = useMutation({ mutationFn: api.password })
  const [confirmError, setConfirmError] = useState('')
  function upload(file: File | undefined) {
    setAvatarError('')
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 500_000) {
      setAvatarError('Escolha PNG, JPG ou WebP com até 500 KB.')
      return
    }
    const reader = new FileReader()
    reader.addEventListener('load', () => setAvatar(String(reader.result ?? '')))
    reader.addEventListener('error', () => setAvatarError('Não foi possível ler a imagem selecionada.'))
    reader.readAsDataURL(file)
  }
  const profileError = profileMutation.isError ? problem(profileMutation.error) : undefined
  const passwordError = passwordMutation.isError ? problem(passwordMutation.error) : undefined
  return <div className="account-grid">
    <section className="panel form-panel">
      <h2><UserRound size={18} /> Dados pessoais</h2>
      <form className="form-stack" noValidate onSubmit={(event) => {
        event.preventDefault()
        if (avatarError) return
        const values = new FormData(event.currentTarget)
        profileMutation.mutate({ name: String(values.get('name')), email: String(values.get('email')), phone: String(values.get('phone')), avatar })
      }}>
        <div className="avatar-field">
          <div className="avatar">{avatar ? <img src={avatar} alt="Prévia do avatar" width="70" height="70" /> : <UserRound size={28} />}</div>
          <div><label htmlFor="avatar-input"><Camera size={15} /> Alterar avatar</label><input id="avatar-input" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby={avatarError ? 'avatar-error' : undefined} onChange={(event) => upload(event.target.files?.[0])} /></div>
        </div>
        {(avatarError || profileError?.fields?.avatar) && <p id="avatar-error" className="field-error" role="alert">{avatarError || profileError?.fields?.avatar}</p>}
        <Field label="Nome completo" name="name" autoComplete="name" defaultValue={profile.name} error={profileError?.fields?.name} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={profile.email} error={profileError?.fields?.email} />
        <Field label="Telefone" name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone} error={profileError?.fields?.phone} />
        {profileError && <Notice kind="error">{profileError.message}</Notice>}
        {profileMutation.isSuccess && <Notice kind="success">Perfil atualizado.</Notice>}
        <Button type="submit" disabled={profileMutation.isPending}>Salvar perfil</Button>
      </form>
    </section>
    <section className="panel form-panel">
      <h2><KeyRound size={18} /> Alterar senha</h2>
      <form className="form-stack" noValidate onSubmit={(event) => {
        event.preventDefault()
        passwordMutation.reset()
        const form = event.currentTarget
        const data = new FormData(form)
        const password = String(data.get('password'))
        const confirmation = String(data.get('confirm'))
        setConfirmError(password === confirmation ? '' : 'As senhas precisam ser iguais.')
        if (password !== confirmation) return
        passwordMutation.mutate({ current: String(data.get('current')), password }, { onSuccess: () => form.reset() })
      }}>
        <Field label="Senha atual" type="password" name="current" autoComplete="current-password" error={passwordError?.fields?.current} />
        <Field label="Nova senha" type="password" name="password" autoComplete="new-password" error={passwordError?.fields?.password} />
        <Field label="Confirme a nova senha" type="password" name="confirm" autoComplete="new-password" error={confirmError} />
        {passwordError && <Notice kind="error">{passwordError.message}</Notice>}
        {passwordMutation.isSuccess && <Notice kind="success">Senha alterada.</Notice>}
        <Button type="submit" variant="outline" disabled={passwordMutation.isPending}>Alterar senha</Button>
      </form>
    </section>
  </div>
}

export function ProfilePage() {
  const session = useSession()
  const scope = scopeFor(session.data)
  const query = useQuery({ queryKey: privateKey(scope, 'profile'), queryFn: ({ signal }) => api.profile(signal), enabled: Boolean(session.data) })
  return <div className="container-shell inner-page">
    <Breadcrumb>Meu perfil</Breadcrumb>
    <PageHeading eyebrow="Conta do colecionador" title="Meu perfil">Gerencie os dados da sua conta.</PageHeading>
    {query.isPending ? <Skeleton className="cart-skeleton" label="Carregando perfil" /> : query.isError ? <ErrorState failure={query.error} retry={() => void query.refetch()} /> : <ProfileForm key={query.data.id} profile={query.data} />}
  </div>
}

function WalletForm({ kind, wallet, scope }: { kind: Wallet['kind']; wallet?: Wallet; scope: string }) {
  const label = kind === 'primary' ? 'Carteira principal' : 'Carteira secundária'
  const save = useMutation({ mutationFn: api.saveWallet, onSuccess: (wallets) => queryClient.setQueryData(privateKey(scope, 'wallets'), wallets) })
  const error = save.isError ? problem(save.error) : undefined
  return <section className="panel form-panel">
    <h2><WalletIcon size={18} /> {label}</h2>
    <p className="muted">{wallet ? 'Atualize os dados da carteira cadastrada.' : 'Cadastre um endereço fictício para usar na demonstração.'}</p>
    <form className="form-stack" noValidate onSubmit={(event) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      save.mutate({ kind, label: String(data.get('label')), address: String(data.get('address')).trim() })
    }}>
      <Field label="Nome da carteira" name="label" defaultValue={wallet?.label} error={error?.fields?.label} />
      <Field label="Endereço da carteira" name="address" defaultValue={wallet?.address} placeholder="0x…" spellCheck={false} autoComplete="off" error={error?.fields?.address} />
      {error && <Notice kind="error">{error.message}</Notice>}
      {save.isSuccess && <Notice kind="success">Carteira salva.</Notice>}
      <Button type="submit" disabled={save.isPending}>{!wallet && <Plus size={16} />}{wallet ? 'Salvar alterações' : 'Cadastrar carteira'}</Button>
    </form>
  </section>
}

export function WalletsPage({ next }: { next: string }) {
  const session = useSession()
  const scope = scopeFor(session.data)
  const query = useWallets(scope)
  return <div className="container-shell inner-page">
    <Breadcrumb>Carteiras</Breadcrumb>
    <PageHeading eyebrow="Conta do colecionador" title="Minhas carteiras">Gerencie as carteiras usadas para comprar NFTs.</PageHeading>
    {query.isPending ? <Skeleton className="cart-skeleton" label="Carregando carteiras" /> : query.isError ? <ErrorState failure={query.error} retry={() => void query.refetch()} /> : <div className="account-grid">
      <WalletForm kind="primary" wallet={query.data.find((wallet) => wallet.kind === 'primary')} scope={scope} />
      <WalletForm kind="secondary" wallet={query.data.find((wallet) => wallet.kind === 'secondary')} scope={scope} />
    </div>}
    {next === '/pagamento' && <Button asChild className="return-action"><Link to="/pagamento">Voltar ao pagamento <ArrowRight size={16} /></Link></Button>}
  </div>
}
