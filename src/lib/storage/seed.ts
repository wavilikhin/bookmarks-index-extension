// Sample data seeding for first-time users
import { generateId, createTimestamps } from "@/lib/utils/entity"
import type { Space, Group, Bookmark } from "@/types"

/**
 * Generate sample spaces for a new user
 */
export function getSeedSpaces(userId: string): Space[] {
  const timestamps = createTimestamps()

  return [
    {
      id: generateId("space"),
      userId,
      name: "Work",
      icon: "💼",
      order: 0,
      isArchived: false,
      ...timestamps,
    },
    {
      id: generateId("space"),
      userId,
      name: "Personal",
      icon: "🏠",
      order: 1,
      isArchived: false,
      ...timestamps,
    },
    {
      id: generateId("space"),
      userId,
      name: "Learning",
      icon: "📚",
      order: 2,
      isArchived: false,
      ...timestamps,
    },
  ]
}

/**
 * Generate sample groups for seed spaces
 */
export function getSeedGroups(userId: string, spaces: Space[]): Group[] {
  const timestamps = createTimestamps()
  const workSpace = spaces.find((s) => s.name === "Work")
  const personalSpace = spaces.find((s) => s.name === "Personal")
  const learningSpace = spaces.find((s) => s.name === "Learning")

  const groups: Group[] = []

  if (workSpace) {
    groups.push(
      {
        id: generateId("group"),
        userId,
        spaceId: workSpace.id,
        name: "Development",
        order: 0,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("group"),
        userId,
        spaceId: workSpace.id,
        name: "Design",
        order: 1,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("group"),
        userId,
        spaceId: workSpace.id,
        name: "Documentation",
        order: 2,
        isArchived: false,
        ...timestamps,
      }
    )
  }

  if (personalSpace) {
    groups.push(
      {
        id: generateId("group"),
        userId,
        spaceId: personalSpace.id,
        name: "Social",
        order: 0,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("group"),
        userId,
        spaceId: personalSpace.id,
        name: "Shopping",
        order: 1,
        isArchived: false,
        ...timestamps,
      }
    )
  }

  if (learningSpace) {
    groups.push(
      {
        id: generateId("group"),
        userId,
        spaceId: learningSpace.id,
        name: "Courses",
        order: 0,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("group"),
        userId,
        spaceId: learningSpace.id,
        name: "Articles",
        order: 1,
        isArchived: false,
        ...timestamps,
      }
    )
  }

  return groups
}

/**
 * Generate sample bookmarks for seed groups
 */
export function getSeedBookmarks(
  userId: string,
  spaces: Space[],
  groups: Group[]
): Bookmark[] {
  const timestamps = createTimestamps()
  const bookmarks: Bookmark[] = []

  // Helper to find group and space
  const findGroup = (spaceFilter: string, groupFilter: string) => {
    const space = spaces.find((s) => s.name === spaceFilter)
    if (!space) return null
    return groups.find((g) => g.spaceId === space.id && g.name === groupFilter)
  }

  // Development bookmarks
  const devGroup = findGroup("Work", "Development")
  if (devGroup) {
    const spaceId = devGroup.spaceId
    bookmarks.push(
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: devGroup.id,
        title: "GitHub",
        url: "https://github.com",
        faviconUrl: "https://github.githubassets.com/favicons/favicon.svg",
        order: 0,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: devGroup.id,
        title: "Stack Overflow",
        url: "https://stackoverflow.com",
        order: 1,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: devGroup.id,
        title: "VS Code",
        url: "https://code.visualstudio.com",
        order: 2,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: devGroup.id,
        title: "npm",
        url: "https://npmjs.com",
        order: 3,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      }
    )
  }

  // Design bookmarks
  const designGroup = findGroup("Work", "Design")
  if (designGroup) {
    const spaceId = designGroup.spaceId
    bookmarks.push(
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: designGroup.id,
        title: "Figma",
        url: "https://figma.com",
        order: 0,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: designGroup.id,
        title: "Dribbble",
        url: "https://dribbble.com",
        order: 1,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      }
    )
  }

  // Documentation bookmarks
  const docsGroup = findGroup("Work", "Documentation")
  if (docsGroup) {
    const spaceId = docsGroup.spaceId
    bookmarks.push({
      id: generateId("bookmark"),
      userId,
      spaceId,
      groupId: docsGroup.id,
      title: "MDN Web Docs",
      url: "https://developer.mozilla.org",
      order: 0,
      isPinned: false,
      isArchived: false,
      ...timestamps,
    })
  }

  // Social bookmarks
  const socialGroup = findGroup("Personal", "Social")
  if (socialGroup) {
    const spaceId = socialGroup.spaceId
    bookmarks.push(
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: socialGroup.id,
        title: "Twitter",
        url: "https://twitter.com",
        order: 0,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: socialGroup.id,
        title: "LinkedIn",
        url: "https://linkedin.com",
        order: 1,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      }
    )
  }

  // Shopping bookmarks
  const shoppingGroup = findGroup("Personal", "Shopping")
  if (shoppingGroup) {
    const spaceId = shoppingGroup.spaceId
    bookmarks.push({
      id: generateId("bookmark"),
      userId,
      spaceId,
      groupId: shoppingGroup.id,
      title: "Amazon",
      url: "https://amazon.com",
      order: 0,
      isPinned: false,
      isArchived: false,
      ...timestamps,
    })
  }

  // Courses bookmarks
  const coursesGroup = findGroup("Learning", "Courses")
  if (coursesGroup) {
    const spaceId = coursesGroup.spaceId
    bookmarks.push(
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: coursesGroup.id,
        title: "Udemy",
        url: "https://udemy.com",
        order: 0,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: coursesGroup.id,
        title: "Coursera",
        url: "https://coursera.org",
        order: 1,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      }
    )
  }

  // Articles bookmarks
  const articlesGroup = findGroup("Learning", "Articles")
  if (articlesGroup) {
    const spaceId = articlesGroup.spaceId
    bookmarks.push(
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: articlesGroup.id,
        title: "Medium",
        url: "https://medium.com",
        order: 0,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      },
      {
        id: generateId("bookmark"),
        userId,
        spaceId,
        groupId: articlesGroup.id,
        title: "Dev.to",
        url: "https://dev.to",
        order: 1,
        isPinned: false,
        isArchived: false,
        ...timestamps,
      }
    )
  }

  return bookmarks
}

/**
 * Seed all user data (called on first login)
 */
export function createSeedData(userId: string) {
  const spaces = getSeedSpaces(userId)
  const groups = getSeedGroups(userId, spaces)
  const bookmarks = getSeedBookmarks(userId, spaces, groups)

  return { spaces, groups, bookmarks }
}
