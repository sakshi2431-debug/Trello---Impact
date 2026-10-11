import { useState } from 'react'
import Button from '@atlaskit/button/new'
import Comment, { CommentAction, CommentAuthor, CommentEdited, CommentTime } from '@atlaskit/comment'
import { cssMap } from '@atlaskit/css'
import AiSparkleIcon from '@atlaskit/icon/core/ai-sparkle'
import CommentIcon from '@atlaskit/icon/core/comment'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Textarea from '@atlaskit/textarea'
import { token } from '@atlaskit/tokens'
import { membersById } from '../../data/members'
import { formatRelativeTime } from '../../lib/dates'
import { useAppState, useDispatch } from '../../state/store'
import type { Activity, Card, Comment as CardComment } from '../../types'
import { MemberAvatar } from '../common/MemberAvatar'
import { MentionText } from '../common/MentionText'
import { SectionHeading } from './SectionHeading'

const styles = cssMap({
  activity: { display: 'flex', gap: token('space.100'), alignItems: 'flex-start' },
  text: { whiteSpace: 'pre-wrap' },
})

type Entry = { kind: 'comment'; at: number; comment: CardComment } | { kind: 'activity'; at: number; activity: Activity }

export function CardActivity({ card }: { card: Card }) {
  const dispatch = useDispatch()
  const [showDetails, setShowDetails] = useState(true)
  const [draft, setDraft] = useState('')
  const [isComposing, setComposing] = useState(false)
  // Remounting the textarea returns it to one row after Save or Cancel.
  const [composerKey, setComposerKey] = useState(0)

  const entries: Entry[] = [
    ...card.comments.map((comment) => ({ kind: 'comment' as const, at: comment.createdAt, comment })),
    ...(showDetails ? card.activity.map((activity) => ({ kind: 'activity' as const, at: activity.createdAt, activity })) : []),
  ].sort((a, b) => b.at - a.at)

  const save = () => {
    if (!draft.trim()) return
    dispatch({ type: 'card/addComment', cardId: card.id, text: draft.trim() })
    setDraft('')
    setComposing(false)
    setComposerKey((k) => k + 1)
  }

  if (card.isDraft) {
    return (
      <Stack space="space.200">
        <SectionHeading icon={CommentIcon} title="Comments and activity" />
        <Text color="color.text.subtle">Comments will appear after this card is created.</Text>
      </Stack>
    )
  }

  return (
    <Stack space="space.200">
      <SectionHeading
        icon={CommentIcon}
        title="Comments and activity"
        actions={
          <Button spacing="compact" onClick={() => setShowDetails((v) => !v)}>
            {showDetails ? 'Hide details' : 'Show details'}
          </Button>
        }
      />
      <Stack space="space.100">
        <Textarea
          key={composerKey}
          aria-label="Write a comment"
          placeholder="Write a comment…"
          minimumRows={isComposing ? 3 : 1}
          value={draft}
          onFocus={() => setComposing(true)}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
          }}
        />
        {isComposing && (
          <Inline space="space.050">
            <Button appearance="primary" isDisabled={!draft.trim()} onClick={save}>
              Save
            </Button>
            <Button
              appearance="subtle"
              onClick={() => {
                setDraft('')
                setComposing(false)
                setComposerKey((k) => k + 1)
              }}
            >
              Cancel
            </Button>
          </Inline>
        )}
      </Stack>
      <Stack space="space.200">
        {entries.map((entry) =>
          entry.kind === 'comment' ? (
            <CommentEntry key={entry.comment.id} card={card} comment={entry.comment} />
          ) : (
            <ActivityEntry key={entry.activity.id} activity={entry.activity} />
          ),
        )}
        {entries.length === 0 && <Text color="color.text.subtle">No comments yet.</Text>}
      </Stack>
    </Stack>
  )
}

function CommentEntry({ card, comment }: { card: Card; comment: CardComment }) {
  const { currentUserId } = useAppState()
  const dispatch = useDispatch()
  const [isEditing, setEditing] = useState(false)
  const [text, setText] = useState(comment.text)
  const author = membersById[comment.authorId]
  const isMine = comment.authorId === currentUserId

  return (
    <Comment
      avatar={<MemberAvatar name={author.fullName} size="small" />}
      author={<CommentAuthor>{author.fullName}</CommentAuthor>}
      time={<CommentTime>{formatRelativeTime(comment.createdAt)}</CommentTime>}
      edited={comment.editedAt ? <CommentEdited>Edited</CommentEdited> : undefined}
      shouldHeaderWrap
      content={
        isEditing ? (
          <Stack space="space.100">
            <Textarea aria-label="Edit comment" autoFocus value={text} onChange={(e) => setText(e.currentTarget.value)} />
            <Inline space="space.050">
              <Button
                appearance="primary"
                isDisabled={!text.trim()}
                onClick={() => {
                  dispatch({ type: 'card/editComment', cardId: card.id, commentId: comment.id, text: text.trim() })
                  setEditing(false)
                }}
              >
                Save
              </Button>
              <Button
                appearance="subtle"
                onClick={() => {
                  setText(comment.text)
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
            </Inline>
          </Stack>
        ) : (
          <Stack space="space.100">
            <Box xcss={styles.text}>
              <MentionText text={comment.text} boardId={card.boardId} />
            </Box>
            {comment.impact && <ImpactQuestionAnswer card={card} comment={comment} />}
          </Stack>
        )
      }
      actions={
        isMine && !isEditing
          ? [
              <CommentAction key="edit" onClick={() => setEditing(true)}>
                Edit
              </CommentAction>,
              <CommentAction key="delete" onClick={() => dispatch({ type: 'card/deleteComment', cardId: card.id, commentId: comment.id })}>
                Delete
              </CommentAction>,
            ]
          : undefined
      }
    />
  )
}

/**
 * The owner's side of an Impact question (spec OWNER SIDE): a marker and two responses.
 * Link cards attaches the review's card, which is the only thing that confirms the connection.
 */
function ImpactQuestionAnswer({ card, comment }: { card: Card; comment: CardComment }) {
  const { cards, currentUserId } = useAppState()
  const dispatch = useDispatch()
  const question = comment.impact!
  const isOwner = card.memberIds[0] === currentUserId
  const reviewCard = cards[question.reviewCardId]
  const asker = membersById[comment.authorId]?.fullName.split(' ')[0] ?? 'the asker'
  const answer = (response: 'linked' | 'not-related') => dispatch({ type: 'comment/answerImpact', cardId: card.id, commentId: comment.id, response })
  return (
    <Stack space="space.100">
      <Inline space="space.050" alignBlock="center">
        <AiSparkleIcon label="" size="small" color={token('color.icon.subtle')} />
        <Text size="small" color="color.text.subtle">
          Asked through an Impact review
        </Text>
      </Inline>
      {question.response === 'linked' && <Text size="small">{`Linked ${reviewCard?.title ?? 'the card'} to this card.`}</Text>}
      {question.response === 'not-related' && <Text size="small">Marked not related.</Text>}
      {!question.response && reviewCard && isOwner && (
        <>
          <Inline space="space.100">
            <Button appearance="primary" onClick={() => answer('linked')}>
              Link cards
            </Button>
            <Button onClick={() => answer('not-related')}>Not related</Button>
          </Inline>
          <Text size="small" color="color.text.subtle">{`Linking attaches ${reviewCard.title} to this card and tells ${asker}. You can remove the link later.`}</Text>
        </>
      )}
    </Stack>
  )
}

function ActivityEntry({ activity }: { activity: Activity }) {
  const actor = membersById[activity.actorId]
  return (
    <Box xcss={styles.activity}>
      <MemberAvatar name={actor.fullName} size="small" />
      <Stack space="space.025">
        <Text>
          <Text weight="semibold">{actor.fullName}</Text> {activity.text}
        </Text>
        <Text size="small" color="color.text.subtle">
          {formatRelativeTime(activity.createdAt)}
        </Text>
      </Stack>
    </Box>
  )
}
