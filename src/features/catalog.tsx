import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { categories, defaultSearch, formatEth, parseEth } from '../domain'
import type { Catalog, CatalogSearch, Feed, Nft, Sort } from '../domain'
import { catalogOptions } from '../state'
import { Empty, ErrorState, Skeleton } from '../components/shared'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog'

const tabs: { value: Feed; label: string }[] = [
  { value: 'all', label: 'Todos os NFTs' }, { value: 'new', label: 'Novos lançamentos' }, { value: 'trending', label: 'Em alta' },
]

export function NftCard({ nft }: { nft: Nft }) {
  return <article className="nft-card">
    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="nft-art-link" aria-label={`Ver ${nft.title}`}>
      <img src={nft.image} alt={`Retrato digital de ${nft.title}`} width="416" height="416" loading="lazy" />
    </Link>
    <div className="nft-card-body">
      <h3><Link to="/nft/$nftId" params={{ nftId: nft.id }}>{nft.title}</Link></h3>
      <div className="nft-meta"><span>{nft.creator}</span><strong>{formatEth(nft.editions[0].price)}</strong></div>
    </div>
  </article>
}

function Hero({ featured, pending }: { featured: Nft[]; pending: boolean }) {
  const [slide, setSlide] = useState(0)
  const item = featured[slide] ?? featured[0]
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="eyebrow">Bem-vindo à Kurio</p>
      <h1 id="hero-title">SEJA DONO DO FUTURO DA ARTE DIGITAL</h1>
      <p>Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.</p>
      <Button asChild><a href="#catalogo">EXPLORAR</a></Button>
    </div>
    <div className="hero-media">
      {item ? <Link to="/nft/$nftId" params={{ nftId: item.id }} aria-label={`Conhecer ${item.title}`}>
        <img src={item.image} alt={`Retrato digital de ${item.title}`} width="450" height="450" fetchPriority="high" />
      </Link> : pending ? <Skeleton className="hero-placeholder" label="Carregando destaque" /> : <div className="hero-placeholder hero-empty" aria-hidden="true">K.</div>}
      {featured.length > 1 && <div className="hero-dots" aria-label="Destaques">
        {featured.map((nft, index) => <button key={nft.id} type="button" className={index === slide ? 'selected' : ''} aria-label={`Destaque ${index + 1}`} aria-pressed={index === slide} onClick={() => setSlide(index)} />)}
      </div>}
    </div>
  </section>
}

// HeroStats removed - not in Figma reference (invented content)

const networks = [
  { name: 'Ethereum', count: 119 },
  { name: 'Polygon', count: 78 },
  { name: 'Solana', count: 86 },
] as const

function Filters({ search, facets, change }: { search: CatalogSearch; facets?: Catalog['facets']; change: (patch: Partial<CatalogSearch>) => void }) {
  const [min, setMin] = useState(search.min || '0.02')
  const [max, setMax] = useState(search.max || '12.30')
  const [error, setError] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null)
  
  function apply(event: FormEvent) {
    event.preventDefault()
    try {
      const from = min.trim().replace(',', '.')
      const to = max.trim().replace(',', '.')
      if (from) parseEth(from)
      if (to && parseEth(to) < parseEth(from || '0')) throw new Error()
      setError('')
      change({ min: from, max: to })
    } catch {
      setError('Informe uma faixa válida de preços em ETH.')
    }
  }
  
  return <div className="filters-inner">
    <fieldset>
      <legend>Coleções</legend>
      {categories.map((category) => <label className="category-filter" key={category}>
        <input type="checkbox" checked={search.categories.includes(category)} onChange={(event) => {
          const selected = event.target.checked ? [...search.categories, category] : search.categories.filter((item) => item !== category)
          change({ categories: selected.sort() })
        }} />
        <span>{category}</span><small>({facets?.[category] ?? 0})</small>
      </label>)}
    </fieldset>
    
    <form className="price-filter" onSubmit={apply}>
      <h3>Faixa de preço</h3>
      <div className="price-slider-container">
        <div className="price-display">Preço: {min} - {max} ETH</div>
        <div className="price-range-inputs">
          <input 
            type="range" 
            min="0" 
            max="15" 
            step="0.01" 
            value={parseFloat(min)} 
            onChange={(e) => setMin(e.target.value)}
            className="price-range-slider"
          />
          <input 
            type="range" 
            min="0" 
            max="15" 
            step="0.01" 
            value={parseFloat(max)} 
            onChange={(e) => setMax(e.target.value)}
            className="price-range-slider"
          />
        </div>
      </div>
      {error && <span role="alert" className="field-error">{error}</span>}
      <Button size="sm" type="submit">Aplicar</Button>
    </form>
    
    <div className="network-filter">
      <h3>Rede</h3>
      <div className="network-options">
        {networks.map((network) => (
          <button
            key={network.name}
            type="button"
            className={`network-chip ${selectedNetwork === network.name ? 'active' : ''}`}
            onClick={() => setSelectedNetwork(selectedNetwork === network.name ? null : network.name)}
          >
            {network.name} <span className="network-count">{network.count}</span>
          </button>
        ))}
      </div>
    </div>
    
    {(search.categories.length > 0 || search.min || search.max || search.q || search.feed !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setMin('0.02'); setMax('12.30'); change(defaultSearch) }}>Limpar filtros</Button>}
  </div>
}

function FeaturedNftBanner({ featured }: { featured: Nft[] }) {
  const item = featured[0]
  if (!item) return null
  
  return <aside className="featured-nft-banner">
    <div className="featured-header">
      <h3>NFT EM DESTAQUE</h3>
      <div className="limited-offer-badge">OFERTA LIMITADA</div>
    </div>
    <Link to="/nft/$nftId" params={{ nftId: item.id }} className="featured-nft-image">
      <img src={item.image} alt={item.title} width="310" height="368" />
    </Link>
  </aside>
}

export function CatalogPage({ search }: { search: CatalogSearch }) {
  const query = useQuery(catalogOptions(search))
  const navigate = useNavigate()
  const [filters, setFilters] = useState(false)
  const [keyword, setKeyword] = useState(search.q)
  const [lastKeyword, setLastKeyword] = useState(search.q)
  if (lastKeyword !== search.q) {
    setLastKeyword(search.q)
    setKeyword(search.q)
  }

  function change(patch: Partial<CatalogSearch>, scroll = false) {
    void navigate({ to: '/', search: { ...search, page: 1, ...patch }, hash: scroll ? 'catalogo' : undefined, resetScroll: false })
  }

  return <div className="container-shell home-page">
    <Hero featured={query.data?.featured ?? []} pending={query.isPending} />
    <section id="catalogo" className="catalog-section" aria-labelledby="catalog-heading">
      <h2 id="catalog-heading" className="sr-only">Catálogo de NFTs</h2>
      <aside className="filters-panel" aria-label="Filtros do catálogo">
        <Filters key={search.min + ':' + search.max} search={search} facets={query.data?.facets} change={change} />
        <FeaturedNftBanner featured={query.data?.featured ?? []} />
      </aside>
      <div className="catalog-results" aria-busy={query.isFetching}>
        <div className="catalog-toolbar">
          <div className="catalog-tabs" aria-label="Vitrines">
            {tabs.map(({ value, label }) => <button key={value} type="button" aria-pressed={search.feed === value} onClick={() => change({ feed: value })}>{label}</button>)}
          </div>
          <label className="sort-label">Ordenar por:
            <select aria-label="Ordenar por" value={search.sort} onChange={(event) => change({ sort: event.target.value as Sort })}>
              <option value="recent">Listados recentemente</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="popular">Mais populares</option>
            </select>
          </label>
        </div>
        <div className="catalog-search-row">
          <form role="search" onSubmit={(event) => { event.preventDefault(); change({ q: keyword.trim() }) }}>
            <label className="sr-only" htmlFor="catalog-search">Buscar no catálogo</label>
            <input id="catalog-search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Busque por obra ou criador" />
            <Button type="submit" variant="outline" size="sm">Buscar</Button>
          </form>
          <Dialog open={filters} onOpenChange={setFilters}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="mobile-filters"><SlidersHorizontal size={16} /> Filtros</Button></DialogTrigger>
            <DialogContent title="Filtros" drawer>
              <Filters key={search.min + ':' + search.max} search={search} facets={query.data?.facets} change={change} />
              <Button onClick={() => setFilters(false)}>Ver resultados</Button>
            </DialogContent>
          </Dialog>
        </div>
        {query.isPending ? <div className="nft-grid" role="status" aria-label="Carregando catálogo">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="card-skeleton" />)}</div>
          : query.isError ? <ErrorState failure={query.error} retry={() => void query.refetch()} />
          : query.data.items.length ? <>
            <p className="catalog-count" role="status">{query.data.total} {query.data.total === 1 ? 'obra encontrada' : 'obras encontradas'}</p>
            <div className="nft-grid">{query.data.items.map((nft) => <NftCard key={nft.id} nft={nft} />)}</div>
          </> : <Empty title="Nenhum NFT encontrado">Experimente ajustar sua busca ou remover algum filtro.</Empty>}
        {query.data && query.data.pages > 1 && <nav className="pagination" aria-label="Paginação">
          <Button variant="outline" size="icon" aria-label="Página anterior" disabled={search.page <= 1} onClick={() => change({ page: search.page - 1 }, true)}><ChevronLeft size={18} /></Button>
          {Array.from({ length: Math.min(query.data.pages, 4) }, (_, index) => index + 1).map((page) => <Button key={page} variant={page === search.page ? 'default' : 'outline'} size="icon" aria-label={`Página ${page}`} aria-current={page === search.page ? 'page' : undefined} onClick={() => change({ page }, true)}>{page}</Button>)}
          <Button variant="outline" size="icon" aria-label="Próxima página" disabled={search.page >= query.data.pages} onClick={() => change({ page: search.page + 1 }, true)}><ChevronRight size={18} /></Button>
        </nav>}
      </div>
    </section>
    <section className="promo-section">
      <div className="promo-cards">
        <div className="promo-card-horizontal">
          <div className="promo-nft-image">
            {query.data?.featured[2] && <img src={query.data.featured[2].image} alt="NFT em destaque" />}
          </div>
          <div className="promo-text">
            <h3>Lançamentos gênesis<br />de edição limitada</h3>
            <p>Colecione edições escassas diretamente dos criadores antes da revelação pública.</p>
            <button type="button" className="promo-btn">Explorar</button>
          </div>
        </div>
        <div className="promo-card-horizontal">
          <div className="promo-nft-image">
            {query.data?.featured[1] && <img src={query.data.featured[1].image} alt="NFT selecionado" />}
          </div>
          <div className="promo-text">
            <h3>Arte digital selecionada<br />e muito mais</h3>
            <p>Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.</p>
            <button type="button" className="promo-btn">Explorar</button>
          </div>
        </div>
      </div>
    </section>
    
    <section className="blog-section">
      <div className="blog-header">
        <h2>Diário da Cunhagem</h2>
        <p>Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
      </div>
      <div className="blog-cards">
        <article className="blog-card">
          <div className="blog-image">
            <img src="/nfts/blog-857d1393.png" alt="NFT Artwork" loading="lazy" />
          </div>
          <div className="blog-content">
            <p className="blog-meta">12 de setembro | Leitura de 6 min</p>
            <h3>Como funciona a propriedade de NFTs</h3>
            <p>Aprenda a colecionar, negociar e verificar ativos digitais.</p>
            <a href="#artigo" className="blog-cta">Ler mais →</a>
          </div>
        </article>
        <article className="blog-card">
          <div className="blog-image">
            <img src="/nfts/blog-ea42d2b0.png" alt="NFT Artwork" loading="lazy" />
          </div>
          <div className="blog-content">
            <p className="blog-meta">13 de setembro | Leitura de 2 min</p>
            <h3>10 artistas digitais para acompanhar</h3>
            <p>Conheça criadores que moldam a cultura digital.</p>
            <a href="#artigo" className="blog-cta">Ler mais →</a>
          </div>
        </article>
        <article className="blog-card">
          <div className="blog-image">
            <img src="/nfts/blog-945eba15.png" alt="NFT Artwork" loading="lazy" />
          </div>
          <div className="blog-content">
            <p className="blog-meta">15 de setembro | Leitura de 3 min</p>
            <h3>Raridade, atributos e procedência</h3>
            <p>Descubra critérios para avaliar coleções digitais.</p>
            <a href="#artigo" className="blog-cta">Ler mais →</a>
          </div>
        </article>
        <article className="blog-card">
          <div className="blog-image">
            <img src="/nfts/blog-ce6c88ca.png" alt="NFT Artwork" loading="lazy" />
          </div>
          <div className="blog-content">
            <p className="blog-meta">17 de setembro | Leitura de 4 min</p>
            <h3>Guia de segurança para carteiras</h3>
            <p>Proteja seus ativos com práticas recomendadas.</p>
            <a href="#artigo" className="blog-cta">Ler mais →</a>
          </div>
        </article>
      </div>
    </section>
  </div>
}
