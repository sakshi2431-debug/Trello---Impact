import { useEffect, useMemo, useState } from 'react'
import Button from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import BoardIcon from '@atlaskit/icon/core/board'
import BoardsIcon from '@atlaskit/icon/core/boards'
import CalendarIcon from '@atlaskit/icon/core/calendar'
import InboxIcon from '@atlaskit/icon/core/inbox'
import SearchIcon from '@atlaskit/icon/core/search'
import { ButtonItem, MenuGroup, Section } from '@atlaskit/menu'
import Popup from '@atlaskit/popup'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Text } from '@atlaskit/primitives/compiled/text'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { navigate, paths, useRoute } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import type { Board, PanelName } from '../../types'
import { BoardSwatch } from '../common/BoardSwatch'

const styles = cssMap({
  dock: {
    position: 'fixed',
    insetInline: token('space.0'),
    insetBlockEnd: token('space.150'),
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 300,
  },
  bar: {
    pointerEvents: 'auto',
    padding: token('space.075'),
    borderRadius: token('radius.xlarge'),
    backgroundColor: token('elevation.surface.overlay'),
    boxShadow: token('elevation.shadow.overlay'),
  },
  divider: {
    height: '1.5rem',
    borderInlineStartWidth: token('border.width'),
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: token('color.border'),
  },
  switcher: { width: '20rem', maxWidth: '90vw', paddingBlockStart: token('space.150') },
  search: { paddingInline: token('space.150'), paddingBlockEnd: token('space.100') },
  icon: { display: 'flex', paddingInlineStart: token('space.100') },
  hint: { paddingInline: token('space.200'), paddingBlock: token('space.100') },
})

const panelButtons: { panel: PanelName; label: string; icon: typeof InboxIcon }[] = [
  { panel: 'inbox', label: 'Inbox', icon: InboxIcon },
  { panel: 'planner', label: 'Planner', icon: CalendarIcon },
  { panel: 'board', label: 'Board', icon: BoardIcon },
]

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

/** Floating navigation bar from the redesigned Trello: toggle Inbox, Planner and Board, or switch boards. */
export function PanelSwitcher() {
  const { preferences } = useAppState()
  const dispatch = useDispatch()
  const [isSwitcherOpen, setSwitcherOpen] = useState(false)
  const route = useRoute()

  // Trello opens the board switcher with "B" from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'b' || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      e.preventDefault()
      setSwitcherOpen((open) => !open)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // An open card shows its own tab bar in this spot, as in Trello.
  if (route.name === 'card') return null
  return (
    <Box xcss={styles.dock}>
      <Box as="nav" aria-label="Board screen" xcss={styles.bar}>
        <Inline space="space.050" alignBlock="center">
          {panelButtons.map(({ panel, label, icon }) => (
            <Button key={panel} appearance="subtle" iconBefore={icon} isSelected={preferences.panels[panel]} aria-pressed={preferences.panels[panel]} onClick={() => dispatch({ type: 'preferences/togglePanel', panel })}>
              {label}
            </Button>
          ))}
          <Box xcss={styles.divider} aria-hidden />
          <Popup
            isOpen={isSwitcherOpen}
            onClose={() => setSwitcherOpen(false)}
            placement="top"
            label="Switch boards"
            role="dialog"
            content={() => <BoardSwitcher onDone={() => setSwitcherOpen(false)} />}
            trigger={(triggerProps) => (
              <Button {...triggerProps} appearance="subtle" iconBefore={BoardsIcon} isSelected={isSwitcherOpen} onClick={() => setSwitcherOpen((open) => !open)}>
                Switch boards
              </Button>
            )}
          />
        </Inline>
      </Box>
    </Box>
  )
}

function BoardSwitcher({ onDone }: { onDone: () => void }) {
  const { boards, boardOrder, workspace } = useAppState()
  const [query, setQuery] = useState('')
  const open = boardOrder.map((id) => boards[id]).filter((b) => !b.isClosed)
  const q = query.trim().toLowerCase()

  const sections = useMemo(() => {
    if (q) return [{ title: 'Boards', items: open.filter((b) => b.title.toLowerCase().includes(q)) }]
    return [
      { title: 'Starred', items: open.filter((b) => b.isStarred) },
      { title: 'Recent', items: open.filter((b) => b.lastViewedAt).sort((a, b) => (b.lastViewedAt ?? 0) - (a.lastViewedAt ?? 0)).slice(0, 4) },
      { title: workspace.name, items: open },
    ].filter((s) => s.items.length > 0)
  }, [q, open, workspace.name])

  const go = (board: Board) => {
    onDone()
    navigate(paths.board(board, boards))
  }

  return (
    <Box xcss={styles.switcher}>
      <Box xcss={styles.search}>
        <Textfield
          autoFocus
          aria-label="Search boards"
          placeholder="Search boards"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && sections[0]?.items[0] && go(sections[0].items[0])}
          elemBeforeInput={
            <Box xcss={styles.icon}>
              <SearchIcon label="" color={token('color.icon.subtle')} />
            </Box>
          }
        />
      </Box>
      <MenuGroup maxHeight="50vh" menuLabel="Boards">
        {sections.map((section, i) => (
          <Section key={section.title} title={section.title} hasSeparator={i > 0}>
            {section.items.map((board) => (
              <ButtonItem key={`${section.title}-${board.id}`} iconBefore={<BoardSwatch accent={board.accent} />} onClick={() => go(board)}>
                {board.title}
              </ButtonItem>
            ))}
          </Section>
        ))}
      </MenuGroup>
      {sections.length === 0 && (
        <Box xcss={styles.hint}>
          <Text color="color.text.subtle">No boards match “{query.trim()}”.</Text>
        </Box>
      )}
    </Box>
  )
}
