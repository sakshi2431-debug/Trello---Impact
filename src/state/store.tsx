import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import { createSeedState, STATE_VERSION } from '../data/seed'
import type { AppState } from '../types'
import { reducer, type Action } from './reducer'

const STORAGE_KEY = 'trello-impact:state'

/** Impact drafts and reviews are in-session only, so a reload starts without them. */
function withoutDrafts(state: AppState): AppState {
  return { ...state, cards: Object.fromEntries(Object.entries(state.cards).filter(([, card]) => !card.isDraft)) }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.version === STATE_VERSION) return withoutDrafts(parsed)
    }
  } catch {
    // Corrupt or unavailable storage falls back to fresh mock data.
  }
  return createSeedState()
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
