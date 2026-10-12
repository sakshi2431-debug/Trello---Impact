import { describe, expect, it } from 'vitest'
import { paths, resolveBoardRef } from './router'
import type { Board } from './types'

const board = (id: string, title: string) => ({ id, title }) as Board
const boards = (...list: Board[]) => Object.fromEntries(list.map((b) => [b.id, b]))

describe('board addresses', () => {
  it('uses the title as a readable slug and resolves it back', () => {
    const all = boards(board('b-launch', 'Marketing launch'), board('b-2', 'Q4 Roadmap & OKRs'))
    expect(paths.board(all['b-launch'], all)).toBe('#/b/marketing-launch')
    expect(paths.board(all['b-2'], all)).toBe('#/b/q4-roadmap-okrs')
    expect(resolveBoardRef('marketing-launch', all)).toBe('b-launch')
  })

  it('keeps older id links working', () => {
    const all = boards(board('b-launch', 'Marketing launch'))
    expect(resolveBoardRef('b-launch', all)).toBe('b-launch')
    expect(resolveBoardRef('nope', all)).toBeUndefined()
  })

  it('falls back to the id when two boards share a title, so each address opens one board', () => {
    const all = boards(board('b-1', 'Launch'), board('b-2', 'Launch'))
    expect(paths.board(all['b-1'], all)).toBe('#/b/b-1')
    expect(paths.board(all['b-2'], all)).toBe('#/b/b-2')
  })

  it('checks a just-created board against the existing ones', () => {
    const all = boards(board('b-1', 'Launch'))
    expect(paths.board({ id: 'b-new', title: 'Launch' }, all)).toBe('#/b/b-new')
    expect(paths.board({ id: 'b-new', title: 'Retro' }, all)).toBe('#/b/retro')
  })
})
