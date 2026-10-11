import type { CardDates } from '../types'

/** Evidence for a possible connection. The quote comes from the source; the interpretation is the AI's tentative reading. */
export interface Evidence {
  /** e.g. "From Website Launch’s description" */
  sourceLabel: string
  quote: string
  interpretation: string
}

/** Related work Impact noticed. Noticing it does not authorize changing it, and it stays unconfirmed after a question is posted. */
export interface Connection {
  id: string
  cardId: string
  evidence: Evidence
}

/** Explicit inputs for a timing estimate. The user can inspect and edit them; the system does the arithmetic. */
export interface TimingAssumptions {
  /** The card whose date drives the estimate, e.g. Legal Approval. */
  anchorTitle: string
  anchorDate: string
  workingDays: number
  countWeekends: boolean
  /** The related card's current due date, which the estimate never changes. */
  currentDue: string
  /** The related card, e.g. Partner announcement. */
  targetTitle: string
  /** First name of the person asked to confirm the timing. */
  mention?: string
  /** What the offset is counted from, in plain words, e.g. "approval". */
  basis: string
}

export interface CommentProposal {
  id: string
  connection: Connection
  text: string
  /** Once the user edits the comment, changing the timing assumptions no longer rewrites it. */
  isTextEdited?: boolean
  timing?: TimingAssumptions
  isSelected: boolean
  /** Skipped suggestions stay listed so they can be undone; undoing never selects the action. */
  isSkipped: boolean
}

export interface ReviewScope {
  boardTitle: string
  cardCount: number
  checked: string
  notChecked: string
}

export interface Review {
  draftCardId: string
  scope: ReviewScope
  proposals: CommentProposal[]
}

export type ExecutionStatus = 'applying' | 'applied' | 'not-applied' | 'not-run' | 'unknown'

export interface Outcome {
  status: ExecutionStatus
  /** Id used when posting, so an unknown outcome can be verified instead of replayed. */
  commentId?: string
}

/** The initiating change (create the card, or save the date) is always first and required; comments depend on it. */
export const PRIMARY_ACTION_ID = 'primary'

export type ImpactPhase = 'draft' | 'analyzing' | 'review' | 'applying' | 'results'

export interface DateChange {
  from?: string
  to: string
  /** Everything else edited in the Dates popover (start date, time, recurrence, reminder), saved with the due date. */
  dates: CardDates
}

export interface ImpactSession {
  kind: 'new-card' | 'date'
  cardId: string
  /** Set for date reviews: the saved date and the proposed, unsaved date. */
  dateChange?: DateChange
  phase: ImpactPhase
  review?: Review
  outcomes: Record<string, Outcome>
  /** Set while the user has left the review to read a source card. */
  sourceCardId?: string
}
