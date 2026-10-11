import { getDueStatus } from '../../lib/dates'
import type { Card } from '../../types'

export type DueFilter = 'none' | 'overdue' | 'due-soon' | 'complete'

export interface BoardFilter {
  keyword: string
  /** Member ids, plus "none" for cards without members. */
  memberIds: string[]
  /** Label ids, plus "none" for cards without labels. */
  labelIds: string[]
  due: DueFilter[]
}

export const emptyFilter: BoardFilter = { keyword: '', memberIds: [], labelIds: [], due: [] }

export function activeFilterCount(filter: BoardFilter) {
  return (filter.keyword.trim() ? 1 : 0) + filter.memberIds.length + filter.labelIds.length + filter.due.length
}

/** Trello semantics: OR within a category, AND across categories. */
export function matchesFilter(card: Card, filter: BoardFilter) {
  const keyword = filter.keyword.trim().toLowerCase()
  if (keyword && !card.title.toLowerCase().includes(keyword) && !card.description.toLowerCase().includes(keyword)) return false

  if (filter.memberIds.length) {
    const ok = filter.memberIds.some((id) => (id === 'none' ? card.memberIds.length === 0 : card.memberIds.includes(id)))
    if (!ok) return false
  }

  if (filter.labelIds.length) {
    const ok = filter.labelIds.some((id) => (id === 'none' ? card.labelIds.length === 0 : card.labelIds.includes(id)))
    if (!ok) return false
  }

  if (filter.due.length) {
    const status = card.dueDate ? getDueStatus(card.dueDate, card.isDueComplete) : null
    const ok = filter.due.some((f) => (f === 'none' ? !card.dueDate : status === f))
    if (!ok) return false
  }

  return true
}
