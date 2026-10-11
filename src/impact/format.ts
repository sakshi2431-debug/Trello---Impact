import { members } from '../data/members'
import type { Card } from '../types'

/** "1 comment", "2 comments". */
export function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

/** "Morgan", "Morgan and Ana", "Morgan, Ana and Sam". */
export function joinNames(names: string[]) {
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** "Reopens 1 card and posts 1 comment." from lower-case parts; empty parts are skipped. */
export function summarize(parts: (string | 0 | false | undefined)[]) {
  const text = joinNames(parts.filter((p): p is string => !!p))
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`
}

/** A board member's first name, as Impact mentions people ("@Morgan"). */
export function memberFirstName(memberId?: string) {
  return members.find((m) => m.id === memberId)?.fullName.split(' ')[0]
}

/** First name of a card's owner (its first member). */
export function ownerName(card?: Card) {
  return memberFirstName(card?.memberIds[0])
}
