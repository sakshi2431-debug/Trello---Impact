import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import { CURRENT_USER_ID, members } from '../data/members'
import { createSeedState } from '../data/seed'
import { migrateState } from './migrations'
import { WEBSITE_CARD_IDS, WEBSITE_LIST_IDS } from '../data/websiteLaunch'
import type { AppState, Card } from '../types'
import { reducer, type Action } from './reducer'

const STORAGE_KEY = 'trello-impact:state'

/** Impact drafts and reviews are in-session only, so a reload starts without them. */
function withoutDrafts(state: AppState): AppState {
  return { ...state, cards: Object.fromEntries(Object.entries(state.cards).filter(([, card]) => !card.isDraft)) }
}

/**
 * Hidden demo switch for research sessions: ?as=morgan acts as that board member, so the owner's side of an
 * Impact question is answered by the actual owner. Without it, the user is Alex.
 */
function withDemoIdentity(state: AppState): AppState {
  const name = new URLSearchParams(window.location.search).get('as')?.toLowerCase()
  const member = name ? members.find((m) => m.fullName.split(' ')[0].toLowerCase() === name) : undefined
  return { ...state, currentUserId: member?.id ?? CURRENT_USER_ID }
}

const S2_CARD_ID = 'c-launch-a11y-review'
const S2_DESCRIPTION = 'Review keyboard navigation and screen reader support before Website Launch.'

/**
 * Hidden demo switch for Scenario 2: ?scenario=2 starts from the end of Scenario 1 with Morgan's link (the edit case),
 * ?scenario=2-unlinked without it (the ask case). Accessibility review exists in To do with Alex as a member, and both
 * descriptions are reset. It applies once per browser tab, so a reload mid-session keeps the demo's progress.
 */
function withDemoScenario(state: AppState): AppState {
  const scenario = new URLSearchParams(window.location.search).get('scenario')
  if (scenario !== '2' && scenario !== '2-unlinked') return state
  try {
    if (sessionStorage.getItem('trello-impact:scenario') === scenario) return state
    sessionStorage.setItem('trello-impact:scenario', scenario)
  } catch {
    // Without storage the switch applies on every load.
  }
  const seed = createSeedState()
  const now = Date.now()
  const existing = Object.values(state.cards).find((c) => c.boardId === seed.cards[WEBSITE_CARD_IDS.launch].boardId && c.title === 'Accessibility review' && !c.isDraft)
  const review: Card = existing
    ? { ...existing, description: S2_DESCRIPTION, memberIds: existing.memberIds.includes(CURRENT_USER_ID) ? existing.memberIds : [CURRENT_USER_ID, ...existing.memberIds], isArchived: false }
    : {
        id: S2_CARD_ID,
        boardId: seed.cards[WEBSITE_CARD_IDS.launch].boardId,
        listId: WEBSITE_LIST_IDS.todo,
        title: 'Accessibility review',
        description: S2_DESCRIPTION,
        labelIds: [],
        memberIds: [CURRENT_USER_ID],
        isDueComplete: false,
        checklists: [],
        attachments: [],
        comments: [],
        activity: [{ id: 'ac-s2-created', actorId: CURRENT_USER_ID, text: 'added this card to To do', createdAt: now - 3 * 3600_000 }],
        isArchived: false,
        createdAt: now - 3 * 3600_000,
      }
  const launch = state.cards[WEBSITE_CARD_IDS.launch]
  const otherAttachments = launch.attachments.filter((a) => a.cardId !== review.id)
  const linked = scenario === '2'
  const launchCard: Card = {
    ...launch,
    description: seed.cards[WEBSITE_CARD_IDS.launch].description,
    attachments: linked
      ? [...otherAttachments, { id: 'at-s2-link', name: review.title, kind: 'card', cardId: review.id, sizeBytes: 0, addedAt: now - 3 * 3600_000, addedBy: 'm-morgan' }]
      : otherAttachments,
    activity: linked
      ? [{ id: 'ac-s2-link', actorId: 'm-morgan', text: `linked ${review.title} to this card`, createdAt: now - 3 * 3600_000 }, ...launch.activity.filter((a) => a.id !== 'ac-s2-link')]
      : launch.activity.filter((a) => a.id !== 'ac-s2-link'),
  }
  const todo = state.lists[WEBSITE_LIST_IDS.todo]
  return {
    ...state,
    cards: { ...state.cards, [review.id]: review, [launchCard.id]: launchCard },
    lists: todo.cardIds.includes(review.id) ? state.lists : { ...state.lists, [todo.id]: { ...todo, cardIds: [...todo.cardIds, review.id] } },
  }
}

const BACKUP_KEY = 'trello-impact:state:backup'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const result = migrateState(JSON.parse(raw))
      if (result.ok) return withDemoIdentity(withDemoScenario(withoutDrafts(result.state)))
      // Keep what couldn't be read instead of silently losing it, then start from the demo board.
      localStorage.setItem(BACKUP_KEY, raw)
      console.warn(`Saved board not loaded (${result.reason}); a copy is kept in localStorage "${BACKUP_KEY}".`)
    }
  } catch {
    // Corrupt or unavailable storage falls back to fresh mock data.
  }
  return withDemoIdentity(withDemoScenario(createSeedState()))
}

export function resetStoredState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore: storage may be unavailable.
  }
  return createSeedState()
}

const StateContext = createContext<AppState | null>(null)
const DispatchContext = createContext<Dispatch<Action> | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // Quota or privacy mode: the prototype keeps working in memory.
      }
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [state])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState() {
  const state = useContext(StateContext)
  if (!state) throw new Error('useAppState must be used inside StoreProvider')
  return state
}

export function useDispatch() {
  const dispatch = useContext(DispatchContext)
  if (!dispatch) throw new Error('useDispatch must be used inside StoreProvider')
  return dispatch
}
