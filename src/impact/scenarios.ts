import { members } from '../data/members'
import { WEBSITE_BOARD_ID, WEBSITE_CARD_IDS } from '../data/websiteLaunch'
import type { AppState, Card } from '../types'
import { dayUnit, daysBetween, estimateTiming, formatShortDate, numberWord } from './timing'
import type { CommentProposal, DateChange, Review, ReviewScope, TimingAssumptions } from './types'

function boardScope(state: AppState, boardId: string): ReviewScope {
  const board = state.boards[boardId]
  const openCards = board.listIds
    .filter((id) => !state.lists[id].isArchived)
    .flatMap((id) => state.lists[id].cardIds)
    .filter((id) => !state.cards[id]?.isArchived)
  return {
    boardTitle: board.title,
    cardCount: openCards.length,
    checked: `Titles, descriptions, checklists and comments on ${openCards.length} open cards on the ${board.title} board.`,
    notChecked: 'Other boards, archived cards, attachment contents, connected tools and Butler automations.',
  }
}

/**
 * Scripted stand-in for the AI analysis. The prototype does not call a model: it recognizes the
 * brief's primary scenario and otherwise reports that nothing on the board may need attention.
 */
export function analyzeDraft(state: AppState, draft: Card): Review {
  const scope = boardScope(state, draft.boardId)
  const isScenario = draft.boardId === WEBSITE_BOARD_ID && /accessib/i.test(draft.title)
  if (!isScenario) return { draftCardId: draft.id, scope, proposals: [] }

  const proposals: CommentProposal[] = [
    {
      id: 'comment-launch',
      connection: {
        id: 'connection-launch',
        cardId: WEBSITE_CARD_IDS.launch,
        evidence: {
          sourceLabel: 'From Website Launch’s description',
          quote: 'Complete accessibility checks before launch.',
          interpretation: 'Your new task may address this requirement. Ask Morgan whether it should be linked.',
        },
      },
      text: `@Morgan, should we link the new ${draft.title} task to the existing accessibility requirement?`,
      isSelected: true,
      isSkipped: false,
    },
    {
      id: 'comment-release',
      connection: {
        id: 'connection-release',
        cardId: WEBSITE_CARD_IDS.releaseChecklist,
        evidence: {
          sourceLabel: 'From Release checklist’s checklist',
          quote: 'Run pre-launch checks with QA.',
          interpretation: 'The review adds a pre-launch step the checklist doesn’t list. Ask Ana whether it should be included.',
        },
      },
      text: `@Ana, should this checklist include ${draft.title} before launch?`,
      isSelected: true,
      isSkipped: false,
    },
    {
      id: 'comment-article',
      connection: {
        id: 'connection-article',
        cardId: WEBSITE_CARD_IDS.article,
        evidence: {
          sourceLabel: 'From Accessibility article’s description',
          quote: 'Background reading: accessibility basics for web teams.',
          interpretation: 'It shares the topic but reads as reference material, not planned work, so it was skipped.',
        },
      },
      text: `@Aisha, is this article relevant to the new ${draft.title} task?`,
      isSelected: false,
      isSkipped: true,
    },
  ]
  return { draftCardId: draft.id, scope, proposals }
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
 * Scripted date analysis for the brief's secondary scenario. Other cards report that nothing may need attention.
 * The timing estimate is calculated from explicit inputs by estimateTiming, not by the AI.
 */
export function analyzeDateChange(state: AppState, card: Card, change: DateChange): Review {
  const scope = boardScope(state, card.boardId)
  const partner = state.cards[WEBSITE_CARD_IDS.partner]
  if (card.id !== WEBSITE_CARD_IDS.legal || !partner?.dueDate || partner.isArchived) return { draftCardId: card.id, scope, proposals: [] }
  const owner = members.find((m) => m.id === partner.memberIds[0])
  const timing: TimingAssumptions = {
    anchorTitle: card.title,
    anchorDate: change.to,
    workingDays: 5,
    countWeekends: false,
    currentDue: partner.dueDate,
    targetTitle: partner.title,
    mention: owner?.fullName.split(' ')[0],
    basis: 'approval',
  }
  return {
    draftCardId: card.id,
    scope,
    proposals: [
      {
        id: 'comment-partner',
        connection: {
          id: 'connection-partner',
          cardId: partner.id,
          evidence: {
            sourceLabel: 'From Partner announcement’s description',
            quote: 'Preparation needs 5 working days after Legal Approval is complete.',
            interpretation: `The announcement appears to wait for Legal Approval, so a later approval may push it back. Ask ${owner?.fullName.split(' ')[0] ?? 'the card owner'} whether the timing still holds.`,
          },
        },
        text: timingQuestion(timing),
        timing,
        isSelected: true,
        isSkipped: false,
      },
    ],
  }
}

/** True when the quoted evidence still appears in its source card, so the proposal is not stale. */
export function isEvidenceFresh(state: AppState, proposal: CommentProposal) {
  const card = state.cards[proposal.connection.cardId]
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
