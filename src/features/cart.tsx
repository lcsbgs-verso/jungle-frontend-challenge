import { Link } from '@tanstack/react-router'
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { problem } from '../api'
import { cartKey, formatEth } from '../domain'
import type { CartLine, Quote } from '../domain'
import { useLive } from '../realtime'
import { scopeFor, useCart, useCartActions, useQuote, useSession } from '../state'
import { Breadcrumb, Empty, ErrorState, Field, Notice, PageHeading, Skeleton } from '../components/shared'
import { Button } from '../components/ui/button'

export function QuoteSummary({ quote, children }: { quote: Quote; children?: ReactNode }) {
  return <section className="summary panel" aria-labelledby="summary-title">
    <h2 id="summary-title">Resumo do pedido</h2>
    <dl>
      <div><dt>Subtotal</dt><dd>{formatEth(quote.subtotal)}</dd></div>
      <div><dt>Desconto{quote.coupon ? ` (${quote.coupon})` : ''}</dt><dd>{quote.discount !== '0' && '−'}{formatEth(quote.discount)}</dd></div>
      <div><dt>Taxa de rede</dt><dd>{formatEth(quote.fee)}</dd></div>
      <div className="summary-total"><dt>Total</dt><dd>{formatEth(quote.total)}</dd></div>
    </dl>
    {children}
  </section>
}

function CartRow({ item, disabled, change, remove }: { item: CartLine; disabled: boolean; change: (quantity: number) => void; remove: () => void }) {
  return <li className="cart-row">
    <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="cart-thumb"><img src={item.image} alt="" width="82" height="82" /></Link>
    <div className="cart-row-info">
      <h2><Link to="/nft/$nftId" params={{ nftId: item.nftId }}>{item.title}</Link></h2>
      <p>{item.edition}</p><span>{formatEth(item.unit)} por unidade</span>
      {item.quantity > item.available && <span className="field-error">{item.available ? `Somente ${item.available} disponíveis` : 'Edição esgotada'}</span>}
    </div>
    <div className="cart-row-controls">
      <div className="quantity-control" aria-label={`Quantidade de ${item.title}`}>
        <Button size="icon" variant="ghost" aria-label={`Diminuir quantidade de ${item.title}`} disabled={disabled || item.quantity <= 1} onClick={() => change(item.quantity - 1)}><Minus size={15} /></Button>
        <span aria-label="Quantidade">{item.quantity}</span>
        <Button size="icon" variant="ghost" aria-label={`Aumentar quantidade de ${item.title}`} disabled={disabled || item.quantity >= item.available} onClick={() => change(item.quantity + 1)}><Plus size={15} /></Button>
      </div>
      <strong>{formatEth(item.amount)}</strong>
      <Button size="icon" variant="ghost" aria-label={`Remover ${item.title}`} disabled={disabled} onClick={remove}><Trash2 size={17} /></Button>
    </div>
  </li>
}

export function CartPage() {
  const session = useSession()
  const scope = scopeFor(session.data)
  const cart = useCart(scope, !session.isPending)
  const quote = useQuote(scope, 'Ethereum', !session.isPending)
  const action = useCartActions(scope)
  const [coupon, setCoupon] = useState('')
  const { change } = useLive()
  const quoteData = quote.data
  return <div className="container-shell inner-page">
    <Breadcrumb>Carrinho</Breadcrumb>
    <PageHeading eyebrow="Sua coleção" title="Carrinho de NFTs">Revise as obras selecionadas antes de continuar.</PageHeading>
    {cart.isError || quote.isError ? <ErrorState failure={cart.error ?? quote.error} retry={() => { void cart.refetch(); void quote.refetch() }} />
      : cart.isPending || !quoteData ? <div className="checkout-grid" aria-label="Carregando carrinho" role="status"><Skeleton className="cart-skeleton" /><Skeleton className="summary-skeleton" /></div>
      : !cart.data.items.length ? <><Empty title="Seu carrinho está vazio">Encontre uma obra que combine com sua coleção.</Empty><Button asChild><Link to="/" hash="catalogo"><ShoppingBag size={17} /> Explorar NFTs</Link></Button></>
      : <div className="checkout-grid">
        <div className="form-stack">
          {change && quoteData.items.some((item) => item.nftId === change.resourceId) && <Notice>O preço ou a disponibilidade de uma obra mudou. Confira o resumo atualizado.</Notice>}
          {quoteData.issues.map((issue) => <Notice kind="error" key={issue}>{issue}</Notice>)}
          <ul className="cart-list panel">{quoteData.items.map((item) => <CartRow key={cartKey(item)} item={item} disabled={action.isPending || quote.isFetching}
            change={(quantity) => action.mutate({ kind: 'item', input: { nftId: item.nftId, editionId: item.editionId, quantity, mode: 'set' } })}
            remove={() => action.mutate({ kind: 'remove', input: item })} />)}</ul>
          {action.isError && action.variables?.kind !== 'coupon' && <Notice kind="error">{problem(action.error).message}</Notice>}
          <form className="coupon-form panel" onSubmit={(event) => {
            event.preventDefault()
            action.mutate({ kind: 'coupon', input: coupon }, { onSuccess: () => setCoupon('') })
          }}>
            <div className="coupon-title"><Tag size={16} /><h2>Cupom de desconto</h2></div>
            {cart.data.coupon ? <div className="coupon-applied"><span role="status">{cart.data.coupon} aplicado</span><Button variant="ghost" size="sm" type="button" onClick={() => action.mutate({ kind: 'coupon', input: '' })} disabled={action.isPending}>Remover cupom</Button></div> :
              <div className="coupon-controls"><Field label="Código do cupom" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Digite o código" error={action.isError && action.variables?.kind === 'coupon' ? problem(action.error).message : undefined} /><Button type="submit" variant="outline" disabled={action.isPending || !coupon.trim()}>Aplicar cupom</Button></div>}
          </form>
        </div>
        <QuoteSummary quote={quoteData}>
          <Button asChild className={`wide ${quoteData.issues.length || quote.isFetching ? 'link-disabled' : ''}`}>
            <Link to="/pagamento" aria-disabled={Boolean(quoteData.issues.length || quote.isFetching)} onClick={(event) => { if (quoteData.issues.length || quote.isFetching) event.preventDefault() }}>
              Ir para pagamento <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild className="wide" variant="ghost"><Link to="/" hash="catalogo">Continuar explorando</Link></Button>
        </QuoteSummary>
      </div>}
  </div>
}
