import type { Activity, Board, Card, List } from '../types'
import { CURRENT_USER_ID } from './members'

/**
 * The hand-written Website Launch board used by both Trello Impact scenarios.
 * Impact quotes the informal mentions in these descriptions and checklists, so keep the wording in sync
 * with src/impact/scenarios.ts.
 */
export const WEBSITE_BOARD_ID = 'b-launch'
export const WEBSITE_LIST_IDS = { todo: 'b-launch-l0', doing: 'b-launch-l1', launch: 'b-launch-l2', done: 'b-launch-l3' }
export const WEBSITE_CARD_IDS = {
  launch: 'c-launch-launch',
  releaseChecklist: 'c-launch-release',
  article: 'c-launch-article',
  legal: 'c-launch-legal',
  partner: 'c-launch-partner',
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

interface CardSeed {
  id: string
  title: string
  description?: string
  memberIds?: string[]
  labelIds?: string[]
  dueDate?: string
  dueTime?: string
  reminder?: Card['reminder']
  checklist?: { title: string; items: [string, boolean][] }
  link?: { name: string; url: string }
  daysAgo: number
}

const memberIds = [CURRENT_USER_ID, 'm-morgan', 'm-ana', 'm-priya', 'm-leo', 'm-aisha', 'm-sam']

const lists: { id: string; title: string; color?: List['color']; cards: CardSeed[] }[] = [
  {
    id: WEBSITE_LIST_IDS.todo,
    title: 'To do',
    color: 'purple',
    cards: [
      { id: 'c-launch-landing', title: 'Build landing page', memberIds: ['m-sam'], labelIds: ['b-launch-lb1'], daysAgo: 9 },
      { id: 'c-launch-analytics', title: 'Set up analytics', memberIds: ['m-sam'], labelIds: ['b-launch-lb1'], daysAgo: 8 },
    ],
  },
  {
    id: WEBSITE_LIST_IDS.doing,
    title: 'In progress',
    color: 'yellow',
    cards: [
      {
        id: WEBSITE_CARD_IDS.launch,
        title: 'Website Launch',
        description:
          'Ship the redesigned marketing site on November 12, 2026.\n\nBefore we go live:\n- Final copy approved by Marketing.\n- Complete accessibility checks before launch.\n- Analytics events verified on staging.',
        memberIds: ['m-morgan', CURRENT_USER_ID],
        labelIds: ['b-launch-lb0'],
        dueDate: '2026-11-12',
        daysAgo: 21,
      },
      {
        id: WEBSITE_CARD_IDS.legal,
        title: 'Legal Approval',
        description: 'Complete legal approval before the partner announcement. Legal reviews the new terms, privacy notice and partner logos.',
        memberIds: ['m-priya'],
        labelIds: ['b-launch-lb2'],
        dueDate: '2026-11-04',
        dueTime: '03:36',
        reminder: '1d',
        daysAgo: 14,
      },
      {
        id: 'c-launch-copy',
        title: 'Final homepage copy',
        description: 'Marketing owns the last pass on headlines and calls to action.',
        memberIds: ['m-leo'],
        labelIds: ['b-launch-lb3'],
        daysAgo: 12,
      },
    ],
  },
  {
    id: WEBSITE_LIST_IDS.launch,
    title: 'Launch prep',
    color: 'blue',
    cards: [
      {
        id: WEBSITE_CARD_IDS.releaseChecklist,
        title: 'Release checklist',
        description: 'Everything that has to be true before we switch DNS on launch day.',
        memberIds: ['m-ana'],
        labelIds: ['b-launch-lb0'],
        checklist: {
          title: 'Launch day',
          items: [
            ['Run pre-launch checks with QA.', false],
            ['Freeze content in the CMS.', false],
            ['Confirm rollback plan.', true],
            ['Switch DNS.', false],
          ],
        },
        daysAgo: 18,
      },
      {
        id: WEBSITE_CARD_IDS.partner,
        title: 'Partner announcement',
        description: 'Announce the new site with our launch partners.\n\nPreparation needs 5 working days after Legal Approval is complete.',
        memberIds: ['m-ana'],
        labelIds: ['b-launch-lb3'],
        dueDate: '2026-11-12',
        daysAgo: 10,
      },
      {
        id: WEBSITE_CARD_IDS.article,
        title: 'Accessibility article',
        description: 'Background reading: accessibility basics for web teams.',
        memberIds: ['m-aisha'],
        link: { name: 'Accessibility fundamentals', url: 'https://www.w3.org/WAI/fundamentals/' },
        daysAgo: 30,
      },
    ],
  },
  {
    id: WEBSITE_LIST_IDS.done,
    title: 'Done',
    color: 'green',
    cards: [{ id: 'c-launch-cms', title: 'Choose CMS', memberIds: ['m-morgan'], labelIds: ['b-launch-lb1'], daysAgo: 35 }],
  },
]

export function createWebsiteLaunchBoard(now: number) {
  const board: Board = {
    id: WEBSITE_BOARD_ID,
    title: 'Website Launch',
    description: 'Redesigned marketing site, launching November 12, 2026.',
    accent: 'blue',
    visibility: 'workspace',
    isStarred: true,
    memberIds,
    labels: [
      { id: 'b-launch-lb0', name: 'Launch', color: 'green' },
      { id: 'b-launch-lb1', name: 'Build', color: 'blue' },
      { id: 'b-launch-lb2', name: 'Legal', color: 'red' },
      { id: 'b-launch-lb3', name: 'Marketing', color: 'yellow' },
    ],
    listIds: lists.map((l) => l.id),
    createdAt: now - 40 * DAY,
    lastViewedAt: now - HOUR / 2,
  }
  const boardLists: Record<string, List> = {}
  const cards: Record<string, Card> = {}
  for (const list of lists) {
    boardLists[list.id] = { id: list.id, boardId: board.id, title: list.title, color: list.color, cardIds: list.cards.map((c) => c.id), isArchived: false }
    for (const seed of list.cards) {
      const createdAt = now - seed.daysAgo * DAY
      const owner = seed.memberIds?.[0] ?? CURRENT_USER_ID
      const activity: Activity[] = [{ id: `${seed.id}-ac0`, actorId: owner, text: `added this card to ${list.title}`, createdAt }]
      cards[seed.id] = {
        id: seed.id,
        boardId: board.id,
        listId: list.id,
        title: seed.title,
        description: seed.description ?? '',
        labelIds: seed.labelIds ?? [],
        memberIds: seed.memberIds ?? [],
        dueDate: seed.dueDate,
        dueTime: seed.dueTime,
        reminder: seed.reminder,
        isDueComplete: false,
        checklists: seed.checklist
          ? [
              {
                id: `${seed.id}-cl0`,
                title: seed.checklist.title,
                items: seed.checklist.items.map(([text, isDone], i) => ({ id: `${seed.id}-cl0-${i}`, text, isDone })),
              },
            ]
          : [],
        attachments: seed.link
          ? [{ id: `${seed.id}-at0`, name: seed.link.name, kind: 'link', url: seed.link.url, sizeBytes: 0, addedAt: createdAt, addedBy: owner }]
          : [],
        comments: [],
        activity,
        isArchived: false,
        createdAt,
      }
    }
  }
  return { board, lists: boardLists, cards }
}
