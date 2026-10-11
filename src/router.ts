import { useEffect, useState } from 'react'

export const settingsSections = ['profile', 'activity', 'cards', 'preferences', 'ai', 'members', 'workspace', 'export'] as const
export type SettingsSection = (typeof settingsSections)[number]

export type Route =
  | { name: 'boards' }
  | { name: 'templates' }
  | { name: 'home' }
  | { name: 'settings'; section: SettingsSection }
  | { name: 'board'; boardId: string }
  /** `fromBoardId` keeps the board screen behind Inbox cards, which have no board of their own. */
  | { name: 'card'; cardId: string; fromBoardId?: string }

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'b' && parts[1]) return { name: 'board', boardId: parts[1] }
  if (parts[0] === 'c' && parts[1]) return { name: 'card', cardId: parts[1], fromBoardId: parts[2] }
  if (parts[0] === 'templates') return { name: 'templates' }
  if (parts[0] === 'home') return { name: 'home' }
  if (parts[0] === 'settings') {
    const section = settingsSections.find((s) => s === parts[1]) ?? 'profile'
    return { name: 'settings', section }
  }
  return { name: 'boards' }
}

export const paths = {
  boards: () => '#/',
  templates: () => '#/templates',
  home: () => '#/home',
  settings: (section: SettingsSection = 'profile') => `#/settings/${section}`,
  board: (boardId: string) => `#/b/${boardId}`,
  card: (cardId: string, fromBoardId?: string) => (fromBoardId ? `#/c/${cardId}/${fromBoardId}` : `#/c/${cardId}`),
}

export function navigate(hash: string) {
  window.location.hash = hash
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
