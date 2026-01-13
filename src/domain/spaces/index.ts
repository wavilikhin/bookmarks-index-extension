// Spaces domain - consolidated exports
export type { Space, CreateSpaceInput, UpdateSpaceInput } from './spaces.types'
export {
  spacesAtom,
  getSpaceById,
  loadSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  reorderSpaces
} from './spaces.model'
