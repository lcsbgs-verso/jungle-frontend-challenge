import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

// Exact NFTs from Figma mobile home 14:5226
const mobileExactNfts = [
  { id: 'emerald-042', title: 'Emerald Ape #042', creator: 'ApeGenesis', price: '1.19', image: '/nfts/emerald-ape-042.png' },
  { id: 'sage-009', title: 'Sage Nomad #009', creator: 'Nomad Collective', price: '1.69', image: '/nfts/sage-nomad-009.png', badge: 'VERIFICADO' },
  { id: 'neon-052', title: 'Neon Rebel #052', creator: 'Urban Apes', price: '2.45', image: '/nfts/neon-rebel-052.png', badge: 'RARO' },
  { id: 'golden-013', title: 'Golden Beats #013', creator: 'Music Monkeys', price: '3.20', image: '/nfts/golden-beats-013.png' },
]

export function MobileHome() {
  const [slide, setSlide] = useState(0)
  const heroNfts = mobileExactNfts.slice(0, 2)
  const item = heroNfts[slide]

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
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="mobile-hero-images">
            <img src={item.image} alt={item.title} className="mobile-hero-main" />
            <img src={heroNfts[1].image} alt="" className="mobile-hero-small" />
          </div>
        </div>
        <div className="mobile-hero-dots">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              className={index === slide ? 'active' : ''}
              onClick={() => setSlide(Math.min(index, heroNfts.length - 1))}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
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
          <MobileNftCard nft={mobileExactNfts[0]} />
          <MobileNftCard nft={mobileExactNfts[2]} />
        </div>
        <div className="mobile-grid-col-right">
          <MobileNftCard nft={mobileExactNfts[1]} />
          <MobileNftCard nft={mobileExactNfts[3]} />
        </div>
      </div>
    </div>
  )
}

function MobileNftCard({ nft }: { nft: typeof mobileExactNfts[0] }) {
  return (
    <div className="mobile-nft-card">
      <div className="mobile-nft-image-wrapper">
        <img src={nft.image} alt={nft.title} />
        {nft.badge && <div className="mobile-nft-badge">{nft.badge}</div>}
        <button type="button" className="mobile-nft-heart" aria-label="Favoritar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 13L2.5 7.5C1.5 6.5 1.5 4.5 2.5 3.5C3.5 2.5 5.5 2.5 6.5 3.5L8 5L9.5 3.5C10.5 2.5 12.5 2.5 13.5 3.5C14.5 4.5 14.5 6.5 13.5 7.5L8 13Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>
      <div className="mobile-nft-info">
        <p className="mobile-nft-title">{nft.title}</p>
        <div className="mobile-nft-meta">
          <span className="mobile-nft-price">{nft.price} ETH</span>
        </div>
      </div>
    </div>
  )
}

export function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav">
      <button type="button" className="mobile-nav-item active" aria-label="Início">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 9L12 2L21 9V20H15V14H9V20H3V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button type="button" className="mobile-nav-item" aria-label="Favoritos">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 21L3.5 12.5C2 11 2 8.5 3.5 7C5 5.5 7.5 5.5 9 7L12 10L15 7C16.5 5.5 19 5.5 20.5 7C22 8.5 22 11 20.5 12.5L12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      <div className="mobile-nav-center-circle">
        <button type="button" className="mobile-nav-center-btn" aria-label="Escanear">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="6" y="6" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
            <rect x="16" y="6" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
            <rect x="6" y="16" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
            <rect x="16" y="16" width="6" height="6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>
      
      <button type="button" className="mobile-nav-item" aria-label="Carrinho">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 2L6 6V20H11V15H13V20H18V6L15 2H9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button type="button" className="mobile-nav-item" aria-label="Perfil">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 20C4 16.134 7.134 13 11 13H13C16.866 13 20 16.134 20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </nav>
  )
}
