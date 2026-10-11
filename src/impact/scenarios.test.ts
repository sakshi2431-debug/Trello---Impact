import { describe, expect, it } from 'vitest'
import { reducer } from '../state/reducer'
import { board } from '../test/board'
import type { AppState } from '../types'
import { addedSentences, analyzeDescriptionEdit } from './scenarios'

const REVIEW_ID = 'c-test-a11y'
const SENTENCE = 'Accessibility review must now include the mobile signup flow.'

/** The end of Scenario 1: Accessibility review exists; optionally Alex is a member and Morgan has linked it. */
function scenario2({ linked, member }: { linked: boolean; member: boolean }): AppState {
  let state = board(
    { type: 'card/create', id: REVIEW_ID, listId: 'b-launch-l0', title: 'Accessibility review' },
    { type: 'card/update', cardId: REVIEW_ID, patch: { description: 'Review keyboard navigation and screen reader support before Website Launch.' } },
  )
  if (member) state = reducer(state, { type: 'card/toggleMember', cardId: REVIEW_ID, memberId: state.currentUserId })
  if (linked) {
    const alex = state.currentUserId
    state = reducer({ ...state, currentUserId: 'm-morgan' }, { type: 'card/addAttachment', cardId: 'c-launch-launch', attachment: { name: 'Accessibility review', kind: 'card', cardId: REVIEW_ID, sizeBytes: 0 } })
    state = { ...state, currentUserId: alex }
  }
  return state
}

function edit(state: AppState) {
  const launch = state.cards['c-launch-launch']
  return analyzeDescriptionEdit(state, launch, { from: launch.description, to: `${launch.description}\n\n${SENTENCE}` })
}

describe('addedSentences', () => {
  it('returns only new sentences', () => {
    expect(addedSentences({ from: 'One. Two.', to: 'One. Two. Three is new.' })).toEqual(['Three is new.'])
  })
})

describe('Scenario 2: an edited requirement', () => {
  it('proposes editing Accessibility review when Morgan linked it and Alex is a member', () => {
    const review = edit(scenario2({ linked: true, member: true }))
    expect(review.finding).toMatchObject({ canEdit: true, text: 'Accessibility review may not cover the mobile signup flow.' })
    expect(review.proposals).toHaveLength(1)
    expect(review.proposals[0]).toMatchObject({
      update: { before: 'Review keyboard navigation and screen reader support before Website Launch.' },
      text: 'Review keyboard navigation and screen reader support before Website Launch. Also cover the mobile signup flow.',
    })
  })

  it('only asks Morgan when the cards are not linked (rule 4)', () => {
    const review = edit(scenario2({ linked: false, member: true }))
    expect(review.finding?.canEdit).toBe(false)
    expect(review.finding?.basis).toBe('Basis: both mention accessibility · Not confirmed by an owner')
    expect(review.proposals).toHaveLength(1)
    expect(review.proposals[0].update).toBeUndefined()
    expect(review.proposals[0]).toMatchObject({ linkCardId: REVIEW_ID, connection: { cardId: 'c-launch-launch' } })
    expect(review.proposals[0].text).toBe('@Morgan, the launch requirement now includes the mobile signup flow. Should Accessibility review cover it?')
  })

  it('only asks when linked but Alex is not a member of the other card', () => {
    const review = edit(scenario2({ linked: true, member: false }))
    expect(review.finding?.canEdit).toBe(false)
    expect(review.proposals[0].update).toBeUndefined()
  })

  it('finds nothing when the new sentence names no card', () => {
    const state = scenario2({ linked: true, member: true })
    const launch = state.cards['c-launch-launch']
    expect(analyzeDescriptionEdit(state, launch, { from: launch.description, to: `${launch.description} Use the new logo.` }).proposals).toEqual([])
  })
})
