import { addDays, toIsoDate } from '../lib/dates'
import { createRandom } from '../lib/random'
import type { AccentColor, Activity, AppState, Board, Card, Checklist, List, Notification } from '../types'
import { boardSeeds, type Stage } from './boards'
import { attachmentNames, checklistTemplates, comments, descriptions } from './content'
import { CURRENT_USER_ID, workspace } from './members'
import { createWebsiteLaunchBoard, WEBSITE_BOARD_ID } from './websiteLaunch'

export const STATE_VERSION = 10

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/** Checklist templates that suit each board, by template title. */
const checklistsByBoard: Record<string, string[]> = {
  'b-roadmap': ['Design', 'Research', 'Implementation'],
  'b-website': ['Design', 'Implementation', 'QA'],
  'b-sprint': ['Implementation', 'QA'],
  'b-marketing': ['Launch', 'Checklist'],
  'b-feedback': ['Research', 'QA'],
  'b-design-system': ['Design', 'Implementation', 'Release'],
  'b-mobile': ['Implementation', 'QA', 'Release'],
  'b-ops': ['Checklist'],
}

const doneRatio: Record<Stage, [number, number]> = {
  backlog: [0, 0],
  todo: [0, 0.2],
  doing: [0.3, 0.7],
  review: [0.8, 1],
  done: [1, 1],
}

/** New Trello colours lists; colour work in flight so the board reads at a glance. */
const listColorByStage: Partial<Record<Stage, AccentColor>> = { doing: 'yellow', review: 'purple', done: 'green' }

const COVER_COLORS: AccentColor[] = ['yellow', 'blue', 'green', 'purple', 'orange']

const INBOX_BOARD_ID = 'b-inbox'
const INBOX_LIST_ID = 'l-inbox'

/** Things captured from email, Slack and quick notes that haven't been sorted onto a board yet. */
const inboxSeed = [
  'See it, send it, save it for later',
  'Email from Leo: launch assets ready for review',
  'Slack from Sam: can you look at the empty state PR?',
  'Book the usability lab for Thursday',
  'Follow up with Priya on research recruiting',
  'Idea: show which cards a date change affects',
]

const dueProfile: Record<Stage, { chance: number; range: [number, number] }> = {
  backlog: { chance: 0.2, range: [7, 30] },
  todo: { chance: 0.5, range: [-2, 14] },
  doing: { chance: 0.7, range: [-4, 7] },
  review: { chance: 0.6, range: [-2, 5] },
  done: { chance: 0.5, range: [-20, -1] },
}

export function createSeedState(): AppState {
  const rand = createRandom(2431)
  const now = Date.now()
  const today = new Date()
  const boards: Record<string, Board> = {}
  const lists: Record<string, List> = {}
  const cards: Record<string, Card> = {}

  for (const seed of boardSeeds) {
    const labels = seed.labels.map((label, i) => ({ id: `${seed.id}-lb${i}`, ...label }))
    const board: Board = {
      id: seed.id,
      title: seed.title,
      description: seed.description,
      accent: seed.accent,
      visibility: seed.visibility,
      isStarred: seed.isStarred,
      memberIds: seed.memberIds,
      labels,
      listIds: [],
      createdAt: now - rand.int(60, 200) * DAY,
      lastViewedAt: seed.viewedHoursAgo === undefined ? undefined : now - seed.viewedHoursAgo * HOUR,
    }
    boards[board.id] = board

    seed.lists.forEach((listSeed, listIndex) => {
      const list: List = {
        id: `${seed.id}-l${listIndex}`,
        boardId: seed.id,
        title: listSeed.title,
        cardIds: [],
        isArchived: false,
        color: listColorByStage[listSeed.stage],
      }
      board.listIds.push(list.id)
      lists[list.id] = list

      listSeed.cards.forEach((title, cardIndex) => {
        const id = `c-${seed.id.slice(2)}-${listIndex}-${cardIndex}`
        const stage = listSeed.stage
        const createdAt = now - rand.int(3, 45) * DAY - rand.int(0, 23) * HOUR
        const memberCount = stage === 'backlog' ? rand.int(0, 1) : rand.int(1, 3)
        const memberIds = rand.sample(seed.memberIds, memberCount)
        const labelIds = rand.sample(labels, rand.chance(0.15) ? 0 : rand.int(1, 2)).map((l) => l.id)

        let dueDate: string | undefined
        const profile = dueProfile[stage]
        if (rand.chance(profile.chance)) dueDate = toIsoDate(addDays(today, rand.int(...profile.range)))

        const checklists: Checklist[] = []
        if (rand.chance(stage === 'backlog' ? 0.2 : 0.55)) {
          const templateTitle = rand.pick(checklistsByBoard[seed.id])
          const template = checklistTemplates.find((t) => t.title === templateTitle)!
          const [min, max] = doneRatio[stage]
          const doneCount = Math.round(template.items.length * (min + rand.next() * (max - min)))
          checklists.push({
            id: `${id}-cl0`,
            title: template.title,
            items: template.items.map((text, i) => ({ id: `${id}-cl0-${i}`, text, isDone: i < doneCount })),
          })
        }

        const attachments = rand.chance(stage === 'backlog' ? 0.15 : 0.35)
          ? rand.sample(attachmentNames, rand.int(1, 3)).map((name, i) => ({
              id: `${id}-at${i}`,
              name,
              kind: name.split('.').pop()!.toLowerCase(),
              sizeBytes: rand.int(18, 9000) * 1024,
              addedAt: createdAt + rand.int(1, 48) * HOUR,
              addedBy: rand.pick(memberIds.length ? memberIds : seed.memberIds),
            }))
          : []

        const commentCount = stage === 'backlog' ? rand.int(0, 1) : rand.int(0, 4)
        const cardComments = rand
          .sample(comments, commentCount)
          .map((text, i) => ({
            id: `${id}-cm${i}`,
            authorId: rand.pick(seed.memberIds),
            text,
            createdAt: Math.min(now - HOUR, createdAt + rand.int(2, 20 * 24) * HOUR),
          }))
          .sort((a, b) => b.createdAt - a.createdAt)

        const firstList = seed.lists[0].title
        const creator = rand.pick(seed.memberIds)
        const activity: Activity[] = [
          { id: `${id}-ac0`, actorId: creator, text: `added this card to ${listIndex === 0 ? firstList : rand.pick(seed.lists.slice(0, listIndex)).title}`, createdAt },
        ]
        if (listIndex > 0) {
          activity.push({ id: `${id}-ac1`, actorId: rand.pick(seed.memberIds), text: `moved this card from ${seed.lists[listIndex - 1].title} to ${listSeed.title}`, createdAt: createdAt + rand.int(1, 6) * DAY })
        }
        memberIds.slice(0, 1).forEach((memberId) => {
          activity.push({ id: `${id}-ac2`, actorId: memberId, text: 'joined this card', createdAt: createdAt + rand.int(1, 20) * HOUR })
        })
        attachments.slice(0, 1).forEach((a) => {
          activity.push({ id: `${id}-ac3`, actorId: a.addedBy, text: `attached ${a.name} to this card`, createdAt: a.addedAt })
        })
        const isDueComplete = stage === 'done' && !!dueDate
        if (isDueComplete) {
          activity.push({ id: `${id}-ac4`, actorId: rand.pick(seed.memberIds), text: 'marked the due date complete', createdAt: Math.min(now - HOUR, createdAt + rand.int(2, 10) * DAY) })
        }
        activity.sort((a, b) => b.createdAt - a.createdAt)

        cards[id] = {
          id,
          cover: rand.chance(0.06) ? rand.pick(COVER_COLORS) : undefined,
          boardId: seed.id,
          listId: list.id,
          title,
          description: rand.chance(stage === 'backlog' ? 0.35 : 0.65) ? rand.pick(descriptions) : '',
          labelIds,
          memberIds,
          dueDate,
          isDueComplete,
          checklists,
          attachments,
          comments: cardComments,
          activity,
          isArchived: false,
          createdAt,
        }
        list.cardIds.push(id)
      })
    })
  }

  const website = createWebsiteLaunchBoard(now)
  boards[website.board.id] = website.board
  Object.assign(lists, website.lists)
  Object.assign(cards, website.cards)

  // The Inbox lives on a hidden board so it shares card behaviour (details, drag and drop) with boards.
  boards[INBOX_BOARD_ID] = {
    id: INBOX_BOARD_ID,
    title: 'Inbox',
    description: '',
    accent: 'blue',
    visibility: 'private',
    isStarred: false,
    memberIds: [CURRENT_USER_ID],
    labels: (['green', 'yellow', 'orange', 'red', 'purple', 'blue'] as AccentColor[]).map((color, i) => ({ id: `${INBOX_BOARD_ID}-lb${i}`, name: '', color })),
    listIds: [INBOX_LIST_ID],
    createdAt: now - 90 * DAY,
  }
  lists[INBOX_LIST_ID] = { id: INBOX_LIST_ID, boardId: INBOX_BOARD_ID, title: 'Inbox', cardIds: [], isArchived: false }
  inboxSeed.forEach((title, i) => {
    const id = `c-inbox-${i}`
    const createdAt = now - (i * 7 + 2) * HOUR
    cards[id] = {
      id,
      boardId: INBOX_BOARD_ID,
      listId: INBOX_LIST_ID,
      title,
      description: i === 1 ? 'Forwarded from email. Leo shared the final launch assets folder and needs sign-off by Friday.' : '',
      labelIds: [],
      memberIds: [CURRENT_USER_ID],
      dueDate: i === 3 ? toIsoDate(addDays(today, 3)) : undefined,
      isDueComplete: false,
      checklists: [],
      attachments: [],
      comments: [],
      activity: [{ id: `${id}-ac0`, actorId: CURRENT_USER_ID, text: 'added this card to Inbox', createdAt }],
      isArchived: false,
      createdAt,
    }
    lists[INBOX_LIST_ID].cardIds.push(id)
  })

  // Notifications come from cards the current user is on, so each one links somewhere real.
  const myCards = Object.values(cards).filter((c) => c.memberIds.includes(CURRENT_USER_ID) && c.boardId !== INBOX_BOARD_ID)
  const templates = ['mentioned you on', 'commented on', 'added you to', 'changed the due date of', 'moved', 'attached a file to']
  const notifications: Notification[] = rand.sample(myCards, 8).map((card, i) => {
    const others = boards[card.boardId].memberIds.filter((m) => m !== CURRENT_USER_ID)
    return {
      id: `n-${i}`,
      actorId: rand.pick(others),
      cardId: card.id,
      text: templates[i % templates.length],
      createdAt: now - (i * 5 + rand.int(1, 4)) * HOUR,
      isRead: i >= 3,
    }
  })

  return {
    version: STATE_VERSION,
    currentUserId: CURRENT_USER_ID,
    workspace,
    inboxBoardId: INBOX_BOARD_ID,
    inboxListId: INBOX_LIST_ID,
    preferences: {
      showLabelText: false,
      panels: { inbox: true, planner: false, board: true },
      isTemplatesPromoDismissed: false,
      bio: 'Project lead for the Lumen marketing site.',
    },
    boardOrder: [WEBSITE_BOARD_ID, ...boardSeeds.map((b) => b.id)],
    boards,
    lists,
    cards,
    notifications,
  }
}
