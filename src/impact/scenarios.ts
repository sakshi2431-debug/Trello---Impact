import { members } from '../data/members'
import { memberFirstName } from './format'
import { WEBSITE_BOARD_ID, WEBSITE_CARD_IDS } from '../data/websiteLaunch'
import type { AppState, Card } from '../types'
import { dependencyProposals, sentences } from './dependencies'
import { dayUnit, daysBetween, estimateTiming, formatShortDate, numberWord } from './timing'
import type { CommentProposal, DateChange, DescriptionChange, Evidence, Review, ReviewScope, TimingAssumptions } from './types'

export function boardScope(state: AppState, boardId: string): ReviewScope {
  return {
    boardTitle: state.boards[boardId].title,
    checked: 'Cards you can open on this board: descriptions, checklists, comments and linked cards.',
    notChecked: 'Not checked: connected apps and automations.',
  }
}

/**
 * Scripted stand-in for the AI analysis (spec: all findings are scripted from demo data). It recognizes Scenario 1
 * and otherwise reports that no other cards may need attention.
 */
export function analyzeDraft(state: AppState, draft: Card): Review {
  const scope = boardScope(state, draft.boardId)
  const isScenario = draft.boardId === WEBSITE_BOARD_ID && /accessib/i.test(draft.title)
  if (!isScenario) return { scope, proposals: [] }

  const proposals: CommentProposal[] = [
    {
      id: 'comment-launch',
      connection: {
        id: 'connection-launch',
        cardId: WEBSITE_CARD_IDS.launch,
        evidence: {
          sourceLabel: 'From Website Launch’s description',
          sourceName: 'Website Launch · Description',
          quote: 'Complete accessibility checks before launch.',
          interpretation: 'Your new task may address this requirement. Ask Morgan whether it should be linked.',
        },
      },
      text: `@Morgan, should we link the new ${draft.title} task to the existing accessibility requirement?`,
      isSelected: true,
    },
    {
      id: 'comment-release',
      connection: {
        id: 'connection-release',
        cardId: WEBSITE_CARD_IDS.releaseChecklist,
        evidence: {
          sourceLabel: 'From Release checklist’s checklist',
          sourceName: 'Release checklist · Checklist',
          quote: 'Run pre-launch checks with QA.',
          interpretation: 'The review may be a pre-launch step the checklist doesn’t list. Ask Ana whether it should be included.',
        },
      },
      text: `@Ana, should this checklist include ${draft.title} before launch?`,
      isSelected: true,
    },
  ]
  return { scope, proposals }
}

/** Sentences in the edited description that weren't in the saved one. */
export function addedSentences(change: DescriptionChange) {
  const before = new Set(sentences(change.from))
  return sentences(change.to).filter((s) => !before.has(s))
}


/**
 * Scenario 2, scripted from demo data: an added sentence that names another card on the board. If an owner of either
 * card linked them and the user is a member of the other card, Impact proposes editing its description, showing Before
 * and After. Otherwise it only proposes a comment asking the owner (spec rule 4).
 */
export function analyzeDescriptionEdit(state: AppState, card: Card, change: DescriptionChange): Review {
  const scope = boardScope(state, card.boardId)
  const others = state.boards[card.boardId].listIds
    .flatMap((id) => state.lists[id]?.cardIds ?? [])
    .map((id) => state.cards[id])
    .filter((c): c is Card => !!c && c.id !== card.id && !c.isArchived && !c.isDraft)
    .sort((a, b) => b.title.length - a.title.length)
  let match: { sentence: string; other: Card } | undefined
  for (const sentence of addedSentences(change)) {
    const other = others.find((c) => sentence.toLowerCase().includes(c.title.toLowerCase()))
    if (other) {
      match = { sentence, other }
      break
    }
  }
  if (!match) return { scope, proposals: [] }
  const { sentence, other } = match

  // Linked by an owner of either card: the edited card's attachments, or the other card's.
  const owners = [card.memberIds[0], other.memberIds[0]]
  const link =
    card.attachments.find((a) => a.cardId === other.id && owners.includes(a.addedBy)) ??
    other.attachments.find((a) => a.cardId === card.id && owners.includes(a.addedBy))
  const linker = memberFirstName(link?.addedBy)
  const isMember = other.memberIds.includes(state.currentUserId)
  const canEdit = !!link && isMember
  const tail = sentence.match(/must now (?:include|cover) (.+?)[.!]?$/i)?.[1]
  const requirement = tail ?? 'this change'
  const otherText = other.description.trim()

  const descriptionEvidence: Evidence = {
    sourceLabel: `From ${other.title}’s description`,
    sourceName: `${other.title} · Description`,
    quote: otherText || other.title,
    interpretation:
      otherText && tail && !otherText.toLowerCase().includes(tail.toLowerCase())
        ? `It doesn’t mention ${tail}.`
        : `It may need to reflect the new requirement on ${card.title}.`,
    sourceCardId: other.id,
  }

  if (canEdit) {
    const finding = {
      text: tail ? `${other.title} may not cover ${tail}.` : `${other.title} may need to reflect this change.`,
      basis: `Basis: ${linker} linked the two cards · You are a member of ${other.title}`,
      evidence: {
        sourceLabel: `From ${card.title}’s attachments`,
        sourceName: `${card.title} · Attachments`,
        quote: `${other.title} · Linked by ${linker}`,
        interpretation: `${linker} linked ${other.title} to ${card.title}, so the new requirement may need to carry over. ${descriptionEvidence.interpretation}`,
        sourceCardId: card.id,
      },
      canEdit,
    }
    const after = tail ? `${otherText} Also cover ${tail}.`.trim() : `${otherText} ${sentence}`.trim()
    return {
      scope,
      finding,
      proposals: [
        {
          id: `update-${other.id}`,
          connection: { id: `connection-${other.id}`, cardId: other.id, evidence: descriptionEvidence },
          text: after,
          update: { before: otherText },
          isSelected: true,
        },
      ],
    }
  }

  // Ask the edited card's owner on that card, unless that's the user; then ask the other card's owner on theirs.
  const askHere = card.memberIds[0] && card.memberIds[0] !== state.currentUserId
  const target = askHere ? card : other
  const owner = memberFirstName(target.memberIds[0])
  const keyword = other.title
    .split(' ')
    .find((w) => w.length >= 5)
    ?.toLowerCase()
  // e.g. "both mention accessibility": the other card's title or description, and the description as it was before this edit.
  const bothMention = keyword && `${other.title} ${otherText}`.toLowerCase().includes(keyword) && change.from.toLowerCase().includes(keyword)
  const lastWord = card.title.split(' ').pop()!.toLowerCase()
  return {
    scope,
    finding: {
      text: link ? `${other.title} may be affected, but you are not a member of it.` : `${other.title} may be affected, but the cards are not linked.`,
      basis: link
        ? `Basis: ${linker} linked the two cards · You are not a member of ${other.title}`
        : `Basis: ${bothMention ? `both mention ${keyword}` : `the new sentence names ${other.title}`} · Not confirmed by an owner`,
      evidence: {
        ...descriptionEvidence,
        interpretation: link
          ? `${linker} linked the cards, but Impact edits another card only for its members, so it can only ask.`
          : `Both cards may cover the same work, but no owner has linked them, so Impact can only ask.`,
      },
      canEdit: false,
    },
    proposals: [
      {
        id: `comment-${other.id}`,
        connection: { id: `connection-${other.id}`, cardId: target.id, evidence: descriptionEvidence },
        text: `${owner ? `@${owner}, ` : ''}the ${lastWord} requirement now includes ${requirement}. Should ${other.title} cover it?`,
        linkCardId: askHere ? other.id : card.id,
        isSelected: true,
      },
    ],
  }
}

/** Drafts the clarification question from the current timing assumptions. */
export function timingQuestion(timing: TimingAssumptions) {
  const { result } = estimateTiming(timing)
  const diff = daysBetween(timing.currentDue, result)
  const n = Math.abs(diff)
  const relation = diff === 0 ? 'on its current due date' : `${numberWord(n)} ${n === 1 ? 'day' : 'days'} ${diff > 0 ? 'after' : 'before'} its current due date`
  const mention = timing.mention ? `@${timing.mention}, ` : ''
  return `${mention}${timing.anchorTitle} is now due ${formatShortDate(timing.anchorDate)}. If preparation still needs ${numberWord(timing.workingDays)} ${dayUnit(timing.workingDays, timing.countWeekends)} afterward, ${timing.targetTitle} may be ready ${formatShortDate(result)}, ${relation}. Should we adjust the date?`
}

/**
 * Date analysis: reads the dependency notes in card descriptions, checklists and comments (see dependencies.ts)
 * and asks about each card the new date may clash with. Deterministic, from demo data; no AI call.
 */
export function analyzeDateChange(state: AppState, card: Card, change: DateChange): Review {
  return { scope: boardScope(state, card.boardId), proposals: dependencyProposals(state, card, change.to, timingQuestion) }
}

/** True when the quoted evidence still appears in its source card, so the proposal is not stale. */
export function isEvidenceFresh(state: AppState, proposal: CommentProposal) {
  const card = state.cards[proposal.connection.evidence.sourceCardId ?? proposal.connection.cardId]
  if (!card || card.isArchived) return false
  const haystack = [card.title, card.description, ...card.checklists.flatMap((c) => c.items.map((i) => i.text)), ...card.comments.map((c) => c.text)].join('\n')
  return haystack.includes(proposal.connection.evidence.quote)
}

/** Resolves "@First" mentions to board members, the way Trello resolves mentions to accounts. */
export function resolveMentions(state: AppState, boardId: string, text: string) {
  const boardMembers = state.boards[boardId]?.memberIds ?? []
  const names = Array.from(text.matchAll(/@([\p{L}]+)/gu), (m) => m[1].toLowerCase())
  return members.filter((m) => boardMembers.includes(m.id) && names.includes(m.fullName.split(' ')[0].toLowerCase()))
}

