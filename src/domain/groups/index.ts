// Groups domain - consolidated exports
export type { Group, CreateGroupInput, UpdateGroupInput } from './group.types'
export {
  groupsAtom,
  groupsLoadingAtom,
  loadGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups
} from './groups.model'
