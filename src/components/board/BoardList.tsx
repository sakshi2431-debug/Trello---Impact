import { useEffect, useRef, useState } from 'react'
import Button, { IconButton } from '@atlaskit/button/new'
import { cssMap, cx } from '@atlaskit/css'
import DropdownMenu, { DropdownItem, DropdownItemGroup, DropdownItemRadio, DropdownItemRadioGroup } from '@atlaskit/dropdown-menu'
import AddIcon from '@atlaskit/icon/core/add'
import AiSparkleIcon from '@atlaskit/icon/core/ai-sparkle'
import CardIcon from '@atlaskit/icon/core/card'
import CloseIcon from '@atlaskit/icon/core/close'
import CollapseHorizontalIcon from '@atlaskit/icon/core/collapse-horizontal'
import ExpandHorizontalIcon from '@atlaskit/icon/core/expand-horizontal'
import ShowMoreHorizontalIcon from '@atlaskit/icon/core/show-more-horizontal'
import InlineEdit from '@atlaskit/inline-edit'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Textarea from '@atlaskit/textarea'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { cardTemplates } from '../../data/templates'
import { createId } from '../../lib/random'
import { useImpact } from '../../impact/ImpactProvider'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import type { AccentColor, Card, Label, List } from '../../types'
import { ACCENTS } from '../common/accent'
import { colorNames } from '../common/LabelChip'
import { BoardCard } from './BoardCard'
import { isCardDragData, type ListDropData } from './dnd'

export const LIST_WIDTH = '17rem'

const styles = cssMap({
  list: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    width: LIST_WIDTH,
    maxHeight: '100%',
    borderRadius: token('radius.xlarge'),
    backgroundColor: token('elevation.surface.sunken'),
    boxShadow: token('elevation.shadow.raised'),
  },
  header: {
    paddingBlockStart: token('space.100'),
    paddingInlineStart: token('space.100'),
    paddingInlineEnd: token('space.050'),
  },
  title: { flexGrow: 1, minWidth: 0 },
  readTitle: { paddingBlock: token('space.050'), paddingInline: token('space.075') },
  cards: {
    flexGrow: 1,
    minHeight: '0.5rem',
    listStyle: 'none',
    marginBlock: token('space.0'),
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: token('space.100'),
    paddingBlock: token('space.100'),
    paddingInline: token('space.100'),
  },
  composer: { marginBlockStart: token('space.0') },
  cardsOver: { backgroundColor: token('color.background.neutral.subtle.hovered') },
  footer: {
    paddingBlockEnd: token('space.100'),
    paddingInline: token('space.100'),
  },
  hiddenCount: { paddingInline: token('space.150'), paddingBlockEnd: token('space.050') },
  collapsed: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: token('space.100'),
    flexShrink: 0,
    width: '2.75rem',
    paddingBlock: token('space.100'),
    borderRadius: token('radius.xlarge'),
    backgroundColor: token('elevation.surface.sunken'),
    boxShadow: token('elevation.shadow.raised'),
  },
  verticalTitle: { writingMode: 'vertical-rl', whiteSpace: 'nowrap' },
})

/**
 * Trello list colours map to pale ADS accent backgrounds so cards stay legible on top. Index this map inside the
 * `xcss` expression: Compiled only emits CSS for styles it can see used in JSX.
 */
const listColorStyles = cssMap({
  green: { backgroundColor: token('color.background.accent.green.subtler') },
  yellow: { backgroundColor: token('color.background.accent.yellow.subtler') },
  orange: { backgroundColor: token('color.background.accent.orange.subtler') },
  red: { backgroundColor: token('color.background.accent.red.subtler') },
  purple: { backgroundColor: token('color.background.accent.purple.subtler') },
  blue: { backgroundColor: token('color.background.accent.blue.subtler') },
  teal: { backgroundColor: token('color.background.accent.teal.subtler') },
  lime: { backgroundColor: token('color.background.accent.lime.subtler') },
  magenta: { backgroundColor: token('color.background.accent.magenta.subtler') },
})

interface Props {
  list: List
  cards: Card[]
  labels: Label[]
  hiddenCount: number
  showLabelText: boolean
}

export function BoardList({ list, cards, labels, hiddenCount, showLabelText }: Props) {
  const dispatch = useDispatch()
  const scrollRef = useRef<HTMLOListElement>(null)
  const [isOver, setOver] = useState(false)
  const [composer, setComposer] = useState<'top' | 'bottom' | null>(null)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const data: ListDropData = { type: 'list', listId: list.id }
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
  }, [list.id, list.isCollapsed])

  if (list.isCollapsed) {
    return (
      <Pressable
        xcss={cx(styles.collapsed, list.color && listColorStyles[list.color])}
        aria-label={`Expand list ${list.title} (${cards.length} cards)`}
        onClick={() => dispatch({ type: 'list/toggleCollapsed', listId: list.id })}
      >
        <ExpandHorizontalIcon label="" color={token('color.icon.subtle')} />
        <Text size="small" color="color.text.subtle">
          {cards.length}
        </Text>
        <Box xcss={styles.verticalTitle}>
          <Text weight="semibold">{list.title}</Text>
        </Box>
      </Pressable>
    )
  }

  return (
    <Box as="section" xcss={cx(styles.list, list.color && listColorStyles[list.color])} aria-label={list.title}>
      <Box xcss={styles.header}>
        <Inline space="space.025" alignBlock="center">
          <Box xcss={styles.title}>
            <InlineEdit
              defaultValue={list.title}
              editButtonLabel={`Edit list title: ${list.title}`}
              hideActionButtons
              readViewFitContainerWidth
              onConfirm={(value: string) => value.trim() && dispatch({ type: 'list/rename', listId: list.id, title: value.trim() })}
              editView={({ errorMessage: _errorMessage, ...fieldProps }, ref) => <Textfield {...fieldProps} ref={ref} isCompact autoFocus aria-label="List title" />}
              readView={() => (
                <Box xcss={styles.readTitle}>
                  <Text weight="semibold" maxLines={2}>
                    {list.title}
                  </Text>
                </Box>
              )}
            />
          </Box>
          <Text size="small" color="color.text.subtle">
            {cards.length}
          </Text>
          <IconButton
            appearance="subtle"
            spacing="compact"
            icon={CollapseHorizontalIcon}
            label={`Collapse list ${list.title}`}
            onClick={() => dispatch({ type: 'list/toggleCollapsed', listId: list.id })}
          />
          <DropdownMenu
            placement="bottom-start"
            trigger={({ triggerRef, ...props }) => (
              <IconButton {...props} ref={triggerRef} appearance="subtle" spacing="compact" icon={ShowMoreHorizontalIcon} label={`List actions for ${list.title}`} />
            )}
          >
            <DropdownItemGroup title="List actions">
              <DropdownItem onClick={() => setComposer('top')}>Add card</DropdownItem>
              <DropdownItem onClick={() => dispatch({ type: 'list/toggleCollapsed', listId: list.id })}>Collapse list</DropdownItem>
            </DropdownItemGroup>
            <DropdownItemRadioGroup id={`list-color-${list.id}`} title="List colour" hasSeparator>
              <DropdownItemRadio id={`${list.id}-none`} isSelected={!list.color} onClick={() => dispatch({ type: 'list/setColor', listId: list.id })}>
                None
              </DropdownItemRadio>
              {ACCENTS.map((color: AccentColor) => (
                <DropdownItemRadio
                  key={color}
                  id={`${list.id}-${color}`}
                  isSelected={list.color === color}
                  onClick={() => dispatch({ type: 'list/setColor', listId: list.id, color })}
                >
                  {colorNames[color]}
                </DropdownItemRadio>
              ))}
            </DropdownItemRadioGroup>
            <DropdownItemGroup hasSeparator>
              <DropdownItem onClick={() => dispatch({ type: 'list/archive', listId: list.id })}>Archive this list</DropdownItem>
            </DropdownItemGroup>
          </DropdownMenu>
        </Inline>
      </Box>

      <Box ref={scrollRef} as="ol" xcss={cx(styles.cards, isOver && styles.cardsOver)} aria-label={`Cards in ${list.title}`}>
        {composer === 'top' && (
          <Box as="li" xcss={styles.composer}>
            <AddCardComposer listId={list.id} position="top" onClose={() => setComposer(null)} />
          </Box>
        )}
        {cards.map((card) => (
          <BoardCard key={card.id} card={card} labels={labels} showLabelText={showLabelText} />
        ))}
        {composer === 'bottom' && (
          <Box as="li" xcss={styles.composer}>
            <AddCardComposer listId={list.id} position="bottom" onClose={() => setComposer(null)} />
          </Box>
        )}
      </Box>

      {hiddenCount > 0 && (
        <Box xcss={styles.hiddenCount}>
          <Text size="small" color="color.text.subtle">{`${hiddenCount} card${hiddenCount === 1 ? '' : 's'} hidden by filters`}</Text>
        </Box>
      )}

      {composer !== 'bottom' && (
        <Box xcss={styles.footer}>
          <Inline spread="space-between" alignBlock="center">
            <Button appearance="subtle" iconBefore={AddIcon} onClick={() => setComposer('bottom')}>
              Add a card
            </Button>
            <CardTemplateMenu listId={list.id} />
          </Inline>
        </Box>
      )}
    </Box>
  )
}

function CardTemplateMenu({ listId }: { listId: string }) {
  const dispatch = useDispatch()
  return (
    <DropdownMenu
      placement="bottom-end"
      trigger={({ triggerRef, ...props }) => <IconButton {...props} ref={triggerRef} appearance="subtle" icon={CardIcon} label="Create from template" />}
    >
      <DropdownItemGroup title="Card templates">
        {cardTemplates.map((template) => (
          <DropdownItem
            key={template.id}
            description={`Checklist with ${template.checklist.length} items`}
            onClick={() => dispatch({ type: 'card/createFromTemplate', id: createId('c'), listId, template })}
          >
            {template.title}
          </DropdownItem>
        ))}
      </DropdownItemGroup>
    </DropdownMenu>
  )
}

function AddCardComposer({ listId, position, onClose }: { listId: string; position: 'top' | 'bottom'; onClose: () => void }) {
  const dispatch = useDispatch()
  const { cards } = useAppState()
  const impact = useImpact()
  // A draft kept with "Keep draft and close" comes back when Add a card is chosen in its list (spec rule 8).
  const keptId = impact.session?.cardId
  const kept = keptId && cards[keptId]?.isDraft && cards[keptId].listId === listId ? cards[keptId] : undefined
  const [title, setTitle] = useState(kept?.title ?? '')
  const ref = useRef<HTMLTextAreaElement>(null)

  // Trello Impact: stage the card and review what it may affect before it is added.
  const reviewImpact = () => {
    if (!title.trim()) {
      ref.current?.focus()
      return
    }
    if (kept) {
      // The kept review comes back as it was, unless the title changed and needs checking again.
      if (title.trim() === kept.title && impact.session?.review) impact.reopenReview()
      else {
        impact.updateDraftTitle(title)
        impact.review()
      }
      onClose()
      navigate(paths.card(kept.id))
      return
    }
    const id = impact.startDraft(listId, title.trim())
    onClose()
    navigate(paths.card(id))
  }

  const submit = () => {
    if (!title.trim()) {
      ref.current?.focus()
      return
    }
    if (kept) {
      impact.updateDraftTitle(title)
      impact.addCard()
    } else dispatch({ type: 'card/create', id: createId('c'), listId, title: title.trim(), position })
    setTitle('')
    ref.current?.focus()
  }

  // Trello's Cancel discards a kept draft; Escape only closes the composer.
  const cancel = () => {
    if (kept) impact.cancelDraft()
    onClose()
  }

  return (
    <Stack space="space.100">
      <Textarea
        ref={ref}
        autoFocus
        aria-label="Card title"
        placeholder="Enter a title or paste a link"
        resize="smart"
        minimumRows={2}
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          }
          if (e.key === 'Escape') onClose()
        }}
      />
      <Inline space="space.050" alignBlock="center">
        <Button appearance="primary" onClick={submit}>
          Add card
        </Button>
        <Button iconBefore={AiSparkleIcon} onClick={reviewImpact}>
          Review impact
        </Button>
        <IconButton appearance="subtle" icon={CloseIcon} label="Cancel adding a card" onClick={cancel} />
      </Inline>
    </Stack>
  )
}
