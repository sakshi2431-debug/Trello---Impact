import { useEffect, useRef, useState } from 'react'
import Button, { IconButton } from '@atlaskit/button/new'
import { cssMap, cx } from '@atlaskit/css'
import EmptyState from '@atlaskit/empty-state'
import AddIcon from '@atlaskit/icon/core/add'
import CloseIcon from '@atlaskit/icon/core/close'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import type { AppState } from '../../types'
import { BoardHeader, type BoardView } from './BoardHeader'
import { BoardList, LIST_WIDTH } from './BoardList'
import { BoardTable } from './BoardTable'
import { isCardDragData, isListDropData } from './dnd'
import { emptyFilter, matchesFilter, type BoardFilter } from './filters'

const styles = cssMap({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: '20rem',
    height: '100%',
    overflow: 'hidden',
    borderRadius: token('radius.xlarge'),
    borderWidth: token('border.width'),
    borderStyle: 'solid',
    borderColor: token('color.border'),
  },
  canvas: {
    flexGrow: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'flex-start',
    gap: token('space.150'),
    overflowX: 'auto',
    overflowY: 'hidden',
    paddingBlockStart: token('space.050'),
    paddingBlockEnd: token('space.150'),
    paddingInline: token('space.150'),
  },
  addList: { flexShrink: 0, width: LIST_WIDTH },
  addListForm: {
    padding: token('space.100'),
    borderRadius: token('radius.xlarge'),
    backgroundColor: token('elevation.surface.sunken'),
    boxShadow: token('elevation.shadow.raised'),
  },
})

/** Board wallpaper: a light wash of the board colour, as in the redesigned Trello board panel. */
const wallpaperStyles = cssMap({
  green: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.green.subtlest')}, ${token('color.background.accent.green.subtler')})` },
  yellow: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.yellow.subtlest')}, ${token('color.background.accent.yellow.subtler')})` },
  orange: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.orange.subtlest')}, ${token('color.background.accent.orange.subtler')})` },
  red: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.red.subtlest')}, ${token('color.background.accent.red.subtler')})` },
  purple: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.purple.subtlest')}, ${token('color.background.accent.purple.subtler')})` },
  blue: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.blue.subtlest')}, ${token('color.background.accent.blue.subtler')})` },
  teal: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.teal.subtlest')}, ${token('color.background.accent.teal.subtler')})` },
  lime: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.lime.subtlest')}, ${token('color.background.accent.lime.subtler')})` },
  magenta: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.magenta.subtlest')}, ${token('color.background.accent.magenta.subtler')})` },
})

/** Resolves a card drop on a list or another card into the list and index to move to. */
export function resolveCardDrop(state: AppState, cardId: string, target: Record<string | symbol, unknown>) {
  const card = state.cards[cardId]
  if (isListDropData(target)) {
    const list = state.lists[target.listId]
    return { toListId: list.id, toIndex: list.cardIds.filter((id) => id !== cardId).length }
  }
  if (isCardDragData(target)) {
    const list = state.lists[target.listId]
    const indexOfTarget = list.cardIds.indexOf(target.cardId)
    const edge = extractClosestEdge(target)
    if (list.id === card.listId) {
      const startIndex = list.cardIds.indexOf(cardId)
      return { toListId: list.id, toIndex: getReorderDestinationIndex({ startIndex, indexOfTarget, closestEdgeOfTarget: edge, axis: 'vertical' }) }
    }
    return { toListId: list.id, toIndex: edge === 'bottom' ? indexOfTarget + 1 : indexOfTarget }
  }
  return null
}

export function BoardPanel({ boardId }: { boardId: string }) {
  const state = useAppState()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<BoardFilter>(emptyFilter)
  const [view, setView] = useState<BoardView>('board')
  const board = state.boards[boardId]

  const hasCanvas = !!board && !board.isClosed && view === 'board'
  useEffect(() => {
    const element = canvasRef.current
    if (!element) return
    return autoScrollForElements({ element, canScroll: ({ source }) => isCardDragData(source.data) })
  }, [hasCanvas, boardId])

  if (!board || board.isClosed) {
    return (
      <Box xcss={styles.panel}>
        <EmptyState
          header={board?.isClosed ? `${board.title} is closed` : 'Board not found'}
          description={board?.isClosed ? 'Reopen it from "View all closed boards" on the Boards page.' : 'This board may have been closed, or you may not have access to it.'}
          primaryAction={
            <Button appearance="primary" onClick={() => navigate(paths.boards())}>
              Go to your boards
            </Button>
          }
        />
      </Box>
    )
  }

  const listsWithCards = board.listIds.map((listId) => {
    const list = state.lists[listId]
    const visible = list.cardIds.map((id) => state.cards[id]).filter((c) => c && !c.isArchived)
    return { list, visible, shown: visible.filter((c) => matchesFilter(c, filter)) }
  })

  return (
    <Box as="section" aria-label={`${board.title} board`} xcss={cx(styles.panel, wallpaperStyles[board.accent])}>
      <BoardHeader board={board} filter={filter} onFilterChange={setFilter} view={view} onViewChange={setView} />
      {view === 'table' ? (
        <BoardTable board={board} cards={listsWithCards.flatMap((l) => l.shown)} />
      ) : (
        <Box ref={canvasRef} xcss={styles.canvas}>
          {listsWithCards.map(({ list, visible, shown }) => (
            <BoardList
              key={list.id}
              list={list}
              cards={shown}
              labels={board.labels}
              hiddenCount={visible.length - shown.length}
              showLabelText={state.preferences.showLabelText}
            />
          ))}
          <AddList boardId={board.id} />
        </Box>
      )}
    </Box>
  )
}

function AddList({ boardId }: { boardId: string }) {
  const dispatch = useDispatch()
  const [isAdding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  if (!isAdding) {
    return (
      <Box xcss={styles.addList}>
        <Button iconBefore={AddIcon} shouldFitContainer onClick={() => setAdding(true)}>
          Add another list
        </Button>
      </Box>
    )
  }

  const submit = () => {
    if (!title.trim()) return
    dispatch({ type: 'list/create', boardId, title: title.trim() })
    setTitle('')
  }

  return (
    <Box xcss={cx(styles.addList, styles.addListForm)}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Stack space="space.100">
          <Textfield
            autoFocus
            aria-label="List name"
            placeholder="Enter list name…"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
          />
          <Inline space="space.050" alignBlock="center">
            <Button appearance="primary" type="submit">
              Add list
            </Button>
            <IconButton appearance="subtle" icon={CloseIcon} label="Cancel adding a list" onClick={() => setAdding(false)} />
          </Inline>
        </Stack>
      </form>
    </Box>
  )
}
