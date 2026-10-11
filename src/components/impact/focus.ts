import { useCallback, useRef, useState } from 'react'

interface FocusTrigger {
  element: HTMLElement | null
  label: string | null
}

/** Remembers the control that opened a section, by element and by its accessible name. */
function rememberTrigger(trigger: FocusTrigger) {
  const element = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
  trigger.element = element
  trigger.label = element ? (element.getAttribute('aria-label') ?? element.textContent?.trim() ?? null) : null
}

/**
 * Returns focus to the control that opened a section once it closes (motion audit C6). A trigger that was replaced while
 * the section was open, like Edit, is found again by its accessible name.
 */
function restoreTrigger(trigger: FocusTrigger) {
  if (!trigger.element && !trigger.label) return
  requestAnimationFrame(() => {
    const element = trigger.element?.isConnected
      ? trigger.element
      : Array.from(document.querySelectorAll<HTMLElement>('button')).find((b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === trigger.label)
    element?.focus({ preventScroll: true })
  })
}

/** Open state for Why?, View scope and View calculation that returns focus to its trigger on close. */
export function useDisclosure() {
  const [isOpen, setOpen] = useState(false)
  const openRef = useRef(false)
  const trigger = useRef<FocusTrigger>({ element: null, label: null })
  const set = useCallback((next: boolean | ((current: boolean) => boolean)) => {
    const current = openRef.current
    const value = typeof next === 'function' ? next(current) : next
    openRef.current = value
    if (value && !current) rememberTrigger(trigger.current)
    if (!value && current) restoreTrigger(trigger.current)
    setOpen(value)
  }, [])
  return [isOpen, set] as const
}

/** Wraps a stage's editing state so Save changes and Cancel return focus to the Edit control that opened the form. */
export function useEditFocus(setEditingId: (id: string | null) => void) {
  const trigger = useRef<FocusTrigger>({ element: null, label: null })
  return useCallback(
    (id: string | null) => {
      if (id) rememberTrigger(trigger.current)
      else restoreTrigger(trigger.current)
      setEditingId(id)
    },
    [setEditingId],
  )
}
