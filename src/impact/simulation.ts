import type { ImpactSimulation } from './types'

/** Simulated Trello latency for each applied action (spec IMPLEMENTATION: a short delay per action). */
export const STEP_MS = 600

/** Simulated time to check the board before a review appears. */
export const CHECK_MS = 1200

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** The hidden debug switch (spec IMPLEMENTATION): ?impact=creation-failed or ?impact=outcome-unknown. */
export function simulation(): ImpactSimulation {
  const value = new URLSearchParams(window.location.search).get('impact')
  return value === 'creation-failed' || value === 'outcome-unknown' ? value : 'success'
}
