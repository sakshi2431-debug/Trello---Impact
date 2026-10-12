import { useEffect, useRef, useState, type ComponentType } from 'react'
import Button, { IconButton } from '@atlaskit/button/new'
import { Checkbox } from '@atlaskit/checkbox'
import { cssMap, cx } from '@atlaskit/css'
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu'
import { useFlags } from '@atlaskit/flag'
import Heading from '@atlaskit/heading'
import AddIcon from '@atlaskit/icon/core/add'
import AiSparkleIcon from '@atlaskit/icon/core/ai-sparkle'
import AlignTextLeftIcon from '@atlaskit/icon/core/align-text-left'
import ArchiveBoxIcon from '@atlaskit/icon/core/archive-box'
import AttachmentIcon from '@atlaskit/icon/core/attachment'
import CardIcon from '@atlaskit/icon/core/card'
import CheckCircleIcon from '@atlaskit/icon/core/check-circle'
import CheckCircleUncheckedIcon from '@atlaskit/icon/core/check-circle-unchecked'
import ChevronDownIcon from '@atlaskit/icon/core/chevron-down'
import ChevronLeftIcon from '@atlaskit/icon/core/chevron-left'
import ClockIcon from '@atlaskit/icon/core/clock'
import EyeOpenIcon from '@atlaskit/icon/core/eye-open'
import EyeOpenFilledIcon from '@atlaskit/icon/core/eye-open-filled'
import ImageIcon from '@atlaskit/icon/core/image'
import ListChecklistIcon from '@atlaskit/icon/core/list-checklist'
import PersonIcon from '@atlaskit/icon/core/person'
import RefreshIcon from '@atlaskit/icon/core/refresh'
import ShowMoreHorizontalIcon from '@atlaskit/icon/core/show-more-horizontal'
import TagIcon from '@atlaskit/icon/core/tag'
import type { NewCoreIconProps } from '@atlaskit/icon/types'
import InlineEdit from '@atlaskit/inline-edit'
import Lozenge from '@atlaskit/lozenge'
import { ButtonItem, MenuGroup, Section } from '@atlaskit/menu'
import Modal, { CloseButton, ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import SectionMessage, { SectionMessageAction } from '@atlaskit/section-message'
import Textarea from '@atlaskit/textarea'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import Tooltip from '@atlaskit/tooltip'
import VisuallyHidden from '@atlaskit/visually-hidden'
import { membersById } from '../../data/members'
import { formatShortDate, formatTime, getDueStatus } from '../../lib/dates'
import { useImpact } from '../../impact/ImpactProvider'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import type { Board, Card, List } from '../../types'
import { LabelChip } from '../common/LabelChip'
import { MemberAvatar } from '../common/MemberAvatar'
import { ImpactPanel } from '../impact/ImpactPanel'
import { CardActivity } from './CardActivity'
import { CardAttachments } from './CardAttachments'
import { CardChecklists } from './CardChecklists'
import { AttachmentPicker, CardLinkPicker, ChecklistCreator, CoverPicker, LabelsPicker, MembersPicker, MovePicker } from './CardPickers'
import { CardPopover, type PopoverTriggerArgs } from './CardPopover'
import { CardTabBar } from './CardTabBar'
import { DatesPicker } from './DatesPicker'
import { SectionHeading } from './SectionHeading'

const styles = cssMap({
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token('space.100'),
    paddingBlock: token('space.150'),
    paddingInline: token('space.200'),
    borderBlockEndWidth: token('border.width'),
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: token('color.border'),
  },
  listPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token('space.050'),
    paddingBlock: token('space.025'),
    paddingInlineStart: token('space.075'),
    paddingInlineEnd: token('space.050'),
    borderRadius: token('radius.small'),
    font: token('font.body'),
    fontWeight: token('font.weight.medium'),
    color: token('color.text'),
  },
  archived: { paddingBlockStart: token('space.200'), paddingInline: token('space.300') },
  frame: { position: 'relative', display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 },
  layout: {
    flexGrow: 1,
    minHeight: 0,
    overflowY: 'auto',
    '@media (min-width: 64rem)': { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 24rem', overflowY: 'hidden' },
  },
  layoutSingle: { '@media (min-width: 64rem)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  main: {
    paddingBlock: token('space.300'),
    paddingInline: token('space.300'),
    '@media (min-width: 64rem)': { flexGrow: 1, minHeight: 0, overflowY: 'auto' },
  },
  aside: {
    paddingBlock: token('space.200'),
    paddingInline: token('space.200'),
    backgroundColor: token('elevation.surface.sunken'),
    borderBlockStartWidth: token('border.width'),
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: token('color.border'),
    '@media (min-width: 64rem)': {
      overflowY: 'auto',
      borderBlockStartStyle: 'none',
      borderInlineStartWidth: token('border.width'),
      borderInlineStartStyle: 'solid',
      borderInlineStartColor: token('color.border'),
    },
  },
  mainWrap: {
    position: 'relative',
    '@media (min-width: 64rem)': { display: 'flex', flexDirection: 'column', minHeight: 0 },
  },
  // Desktop only: on narrow screens the whole modal scrolls as one column.
  compactBar: {
    display: 'none',
    position: 'absolute',
    insetBlockStart: token('space.0'),
    insetInlineStart: token('space.0'),
    width: '100%',
    zIndex: 1,
    alignItems: 'center',
    gap: token('space.100'),
    paddingBlock: token('space.100'),
    paddingInline: token('space.300'),
    backgroundColor: token('elevation.surface'),
    boxShadow: token('elevation.shadow.overflow'),
    '@media (min-width: 64rem)': { display: 'flex' },
  },
  titleRow: { display: 'flex', alignItems: 'flex-start', gap: token('space.050'), marginInlineStart: token('space.negative.075') },
  titleEdit: { flexGrow: 1, minWidth: 0, marginBlockStart: token('space.negative.100') },
  titleRead: { paddingBlock: token('space.050'), paddingInline: token('space.050') },
  grow: { flexGrow: 1, minWidth: 0 },
  indent: { paddingInlineStart: token('space.400') },
  metaLabel: { paddingBlockEnd: token('space.075') },
  description: { whiteSpace: 'pre-wrap' },
  descriptionEmpty: {
    display: 'block',
    width: '100%',
    textAlign: 'start',
    minHeight: '3.5rem',
    paddingBlock: token('space.100'),
    paddingInline: token('space.150'),
    borderRadius: token('radius.small'),
    backgroundColor: token('color.background.neutral'),
    '&:hover': { backgroundColor: token('color.background.neutral.hovered') },
  },
  bleed: { marginInline: token('space.negative.150') },
  draftNote: { marginBlockStart: token('space.negative.200') },
  backRow: { paddingBlockEnd: token('space.100') },
})

const pillColors = cssMap({
  neutral: { backgroundColor: token('color.background.neutral'), '&:hover': { backgroundColor: token('color.background.neutral.hovered') } },
  green: {
    backgroundColor: token('color.background.accent.green.subtler'),
    '&:hover': { backgroundColor: token('color.background.accent.green.subtler.hovered') },
  },
  yellow: {
    backgroundColor: token('color.background.accent.yellow.subtler'),
    '&:hover': { backgroundColor: token('color.background.accent.yellow.subtler.hovered') },
  },
  orange: {
    backgroundColor: token('color.background.accent.orange.subtler'),
    '&:hover': { backgroundColor: token('color.background.accent.orange.subtler.hovered') },
  },
  red: { backgroundColor: token('color.background.accent.red.subtler'), '&:hover': { backgroundColor: token('color.background.accent.red.subtler.hovered') } },
  purple: {
    backgroundColor: token('color.background.accent.purple.subtler'),
    '&:hover': { backgroundColor: token('color.background.accent.purple.subtler.hovered') },
  },
  blue: {
    backgroundColor: token('color.background.accent.blue.subtler'),
    '&:hover': { backgroundColor: token('color.background.accent.blue.subtler.hovered') },
  },
  teal: {
    backgroundColor: token('color.background.accent.teal.subtler'),
    '&:hover': { backgroundColor: token('color.background.accent.teal.subtler.hovered') },
  },
  lime: {
    backgroundColor: token('color.background.accent.lime.subtler'),
    '&:hover': { backgroundColor: token('color.background.accent.lime.subtler.hovered') },
  },
  magenta: {
    backgroundColor: token('color.background.accent.magenta.subtler'),
    '&:hover': { backgroundColor: token('color.background.accent.magenta.subtler.hovered') },
  },
})

export function CardModal({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const { cards, boards, lists } = useAppState()
  const impact = useImpact()
  const [isClosePromptOpen, setClosePromptOpen] = useState(false)
  const card = cards[cardId]
  const board = card ? boards[card.boardId] : undefined
  if (!card || !board) return null
  const session = impact.session
  const close = () => {
    // A source card opened from "Why?" returns to the review instead of leaving it behind.
    if (session?.source?.cardId === card.id && session.cardId !== card.id) {
      impact.setSource(undefined)
      navigate(paths.card(session.cardId, card.boardId))
      return
    }
    // Leaving a review never loses the draft (spec rule 8): ask first. A draft with no review is simply kept.
    const isPendingDate =
      (session?.kind === 'date' || session?.kind === 'description') && session.cardId === card.id && ['draft', 'checking', 'review'].includes(session.phase)
    if ((card.isDraft && session?.cardId === card.id && session.review) || isPendingDate) {
      setClosePromptOpen(true)
      return
    }
    onClose()
  }
  return (
    <>
      <Modal onClose={close} width="x-large" label={card.title}>
        <CardDetails card={card} board={board} list={lists[card.listId]} onClose={close} />
      </Modal>
      <ModalTransition>
        {isClosePromptOpen && (
          <Modal onClose={() => setClosePromptOpen(false)} width="small" label="Close review?">
            <ModalHeader hasCloseButton>
              <ModalTitle>Close review?</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <Text as="p">
                {session?.kind === 'date'
                  ? 'Your proposed date and this review are kept for this session. To pick them up again, open Dates on this card.'
                  : session?.kind === 'description'
                    ? 'Your edit and this review are kept for this session. The card shows Unsaved changes, and the editor reopens with your text.'
                    : `Your draft and this review are kept for this session. To pick them up again, choose Add a card in ${lists[card.listId]?.title ?? 'the list'}.`}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button
                appearance="subtle"
                onClick={() => {
                  setClosePromptOpen(false)
                  onClose()
                }}
              >
                Keep draft and close
              </Button>
              <Button appearance="primary" autoFocus onClick={() => setClosePromptOpen(false)}>
                Return to review
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>
    </>
  )
}

function triggerButton(label: string, icon: ComponentType<NewCoreIconProps>) {
  return function Trigger({ triggerProps, isOpen, toggle }: PopoverTriggerArgs) {
    return (
      <Button {...triggerProps} iconBefore={icon} isSelected={isOpen} onClick={toggle}>
        {label}
      </Button>
    )
  }
}

function addTrigger(label: string, shape: 'circle' | 'default') {
  return function Trigger({ triggerProps, isOpen, toggle }: PopoverTriggerArgs) {
    return <IconButton {...triggerProps} shape={shape} icon={AddIcon} label={label} isSelected={isOpen} onClick={toggle} />
  }
}

function CompleteIcon(props: NewCoreIconProps) {
  return <CheckCircleIcon {...props} color={token('color.icon.success')} />
}

function CardDetails({ card, board, list, onClose }: { card: Card; board: Board; list?: List; onClose: () => void }) {
  const dispatch = useDispatch()
  const { boards } = useAppState()
  const { showFlag } = useFlags()
  const impact = useImpact()
  const hasImpact = impact.session?.cardId === card.id
  const isDraft = !!card.isDraft
  const isViewingSource = !!impact.session && impact.session.source?.cardId === card.id && !hasImpact
  // Which Impact state this card shows: its own review's phase, or the source view.
  const impactState = isViewingSource ? 'source' : hasImpact ? impact.session!.phase : undefined
  const showsImpact = impactState !== undefined && impactState !== 'draft' && impactState !== 'done'
  // The side panel shows one of the tab bar's panels. A running review brings Impact forward; the draft shows Comments.
  const [sidePanel, setSidePanel] = useState<'comments' | 'impact' | null>(showsImpact || impact.impactTabRequest === card.id ? 'impact' : 'comments')
  // Review impact on the early-finish flag opens this card on the Impact tab, even if it's already open.
  const { impactTabRequest, clearImpactTabRequest } = impact
  const [handledRequest, setHandledRequest] = useState<string | null>(null)
  if (impactTabRequest !== handledRequest) {
    setHandledRequest(impactTabRequest)
    if (impactTabRequest === card.id) setSidePanel('impact')
  }
  useEffect(() => {
    if (impactTabRequest === card.id) clearImpactTabRequest()
  }, [impactTabRequest, card.id, clearImpactTabRequest])
  const [lastImpactState, setLastImpactState] = useState(impactState)
  if (lastImpactState !== impactState) {
    setLastImpactState(impactState)
    if (showsImpact) setSidePanel('impact')
    else if (impactState === 'draft' || impactState === undefined) setSidePanel((current) => (current === 'impact' ? 'comments' : current))
  }
  // A date review in draft (Back to edit, Stop checking) reopens Dates with the proposed dates.
  const isEditingDate = hasImpact && impact.session!.kind === 'date' && impactState === 'draft'
  const isUnsavedDate = hasImpact && impact.session!.kind === 'date' && ['draft', 'checking', 'review'].includes(impactState ?? '')
  const [isDatesOpen, setDatesOpen] = useState(false)
  const [wasEditingDate, setWasEditingDate] = useState(isEditingDate)
  if (wasEditingDate !== isEditingDate) {
    setWasEditingDate(isEditingDate)
    setDatesOpen(isEditingDate)
  }
  const onDatesOpenChange = (open: boolean) => {
    setDatesOpen(open)
    // Closing Dates while editing a date review is Trello's cancel: the unsaved date is discarded.
    if (!open && impact.session?.cardId === card.id && impact.session.kind === 'date' && impact.session.phase === 'draft') impact.cancelDraft()
  }
  const togglePanel = (panel: 'comments' | 'impact') => {
    // The Impact tab reopens a review kept with the draft.
    if (panel === 'impact' && impactState === 'draft' && impact.session?.review) {
      impact.reopenReview()
      setSidePanel('impact')
      return
    }
    setSidePanel((current) => (current === panel ? null : panel))
  }
  const [isTitleHidden, setTitleHidden] = useState(false)
  // A shortcut button hides once its field has a value, but not while its popover is still open.
  const [openShortcut, setOpenShortcut] = useState<string | null>(null)
  const trackShortcut = (name: string) => (isOpen: boolean) => setOpenShortcut(isOpen ? name : null)
  const titleRef = useRef<HTMLDivElement>(null)
  const cardLabels = card.labelIds.map((id) => board.labels.find((l) => l.id === id)).filter((l) => l !== undefined)
  const status = card.dueDate ? getDueStatus(card.dueDate, card.isDueComplete) : null

  useEffect(() => {
    dispatch({ type: 'card/viewed', cardId: card.id })
  }, [card.id, dispatch])

  // Once the title scrolls out of view, a compact title bar takes its place, as in Trello.
  useEffect(() => {
    const element = titleRef.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setTitleHidden(!entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const archive = () => {
    dispatch({ type: 'card/setArchived', cardId: card.id, isArchived: true })
    showFlag({
      title: 'Card archived',
      description: card.title,
      isAutoDismiss: true,
      actions: [{ content: 'Undo', onClick: () => dispatch({ type: 'card/setArchived', cardId: card.id, isArchived: false }) }],
    })
  }
  const remove = () => {
    onClose()
    dispatch({ type: 'card/delete', cardId: card.id })
  }

  const completeButton = (
    <Tooltip content={card.isComplete ? 'Mark incomplete' : 'Mark complete'}>
      <IconButton
        appearance="subtle"
        shape="circle"
        icon={card.isComplete ? CompleteIcon : CheckCircleUncheckedIcon}
        label={card.isComplete ? 'Mark incomplete' : 'Mark complete'}
        isSelected={false}
        aria-pressed={!!card.isComplete}
        onClick={() => dispatch({ type: 'card/toggleComplete', cardId: card.id })}
      />
    </Tooltip>
  )

  return (
    <>
      <Box xcss={styles.topBar}>
        <CardPopover
          title="Move card"
          trigger={({ triggerProps, isOpen, toggle }) => (
            <Pressable {...triggerProps} xcss={cx(styles.listPill, pillColors[list?.color ?? 'neutral'])} aria-expanded={isOpen} onClick={toggle}>
              {list?.title ?? 'Inbox'}
              <ChevronDownIcon label="" size="small" />
            </Pressable>
          )}
        >
          {(close) => (isDraft ? <DraftListPicker card={card} board={board} onDone={close} /> : <MovePicker card={card} onDone={close} />)}
        </CardPopover>
        <Inline space="space.050" alignBlock="center">
          <CardPopover
            title="Cover"
            placement="bottom-end"
            trigger={({ triggerProps, isOpen, toggle }) => (
              <IconButton {...triggerProps} appearance="subtle" icon={ImageIcon} label="Cover" isSelected={isOpen} onClick={toggle} />
            )}
          >
            {(close) => <CoverPicker card={card} onDone={close} />}
          </CardPopover>
          <IconButton
            appearance="subtle"
            icon={card.isWatching ? EyeOpenFilledIcon : EyeOpenIcon}
            label={card.isWatching ? 'Stop watching' : 'Watch'}
            isTooltipDisabled={false}
            isSelected={!!card.isWatching}
            onClick={() => dispatch({ type: 'card/toggleWatch', cardId: card.id })}
          />
          <DropdownMenu
            placement="bottom-end"
            trigger={({ triggerRef, ...props }) => (
              <IconButton {...props} ref={triggerRef} appearance="subtle" icon={ShowMoreHorizontalIcon} label="Card actions" isDisabled={isDraft} />
            )}
          >
            <DropdownItemGroup>
              <DropdownItem onClick={() => dispatch({ type: 'card/toggleWatch', cardId: card.id })}>{card.isWatching ? 'Stop watching' : 'Watch'}</DropdownItem>
              {card.isArchived ? (
                <>
                  <DropdownItem onClick={() => dispatch({ type: 'card/setArchived', cardId: card.id, isArchived: false })}>Send to board</DropdownItem>
                  <DropdownItem onClick={remove}>Delete</DropdownItem>
                </>
              ) : (
                <DropdownItem elemBefore={<ArchiveBoxIcon label="" />} onClick={archive}>
                  Archive
                </DropdownItem>
              )}
            </DropdownItemGroup>
          </DropdownMenu>
          <CloseButton onClick={onClose} label="Close card" />
        </Inline>
      </Box>

      {card.isArchived && (
        <Box xcss={styles.archived}>
          <SectionMessage
            appearance="warning"
            title="This card is archived"
            actions={[
              <SectionMessageAction key="restore" onClick={() => dispatch({ type: 'card/setArchived', cardId: card.id, isArchived: false })}>
                Send to board
              </SectionMessageAction>,
              <SectionMessageAction key="delete" onClick={remove}>
                Delete card
              </SectionMessageAction>,
            ]}
          >
            <Text as="p">Archived cards are hidden from the board. Send it back to the board to keep working on it.</Text>
          </SectionMessage>
        </Box>
      )}

      <Box xcss={styles.frame}>
        <Box xcss={cx(styles.layout, !sidePanel && styles.layoutSingle)}>
          <Box xcss={styles.mainWrap}>
            {isTitleHidden && (
              <Box xcss={styles.compactBar}>
                {completeButton}
                <Box xcss={styles.grow}>
                  <Text weight="bold" maxLines={1}>
                    {card.title}
                  </Text>
                </Box>
                <AddToCardMenu card={card} board={board} />
              </Box>
            )}
            <Box xcss={styles.main}>
              <Stack space="space.300">
                <Box ref={titleRef} xcss={styles.titleRow}>
                  {completeButton}
                  <Box xcss={styles.titleEdit}>
                    <InlineEdit
                      key={card.title}
                      defaultValue={card.title}
                      editButtonLabel={`Edit card title: ${card.title}`}
                      hideActionButtons
                      readViewFitContainerWidth
                      onConfirm={(value: string) => value.trim() && dispatch({ type: 'card/update', cardId: card.id, patch: { title: value.trim() } })}
                      editView={({ errorMessage: _errorMessage, ...fieldProps }, ref) => (
                        <Textfield {...fieldProps} ref={ref} autoFocus aria-label="Card title" />
                      )}
                      readView={() => (
                        <Box xcss={styles.titleRead}>
                          <Heading size="large" as="h2">
                            {card.title}
                          </Heading>
                        </Box>
                      )}
                    />
                  </Box>
                </Box>

                <Box xcss={styles.indent}>
                  <Stack space="space.300">
                    {isDraft && (
                      <Box xcss={styles.draftNote}>
                        <Text color="color.text.subtle">Not created yet</Text>
                      </Box>
                    )}
                    <Inline space="space.100" shouldWrap>
                      <AddToCardMenu card={card} board={board} />
                      {(cardLabels.length === 0 || openShortcut === 'labels') && (
                        <CardPopover title="Labels" onOpenChange={trackShortcut('labels')} trigger={triggerButton('Labels', TagIcon)}>
                          {() => <LabelsPicker card={card} board={board} />}
                        </CardPopover>
                      )}
                      {((!card.dueDate && !card.startDate) || openShortcut === 'dates') && (
                        <CardPopover
                          title="Dates"
                          placement="right-start"
                          isOpen={card.dueDate || card.startDate ? undefined : isDatesOpen}
                          onOpenChange={(open) => {
                            trackShortcut('dates')(open)
                            onDatesOpenChange(open)
                          }}
                          trigger={triggerButton('Dates', ClockIcon)}
                        >
                          {(close) => <DatesPicker card={card} onDone={close} />}
                        </CardPopover>
                      )}
                      {isUnsavedDate && !card.dueDate && !card.startDate && <Lozenge appearance="warning">Unsaved changes</Lozenge>}
                      <CardPopover title="Add checklist" trigger={triggerButton('Checklist', ListChecklistIcon)}>
                        {(close) => <ChecklistCreator card={card} onDone={close} />}
                      </CardPopover>
                      {!isDraft && (card.memberIds.length === 0 || openShortcut === 'members') && (
                        <CardPopover title="Members" onOpenChange={trackShortcut('members')} trigger={triggerButton('Members', PersonIcon)}>
                          {() => <MembersPicker card={card} board={board} />}
                        </CardPopover>
                      )}
                      <CardPopover title="Attach" trigger={triggerButton('Attachment', AttachmentIcon)}>
                        {(close) => <AttachmentPicker card={card} onDone={close} />}
                      </CardPopover>
                    </Inline>

                    {(card.memberIds.length > 0 || cardLabels.length > 0 || card.dueDate || card.startDate) && (
                      <Inline space="space.300" shouldWrap rowSpace="space.200">
                        {card.memberIds.length > 0 && (
                          <MetaBlock label="Members">
                            <Inline space="space.050" alignBlock="center" shouldWrap>
                              {card.memberIds.map((id) => (
                                <MemberAvatar key={id} name={membersById[id].fullName} size="medium" />
                              ))}
                              <CardPopover title="Members" trigger={addTrigger('Add member', 'circle')}>
                                {() => <MembersPicker card={card} board={board} />}
                              </CardPopover>
                            </Inline>
                          </MetaBlock>
                        )}
                        {cardLabels.length > 0 && (
                          <MetaBlock label="Labels">
                            <Inline space="space.050" alignBlock="center" shouldWrap>
                              {cardLabels.map((label) => (
                                <LabelChip key={label.id} label={label} size="regular" />
                              ))}
                              <CardPopover title="Labels" trigger={addTrigger('Add label', 'default')}>
                                {() => <LabelsPicker card={card} board={board} />}
                              </CardPopover>
                            </Inline>
                          </MetaBlock>
                        )}
                        {(card.dueDate || card.startDate) && (
                          <MetaBlock label="Dates">
                            <Inline space="space.050" alignBlock="center">
                              {card.dueDate && (
                                <Checkbox
                                  isChecked={card.isDueComplete}
                                  onChange={() => dispatch({ type: 'card/toggleDueComplete', cardId: card.id })}
                                  label={<VisuallyHidden>Due date complete</VisuallyHidden>}
                                />
                              )}
                              <CardPopover
                                title="Dates"
                                // Opening to the side lets the tall Dates popover shift up to fit, as in Trello.
                                placement="right-start"
                                isOpen={isDatesOpen}
                                onOpenChange={onDatesOpenChange}
                                trigger={({ triggerProps, isOpen, toggle }) => (
                                  <Button {...triggerProps} iconAfter={ChevronDownIcon} isSelected={isOpen} onClick={toggle}>
                                    <Inline space="space.100" alignBlock="center" as="span">
                                      {formatDateRange(card)}
                                      {card.recurring && card.recurring !== 'never' && <RefreshIcon label="Recurring" size="small" />}
                                      {status === 'complete' && <Lozenge appearance="success">Complete</Lozenge>}
                                      {status === 'overdue' && <Lozenge appearance="danger">Overdue</Lozenge>}
                                      {status === 'due-soon' && <Lozenge appearance="warning">Due soon</Lozenge>}
                                    </Inline>
                                  </Button>
                                )}
                              >
                                {(close) => <DatesPicker card={card} onDone={close} />}
                              </CardPopover>
                              {/* Trello's unsaved-changes marker while a date review is kept but not applied (spec rule 8). */}
                              {isUnsavedDate && <Lozenge appearance="warning">Unsaved changes</Lozenge>}
                            </Inline>
                          </MetaBlock>
                        )}
                      </Inline>
                    )}
                  </Stack>
                </Box>

                <Description card={card} />

                {/* S1/01: the draft keeps Trello's Add card and Cancel; Impact only adds Review impact beside them (spec rule 1). */}
                {isDraft && impactState === 'draft' && (
                  <Box xcss={styles.indent}>
                    <Inline space="space.100" alignBlock="center">
                      <Button appearance="primary" onClick={impact.addCard}>
                        Add card
                      </Button>
                      <Button iconBefore={AiSparkleIcon} onClick={impact.review}>
                        Review impact
                      </Button>
                      <Button
                        appearance="subtle"
                        onClick={() => {
                          impact.cancelDraft()
                          navigate(paths.board(board, boards))
                        }}
                      >
                        Cancel
                      </Button>
                    </Inline>
                  </Box>
                )}

                <CardAttachments
                  card={card}
                  addButton={
                    <CardPopover
                      title="Attach"
                      placement="bottom-end"
                      trigger={({ triggerProps, isOpen, toggle }) => (
                        <Button {...triggerProps} spacing="compact" isSelected={isOpen} onClick={toggle}>
                          Add
                        </Button>
                      )}
                    >
                      {(close) => <AttachmentPicker card={card} onDone={close} />}
                    </CardPopover>
                  }
                />

                <CardChecklists card={card} />
              </Stack>
            </Box>
          </Box>

          {sidePanel && <Box xcss={styles.aside}>{sidePanel === 'impact' ? <ImpactPanel card={card} /> : <CardActivity card={card} />}</Box>}
        </Box>
      </Box>
      <CardTabBar
        isCommentsOpen={sidePanel === 'comments'}
        onToggleComments={() => togglePanel('comments')}
        impact={{ isOpen: sidePanel === 'impact', onToggle: () => togglePanel('impact') }}
      />
    </>
  )
}

/** Drafts are not on a list yet, so choosing a list only changes where Apply will create the card. */
function DraftListPicker({ card, board, onDone }: { card: Card; board: Board; onDone: () => void }) {
  const { lists } = useAppState()
  const dispatch = useDispatch()
  return (
    <Box xcss={styles.bleed}>
      <MenuGroup>
        <Section title="Create in list">
          {board.listIds
            .filter((id) => !lists[id].isArchived)
            .map((id) => (
              <ButtonItem
                key={id}
                isSelected={id === card.listId}
                onClick={() => {
                  dispatch({ type: 'card/updateDraft', cardId: card.id, patch: { listId: id } })
                  onDone()
                }}
              >
                {lists[id].title}
              </ButtonItem>
            ))}
        </Section>
      </MenuGroup>
    </Box>
  )
}

type AddView = 'labels' | 'dates' | 'checklist' | 'members' | 'attachment' | 'card' | 'cover'

const addOptions: { view: AddView; label: string; description: string; icon: ComponentType<NewCoreIconProps> }[] = [
  { view: 'labels', label: 'Labels', description: 'Organize, categorize, and prioritize', icon: TagIcon },
  { view: 'dates', label: 'Dates', description: 'Due dates and reminders', icon: ClockIcon },
  { view: 'checklist', label: 'Checklist', description: 'Add subtasks', icon: ListChecklistIcon },
  { view: 'members', label: 'Members', description: 'Assign members', icon: PersonIcon },
  { view: 'attachment', label: 'Attachment', description: 'Add files and links', icon: AttachmentIcon },
  { view: 'card', label: 'Trello card', description: 'Link a related card', icon: CardIcon },
  { view: 'cover', label: 'Cover', description: 'Add a color to the card front', icon: ImageIcon },
]

/** Trello's "+ Add" menu: every card field in one place, each opening its picker in the same popover. */
function AddToCardMenu({ card, board }: { card: Card; board: Board }) {
  const [view, setView] = useState<AddView | null>(null)
  const option = addOptions.find((o) => o.view === view)
  return (
    <CardPopover
      title="Add to card"
      trigger={({ triggerProps, isOpen, toggle }) => (
        <Button
          {...triggerProps}
          iconBefore={AddIcon}
          isSelected={isOpen}
          onClick={() => {
            setView(null)
            toggle()
          }}
        >
          Add
        </Button>
      )}
    >
      {(close) => {
        const done = () => {
          setView(null)
          close()
        }
        if (!option) {
          return (
            <Box xcss={styles.bleed}>
              <MenuGroup>
                <Section>
                  {addOptions.map((o) => (
                    <ButtonItem key={o.view} iconBefore={<o.icon label="" />} description={o.description} onClick={() => setView(o.view)}>
                      {o.label}
                    </ButtonItem>
                  ))}
                </Section>
              </MenuGroup>
            </Box>
          )
        }
        return (
          <Stack space="space.050">
            <Box xcss={styles.backRow}>
              <Button appearance="subtle" spacing="compact" iconBefore={ChevronLeftIcon} onClick={() => setView(null)}>
                {option.label}
              </Button>
            </Box>
            {view === 'labels' && <LabelsPicker card={card} board={board} />}
            {view === 'dates' && <DatesPicker card={card} onDone={done} />}
            {view === 'checklist' && <ChecklistCreator card={card} onDone={done} />}
            {view === 'members' && <MembersPicker card={card} board={board} />}
            {view === 'attachment' && <AttachmentPicker card={card} onDone={done} />}
            {view === 'card' && <CardLinkPicker card={card} onDone={done} />}
            {view === 'cover' && <CoverPicker card={card} onDone={done} />}
          </Stack>
        )
      }}
    </CardPopover>
  )
}

/** "Oct 13 - Nov 16, 3:36 AM", as Trello summarizes a card's dates. */
function formatDateRange(card: Card) {
  const due = card.dueDate ? `${formatShortDate(card.dueDate)}${card.dueTime ? `, ${formatTime(card.dueTime)}` : ''}` : ''
  if (card.startDate && due) return `${formatShortDate(card.startDate)} - ${due}`
  return card.startDate ? `Starts ${formatShortDate(card.startDate)}` : due
}

function MetaBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Box xcss={styles.metaLabel}>
        <Text size="small" weight="semibold" color="color.text.subtle">
          {label}
        </Text>
      </Box>
      {children}
    </Box>
  )
}

function Description({ card }: { card: Card }) {
  const dispatch = useDispatch()
  const impact = useImpact()
  const [isEditing, setEditing] = useState(false)
  const [draft, setDraft] = useState(card.description)
  // A description review that hasn't been applied keeps the edited text, so the editor stays open with it (spec rule 8).
  const session = impact.session?.cardId === card.id && impact.session.kind === 'description' ? impact.session : undefined
  const pending = session && ['draft', 'checking', 'review'].includes(session.phase) ? session : undefined
  const isOpen = isEditing || !!pending
  const text = pending ? pending.descriptionChange!.to : draft
  const isReviewing = !!pending && pending.phase !== 'draft'
  const isChanged = text.trim() !== card.description.trim()

  const startEditing = () => {
    setDraft(card.description)
    setEditing(true)
  }
  const setText = (value: string) => (pending ? impact.setDraftDescription(value) : setDraft(value))
  const close = () => {
    if (pending) impact.cancelDraft()
    setEditing(false)
  }
  const save = () => {
    dispatch({ type: 'card/update', cardId: card.id, patch: { description: text.trim() } })
    close()
  }
  const reviewImpact = () => {
    impact.startDescriptionEdit(card.id, text.trim())
    setEditing(false)
  }

  return (
    <Stack space="space.100">
      <SectionHeading
        icon={AlignTextLeftIcon}
        title="Description"
        actions={
          card.description && !isOpen ? (
            <Button spacing="compact" onClick={startEditing}>
              Edit
            </Button>
          ) : undefined
        }
      />
      <Box xcss={styles.indent}>
        {isOpen ? (
          <Stack space="space.100">
            <Textarea
              autoFocus={!isReviewing}
              isReadOnly={isReviewing}
              aria-label="Description"
              minimumRows={5}
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
            />
            {!isReviewing && (
              <Inline space="space.050">
                <Button appearance="primary" onClick={save}>
                  Save
                </Button>
                {/* Impact only adds Review impact beside Trello's Save and Cancel (spec rule 1). */}
                {!card.isDraft && isChanged && (
                  <Button iconBefore={AiSparkleIcon} onClick={reviewImpact}>
                    Review impact
                  </Button>
                )}
                <Button appearance="subtle" onClick={close}>
                  Cancel
                </Button>
              </Inline>
            )}
            {isChanged && (
              <Box>
                <Lozenge appearance="warning">Unsaved changes</Lozenge>
              </Box>
            )}
          </Stack>
        ) : card.description ? (
          <Box xcss={styles.description}>
            <Text>{card.description}</Text>
          </Box>
        ) : (
          <Pressable xcss={styles.descriptionEmpty} onClick={startEditing}>
            <Text color="color.text.subtle">Add a more detailed description…</Text>
          </Pressable>
        )}
      </Box>
    </Stack>
  )
}
