/** Small seeded PRNG (mulberry32) so mock data is identical on every fresh load. */
export function createRandom(seed: number) {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    chance: (probability: number) => next() < probability,
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    sample: <T,>(items: readonly T[], count: number): T[] => {
      const pool = [...items]
      const result: T[] = []
      while (result.length < count && pool.length > 0) {
        result.push(pool.splice(Math.floor(next() * pool.length), 1)[0])
      }
      return result
    },
  }
}

let counter = 0
export function createId(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
