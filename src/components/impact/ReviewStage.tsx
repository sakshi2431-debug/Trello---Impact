import { useState, type Ref } from 'react'
import Button from '@atlaskit/button/new'
import { Checkbox } from '@atlaskit/checkbox'
import { cx } from '@atlaskit/css'
import { Label } from '@atlaskit/form'
import ArrowRightIcon from '@atlaskit/icon/core/arrow-right'
import ClockIcon from '@atlaskit/icon/core/clock'
import Calendar from '@atlaskit/calendar'
import { useIsReducedMotion } from '@atlaskit/motion'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import SectionMessage, { SectionMessageAction } from '@atlaskit/section-message'
import Select from '@atlaskit/select'
import Spinner from '@atlaskit/spinner'
import Textarea from '@atlaskit/textarea'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { useImpact } from '../../impact/ImpactProvider'
import { isEvidenceFresh, resolveMentions } from '../../impact/scenarios'
import { joinNames, ownerName, plural } from '../../impact/format'
import { dayUnit, estimateTiming, formatCountedDays, formatDate, formatShortDate, shiftLabel } from '../../impact/timing'
import { PRIMARY_ACTION_ID, type ChainStep, type CommentProposal, type ImpactSession } from '../../impact/types'
import { parseIsoDate } from '../../lib/dates'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import type { Card } from '../../types'
import { TextAction, Reveal, PanelHeading, ReviewHeading, EvidenceDetails, InlineTextEditor, LeftOutNote } from './shared'
import { styles } from './styles'
import { useDisclosure, useEditFocus } from './focus'

export function DraftStage({ kind }: { kind: ImpactSession['kind'] }) {
  return (
    <PanelHeading title="Review impact">
      <Text color="color.text.subtle">
        {kind === 'date'
          ? 'Change the date in Dates, then choose Review impact.'
          : kind === 'description'
            ? 'Edit the description, then choose Review impact.'
            : 'Choose Review impact to check this board before the card is added.'}
      </Text>
    </PanelHeading>
  )
}

export function CheckingStage() {
  const { stopChecking } = useImpact()
  const isReducedMotion = useIsReducedMotion()
  return (
    <>
      <PanelHeading title="Review impact" />
      <Box xcss={styles.checking}>
        {/* The spinner has no reduced-motion style of its own, so a static clock stands in (motion audit C2). */}
        {isReducedMotion ? <ClockIcon label="" color={token('color.icon.subtle')} /> : <Spinner size="medium" label="" />}
        <Text role="status">Checking this board…</Text>
        <Text color="color.text.subtle">Your draft is unchanged.</Text>
        <Button appearance="subtle" onClick={stopChecking}>
          Stop checking
        </Button>
      </Box>
    </>
  )
}

export function ReviewStage({ card, headingRef }: { card: Card; headingRef: Ref<HTMLDivElement> }) {
  const state = useAppState()
  const { session, backToDraft, apply, review: reviewAgain } = useImpact()
  const [editingId, setEditingIdState] = useState<string | null>(null)
  const setEditingId = useEditFocus(setEditingIdState)
  const review = session!.review!
  const selected = review.proposals.filter((p) => p.isSelected)
  const leftOut = review.proposals.filter((p) => !p.isSelected).map((p) => state.cards[p.connection.cardId]?.title ?? 'A card')
  // Sources may change while the review is open.
  const stale = selected.filter((p) => !isEvidenceFresh(state, p)).map((p) => state.cards[p.connection.cardId]?.title ?? 'A source card')
  const isDate = session!.kind === 'date'
  const affected = isDate ? selected.map((p) => p.timing?.targetTitle ?? p.conflict?.targetTitle).filter((t): t is string => !!t) : []
  const unchanged =
    affected.length === 1 ? `${affected[0]}’s date will stay unchanged.` : affected.length > 1 ? 'Other cards’ dates will stay unchanged.' : undefined
  const count = review.proposals.length
  const attention = count === 0 ? 'No other cards may need attention' : `${plural(count, 'card', 'cards')} may need attention`

  return (
    <>
      <ReviewHeading headingRef={headingRef} attention={attention} scope={review.scope} />

      {/* Change: the person's own action is the first row, always included, with no checkbox. */}
      <Box xcss={styles.section}>
        {isDate ? (
          <SaveDateAction card={card} isEditing={editingId === PRIMARY_ACTION_ID} onEdit={setEditingId} />
        ) : (
          <CreateAction card={card} isEditing={editingId === PRIMARY_ACTION_ID} onEdit={setEditingId} />
        )}
      </Box>

      {review.proposals.map((proposal) => (
        <Box key={proposal.id} xcss={styles.section}>
          <CommentAction card={card} proposal={proposal} editingId={editingId} onEdit={setEditingId} />
        </Box>
      ))}

      {/* Pinned to the bottom of the panel, so Apply stays reachable while evidence is expanded. */}
      <Box xcss={cx(styles.section, styles.footer)} testId="impact-footer">
        <Stack space="space.200">
          {stale.length > 0 && (
            <SectionMessage
              appearance="warning"
              title="Needs fresh review"
              actions={[
                <SectionMessageAction key="again" onClick={reviewAgain}>
                  Review again
                </SectionMessageAction>,
              ]}
            >
              <Text as="p">{`${joinNames(stale)} changed since this review.`}</Text>
            </SectionMessage>
          )}
          <Stack space="space.100">
            {/* Announced when ticking changes it (motion audit C5). */}
            <Box aria-live="polite" aria-atomic="true">
              <Text weight="semibold">{`${isDate ? 'Updates 1 date' : 'Creates 1 card'}${selected.length ? ` and posts ${plural(selected.length, 'comment', 'comments')}` : ''}.`}</Text>
            </Box>
            {unchanged && <Text color="color.text.subtle">{unchanged}</Text>}
            <LeftOutNote titles={leftOut} />
            <Text size="small" color="color.text.subtle">
              Suggestions are AI generated and can be wrong. Nothing changes until you apply.
            </Text>
          </Stack>
          <Inline space="space.100" spread="space-between" alignBlock="center">
            <Button onClick={backToDraft}>{isDate ? 'Back to edit' : 'Back to draft'}</Button>
            <Button appearance="primary" isDisabled={editingId !== null || stale.length > 0} onClick={apply}>
              {`Apply ${plural(1 + selected.length, 'action', 'actions')}`}
            </Button>
          </Inline>
        </Stack>
      </Box>
    </>
  )
}

function CreateAction({ card, isEditing, onEdit }: { card: Card; isEditing: boolean; onEdit: (id: string | null) => void }) {
  const { lists, boards } = useAppState()
  const dispatch = useDispatch()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [listId, setListId] = useState(card.listId)
  const listOptions = boards[card.boardId].listIds.filter((id) => !lists[id].isArchived).map((id) => ({ label: lists[id].title, value: id }))
  const isChanged = title.trim() !== card.title || description.trim() !== card.description || listId !== card.listId

  const startEditing = () => {
    setTitle(card.title)
    setDescription(card.description)
    setListId(card.listId)
    onEdit(PRIMARY_ACTION_ID)
  }

  return (
    <Box xcss={styles.indent}>
      <Stack space="space.075">
        <Text weight="semibold">{`Create ${card.title}`}</Text>
        {isEditing ? (
          <Stack space="space.150">
            <Stack space="space.050">
              <Label htmlFor="impact-create-title">Title</Label>
              <Textfield id="impact-create-title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
            </Stack>
            <Stack space="space.050">
              <Label htmlFor="impact-create-list">List</Label>
              <Select
                inputId="impact-create-list"
                options={listOptions}
                value={listOptions.find((o) => o.value === listId)}
                onChange={(o) => o && setListId(o.value)}
              />
            </Stack>
            <Stack space="space.050">
              <Label htmlFor="impact-create-description">Description</Label>
              <Textarea id="impact-create-description" minimumRows={3} value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
            </Stack>
            <Text size="small" color="color.text.subtle">
              Nothing changes in Trello until you select Apply.
            </Text>
            <Inline space="space.150" alignBlock="center">
              <Button
                isDisabled={!isChanged || !title.trim()}
                onClick={() => {
                  dispatch({ type: 'card/updateDraft', cardId: card.id, patch: { title: title.trim(), description: description.trim(), listId } })
                  onEdit(null)
                }}
              >
                Save changes
              </Button>
              <TextAction onClick={() => onEdit(null)}>Cancel</TextAction>
            </Inline>
          </Stack>
        ) : (
          <>
            <Text>{`In ${lists[card.listId].title} · Always included`}</Text>
            {card.description && (
              <Box xcss={styles.wrap}>
                <Text>{card.description}</Text>
              </Box>
            )}
            <Box>
              <TextAction onClick={startEditing} label={`Edit Create ${card.title}`}>
                Edit
              </TextAction>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  )
}

export function CommentAction({
  card,
  proposal,
  editingId,
  onEdit,
}: {
  card: Card
  proposal: CommentProposal
  editingId: string | null
  onEdit: (id: string | null) => void
}) {
  const isEditing = editingId === proposal.id
  const state = useAppState()
  const { updateProposal, setSource } = useImpact()
  const [isWhyOpen, setWhyOpen] = useDisclosure()
  const target = state.cards[proposal.connection.cardId]
  const targetTitle = target?.title ?? 'a deleted card'
  const mentions = resolveMentions(state, card.boardId, proposal.text).map((m) => m.fullName.split(' ')[0])
  const actionName = `Post comment on ${targetTitle}`
  const { evidence } = proposal.connection

  return (
    <Stack space="space.075">
      <Checkbox isChecked={proposal.isSelected} onChange={() => updateProposal(proposal.id, { isSelected: !proposal.isSelected })} label={actionName} />
      <Box xcss={styles.indent}>
        {isEditing ? (
          <InlineTextEditor
            id={`impact-edit-${proposal.id}`}
            label="Comment"
            initial={proposal.text}
            before={<Text size="small" color="color.text.subtle">{`Post on ${targetTitle}`}</Text>}
            onSave={(text) => {
              updateProposal(proposal.id, { text, isTextEdited: true })
              onEdit(null)
            }}
            onCancel={() => onEdit(null)}
          />
        ) : (
          <Stack space="space.075">
            <Box xcss={styles.wrap}>
              <Text>{proposal.text}</Text>
            </Box>
            <Text size="small" color="color.text.subtle">
              {`Post on ${targetTitle} · ${mentions.length ? `Mention ${mentions.join(', ')}` : 'No mention'}`}
            </Text>
            <Inline space="space.200">
              <TextAction onClick={() => setWhyOpen((v) => !v)} label={`Why? ${actionName}`}>
                Why?
              </TextAction>
              <TextAction
                onClick={() => {
                  onEdit(proposal.id)
                }}
                label={`Edit ${actionName}`}
              >
                Edit
              </TextAction>
            </Inline>
            {isWhyOpen && (
              <EvidenceDetails
                sourceLabel={evidence.sourceLabel}
                quote={evidence.quote}
                interpretation={evidence.interpretation}
                onOpenSource={
                  target
                    ? () => {
                        const sourceId = evidence.sourceCardId ?? target.id
                        setSource({ cardId: sourceId, proposalId: proposal.id })
                        navigate(paths.card(sourceId, card.boardId))
                      }
                    : undefined
                }
                onHide={() => setWhyOpen(false)}
              >
                {proposal.timing && <TimingDetails proposal={proposal} isEditing={editingId === `${proposal.id}:timing`} onEdit={onEdit} />}
                {proposal.conflict && <ConflictDetails proposal={proposal} />}
              </EvidenceDetails>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}

function SaveDateAction({ card, isEditing, onEdit }: { card: Card; isEditing: boolean; onEdit: (id: string | null) => void }) {
  const { session, setProposedDate } = useImpact()
  const change = session!.dateChange!
  const [selected, setSelected] = useState(change.to)
  const initial = parseIsoDate(change.to)
  return (
    <Box xcss={styles.indent}>
      <Stack space="space.075">
        <Text weight="semibold">{`Save ${card.title} date`}</Text>
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Box xcss={styles.previousDate}>
            <Text>{change.from ? formatShortDate(change.from) : 'No date'}</Text>
          </Box>
          <ArrowRightIcon label="to" size="small" color={token('color.icon.subtle')} />
          <Text>{formatDate(change.to)}</Text>
        </Inline>
        <Text color="color.text.subtle">Not saved yet · Always included</Text>
        {isEditing ? (
          <Stack space="space.150">
            <Calendar
              defaultMonth={initial.getMonth() + 1}
              defaultYear={initial.getFullYear()}
              selected={[selected]}
              previouslySelected={[]}
              onSelect={(e) => setSelected(e.iso)}
              testId="impact-date-calendar"
            />
            <Text size="small" color="color.text.subtle">
              Nothing changes in Trello until you select Apply.
            </Text>
            <Inline space="space.150" alignBlock="center">
              <Button
                isDisabled={selected === change.to || selected === change.from}
                onClick={() => {
                  onEdit(null)
                  setProposedDate(selected)
                }}
              >
                Save changes
              </Button>
              <TextAction onClick={() => onEdit(null)}>Cancel</TextAction>
            </Inline>
          </Stack>
        ) : (
          <Box>
            <TextAction
              onClick={() => {
                setSelected(change.to)
                onEdit(PRIMARY_ACTION_ID)
              }}
              label={`Edit Save ${card.title} date`}
            >
              Edit
            </TextAction>
          </Box>
        )}
      </Stack>
    </Box>
  )
}

/** The estimate behind a date question: its inputs, the arithmetic, and editable assumptions. */
function TimingDetails({ proposal, isEditing, onEdit }: { proposal: CommentProposal; isEditing: boolean; onEdit: (id: string | null) => void }) {
  const { updateTiming } = useImpact()
  const timing = proposal.timing!
  const { result, steps } = estimateTiming(timing)
  const [isCalculationOpen, setCalculationOpen] = useDisclosure()
  const [days, setDays] = useState(String(timing.workingDays))
  const [countWeekends, setCountWeekends] = useState(timing.countWeekends)
  const parsedDays = Number(days)
  const isValid = Number.isInteger(parsedDays) && parsedDays >= 0 && parsedDays <= 30
  const editId = `${proposal.id}:timing`
  return (
    <Stack space="space.075">
      <Text>{`Current due date: ${formatShortDate(timing.currentDue)}`}</Text>
      <Text weight="semibold">{`Estimated ready date: ${formatShortDate(result)}, ${shiftLabel(timing.currentDue, result)}`}</Text>
      <Text
        size="small"
        color="color.text.subtle"
      >{`Assumes ${timing.workingDays} ${dayUnit(timing.workingDays, timing.countWeekends)} after ${timing.basis}. Needs confirmation.`}</Text>
      {isEditing ? (
        <Stack space="space.150">
          <Stack space="space.050">
            <Label htmlFor={`${editId}-days`}>{`Days after ${timing.basis}`}</Label>
            <Textfield
              id={`${editId}-days`}
              type="number"
              min={0}
              max={30}
              value={days}
              onChange={(e) => setDays(e.currentTarget.value)}
              isInvalid={!isValid}
            />
          </Stack>
          <Checkbox isChecked={countWeekends} onChange={() => setCountWeekends((v) => !v)} label="Count weekends as working days" />
          <Text size="small" color="color.text.subtle">
            Nothing changes in Trello until you select Apply.
          </Text>
          <Inline space="space.150" alignBlock="center">
            <Button
              isDisabled={!isValid || (parsedDays === timing.workingDays && countWeekends === timing.countWeekends)}
              onClick={() => {
                updateTiming(proposal.id, { workingDays: parsedDays, countWeekends })
                onEdit(null)
              }}
            >
              Save changes
            </Button>
            <TextAction onClick={() => onEdit(null)}>Cancel</TextAction>
          </Inline>
        </Stack>
      ) : (
        <>
          <Inline space="space.200">
            <TextAction onClick={() => setCalculationOpen((v) => !v)}>{isCalculationOpen ? 'Hide calculation' : 'View calculation'}</TextAction>
            <TextAction
              onClick={() => {
                setDays(String(timing.workingDays))
                setCountWeekends(timing.countWeekends)
                onEdit(editId)
              }}
            >
              Edit assumptions
            </TextAction>
          </Inline>
          {isCalculationOpen && (
            <Reveal>
              <Box xcss={styles.evidence}>
                <Stack space="space.050">
                  <Text>
                    {timing.workingDays === 0 ? 'No days counted.' : `Counted ${timing.countWeekends ? 'days' : 'working days'}: ${formatCountedDays(steps)}.`}
                  </Text>
                  <Text>{`Assumes ${timing.anchorTitle} is complete on its proposed due date, ${formatShortDate(timing.anchorDate)}.`}</Text>
                  <Text>{timing.countWeekends ? 'Starts the next day.' : 'Starts the next working day.'}</Text>
                  <Text>{timing.countWeekends ? 'Weekends counted; public holidays not excluded.' : 'Weekends excluded; public holidays not excluded.'}</Text>
                  <Text>Conditional estimate, not an agreed deadline.</Text>
                </Stack>
              </Box>
            </Reveal>
          )}
        </>
      )}
    </Stack>
  )
}

/** A date clash behind a question, when there is no offset to calculate. */
function ConflictDetails({ proposal }: { proposal: CommentProposal }) {
  const conflict = proposal.conflict!
  return (
    <Stack space="space.075">
      {conflict.currentDue && <Text>{`Current due date: ${formatShortDate(conflict.currentDue)}`}</Text>}
      <Text weight="semibold">{conflict.reason}</Text>
      {proposal.chain && <ChainDetails chain={proposal.chain} />}
      <Text size="small" color="color.text.subtle">
        Needs confirmation.
      </Text>
    </Stack>
  )
}

/** How a date change reaches a card through other cards, one step per card, each with the date it may move to. */
function ChainDetails({ chain }: { chain: ChainStep[] }) {
  return (
    <Stack space="space.075">
      <Text weight="semibold">{`How it reaches ${chain[chain.length - 1].title}`}</Text>
      {chain.map((step, i) => (
        <Box key={step.cardId} xcss={styles.statusRow}>
          <Text size="small" color="color.text.subtle">{`${i + 1}.`}</Text>
          <Stack space="space.025">
            <Text size="small" weight="semibold">
              {step.title}
            </Text>
            <Text size="small">
              {i === 0
                ? `Your change: due ${formatShortDate(step.date)}`
                : `${step.link?.replace(/^./, (c) => c.toUpperCase())} · may move to ${formatShortDate(step.date)}, due ${formatShortDate(step.currentDue!)}`}
            </Text>
          </Stack>
        </Box>
      ))}
    </Stack>
  )
}

/** Shown on a source card opened from Why?, so the person can read it and return. */
export function SourceStage({ card }: { card: Card }) {
  const state = useAppState()
  const { session, setSource } = useImpact()
  const proposal = session?.review?.proposals.find((p) => p.id === session.source?.proposalId)
  const name = ownerName(proposal ? state.cards[proposal.connection.cardId] : card)
  const back = () => {
    setSource(undefined)
    if (session) navigate(paths.card(session.cardId, state.cards[session.cardId]?.boardId))
  }
  return (
    <>
      <PanelHeading title="Review impact">
        <Text size="small" color="color.text.subtle">
          {name ? `Source for your question to ${name}` : 'Source for your question'}
        </Text>
      </PanelHeading>
      <Stack space="space.200">
        {proposal && (
          <Box xcss={styles.box}>
            <Stack space="space.050">
              <Text size="small" color="color.text.subtle">
                {proposal.connection.evidence.sourceName}
              </Text>
              <Text>{`“${proposal.connection.evidence.quote}”`}</Text>
            </Stack>
          </Box>
        )}
        <Text>{`This sentence is why Impact suggested asking ${name ?? 'the card owner'}. It is a possible connection, not a confirmed one.`}</Text>
        <Box>
          <Button onClick={back}>Back to impact review</Button>
        </Box>
        <Text size="small" color="color.text.subtle">
          Your draft is kept.
        </Text>
      </Stack>
    </>
  )
}
