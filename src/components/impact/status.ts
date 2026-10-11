import type { ImpactSession, Outcome } from '../../impact/types'
import type { Card } from '../../types'

export type RowIcon = 'applied' | 'applying' | 'waiting' | 'failed' | 'not-run' | 'unknown' | 'declined'

/** The person's own change, named the same way in every stage. */
export function changeName(session: ImpactSession, card: Card) {
  return session.kind === 'date' ? `Save ${card.title} date` : session.kind === 'description' ? `Save ${card.title} description` : `Create ${card.title}`
}

export function outcomeIcon(outcome: Outcome | undefined): RowIcon {
  switch (outcome?.status) {
    case 'applied':
      return 'applied'
    case 'applying':
      return 'applying'
    case 'not-applied':
      return 'failed'
    case 'not-run':
      return 'not-run'
    case 'unknown':
      return 'unknown'
    default:
      return 'waiting'
  }
}
