import { STATE_VERSION } from '../data/seed'
import type { AppState, Card, List } from '../types'

type SavedState = Record<string, unknown> & { version: number }

/**
 * Upgrades saved state one version at a time, keyed by the version it upgrades from. Add a step whenever
 * STATE_VERSION is bumped for a change of shape. Earlier bumps (up to 10) replaced the demo content itself, so those
 * versions have no step and start again from the seed, after a backup.
 */
const MIGRATIONS: Record<number, (state: SavedState) => SavedState> = {}

export type MigrationResult = { ok: true; state: AppState } | { ok: false; reason: string }

/** Fills fields a partial or hand-edited save may lack, so one missing array can't take the app down. */
function normalize(state: AppState): AppState {
  const cards: Record<string, Card> = {}
  for (const [id, card] of Object.entries(state.cards ?? {})) {
    cards[id] = {
      ...card,
      description: card.description ?? '',
      labelIds: card.labelIds ?? [],
      memberIds: card.memberIds ?? [],
      checklists: card.checklists ?? [],
      attachments: card.attachments ?? [],
      comments: card.comments ?? [],
      activity: card.activity ?? [],
    }
  }
  const lists: Record<string, List> = {}
  for (const [id, list] of Object.entries(state.lists ?? {})) lists[id] = { ...list, cardIds: (list.cardIds ?? []).filter((cardId) => cards[cardId]) }
  return { ...state, cards, lists, notifications: state.notifications ?? [], boardOrder: state.boardOrder ?? Object.keys(state.boards ?? {}) }
}

export function migrateState(raw: unknown): MigrationResult {
  if (!raw || typeof raw !== 'object' || typeof (raw as SavedState).version !== 'number') return { ok: false, reason: 'not a saved board' }
  let state = raw as SavedState
  if (state.version > STATE_VERSION) return { ok: false, reason: `saved by a newer version (${state.version})` }
  while (state.version < STATE_VERSION) {
    const step = MIGRATIONS[state.version]
    if (!step) return { ok: false, reason: `no upgrade from version ${state.version}` }
    state = step(state)
  }
  if (!state.cards || !state.lists || !state.boards) return { ok: false, reason: 'incomplete save' }
  return { ok: true, state: normalize(state as unknown as AppState) }
}
