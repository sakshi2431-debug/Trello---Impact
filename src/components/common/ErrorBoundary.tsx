import { Component, type ErrorInfo, type ReactNode } from 'react'
import Button from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import EmptyState from '@atlaskit/empty-state'
import { Box } from '@atlaskit/primitives/compiled/box'
import { token } from '@atlaskit/tokens'
import { resetStoredState } from '../../state/store'

const styles = cssMap({
  page: { minHeight: '100vh', paddingBlock: token('space.1000'), backgroundColor: token('elevation.surface') },
})

/**
 * Last line of defence: a render error shows a recoverable page instead of a blank screen. Demo data saved by an older
 * version is the likeliest cause, so resetting it is offered alongside reloading.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // There is no error service in this prototype; keep the details for whoever opens the console.
    console.error('Trello Impact prototype crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <Box xcss={styles.page}>
        <EmptyState
          header="Something went wrong"
          description="The board couldn’t be shown. Reload to try again. If it keeps happening, reset the demo data to start from the original board."
          primaryAction={
            <Button appearance="primary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          }
          secondaryAction={
            <Button
              onClick={() => {
                resetStoredState()
                window.location.reload()
              }}
            >
              Reset demo data
            </Button>
          }
        />
      </Box>
    )
  }
}
