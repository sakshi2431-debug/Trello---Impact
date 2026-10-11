import type { ComponentType } from 'react'
import { cssMap, cx } from '@atlaskit/css'
import DateLabel from '@atlaskit/date-label'
import AlignTextLeftIcon from '@atlaskit/icon/core/align-text-left'
import AttachmentIcon from '@atlaskit/icon/core/attachment'
import CheckCircleIcon from '@atlaskit/icon/core/check-circle'
import CommentIcon from '@atlaskit/icon/core/comment'
import EyeOpenIcon from '@atlaskit/icon/core/eye-open'
import ListChecklistIcon from '@atlaskit/icon/core/list-checklist'
import type { NewCoreIconProps } from '@atlaskit/icon/types'
import Lozenge from '@atlaskit/lozenge'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Text } from '@atlaskit/primitives/compiled/text'
import Tooltip from '@atlaskit/tooltip'
import { token } from '@atlaskit/tokens'
import { formatShortDate, getDueStatus } from '../../lib/dates'
import type { Card } from '../../types'

const styles = cssMap({
  badge: { display: 'inline-flex', alignItems: 'center', gap: token('space.050'), minHeight: '1.5rem' },
  complete: {
    paddingInline: token('space.050'),
    borderRadius: token('radius.small'),
    backgroundColor: token('color.background.success.bold'),
  },
})

function checklistProgress(card: Card) {
  const items = card.checklists.flatMap((c) => c.items)
  return { done: items.filter((i) => i.isDone).length, total: items.length }
}

/** The row of indicators under a card title, in Trello's order. */
export function CardBadges({ card }: { card: Card }) {
  const { done, total } = checklistProgress(card)
  const status = card.dueDate ? getDueStatus(card.dueDate, card.isDueComplete) : null

  return (
    <Inline space="space.100" alignBlock="center" shouldWrap rowSpace="space.050">
      {card.dueDate && status === 'complete' && (
        <Tooltip content="This card is complete">
          <Lozenge appearance="success" iconBefore={CheckCircleIcon}>
            {formatShortDate(card.dueDate)}
          </Lozenge>
        </Tooltip>
      )}
      {card.dueDate && status !== 'complete' && (
        <Tooltip content={status === 'overdue' ? 'This card is past due' : status === 'due-soon' ? 'This card is due soon' : 'This card has a due date'}>
          <DateLabel
            label={formatShortDate(card.dueDate)}
            appearance={status === 'overdue' ? 'danger' : status === 'due-soon' ? 'warning' : 'neutral'}
            iconLabel=""
          />
        </Tooltip>
      )}
      {card.isWatching && <IconBadge icon={EyeOpenIcon} label="You are watching this card" />}
      {card.description && <IconBadge icon={AlignTextLeftIcon} label="This card has a description" />}
      {card.comments.length > 0 && <IconBadge icon={CommentIcon} label="Comments" count={card.comments.length} />}
      {card.attachments.length > 0 && <IconBadge icon={AttachmentIcon} label="Attachments" count={card.attachments.length} />}
      {total > 0 &&
        (done === total ? (
          <Tooltip content="Checklist items">
            <Box as="span" xcss={cx(styles.badge, styles.complete)}>
              <ListChecklistIcon label="Checklist items" size="small" color={token('color.icon.inverse')} />
              <Text size="small" color="color.text.inverse">{`${done}/${total}`}</Text>
            </Box>
          </Tooltip>
        ) : (
          <IconBadge icon={ListChecklistIcon} label="Checklist items" text={`${done}/${total}`} />
        ))}
    </Inline>
  )
}

function IconBadge({ icon: Icon, label, count, text }: { icon: ComponentType<NewCoreIconProps>; label: string; count?: number; text?: string }) {
  return (
    <Tooltip content={label}>
      <Box as="span" xcss={styles.badge}>
        <Icon label={label} size="small" color={token('color.icon.subtle')} />
        {(count !== undefined || text) && (
          <Text size="small" color="color.text.subtle">
            {text ?? count}
          </Text>
        )}
      </Box>
    </Tooltip>
  )
}
