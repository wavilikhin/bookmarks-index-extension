import { atom, type Atom } from '@reatom/core'

import { withIndexedDBStorage } from '@/lib/indexeddb-storage'

export function persistEntityArray<T>(key: string) {
  return withIndexedDBStorage({
    key,
    toSnapshot: (atoms: Atom<T>[]) => atoms.map((a) => a()),
    fromSnapshot: (snapshot: T[]) => snapshot.map((entity) => atom(entity)),
    version: 1
  })
}
