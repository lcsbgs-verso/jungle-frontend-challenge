import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Check, CreditCard, LockKeyhole, Wallet as WalletIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { api, problem } from '../api'
import { cartKey, formatEth, networks } from '../domain'
import type { CheckoutDetails, Collector, Network, OrderInput, Quote } from '../domain'
import { useLive } from '../realtime'
import { privateKey, queryClient, scopeFor, useQuote, useSession, useWallets } from '../state'
import { Breadcrumb, Empty, ErrorState, Field, Notice, PageHeading, Skeleton } from '../components/shared'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { QuoteSummary } from './cart'

type Attempt = { key: string; input: OrderInput; orderId?: string }
type Draft = { collector: CheckoutDetails; network: Network; walletId: string }
const attemptKey = (userId: string) => 'kurio.attempt.' + userId
const draftKey = (userId: string) => 'kurio.draft.' + userId
function stored<T>(storage: Storage, key: string): T | null {
  try { return JSON.parse(storage.getItem(key) ?? 'null') as T | null } catch { return null }
}
export function clearAttempt(userId: string, orderId: string) {
  const key = attemptKey(userId)
  if (stored<Attempt>(localStorage, key)?.orderId === orderId) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(draftKey(userId))
  }
}

function validate(collector: CheckoutDetails) {
  const errors: Partial<Record<keyof CheckoutDetails, string>> = {}
  if (collector.name.trim().length < 2) errors.name = 'Digite seu nome completo.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collector.email)) errors.email = 'Digite um e-mail válido.'
  if (!/^\+?[\d\s()-]{8,22}$/.test(collector.phone)) errors.phone = 'Digite um telefone válido.'
  return errors
}

function CheckoutForm({ user }: { user: Collector }) {
  const scope = scopeFor(user)
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Draft>(() => stored<Draft>(sessionStorage, draftKey(user.id)) ?? {
    collector: { name: user.name, email: user.email, phone: user.phone }, network: 'Ethereum', walletId: '',
  })
  const { collector, network } = draft
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({})
  const [connected, setConnected] = useState('')
  const [connectDialog, setConnectDialog] = useState(false)
  const [review, setReview] = useState<Quote | null>(null)
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(() => stored<Attempt>(localStorage, attemptKey(user.id)))
  const submitLock = useRef(false)
  const { change } = useLive()
  const quote = useQuote(scope, network)
  const wallets = useWallets(scope)
  const wallet = wallets.data?.find((item) => item.id === draft.walletId) ?? wallets.data?.find((item) => item.kind === 'primary') ?? wallets.data?.[0]
  const connectionId = `${wallet?.id ?? ''}:${network}`
  const walletConnected = connectionId === connected
  const staleReview = Boolean(review && quote.data && review.id !== quote.data.id)

  useEffect(() => {
    sessionStorage.setItem(draftKey(user.id), JSON.stringify(draft))
  }, [draft, user.id])

  const connect = useMutation({
    mutationFn: (approved: boolean) => api.connectWallet(wallet!.id, network, approved),
    onSuccess: ({ connected: accepted }) => {
      setConnected(accepted ? connectionId : '')
      setConnectDialog(false)
      setNotice(accepted ? '' : 'A conexão da carteira foi recusada. Você pode tentar novamente.')
    },
  })
  const disconnect = useMutation({
    mutationFn: api.disconnectWallet,
    onSuccess: () => { setConnected(''); setNotice('Carteira desconectada.') },
  })
  const refreshQuote = useMutation({
    mutationFn: () => queryClient.fetchQuery({ queryKey: privateKey(scope, 'quote', network), queryFn: ({ signal }) => api.quote(network, signal), staleTime: 0, retry: false }),
  })

  const order = useMutation({
    mutationFn: (saved: Attempt) => api.placeOrder(saved.input, saved.key),
    onSuccess: (result, saved) => {
      const next = { ...saved, orderId: result.id }
      localStorage.setItem(attemptKey(user.id), JSON.stringify(next))
      setAttempt(next)
      queryClient.setQueryData(privateKey(scope, 'order', result.id), result)
      void navigate({ to: '/pedido/$orderId', params: { orderId: result.id } })
    },
    onError: (failure) => {
      const code = problem(failure).code
      if (['QUOTE_CHANGED', 'VALIDATION', 'INVALID_WALLET', 'INVALID_NETWORK', 'WALLET_DISCONNECTED', 'IDEMPOTENCY_CONFLICT'].includes(code)) {
        localStorage.removeItem(attemptKey(user.id))
        setAttempt(null)
        setReview(null)
        if (code === 'WALLET_DISCONNECTED') setConnected('')
        if (code === 'QUOTE_CHANGED') void quote.refetch()
      }
    },
    onSettled: () => { submitLock.current = false },
  })

  function send(saved: Attempt) {
    if (submitLock.current) return
    submitLock.current = true
    localStorage.setItem(attemptKey(user.id), JSON.stringify(saved))
    setAttempt(saved)
    order.mutate(saved)
  }

  function updateCollector(field: keyof CheckoutDetails, value: string) {
    setDraft((previous) => ({ ...previous, collector: { ...previous.collector, [field]: value } }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
  }

  async function reviewOrder(event: FormEvent) {
    event.preventDefault()
    order.reset()
    const issues = validate(collector)
    setErrors(issues)
    if (Object.values(issues).some(Boolean)) {
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus())
      return
    }
    if (!walletConnected || !quote.data) {
      setNotice('Conecte sua carteira para revisar o pedido.')
      return
    }
    const previous = quote.data.id
    setNotice('')
    try {
      const fresh = await refreshQuote.mutateAsync()
      if (fresh.issues.length) return
      if (fresh.id !== previous) {
        setNotice('A cotação mudou. Revise o resumo atualizado antes de continuar.')
        return
      }
      setReview(fresh)
    } catch {
      // The mutation exposes the error beside the review action.
    }
  }

  if (attempt?.orderId) return <div className="panel recovery-panel">
    <h2>Você já tem um pedido em andamento</h2>
    <Button asChild><Link to="/pedido/$orderId" params={{ orderId: attempt.orderId }}>Acompanhar pedido <ArrowRight size={16} /></Link></Button>
  </div>
  if (attempt) return <div className="panel recovery-panel">
    <h2>{order.isPending ? 'Enviando pedido…' : 'Recupere sua tentativa de compra'}</h2>
    <p className="muted">A mesma tentativa será consultada para evitar uma compra duplicada.</p>
    {order.isError && <Notice kind="error">{problem(order.error).message}</Notice>}
    <Button disabled={order.isPending} onClick={() => send(attempt)}>Recuperar pedido <ArrowRight size={16} /></Button>
  </div>
  if (quote.isError || wallets.isError) return <ErrorState failure={quote.error ?? wallets.error} retry={() => { void quote.refetch(); void wallets.refetch() }} />
  if (!quote.data || wallets.isPending) return <div className="checkout-grid" role="status" aria-label="Carregando pagamento"><Skeleton className="cart-skeleton" /><Skeleton className="summary-skeleton" /></div>
  if (!quote.data.items.length) return <><Empty title="Seu carrinho está vazio">Adicione uma obra para continuar para o pagamento.</Empty><Button asChild><Link to="/" hash="catalogo">Explorar NFTs</Link></Button></>
  const quoteData = quote.data

  return <>
    <div className="checkout-grid">
      <form onSubmit={(event) => void reviewOrder(event)} noValidate className="form-stack">
        {change && quoteData.items.some((item) => item.nftId === change.resourceId) && <Notice>O preço ou a disponibilidade de uma obra mudou. Confira a cotação atualizada.</Notice>}
        {notice && <Notice>{notice}</Notice>}
        {order.isError && <Notice kind="error">{problem(order.error).message}</Notice>}
        <section className="panel form-panel">
          <h2><CreditCard size={19} /> Dados do colecionador</h2>
          <Field label="Nome completo" autoComplete="name" value={collector.name} onChange={(event) => updateCollector('name', event.target.value)} error={errors.name} />
          <Field label="E-mail" type="email" autoComplete="email" value={collector.email} onChange={(event) => updateCollector('email', event.target.value)} error={errors.email} />
          <Field label="Telefone" type="tel" autoComplete="tel" value={collector.phone} onChange={(event) => updateCollector('phone', event.target.value)} error={errors.phone} />
        </section>
        <section className="panel form-panel">
          <h2><WalletIcon size={19} /> Carteira e rede</h2>
          <label className="field">Carteira
            <select value={wallet?.id ?? ''} onChange={(event) => { setConnected(''); setDraft({ ...draft, walletId: event.target.value }) }}>
              {!wallet && <option value="">Nenhuma carteira cadastrada</option>}
              {wallets.data?.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.address.slice(0, 8)}…{item.address.slice(-4)}</option>)}
            </select>
          </label>
          {!wallet && <Button asChild variant="outline"><Link to="/carteiras" search={{ next: '/pagamento' }}>Cadastrar carteira</Link></Button>}
          <label className="field">Rede
            <select value={network} onChange={(event) => { setConnected(''); setDraft({ ...draft, network: event.target.value as Network }) }}>
              {networks.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
          {wallet && (walletConnected ? <div className="wallet-connected"><span role="status"><Check size={17} /> Carteira conectada</span><Button type="button" variant="ghost" size="sm" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>Desconectar</Button></div>
            : <Button type="button" variant="outline" onClick={() => { connect.reset(); setConnectDialog(true) }}><WalletIcon size={16} /> Conectar carteira</Button>)}
          {disconnect.isError && <Notice kind="error">{problem(disconnect.error).message}</Notice>}
        </section>
        {quoteData.issues.map((issue) => <Notice key={issue} kind="error">{issue}</Notice>)}
        {refreshQuote.isError && <Notice kind="error">{problem(refreshQuote.error).message}</Notice>}
        <div className="checkout-actions">
          <Button asChild variant="ghost"><Link to="/carrinho">Voltar ao carrinho</Link></Button>
          <Button type="submit" disabled={!walletConnected || quote.isFetching || quoteData.issues.length > 0 || refreshQuote.isPending}>Revisar pedido <ArrowRight size={16} /></Button>
        </div>
      </form>
      <QuoteSummary quote={quoteData}>
        <ul className="summary-items">{quoteData.items.map((item) => <li key={cartKey(item)}><img src={item.image} alt="" width="44" height="44" /><span>{item.title}<small>{item.quantity} × {formatEth(item.unit)}</small></span></li>)}</ul>
        <p className="safe-label"><LockKeyhole size={15} /> Pagamento em ambiente simulado</p>
      </QuoteSummary>
    </div>
    <Dialog open={connectDialog} onOpenChange={setConnectDialog}>
      <DialogContent title="Conectar carteira" description={`Autorize a conexão de ${wallet?.label ?? 'sua carteira'} na rede ${network}.`}>
        <div className="form-stack">
          <p className="muted">A conexão ocorre apenas na simulação.</p>
          {connect.isError && <Notice kind="error">{problem(connect.error).message}</Notice>}
          <div className="dialog-actions">
            <Button variant="outline" disabled={connect.isPending} onClick={() => connect.mutate(false)}>Recusar</Button>
            <Button disabled={connect.isPending} onClick={() => connect.mutate(true)}>Autorizar conexão</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(review)} onOpenChange={(open) => { if (!open && !submitLock.current) setReview(null) }}>
      <DialogContent title="Revise seu pedido" description="Confira a carteira, a rede e o total antes de confirmar.">
        {review && <div className="form-stack">
          <p>{collector.name} · {collector.email}</p><p className="muted">{wallet?.label} · {network}</p>
          <p className="review-total">Total {formatEth(review.total)}</p>
          {staleReview && <Notice kind="error">A cotação mudou durante a revisão. Confira os valores e revise novamente.</Notice>}
          <div className="dialog-actions">
            <Button variant="outline" onClick={() => setReview(null)}>{staleReview ? 'Atualizar revisão' : 'Voltar'}</Button>
            <Button disabled={staleReview || quote.isFetching || order.isPending || !wallet} onClick={() => {
              if (!wallet) return
              const input = { quoteId: review.id, walletId: wallet.id, network, collector }
              setReview(null)
              send({ key: crypto.randomUUID(), input })
            }}>Confirmar compra</Button>
          </div>
        </div>}
      </DialogContent>
    </Dialog>
  </>
}

export function CheckoutPage() {
  const session = useSession()
  return <div className="container-shell inner-page">
    <Breadcrumb>Pagamento</Breadcrumb>
    <PageHeading eyebrow="Finalizar compra" title="Pagamento">Preencha seus dados e revise o pedido com sua carteira.</PageHeading>
    {session.data ? <CheckoutForm key={session.data.id} user={session.data} /> : <Skeleton className="cart-skeleton" label="Carregando sessão" />}
  </div>
}
