import { useState } from 'react'
import { cssMap } from '@atlaskit/css'
import DateLabel from '@atlaskit/date-label'
import Heading from '@atlaskit/heading'
import ClockIcon from '@atlaskit/icon/core/clock'
import PulseIcon from '@atlaskit/icon/core/pulse'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { membersById } from '../../data/members'
import { addDays, formatRelativeTime, formatShortDate, getDueStatus, toIsoDate } from '../../lib/dates'
import { navigate, paths } from '../../router'
import { useAppState } from '../../state/store'
import type { AppState, Card } from '../../types'
import { BoardSwatch } from '../common/BoardSwatch'
import { MemberAvatar } from '../common/MemberAvatar'

const styles = cssMap({
  page: { maxWidth: '46rem', marginInline: 'auto', paddingBlock: token('space.400'), paddingInline: token('space.400') },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: token('space.150'),
    width: '100%',
    textAlign: 'start',
    paddingBlock: token('space.100'),
    paddingInline: token('space.150'),
    borderRadius: token('radius.large'),
    backgroundColor: token('elevation.surface.raised'),
    boxShadow: token('elevation.shadow.raised'),
    '&:hover': { backgroundColor: token('elevation.surface.raised.hovered') },
  },
  grow: { flexGrow: 1, minWidth: 0 },
  activity: { display: 'flex', gap: token('space.100'), alignItems: 'flex-start' },
})

function boardCards(state: AppState) {
  return Object.values(state.cards).filter((c) => {
    const board = state.boards[c.boardId]
    return !c.isArchived && !c.isDraft && board && !board.isClosed && !state.lists[c.listId]?.isArchived
  })
}

/** Home: what needs attention next, and what changed recently across your boards. */
export function HomePage() {
  const state = useAppState()
  const [horizon] = useState(() => toIsoDate(addDays(new Date(), 7)))
  const upNext = boardCards(state)
    .filter((c) => c.memberIds.includes(state.currentUserId) && c.dueDate && !c.isDueComplete && c.dueDate <= horizon)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
    .slice(0, 10)
  const activity = boardCards(state)
    .filter((c) => c.boardId !== state.inboxBoardId)
    .flatMap((card) => card.activity.map((a) => ({ ...a, card })))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 12)

  return (
    <Box xcss={styles.page}>
      <Stack space="space.500">
        <Stack space="space.200">
          <Inline space="space.100" alignBlock="center">
            <ClockIcon label="" color={token('color.icon')} />
            <Heading size="small" as="h2">
              Up next
            </Heading>
          </Inline>
          <Text color="color.text.subtle">Cards assigned to you that are overdue or due in the next 7 days.</Text>
          {upNext.length === 0 ? (
            <Text color="color.text.subtle">Nothing due soon. Nice work.</Text>
          ) : (
            <Stack space="space.100">
              {upNext.map((card) => (
                <CardRow key={card.id} card={card} />
              ))}
            </Stack>
          )}
        </Stack>
        <Stack space="space.200">
          <Inline space="space.100" alignBlock="center">
            <PulseIcon label="" color={token('color.icon')} />
            <Heading size="small" as="h2">
              Recent activity
            </Heading>
          </Inline>
          <Stack space="space.200">
            {activity.map((a) => {
              const actor = membersById[a.actorId]
              return (
                <Box key={a.id} xcss={styles.activity}>
                  <MemberAvatar name={actor.fullName} size="small" />
                  <Stack space="space.025">
                    <Text>
                      <Text weight="semibold">{actor.fullName}</Text> {a.text.replace('this card', `“${a.card.title}”`)}
                    </Text>
                    <Text size="small" color="color.text.subtle">
                      {state.boards[a.card.boardId].title} · {formatRelativeTime(a.createdAt)}
                    </Text>
                  </Stack>
                </Box>
              )
            })}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

function CardRow({ card }: { card: Card }) {
  const { boards, lists } = useAppState()
  const status = getDueStatus(card.dueDate!, card.isDueComplete)
  return (
    <Pressable xcss={styles.row} onClick={() => navigate(paths.card(card.id))}>
      <BoardSwatch accent={boards[card.boardId].accent} />
      <Box as="span" xcss={styles.grow}>
        <Stack space="space.025">
          <Text weight="medium" maxLines={1}>
            {card.title}
          </Text>
          <Text size="small" color="color.text.subtle" maxLines={1}>
            {`${boards[card.boardId].title}: ${lists[card.listId]?.title ?? ''}`}
          </Text>
        </Stack>
      </Box>
      <DateLabel label={formatShortDate(card.dueDate!)} appearance={status === 'overdue' ? 'danger' : status === 'due-soon' ? 'warning' : 'neutral'} iconLabel="" />
    </Pressable>
  )
}
