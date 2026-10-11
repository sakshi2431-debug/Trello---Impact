import { createContext, useContext } from 'react'

/** The board shown on the board screen, so cards opened from the Inbox panel keep it in view. */
export const ScreenBoardContext = createContext<string | undefined>(undefined)

export function useScreenBoardId() {
  return useContext(ScreenBoardContext)
}
