import type { Activity, Board, Card, List } from '../types'
import { CURRENT_USER_ID } from './members'

/**
 * The hand-written "Marketing launch" board used by the Trello Impact scenarios (docs/impact-spec.md, Figma file A).
 * Impact quotes the informal mentions in these descriptions and checklists, so keep the wording in sync
 * with src/impact/scenarios.ts.
 */
export const WEBSITE_BOARD_ID = 'b-launch'
export const WEBSITE_LIST_IDS = { todo: 'b-launch-l0', doing: 'b-launch-l1', review: 'b-launch-l2', done: 'b-launch-l3' }
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
  comments?: { by: string; text: string; daysAgo: number }[]
  link?: { name: string; url: string }
  daysAgo: number
}

const memberIds = [CURRENT_USER_ID, 'm-morgan', 'm-ana', 'm-sam', 'm-aisha', 'm-priya', 'm-leo', 'm-hannah']

/*
 * Dependencies are written in ordinary card text (descriptions, checklist items, comments), the way teams note them.
 * Date reviews read them with src/impact/dependencies.ts:
 *   "N working days after <card>", "N working days before <card>", "before <card>", "after <card>",
 *   "All cards in <list> must be done before <card>."
 * Every relation holds for the seeded dates, so nothing needs attention until a date moves.
 * Scenario 1 quotes Website Launch's description and Release checklist's first item: keep those exact.
 */
const lists: { id: string; title: string; color?: List['color']; cards: CardSeed[] }[] = [
  {
    id: WEBSITE_LIST_IDS.todo,
    title: 'To do',
    color: 'purple',
    cards: [
      {
        id: 'c-launch-landing',
        title: 'Build landing page',
        description: 'Build the new landing page in the CMS from the approved designs. Ready 2 working days after Final homepage copy.',
        memberIds: ['m-sam'],
        labelIds: ['b-launch-lb1'],
        dueDate: '2026-10-30',
        checklist: { title: 'Build', items: [['Hero section', false], ['Pricing table', false], ['Sign-up form', false], ['Responsive check', false]] },
        comments: [{ by: 'm-sam', text: 'I can start the hero as soon as the copy lands.', daysAgo: 2 }],
        daysAgo: 9,
      },
      {
        id: 'c-launch-analytics',
        title: 'Set up analytics',
        description: 'Tag sign-up and pricing events on the new pages. Tagging takes 1 working day after Build landing page.',
        memberIds: ['m-sam'],
        labelIds: ['b-launch-lb1'],
        dueDate: '2026-11-03',
        checklist: { title: 'Events', items: [['Sign-up started', false], ['Sign-up completed', false], ['Pricing viewed', false]] },
        comments: [{ by: 'm-morgan', text: 'The launch dashboards have to be live before Website Launch.', daysAgo: 3 }],
        daysAgo: 8,
      },
      {
        id: WEBSITE_CARD_IDS.partner,
        title: 'Partner announcement',
        description: 'Announce the new site with our launch partners.\n\nPreparation needs 5 working days after Legal Approval is complete.',
        memberIds: ['m-ana'],
        labelIds: ['b-launch-lb3'],
        dueDate: '2026-11-12',
        checklist: { title: 'Partners', items: [['Confirm partner list', true], ['Share the draft post', false], ['Schedule partner posts', false]] },
        daysAgo: 10,
      },
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
        description: 'Prepare the website for launch and coordinate final readiness checks. Complete accessibility checks before launch.',
        memberIds: ['m-morgan'],
        labelIds: ['b-launch-lb0', 'b-launch-lb3'],
        dueDate: '2026-11-04',
        daysAgo: 21,
      },
      {
        id: WEBSITE_CARD_IDS.releaseChecklist,
        title: 'Release checklist',
        description: 'Everything that has to be true before we switch DNS on launch day.',
        memberIds: ['m-ana'],
        labelIds: ['b-launch-lb0'],
        dueDate: '2026-11-03',
        checklist: {
          title: 'Launch day',
          items: [
            ['Run pre-launch checks with QA.', false],
            ['Freeze content in the CMS.', false],
            ['Confirm rollback plan.', true],
            ['Sign off the checklist before Website Launch.', false],
          ],
        },
        daysAgo: 18,
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
        checklist: { title: 'Review', items: [['New terms', true], ['Privacy notice', false], ['Partner logos', false]] },
        comments: [{ by: 'm-priya', text: 'Partner logos are with the brand team. The privacy notice is still in review.', daysAgo: 1 }],
        daysAgo: 14,
      },
      {
        id: 'c-launch-copy',
        title: 'Final homepage copy',
        description: 'Marketing owns the last pass on headlines and calls to action.',
        memberIds: ['m-leo'],
        labelIds: ['b-launch-lb3'],
        dueDate: '2026-10-26',
        comments: [{ by: 'm-leo', text: 'Headlines are done. Working on the pricing section next.', daysAgo: 1 }],
        daysAgo: 12,
      },
    ],
  },
  {
    id: WEBSITE_LIST_IDS.review,
    title: 'In review',
    color: 'blue',
    cards: [
      {
        id: WEBSITE_CARD_IDS.article,
        title: 'Accessibility article',
        description: 'Background reading: accessibility basics for web teams.',
        memberIds: ['m-aisha'],
        link: { name: 'Accessibility fundamentals', url: 'https://www.w3.org/WAI/fundamentals/' },
        daysAgo: 30,
      },
      {
        id: 'c-launch-press',
        title: 'Press kit',
        description: 'Screenshots, logos and the announcement draft. The press kit goes to partners 2 working days before Partner announcement.',
        memberIds: ['m-leo'],
        labelIds: ['b-launch-lb3'],
        dueDate: '2026-11-06',
        checklist: { title: 'Kit', items: [['Screenshots', true], ['Logo pack', false], ['Announcement draft', false]] },
        daysAgo: 9,
      },
      {
        id: 'c-launch-qa',
        title: 'QA sign-off',
        description: 'QA signs off on staging. Sign-off comes 1 working day after Release checklist.',
        memberIds: ['m-hannah'],
        labelIds: ['b-launch-lb0'],
        dueDate: '2026-11-04',
        daysAgo: 11,
      },
    ],
  },
  {
    id: WEBSITE_LIST_IDS.done,
    title: 'Done',
    color: 'green',
    cards: [{ id: 'c-launch-cms', title: 'Choose CMS', description: 'Picked the CMS for the marketing site.', memberIds: ['m-morgan'], labelIds: ['b-launch-lb1'], daysAgo: 35 }],
  },
]

export function createWebsiteLaunchBoard(now: number) {
  const board: Board = {
    id: WEBSITE_BOARD_ID,
    title: 'Marketing launch',
    description: 'Redesigned marketing site and launch readiness.',
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
        comments: (seed.comments ?? []).map((c, i) => ({ id: `${seed.id}-cm${i}`, authorId: c.by, text: c.text, createdAt: now - c.daysAgo * DAY })),
        activity,
        isArchived: false,
        createdAt,
      }
    }
  }
  return { board, lists: boardLists, cards }
}
