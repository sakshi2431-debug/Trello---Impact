import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import Button from '@atlaskit/button/new'
import Calendar from '@atlaskit/calendar'
import { Checkbox } from '@atlaskit/checkbox'
import { cssMap, cx } from '@atlaskit/css'
import { Label } from '@atlaskit/form'
import Heading from '@atlaskit/heading'
import AiSparkleIcon from '@atlaskit/icon/core/ai-sparkle'
import ArrowRightIcon from '@atlaskit/icon/core/arrow-right'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
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
import { dayUnit, estimateTiming, formatCountedDays, formatDate, formatShortDate, shiftLabel } from '../../impact/timing'
import { PRIMARY_ACTION_ID, type CommentProposal, type Outcome } from '../../impact/types'
import { parseIsoDate } from '../../lib/dates'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import type { Card } from '../../types'

const styles = cssMap({
  panel: { display: 'flex', flexDirection: 'column', gap: token('space.0') },
  header: { paddingBlockEnd: token('space.150') },
  section: {
    paddingBlock: token('space.200'),
    borderBlockStartWidth: token('border.width'),
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: token('color.border'),
  },
  // Aligns action content with the checkbox labels of optional actions.
  indent: { paddingInlineStart: token('space.300') },
  evidence: {
    paddingInlineStart: token('space.150'),
    borderInlineStartWidth: token('border.width.selected'),
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: token('color.border'),
  },
  scope: {
    padding: token('space.150'),
    borderRadius: token('radius.medium'),
    backgroundColor: token('elevation.surface'),
  },
  textAction: {
    font: token('font.body'),
    color: token('color.link'),
    textDecorationLine: 'underline',
    backgroundColor: token('color.background.neutral.subtle'),
    padding: token('space.0'),
    '&:hover': { color: token('color.link.pressed') },
  },
  textActionSmall: { font: token('font.body.small') },
  headingRow: { display: 'flex', alignItems: 'center', gap: token('space.100') },
  previousDate: {
    paddingBlock: token('space.050'),
    paddingInline: token('space.100'),
    borderRadius: token('radius.small'),
    backgroundColor: token('color.background.neutral'),
  },
  wrap: { whiteSpace: 'pre-wrap' },
})

/** Underlined text action, matching the link-style actions in the Impact designs. */
function TextAction({ children, onClick, isSmall, label }: { children: ReactNode; onClick: () => void; isSmall?: boolean; label?: string }) {
  return (
    <Pressable xcss={cx(styles.textAction, isSmall && styles.textActionSmall)} onClick={onClick} aria-label={label}>
      {children}
    </Pressable>
  )
}

function PanelHeading({ title, children, headingRef }: { title: string; children?: ReactNode; headingRef?: Ref<HTMLDivElement> }) {
  return (
    <Box xcss={styles.header}>
      <Stack space="space.050">
        {/* Focus target when the panel changes stage. */}
        <Box ref={headingRef} tabIndex={-1} xcss={styles.headingRow}>
          <AiSparkleIcon label="" color={token('color.icon')} />
          <Heading size="medium" as="h2">
            {title}
          </Heading>
        </Box>
        {children}
      </Stack>
    </Box>
  )
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

/** The Impact side panel of the card popup. It replaces Comments and activity while the Impact tab is selected. */
export function ImpactPanel({ card }: { card: Card }) {
  const { session } = useImpact()
  const headingRef = useRef<HTMLDivElement>(null)
  const phase = session?.phase

  // Move focus to the new heading when the panel changes stage, so keyboard and screen reader users follow along.
  useEffect(() => {
    if (phase === 'review' || phase === 'results') headingRef.current?.focus()
  }, [phase])

  if (!session || session.cardId !== card.id) return null
  return (
    <Box xcss={styles.panel}>
      {session.phase === 'draft' && <DraftStage card={card} />}
      {session.phase === 'analyzing' && <AnalyzingStage card={card} />}
      {session.phase === 'review' && <ReviewStage card={card} headingRef={headingRef} />}
      {(session.phase === 'applying' || session.phase === 'results') &&
        (session.kind === 'date' ? <DateResultsStage card={card} headingRef={headingRef} /> : <ResultsStage card={card} headingRef={headingRef} />)}
    </Box>
  )
}

function DraftStage({ card }: { card: Card }) {
  const { boards } = useAppState()
  const { session, review, addWithoutReview, discardDraft } = useImpact()
  const change = session?.kind === 'date' ? session.dateChange : undefined
  if (change) {
    return (
      <>
        <PanelHeading title="Review impact">
          <Text size="small" color="color.text.subtle">{`${card.title} · ${change.from ? formatShortDate(change.from) : 'No date'} → ${formatDate(change.to)} · Not saved yet`}</Text>
        </PanelHeading>
        <Box xcss={styles.section}>
          <Stack space="space.200">
            <Text>{`Change the date in Dates, then review its impact on the ${boards[card.boardId].title} board again.`}</Text>
            <Inline space="space.100" spread="space-between">
              <Button onClick={addWithoutReview}>Save date only</Button>
              <Button appearance="primary" iconBefore={AiSparkleIcon} onClick={review}>
                Review impact
              </Button>
            </Inline>
            <Box>
              <TextAction onClick={discardDraft}>Discard change</TextAction>
            </Box>
          </Stack>
        </Box>
      </>
    )
  }
  return (
    <>
      <PanelHeading title="Review impact">
        <Text size="small" color="color.text.subtle">{`${card.title} isn’t on the board yet.`}</Text>
      </PanelHeading>
      <Box xcss={styles.section}>
        <Stack space="space.200">
          <Text>{`Review impact checks the ${boards[card.boardId].title} board for cards that may need attention before you add this one.`}</Text>
          <Inline space="space.100" spread="space-between">
            <Button onClick={addWithoutReview}>Add card</Button>
            <Button appearance="primary" iconBefore={AiSparkleIcon} onClick={review}>
              Review impact
            </Button>
          </Inline>
        </Stack>
      </Box>
    </>
  )
}

function AnalyzingStage({ card }: { card: Card }) {
  const { boards } = useAppState()
  return (
    <PanelHeading title="Review impact">
      <Inline space="space.100" alignBlock="center">
        <Spinner size="small" label="" />
        <Text size="small" color="color.text.subtle" role="status">{`Checking ${boards[card.boardId].title} board…`}</Text>
      </Inline>
    </PanelHeading>
  )
}

function ReviewStage({ card, headingRef }: { card: Card; headingRef: Ref<HTMLDivElement> }) {
  const state = useAppState()
  const { session, backToDraft, apply, review: reviewAgain } = useImpact()
  const [isScopeOpen, setScopeOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const review = session!.review!
  const active = review.proposals.filter((p) => !p.isSkipped)
  const skipped = review.proposals.filter((p) => p.isSkipped)
  const selected = active.filter((p) => p.isSelected)
  const change = session!.kind === 'date' ? session!.dateChange : undefined
  // Sources, or the saved date itself, may change while the review is open.
  const staleTitles = [
    ...(change && change.from !== card.dueDate ? [card.title] : []),
    ...selected.filter((p) => !isEvidenceFresh(state, p)).map((p) => state.cards[p.connection.cardId]?.title ?? 'A source card'),
  ]
  const actionCount = 1 + selected.length
  const attention = active.length === 0 ? 'No other cards may need attention' : `${plural(active.length, 'card', 'cards')} may need attention`
  const checked = change ? `${active.length === 0 ? `${attention} · ` : ''}Checked this board · ` : `${attention} · Checked ${review.scope.boardTitle} board · `
  const unchanged = change ? active.find((p) => p.timing)?.timing?.targetTitle : undefined

  return (
    <>
      <PanelHeading title="Review impact" headingRef={headingRef}>
        <Text size="small" color="color.text.subtle">
          {checked}
          <TextAction isSmall onClick={() => setScopeOpen((v) => !v)}>
            {isScopeOpen ? 'Hide scope' : 'View scope'}
          </TextAction>
        </Text>
        {isScopeOpen && (
          <Box xcss={styles.scope}>
            <Stack space="space.100">
              <Stack space="space.025">
                <Text size="small" weight="semibold">
                  Checked
                </Text>
                <Text size="small">{review.scope.checked}</Text>
              </Stack>
              <Stack space="space.025">
                <Text size="small" weight="semibold">
                  Not checked
                </Text>
                <Text size="small">{review.scope.notChecked}</Text>
              </Stack>
              <Text size="small" color="color.text.subtle">
                Sources were read when you selected Review impact.
              </Text>
            </Stack>
          </Box>
        )}
      </PanelHeading>

      <Box xcss={styles.section}>
        {change ? (
          <SaveDateAction card={card} from={change.from} to={change.to} isEditing={editingId === PRIMARY_ACTION_ID} onEdit={setEditingId} />
        ) : (
          <CreateAction card={card} isEditing={editingId === PRIMARY_ACTION_ID} onEdit={setEditingId} />
        )}
      </Box>

      {active.map((proposal) => (
        <Box key={proposal.id}>
          {proposal.timing && (
            <Box xcss={styles.section}>
              <TimingSection proposal={proposal} isEditing={editingId === `${proposal.id}:timing`} onEdit={setEditingId} />
            </Box>
          )}
          <Box xcss={styles.section}>
            <CommentAction card={card} proposal={proposal} editingId={editingId} onEdit={setEditingId} />
          </Box>
        </Box>
      ))}

      {skipped.map((proposal) => (
        <Box key={proposal.id} xcss={styles.section}>
          <SkippedSuggestion proposal={proposal} />
        </Box>
      ))}

      <Box xcss={styles.section}>
        <Stack space="space.200">
          {staleTitles.length > 0 && (
            <SectionMessage
              appearance="warning"
              title="Needs fresh review"
              actions={[
                <SectionMessageAction key="again" onClick={reviewAgain}>
                  Review again
                </SectionMessageAction>,
              ]}
            >
              <Text as="p">{`${staleTitles.join(' and ')} changed since this review.`}</Text>
            </SectionMessage>
          )}
          <Stack space="space.050">
            <Text weight="semibold">
              {`${change ? 'Updates 1 date' : 'Creates 1 card'}${selected.length ? ` and posts ${plural(selected.length, 'comment', 'comments')}` : ''}.`}
            </Text>
            {unchanged && <Text color="color.text.subtle">{`${unchanged}’s date will stay unchanged.`}</Text>}
          </Stack>
          <Inline space="space.100" spread="space-between" alignBlock="center">
            <Button onClick={backToDraft}>{change ? 'Back to edit' : 'Back to draft'}</Button>
            <Button appearance="primary" isDisabled={editingId !== null || staleTitles.length > 0} onClick={apply}>
              {`Apply ${plural(actionCount, 'action', 'actions')}`}
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
            <Text>{`In ${lists[card.listId].title}`}</Text>
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

function SaveDateAction({ card, from, to, isEditing, onEdit }: { card: Card; from?: string; to: string; isEditing: boolean; onEdit: (id: string | null) => void }) {
  const { setProposedDate } = useImpact()
  const [selected, setSelected] = useState(to)
  const initial = parseIsoDate(to)
  return (
    <Stack space="space.075">
      <Text weight="semibold">{`Save ${card.title} date`}</Text>
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <Box xcss={styles.previousDate}>
          <Text>{from ? formatShortDate(from) : 'No date'}</Text>
        </Box>
        <ArrowRightIcon label="to" size="small" color={token('color.icon.subtle')} />
        <Text>{formatDate(to)}</Text>
        {!isEditing && (
          <TextAction
            onClick={() => {
              setSelected(to)
              onEdit(PRIMARY_ACTION_ID)
            }}
            label={`Edit Save ${card.title} date`}
          >
            Edit
          </TextAction>
        )}
      </Inline>
      <Text size="small" color="color.text.subtle">
        Not saved yet
      </Text>
      {isEditing && (
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
              isDisabled={selected === to || selected === from}
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
      )}
    </Stack>
  )
}

/** The conditional estimate for a related card. Its assumptions and arithmetic are one click away and editable. */
function TimingSection({ proposal, isEditing, onEdit }: { proposal: CommentProposal; isEditing: boolean; onEdit: (id: string | null) => void }) {
  const { updateTiming } = useImpact()
  const timing = proposal.timing!
  const { result, steps } = estimateTiming(timing)
  const [isCalculationOpen, setCalculationOpen] = useState(false)
  const [days, setDays] = useState(String(timing.workingDays))
  const [countWeekends, setCountWeekends] = useState(timing.countWeekends)
  const parsedDays = Number(days)
  const isValid = Number.isInteger(parsedDays) && parsedDays >= 0 && parsedDays <= 30
  const editId = `${proposal.id}:timing`

  return (
    <Stack space="space.075">
      <Text weight="semibold">{`${timing.targetTitle} may need attention`}</Text>
      <Text>{`Current due date: ${formatShortDate(timing.currentDue)}`}</Text>
      <Text weight="semibold">{`Estimated ready date: ${formatShortDate(result)}, ${shiftLabel(timing.currentDue, result)}`}</Text>
      <Text size="small" color="color.text.subtle">{`Assumes ${timing.workingDays} ${dayUnit(timing.workingDays, timing.countWeekends)} after ${timing.basis}. Needs confirmation.`}</Text>
      {isEditing ? (
        <Stack space="space.150">
          <Stack space="space.050">
            <Label htmlFor={`${editId}-days`}>{`Days after ${timing.basis}`}</Label>
            <Textfield id={`${editId}-days`} type="number" min={0} max={30} value={days} onChange={(e) => setDays(e.currentTarget.value)} isInvalid={!isValid} />
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
            <Box xcss={styles.evidence}>
              <Stack space="space.050">
                <Text>
                  {timing.workingDays === 0
                    ? 'No days counted.'
                    : `Counted ${timing.countWeekends ? 'days' : 'working days'}: ${formatCountedDays(steps)}.`}
                </Text>
                <Text>{timing.countWeekends ? 'Starts the next day.' : 'Starts the next working day.'}</Text>
                <Text>{timing.countWeekends ? 'Weekends counted; public holidays not excluded.' : 'Weekends excluded; public holidays not excluded.'}</Text>
                <Text>Conditional estimate, not an agreed deadline.</Text>
              </Stack>
            </Box>
          )}
        </>
      )}
    </Stack>
  )
}

function CommentAction({
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
  const { session, updateProposal, setSourceCard } = useImpact()
  const [isWhyOpen, setWhyOpen] = useState(false)
  const [draft, setDraft] = useState(proposal.text)
  const target = state.cards[proposal.connection.cardId]
  const targetTitle = target?.title ?? 'a deleted card'
  const mentions = resolveMentions(state, card.boardId, proposal.text).map((m) => m.fullName.split(' ')[0])
  const actionName = `Post comment on ${targetTitle}`
  const { evidence } = proposal.connection

  return (
    <Stack space="space.075">
      <Checkbox
        isChecked={proposal.isSelected}
        onChange={() => updateProposal(proposal.id, { isSelected: !proposal.isSelected })}
        label={<Text weight="semibold">{actionName}</Text>}
      />
      <Box xcss={styles.indent}>
        {isEditing ? (
          <Stack space="space.100">
            <Text size="small" color="color.text.subtle">{`Post on ${targetTitle}`}</Text>
            <Stack space="space.050">
              <Label htmlFor={`impact-edit-${proposal.id}`}>Comment</Label>
              <Textarea id={`impact-edit-${proposal.id}`} autoFocus minimumRows={3} value={draft} onChange={(e) => setDraft(e.currentTarget.value)} />
            </Stack>
            <Text size="small" color="color.text.subtle">
              Nothing changes in Trello until you select Apply.
            </Text>
            <Inline space="space.150" alignBlock="center">
              <Button
                isDisabled={draft.trim() === proposal.text || !draft.trim()}
                onClick={() => {
                  updateProposal(proposal.id, { text: draft.trim(), isTextEdited: true })
                  onEdit(null)
                }}
              >
                Save changes
              </Button>
              <TextAction
                onClick={() => {
                  setDraft(proposal.text)
                  onEdit(null)
                }}
              >
                Cancel
              </TextAction>
            </Inline>
          </Stack>
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
                  setDraft(proposal.text)
                  onEdit(proposal.id)
                }}
                label={`Edit ${actionName}`}
              >
                Edit
              </TextAction>
              {!proposal.isSelected && (
                <TextAction onClick={() => updateProposal(proposal.id, { isSkipped: true, isSelected: false })}>Skip</TextAction>
              )}
            </Inline>
            {isWhyOpen && (
              <Box xcss={styles.evidence}>
                <Stack space="space.075">
                  <Text weight="semibold">{evidence.sourceLabel}</Text>
                  <Text>{`“${evidence.quote}”`}</Text>
                  <Text weight="semibold">Why it may matter</Text>
                  <Text>{evidence.interpretation}</Text>
                  <Inline space="space.200">
                    {target && (
                      <TextAction
                        onClick={() => {
                          setSourceCard(target.id)
                          navigate(paths.card(target.id, session ? state.cards[session.cardId]?.boardId : undefined))
                        }}
                      >
                        Open source
                      </TextAction>
                    )}
                    <TextAction onClick={() => setWhyOpen(false)}>Hide explanation</TextAction>
                  </Inline>
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}

function SkippedSuggestion({ proposal }: { proposal: CommentProposal }) {
  const { cards } = useAppState()
  const { updateProposal } = useImpact()
  const title = cards[proposal.connection.cardId]?.title ?? 'Suggestion'
  return (
    <Stack space="space.050">
      <Inline spread="space-between" alignBlock="center" space="space.100">
        <Text>{`${title} · Skipped`}</Text>
        {/* Undo brings the suggestion back for consideration without selecting its action. */}
        <TextAction onClick={() => updateProposal(proposal.id, { isSkipped: false, isSelected: false })} label={`Undo skip ${title}`}>
          Undo
        </TextAction>
      </Inline>
      <Text size="small" color="color.text.subtle">
        Connected tools and Butler were not checked.
      </Text>
    </Stack>
  )
}

function ResultsStage({ card, headingRef }: { card: Card; headingRef: Ref<HTMLDivElement> }) {
  const state = useAppState()
  const { session, retry, checkStatus, backToDraft } = useImpact()
  const review = session!.review!
  const outcomes = session!.outcomes
  const listTitle = state.lists[card.listId]?.title ?? ''
  const comments = review.proposals.filter((p) => outcomes[p.id])
  const actionIds = [PRIMARY_ACTION_ID, ...comments.map((p) => p.id)]
  const applied = actionIds.filter((id) => outcomes[id]?.status === 'applied').length
  const isApplying = session!.phase === 'applying' || actionIds.some((id) => outcomes[id]?.status === 'applying')
  const posted = comments.filter((p) => outcomes[p.id]?.status === 'applied')
  const postedQuestions = posted.length > 0
  const summary = isApplying
    ? `Applying ${plural(actionIds.length, 'action', 'actions')}…`
    : applied === actionIds.length
      ? `${plural(applied, 'Impact action', 'Impact actions')} completed.`
      : `${applied} of ${plural(actionIds.length, 'Impact action', 'Impact actions')} completed.`

  return (
    <>
      <PanelHeading title="Results" headingRef={headingRef}>
        <Text size="small" color="color.text.subtle">{`${card.title} · ${state.boards[card.boardId].title} board`}</Text>
      </PanelHeading>
      <Box xcss={styles.section}>
        <Inline space="space.100" alignBlock="center">
          {isApplying && <Spinner size="small" label="" />}
          <Text weight="bold" role="status">
            {summary}
          </Text>
        </Inline>
      </Box>
      <Box xcss={styles.section}>
        <OutcomeRow
          name={`Create ${card.title}`}
          outcome={outcomes[PRIMARY_ACTION_ID]}
          appliedText={card.description ? `Created in ${listTitle} with your description.` : `Created in ${listTitle}.`}
          notAppliedText="Not applied · The card wasn’t created. Your draft is kept."
          onRetry={() => retry(PRIMARY_ACTION_ID)}
        />
      </Box>
      {comments.map((proposal) => {
        const target = state.cards[proposal.connection.cardId]?.title ?? 'a deleted card'
        const mentions = resolveMentions(state, card.boardId, proposal.text).map((m) => m.fullName.split(' ')[0])
        return (
          <Box key={proposal.id} xcss={styles.section}>
            <OutcomeRow
              name={`Post comment on ${target}`}
              outcome={outcomes[proposal.id]}
              appliedText={mentions.length ? `Posted · ${mentions.join(', ')} mentioned.` : 'Posted.'}
              notAppliedText="Not applied · The comment wasn’t posted."
              notRunText={`Not run · Held because ${card.title} wasn’t created.`}
              onRetry={() => retry(proposal.id)}
              onCheck={() => checkStatus(proposal.id)}
            />
          </Box>
        )
      })}
      {postedQuestions && (
        <Box xcss={styles.section}>
          <Stack space="space.050">
            <Text weight="semibold">{posted.length === 1 ? 'Question posted.' : 'Questions posted.'}</Text>
            <Text>{posted.length === 1 ? 'The connection remains unconfirmed.' : 'Connections remain unconfirmed.'}</Text>
          </Stack>
        </Box>
      )}
      <Box xcss={styles.section}>
        <Inline alignInline="end">
          {/* If creation failed the draft is kept, so the way out is back to the draft rather than the board. */}
          {outcomes[PRIMARY_ACTION_ID]?.status === 'not-applied' ? (
            <Button appearance="primary" onClick={backToDraft}>
              Back to draft
            </Button>
          ) : (
            <Button appearance="primary" isDisabled={isApplying} onClick={() => navigate(paths.board(card.boardId))}>
              Back to board
            </Button>
          )}
        </Inline>
      </Box>
    </>
  )
}

function DateResultsStage({ card, headingRef }: { card: Card; headingRef: Ref<HTMLDivElement> }) {
  const state = useAppState()
  const { session, retry, checkStatus, backToDraft, finish } = useImpact()
  const review = session!.review!
  const outcomes = session!.outcomes
  const change = session!.dateChange!
  const comments = review.proposals.filter((p) => outcomes[p.id])
  const actionIds = [PRIMARY_ACTION_ID, ...comments.map((p) => p.id)]
  const applied = actionIds.filter((id) => outcomes[id]?.status === 'applied').length
  const isApplying = session!.phase === 'applying' || actionIds.some((id) => outcomes[id]?.status === 'applying')
  const timed = comments.find((p) => p.timing && outcomes[p.id]?.status === 'applied')
  const timedCard = timed ? state.cards[timed.connection.cardId] : undefined
  const summary = isApplying
    ? `Applying ${plural(actionIds.length, 'action', 'actions')}…`
    : applied === actionIds.length
      ? `${plural(applied, 'action', 'actions')} completed.`
      : `${applied} of ${plural(actionIds.length, 'action', 'actions')} completed.`

  return (
    <>
      <PanelHeading title="Results" headingRef={headingRef}>
        <Inline space="space.100" alignBlock="center">
          {isApplying && <Spinner size="small" label="" />}
          <Text size="small" color="color.text.subtle" role="status">
            {summary}
          </Text>
        </Inline>
      </PanelHeading>
      <Box xcss={styles.section}>
        <OutcomeRow
          name={`Save ${card.title} date`}
          outcome={outcomes[PRIMARY_ACTION_ID]}
          appliedText={`Saved · ${formatDate(change.to)}`}
          notAppliedText="Not applied · The date wasn’t saved. Your proposed date is kept."
          onRetry={() => retry(PRIMARY_ACTION_ID)}
        />
      </Box>
      {comments.map((proposal) => {
        const target = state.cards[proposal.connection.cardId]
        const mentions = resolveMentions(state, card.boardId, proposal.text).map((m) => m.fullName.split(' ')[0])
        return (
          <Box key={proposal.id} xcss={styles.section}>
            <Stack space="space.150">
              <OutcomeRow
                name={`Post comment on ${target?.title ?? 'a deleted card'}`}
                outcome={outcomes[proposal.id]}
                appliedText={mentions.length ? `Posted · ${mentions.join(', ')} mentioned` : 'Posted'}
                notAppliedText="Not applied · The comment wasn’t posted."
                notRunText="Not run · Held because the date wasn’t saved."
                onRetry={() => retry(proposal.id)}
                onCheck={() => checkStatus(proposal.id)}
              />
              {target && outcomes[proposal.id]?.status === 'applied' && (
                <Box>
                  <TextAction onClick={() => navigate(paths.card(target.id))}>Open card</TextAction>
                </Box>
              )}
            </Stack>
          </Box>
        )
      })}
      {timed && timedCard?.dueDate && (
        <Box xcss={styles.section}>
          <Stack space="space.050">
            <Text weight="semibold">{`${timedCard.title} is still due ${formatShortDate(timedCard.dueDate)}.`}</Text>
            {timed.timing?.mention && <Text>{`Timing awaits ${timed.timing.mention}’s confirmation.`}</Text>}
            <Text>The connection remains unconfirmed.</Text>
          </Stack>
        </Box>
      )}
      <Box xcss={styles.section}>
        {/* If the date wasn't saved, the proposed date is kept, so the way out is back to editing it. */}
        {outcomes[PRIMARY_ACTION_ID]?.status === 'not-applied' ? (
          <Button appearance="primary" shouldFitContainer onClick={backToDraft}>
            Back to edit
          </Button>
        ) : (
          <Button appearance="primary" shouldFitContainer isDisabled={isApplying} onClick={finish}>
            Done
          </Button>
        )}
      </Box>
    </>
  )
}

function OutcomeRow({
  name,
  outcome,
  appliedText,
  notAppliedText,
  notRunText,
  onRetry,
  onCheck,
}: {
  name: string
  outcome?: Outcome
  appliedText: string
  notAppliedText: string
  notRunText?: string
  onRetry: () => void
  onCheck?: () => void
}) {
  const status = outcome?.status
  return (
    <Box xcss={styles.indent}>
      <Stack space="space.075">
        <Text weight="semibold">{name}</Text>
        {status === 'applying' && (
          <Inline space="space.100" alignBlock="center">
            <Spinner size="small" label="" />
            <Text color="color.text.subtle">Applying…</Text>
          </Inline>
        )}
        {status === 'applied' && <Text>{appliedText}</Text>}
        {status === 'not-applied' && (
          <Stack space="space.100">
            <Text color="color.text.danger">{notAppliedText}</Text>
            <Box>
              <Button onClick={onRetry}>Retry</Button>
            </Box>
          </Stack>
        )}
        {status === 'unknown' && (
          <Stack space="space.100">
            <Text color="color.text.warning">Outcome unknown · Check whether it was posted before retrying.</Text>
            <Box>
              <Button onClick={onCheck}>Check status</Button>
            </Box>
          </Stack>
        )}
        {status === 'not-run' && <Text color="color.text.subtle">{notRunText ?? 'Not run.'}</Text>}
      </Stack>
    </Box>
  )
}
