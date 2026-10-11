export type AccentColor =
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'purple'
  | 'blue'
  | 'teal'
  | 'lime'
  | 'magenta'

export type Visibility = 'private' | 'workspace' | 'public'

export interface Member {
  id: string
  fullName: string
  username: string
  email: string
  role: string
}

export interface Workspace {
  id: string
  name: string
  shortName: string
  description: string
  visibility: 'private' | 'public'
}

export interface Label {
  id: string
  name: string
  color: AccentColor
}

export interface ChecklistItem {
  id: string
  text: string
  isDone: boolean
}

export interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
}

export interface Attachment {
  id: string
  name: string
  /** File extension in lower case, e.g. "pdf"; "link" for URLs; "card" for a linked Trello card. */
  kind: string
  /** Set when `kind` is "card": the linked card. */
  cardId?: string
  /** Set when `kind` is "link". */
  url?: string
  sizeBytes: number
  addedAt: number
  addedBy: string
}

export interface Comment {
  id: string
  authorId: string
  text: string
  createdAt: number
  editedAt?: number
  /** Set on comments posted by a Trello Impact review, so the card owner can answer it. */
  impact?: ImpactQuestion
}

/** The owner's answer to a question Impact asked: linking the cards is the only thing that confirms a connection. */
export interface ImpactQuestion {
  /** The card the review created or changed, which Link cards attaches. */
  reviewCardId: string
  response?: 'linked' | 'not-related'
}

export interface Activity {
  id: string
  actorId: string
  text: string
  createdAt: number
}

export type Recurrence = 'never' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly'
export type Reminder = 'none' | 'at-time' | '5m' | '10m' | '15m' | '1h' | '2h' | '1d' | '2d'

/** Every field the Dates popover saves together. */
export interface CardDates {
  startDate?: string
  dueDate?: string
  dueTime?: string
  recurring?: Recurrence
  recurringDays?: number[]
  reminder?: Reminder
}

export interface Card {
  id: string
  /** Colour cover shown above the card title, as in Trello. */
  cover?: AccentColor
  boardId: string
  listId: string
  title: string
  description: string
  labelIds: string[]
  memberIds: string[]
  /** ISO date (YYYY-MM-DD). */
  startDate?: string
  /** ISO date (YYYY-MM-DD). */
  dueDate?: string
  /** 24-hour time for the due date, e.g. "15:36". */
  dueTime?: string
  recurring?: Recurrence
  /** Weekdays (0 = Sunday) a weekly recurrence repeats on. */
  recurringDays?: number[]
  reminder?: Reminder
  isDueComplete: boolean
  /** Marked done with the circle next to the title (separate from the due date). */
  isComplete?: boolean
  /** A new card staged by Trello Impact: it exists for review but is not on its list until approved. */
  isDraft?: boolean
  /** The current user follows this card's activity. */
  isWatching?: boolean
  /** When the current user last opened this card; feeds Recently viewed in the Attach popover. */
  lastViewedAt?: number
  /** Earlier titles, so sentences written before a rename still name this card (Impact dependencies). */
  previousTitles?: string[]
  checklists: Checklist[]
  attachments: Attachment[]
  comments: Comment[]
  activity: Activity[]
  isArchived: boolean
  createdAt: number
}

export interface List {
  id: string
  boardId: string
  title: string
  cardIds: string[]
  isArchived: boolean
  /** Trello list colour; undefined keeps the default neutral list. */
  color?: AccentColor
  isCollapsed?: boolean
}

export interface Board {
  id: string
  title: string
  description: string
  accent: AccentColor
  visibility: Visibility
  isStarred: boolean
  memberIds: string[]
  labels: Label[]
  listIds: string[]
  createdAt: number
  lastViewedAt?: number
  isClosed?: boolean
}

export interface Notification {
  id: string
  actorId: string
  cardId: string
  text: string
  createdAt: number
  isRead: boolean
}

export type PanelName = 'inbox' | 'planner' | 'board'


export interface Preferences {
  /** Show label names on card fronts instead of colour bars. */
  showLabelText: boolean
  /** Trello Impact: review what a new card or date change may affect before committing it. */
  /** Research control: how simulated Impact execution behaves, to exercise results and recovery states. */
  /** Panels shown on the board screen, toggled from the bottom navigation bar. */
  panels: Record<PanelName, boolean>
  isTemplatesPromoDismissed: boolean
  bio: string
}

export interface AppState {
  version: number
  currentUserId: string
  workspace: Workspace
  /** Personal Inbox: a list that belongs to a hidden board so cards keep the usual shape. */
  inboxBoardId: string
  inboxListId: string
  preferences: Preferences
  boardOrder: string[]
  boards: Record<string, Board>
  lists: Record<string, List>
  cards: Record<string, Card>
  notifications: Notification[]
}
