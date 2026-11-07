import { categories } from '../domain'
import type { Collector, Nft, Wallet } from '../domain'

const portraits = [
  ['emerald-ape', 'Emerald Ape #042', 'Kurio Studio', '2.45'],
  ['sage-nomad', 'Sage Nomad #009', 'Nova Forma', '1.75'],
  ['neon-vessel', 'Neon Vessel #552', 'Kurio Studio', '2.29'],
  ['golden-drift', 'Golden Drift #116', 'Terra Atelier', '0.92'],
  ['moss-archive', 'Moss Archive #271', 'Nova Forma', '0.65'],
  ['midnight-runner', 'Midnight Runner #018', 'Studio Órbita', '1.18'],
  ['violet-shift', 'Violet Shift #038', 'Nova Forma', '0.48'],
  ['amber-rover', 'Amber Rover #063', 'Terra Atelier', '0.82'],
  ['silver-origin', 'Silver Origin #099', 'Studio Órbita', '1.25'],
]

export const demoPassword = 'Kurio2026!'
export const demoUsers: Collector[] = [
  { id: 'alice', name: 'Alice Costa', email: 'alice@kurio.test', avatar: '', phone: '(11) 99999-1111' },
  { id: 'bruno', name: 'Bruno Lima', email: 'bruno@kurio.test', avatar: '', phone: '(21) 99999-2222' },
]

export function demoNfts(): Nft[] {
  return Array.from({ length: 27 }, (_, index) => {
    const portrait = index % portraits.length
    const [slug, title, creator, price] = portraits[portrait]
    const series = Math.floor(index / portraits.length)
    return {
      id: series ? `${slug}-${series}` : slug,
      title: series ? `${title.split(' #')[0]} #${100 + index}` : title,
      creator,
      category: categories[(portrait + series) % categories.length],
      description: `${title.split(' #')[0]} é um retrato da coleção Kurio Originals. A obra explora identidade, expressão e cultura digital por meio de texturas, luz e cores de estúdio.`,
      image: `/art/${portrait}.webp`,
      gallery: [`/art/${portrait}.webp`, `/art/${(portrait + 3) % 9}.webp`, `/art/${(portrait + 6) % 9}.webp`],
      editions: [
        { id: 'standard', name: 'Edição original', price, stock: 6 + index % 4 },
        { id: 'collector', name: 'Edição de colecionador', price: String(index + 3), stock: index % 4 === 3 ? 0 : 2 },
      ],
      popularity: 100 - ((index * 7) % 97),
      listedAt: 1000 - index,
      version: 1,
    }
  })
}

export function demoWallets(userId: string): Wallet[] {
  const digit = userId === 'alice' ? 'a' : 'b'
  return [
    { id: `${userId}-primary`, label: 'Minha carteira', address: `0x${digit.repeat(40)}`, kind: 'primary' },
    { id: `${userId}-secondary`, label: 'Carteira reserva', address: `0x${digit.repeat(39)}0`, kind: 'secondary' },
  ]
}
