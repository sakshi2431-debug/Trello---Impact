import { useState } from 'react'
import Badge from '@atlaskit/badge'
import Button from '@atlaskit/button/new'
import { cssMap, cx } from '@atlaskit/css'
import Heading from '@atlaskit/heading'
import { Notifications } from '@atlaskit/navigation-system/top-nav-items'
import Popup from '@atlaskit/popup'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { membersById } from '../../data/members'
import { formatRelativeTime } from '../../lib/dates'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import { MemberAvatar } from '../common/MemberAvatar'

const styles = cssMap({
  panel: { width: '25rem', maxWidth: '90vw', paddingBlock: token('space.150') },
  header: { paddingInline: token('space.200'), paddingBlockEnd: token('space.100') },
  list: { maxHeight: '60vh', overflowY: 'auto' },
  item: {
    display: 'flex',
    gap: token('space.150'),
    width: '100%',
    textAlign: 'start',
    paddingBlock: token('space.150'),
    paddingInline: token('space.200'),
    backgroundColor: token('color.background.neutral.subtle'),
    '&:hover': { backgroundColor: token('color.background.neutral.subtle.hovered') },
    '&:active': { backgroundColor: token('color.background.neutral.subtle.pressed') },
  },
  unread: {
    backgroundColor: token('color.background.selected'),
    '&:hover': { backgroundColor: token('color.background.selected.hovered') },
  },
  dot: {
    flexShrink: 0,
    width: '0.5rem',
    height: '0.5rem',
    marginBlockStart: token('space.075'),
    borderRadius: token('radius.full'),
    backgroundColor: token('color.background.brand.bold'),
  },
  grow: { flexGrow: 1, minWidth: 0 },
})

export function NotificationsMenu() {
  const { notifications } = useAppState()
  const [isOpen, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <Popup
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label="Notifications"
      role="dialog"
      content={() => <NotificationsPanel onDone={() => setOpen(false)} />}
      trigger={(triggerProps) => (
        <Notifications
          {...triggerProps}
          label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          isSelected={isOpen}
          badge={() => (unread ? <Badge appearance="important">{unread}</Badge> : null)}
          onClick={() => setOpen((open) => !open)}
        />
      )}
    />
  )
}

function NotificationsPanel({ onDone }: { onDone: () => void }) {
  const { notifications, cards, boards } = useAppState()
  const dispatch = useDispatch()
  const unread = notifications.some((n) => !n.isRead)

  return (
    <Box xcss={styles.panel}>
      <Box xcss={styles.header}>
        <Inline spread="space-between" alignBlock="center">
          <Heading size="xsmall" as="h2">
            Notifications
          </Heading>
          <Button appearance="subtle" spacing="compact" isDisabled={!unread} onClick={() => dispatch({ type: 'notifications/markAllRead' })}>
            Mark all as read
          </Button>
        </Inline>
      </Box>
      <Box xcss={styles.list}>
        {notifications.map((n) => {
          const card = cards[n.cardId]
          const actor = membersById[n.actorId]
          if (!card || !actor) return null
          return (
            <Pressable
              key={n.id}
              xcss={cx(styles.item, !n.isRead && styles.unread)}
              onClick={() => {
                dispatch({ type: 'notifications/markRead', id: n.id })
                onDone()
                navigate(paths.card(card.id))
              }}
            >
              <MemberAvatar name={actor.fullName} size="small" />
              <Box xcss={styles.grow}>
                <Stack space="space.050">
                  <Text>
                    <Text weight="semibold">{actor.fullName}</Text> {n.text} <Text weight="semibold">{card.title}</Text>
                  </Text>
                  <Text size="small" color="color.text.subtle">
                    {boards[card.boardId]?.title} · {formatRelativeTime(n.createdAt)}
                  </Text>
                </Stack>
              </Box>
              {!n.isRead && <Box xcss={styles.dot} aria-label="Unread" role="img" />}
            </Pressable>
          )
        })}
      </Box>
    </Box>
  )
}
