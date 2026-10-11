import { useEffect, useRef, useState } from 'react'
import { IconButton } from '@atlaskit/button/new'
import { cssMap, cx } from '@atlaskit/css'
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu'
import { useFlags } from '@atlaskit/flag'
import FilterIcon from '@atlaskit/icon/core/filter'
import InboxIcon from '@atlaskit/icon/core/inbox'
import ShowMoreHorizontalIcon from '@atlaskit/icon/core/show-more-horizontal'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { createId } from '../../lib/random'
import { useAppState, useDispatch } from '../../state/store'
import { BoardCard } from '../board/BoardCard'
import { isCardDragData, type ListDropData } from '../board/dnd'
import { Panel } from '../common/Panel'

const styles = cssMap({
  top: { paddingInline: token('space.150'), paddingBlockEnd: token('space.100') },
  cards: {
    flexGrow: 1,
    minHeight: '3rem',
    overflowY: 'auto',
    listStyle: 'none',
    marginBlock: token('space.0'),
    display: 'flex',
    flexDirection: 'column',
    gap: token('space.100'),
    paddingBlock: token('space.050'),
    paddingInline: token('space.150'),
  },
  over: { backgroundColor: token('color.background.neutral.subtle.hovered') },
  empty: { paddingInline: token('space.200'), paddingBlock: token('space.200') },
})

/** Personal Inbox: quick capture for to-dos before they are sorted onto a board. */
export function InboxPanel() {
  const { inboxListId, inboxBoardId, lists, cards, boards, preferences } = useAppState()
  const dispatch = useDispatch()
  const { showFlag } = useFlags()
  const listRef = useRef<HTMLOListElement>(null)
  const [draft, setDraft] = useState('')
  const [isFilterOpen, setFilterOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isOver, setOver] = useState(false)
  const inboxCards = lists[inboxListId].cardIds.map((id) => cards[id]).filter((c) => c && !c.isArchived)
  const shown = inboxCards.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    const element = listRef.current
    if (!element) return
    const data: ListDropData = { type: 'list', listId: inboxListId }
    return combine(
      dropTargetForElements({
        element,
        canDrop: ({ source }) => isCardDragData(source.data),
        getData: () => ({ ...data }),
        onDragEnter: () => setOver(true),
        onDragLeave: () => setOver(false),
        onDrop: () => setOver(false),
      }),
      autoScrollForElements({ element, canScroll: ({ source }) => isCardDragData(source.data) }),
    )
  }, [inboxListId])

  return (
    <Panel
      icon={InboxIcon}
      title="Inbox"
      actions={
        <>
          <IconButton appearance="subtle" icon={FilterIcon} label="Filter Inbox" isSelected={isFilterOpen} onClick={() => setFilterOpen((v) => !v)} />
          <DropdownMenu
            placement="bottom-end"
            trigger={({ triggerRef, ...props }) => <IconButton {...props} ref={triggerRef} appearance="subtle" icon={ShowMoreHorizontalIcon} label="Inbox actions" />}
          >
            <DropdownItemGroup title="Inbox">
              <DropdownItem
                isDisabled={inboxCards.length === 0}
                onClick={() => {
                  inboxCards.forEach((c) => dispatch({ type: 'card/setArchived', cardId: c.id, isArchived: true }))
                  showFlag({
                    title: `Archived ${inboxCards.length} Inbox card${inboxCards.length === 1 ? '' : 's'}`,
                    isAutoDismiss: true,
                    actions: [{ content: 'Undo', onClick: () => inboxCards.forEach((c) => dispatch({ type: 'card/setArchived', cardId: c.id, isArchived: false })) }],
                  })
                }}
              >
                Archive all cards
              </DropdownItem>
            </DropdownItemGroup>
          </DropdownMenu>
        </>
      }
    >
      <Box xcss={styles.top}>
        <Stack space="space.100">
          {isFilterOpen && (
            <Textfield autoFocus aria-label="Filter Inbox cards" placeholder="Filter cards" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
          )}
          <Textfield
            aria-label="Add a card to Inbox"
            placeholder="Add a card"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                dispatch({ type: 'card/create', id: createId('c'), listId: inboxListId, title: draft.trim(), position: 'top' })
                setDraft('')
              }
              if (e.key === 'Escape') setDraft('')
            }}
          />
        </Stack>
      </Box>
      <Box ref={listRef} as="ol" xcss={cx(styles.cards, isOver && styles.over)} aria-label="Inbox cards">
        {shown.map((card) => (
          <BoardCard key={card.id} card={card} labels={boards[inboxBoardId].labels} showLabelText={preferences.showLabelText} />
        ))}
      </Box>
      {shown.length === 0 && (
        <Box xcss={styles.empty}>
          <Text color="color.text.subtle">{query.trim() ? 'No Inbox cards match.' : 'Capture to-dos here, then drag them onto a board or the Planner.'}</Text>
        </Box>
      )}
    </Panel>
  )
}
