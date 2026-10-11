import { addDays, parseIsoDate, toIsoDate } from '../lib/dates'
import type { TimingAssumptions } from './types'

export interface TimingStep {
  iso: string
  /** Working day number counted on this date, or null when the date is skipped. */
  count: number | null
}

/**
 * Deterministic timing estimate: counts working days after the anchor date.
 * The result is conditional on the assumptions and never becomes an agreed deadline.
 */
export function estimateTiming(assumptions: TimingAssumptions) {
  const steps: TimingStep[] = []
  let date = parseIsoDate(assumptions.anchorDate)
  let counted = 0
  while (counted < assumptions.workingDays) {
    date = addDays(date, 1)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    if (isWeekend && !assumptions.countWeekends) {
      steps.push({ iso: toIsoDate(date), count: null })
      continue
    }
    counted += 1
    steps.push({ iso: toIsoDate(date), count: counted })
  }
  return { result: toIsoDate(date), steps }
}

/** The date `days` working days (or calendar days) before `iso`. */
export function subtractDays(iso: string, days: number, countWeekends: boolean) {
  let date = parseIsoDate(iso)
  let counted = 0
  while (counted < days) {
    date = addDays(date, -1)
    if (countWeekends || (date.getDay() !== 0 && date.getDay() !== 6)) counted += 1
  }
  return toIsoDate(date)
}

/** Calendar days from `from` to `to`; positive when `to` is later. */
export function daysBetween(from: string, to: string) {
  return Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / 86_400_000)
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

export function numberWord(n: number) {
  return NUMBER_WORDS[n] ?? String(n)
}

export function dayUnit(count: number, countWeekends: boolean) {
  return `${countWeekends ? 'day' : 'working day'}${count === 1 ? '' : 's'}`
}

/** "1 day later", "2 days earlier" or "same day", comparing an estimate with the current due date. */
export function shiftLabel(currentDue: string, estimate: string) {
  const diff = daysBetween(currentDue, estimate)
  if (diff === 0) return 'same day'
  const n = Math.abs(diff)
  return `${n} ${n === 1 ? 'day' : 'days'} ${diff > 0 ? 'later' : 'earlier'}`
}

/** Counted dates, naming the month only when it changes: "Nov 9, 10, 11, 12, 13". */
export function formatCountedDays(steps: TimingStep[]) {
  let month = -1
  return steps
    .filter((s) => s.count !== null)
    .map((s) => {
      const d = parseIsoDate(s.iso)
      const label = d.getMonth() === month ? String(d.getDate()) : formatShortDate(s.iso)
      month = d.getMonth()
      return label
    })
    .join(', ')
}


export function formatDate(iso: string) {
  return parseIsoDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatShortDate(iso: string) {
  return parseIsoDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
