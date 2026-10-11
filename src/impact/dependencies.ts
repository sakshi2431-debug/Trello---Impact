import { ownerName } from './format'
import type { AppState, Card } from '../types'
import { dayUnit, estimateTiming, formatShortDate, numberWord, shiftLabel, subtractDays } from './timing'
import type { ChainStep, CommentProposal, Evidence, TimingAssumptions } from './types'

/**
 * Dependencies come from ordinary card text: descriptions, checklist items and comments.
 * Nothing is stored as a dependency record; each relation is re-read from its sentence on every review,
 * so editing or deleting the sentence changes what Impact finds.
 */
export type Kind = 'offset-after' | 'offset-before' | 'after' | 'before'

export interface Relation {
  kind: Kind
  /** The card named in the sentence. */
  anchorId: string
  /** The card the sentence constrains. */
  dependentId: string
  days: number
  countWeekends: boolean
  /** Where the sentence was found. */
  sourceCardId: string
  sourceLabel: string
  /** e.g. "Partner announcement · Description" */
  sourceName: string
  quote: string
}

const NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function sentences(text: string) {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
}

function textSources(card: Card) {
  return [
    ...sentences(card.description).map((quote) => ({ label: 'description', quote })),
    ...card.checklists.flatMap((c) => c.items.flatMap((i) => sentences(i.text).map((quote) => ({ label: 'checklist', quote })))),
    ...card.comments.flatMap((c) => sentences(c.text).map((quote) => ({ label: 'comment', quote }))),
  ]
}

function openCards(state: AppState, boardId: string) {
  const board = state.boards[boardId]
  return board.listIds
    .filter((id) => !state.lists[id]?.isArchived)
    .flatMap((id) => state.lists[id].cardIds)
    .map((id) => state.cards[id])
    .filter((c): c is Card => !!c && !c.isArchived && !c.isDraft)
}

/** Reads every dependency sentence on the board. */
export function findRelations(state: AppState, boardId: string): Relation[] {
  const cards = openCards(state, boardId)
  // Every name a card answers to: its title and any earlier titles. Longer names first, so "Website Launch" wins over a
  // shorter title inside it.
  const names = (c: Card) => [c.title, ...(c.previousTitles ?? [])]
  const byTitle = cards
    .flatMap((c) => names(c).map((name) => ({ card: c, name })))
    .sort((a, b) => b.name.length - a.name.length)
  const named = (title: string) => cards.find((c) => names(c).some((n) => n.toLowerCase() === title.toLowerCase()))
  const relations: Relation[] = []
  for (const card of cards) {
    for (const { label, quote } of textSources(card)) {
      const base = {
        sourceCardId: card.id,
        sourceLabel: `From ${card.title}’s ${label}`,
        sourceName: `${card.title} · ${label[0].toUpperCase()}${label.slice(1)}`,
        quote,
      }
      // A rule for a whole list: "All cards in Launch prep must be done before Website Launch."
      const rule = quote.match(
        /^all cards in (?:the )?(.+?)(?: list)? (?:must|should|need to) be (?:done|finished|complete(?:d)?) before (?:the )?(.+?)[.!]?$/i,
      )
      if (rule) {
        const list = state.boards[boardId].listIds
          .map((id) => state.lists[id])
          .find((l) => l && !l.isArchived && l.title.toLowerCase() === rule[1].toLowerCase())
        const anchor = named(rule[2])
        if (list && anchor) {
          for (const id of list.cardIds) {
            if (id !== anchor.id && cards.some((c) => c.id === id))
              relations.push({ ...base, kind: 'before', anchorId: anchor.id, dependentId: id, days: 0, countWeekends: false })
          }
        }
        continue
      }
      let rest = quote
      for (const { card: anchor, name } of byTitle) {
        if (anchor.id === card.id) continue
        const pattern = new RegExp(
          `(?:\\b(\\d+|${Object.keys(NUMBERS).join('|')}) (working )?days? )?\\b(after|before) (?:the )?${escape(name)}\\b`,
          'i',
        )
        const match = rest.match(pattern)
        if (!match) continue
        // Blank out the match so a shorter title can't match inside it.
        rest = rest.replace(match[0], ' '.repeat(match[0].length))
        const days = match[1] ? (NUMBERS[match[1].toLowerCase()] ?? Number(match[1])) : 0
        const direction = match[3].toLowerCase() as 'after' | 'before'
        const kind: Kind = days ? (direction === 'after' ? 'offset-after' : 'offset-before') : direction
        relations.push({ ...base, kind, anchorId: anchor.id, dependentId: card.id, days, countWeekends: !match[2] })
      }
    }
  }
  return relations
}

/** Done in Trello terms: marked complete, due date ticked, or sitting in a list named Done. */
export function isCardDone(state: AppState, card: Card) {
  return !!card.isComplete || card.isDueComplete || state.lists[card.listId]?.title.trim().toLowerCase() === 'done'
}

/**
 * Cards that should be finished before this one but aren't: cards it waits for ("2 working days after X"), and cards
 * that must be done before it ("Sign off before Website Launch").
 */
export function unfinishedPrerequisites(state: AppState, card: Card): { card: Card; relation: Relation }[] {
  const seen = new Set<string>()
  const result: { card: Card; relation: Relation }[] = []
  for (const r of findRelations(state, card.boardId)) {
    const id =
      r.dependentId === card.id && (r.kind === 'after' || r.kind === 'offset-after')
        ? r.anchorId
        : r.anchorId === card.id && (r.kind === 'before' || r.kind === 'offset-before')
          ? r.dependentId
          : undefined
    const other = id ? state.cards[id] : undefined
    if (!other || seen.has(other.id) || isCardDone(state, other)) continue
    seen.add(other.id)
    result.push({ card: other, relation: r })
  }
  return result
}

function addWorkingDays(iso: string, days: number, countWeekends: boolean) {
  return estimateTiming({ anchorTitle: '', anchorDate: iso, workingDays: days, countWeekends, currentDue: '', targetTitle: '', basis: '' }).result
}

interface Slip {
  cardId: string
  /** The date the card may move to. */
  projected: string
  /** Every step from the changed card to this one. */
  chain: ChainStep[]
  /** The relation that carries the slip into this card. */
  relation: Relation
}

/**
 * Follows a later date through the board: cards that wait for a slipping card may slip too, and a card that must be done
 * before another may push that one back. Each card is reached once, by the path that moves it furthest. Done cards and
 * cards with no due date stop the chain. Every result is a possibility; nothing is moved.
 */
function cascadeSlips(state: AppState, boardId: string, startId: string, startDate: string): Slip[] {
  const start = state.cards[startId]
  if (!start) return []
  const relations = findRelations(state, boardId)
  const projected = new Map<string, string>([[startId, startDate]])
  const chains = new Map<string, ChainStep[]>([[startId, [{ cardId: startId, title: start.title, date: startDate }]]])
  const slips = new Map<string, Slip>()
  const queue = [startId]
  while (queue.length) {
    const id = queue.shift()!
    const date = projected.get(id)!
    const from = state.cards[id]
    for (const r of relations) {
      let targetId: string
      let next: string
      let link: string
      if (r.anchorId === id && (r.kind === 'offset-after' || r.kind === 'after')) {
        // Waits for the slipping card.
        targetId = r.dependentId
        next = r.kind === 'after' ? addWorkingDays(date, 1, false) : addWorkingDays(date, r.days, r.countWeekends)
        link = r.kind === 'after' ? `starts after ${from.title}` : `${r.days} ${dayUnit(r.days, r.countWeekends)} after ${from.title}`
      } else if (r.dependentId === id && (r.kind === 'before' || r.kind === 'offset-before')) {
        // The slipping card has to be done before this one.
        targetId = r.anchorId
        next = r.kind === 'before' ? date : addWorkingDays(date, r.days, r.countWeekends)
        link = r.kind === 'before' ? `comes after ${from.title}` : `${r.days} ${dayUnit(r.days, r.countWeekends)} after ${from.title}`
      } else continue
      const target = state.cards[targetId]
      if (!target?.dueDate || targetId === startId || isCardDone(state, target)) continue
      if (next <= (projected.get(targetId) ?? target.dueDate)) continue
      projected.set(targetId, next)
      const chain = [...chains.get(id)!, { cardId: targetId, title: target.title, date: next, currentDue: target.dueDate, link }]
      chains.set(targetId, chain)
      slips.set(targetId, { cardId: targetId, projected: next, chain, relation: r })
      queue.push(targetId)
    }
  }
  return [...slips.values()]
}

function evidence(relation: Relation, interpretation: string): Evidence {
  return { sourceLabel: relation.sourceLabel, sourceName: relation.sourceName, quote: relation.quote, interpretation, sourceCardId: relation.sourceCardId }
}

/** "approval" for Legal Approval, otherwise the card title, as in "Assumes 5 working days after approval." */
function basisFor(title: string) {
  return /approval$/i.test(title) ? 'approval' : title
}

/**
 * Checks every relation that touches the changed card against its proposed due date.
 * Only clashes become proposals: one question per affected card, posted on that card, and no date is ever changed.
 */
export function dependencyProposals(state: AppState, changed: Card, newDue: string, timingQuestion: (t: TimingAssumptions) => string): CommentProposal[] {
  const proposals = new Map<string, CommentProposal>()
  const add = (target: Card, proposal: Omit<CommentProposal, 'id' | 'isSelected'>) => {
    if (proposals.has(target.id)) return
    proposals.set(target.id, { ...proposal, id: `comment-${target.id}`, isSelected: true })
  }
  const ask = (target: Card) => {
    const name = ownerName(target)
    return { mention: name, prefix: name ? `@${name}, ` : '', who: name ?? 'the card owner' }
  }

  for (const r of findRelations(state, changed.boardId)) {
    if (r.anchorId === changed.id) {
      // The changed card is named in another card's sentence: that card may need to move.
      const dep = state.cards[r.dependentId]
      // Finished work can't slip: marked complete, due date ticked, or in Done.
      if (!dep?.dueDate || isCardDone(state, dep)) continue
      const { mention, prefix, who } = ask(dep)
      const connection = (interpretation: string) => ({ id: `connection-${dep.id}`, cardId: dep.id, evidence: evidence(r, interpretation) })
      if (r.kind === 'offset-after') {
        const timing: TimingAssumptions = {
          anchorTitle: changed.title,
          anchorDate: newDue,
          workingDays: r.days,
          countWeekends: r.countWeekends,
          currentDue: dep.dueDate,
          targetTitle: dep.title,
          mention,
          basis: basisFor(changed.title),
        }
        if (estimateTiming(timing).result <= dep.dueDate) continue
        add(dep, {
          connection: connection(
            `${dep.title} appears to wait for ${changed.title}, so a later date may push it back. Ask ${who} whether the timing still holds.`,
          ),
          text: timingQuestion(timing),
          timing,
        })
      } else {
        const latest = r.kind === 'offset-before' ? subtractDays(newDue, r.days, r.countWeekends) : newDue
        const clashes = r.kind === 'after' ? newDue >= dep.dueDate : dep.dueDate > latest
        if (!clashes) continue
        const need =
          r.kind === 'after'
            ? `starts after ${changed.title}`
            : r.kind === 'before'
              ? `needs to be done before ${changed.title}`
              : `needs to be done ${numberWord(r.days)} ${dayUnit(r.days, r.countWeekends)} before ${changed.title}`
        add(dep, {
          connection: connection(`${dep.title} appears to depend on ${changed.title}’s date. Ask ${who} whether its date still works.`),
          text: `${prefix}${changed.title} is now due ${formatShortDate(newDue)}. ${dep.title} ${need}${r.kind === 'offset-before' ? `, so by ${formatShortDate(latest)}` : ''}, but it’s due ${formatShortDate(dep.dueDate)}. Should we adjust the date?`,
          conflict: {
            targetTitle: dep.title,
            currentDue: dep.dueDate,
            reason:
              r.kind === 'after'
                ? `Starts after ${changed.title}, now due ${formatShortDate(newDue)}.`
                : r.kind === 'before'
                  ? `Needs to be done before ${changed.title}, now due ${formatShortDate(newDue)}.`
                  : `Needs to be done ${r.days} ${dayUnit(r.days, r.countWeekends)} before ${changed.title}, so by ${formatShortDate(latest)}.`,
          },
        })
      }
    } else if (r.dependentId === changed.id) {
      // The changed card's own sentence names another card: the new date may not leave enough time.
      const anchor = state.cards[r.anchorId]
      if (!anchor?.dueDate || isCardDone(state, anchor)) continue
      const { prefix, who } = ask(anchor)
      const earliest =
        r.kind === 'offset-after'
          ? estimateTiming({
              anchorTitle: '',
              anchorDate: anchor.dueDate,
              workingDays: r.days,
              countWeekends: r.countWeekends,
              currentDue: '',
              targetTitle: '',
              basis: '',
            }).result
          : undefined
      const latestAllowed = r.kind === 'offset-before' ? subtractDays(anchor.dueDate, r.days, r.countWeekends) : undefined
      const clashes =
        r.kind === 'offset-after'
          ? newDue < earliest!
          : r.kind === 'after'
            ? newDue <= anchor.dueDate
            : r.kind === 'before'
              ? newDue > anchor.dueDate
              : newDue > latestAllowed!
      if (!clashes) continue
      const reason =
        r.kind === 'offset-after'
          ? `${changed.title} needs ${r.days} ${dayUnit(r.days, r.countWeekends)} after ${anchor.title}, so it can’t be ready before ${formatShortDate(earliest!)}.`
          : r.kind === 'after'
            ? `${changed.title} starts after ${anchor.title}, which is due ${formatShortDate(anchor.dueDate)}.`
            : r.kind === 'before'
              ? `${changed.title} needs to be done before ${anchor.title}, which is due ${formatShortDate(anchor.dueDate)}.`
              : `${changed.title} needs to be done ${r.days} ${dayUnit(r.days, r.countWeekends)} before ${anchor.title}, so by ${formatShortDate(latestAllowed!)}.`
      const question =
        r.kind === 'offset-after'
          ? `${prefix}${changed.title} may move to ${formatShortDate(newDue)}, but it needs ${numberWord(r.days)} ${dayUnit(r.days, r.countWeekends)} after ${anchor.title} (due ${formatShortDate(anchor.dueDate)}). Could ${anchor.title} be done by ${formatShortDate(subtractDays(newDue, r.days, r.countWeekends))}?`
          : r.kind === 'after'
            ? `${prefix}${changed.title} may move to ${formatShortDate(newDue)}, but it starts after ${anchor.title}, which is due ${formatShortDate(anchor.dueDate)}. Could ${anchor.title} finish earlier?`
            : `${prefix}${changed.title} may move to ${formatShortDate(newDue)}, but it needs to be done before ${anchor.title}, which is due ${formatShortDate(anchor.dueDate)}. Should ${anchor.title} move, or should ${changed.title} keep its date?`
      add(anchor, {
        connection: {
          id: `connection-${anchor.id}`,
          cardId: anchor.id,
          evidence: evidence(r, `${changed.title}’s new date may not leave enough time around ${anchor.title}. Ask ${who} before relying on it.`),
        },
        text: question,
        conflict: { targetTitle: anchor.title, currentDue: anchor.dueDate, reason },
      })
    }
  }
  // Cards reached through other cards: one question each, explaining the chain.
  for (const slip of cascadeSlips(state, changed.boardId, changed.id, newDue)) {
    if (slip.chain.length < 3 || proposals.has(slip.cardId)) continue
    const target = state.cards[slip.cardId]
    const { prefix, who } = ask(target)
    const via = slip.chain.slice(1, -1)
    const through = via.map((s) => `${s.title} (may move to ${formatShortDate(s.date)})`).join(', then ')
    const shift = shiftLabel(target.dueDate!, slip.projected)
    add(target, {
      connection: {
        id: `connection-${target.id}`,
        cardId: target.id,
        evidence: evidence(
          slip.relation,
          `${target.title} doesn’t name ${changed.title}, but it depends on ${via[via.length - 1].title}, which may move because of it. Ask ${who} whether the date still holds.`,
        ),
      },
      text: `${prefix}${changed.title} may move to ${formatShortDate(newDue)}. Through ${through}, ${target.title} may slip to ${formatShortDate(slip.projected)}, ${shift} than its due date ${formatShortDate(target.dueDate!)}. Should we adjust the date?`,
      conflict: {
        targetTitle: target.title,
        currentDue: target.dueDate,
        reason: `May slip to ${formatShortDate(slip.projected)} through ${via.map((s) => s.title).join(' and ')}.`,
      },
      chain: slip.chain,
    })
  }
  return [...proposals.values()]
}
