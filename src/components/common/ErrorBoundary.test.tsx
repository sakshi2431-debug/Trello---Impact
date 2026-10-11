// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function Broken(): never {
  throw new Error('boom')
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('shows its children when nothing fails', () => {
    const container = document.body.appendChild(document.createElement('div'))
    act(() => createRoot(container).render(<ErrorBoundary>Board</ErrorBoundary>))
    expect(container.textContent).toBe('Board')
  })

  it('replaces a crash with a recoverable page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.body.appendChild(document.createElement('div'))
    act(() =>
      createRoot(container).render(
        <ErrorBoundary>
          <Broken />
        </ErrorBoundary>,
      ),
    )
    expect(container.textContent).toContain('Something went wrong')
    const buttons = Array.from(container.querySelectorAll('button')).map((b) => b.textContent)
    expect(buttons.sort()).toEqual(['Reload', 'Reset demo data'])
  })
})
