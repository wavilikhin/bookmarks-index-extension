// Groups domain - consolidated exports
export type { Group, CreateGroupInput, UpdateGroupInput } from './group.types'
export { getSeedGroups } from './lib'
export {
  groupsAtom,
  groupsLoadingAtom,
  loadGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups
} from './groups.model'
