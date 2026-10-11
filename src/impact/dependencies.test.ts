import { describe, expect, it } from 'vitest'
import { board, BOARD_ID } from '../test/board'
import { dependencyProposals, findRelations, isCardDone, unfinishedPrerequisites } from './dependencies'
import { timingQuestion } from './scenarios'

const relation = (state: ReturnType<typeof board>, dependentId: string, anchorId: string) =>
  findRelations(state, BOARD_ID).find((r) => r.dependentId === dependentId && r.anchorId === anchorId)

describe('findRelations', () => {
  it('reads offsets from descriptions', () => {
    expect(relation(board(), 'c-launch-partner', 'c-launch-legal')).toMatchObject({ kind: 'offset-after', days: 5, countWeekends: false })
    expect(relation(board(), 'c-launch-landing', 'c-launch-copy')).toMatchObject({ kind: 'offset-after', days: 2 })
  })

  it('reads "before" from comments and checklists', () => {
    expect(relation(board(), 'c-launch-analytics', 'c-launch-launch')).toMatchObject({ kind: 'before', sourceLabel: 'From Set up analytics’s comment' })
    expect(relation(board(), 'c-launch-release', 'c-launch-launch')).toMatchObject({ kind: 'before', sourceLabel: 'From Release checklist’s checklist' })
  })

  it('still finds a card after it is renamed', () => {
    const renamed = board({ type: 'card/update', cardId: 'c-launch-legal', patch: { title: 'Legal sign-off' } })
    expect(renamed.cards['c-launch-legal'].previousTitles).toEqual(['Legal Approval'])
    expect(relation(renamed, 'c-launch-partner', 'c-launch-legal')).toMatchObject({ kind: 'offset-after', days: 5 })
  })
})

describe('dependencyProposals', () => {
  it('asks Ana once when Legal Approval moves to Nov 6 (the demo scenario)', () => {
    const state = board()
    const proposals = dependencyProposals(state, state.cards['c-launch-legal'], '2026-11-06', timingQuestion)
    expect(proposals).toHaveLength(1)
    expect(proposals[0].connection.cardId).toBe('c-launch-partner')
    expect(proposals[0].text).toContain('Partner announcement may be ready Nov 13, one day after its current due date')
  })

  it('follows a later date through the chain, across lists', () => {
    const state = board()
    const proposals = dependencyProposals(state, state.cards['c-launch-copy'], '2026-11-02', timingQuestion)
    expect(proposals.map((p) => p.connection.cardId).sort()).toEqual(['c-launch-analytics', 'c-launch-landing', 'c-launch-launch'])
    const launch = proposals.find((p) => p.connection.cardId === 'c-launch-launch')!
    expect(launch.chain?.map((s) => [s.title, s.date])).toEqual([
      ['Final homepage copy', '2026-11-02'],
      ['Build landing page', '2026-11-04'],
      ['Set up analytics', '2026-11-05'],
      ['Website Launch', '2026-11-05'],
    ])
  })

  it('asks nothing when the new date still fits', () => {
    const state = board()
    expect(dependencyProposals(state, state.cards['c-launch-legal'], '2026-11-05', timingQuestion)).toHaveLength(0)
  })

  it('stops the chain at finished cards', () => {
    const state = board({ type: 'card/toggleComplete', cardId: 'c-launch-landing' })
    const ids = dependencyProposals(state, state.cards['c-launch-copy'], '2026-11-02', timingQuestion).map((p) => p.connection.cardId)
    expect(ids).toEqual([])
  })
})

describe('finishing early', () => {
  it('names the unfinished card a finished card waits for', () => {
    const state = board({ type: 'card/toggleComplete', cardId: 'c-launch-landing' })
    expect(isCardDone(state, state.cards['c-launch-landing'])).toBe(true)
    expect(unfinishedPrerequisites(state, state.cards['c-launch-landing']).map((p) => p.card.id)).toEqual(['c-launch-copy'])
  })

  it('names cards that must be done before it', () => {
    const state = board()
    const ids = unfinishedPrerequisites(state, state.cards['c-launch-launch']).map((p) => p.card.id)
    expect(ids).toEqual(expect.arrayContaining(['c-launch-analytics', 'c-launch-release']))
  })

  it('has nothing to report once the prerequisite is done', () => {
    const state = board({ type: 'card/toggleComplete', cardId: 'c-launch-copy' })
    expect(unfinishedPrerequisites(state, state.cards['c-launch-landing'])).toEqual([])
  })
})
