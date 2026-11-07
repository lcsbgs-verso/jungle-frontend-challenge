import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { getToken } from './api'
import type { Catalog, Nft, Order, OrderEvent, VersionedEvent } from './domain'
import { privateKey, queryClient, reconcile, sessionChanged } from './state'

type LiveStatus = { connected: boolean; change: VersionedEvent | null }
const LiveContext = createContext<LiveStatus>({ connected: false, change: null })
export const useLive = () => useContext(LiveContext)

export function LiveProvider({
  userId,
  scope,
  children,
}: {
  userId?: string
  scope: string
  children: React.ReactNode
}) {
  const [live, setLive] = useState<LiveStatus>({ connected: false, change: null })
  useEffect(() => {
    console.log('[LiveProvider] useEffect starting, scope:', scope, 'userId:', userId)
    const versions = new Map<string, number>()
    const seen = new Set<string>()
    let stopped = false
    const session = getToken()
    const current = () => !stopped && session === getToken()
    const socketUrl = import.meta.env.VITE_SOCKET_URL || location.origin
    console.log('[LiveProvider] Creating socket to:', socketUrl, 'with session:', session ? 'present' : 'none')
    const socket = io(socketUrl, {
      transports: ['websocket'],
      query: session ? { session } : {},
      reconnectionDelay: 600,
      reconnectionDelayMax: 3500,
      autoConnect: false,
    })
    console.log('[LiveProvider] Socket created, calling connect()')
    const accept = (topic: string, event: VersionedEvent) => {
      const resource = topic + ':' + event.resourceId
      if (!current() || seen.has(event.id) || (versions.get(resource) ?? 0) >= event.version)
        return false
      const cachedVersion =
        topic === 'order'
          ? (queryClient.getQueryData<Order>(privateKey(scope, 'order', event.resourceId))
              ?.version ?? 0)
          : Math.max(
              queryClient.getQueryData<Nft>(['nft', event.resourceId])?.version ?? 0,
              ...queryClient
                .getQueriesData<Catalog>({ queryKey: ['catalog'] })
                .flatMap(([, catalog]) =>
                  catalog
                    ? [...catalog.items, ...catalog.featured]
                        .filter((nft) => nft.id === event.resourceId)
                        .map((nft) => nft.version)
                    : [],
                ),
            )
      if (event.version < cachedVersion) return false
      versions.set(resource, event.version)
      seen.add(event.id)
      if (seen.size > 500) seen.delete(seen.values().next().value!)
      return true
    }
    socket.on('connect', () => {
      console.log('[LiveProvider] Socket connected!')
      if (!current()) return
      setLive((status) => ({ ...status, connected: true }))
      reconcile(scope)
    })
    socket.on('disconnect', (reason) => {
      console.log('[LiveProvider] Socket disconnected, reason:', reason)
      if (current()) setLive((status) => ({ ...status, connected: false }))
    })
    socket.on('connect_error', (error) => {
      console.error('[LiveProvider] Socket connection error:', error)
    })
    socket.on('nft.updated', (event: VersionedEvent) => {
      if (!accept('nft', event)) return
      setLive({ connected: true, change: event })
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
      void queryClient.invalidateQueries({ queryKey: ['nft', event.resourceId] })
      void queryClient.invalidateQueries({ queryKey: privateKey(scope, 'cart') })
      void queryClient.invalidateQueries({ queryKey: privateKey(scope, 'quote') })
    })
    socket.on('order.updated', (event: OrderEvent) => {
      if (event.userId !== userId || !accept('order', event)) return
      void queryClient.invalidateQueries({ queryKey: privateKey(scope, 'order', event.resourceId) })
      void queryClient.invalidateQueries({ queryKey: privateKey(scope, 'cart') })
      void queryClient.invalidateQueries({ queryKey: privateKey(scope, 'quote') })
    })
    socket.on('demo.reset', () => {
      if (current()) sessionChanged(null)
    })
    console.log('[LiveProvider] Calling socket.connect()')
    socket.connect()
    return () => {
      console.log('[LiveProvider] Cleanup: disconnecting socket')
      stopped = true
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [scope, userId])
  return <LiveContext.Provider value={live}>{children}</LiveContext.Provider>
}
