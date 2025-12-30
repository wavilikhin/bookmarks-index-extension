// Data loading state atoms
import { atom } from '@reatom/core'

// Loading state atom for initial data load
export const dataLoadingAtom = atom(false, 'auth.dataLoading')
export const dataLoadedAtom = atom(false, 'auth.dataLoaded')
export const dataErrorAtom = atom<string | null>(null, 'auth.dataError')
