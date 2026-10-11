import { useEffect, useRef, useState } from 'react'
import Button from '@atlaskit/button/new'
import { Checkbox } from '@atlaskit/checkbox'
import { cx } from '@atlaskit/css'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { findRelations, isCardDone, unfinishedPrerequisites, type Relation } from '../../impact/dependencies'
import { boardScope, resolveMentions } from '../../impact/scenarios'
import { joinNames, ownerName, plural, summarize } from '../../impact/format'
import { simulation, STEP_MS, wait } from '../../impact/simulation'
import { dayUnit, formatShortDate, numberWord } from '../../impact/timing'
import { type Outcome } from '../../impact/types'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import { createId } from '../../lib/random'
import type { Card } from '../../types'
import { TextAction, PanelHeading, ReviewHeading, EvidenceDetails, InlineTextEditor, LeftOutNote, ActionRow, StatusIcon } from './shared'
import { styles } from './styles'
import { useDisclosure, useEditFocus } from './focus'
import { type RowIcon, outcomeIcon } from './status'

/** How a relation reads from this card's side, e.g. "Ready 5 working days after this card". */
function relationPhrase(relation: Relation, isAnchor: boolean) {
  const span = `${relation.days} ${dayUnit(relation.days, relation.countWeekends)}`
  if (isAnchor) {
    if (relation.kind === 'offset-after') return `Ready ${span} after this card`
    if (relation.kind === 'offset-before') return `Due ${span} before this card`
    return relation.kind === 'before' ? 'Due before this card' : 'Starts after this card'
  }
  if (relation.kind === 'offset-after') return `This card is ready ${span} after it`
  if (relation.kind === 'offset-before') return `This card is due ${span} before it`
  return relation.kind === 'before' ? 'This card is due before it' : 'This card starts after it'
}

/** The question Impact drafts for the other card's owner, worded as a possibility (spec rule 3). */
function connectionQuestion(state: ReturnType<typeof useAppState>, relation: Relation, owner: string | undefined) {
  const dependent = state.cards[relation.dependentId]?.title ?? 'This card'
  const anchor = state.cards[relation.anchorId]?.title ?? 'the other card'
  const span = `${numberWord(relation.days)} ${dayUnit(relation.days, relation.countWeekends)}`
  const claim =
    relation.kind === 'offset-after'
      ? `${dependent} may need ${span} after ${anchor}`
      : relation.kind === 'offset-before'
        ? `${dependent} may need to be due ${span} before ${anchor}`
        : relation.kind === 'before'
          ? `${dependent} may need to be done before ${anchor}`
          : `${dependent} may need to start after ${anchor}`
  return `${owner ? `@${owner}, ` : ''}${claim}. Should we link these cards?`
}

interface Connection {
  relation: Relation
  other: Card
  isAnchor: boolean
}

/** Each other card this card's text connects it to, once, from this card's side. */
function useConnections(card: Card): Connection[] {
  const state = useAppState()
  if (card.isDraft) return []
  const seen = new Set<string>()
  return findRelations(state, card.boardId)
    .filter((r) => r.anchorId === card.id || r.dependentId === card.id)
    .map((r) => ({ relation: r, other: state.cards[r.anchorId === card.id ? r.dependentId : r.anchorId], isAnchor: r.anchorId === card.id }))
    .filter(({ other }) => other && !seen.has(other.id) && !!seen.add(other.id))
}

/** Confirmed only when the other card's owner made the link (spec rule 4). */
function isOwnerLinked(card: Card, other: Card) {
  return (
    other.attachments.some((a) => a.cardId === card.id && a.addedBy === other.memberIds[0]) ||
    card.attachments.some((a) => a.cardId === other.id && a.addedBy === card.memberIds[0])
  )
}

/** The question when this card was finished before a card it depends on (approved early-finish flag). */
function earlyFinishQuestion(card: Card, prerequisite: Card, relation: Relation, owner: string | undefined) {
  const waits = relation.dependentId === card.id
  return `${owner ? `@${owner}, ` : ''}${card.title} was marked done, but it ${waits ? 'waits for' : 'should come after'} ${prerequisite.title}, which isn’t done yet. Is ${prerequisite.title} finished, or should ${card.title} be reopened?`
}

/** How this card was finished, in Trello's terms. */
function finishedHow(state: ReturnType<typeof useAppState>, card: Card) {
  if (card.isComplete) return 'Marked complete'
  if (card.isDueComplete) return 'Due date marked complete'
  return `In ${state.lists[card.listId]?.title ?? 'Done'}`
}

interface ConnectionAction {
  id: string
  otherId: string
  /** The other card's owner links directly; everyone else asks the owner. Reopen undoes finishing this card early. */
  kind: 'comment' | 'link' | 'reopen'
  text: string
  isSelected: boolean
  isTextEdited?: boolean
}

/**
 * The Impact tab on a card with no pending change: the possible connections found in card text, as actions to approve.
 * Same structure as a review (Header > Actions > Summary); there is no change row because the person is not changing
 * this card. Nothing is posted or linked until Apply.
 */
export function ConnectionReview({ card, onBack }: { card: Card; onBack?: () => void }) {
  const state = useAppState()
  const dispatch = useDispatch()
  const connections = useConnections(card)
  const board = state.boards[card.boardId]
  const scope = boardScope(state, card.boardId)
  const asked = (other: Card) => other.comments.find((c) => c.impact?.reviewCardId === card.id)
  // Connections still open: not confirmed and not already asked about.
  // Finished before a card it depends on: the questions say so, and reopening is offered (unticked, the person decides).
  const prerequisites = isCardDone(state, card) ? unfinishedPrerequisites(state, card) : []
  const early = new Map(prerequisites.map((p) => [p.card.id, p]))
  // An early finish stays open until the card is reopened, even if the connection was linked or asked about before.
  const open = connections.filter(({ other }) => early.has(other.id) || (!isOwnerLinked(card, other) && !asked(other)))
  const followed = connections.filter((c) => !open.includes(c))
  const canReopen = prerequisites.length > 0 && (!!card.isComplete || card.isDueComplete)
  const buildActions = (): ConnectionAction[] => [
    ...(canReopen
      ? [
          {
            id: 'reopen',
            otherId: card.id,
            kind: 'reopen' as const,
            text: `Marks ${card.title} incomplete until ${joinNames(prerequisites.map((p) => p.card.title))} ${prerequisites.length === 1 ? 'is' : 'are'} done.`,
            isSelected: false,
          },
        ]
      : []),
    ...open.map(({ relation, other }) => {
      const isOwner = other.memberIds[0] === state.currentUserId
      const prerequisite = early.get(other.id)
      return {
        id: other.id,
        otherId: other.id,
        kind: isOwner && !prerequisite ? ('link' as const) : ('comment' as const),
        text: prerequisite
          ? earlyFinishQuestion(card, other, prerequisite.relation, isOwner ? undefined : ownerName(other))
          : isOwner
            ? `Links ${card.title} to ${other.title}, which confirms the connection.`
            : connectionQuestion(state, relation, ownerName(other)),
        isSelected: true,
      }
    }),
  ]
  const [actions, setActions] = useState<ConnectionAction[]>(buildActions)
  const [editingId, setEditingIdState] = useState<string | null>(null)
  const setEditingId = useEditFocus(setEditingIdState)
  const [outcomes, setOutcomes] = useState<Record<string, Outcome> | null>(null)
  // Apply runs across several renders; reads during it need the latest board, not the one from when it started.
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })
  // Finishing or reopening the card changes what's proposed, but never while actions are applying.
  const isFinished = isCardDone(state, card)
  const [builtFor, setBuiltFor] = useState(isFinished)
  if (builtFor !== isFinished && !outcomes) {
    setBuiltFor(isFinished)
    setActions(buildActions())
  }
  // Done: back to a fresh review of what's still open.
  const finishResults = () => {
    setActions(buildActions())
    setBuiltFor(isFinished)
    setOutcomes(null)
  }
  // Focus follows the stage (review → applying → results). Opening the tab doesn't take focus; Review again does (motion audit C6).
  const headingRef = useRef<HTMLDivElement>(null)
  const stage = !outcomes
    ? 'review'
    : actions.some((a) => a.isSelected && ['waiting', 'applying'].includes(outcomes[a.id]?.status ?? ''))
      ? 'applying'
      : 'results'
  const isFirstStage = useRef(!onBack)
  useEffect(() => {
    if (isFirstStage.current) {
      isFirstStage.current = false
      return
    }
    headingRef.current?.focus()
  }, [stage])
  const update = (id: string, patch: Partial<ConnectionAction>) => setActions((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  const selected = actions.filter((a) => a.isSelected)
  const leftOut = actions.filter((a) => !a.isSelected).map((a) => state.cards[a.otherId]?.title ?? 'A card')
  const posts = selected.filter((a) => a.kind === 'comment').length
  const links = selected.filter((a) => a.kind === 'link').length
  const reopens = selected.filter((a) => a.kind === 'reopen').length
  const others = actions.filter((a) => a.kind !== 'reopen').length
  const attention = prerequisites.length
    ? `Finished before ${plural(prerequisites.length, 'card', 'cards')} it depends on`
    : others === 0
      ? 'No other cards may need attention'
      : `${plural(others, 'card', 'cards')} may need attention`

  /** Runs one action. The hidden switch can make it fail, or lose its outcome after it ran (spec IMPLEMENTATION). */
  const perform = async (action: ConnectionAction, step: 'ok' | 'fail' | 'unknown'): Promise<Outcome> => {
    setOutcomes((o) => ({ ...o, [action.id]: { status: 'applying' } }))
    await wait(STEP_MS)
    if (step === 'fail') return { status: 'not-applied' }
    const status = step === 'unknown' ? 'unknown' : 'applied'
    if (action.kind === 'link') {
      dispatch({ type: 'card/linkImpact', cardId: action.otherId, linkedCardId: card.id })
      return { status }
    }
    if (action.kind === 'reopen') {
      const current = stateRef.current.cards[card.id]
      if (current?.isComplete) dispatch({ type: 'card/toggleComplete', cardId: card.id })
      if (current?.isDueComplete) dispatch({ type: 'card/toggleDueComplete', cardId: card.id })
      return { status }
    }
    const commentId = createId('cm')
    dispatch({ type: 'card/addComment', cardId: action.otherId, text: action.text, id: commentId, impact: { reviewCardId: card.id } })
    return { status, commentId }
  }

  /** Runs actions in order; a failure holds the ones after it as Not run. */
  const runInOrder = async (list: ConnectionAction[], mode: ReturnType<typeof simulation>) => {
    for (const [i, action] of list.entries()) {
      const step = mode === 'creation-failed' && i === 0 ? 'fail' : mode === 'outcome-unknown' && i === list.length - 1 ? 'unknown' : 'ok'
      const outcome = await perform(action, step)
      setOutcomes((o) => ({ ...o, [action.id]: outcome }))
      if (outcome.status === 'not-applied') {
        setOutcomes((o) => ({
          ...o,
          ...Object.fromEntries(list.slice(i + 1).map((a) => [a.id, { status: 'not-run', notRunReason: 'dependency' } as Outcome])),
        }))
        return
      }
    }
  }

  const apply = async () => {
    setOutcomes(Object.fromEntries(selected.map((a) => [a.id, { status: 'waiting' } as Outcome])))
    await runInOrder(selected, simulation())
  }

  if (outcomes) {
    const statuses = selected.map((a) => outcomes[a.id]?.status)
    const isRunning = statuses.some((st) => st === 'waiting' || st === 'applying')
    const done = statuses.every((st) => st === 'applied')
    const count = (st: Outcome['status']) => statuses.filter((x) => x === st).length
    const retryable = selected.filter((a) => outcomes[a.id]?.status === 'not-applied' || outcomes[a.id]?.status === 'not-run')
    const subtitle = done
      ? `${card.title} · ${board.title} board`
      : isRunning
        ? 'Steps run in order. Later steps wait for earlier ones.'
        : [
            count('applied') && `${count('applied')} completed`,
            count('not-applied') && `${count('not-applied')} failed`,
            count('not-run') && `${count('not-run')} not run`,
            count('unknown') && `${count('unknown')} unknown`,
          ]
            .filter(Boolean)
            .join(' · ')
    // Only what is verified missing, or never ran, is retried, so nothing posts twice.
    const retryAll = async () => {
      setOutcomes((o) => ({ ...o, ...Object.fromEntries(retryable.map((a) => [a.id, { status: 'waiting' } as Outcome])) }))
      await runInOrder(retryable, 'success')
    }
    const checkStatus = (action: ConnectionAction) => {
      const outcome = outcomes[action.id]
      const found = !!stateRef.current.cards[action.otherId]?.comments.some((c) => c.id === outcome?.commentId)
      setOutcomes((o) => ({ ...o, [action.id]: { ...outcome, status: found ? 'applied' : 'not-applied' } }))
    }
    return (
      <>
        <PanelHeading title={isRunning ? `Applying ${plural(selected.length, 'action', 'actions')}` : 'Results'} headingRef={headingRef}>
          <Text size="small" color="color.text.subtle">
            {subtitle}
          </Text>
        </PanelHeading>
        {done && (
          <Box xcss={styles.section}>
            <Text weight="bold" role="status">{`${plural(selected.length, 'Impact action', 'Impact actions')} completed.`}</Text>
          </Box>
        )}
        {selected.map((a) => {
          const other = state.cards[a.otherId]
          const outcome = outcomes[a.id]
          const mentions = resolveMentions(state, card.boardId, a.text).map((m) => m.fullName.split(' ')[0])
          const name =
            a.kind === 'reopen'
              ? `Reopen ${card.title}`
              : a.kind === 'link'
                ? `Link ${card.title} to ${other?.title}`
                : `Post comment on ${other?.title ?? 'a deleted card'}`
          const verb = a.kind === 'reopen' ? 'reopened' : a.kind === 'link' ? 'linked' : 'posted'
          const text =
            outcome?.status === 'applied'
              ? a.kind === 'reopen'
                ? 'Reopened · Marked incomplete.'
                : a.kind === 'link'
                  ? 'Linked · Connection confirmed.'
                  : mentions.length
                    ? `Posted · ${joinNames(mentions)} mentioned.`
                    : 'Posted.'
              : outcome?.status === 'applying'
                ? a.kind === 'link'
                  ? 'Linking…'
                  : a.kind === 'reopen'
                    ? 'Reopening…'
                    : 'Posting…'
                : outcome?.status === 'not-applied'
                  ? `Not ${verb} · Trello did not respond`
                  : outcome?.status === 'not-run'
                    ? 'Not run · Waits for the step before it'
                    : outcome?.status === 'unknown'
                      ? `Status unknown · It may or may not have ${verb}`
                      : 'Waiting…'
          return (
            <ActionRow
              key={a.id}
              name={name}
              icon={outcomeIcon(outcome)}
              status={<Text color={outcome?.status === 'waiting' || outcome?.status === 'not-run' ? 'color.text.subtle' : undefined}>{text}</Text>}
            >
              {outcome?.status === 'unknown' && (
                <Inline space="space.150" alignBlock="center">
                  <Button onClick={() => checkStatus(a)}>Check status</Button>
                  {other && <TextAction onClick={() => navigate(paths.card(other.id, card.boardId))}>{`Open ${other.title}`}</TextAction>}
                </Inline>
              )}
            </ActionRow>
          )
        })}
        <Box xcss={styles.section}>
          <Stack space="space.200">
            {!isRunning && retryable.length > 0 ? (
              <Stack space="space.050">
                <Text weight="semibold">{`${plural(retryable.length, 'action', 'actions')} didn’t apply.`}</Text>
                <Text>{`Your selections are kept. Retrying runs ${retryable.length === 1 ? 'it' : 'them'} in order.`}</Text>
              </Stack>
            ) : !isRunning && count('unknown') > 0 ? (
              <Text>Retry is offered only if the comment is confirmed missing, so nothing posts twice.</Text>
            ) : (
              done &&
              posts > 0 && (
                <Stack space="space.050">
                  <Text weight="semibold">{posts === 1 ? 'Question posted.' : 'Questions posted.'}</Text>
                  <Text>{posts === 1 ? 'The connection remains unconfirmed.' : 'Connections remain unconfirmed.'}</Text>
                </Stack>
              )
            )}
            <Inline space="space.100" spread="space-between" alignBlock="center">
              {!isRunning && retryable.length > 0 ? <Button onClick={retryAll}>{`Retry ${plural(retryable.length, 'action', 'actions')}`}</Button> : <span />}
              <Button appearance="primary" isDisabled={isRunning} onClick={onBack ?? finishResults}>
                {isRunning ? 'Applying…' : 'Done'}
              </Button>
            </Inline>
          </Stack>
        </Box>
      </>
    )
  }

  return (
    <>
      <ReviewHeading headingRef={headingRef} attention={attention} scope={scope} />

      {prerequisites.length > 0 && (
        <Box xcss={styles.section}>
          <Stack space="space.100">
            <Text weight="semibold">Change</Text>
            <Text>{`${card.title} · ${finishedHow(state, card)}`}</Text>
            {prerequisites.map(({ card: other, relation }) => (
              <Box key={other.id} xcss={styles.statusRow}>
                <StatusIcon icon="not-run" />
                <Stack space="space.025">
                  <Inline space="space.050" alignBlock="center" shouldWrap>
                    <Text>{relation.dependentId === card.id ? 'Waits for' : 'Should come after'}</Text>
                    <TextAction onClick={() => navigate(paths.card(other.id, card.boardId))}>{other.title}</TextAction>
                  </Inline>
                  <Text size="small" color="color.text.subtle">
                    {[
                      `Not done · ${state.lists[other.listId]?.title ?? 'No list'}`,
                      other.dueDate && `Due ${formatShortDate(other.dueDate)}`,
                      ownerName(other) && `Owner ${ownerName(other)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {actions.length === 0 && (
        <Box xcss={styles.section}>
          <Text color="color.text.subtle">
            {connections.length === 0 ? 'No other cards on this board mention this card’s timing.' : 'Every connection found has been asked about or linked.'}
          </Text>
        </Box>
      )}

      {actions.map((action) => {
        if (action.kind === 'reopen')
          return (
            <Box key={action.id} xcss={styles.section}>
              <Stack space="space.075">
                <Checkbox isChecked={action.isSelected} onChange={() => update(action.id, { isSelected: !action.isSelected })} label={`Reopen ${card.title}`} />
                <Box xcss={styles.indent}>
                  <Stack space="space.050">
                    <Text>{action.text}</Text>
                    <Text size="small" color="color.text.subtle">
                      Your card · Not selected unless you tick it
                    </Text>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )
        const connection = connections.find((c) => c.other.id === action.otherId)
        return (
          connection && (
            <Box key={action.id} xcss={styles.section}>
              <ConnectionActionRow
                card={card}
                connection={connection}
                action={action}
                isEditing={editingId === action.id}
                onEdit={setEditingId}
                onChange={update}
              />
            </Box>
          )
        )
      })}

      {followed.length > 0 && (
        <Box xcss={styles.section}>
          <Stack space="space.150">
            <Text weight="semibold">Already followed up</Text>
            {followed.map(({ other }) => {
              const owner = ownerName(other) ?? 'The owner'
              const question = asked(other)
              const isLinked = isOwnerLinked(card, other)
              const icon: RowIcon = isLinked ? 'applied' : question?.impact?.response === 'not-related' ? 'declined' : 'waiting'
              const status = isLinked
                ? `Confirmed · ${owner} linked the cards`
                : icon === 'declined'
                  ? `Declined · ${owner} marked it not related`
                  : 'Awaiting reply'
              return (
                <Box key={other.id} xcss={styles.statusRow}>
                  <StatusIcon icon={icon} />
                  <Stack space="space.025">
                    <Inline space="space.050" alignBlock="center" shouldWrap>
                      <TextAction onClick={() => navigate(paths.card(other.id, card.boardId))}>{other.title}</TextAction>
                      <Text weight="semibold">{`· ${owner}`}</Text>
                    </Inline>
                    <Text color="color.text.subtle">{status}</Text>
                  </Stack>
                </Box>
              )
            })}
          </Stack>
        </Box>
      )}

      {(actions.length > 0 || onBack) && (
        <Box xcss={cx(styles.section, styles.footer)} testId="impact-footer">
          <Stack space="space.200">
            {actions.length > 0 && (
              <Stack space="space.100">
                {/* Announced when ticking changes it (motion audit C5). */}
                <Box aria-live="polite" aria-atomic="true">
                  <Text weight="semibold">
                    {selected.length === 0
                      ? 'Nothing selected.'
                      : summarize([
                          reopens && `reopens ${plural(reopens, 'card', 'cards')}`,
                          links && `links ${plural(links, 'card', 'cards')}`,
                          posts && `posts ${plural(posts, 'comment', 'comments')}`,
                        ])}
                  </Text>
                </Box>
                <LeftOutNote titles={leftOut} />
                <Text size="small" color="color.text.subtle">
                  Suggestions are AI generated and can be wrong. Nothing changes until you apply.
                </Text>
              </Stack>
            )}
            <Inline space="space.100" spread="space-between" alignBlock="center">
              {onBack ? <Button onClick={onBack}>Back</Button> : <span />}
              {actions.length > 0 && (
                <Button appearance="primary" isDisabled={editingId !== null || selected.length === 0} onClick={apply}>
                  {`Apply ${plural(selected.length, 'action', 'actions')}`}
                </Button>
              )}
            </Inline>
          </Stack>
        </Box>
      )}
    </>
  )
}

/** One proposed follow-up: a checkbox to include it, the comment text, Why? and Edit (spec rules 5 and 7). */
function ConnectionActionRow({
  card,
  connection,
  action,
  isEditing,
  onEdit,
  onChange,
}: {
  card: Card
  connection: Connection
  action: ConnectionAction
  isEditing: boolean
  onEdit: (id: string | null) => void
  onChange: (id: string, patch: Partial<ConnectionAction>) => void
}) {
  const state = useAppState()
  const { relation, other, isAnchor } = connection
  const [isWhyOpen, setWhyOpen] = useDisclosure()
  const owner = ownerName(other)
  const mentions = resolveMentions(state, card.boardId, action.text).map((m) => m.fullName.split(' ')[0])
  const isLink = action.kind === 'link'
  const actionName = isLink ? `Link ${card.title} to ${other.title}` : `Post comment on ${other.title}`

  return (
    <Stack space="space.075">
      <Checkbox isChecked={action.isSelected} onChange={() => onChange(action.id, { isSelected: !action.isSelected })} label={actionName} />
      <Box xcss={styles.indent}>
        {isEditing ? (
          <InlineTextEditor
            id={`impact-connection-${action.id}`}
            label="Comment"
            initial={action.text}
            before={<Text size="small" color="color.text.subtle">{`Post on ${other.title}`}</Text>}
            onSave={(text) => {
              onChange(action.id, { text, isTextEdited: true })
              onEdit(null)
            }}
            onCancel={() => onEdit(null)}
          />
        ) : (
          <Stack space="space.075">
            <Box xcss={styles.wrap}>
              <Text>{action.text}</Text>
            </Box>
            <Text size="small" color="color.text.subtle">
              {isLink
                ? `You own ${other.title} · Due ${other.dueDate ? formatShortDate(other.dueDate) : 'not set'}`
                : `Post on ${other.title} · ${mentions.length ? `Mention ${mentions.join(', ')}` : 'No mention'}`}
            </Text>
            <Inline space="space.200">
              <TextAction onClick={() => setWhyOpen((v) => !v)} label={`Why? ${actionName}`}>
                Why?
              </TextAction>
              {!isLink && (
                <TextAction
                  onClick={() => {
                    onEdit(action.id)
                  }}
                  label={`Edit ${actionName}`}
                >
                  Edit
                </TextAction>
              )}
            </Inline>
            {isWhyOpen && (
              <EvidenceDetails
                sourceLabel={relation.sourceLabel}
                quote={relation.quote}
                interpretation={`${relationPhrase(relation, isAnchor)}. If ${card.title}’s dates change, ${other.title} may need to move too. Not confirmed until ${owner ?? 'the owner'} links the cards.`}
                onOpenSource={() => navigate(paths.card(relation.sourceCardId, card.boardId))}
                onHide={() => setWhyOpen(false)}
              />
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}

/** Questions other people asked on this card through Impact. The owner answers them in Comments. */
export function QuestionsOnCard({ card }: { card: Card }) {
  const state = useAppState()
  const questions = card.comments.filter((c) => c.impact)
  if (questions.length === 0) return null
  const isOwner = card.memberIds[0] === state.currentUserId
  return (
    <Box xcss={styles.section}>
      <Stack space="space.150">
        <Text weight="semibold">Questions asked on this card</Text>
        {questions.map((c) => {
          const from = state.cards[c.impact!.reviewCardId]
          const response = c.impact!.response
          const icon: RowIcon = response === 'linked' ? 'applied' : response === 'not-related' ? 'declined' : 'waiting'
          const status =
            response === 'linked'
              ? 'Linked'
              : response === 'not-related'
                ? 'Marked not related'
                : isOwner
                  ? 'Awaiting your reply in Comments'
                  : 'Awaiting reply'
          return (
            <Box key={c.id} xcss={styles.statusRow}>
              <StatusIcon icon={icon} />
              <Stack space="space.025">
                {from ? (
                  <Inline space="space.050" alignBlock="center" shouldWrap>
                    <Text>About</Text>
                    <TextAction onClick={() => navigate(paths.card(from.id, card.boardId))}>{from.title}</TextAction>
                  </Inline>
                ) : (
                  <Text>About a deleted card</Text>
                )}
                <Text color="color.text.subtle">{status}</Text>
              </Stack>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}
