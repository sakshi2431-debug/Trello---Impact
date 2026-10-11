import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface UiContextValue {
  isCreateBoardOpen: boolean
  openCreateBoard: () => void
  closeCreateBoard: () => void
}

const UiContext = createContext<UiContextValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [isCreateBoardOpen, setCreateBoardOpen] = useState(false)
  const value = useMemo(
    () => ({
      isCreateBoardOpen,
      openCreateBoard: () => setCreateBoardOpen(true),
      closeCreateBoard: () => setCreateBoardOpen(false),
    }),
    [isCreateBoardOpen],
  )
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const value = useContext(UiContext)
  if (!value) throw new Error('useUi must be used inside UiProvider')
  return value
}
