import { createSeedState } from '../data/seed'
import { reducer, type Action } from '../state/reducer'
import type { AppState } from '../types'

export const BOARD_ID = 'b-launch'

/** The seeded Marketing launch board, optionally changed by reducer actions, as the app would hold it. */
export function board(...actions: Action[]): AppState {
  return actions.reduce(reducer, createSeedState())
}

export function withDue(state: AppState, cardId: string, dueDate: string): AppState {
  return { ...state, cards: { ...state.cards, [cardId]: { ...state.cards[cardId], dueDate } } }
}
