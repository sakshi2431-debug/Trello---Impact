import { createRoot } from 'react-dom/client'
import '@atlaskit/css-reset'
import { setGlobalTheme } from '@atlaskit/tokens/set-global-theme'
import App from './App.tsx'

setGlobalTheme({ colorMode: 'light' })

// No <StrictMode>: its simulated unmount/remount in development detaches @atlaskit/portal
// containers, so modals opened by URL render into a node that is no longer in the document.
createRoot(document.getElementById('root')!).render(<App />)
