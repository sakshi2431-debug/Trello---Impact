export const ACCENTS = ['blue', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'magenta', 'purple'] as const

/** Stable accent for a string, so the same person or workspace always gets the same colour. */
export function accentFor(seed: string): (typeof ACCENTS)[number] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return ACCENTS[hash % ACCENTS.length]
}
