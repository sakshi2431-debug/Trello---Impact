import { useState } from 'react'
import Badge from '@atlaskit/badge'
import Button, { IconButton } from '@atlaskit/button/new'
import { Checkbox } from '@atlaskit/checkbox'
import { cssMap } from '@atlaskit/css'
import { Label } from '@atlaskit/form'
import Heading from '@atlaskit/heading'
import FilterIcon from '@atlaskit/icon/core/filter'
import Popup from '@atlaskit/popup'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { membersById } from '../../data/members'
import { useAppState } from '../../state/store'
import type { Board } from '../../types'
import { LabelChip } from '../common/LabelChip'
import { MemberAvatar } from '../common/MemberAvatar'
import { activeFilterCount, type BoardFilter, type DueFilter } from './filters'

const styles = cssMap({
  panel: { width: '20rem', maxWidth: '90vw', maxHeight: '70vh', overflowY: 'auto', padding: token('space.200') },
})

const dueOptions: { value: DueFilter; label: string }[] = [
  { value: 'none', label: 'No dates' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due-soon', label: 'Due in the next day' },
  { value: 'complete', label: 'Marked as complete' },
]

function toggle<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}

export function FilterPopup({ board, filter, onChange }: { board: Board; filter: BoardFilter; onChange: (filter: BoardFilter) => void }) {
  const [isOpen, setOpen] = useState(false)
  const count = activeFilterCount(filter)

  return (
    <Popup
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label="Filter cards"
      role="dialog"
      content={() => <FilterPanel board={board} filter={filter} onChange={onChange} />}
      trigger={(triggerProps) => (
        count > 0 ? (
          <Button {...triggerProps} appearance="subtle" iconBefore={FilterIcon} isSelected onClick={() => setOpen((open) => !open)}>
            <Inline space="space.075" alignBlock="center" as="span">
              Filters
              <Badge appearance="primary">{count}</Badge>
            </Inline>
          </Button>
        ) : (
          <IconButton {...triggerProps} appearance="subtle" icon={FilterIcon} label="Filter cards" isSelected={isOpen} onClick={() => setOpen((open) => !open)} />
        )
      )}
    />
  )
}

function FilterPanel({ board, filter, onChange }: { board: Board; filter: BoardFilter; onChange: (filter: BoardFilter) => void }) {
  const { currentUserId } = useAppState()
  return (
    <Box xcss={styles.panel}>
      <Stack space="space.200">
        <Inline spread="space-between" alignBlock="center">
          <Heading size="xsmall" as="h2">
            Filter
          </Heading>
          <Button appearance="subtle" spacing="compact" isDisabled={activeFilterCount(filter) === 0} onClick={() => onChange({ keyword: '', memberIds: [], labelIds: [], due: [] })}>
            Clear all
          </Button>
        </Inline>

        <Stack space="space.050">
          <Label htmlFor="filter-keyword">Keyword</Label>
          <Textfield id="filter-keyword" autoFocus placeholder="Enter a keyword…" value={filter.keyword} onChange={(e) => onChange({ ...filter, keyword: e.currentTarget.value })} />
          <Text size="small" color="color.text.subtle">
            Matches card titles and descriptions.
          </Text>
        </Stack>

        <Stack space="space.050">
          <Text weight="semibold" size="small" color="color.text.subtle">
            Members
          </Text>
          <Checkbox label="No members" isChecked={filter.memberIds.includes('none')} onChange={() => onChange({ ...filter, memberIds: toggle(filter.memberIds, 'none') })} />
          <Checkbox
            label="Cards assigned to me"
            isChecked={filter.memberIds.includes(currentUserId)}
            onChange={() => onChange({ ...filter, memberIds: toggle(filter.memberIds, currentUserId) })}
          />
          {board.memberIds
            .filter((id) => id !== currentUserId)
            .map((id) => membersById[id])
            .map((member) => (
              <Checkbox
                key={member.id}
                isChecked={filter.memberIds.includes(member.id)}
                onChange={() => onChange({ ...filter, memberIds: toggle(filter.memberIds, member.id) })}
                label={
                  <Inline space="space.100" alignBlock="center" as="span">
                    <MemberAvatar name={member.fullName} size="small" />
                    {member.fullName}
                  </Inline>
                }
              />
            ))}
        </Stack>

        <Stack space="space.050">
          <Text weight="semibold" size="small" color="color.text.subtle">
            Due date
          </Text>
          {dueOptions.map((option) => (
            <Checkbox
              key={option.value}
              label={option.label}
              isChecked={filter.due.includes(option.value)}
              onChange={() => onChange({ ...filter, due: toggle(filter.due, option.value) })}
            />
          ))}
        </Stack>

        <Stack space="space.050">
          <Text weight="semibold" size="small" color="color.text.subtle">
            Labels
          </Text>
          <Checkbox label="No labels" isChecked={filter.labelIds.includes('none')} onChange={() => onChange({ ...filter, labelIds: toggle(filter.labelIds, 'none') })} />
          {board.labels.map((label) => (
            <Checkbox
              key={label.id}
              isChecked={filter.labelIds.includes(label.id)}
              onChange={() => onChange({ ...filter, labelIds: toggle(filter.labelIds, label.id) })}
              label={<LabelChip label={label} size="regular" />}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}
