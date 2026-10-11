import { useState } from 'react'
import Button, { IconButton } from '@atlaskit/button/new'
import { Checkbox } from '@atlaskit/checkbox'
import { cssMap } from '@atlaskit/css'
import DeleteIcon from '@atlaskit/icon/core/delete'
import ListChecklistIcon from '@atlaskit/icon/core/list-checklist'
import ProgressBar, { SuccessProgressBar } from '@atlaskit/progress-bar'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { useDispatch } from '../../state/store'
import type { Card, Checklist, ChecklistItem } from '../../types'
import { SectionHeading } from './SectionHeading'

const styles = cssMap({
  progress: { display: 'grid', gridTemplateColumns: '2.5rem 1fr', alignItems: 'center', gap: token('space.100') },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: token('space.050'),
    borderRadius: token('radius.small'),
    paddingInlineStart: token('space.050'),
    '&:hover': { backgroundColor: token('color.background.neutral.subtle.hovered') },
  },
  itemLabel: { flexGrow: 1, minWidth: 0 },
  itemAction: { opacity: 0 },
  indent: { paddingInlineStart: token('space.500') },
  done: { textDecorationLine: 'line-through' },
})

export function CardChecklists({ card }: { card: Card }) {
  return (
    <>
      {card.checklists.map((checklist) => (
        <ChecklistBlock key={checklist.id} card={card} checklist={checklist} />
      ))}
    </>
  )
}

function ChecklistBlock({ card, checklist }: { card: Card; checklist: Checklist }) {
  const dispatch = useDispatch()
  const [isAdding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [hideChecked, setHideChecked] = useState(false)
  const done = checklist.items.filter((i) => i.isDone).length
  const total = checklist.items.length
  const ratio = total ? done / total : 0
  const items = hideChecked ? checklist.items.filter((i) => !i.isDone) : checklist.items

  return (
    <Stack space="space.100">
      <SectionHeading
        icon={ListChecklistIcon}
        title={checklist.title}
        actions={
          <Inline space="space.050">
            {done > 0 && (
              <Button spacing="compact" onClick={() => setHideChecked((v) => !v)}>
                {hideChecked ? `Show checked items (${done})` : 'Hide checked items'}
              </Button>
            )}
            <Button spacing="compact" onClick={() => dispatch({ type: 'card/deleteChecklist', cardId: card.id, checklistId: checklist.id })}>
              Delete
            </Button>
          </Inline>
        }
      />
      <Box xcss={styles.progress}>
        <Text size="small" color="color.text.subtle">{`${Math.round(ratio * 100)}%`}</Text>
        {ratio === 1 ? (
          <SuccessProgressBar value={1} ariaLabel={`${checklist.title}: all ${total} items complete`} />
        ) : (
          <ProgressBar value={ratio} ariaLabel={`${checklist.title}: ${done} of ${total} items complete`} />
        )}
      </Box>
      <Stack space="space.025">
        {items.map((item) => (
          <ChecklistItemRow key={item.id} card={card} checklist={checklist} item={item} />
        ))}
      </Stack>
      <Box xcss={styles.indent}>
        {isAdding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!text.trim()) return
              dispatch({ type: 'card/addChecklistItem', cardId: card.id, checklistId: checklist.id, text: text.trim() })
              setText('')
            }}
          >
            <Stack space="space.100">
              <Textfield
                autoFocus
                aria-label="Add an item"
                placeholder="Add an item"
                value={text}
                onChange={(e) => setText(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
              />
              <Inline space="space.050">
                <Button appearance="primary" type="submit">
                  Add
                </Button>
                <Button appearance="subtle" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </Inline>
            </Stack>
          </form>
        ) : (
          <Button onClick={() => setAdding(true)}>Add an item</Button>
        )}
      </Box>
    </Stack>
  )
}

function ChecklistItemRow({ card, checklist, item }: { card: Card; checklist: Checklist; item: ChecklistItem }) {
  const dispatch = useDispatch()
  // The delete action appears on hover or keyboard focus, as in Trello.
  const [isActive, setActive] = useState(false)
  return (
    <Box
      xcss={styles.item}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <Box xcss={styles.itemLabel}>
        <Checkbox
          isChecked={item.isDone}
          onChange={() => dispatch({ type: 'card/toggleChecklistItem', cardId: card.id, checklistId: checklist.id, itemId: item.id })}
          label={
            <Box as="span" xcss={item.isDone && styles.done}>
              {item.text}
            </Box>
          }
        />
      </Box>
      <Box xcss={!isActive && styles.itemAction}>
        <IconButton
          appearance="subtle"
          spacing="compact"
          icon={DeleteIcon}
          label={`Delete ${item.text}`}
          onClick={() => dispatch({ type: 'card/deleteChecklistItem', cardId: card.id, checklistId: checklist.id, itemId: item.id })}
        />
      </Box>
    </Box>
  )
}
