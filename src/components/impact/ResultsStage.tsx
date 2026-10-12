import { type ReactNode, type Ref } from 'react'
import Button from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { useImpact } from '../../impact/ImpactProvider'
import { resolveMentions } from '../../impact/scenarios'
import { joinNames, ownerName, plural } from '../../impact/format'
import { formatDate, formatShortDate } from '../../impact/timing'
import { PRIMARY_ACTION_ID, type CommentProposal, type ImpactSession, type Outcome } from '../../impact/types'
import { navigate, paths } from '../../router'
import { useAppState } from '../../state/store'
import type { Card } from '../../types'
import { TextAction, PanelHeading, ActionRow } from './shared'
import { changeName, type RowIcon, outcomeIcon } from './status'
import { token } from '@atlaskit/tokens'

const styles = cssMap({
  section: {
    paddingBlock: token('space.200'),
    borderBlockStartWidth: token('border.width'),
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: token('color.border'),
  },
})

function changeStatus(session: ImpactSession, outcome: Outcome | undefined, card: Card, listTitle: string, isFinal: boolean) {
  if (session.kind === 'description') {
    switch (outcome?.status) {
      case 'applying':
        return <Text color="color.text.subtle">Saving…</Text>
      case 'applied':
        return <Text>Saved</Text>
      case 'not-applied':
        return <Text>Not saved · Trello did not respond</Text>
      default:
        return <Text color="color.text.subtle">Waiting…</Text>
    }
  }
  if (session.kind === 'date') {
    switch (outcome?.status) {
      case 'applying':
        return <Text color="color.text.subtle">Saving…</Text>
      case 'applied':
        return <Text>{`Saved · ${formatDate(session.dateChange!.to)}`}</Text>
      case 'not-applied':
        return <Text>Not saved · Trello did not respond</Text>
      default:
        return <Text color="color.text.subtle">Waiting…</Text>
    }
  }
  switch (outcome?.status) {
    case 'applying':
      return <Text color="color.text.subtle">Creating…</Text>
    case 'applied':
      return <Text>{isFinal && card.description ? `Created in ${listTitle} with your description.` : `Created in ${listTitle}`}</Text>
    case 'not-applied':
      return <Text>Not created · Trello did not respond</Text>
    default:
      return <Text color="color.text.subtle">Waiting…</Text>
  }
}

/** Each proposal's name in the applying, results and later rows. */
function proposalName(state: ReturnType<typeof useAppState>, p: CommentProposal) {
  const title = state.cards[p.connection.cardId]?.title ?? 'a deleted card'
  return p.update ? `Update ${title} description` : `Post comment on ${title}`
}

/** Status of a confirmed edit to another card's description. */
function updateStatus(outcome: Outcome | undefined) {
  switch (outcome?.status) {
    case 'applying':
      return <Text color="color.text.subtle">Updating…</Text>
    case 'applied':
      return <Text>Updated</Text>
    case 'not-applied':
      return <Text>Not updated · Trello did not respond</Text>
    case 'not-run':
      return (
        <Text color="color.text.subtle">
          {outcome.notRunReason === 'stopped' ? 'Not run · Stopped before it ran' : 'Not run · Needs the description saved first'}
        </Text>
      )
    case 'unknown':
      return <Text>Status unknown · It may or may not have updated</Text>
    default:
      return <Text color="color.text.subtle">Waiting…</Text>
  }
}

function commentStatus(outcome: Outcome | undefined, mentions: string[], isDate = false, isDescription = false) {
  switch (outcome?.status) {
    case 'applying':
      return <Text color="color.text.subtle">Posting…</Text>
    case 'applied':
      return <Text>{mentions.length ? `Posted · ${joinNames(mentions)} mentioned.` : 'Posted.'}</Text>
    case 'not-applied':
      return <Text>Not posted · Trello did not respond</Text>
    case 'not-run':
      return (
        <Text color="color.text.subtle">
          {outcome.notRunReason === 'stopped'
            ? 'Not run · Stopped before it ran'
            : isDate
              ? 'Not run · Needs the date saved first'
              : isDescription
                ? 'Not run · Needs the description saved first'
                : 'Not run · Needs the new card first'}
        </Text>
      )
    case 'unknown':
      return <Text>Status unknown · It may or may not have posted</Text>
    default:
      return <Text color="color.text.subtle">Waiting…</Text>
  }
}

export function ApplyingStage({ card }: { card: Card }) {
  const state = useAppState()
  const { session, stop } = useImpact()
  const review = session!.review!
  const outcomes = session!.outcomes
  const listTitle = state.lists[card.listId]?.title ?? ''
  const approved = 1 + review.proposals.filter((p) => outcomes[p.id]).length
  return (
    <>
      <PanelHeading title={`Applying ${plural(approved, 'action', 'actions')}`}>
        <Text size="small" color="color.text.subtle">
          Steps run in order. Later steps wait for earlier ones.
        </Text>
      </PanelHeading>
      <ActionRow
        name={changeName(session!, card)}
        icon={outcomeIcon(outcomes[PRIMARY_ACTION_ID])}
        status={changeStatus(session!, outcomes[PRIMARY_ACTION_ID], card, listTitle, false)}
      />
      {review.proposals.map((p) => (
        <ActionRow
          key={p.id}
          icon={outcomes[p.id] ? outcomeIcon(outcomes[p.id]) : 'not-run'}
          name={proposalName(state, p)}
          status={
            !outcomes[p.id] ? (
              <Text color="color.text.subtle">Not selected</Text>
            ) : p.update ? (
              updateStatus(outcomes[p.id])
            ) : (
              commentStatus(outcomes[p.id], [], session!.kind === 'date', session!.kind === 'description')
            )
          }
        />
      ))}
      <Box xcss={styles.section}>
        <Inline spread="space-between" alignBlock="center">
          <Button onClick={stop}>Stop</Button>
          <Button appearance="primary" isDisabled>
            Applying…
          </Button>
        </Inline>
      </Box>
    </>
  )
}

export function ResultsStage({ card, headingRef }: { card: Card; headingRef: Ref<HTMLDivElement> }) {
  const state = useAppState()
  const { session, retry, retryAll, checkStatus, backToDraft, finish } = useImpact()
  const review = session!.review!
  const outcomes = session!.outcomes
  const listTitle = state.lists[card.listId]?.title ?? ''
  const comments = review.proposals.filter((p) => outcomes[p.id])
  const all = [PRIMARY_ACTION_ID, ...comments.map((p) => p.id)].map((id) => outcomes[id]?.status)
  const counts = {
    completed: all.filter((s) => s === 'applied').length,
    failed: all.filter((s) => s === 'not-applied').length,
    notRun: all.filter((s) => s === 'not-run').length,
    unknown: all.filter((s) => s === 'unknown').length,
  }
  const isDate = session!.kind === 'date'
  const isDescription = session!.kind === 'description'
  const isAllApplied = counts.completed === all.length
  const createFailed = outcomes[PRIMARY_ACTION_ID]?.status === 'not-applied'
  const posted = comments.filter((p) => !p.update && outcomes[p.id]?.status === 'applied')
  const updated = comments.filter((p) => p.update && outcomes[p.id]?.status === 'applied')
  const subtitle = isAllApplied
    ? isDescription
      ? `${plural(all.length, 'action', 'actions')} completed`
      : `${card.title} · ${state.boards[card.boardId].title} board`
    : [
        counts.completed && `${counts.completed} completed`,
        counts.failed && `${counts.failed} failed`,
        counts.notRun && `${counts.notRun} not run`,
        counts.unknown && `${counts.unknown} unknown`,
      ]
        .filter(Boolean)
        .join(' · ')
  const what = isDate ? 'Your proposed date' : isDescription ? 'Your edit' : 'Your draft'
  const kept =
    comments.length === 0
      ? `${what} is kept.`
      : `${what} and ${comments.length === 1 ? 'the comment' : comments.length === 2 ? 'both comments' : 'the comments'} are kept.`
  // Date questions: the related cards keep their dates until their owners answer.
  const askedCards = isDate ? posted.map((p) => state.cards[p.connection.cardId]).filter((c): c is Card => !!c?.dueDate) : []
  const askedNames = [...new Set(posted.map((p) => ownerName(state.cards[p.connection.cardId])).filter((n): n is string => !!n))]
  const leave = () => {
    finish()
    navigate(paths.board(state.boards[card.boardId] ?? { id: card.boardId, title: '' }, state.boards))
  }

  return (
    <>
      <PanelHeading title="Results" headingRef={headingRef}>
        <Text size="small" color="color.text.subtle">
          {subtitle}
        </Text>
      </PanelHeading>
      {isAllApplied && !isDescription && (
        <Box xcss={styles.section}>
          <Text weight="bold" role="status">{`${plural(all.length, 'Impact action', 'Impact actions')} completed.`}</Text>
        </Box>
      )}
      <ActionRow
        name={changeName(session!, card)}
        icon={outcomeIcon(outcomes[PRIMARY_ACTION_ID])}
        status={changeStatus(session!, outcomes[PRIMARY_ACTION_ID], card, listTitle, true)}
      />
      {comments.map((p) => {
        const target = state.cards[p.connection.cardId]
        const outcome = outcomes[p.id]
        const mentions = resolveMentions(state, card.boardId, p.text).map((m) => m.fullName.split(' ')[0])
        return (
          <ActionRow
            key={p.id}
            name={proposalName(state, p)}
            icon={outcomeIcon(outcome)}
            status={p.update ? updateStatus(outcome) : commentStatus(outcome, mentions, isDate, isDescription)}
          >
            {p.update && outcome?.status === 'applied' && target && (
              <Box>
                <TextAction onClick={() => navigate(paths.card(target.id, card.boardId))}>{`Open ${target.title}`}</TextAction>
              </Box>
            )}
            {outcome?.status === 'unknown' && (
              <Inline space="space.150" alignBlock="center">
                <Button onClick={() => checkStatus(p.id)}>Check status</Button>
                {target && <TextAction onClick={() => navigate(paths.card(target.id, card.boardId))}>{`Open ${target.title}`}</TextAction>}
              </Inline>
            )}
            {/* Only what is verified missing, or never ran, is retried. Comments held behind a failed card retry with it. */}
            {!createFailed && (outcome?.status === 'not-applied' || outcome?.status === 'not-run') && (
              <Box>
                <Button onClick={() => retry(p.id)}>Retry</Button>
              </Box>
            )}
          </ActionRow>
        )
      })}
      <Box xcss={styles.section}>
        <Stack space="space.200">
          {createFailed ? (
            <Stack space="space.050">
              <Text weight="semibold">Nothing was changed.</Text>
              <Text>{`${kept} Retrying runs all ${plural(all.length, 'action', 'actions')} in order.`}</Text>
            </Stack>
          ) : counts.unknown > 0 ? (
            <Stack space="space.050">
              <Text>
                {isDescription && comments.some((p) => p.update && outcomes[p.id]?.status === 'unknown')
                  ? 'Retry is offered only if the edit is confirmed missing, so nothing changes twice.'
                  : 'Retry is offered only if the comment is confirmed missing, so nothing posts twice.'}
              </Text>
              <Text color="color.text.subtle">You can return to this from the Impact tab.</Text>
            </Stack>
          ) : isDescription && updated.length > 0 && posted.length === 0 ? (
            <Stack space="space.050">
              <Text weight="semibold">No owner question outstanding.</Text>
              <Text size="small" color="color.text.subtle">
                Both edits appear in each card’s activity.
              </Text>
            </Stack>
          ) : (
            posted.length > 0 &&
            (askedCards.length > 0 ? (
              <Stack space="space.050">
                {askedCards.map((c) => (
                  <Text key={c.id} weight="semibold">{`${c.title} is still due ${formatShortDate(c.dueDate!)}.`}</Text>
                ))}
                {askedNames.length > 0 && <Text>{`Timing awaits ${joinNames(askedNames)}’s confirmation.`}</Text>}
                <Text>{posted.length === 1 ? 'The connection remains unconfirmed.' : 'Connections remain unconfirmed.'}</Text>
              </Stack>
            ) : (
              <Stack space="space.050">
                <Text weight="semibold">{posted.length === 1 ? 'Question posted.' : 'Questions posted.'}</Text>
                <Text>{posted.length === 1 ? 'The connection remains unconfirmed.' : 'Connections remain unconfirmed.'}</Text>
              </Stack>
            ))
          )}
          {createFailed ? (
            <Inline spread="space-between" alignBlock="center">
              <Button onClick={backToDraft}>{isDate || isDescription ? 'Back to edit' : 'Back to draft'}</Button>
              <Button appearance="primary" onClick={retryAll}>{`Retry ${plural(all.length, 'action', 'actions')}`}</Button>
            </Inline>
          ) : (
            <Inline alignInline="end">
              <Button appearance="primary" onClick={leave}>
                {isAllApplied && !isDescription ? 'Back to board' : 'Done'}
              </Button>
            </Inline>
          )}
        </Stack>
      </Box>
    </>
  )
}

/** Later: the Impact tab reopens the last review and follows each question (spec flow 6). */
export function LaterStage({ card, onReviewAgain }: { card: Card; onReviewAgain: () => void }) {
  const state = useAppState()
  const { session, checkStatus } = useImpact()
  const review = session!.review!
  const asked = review.proposals.filter((p) => session!.outcomes[p.id] && !p.update)
  const updated = review.proposals.filter((p) => session!.outcomes[p.id] && p.update)
  const kind = session!.kind
  return (
    <>
      <PanelHeading title="Impact">
        <Text
          size="small"
          color="color.text.subtle"
        >{`Last review · ${card.title} ${kind === 'date' ? 'date saved' : kind === 'description' ? 'description saved' : 'created'}`}</Text>
      </PanelHeading>
      {updated.length > 0 && (
        <Box xcss={styles.section}>
          <Text weight="semibold">Cards you updated</Text>
        </Box>
      )}
      {updated.map((p) => {
        const target = state.cards[p.connection.cardId]
        const outcome = session!.outcomes[p.id]
        return (
          <ActionRow key={p.id} name={target?.title ?? 'A deleted card'} icon={outcomeIcon(outcome)} status={updateStatus(outcome)}>
            {target && (
              <Box>
                <TextAction onClick={() => navigate(paths.card(target.id, card.boardId))}>{`Open ${target.title}`}</TextAction>
              </Box>
            )}
          </ActionRow>
        )
      })}
      {asked.length > 0 && (
        <Box xcss={styles.section}>
          <Text weight="semibold">Questions you asked</Text>
        </Box>
      )}
      {asked.map((p) => {
        const target = state.cards[p.connection.cardId]
        const owner = ownerName(target)
        const outcome = session!.outcomes[p.id]
        const comment = target?.comments.find((c) => c.id === outcome.commentId)
        // Confirmed only when the target card's owner made the link (spec rule 4).
        const linkedId = p.linkCardId ?? card.id
        const isLinked = !!target?.attachments.some((a) => a.cardId === linkedId && a.addedBy === target.memberIds[0])
        let status: ReactNode
        let icon: RowIcon
        if (isLinked) {
          status = (
            <Text>{`Confirmed · ${owner ?? 'The owner'} linked ${state.cards[linkedId]?.title ?? card.title} to ${p.linkCardId ? target!.title : 'this card'}`}</Text>
          )
          icon = 'applied'
        } else if (comment?.impact?.response === 'not-related') {
          status = <Text>{`Declined · ${owner ?? 'The owner'} marked it not related`}</Text>
          icon = 'declined'
        } else if (outcome.status === 'applied') {
          status = <Text>Awaiting reply</Text>
          icon = 'waiting'
        } else {
          status = commentStatus(outcome, [], session!.kind === 'date')
          icon = outcomeIcon(outcome)
        }
        return (
          <ActionRow key={p.id} name={`${target?.title ?? 'A deleted card'}${owner ? ` · ${owner}` : ''}`} icon={icon} status={status}>
            {outcome.status === 'unknown' && (
              <Box>
                <Button onClick={() => checkStatus(p.id)}>Check status</Button>
              </Box>
            )}
          </ActionRow>
        )
      })}
      <Box xcss={styles.section}>
        <Stack space="space.200">
          <Text size="small" color="color.text.subtle">
            A connection counts as confirmed only when the card owner links the cards.
          </Text>
          <Inline alignInline="end">
            <Button onClick={onReviewAgain}>Review again</Button>
          </Inline>
        </Stack>
      </Box>
    </>
  )
}
