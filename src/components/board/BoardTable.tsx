import { cssMap } from '@atlaskit/css'
import DateLabel from '@atlaskit/date-label'
import DynamicTable from '@atlaskit/dynamic-table'
import Link from '@atlaskit/link'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { membersById } from '../../data/members'
import { formatShortDate, getDueStatus } from '../../lib/dates'
import { paths } from '../../router'
import { useAppState } from '../../state/store'
import type { Board, Card } from '../../types'
import { LabelChip } from '../common/LabelChip'
import { MemberAvatar } from '../common/MemberAvatar'

const styles = cssMap({
  wrapper: {
    flexGrow: 1,
    minHeight: 0,
    overflow: 'auto',
    marginInline: token('space.150'),
    marginBlockEnd: token('space.150'),
    paddingInline: token('space.200'),
    paddingBlockStart: token('space.100'),
    borderRadius: token('radius.large'),
    backgroundColor: token('elevation.surface'),
    boxShadow: token('elevation.shadow.raised'),
  },
})

const head = {
  cells: [
    { key: 'card', content: 'Card', isSortable: true, width: 34 },
    { key: 'list', content: 'List', isSortable: true, width: 16 },
    { key: 'labels', content: 'Labels', width: 20 },
    { key: 'members', content: 'Members', width: 14 },
    { key: 'due', content: 'Due date', isSortable: true, width: 16 },
  ],
}

/** Table view: the same cards as the board, one row each, sortable like Trello's Table view. */
export function BoardTable({ board, cards }: { board: Board; cards: Card[] }) {
  const { lists } = useAppState()
  const rows = cards.map((card) => {
    const status = card.dueDate ? getDueStatus(card.dueDate, card.isDueComplete) : null
    return {
      key: card.id,
      cells: [
        { key: card.title, content: <Link href={paths.card(card.id)}>{card.title}</Link> },
        { key: lists[card.listId]?.title ?? '', content: <Text>{lists[card.listId]?.title}</Text> },
        {
          key: 'labels',
          content: (
            <Inline space="space.050" shouldWrap>
              {card.labelIds.map((id) => board.labels.find((l) => l.id === id)).filter((l) => l !== undefined).map((label) => (
                <LabelChip key={label.id} label={label} />
              ))}
            </Inline>
          ),
        },
        {
          key: 'members',
          content: (
            <Inline space="space.025">
              {card.memberIds.map((id) => (
                <MemberAvatar key={id} name={membersById[id].fullName} size="small" />
              ))}
            </Inline>
          ),
        },
        {
          key: card.dueDate ?? '9999',
          content: card.dueDate ? (
            <DateLabel
              label={status === 'complete' ? `${formatShortDate(card.dueDate)} · Complete` : formatShortDate(card.dueDate)}
              appearance={status === 'overdue' ? 'danger' : status === 'due-soon' ? 'warning' : 'neutral'}
              iconLabel=""
            />
          ) : (
            <Text color="color.text.subtlest">No date</Text>
          ),
        },
      ],
    }
  })

  return (
    <Box xcss={styles.wrapper}>
      <DynamicTable
        caption={`${cards.length} cards`}
        head={head}
        rows={rows}
        rowsPerPage={25}
        defaultPage={1}
        defaultSortKey="due"
        defaultSortOrder="ASC"
        label={`${board.title} cards`}
        emptyView={<Text color="color.text.subtle">No cards match the current filters.</Text>}
      />
    </Box>
  )
}
