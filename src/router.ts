import { useEffect, useState } from 'react'
import type { Board } from './types'

const settingsSections = ['profile', 'activity', 'cards', 'preferences', 'members', 'workspace', 'export'] as const
export type SettingsSection = (typeof settingsSections)[number]

export type Route =
  | { name: 'boards' }
  | { name: 'templates' }
  | { name: 'home' }
  | { name: 'settings'; section: SettingsSection }
  /** `boardRef` is the board's readable slug (e.g. `marketing-launch`) or, for older links, its id. */
  | { name: 'board'; boardRef: string }
  /** `fromBoardId` keeps the board screen behind Inbox cards, which have no board of their own. */
  | { name: 'card'; cardId: string; fromBoardId?: string }

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'b' && parts[1]) return { name: 'board', boardRef: decodeURIComponent(parts[1]) }
  if (parts[0] === 'c' && parts[1]) return { name: 'card', cardId: parts[1], fromBoardId: parts[2] }
  if (parts[0] === 'templates') return { name: 'templates' }
  if (parts[0] === 'home') return { name: 'home' }
  if (parts[0] === 'settings') {
    const section = settingsSections.find((s) => s === parts[1]) ?? 'profile'
    return { name: 'settings', section }
  }
  return { name: 'boards' }
}

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Readable part of a board address: its title as a slug, like Trello's `/b/<id>/marketing-launch`. A board whose
 * title another board already uses keeps its id, so every address opens exactly one board.
 */
function boardSlug(board: Pick<Board, 'id' | 'title'>, boards: Record<string, Board>) {
  const slug = slugify(board.title)
  const isShared = Object.values(boards).some((b) => b.id !== board.id && slugify(b.title) === slug)
  return slug && !isShared ? slug : board.id
}

/** The board an address points at: an id from an older link, or the slug paths.board produced. */
export function resolveBoardRef(ref: string, boards: Record<string, Board>) {
  if (boards[ref]) return ref
  return Object.values(boards).find((b) => boardSlug(b, boards) === ref)?.id
}

export const paths = {
  boards: () => '#/',
  templates: () => '#/templates',
  home: () => '#/home',
  settings: (section: SettingsSection = 'profile') => `#/settings/${section}`,
  /** Pass the current boards so a shared title falls back to the id. A board just created may not be in them yet. */
  board: (board: Pick<Board, 'id' | 'title'>, boards: Record<string, Board>) => `#/b/${encodeURIComponent(boardSlug(board, boards))}`,
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
