import { memo, useEffect, useRef, useState } from 'react'
import { cssMap, cx } from '@atlaskit/css'
import CheckCircleIcon from '@atlaskit/icon/core/check-circle'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, extractClosestEdge, type Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { membersById } from '../../data/members'
import { navigate, paths } from '../../router'
import { useScreenBoardId } from '../../state/screen'
import type { Card, Label } from '../../types'
import { LabelChip } from '../common/LabelChip'
import { MemberAvatar } from '../common/MemberAvatar'
import { CardBadges } from './CardBadges'
import { isCardDragData, type CardDragData } from './dnd'

const styles = cssMap({
  // The ADS reset spaces sibling list items; the list's gap handles spacing.
  wrapper: { position: 'relative', marginBlockStart: token('space.0') },
  card: {
    display: 'block',
    width: '100%',
    overflow: 'hidden',
    textAlign: 'start',
    padding: token('space.0'),
    borderRadius: token('radius.large'),
    backgroundColor: token('elevation.surface.raised'),
    boxShadow: token('elevation.shadow.raised'),
    color: token('color.text'),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: token('elevation.surface.raised.hovered'),
      outlineWidth: token('border.width.selected'),
      outlineStyle: 'solid',
      outlineColor: token('color.border.focused'),
      outlineOffset: token('space.0'),
    },
  },
  body: {
    display: 'block',
    paddingBlockStart: token('space.100'),
    paddingBlockEnd: token('space.100'),
    paddingInline: token('space.150'),
  },
  cover: { display: 'block', height: '2.25rem' },
  dragging: { opacity: token('opacity.disabled') },
  members: { marginInlineStart: 'auto' },
})

/** Colour covers use the same accent "subtle" palette as Trello's cover colours. */
const coverStyles = cssMap({
  green: { backgroundColor: token('color.background.accent.green.subtle') },
  yellow: { backgroundColor: token('color.background.accent.yellow.subtle') },
  orange: { backgroundColor: token('color.background.accent.orange.subtle') },
  red: { backgroundColor: token('color.background.accent.red.subtle') },
  purple: { backgroundColor: token('color.background.accent.purple.subtle') },
  blue: { backgroundColor: token('color.background.accent.blue.subtle') },
  teal: { backgroundColor: token('color.background.accent.teal.subtle') },
  lime: { backgroundColor: token('color.background.accent.lime.subtle') },
  magenta: { backgroundColor: token('color.background.accent.magenta.subtle') },
})

interface Props {
  card: Card
  labels: Label[]
  showLabelText: boolean
}

/** Card front on a board list. Draggable, and a drop target for reordering. */
export const BoardCard = memo(function BoardCard({ card, labels, showLabelText }: Props) {
  const screenBoardId = useScreenBoardId()
  const ref = useRef<HTMLButtonElement>(null)
  const [isDragging, setDragging] = useState(false)
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const data: CardDragData = { type: 'card', cardId: card.id, listId: card.listId }
    return combine(
      draggable({
        element,
        getInitialData: () => ({ ...data }),
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => isCardDragData(source.data) && source.data.cardId !== card.id,
        getData: ({ input }) => attachClosestEdge({ ...data }, { element, input, allowedEdges: ['top', 'bottom'] }),
        getIsSticky: () => true,
        onDragEnter: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDrag: ({ self }) => {
          const edge = extractClosestEdge(self.data)
          setClosestEdge((current) => (current === edge ? current : edge))
        },
        onDragLeave: () => setClosestEdge(null),
        onDrop: () => setClosestEdge(null),
      }),
    )
  }, [card.id, card.listId])

  const cardLabels = card.labelIds.map((id) => labels.find((l) => l.id === id)).filter((l): l is Label => !!l)
  const cardMembers = card.memberIds.map((id) => membersById[id]).filter(Boolean)
  const hasBadges = cardMembers.length > 0 || !!card.isWatching || !!card.dueDate || !!card.description || card.comments.length > 0 || card.attachments.length > 0 || card.checklists.length > 0

  return (
    <Box as="li" xcss={styles.wrapper}>
      <Pressable ref={ref} xcss={cx(styles.card, isDragging && styles.dragging)} onClick={() => navigate(paths.card(card.id, card.boardId === screenBoardId ? undefined : screenBoardId))}>
        {card.cover && <Box as="span" xcss={cx(styles.cover, coverStyles[card.cover])} />}
        <Box as="span" xcss={styles.body}>
        <Stack space="space.050">
          {cardLabels.length > 0 && (
            <Inline space="space.050" shouldWrap>
              {cardLabels.map((label) => (
                <LabelChip key={label.id} label={label} size={showLabelText ? 'compact' : 'bar'} />
              ))}
            </Inline>
          )}
          {card.isComplete ? (
            <Inline space="space.050" alignBlock="start">
              <CheckCircleIcon label="Complete" color={token('color.icon.success')} />
              <Text>{card.title}</Text>
            </Inline>
          ) : (
            <Text>{card.title}</Text>
          )}
          {hasBadges && (
            <Inline space="space.100" alignBlock="end" spread="space-between" shouldWrap rowSpace="space.050">
              <CardBadges card={card} />
              {cardMembers.length > 0 && (
                <Box xcss={styles.members}>
                  <Inline space="space.025">
                    {cardMembers.map((member) => (
                      <MemberAvatar key={member.id} name={member.fullName} size="small" />
                    ))}
                  </Inline>
                </Box>
              )}
            </Inline>
          )}
        </Stack>
        </Box>
      </Pressable>
      {closestEdge && <DropIndicator edge={closestEdge} gap={token('space.100')} />}
    </Box>
  )
})
