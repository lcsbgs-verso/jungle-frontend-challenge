import { QueryClient, queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { api, getToken, onSessionExpired, problem, rotateGuest, storeToken } from './api'
import type { Cart, CatalogSearch, Collector, Network, Session } from './domain'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 25_000,
      retry: (attempt, failure) => attempt < 1 && ['NETWORK', 'UNAVAILABLE', 'TIMEOUT'].includes(problem(failure).code),
      retryDelay: 500,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
})
export const sessionKey = ['session'] as const
export const sessionOptions = () => queryOptions({
  queryKey: sessionKey,
  queryFn: ({ signal }) => getToken() ? api.session(signal) : Promise.resolve(null),
  retry: false,
})
export const useSession = () => useQuery(sessionOptions())

export function sessionChanged(session: Session | null, expired = false) {
  const previous = getToken()
  storeToken(session?.token ?? '')
  if (previous && !session && !expired) rotateGuest()
  void queryClient.cancelQueries({ queryKey: ['private'] })
  queryClient.removeQueries({ queryKey: ['private'] })
  queryClient.getMutationCache().clear()
  queryClient.setQueryData<Collector | null>(sessionKey, session?.user ?? null)
  void queryClient.invalidateQueries({ queryKey: ['catalog'] })
  void queryClient.invalidateQueries({ queryKey: ['nft'] })
}

onSessionExpired(() => sessionChanged(null, true))

export const scopeFor = (user: Collector | null | undefined) => user ? `${user.id}:${getToken()}` : 'guest'
export const privateKey = (scope: string, kind: string, ...args: unknown[]) => ['private', scope, kind, ...args] as const
export const catalogOptions = (search: CatalogSearch) => queryOptions({
  queryKey: ['catalog', search],
  queryFn: ({ signal }) => api.catalog(search, signal),
})
export const nftOptions = (id: string) => queryOptions({
  queryKey: ['nft', id],
  queryFn: ({ signal }) => api.nft(id, signal),
})
export const useCart = (scope: string, enabled = true) => useQuery({
  queryKey: privateKey(scope, 'cart'),
  queryFn: ({ signal }) => api.cart(signal),
  enabled,
})
export const useQuote = (scope: string, network: Network, enabled = true) => useQuery({
  queryKey: privateKey(scope, 'quote', network),
  queryFn: ({ signal }) => api.quote(network, signal),
  enabled,
})
export const useWallets = (scope: string) => useQuery({
  queryKey: privateKey(scope, 'wallets'),
  queryFn: ({ signal }) => api.wallets(signal),
})
export const useOrder = (scope: string, id: string) => useQuery({
  queryKey: privateKey(scope, 'order', id),
  queryFn: ({ signal }) => api.order(id, signal),
  staleTime: 0,
  refetchInterval: ({ state }) => state.data?.status === 'pending' ? 4500 : false,
})

export function useCartActions(scope: string) {
  return useMutation({
    mutationFn: (action: { kind: 'item'; input: Parameters<typeof api.cartItem>[0] }
      | { kind: 'remove'; input: Parameters<typeof api.removeItem>[0] }
      | { kind: 'coupon'; input: string }) => {
      if (action.kind === 'item') return api.cartItem(action.input)
      if (action.kind === 'remove') return api.removeItem(action.input)
      return api.coupon(action.input)
    },
    onSuccess: (cart: Cart) => {
      queryClient.setQueryData(privateKey(scope, 'cart'), cart)
      void queryClient.invalidateQueries({ queryKey: privateKey(scope, 'quote') })
    },
  })
}

export function useFavorite(scope: string, id: string, signedIn: boolean) {
  const key = privateKey(scope, 'favorites')
  const favorites = useQuery({ queryKey: key, queryFn: ({ signal }) => api.favorites(signal), enabled: signedIn })
  const mutation = useMutation({
    mutationFn: (saved: boolean) => api.favorite(id, saved),
    onMutate: async (saved) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string[]>(key)
      queryClient.setQueryData<string[]>(key, (items = []) => saved ? [...new Set([...items, id])] : items.filter((item) => item !== id))
      return { previous }
    },
    onError: (_, __, context) => {
      if (queryClient.getQueryState(key)) queryClient.setQueryData(key, context?.previous ?? [])
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
  return { saved: favorites.data?.includes(id) ?? false, mutation, ready: favorites.isSuccess }
}

export function reconcile(scope: string) {
  void queryClient.invalidateQueries({ queryKey: ['catalog'] })
  void queryClient.invalidateQueries({ queryKey: ['nft'] })
  for (const kind of ['cart', 'quote', 'order']) void queryClient.invalidateQueries({ queryKey: privateKey(scope, kind) })
}
