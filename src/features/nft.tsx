import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Heart, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { problem } from '../api'
import { defaultSearch, formatEth } from '../domain'
import type { Nft } from '../domain'
import {
  catalogOptions,
  nftOptions,
  scopeFor,
  useCartActions,
  useFavorite,
  useSession,
} from '../state'
import { Breadcrumb, ErrorState, Notice, Skeleton } from '../components/shared'
import { Button } from '../components/ui/button'
import { NftCard } from './catalog'

function Related({ id }: { id: string }) {
  const query = useQuery(catalogOptions(defaultSearch))
  if (query.isPending)
    return (
      <section className="related" aria-label="Carregando obras relacionadas" role="status">
        <div className="related-grid">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="card-skeleton" />
          ))}
        </div>
      </section>
    )
  if (query.isError)
    return (
      <section className="related">
        <ErrorState failure={query.error} retry={() => void query.refetch()} />
      </section>
    )
  const items = query.data?.items.filter((item) => item.id !== id).slice(0, 5)
  if (!items?.length) return null
  return (
    <section className="related">
      <div className="section-heading">
        <h2>Mais obras para explorar</h2>
        <Link to="/" hash="catalogo">
          Ver mercado <ArrowRight size={15} />
        </Link>
      </div>
      <div className="related-grid">
        {items.map((item) => (
          <NftCard key={item.id} nft={item} />
        ))}
      </div>
    </section>
  )
}

function NftDetails({ nft }: { nft: Nft }) {
  const [image, setImage] = useState(0)
  const [editionId, setEditionId] = useState(nft.editions[0].id)
  const [quantity, setQuantity] = useState(1)
  const session = useSession()
  const scope = scopeFor(session.data)
  const favorite = useFavorite(scope, nft.id, Boolean(session.data))
  const cart = useCartActions(scope)
  const navigate = useNavigate()
  const location = useLocation()
  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]
  const gallery = nft.gallery[image] ?? nft.image
  const invalidQuantity = quantity < 1 || quantity > edition.stock || !Number.isInteger(quantity)
  function add(goToCart: boolean) {
    cart.mutate(
      { kind: 'item', input: { nftId: nft.id, editionId: edition.id, quantity, mode: 'add' } },
      {
        onSuccess: () => {
          if (goToCart) void navigate({ to: '/carrinho' })
        },
      },
    )
  }
  function toggleFavorite() {
    if (!session.data) {
      void navigate({ to: '/entrar', search: { next: location.href } })
      return
    }
    favorite.mutation.mutate(!favorite.saved)
  }
  return (
    <>
      <div className="detail-grid">
        <div className="gallery">
          <div className="gallery-thumbs" aria-label="Galeria da obra">
            {nft.gallery.map((src, index) => (
              <button
                key={src}
                className={index === image ? 'selected' : ''}
                type="button"
                onClick={() => setImage(index)}
                aria-pressed={index === image}
                aria-label={`Mostrar imagem ${index + 1}`}
              >
                <img alt="" src={src} width="72" height="72" />
              </button>
            ))}
          </div>
          <img
            className="main-art"
            src={gallery}
            alt={`${nft.title}, imagem ${image + 1} de ${nft.gallery.length}`}
            width="416"
            height="416"
            fetchPriority="high"
          />
        </div>
        <div className="detail-info">
          <p className="eyebrow">{nft.category}</p>
          <div className="detail-title">
            <h1>{nft.title}</h1>
            <Button
              variant="outline"
              size="icon"
              aria-label={favorite.saved ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              aria-pressed={favorite.saved}
              onClick={toggleFavorite}
              disabled={
                session.isPending ||
                favorite.mutation.isPending ||
                (Boolean(session.data) && !favorite.ready && !favorite.mutation.isSuccess)
              }
            >
              <Heart size={20} fill={favorite.saved ? 'currentColor' : 'none'} />
            </Button>
          </div>
          <p className="muted">
            Criado por <strong>{nft.creator}</strong>
          </p>
          {favorite.query.isError && (
            <Notice kind="error">
              {problem(favorite.query.error).message}
              <Button size="sm" variant="ghost" onClick={() => void favorite.query.refetch()}>
                Tentar carregar favoritos
              </Button>
            </Notice>
          )}
          {favorite.mutation.isError && (
            <Notice kind="error">{problem(favorite.mutation.error).message}</Notice>
          )}
          <div className="detail-price">
            <span>Preço atual</span>
            <strong>{formatEth(edition.price)}</strong>
          </div>
          <label className="field">
            Edição
            <select
              value={edition.id}
              onChange={(event) => {
                setEditionId(event.target.value)
                setQuantity(1)
                cart.reset()
              }}
            >
              {nft.editions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.stock ? '' : ' — esgotada'}
                </option>
              ))}
            </select>
          </label>
          <div className="quantity-row">
            <div>
              <label htmlFor="nft-quantity">Quantidade</label>
              <div className="quantity-control">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Diminuir quantidade"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(quantity - 1)}
                >
                  <Minus size={16} />
                </Button>
                <input
                  id="nft-quantity"
                  type="number"
                  min={1}
                  max={Math.max(1, edition.stock)}
                  step={1}
                  value={quantity || ''}
                  onChange={(event) => setQuantity(event.target.valueAsNumber || 0)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Aumentar quantidade"
                  disabled={quantity >= edition.stock}
                  onClick={() => setQuantity(Math.max(1, quantity + 1))}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
            <span className="muted">
              {edition.stock > 0 ? `${edition.stock} disponíveis` : 'Edição esgotada'}
            </span>
          </div>
          <div className="detail-actions">
            <Button
              type="button"
              onClick={() => add(true)}
              disabled={invalidQuantity || cart.isPending || session.isPending}
            >
              Comprar agora <ArrowRight size={17} />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => add(false)}
              disabled={invalidQuantity || cart.isPending || session.isPending}
            >
              <ShoppingCart size={17} /> Adicionar ao carrinho
            </Button>
          </div>
          {invalidQuantity && edition.stock > 0 && (
            <p className="field-error">Escolha de 1 a {edition.stock} unidades.</p>
          )}
          {cart.isError && <Notice kind="error">{problem(cart.error).message}</Notice>}
          {cart.isSuccess && (
            <Notice kind="success">
              Obra adicionada ao carrinho. <Link to="/carrinho">Ver carrinho</Link>
            </Notice>
          )}
        </div>
      </div>
      <section className="detail-description">
        <h2>Detalhes da obra</h2>
        <p>{nft.description}</p>
        <dl>
          <div>
            <dt>Coleção</dt>
            <dd>Kurio Originals</dd>
          </div>
          <div>
            <dt>Categoria</dt>
            <dd>{nft.category}</dd>
          </div>
          <div>
            <dt>Rede</dt>
            <dd>Ethereum</dd>
          </div>
        </dl>
      </section>
      <Related id={nft.id} />
    </>
  )
}

export function NftPage({ id }: { id: string }) {
  const query = useQuery(nftOptions(id))
  return (
    <div className="container-shell inner-page">
      <Breadcrumb>{query.data?.title ?? 'Detalhes da obra'}</Breadcrumb>
      {query.isPending ? (
        <div className="detail-grid" role="status" aria-label="Carregando detalhes">
          <Skeleton className="detail-skeleton" />
          <Skeleton className="detail-info-skeleton" />
        </div>
      ) : query.isError ? (
        <>
          <h1>
            {problem(query.error).code === 'NFT_NOT_FOUND'
              ? 'NFT não encontrado'
              : 'Detalhes da obra'}
          </h1>
          <ErrorState
            failure={query.error}
            retry={
              problem(query.error).code === 'NFT_NOT_FOUND' ? undefined : () => void query.refetch()
            }
          />
        </>
      ) : (
        <NftDetails key={id} nft={query.data} />
      )}
    </div>
  )
}
