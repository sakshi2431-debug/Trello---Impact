import { useState, type Ref } from 'react'
import Button from '@atlaskit/button/new'
import { Checkbox } from '@atlaskit/checkbox'
import { cx } from '@atlaskit/css'
import { Label } from '@atlaskit/form'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import SectionMessage, { SectionMessageAction } from '@atlaskit/section-message'
import Textarea from '@atlaskit/textarea'
import { useImpact } from '../../impact/ImpactProvider'
import { addedSentences, isEvidenceFresh } from '../../impact/scenarios'
import { joinNames, plural } from '../../impact/format'
import { PRIMARY_ACTION_ID, type CommentProposal } from '../../impact/types'
import { navigate, paths } from '../../router'
import { useAppState } from '../../state/store'
import type { Card } from '../../types'
import { TextAction, ReviewHeading, EvidenceDetails, InlineTextEditor, LeftOutNote } from './shared'
import { styles } from './styles'
import { useDisclosure, useEditFocus } from './focus'
import { CommentAction } from './ReviewStage'

/**
 * Scenario 2: an edited description. Header > Change > Finding > Actions > Summary (spec PANEL STRUCTURE). One finding
 * drives the actions, so it gets its own section. A confirmed connection where the user is a member proposes editing the
 * other card, with Before and After; otherwise Impact only asks.
 */
export function DescriptionReviewStage({ card, headingRef }: { card: Card; headingRef: Ref<HTMLDivElement> }) {
  const state = useAppState()
  const { session, backToDraft, apply, review: reviewAgain } = useImpact()
  const [isWhyOpen, setWhyOpen] = useDisclosure()
  const [editingId, setEditingIdState] = useState<string | null>(null)
  const setEditingId = useEditFocus(setEditingIdState)
  const review = session!.review!
  const change = session!.descriptionChange!
  const finding = review.finding
  const added = addedSentences(change)
  const selected = review.proposals.filter((p) => p.isSelected)
  const leftOut = review.proposals.filter((p) => !p.isSelected).map((p) => state.cards[p.connection.cardId]?.title ?? 'A card')
  const stale = selected.filter((p) => !isEvidenceFresh(state, p) || (p.update && state.cards[p.connection.cardId]?.description.trim() !== p.update.before))
  const updates = selected.filter((p) => p.update).length
  const comments = selected.length - updates
  const count = review.proposals.length
  const attention =
    count === 0 ? 'No other cards may need attention' : `${plural(count, 'card', 'cards')} ${finding?.canEdit ? 'may need attention' : 'may be related'}`
  const summary = `Updates ${plural(1 + updates, 'description', 'descriptions')}${comments ? ` and posts ${plural(comments, 'comment', 'comments')}` : ''}.`
  const editable = review.proposals.find((p) => p.update)
  const linker = finding?.basis.match(/Basis: (\w+) linked/)?.[1]

  return (
    <>
      <ReviewHeading headingRef={headingRef} attention={attention} scope={review.scope} showsBoard={false} />

      {/* Change: what the person is about to save. */}
      <Box xcss={styles.section}>
        <Stack space="space.100">
          <Text weight="semibold">Change</Text>
          <Box xcss={styles.evidence}>
            <Stack space="space.050">
              <Text size="small" color="color.text.subtle">{`${card.title} · Description · ${added.length ? 'Added' : 'Edited'}`}</Text>
              <Box xcss={styles.wrap}>
                <Text>{added.length ? added.join(' ') : change.to}</Text>
              </Box>
            </Stack>
          </Box>
          <Text size="small" color="color.text.subtle">
            Not saved yet
          </Text>
        </Stack>
      </Box>

      {finding && (
        <Box xcss={styles.section}>
          <Stack space="space.100">
            <Text weight="semibold">Finding</Text>
            <Text>{finding.text}</Text>
            <Text size="small" color="color.text.subtle">
              {finding.basis}
            </Text>
            {isWhyOpen ? (
              <EvidenceDetails
                sourceLabel={finding.evidence.sourceLabel}
                quote={finding.evidence.quote}
                interpretation={finding.evidence.interpretation}
                onHide={() => setWhyOpen(false)}
              />
            ) : (
              <Box>
                <TextAction onClick={() => setWhyOpen(true)} label="Why? Finding">
                  Why?
                </TextAction>
              </Box>
            )}
          </Stack>
        </Box>
      )}

      <Box xcss={styles.section}>
        <Stack space="space.200">
          <Text weight="semibold">Actions</Text>
          {/* The person's own change is the first action, always included, with no checkbox. */}
          <SaveDescriptionAction card={card} isEditing={editingId === PRIMARY_ACTION_ID} onEdit={setEditingId} hasAdded={added.length > 0} />
        </Stack>
      </Box>

      {review.proposals.map((proposal) => (
        <Box key={proposal.id} xcss={styles.section}>
          {proposal.update ? (
            <UpdateDescriptionAction card={card} proposal={proposal} isEditing={editingId === proposal.id} onEdit={setEditingId} />
          ) : (
            <CommentAction card={card} proposal={proposal} editingId={editingId} onEdit={setEditingId} />
          )}
        </Box>
      ))}

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
              <Text as="p">{`${joinNames(stale.map((p) => state.cards[p.connection.cardId]?.title ?? 'A card'))} changed since this review.`}</Text>
            </SectionMessage>
          )}
          <Stack space="space.100">
            {/* Announced when ticking changes it (motion audit C5). */}
            <Box aria-live="polite" aria-atomic="true">
              <Text weight="semibold">{summary}</Text>
            </Box>
            <LeftOutNote titles={leftOut} />
            <Text size="small" color="color.text.subtle">
              {`${
                editable
                  ? `Impact can edit ${state.cards[editable.connection.cardId]?.title ?? 'that card'} because ${linker ?? 'an owner'} linked it and you are a member. `
                  : count > 0
                    ? 'Impact can only ask here. It edits another card only after its owner links it. '
                    : ''
              }Suggestions are AI generated and can be wrong. Nothing changes until you apply.`}
            </Text>
          </Stack>
          <Inline space="space.100" spread="space-between" alignBlock="center">
            <Button onClick={backToDraft}>Back to edit</Button>
            <Button appearance="primary" isDisabled={editingId !== null || stale.length > 0} onClick={apply}>
              {`Apply ${plural(1 + selected.length, 'action', 'actions')}`}
            </Button>
          </Inline>
        </Stack>
      </Box>
    </>
  )
}

/** The person's own description change: always included, with no checkbox. Edit rewrites the text and checks again. */
function SaveDescriptionAction({
  card,
  isEditing,
  onEdit,
  hasAdded,
}: {
  card: Card
  isEditing: boolean
  onEdit: (id: string | null) => void
  hasAdded: boolean
}) {
  const { session, setProposedDescription } = useImpact()
  const change = session!.descriptionChange!
  const [text, setText] = useState(change.to)
  return (
    <Box xcss={styles.indent}>
      <Stack space="space.075">
        <Text weight="semibold">{`Save ${card.title} description`}</Text>
        {isEditing ? (
          <Stack space="space.100">
            <Stack space="space.050">
              <Label htmlFor="impact-save-description">Description</Label>
              <Textarea id="impact-save-description" autoFocus minimumRows={4} value={text} onChange={(e) => setText(e.currentTarget.value)} />
            </Stack>
            <Text size="small" color="color.text.subtle">
              Saving changes checks the board again. Nothing changes in Trello until you select Apply.
            </Text>
            <Inline space="space.150" alignBlock="center">
              <Button
                isDisabled={text.trim() === change.to.trim() || text.trim() === change.from.trim()}
                onClick={() => {
                  onEdit(null)
                  setProposedDescription(text.trim())
                }}
              >
                Save changes
              </Button>
              <TextAction
                onClick={() => {
                  setText(change.to)
                  onEdit(null)
                }}
              >
                Cancel
              </TextAction>
            </Inline>
          </Stack>
        ) : (
          <>
            <Text>Always included</Text>
            <Text>{hasAdded ? 'Adds the sentence above.' : 'Saves the edited description.'}</Text>
            <Box>
              <TextAction
                onClick={() => {
                  setText(change.to)
                  onEdit(PRIMARY_ACTION_ID)
                }}
                label={`Edit Save ${card.title} description`}
              >
                Edit
              </TextAction>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  )
}

/** A confirmed edit to another card's description, shown as After and Before. Unticking is the only way to exclude it. */
function UpdateDescriptionAction({
  card,
  proposal,
  isEditing,
  onEdit,
}: {
  card: Card
  proposal: CommentProposal
  isEditing: boolean
  onEdit: (id: string | null) => void
}) {
  const state = useAppState()
  const { updateProposal, setSource } = useImpact()
  const [isWhyOpen, setWhyOpen] = useDisclosure()
  const target = state.cards[proposal.connection.cardId]
  const targetTitle = target?.title ?? 'a deleted card'
  const actionName = `Update ${targetTitle} description`
  const { evidence } = proposal.connection
  return (
    <Stack space="space.075">
      <Checkbox isChecked={proposal.isSelected} onChange={() => updateProposal(proposal.id, { isSelected: !proposal.isSelected })} label={actionName} />
      <Box xcss={styles.indent}>
        {isEditing ? (
          <InlineTextEditor
            id={`impact-update-${proposal.id}`}
            label="After"
            initial={proposal.text}
            after={<Text size="small" color="color.text.subtle">{`Before: ${proposal.update!.before || 'No description'}`}</Text>}
            onSave={(text) => {
              updateProposal(proposal.id, { text, isTextEdited: true })
              onEdit(null)
            }}
            onCancel={() => onEdit(null)}
          />
        ) : (
          <Stack space="space.075">
            <Box xcss={styles.wrap}>
              <Text>{`After: ${proposal.text}`}</Text>
            </Box>
            <Box xcss={styles.wrap}>
              <Text size="small" color="color.text.subtle">{`Before: ${proposal.update!.before || 'No description'}`}</Text>
            </Box>
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
                        setSource({ cardId: target.id, proposalId: proposal.id })
                        navigate(paths.card(target.id, card.boardId))
                      }
                    : undefined
                }
                onHide={() => setWhyOpen(false)}
              />
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
