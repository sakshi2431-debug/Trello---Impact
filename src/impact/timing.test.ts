import { describe, expect, it } from 'vitest'
import { estimateTiming, shiftLabel, subtractDays } from './timing'

const base = { anchorTitle: 'Legal Approval', currentDue: '2026-11-12', targetTitle: 'Partner announcement', basis: 'approval' }

describe('estimateTiming', () => {
  it('counts working days and skips the weekend', () => {
    // Nov 6, 2026 is a Friday: five working days later is Friday Nov 13.
    const { result, steps } = estimateTiming({ ...base, anchorDate: '2026-11-06', workingDays: 5, countWeekends: false })
    expect(result).toBe('2026-11-13')
    expect(steps.filter((s) => s.count === null).map((s) => s.iso)).toEqual(['2026-11-07', '2026-11-08'])
  })

  it('counts calendar days when weekends count', () => {
    expect(estimateTiming({ ...base, anchorDate: '2026-11-06', workingDays: 5, countWeekends: true }).result).toBe('2026-11-11')
  })

  it('returns the anchor date for zero days', () => {
    expect(estimateTiming({ ...base, anchorDate: '2026-11-06', workingDays: 0, countWeekends: false }).result).toBe('2026-11-06')
  })
})

describe('subtractDays and shiftLabel', () => {
  it('counts back over a weekend', () => {
    expect(subtractDays('2026-11-09', 1, false)).toBe('2026-11-06')
  })

  it('describes the shift from the current due date', () => {
    expect(shiftLabel('2026-11-12', '2026-11-13')).toBe('1 day later')
    expect(shiftLabel('2026-11-12', '2026-11-10')).toBe('2 days earlier')
    expect(shiftLabel('2026-11-12', '2026-11-12')).toBe('same day')
  })
})
