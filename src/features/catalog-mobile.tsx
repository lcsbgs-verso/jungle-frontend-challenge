import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { Nft } from '../domain'
import { catalogOptions } from '../state'
import type { CatalogSearch } from '../domain'
import { Skeleton } from '../components/shared'

export function MobileHome({ search }: { search: CatalogSearch }) {
  const query = useQuery(catalogOptions(search))
  const [slide, setSlide] = useState(0)
  const featured = query.data?.featured ?? []
  const item = featured[slide] ?? featured[0]

  return (
    <div className="mobile-home">
      <div className="mobile-search-bar">
        <div className="mobile-search-input">
          <Search size={22} />
          <span className="search-placeholder">Explorar coleções</span>
        </div>
        <button type="button" className="mobile-filter-trigger">
          <SlidersHorizontal size={22} />
        </button>
      </div>

      <section className="mobile-hero">
        <div className="mobile-hero-content">
          <div className="mobile-hero-text">
            <p className="eyebrow">Bem-vindo à Kurio</p>
            <h1>SEJA DONO DA<br />CULTURA DIGITAL</h1>
            <p>Descubra NFTs selecionados de criadores do mundo todo.</p>
            <div className="mobile-hero-cta">
              <span>EXPLORAR</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 12L4 8L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="mobile-hero-images">
            {item ? (
              <>
                <img src={item.image} alt={item.title} className="mobile-hero-main" />
                {featured[1] && <img src={featured[1].image} alt="" className="mobile-hero-small" />}
              </>
            ) : <Skeleton className="mobile-hero-main" />}
          </div>
        </div>
        {featured.length > 1 && (
          <div className="mobile-hero-dots">
            {featured.map((_, index) => (
              <button
                key={index}
                type="button"
                className={index === slide ? 'active' : ''}
                onClick={() => setSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      <div className="mobile-tabs">
        <div className="mobile-tab active">
          <span>Todos os NFTs</span>
          <div className="mobile-tab-underline" />
        </div>
        <span className="mobile-tab">Novos lançamentos</span>
        <span className="mobile-tab">Em alta</span>
      </div>

      <div className="mobile-nft-grid-staggered">
        <div className="mobile-grid-col-left">
          {query.data?.items.filter((_, i) => i % 2 === 0).slice(0, 4).map((nft) => (
            <MobileNftCard key={nft.id} nft={nft} />
          ))}
        </div>
        <div className="mobile-grid-col-right">
          {query.data?.items.filter((_, i) => i % 2 === 1).slice(0, 4).map((nft) => (
            <MobileNftCard key={nft.id} nft={nft} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MobileNftCard({ nft }: { nft: Nft }) {
  return (
    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="mobile-nft-card">
      <div className="mobile-nft-image-wrapper">
        <img src={nft.image} alt={nft.title} />
        <button type="button" className="mobile-nft-heart" aria-label="Favoritar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 13L2.5 7.5C1.5 6.5 1.5 4.5 2.5 3.5C3.5 2.5 5.5 2.5 6.5 3.5L8 5L9.5 3.5C10.5 2.5 12.5 2.5 13.5 3.5C14.5 4.5 14.5 6.5 13.5 7.5L8 13Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>
      <div className="mobile-nft-info">
        <p className="mobile-nft-title">{nft.title}</p>
        <div className="mobile-nft-meta">
          <span className="mobile-nft-creator">{nft.creator}</span>
          <span className="mobile-nft-price">{nft.editions[0].price} ETH</span>
        </div>
      </div>
    </Link>
  )
}

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav">
      <button type="button" className="mobile-nav-item active">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 8L10 2L18 8V18H14V12H6V18H2V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Início</span>
      </button>
      <button type="button" className="mobile-nav-item">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 6V10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>Atividade</span>
      </button>
      
      <div className="mobile-nav-center-circle">
        <button type="button" className="mobile-nav-center-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      
      <button type="button" className="mobile-nav-item">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 18C4 14.686 6.686 12 10 12C13.314 12 16 14.686 16 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>Perfil</span>
      </button>
      <button type="button" className="mobile-nav-item">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6 2L2 6V18H8V14H12V18H18V6L14 2H6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Carrinho</span>
      </button>
    </nav>
  )
}
