import { Link } from '@tanstack/react-router'
import { CircleCheck, CircleX, Clock3, Copy, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cartKey, formatEth } from '../domain'
import { useLive } from '../realtime'
import { privateKey, queryClient, scopeFor, useOrder, useSession } from '../state'
import { Breadcrumb, ErrorState, Notice, Skeleton } from '../components/shared'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog'
import { QuoteSummary } from './cart'
import { clearAttempt } from './checkout'

export function OrderPage({ id }: { id: string }) {
  const { data: user } = useSession()
  const scope = scopeFor(user)
  const query = useOrder(scope, id)
  const order = query.data
  const live = useLive()
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!order || order.status === 'pending' || !user) return
    clearAttempt(user.id, order.id)
    void queryClient.invalidateQueries({ queryKey: privateKey(scope, 'cart') })
    void queryClient.invalidateQueries({ queryKey: privateKey(scope, 'quote') })
  }, [order, scope, user])

  const pending = order?.status === 'pending'
  const confirmed = order?.status === 'confirmed'
  const Icon = pending ? Clock3 : confirmed ? CircleCheck : CircleX
  return (
    <div className="container-shell inner-page">
      <Breadcrumb>Pedido</Breadcrumb>
      {query.isPending ? (
        <Skeleton className="order-skeleton" label="Carregando pedido" />
      ) : query.isError ? (
        <ErrorState failure={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <section className="order-receipt panel" aria-labelledby="order-title">
            <div className={`order-icon ${confirmed ? 'confirmed' : ''}`}>
              <Icon size={30} />
            </div>
            <p className="eyebrow">Pedido {order!.id.slice(0, 8).toUpperCase()}</p>
            <h1 id="order-title" aria-live="polite">
              {pending ? 'Pedido pendente' : confirmed ? 'Pedido confirmado' : 'Pagamento recusado'}
            </h1>
            {pending ? (
              <Notice>
                {live.connected
                  ? 'Estamos aguardando a confirmação da transação simulada.'
                  : 'Conexão interrompida. O pedido será consultado ao reconectar.'}
              </Notice>
            ) : confirmed ? (
              <p className="muted">
                Sua compra foi confirmada. Confira abaixo os dados da transação.
              </p>
            ) : (
              <Notice kind="error">{order!.reason} Seus itens continuam no carrinho.</Notice>
            )}
            <dl className="order-facts">
              <div>
                <dt>Colecionador</dt>
                <dd>{order!.collector.name}</dd>
              </div>
              <div>
                <dt>Rede</dt>
                <dd>{order!.quote.network}</dd>
              </div>
              <div>
                <dt>Carteira</dt>
                <dd>{order!.wallet.label}</dd>
              </div>
              {order!.transaction && (
                <div className="transaction">
                  <dt>Transação simulada</dt>
                  <dd>
                    <code>{order!.transaction}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Copiar transação"
                      onClick={() => {
                        void navigator.clipboard
                          .writeText(order!.transaction!)
                          .then(() => setCopied(true))
                          .catch(() => setCopied(false))
                      }}
                    >
                      <Copy size={16} />
                    </Button>
                  </dd>
                </div>
              )}
            </dl>
            {copied && (
              <p role="status" className="muted">
                Transação copiada.
              </p>
            )}
            {order!.transaction && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ExternalLink size={14} /> Ver transação simulada
                  </Button>
                </DialogTrigger>
                <DialogContent
                  title="Explorador simulado"
                  description="Detalhes da transação desta demonstração."
                >
                  <div className="form-stack">
                    <p>Status confirmado · {order!.quote.network}</p>
                    <code className="transaction-code">{order!.transaction}</code>
                    <p className="muted">Identificador gerado pela API simulada.</p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <ul className="summary-items">
              {order!.quote.items.map((item) => (
                <li key={cartKey(item)}>
                  <img src={item.image} alt="" width="44" height="44" />
                  <span>
                    {item.title}
                    <small>
                      {item.quantity} × {formatEth(item.unit)}
                    </small>
                  </span>
                  <strong>{formatEth(item.amount)}</strong>
                </li>
              ))}
            </ul>
            <QuoteSummary quote={order!.quote} />
            {pending ? (
              <Button
                type="button"
                variant="outline"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                Consultar status
              </Button>
            ) : confirmed ? (
              <Button asChild>
                <Link to="/" hash="catalogo">
                  Voltar ao marketplace
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/carrinho">Voltar ao carrinho</Link>
              </Button>
            )}
          </section>
        </>
      )}
    </div>
  )
}
