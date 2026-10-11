import type { CardDates } from '../types'

/** Evidence for a possible connection. The quote comes from the source; the interpretation is the AI's tentative reading. */
export interface Evidence {
  /** e.g. "From Website Launch’s description" */
  sourceLabel: string
  /** e.g. "Website Launch · Description", shown when the source card is open. */
  sourceName: string
  quote: string
  interpretation: string
  /** The card the quote comes from, when it isn't the card the comment is posted on. */
  sourceCardId?: string
}

/** Explicit inputs for a timing estimate. The person can inspect and edit them; the system does the arithmetic. */
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

/** A date clash with no offset to calculate, e.g. "must be done before Website Launch". */
export interface Conflict {
  targetTitle: string
  currentDue?: string
  /** One plain sentence, e.g. "Needs to be done before Website Launch, now due Nov 2." */
  reason: string
}

/** Related work Impact noticed. Noticing it does not authorize changing it, and it stays unconfirmed until the owner links the cards. */
export interface Connection {
  id: string
  cardId: string
  evidence: Evidence
}

export interface CommentProposal {
  id: string
  connection: Connection
  text: string
  /** Set when the finding is a date estimate; its inputs are shown and editable behind Why?. */
  timing?: TimingAssumptions
  /** Set when the finding is a date clash without an offset. */
  conflict?: Conflict
  /** Once the person edits the text, changing timing assumptions no longer rewrites it. */
  isTextEdited?: boolean
  /** Unticking is the only way to exclude an action (spec rule 5). */
  isSelected: boolean
  /**
   * Set when the action edits the other card's description instead of commenting: `text` is the proposed After and
   * this is the Before. Only proposed when the connection is confirmed and the user is a member of that card (rule 4).
   */
  update?: { before: string }
  /** The card Link cards attaches when the owner answers; defaults to the review's own card. */
  linkCardId?: string
  /**
   * Set when the card is reached through other cards: each step from the changed card to this one, with the date it
   * may move to. The first step is the change itself.
   */
  chain?: ChainStep[]
}

export interface ChainStep {
  cardId: string
  title: string
  /** The date this step may move to. */
  date: string
  /** Its due date today; absent for the changed card. */
  currentDue?: string
  /** How it depends on the previous step, e.g. "2 working days after Final homepage copy". */
  link?: string
}

/** One finding that drives several actions (Scenario 2), shown between Change and Actions. */
export interface Finding {
  text: string
  /** e.g. "Morgan linked the two cards · You are a member of Accessibility review" */
  basis: string
  evidence: Evidence
  /** True when the owner linked the cards and the user is a member, so Impact may propose an edit. */
  canEdit: boolean
}

export interface ReviewScope {
  boardTitle: string
  checked: string
  notChecked: string
}

export interface Review {
  scope: ReviewScope
  proposals: CommentProposal[]
  finding?: Finding
}

export type ExecutionStatus = 'waiting' | 'applying' | 'applied' | 'not-applied' | 'not-run' | 'unknown'

export interface Outcome {
  status: ExecutionStatus
  /** Id used when posting, so an unknown outcome can be verified instead of replayed. */
  commentId?: string
  /** Why an action did not run: its dependency failed, or the person stopped applying. */
  notRunReason?: 'dependency' | 'stopped'
}

/** The proposed, unsaved dates of a date review. Everything edited in the Dates popover is saved together. */
export interface DateChange {
  /** The due date saved when the review started. */
  from?: string
  to: string
  dates: CardDates
}

/** An edited, unsaved description (Scenario 2). */
export interface DescriptionChange {
  /** The description saved when the review started. */
  from: string
  to: string
}

/** The user's own change (creating the card, saving the date or the description) is always first and always included; comments depend on it. */
export const PRIMARY_ACTION_ID = 'primary'

/**
 * draft: the card popup shows the draft with Add card / Review impact / Cancel.
 * checking → review → applying → results; done once the person leaves the results, so the Impact tab shows the later view.
 */
export type ImpactPhase = 'draft' | 'checking' | 'review' | 'applying' | 'results' | 'done'

export interface ImpactSession {
  kind: 'new-card' | 'date' | 'description'
  cardId: string
  /** Set for date reviews. */
  dateChange?: DateChange
  /** Set for description reviews. */
  descriptionChange?: DescriptionChange
  phase: ImpactPhase
  review?: Review
  outcomes: Record<string, Outcome>
  /** Set while the person has left the review to read a source card. */
  source?: { cardId: string; proposalId: string }
}

/** Hidden debug switch for research sessions: add ?impact=creation-failed or ?impact=outcome-unknown to the URL. "creation-failed" also fails a date save. */
export type ImpactSimulation = 'success' | 'creation-failed' | 'outcome-unknown'
