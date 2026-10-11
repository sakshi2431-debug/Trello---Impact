import { formatShortDate, formatTime } from '../lib/dates'
import { createId } from '../lib/random'
import type { CardTemplate } from '../data/templates'
import type { AccentColor, AppState, Attachment, Board, Card, CardDates, ImpactQuestion, Label, PanelName, Preferences, Visibility } from '../types'

export type Action =
  | { type: 'reset'; state: AppState }
  | { type: 'workspace/update'; patch: Partial<Pick<AppState['workspace'], 'name' | 'description' | 'visibility'>> }
  | { type: 'notifications/markAllRead' }
  | { type: 'notifications/markRead'; id: string }
  | { type: 'preferences/update'; patch: Partial<Omit<Preferences, 'panels'>> }
  | { type: 'preferences/togglePanel'; panel: PanelName }
  | {
      type: 'board/create'
      id: string
      title: string
      accent: AccentColor
      visibility: Visibility
      /** Lists (and starter cards) from a template; defaults to To do / Doing / Done. */
      lists?: { title: string; color?: AccentColor; cards: string[] }[]
    }
  | { type: 'board/setClosed'; boardId: string; isClosed: boolean }
  | { type: 'board/update'; boardId: string; patch: Partial<Pick<Board, 'title' | 'description' | 'visibility'>> }
  | { type: 'board/toggleStar'; boardId: string }
  | { type: 'board/viewed'; boardId: string }
  | { type: 'card/viewed'; cardId: string }
  | { type: 'board/addMember'; boardId: string; memberId: string }
  | { type: 'board/createLabel'; boardId: string; label: Label }
  | { type: 'list/create'; boardId: string; title: string }
  | { type: 'list/rename'; listId: string; title: string }
  | { type: 'list/archive'; listId: string }
  | { type: 'list/restore'; listId: string }
  | { type: 'list/setColor'; listId: string; color?: AccentColor }
  | { type: 'list/toggleCollapsed'; listId: string }
  | { type: 'card/create'; id: string; listId: string; title: string; position?: 'top' | 'bottom' }
  | { type: 'card/createFromTemplate'; id: string; listId: string; template: CardTemplate }
  | { type: 'card/setCover'; cardId: string; cover?: AccentColor }
  | { type: 'card/update'; cardId: string; patch: Partial<Pick<Card, 'title' | 'description'>> }
  | { type: 'card/move'; cardId: string; toListId: string; toIndex: number }
  | { type: 'card/toggleMember'; cardId: string; memberId: string }
  | { type: 'card/toggleLabel'; cardId: string; labelId: string }
  | { type: 'card/setDue'; cardId: string; dueDate?: string }
  | { type: 'card/setDates'; cardId: string; dates: CardDates }
  | { type: 'card/toggleDueComplete'; cardId: string }
  | { type: 'card/toggleComplete'; cardId: string }
  | { type: 'card/createDraft'; id: string; listId: string; title: string; description?: string }
  | { type: 'card/updateDraft'; cardId: string; patch: Partial<Pick<Card, 'title' | 'description' | 'listId'>> }
  | { type: 'card/commitDraft'; cardId: string }
  | { type: 'card/toggleWatch'; cardId: string }
  | { type: 'card/addChecklist'; cardId: string; title: string }
  | { type: 'card/deleteChecklist'; cardId: string; checklistId: string }
  | { type: 'card/addChecklistItem'; cardId: string; checklistId: string; text: string }
  | { type: 'card/toggleChecklistItem'; cardId: string; checklistId: string; itemId: string }
  | { type: 'card/deleteChecklistItem'; cardId: string; checklistId: string; itemId: string }
  | { type: 'card/addAttachment'; cardId: string; attachment: Omit<Attachment, 'id' | 'addedAt' | 'addedBy'> }
  | { type: 'card/removeAttachment'; cardId: string; attachmentId: string }
  | { type: 'card/addComment'; cardId: string; text: string; id?: string; impact?: ImpactQuestion }
  | { type: 'comment/answerImpact'; cardId: string; commentId: string; response: 'linked' | 'not-related' }
  | { type: 'card/linkImpact'; cardId: string; linkedCardId: string }
  | { type: 'card/setDescription'; cardId: string; description: string }
  | { type: 'card/editComment'; cardId: string; commentId: string; text: string }
  | { type: 'card/deleteComment'; cardId: string; commentId: string }
  | { type: 'card/setArchived'; cardId: string; isArchived: boolean }
  | { type: 'card/delete'; cardId: string }

function updateCard(state: AppState, cardId: string, update: (card: Card) => Card): AppState {
  const card = state.cards[cardId]
  if (!card) return state
  return { ...state, cards: { ...state.cards, [cardId]: update(card) } }
}

function withActivity(state: AppState, card: Card, text: string): Card {
  return { ...card, activity: [{ id: createId('ac'), actorId: state.currentUserId, text, createdAt: Date.now() }, ...card.activity] }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'reset':
      return action.state

    case 'workspace/update':
      return { ...state, workspace: { ...state.workspace, ...action.patch } }

    case 'notifications/markAllRead':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, isRead: true })) }

    case 'notifications/markRead':
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, isRead: true } : n)) }

    case 'board/create': {
      const listSeeds = action.lists ?? [
        { title: 'To do', cards: [] },
        { title: 'Doing', cards: [] },
        { title: 'Done', cards: [] },
      ]
      const lists = { ...state.lists }
      const cards = { ...state.cards }
      const now = Date.now()
      const listIds = listSeeds.map((seed) => {
        const id = createId('l')
        const cardIds = seed.cards.map((title) => {
          const cardId = createId('c')
          cards[cardId] = {
            id: cardId,
            boardId: action.id,
            listId: id,
            title,
            description: '',
            labelIds: [],
            memberIds: [],
            isDueComplete: false,
            checklists: [],
            attachments: [],
            comments: [],
            activity: [{ id: createId('ac'), actorId: state.currentUserId, text: `added this card to ${seed.title}`, createdAt: now }],
            isArchived: false,
            createdAt: now,
          }
          return cardId
        })
        lists[id] = { id, boardId: action.id, title: seed.title, cardIds, isArchived: false, color: seed.color }
        return id
      })
      // New Trello boards start with six unnamed colour labels.
      const labelColors: AccentColor[] = ['green', 'yellow', 'orange', 'red', 'purple', 'blue']
      const board: Board = {
        id: action.id,
        title: action.title,
        description: '',
        accent: action.accent,
        visibility: action.visibility,
        isStarred: false,
        memberIds: [state.currentUserId],
        labels: labelColors.map((color) => ({ id: createId('lb'), name: '', color })),
        listIds,
        createdAt: Date.now(),
        lastViewedAt: Date.now(),
      }
      return { ...state, lists, cards, boards: { ...state.boards, [board.id]: board }, boardOrder: [...state.boardOrder, board.id] }
    }

    case 'board/setClosed': {
      const board = state.boards[action.boardId]
      return {
        ...state,
        boards: { ...state.boards, [board.id]: { ...board, isClosed: action.isClosed, isStarred: action.isClosed ? false : board.isStarred } },
      }
    }

    case 'preferences/update':
      return { ...state, preferences: { ...state.preferences, ...action.patch } }

    case 'preferences/togglePanel': {
      const panels = { ...state.preferences.panels, [action.panel]: !state.preferences.panels[action.panel] }
      // Keep at least one panel on screen.
      if (!Object.values(panels).some(Boolean)) return state
      return { ...state, preferences: { ...state.preferences, panels } }
    }

    case 'board/update': {
      const board = state.boards[action.boardId]
      return { ...state, boards: { ...state.boards, [board.id]: { ...board, ...action.patch } } }
    }

    case 'board/toggleStar': {
      const board = state.boards[action.boardId]
      return { ...state, boards: { ...state.boards, [board.id]: { ...board, isStarred: !board.isStarred } } }
    }

    case 'card/viewed': {
      const card = state.cards[action.cardId]
      if (!card || card.isDraft) return state
      return { ...state, cards: { ...state.cards, [card.id]: { ...card, lastViewedAt: Date.now() } } }
    }

    case 'board/viewed': {
      const board = state.boards[action.boardId]
      if (!board) return state
      return { ...state, boards: { ...state.boards, [board.id]: { ...board, lastViewedAt: Date.now() } } }
    }

    case 'board/addMember': {
      const board = state.boards[action.boardId]
      if (board.memberIds.includes(action.memberId)) return state
      return { ...state, boards: { ...state.boards, [board.id]: { ...board, memberIds: [...board.memberIds, action.memberId] } } }
    }

    case 'board/createLabel': {
      const board = state.boards[action.boardId]
      return { ...state, boards: { ...state.boards, [board.id]: { ...board, labels: [...board.labels, action.label] } } }
    }

    case 'list/create': {
      const id = createId('l')
      const board = state.boards[action.boardId]
      return {
        ...state,
        lists: { ...state.lists, [id]: { id, boardId: board.id, title: action.title, cardIds: [], isArchived: false } },
        boards: { ...state.boards, [board.id]: { ...board, listIds: [...board.listIds, id] } },
      }
    }

    case 'list/rename': {
      const list = state.lists[action.listId]
      return { ...state, lists: { ...state.lists, [list.id]: { ...list, title: action.title } } }
    }

    case 'list/archive': {
      const list = state.lists[action.listId]
      const board = state.boards[list.boardId]
      return {
        ...state,
        lists: { ...state.lists, [list.id]: { ...list, isArchived: true } },
        boards: { ...state.boards, [board.id]: { ...board, listIds: board.listIds.filter((id) => id !== list.id) } },
      }
    }

    case 'list/restore': {
      const list = state.lists[action.listId]
      const board = state.boards[list.boardId]
      return {
        ...state,
        lists: { ...state.lists, [list.id]: { ...list, isArchived: false } },
        boards: { ...state.boards, [board.id]: { ...board, listIds: [...board.listIds, list.id] } },
      }
    }

    case 'list/setColor': {
      const list = state.lists[action.listId]
      return { ...state, lists: { ...state.lists, [list.id]: { ...list, color: action.color } } }
    }

    case 'list/toggleCollapsed': {
      const list = state.lists[action.listId]
      return { ...state, lists: { ...state.lists, [list.id]: { ...list, isCollapsed: !list.isCollapsed } } }
    }

    case 'card/createFromTemplate': {
      const created = reducer(state, { type: 'card/create', id: action.id, listId: action.listId, title: action.template.title })
      return updateCard(created, action.id, (card) => ({
        ...card,
        description: action.template.description,
        checklists: [{ id: createId('cl'), title: 'Checklist', items: action.template.checklist.map((text) => ({ id: createId('ci'), text, isDone: false })) }],
      }))
    }

    case 'card/setCover':
      return updateCard(state, action.cardId, (card) => ({ ...card, cover: action.cover }))

    case 'card/create': {
      const list = state.lists[action.listId]
      const now = Date.now()
      const card: Card = {
        id: action.id,
        boardId: list.boardId,
        listId: list.id,
        title: action.title,
        description: '',
        labelIds: [],
        // Inbox cards are personal, so they belong to you (and show in your Planner).
        memberIds: list.id === state.inboxListId ? [state.currentUserId] : [],
        isDueComplete: false,
        checklists: [],
        attachments: [],
        comments: [],
        activity: [{ id: createId('ac'), actorId: state.currentUserId, text: `added this card to ${list.title}`, createdAt: now }],
        isArchived: false,
        createdAt: now,
      }
      const cardIds = action.position === 'top' ? [card.id, ...list.cardIds] : [...list.cardIds, card.id]
      return { ...state, cards: { ...state.cards, [card.id]: card }, lists: { ...state.lists, [list.id]: { ...list, cardIds } } }
    }

    case 'card/update':
      return updateCard(state, action.cardId, (card) => {
        // Remember the old title, so other cards' sentences that name it keep pointing here.
        const renamed = action.patch.title !== undefined && action.patch.title !== card.title
        const previousTitles = renamed ? [...new Set([...(card.previousTitles ?? []), card.title])].filter((t) => t !== action.patch.title) : card.previousTitles
        return { ...card, ...action.patch, previousTitles }
      })

    // A description saved by an approved Impact action, recorded in the card's activity.
    case 'card/setDescription':
      return updateCard(state, action.cardId, (card) =>
        withActivity(state, { ...card, description: action.description }, 'updated the description of this card'),
      )

    case 'card/move': {
      const card = state.cards[action.cardId]
      const from = state.lists[card.listId]
      const to = state.lists[action.toListId]
      const lists = { ...state.lists }
      const fromIds = from.cardIds.filter((id) => id !== card.id)
      lists[from.id] = { ...from, cardIds: fromIds }
      const toIds = from.id === to.id ? fromIds : to.cardIds.filter((id) => id !== card.id)
      const index = Math.max(0, Math.min(action.toIndex, toIds.length))
      lists[to.id] = { ...lists[to.id], cardIds: [...toIds.slice(0, index), card.id, ...toIds.slice(index)] }

      let moved: Card = { ...card, listId: to.id, boardId: to.boardId }
      if (from.id !== to.id) {
        const crossBoard = from.boardId !== to.boardId
        moved = withActivity(
          state,
          moved,
          crossBoard
            ? `moved this card from ${state.boards[from.boardId].title} to ${state.boards[to.boardId].title}`
            : `moved this card from ${from.title} to ${to.title}`,
        )
        if (crossBoard) moved.labelIds = []
      }
      return { ...state, lists, cards: { ...state.cards, [card.id]: moved } }
    }

    case 'card/toggleMember':
      return updateCard(state, action.cardId, (card) => {
        const has = card.memberIds.includes(action.memberId)
        const next = { ...card, memberIds: has ? card.memberIds.filter((m) => m !== action.memberId) : [...card.memberIds, action.memberId] }
        if (action.memberId !== state.currentUserId) return next
        return withActivity(state, next, has ? 'left this card' : 'joined this card')
      })

    case 'card/toggleLabel':
      return updateCard(state, action.cardId, (card) => ({
        ...card,
        labelIds: card.labelIds.includes(action.labelId) ? card.labelIds.filter((l) => l !== action.labelId) : [...card.labelIds, action.labelId],
      }))

    case 'card/setDue':
      return updateCard(state, action.cardId, (card) =>
        withActivity(
          state,
          { ...card, dueDate: action.dueDate, isDueComplete: action.dueDate ? card.isDueComplete : false },
          action.dueDate ? `set this card to be due ${formatShortDate(action.dueDate)}` : 'removed the due date from this card',
        ),
      )

    case 'card/setDates': {
      const card = state.cards[action.cardId]
      if (!card) return state
      const { dates } = action
      const dueChanged = dates.dueDate !== card.dueDate || dates.dueTime !== card.dueTime
      const next = { ...card, ...dates, isDueComplete: dates.dueDate ? card.isDueComplete : false }
      const text = !dueChanged
        ? 'updated the dates on this card'
        : dates.dueDate
          ? `changed the due date of this card to ${formatShortDate(dates.dueDate)}${dates.dueTime ? ` at ${formatTime(dates.dueTime)}` : ''}`
          : 'removed the due date from this card'
      return updateCard(state, action.cardId, () => withActivity(state, next, text))
    }

    case 'card/toggleDueComplete':
      return updateCard(state, action.cardId, (card) =>
        withActivity(
          state,
          { ...card, isDueComplete: !card.isDueComplete },
          card.isDueComplete ? 'marked the due date incomplete' : 'marked the due date complete',
        ),
      )

    case 'card/createDraft': {
      const list = state.lists[action.listId]
      const now = Date.now()
      const draft: Card = {
        id: action.id,
        boardId: list.boardId,
        listId: list.id,
        title: action.title,
        description: action.description ?? '',
        labelIds: [],
        memberIds: [],
        isDueComplete: false,
        checklists: [],
        attachments: [],
        comments: [],
        activity: [],
        isArchived: false,
        isDraft: true,
        createdAt: now,
      }
      return { ...state, cards: { ...state.cards, [draft.id]: draft } }
    }

    case 'card/updateDraft':
      return updateCard(state, action.cardId, (card) => (card.isDraft ? { ...card, ...action.patch } : card))

    // Approving an Impact review puts the staged card at the end of its list.
    case 'card/commitDraft': {
      const card = state.cards[action.cardId]
      if (!card?.isDraft) return state
      const list = state.lists[card.listId]
      const committed = withActivity(state, { ...card, isDraft: false, createdAt: Date.now() }, `added this card to ${list.title}`)
      return {
        ...state,
        cards: { ...state.cards, [card.id]: committed },
        lists: { ...state.lists, [list.id]: { ...list, cardIds: [...list.cardIds, card.id] } },
      }
    }

    case 'card/toggleComplete':
      return updateCard(state, action.cardId, (card) =>
        withActivity(state, { ...card, isComplete: !card.isComplete }, card.isComplete ? 'marked this card incomplete' : 'marked this card complete'),
      )

    case 'card/toggleWatch':
      return updateCard(state, action.cardId, (card) => ({ ...card, isWatching: !card.isWatching }))

    case 'card/addChecklist':
      return updateCard(state, action.cardId, (card) =>
        withActivity(
          state,
          { ...card, checklists: [...card.checklists, { id: createId('cl'), title: action.title, items: [] }] },
          `added ${action.title} to this card`,
        ),
      )

    case 'card/deleteChecklist':
      return updateCard(state, action.cardId, (card) => ({ ...card, checklists: card.checklists.filter((c) => c.id !== action.checklistId) }))

    case 'card/addChecklistItem':
      return updateCard(state, action.cardId, (card) => ({
        ...card,
        checklists: card.checklists.map((c) =>
          c.id === action.checklistId ? { ...c, items: [...c.items, { id: createId('ci'), text: action.text, isDone: false }] } : c,
        ),
      }))

    case 'card/toggleChecklistItem':
      return updateCard(state, action.cardId, (card) => {
        const item = card.checklists.find((c) => c.id === action.checklistId)?.items.find((i) => i.id === action.itemId)
        const next = {
          ...card,
          checklists: card.checklists.map((c) =>
            c.id === action.checklistId ? { ...c, items: c.items.map((i) => (i.id === action.itemId ? { ...i, isDone: !i.isDone } : i)) } : c,
          ),
        }
        return item && !item.isDone ? withActivity(state, next, `completed ${item.text} on this card`) : next
      })

    case 'card/deleteChecklistItem':
      return updateCard(state, action.cardId, (card) => ({
        ...card,
        checklists: card.checklists.map((c) => (c.id === action.checklistId ? { ...c, items: c.items.filter((i) => i.id !== action.itemId) } : c)),
      }))

    case 'card/addAttachment':
      return updateCard(state, action.cardId, (card) =>
        withActivity(
          state,
          { ...card, attachments: [...card.attachments, { ...action.attachment, id: createId('at'), addedAt: Date.now(), addedBy: state.currentUserId }] },
          `attached ${action.attachment.name} to this card`,
        ),
      )

    case 'card/removeAttachment':
      return updateCard(state, action.cardId, (card) => ({ ...card, attachments: card.attachments.filter((a) => a.id !== action.attachmentId) }))

    case 'card/addComment':
      return updateCard(state, action.cardId, (card) => ({
        ...card,
        comments: [
          { id: action.id ?? createId('cm'), authorId: state.currentUserId, text: action.text, createdAt: Date.now(), impact: action.impact },
          ...card.comments,
        ],
      }))

    // The owner answers an Impact question. Link cards attaches the review's card, which confirms the connection.
    case 'comment/answerImpact': {
      const card = state.cards[action.cardId]
      const comment = card?.comments.find((c) => c.id === action.commentId)
      const linked = comment?.impact ? state.cards[comment.impact.reviewCardId] : undefined
      // Only the card's owner answers; a connection is confirmed only when the owner links the cards (spec rule 4).
      if (!card || !comment?.impact || comment.impact.response || card.memberIds[0] !== state.currentUserId) return state
      const ownerId = state.currentUserId
      const answered = {
        ...card,
        comments: card.comments.map((c) => (c.id === comment.id ? { ...c, impact: { ...comment.impact!, response: action.response } } : c)),
      }
      if (action.response === 'not-related' || !linked) return { ...state, cards: { ...state.cards, [card.id]: answered } }
      const attachment = { id: createId('at'), name: linked.title, kind: 'card', cardId: linked.id, sizeBytes: 0, addedAt: Date.now(), addedBy: ownerId }
      const withLink = {
        ...answered,
        attachments: [...answered.attachments, attachment],
        activity: [{ id: createId('ac'), actorId: ownerId, text: `linked ${linked.title} to this card`, createdAt: Date.now() }, ...answered.activity],
      }
      return { ...state, cards: { ...state.cards, [card.id]: withLink } }
    }

    // The owner links a possible connection from the Impact summary. Only the card's owner can, which confirms it (spec rule 4).
    case 'card/linkImpact': {
      const card = state.cards[action.cardId]
      const linked = state.cards[action.linkedCardId]
      if (!card || !linked || card.memberIds[0] !== state.currentUserId || card.attachments.some((a) => a.cardId === linked.id)) return state
      const ownerId = state.currentUserId
      // An open question about the same card is answered by the link.
      const comments = card.comments.map((c) =>
        c.impact?.reviewCardId === linked.id && !c.impact.response ? { ...c, impact: { ...c.impact, response: 'linked' as const } } : c,
      )
      const attachment = { id: createId('at'), name: linked.title, kind: 'card', cardId: linked.id, sizeBytes: 0, addedAt: Date.now(), addedBy: ownerId }
      return {
        ...state,
        cards: {
          ...state.cards,
          [card.id]: {
            ...card,
            comments,
            attachments: [...card.attachments, attachment],
            activity: [{ id: createId('ac'), actorId: ownerId, text: `linked ${linked.title} to this card`, createdAt: Date.now() }, ...card.activity],
          },
        },
      }
    }

    case 'card/editComment':
      return updateCard(state, action.cardId, (card) => ({
        ...card,
        comments: card.comments.map((c) => (c.id === action.commentId ? { ...c, text: action.text, editedAt: Date.now() } : c)),
      }))

    case 'card/deleteComment':
      return updateCard(state, action.cardId, (card) => ({ ...card, comments: card.comments.filter((c) => c.id !== action.commentId) }))

    case 'card/setArchived':
      return updateCard(state, action.cardId, (card) =>
        withActivity(state, { ...card, isArchived: action.isArchived }, action.isArchived ? 'archived this card' : 'sent this card to the board'),
      )

    case 'card/delete': {
      const card = state.cards[action.cardId]
      const list = state.lists[card.listId]
      const cards = { ...state.cards }
      delete cards[card.id]
      return {
        ...state,
        cards,
        lists: { ...state.lists, [list.id]: { ...list, cardIds: list.cardIds.filter((id) => id !== card.id) } },
        notifications: state.notifications.filter((n) => n.cardId !== card.id),
      }
    }
  }
}
