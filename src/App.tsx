import { useEffect } from 'react'
import { FlagsProvider } from '@atlaskit/flag'
import { ModalTransition } from '@atlaskit/modal-dialog'
import { Main } from '@atlaskit/navigation-system/layout/main'
import { Root } from '@atlaskit/navigation-system/layout/root'
import { SideNavToggleButton } from '@atlaskit/navigation-system/layout/side-nav'
import { BoardScreen } from './components/board/BoardScreen'
import { CreateBoardModal } from './components/board/CreateBoardModal'
import { CardModal } from './components/card/CardModal'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { HomePage } from './components/home/HomePage'
import { HomeSideNav, SettingsSideNav } from './components/layout/AppSideNav'
import { AppTopNav } from './components/layout/AppTopNav'
import { ActivitySettings, CardsSettings, ExportSettings, PreferenceSettings, ProfileSettings } from './components/settings/SettingsPages'
import { TemplatesPage } from './components/templates/TemplatesPage'
import { MembersPage } from './components/workspace/MembersPage'
import { SettingsPage as WorkspaceSettingsPage } from './components/workspace/SettingsPage'
import { ImpactProvider } from './impact/ImpactProvider'
import { navigate, paths, useRoute, type Route, type SettingsSection } from './router'
import { ScreenBoardContext } from './state/screen'
import { StoreProvider, useAppState } from './state/store'
import { UiProvider } from './state/ui'

export default function App() {
  return (
    <StoreProvider>
      <UiProvider>
        <FlagsProvider>
          <ImpactProvider>
            <Shell />
          </ImpactProvider>
        </FlagsProvider>
      </UiProvider>
    </StoreProvider>
  )
}

const settingsTitles: Record<SettingsSection, string> = {
  profile: 'Profile and visibility',
  activity: 'Activity',
  cards: 'Cards',
  preferences: 'Settings',
  members: 'Members',
  workspace: 'Workspace settings',
  export: 'Export',
}

/** Tab title for pages without a board or card, in Trello's "Page | Workspace" form; Shell adds "| Trello Impact". */
function pageName(route: Route, workspaceName: string) {
  if (route.name === 'home') return 'Home'
  if (route.name === 'templates') return 'Templates'
  if (route.name === 'settings') {
    const title = settingsTitles[route.section]
    return ['members', 'workspace', 'export'].includes(route.section) ? `${title} | ${workspaceName}` : title
  }
  return `Boards | ${workspaceName}`
}

function Shell() {
  const route = useRoute()
  const { cards, boards, workspace, inboxBoardId } = useAppState()
  const card = route.name === 'card' ? cards[route.cardId] : undefined
  // Cards opened from the Inbox or Planner keep the board screen they came from behind them.
  const fromBoardId = route.name === 'card' ? route.fromBoardId : undefined
  const boardId = route.name === 'board' ? route.boardId : (fromBoardId ?? (card && card.boardId !== inboxBoardId ? card.boardId : undefined))
  const hasSideNav = !boardId

  useEffect(() => {
    const board = boardId ? boards[boardId] : undefined
    document.title = `${card ? card.title : board ? board.title : pageName(route, workspace.name)} | Trello Impact`
  }, [card, boardId, boards, workspace.name, route])

  return (
    <>
      <Root>
        <AppTopNav sideNavToggle={hasSideNav ? <SideNavToggleButton collapseLabel="Collapse sidebar" expandLabel="Expand sidebar" /> : undefined} />
        {hasSideNav && (route.name === 'settings' ? <SettingsSideNav section={route.section} /> : <HomeSideNav route={route} />)}
        <Main>
          <Page route={route} boardId={boardId} />
        </Main>
      </Root>
      {/* Root only renders layout slots as direct children, so app-level modals live beside it. */}
      <ScreenBoardContext.Provider value={boardId}>
        <ModalTransition>
          {card && (
            <CardModal key={card.id} cardId={card.id} onClose={() => navigate(boardId ? paths.board(boardId) : paths.boards())} />
          )}
        </ModalTransition>
      </ScreenBoardContext.Provider>
      <CreateBoardModal />
    </>
  )
}

const settingsPages: Record<SettingsSection, () => JSX.Element> = {
  profile: ProfileSettings,
  activity: ActivitySettings,
  cards: CardsSettings,
  preferences: PreferenceSettings,
  members: MembersPage,
  workspace: WorkspaceSettingsPage,
  export: ExportSettings,
}

function Page({ route, boardId }: { route: Route; boardId?: string }) {
  if (boardId) return <BoardScreen boardId={boardId} />
  switch (route.name) {
    case 'settings': {
      const Section = settingsPages[route.section]
      return <Section />
    }
    case 'templates':
      return <TemplatesPage />
    case 'home':
      return <HomePage />
    default:
      return <DashboardPage />
  }
}
