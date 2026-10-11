import { useEffect, useRef } from 'react'
import { cssMap } from '@atlaskit/css'
import { useFlags } from '@atlaskit/flag'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Box } from '@atlaskit/primitives/compiled/box'
import { token } from '@atlaskit/tokens'
import { formatShortDate } from '../../lib/dates'
import { ScreenBoardContext } from '../../state/screen'
import { useAppState, useDispatch } from '../../state/store'
import { InboxPanel } from '../inbox/InboxPanel'
import { PanelSwitcher } from '../layout/PanelSwitcher'
import { PlannerPanel } from '../planner/PlannerPanel'
import { BoardPanel, resolveCardDrop } from './BoardPage'
import { isCardDragData, isDayDropData } from './dnd'

const styles = cssMap({
  screen: {
    display: 'flex',
    gap: token('space.150'),
    height: '100%',
    minHeight: 0,
    overflowX: 'auto',
    paddingBlockStart: token('space.150'),
    paddingInline: token('space.150'),
    // Room for the floating navigation bar.
    paddingBlockEnd: token('space.800'),
    backgroundColor: token('elevation.surface'),
  },
})

/**
 * The redesigned Trello board screen: Inbox, Planner and the board sit side by side as panels,
 * toggled from the bottom navigation bar. Cards can be dragged between all three.
 */
export function BoardScreen({ boardId }: { boardId: string }) {
  const state = useAppState()
  const dispatch = useDispatch()
  const { showFlag } = useFlags()
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })
  const { panels } = state.preferences

  useEffect(() => {
    if (stateRef.current.boards[boardId]) dispatch({ type: 'board/viewed', boardId })
  }, [boardId, dispatch])

  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => isCardDragData(source.data),
        onDrop: ({ source, location }) => {
          const target = location.current.dropTargets[0]
          if (!target || !isCardDragData(source.data)) return
          const cardId = source.data.cardId
          if (isDayDropData(target.data)) {
            dispatch({ type: 'card/setDue', cardId, dueDate: target.data.iso })
            const card = stateRef.current.cards[cardId]
            const isMine = card?.memberIds.includes(stateRef.current.currentUserId)
            showFlag({
              title: `${card?.title ?? 'Card'} is due ${formatShortDate(target.data.iso)}`,
              description: isMine ? undefined : 'It isn’t assigned to you, so Planner shows it only when “Only cards assigned to me” is off.',
              appearance: 'success',
              isAutoDismiss: true,
            })
            return
          }
          const move = resolveCardDrop(stateRef.current, cardId, target.data)
          if (move) dispatch({ type: 'card/move', cardId, ...move })
        },
      }),
    [dispatch, showFlag],
  )

  return (
    <ScreenBoardContext.Provider value={boardId}>
      <Box xcss={styles.screen}>
        {panels.inbox && <InboxPanel />}
        {panels.planner && <PlannerPanel />}
        {/* Keyed so filters and view reset when switching boards. */}
        {panels.board && <BoardPanel key={boardId} boardId={boardId} />}
      </Box>
      <PanelSwitcher />
    </ScreenBoardContext.Provider>
  )
}
