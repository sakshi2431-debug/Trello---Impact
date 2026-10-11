import { describe, expect, it } from 'vitest'
import { createSeedState, STATE_VERSION } from '../data/seed'
import { migrateState } from './migrations'

describe('migrateState', () => {
  it('loads a current save', () => {
    const result = migrateState(JSON.parse(JSON.stringify(createSeedState())))
    expect(result.ok).toBe(true)
  })

  it('fills fields a partial save lacks and drops dangling card ids', () => {
    const seed = JSON.parse(JSON.stringify(createSeedState()))
    delete seed.cards['c-launch-legal'].attachments
    delete seed.cards['c-launch-legal'].comments
    seed.lists['b-launch-l0'].cardIds.push('c-missing')
    const result = migrateState(seed)
    if (!result.ok) throw new Error(result.reason)
    expect(result.state.cards['c-launch-legal'].attachments).toEqual([])
    expect(result.state.cards['c-launch-legal'].comments).toEqual([])
    expect(result.state.lists['b-launch-l0'].cardIds).not.toContain('c-missing')
  })

  it('refuses saves it cannot upgrade, so the caller can back them up', () => {
    expect(migrateState({ ...createSeedState(), version: STATE_VERSION - 1 })).toEqual({ ok: false, reason: `no upgrade from version ${STATE_VERSION - 1}` })
    expect(migrateState({ ...createSeedState(), version: STATE_VERSION + 1 }).ok).toBe(false)
    expect(migrateState('nonsense').ok).toBe(false)
    expect(migrateState({ version: STATE_VERSION }).ok).toBe(false)
  })
})
