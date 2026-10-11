export interface CardDragData extends Record<string | symbol, unknown> {
  type: 'card'
  cardId: string
  listId: string
}

export interface ListDropData extends Record<string | symbol, unknown> {
  type: 'list'
  listId: string
}

export function isCardDragData(data: Record<string | symbol, unknown>): data is CardDragData {
  return data.type === 'card'
}

export function isListDropData(data: Record<string | symbol, unknown>): data is ListDropData {
  return data.type === 'list'
}

/** A day in the Planner; dropping a card here sets its due date. */
export interface DayDropData extends Record<string | symbol, unknown> {
  type: 'day'
  iso: string
}

export function isDayDropData(data: Record<string | symbol, unknown>): data is DayDropData {
  return data.type === 'day'
}
