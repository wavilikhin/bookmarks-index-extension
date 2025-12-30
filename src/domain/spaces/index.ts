// Spaces domain - consolidated exports
export type { Space, CreateSpaceInput, UpdateSpaceInput } from './spaces.types'
export {
  spacesAtom,
  spacesLoadingAtom,
  getSpaceById,
  loadSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  reorderSpaces
} from './spaces.model'
export { getSeedSpaces } from './lib'
