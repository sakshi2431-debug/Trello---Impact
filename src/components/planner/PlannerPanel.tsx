import { useEffect, useRef, useState } from 'react'
import Button, { IconButton } from '@atlaskit/button/new'
import { cssMap, cx } from '@atlaskit/css'
import DropdownMenu, { DropdownItemCheckbox, DropdownItemCheckboxGroup } from '@atlaskit/dropdown-menu'
import CalendarIcon from '@atlaskit/icon/core/calendar'
import CheckCircleIcon from '@atlaskit/icon/core/check-circle'
import ChevronLeftIcon from '@atlaskit/icon/core/chevron-left'
import ChevronRightIcon from '@atlaskit/icon/core/chevron-right'
import ShowMoreHorizontalIcon from '@atlaskit/icon/core/show-more-horizontal'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { addDays, parseIsoDate, toIsoDate, todayIso } from '../../lib/dates'
import { navigate, paths } from '../../router'
import { useScreenBoardId } from '../../state/screen'
import { useAppState } from '../../state/store'
import type { Card } from '../../types'
import { isCardDragData, type CardDragData, type DayDropData } from '../board/dnd'
import { BoardSwatch } from '../common/BoardSwatch'
import { Panel } from '../common/Panel'

const styles = cssMap({
  toolbar: { paddingInline: token('space.150'), paddingBlockEnd: token('space.100') },
  days: { flexGrow: 1, minHeight: 0, overflowY: 'auto', paddingInline: token('space.150'), paddingBlockEnd: token('space.150') },
  day: {
    display: 'flex',
    flexDirection: 'column',
    gap: token('space.075'),
    minHeight: '4rem',
    padding: token('space.100'),
    marginBlockEnd: token('space.100'),
    borderRadius: token('radius.large'),
    backgroundColor: token('elevation.surface.sunken'),
  },
  today: {
    borderWidth: token('border.width'),
    borderStyle: 'solid',
    borderColor: token('color.border.selected'),
  },
  dayOver: { backgroundColor: token('color.background.selected') },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: token('space.100'),
    width: '100%',
    textAlign: 'start',
    paddingBlock: token('space.075'),
    paddingInline: token('space.100'),
    borderRadius: token('radius.medium'),
    backgroundColor: token('elevation.surface.raised'),
    boxShadow: token('elevation.shadow.raised'),
    '&:hover': { backgroundColor: token('elevation.surface.raised.hovered') },
  },
  itemText: { flexGrow: 1, minWidth: 0 },
  dragging: { opacity: token('opacity.disabled') },
})

function startOfWeek(date: Date) {
  const day = (date.getDay() + 6) % 7 // Monday = 0
  return addDays(date, -day)
}

/** Planner: this week's due cards by day. Drag a card from a board or the Inbox onto a day to schedule it. */
export function PlannerPanel() {
  const { cards, boards, lists, currentUserId } = useAppState()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [onlyMine, setOnlyMine] = useState(true)
  const days = Array.from({ length: 7 }, (_, i) => toIsoDate(addDays(weekStart, i)))
  const today = todayIso()

  const byDay = new Map<string, Card[]>(days.map((d) => [d, []]))
  for (const card of Object.values(cards)) {
    if (!card.dueDate || card.isArchived || card.isDraft || !byDay.has(card.dueDate)) continue
    const board = boards[card.boardId]
    if (!board || board.isClosed || lists[card.listId]?.isArchived) continue
    if (onlyMine && !card.memberIds.includes(currentUserId)) continue
    byDay.get(card.dueDate)!.push(card)
  }

  const rangeLabel = `${parseIsoDate(days[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${parseIsoDate(days[6]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <Panel
      icon={CalendarIcon}
      title="Planner"
      isWide
      actions={
        <DropdownMenu
          placement="bottom-end"
          trigger={({ triggerRef, ...props }) => <IconButton {...props} ref={triggerRef} appearance="subtle" icon={ShowMoreHorizontalIcon} label="Planner options" />}
        >
          <DropdownItemCheckboxGroup id="planner-options" title="Show">
            <DropdownItemCheckbox id="planner-only-mine" isSelected={onlyMine} onClick={() => setOnlyMine((v) => !v)}>
              Only cards assigned to me
            </DropdownItemCheckbox>
          </DropdownItemCheckboxGroup>
        </DropdownMenu>
      }
    >
      <Box xcss={styles.toolbar}>
        <Inline spread="space-between" alignBlock="center">
          <Text weight="medium">{rangeLabel}</Text>
          <Inline space="space.050" alignBlock="center">
            <IconButton appearance="subtle" spacing="compact" icon={ChevronLeftIcon} label="Previous week" onClick={() => setWeekStart((d) => addDays(d, -7))} />
            <Button spacing="compact" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              Today
            </Button>
            <IconButton appearance="subtle" spacing="compact" icon={ChevronRightIcon} label="Next week" onClick={() => setWeekStart((d) => addDays(d, 7))} />
          </Inline>
        </Inline>
      </Box>
      <Box xcss={styles.days}>
        {days.map((iso) => (
          <PlannerDay key={iso} iso={iso} isToday={iso === today} cards={byDay.get(iso)!} boardTitle={(id) => boards[id]?.title ?? ''} />
        ))}
      </Box>
    </Panel>
  )
}

function PlannerDay({ iso, isToday, cards, boardTitle }: { iso: string; isToday: boolean; cards: Card[]; boardTitle: (id: string) => string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isOver, setOver] = useState(false)
  const date = parseIsoDate(iso)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const data: DayDropData = { type: 'day', iso }
    return dropTargetForElements({
      element,
      canDrop: ({ source }) => isCardDragData(source.data),
      getData: () => ({ ...data }),
      onDragEnter: () => setOver(true),
      onDragLeave: () => setOver(false),
      onDrop: () => setOver(false),
    })
  }, [iso])

  return (
    <Box ref={ref} xcss={cx(styles.day, isToday && styles.today, isOver && styles.dayOver)} role="group" aria-label={date.toDateString()}>
      <Inline space="space.075" alignBlock="baseline">
        <Text size="small" weight="semibold" color={isToday ? 'color.text.selected' : 'color.text.subtle'}>
          {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
        </Text>
        <Text weight="bold" color={isToday ? 'color.text.selected' : 'color.text'}>
          {date.getDate()}
        </Text>
      </Inline>
      {cards.map((card) => (
        <PlannerItem key={card.id} card={card} boardTitle={boardTitle(card.boardId)} />
      ))}
    </Box>
  )
}

function PlannerItem({ card, boardTitle }: { card: Card; boardTitle: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [isDragging, setDragging] = useState(false)
  const { boards } = useAppState()
  const screenBoardId = useScreenBoardId()

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const data: CardDragData = { type: 'card', cardId: card.id, listId: card.listId }
    return draggable({
      element,
      getInitialData: () => ({ ...data }),
      onDragStart: () => setDragging(true),
      onDrop: () => setDragging(false),
    })
  }, [card.id, card.listId])

  return (
    <Pressable ref={ref} xcss={cx(styles.item, isDragging && styles.dragging)} onClick={() => navigate(paths.card(card.id, card.boardId === screenBoardId ? undefined : screenBoardId))}>
      <BoardSwatch accent={boards[card.boardId].accent} />
      <Box as="span" xcss={styles.itemText}>
        <Stack space="space.0">
          <Text maxLines={2}>{card.title}</Text>
          <Text size="small" color="color.text.subtle" maxLines={1}>
            {boardTitle}
          </Text>
        </Stack>
      </Box>
      {card.isDueComplete && <CheckCircleIcon label="Complete" color={token('color.icon.success')} />}
    </Pressable>
  )
}
