import { useMemo, useState } from 'react'
import { cssMap } from '@atlaskit/css'
import SearchIcon from '@atlaskit/icon/core/search'
import { ButtonItem, MenuGroup, Section } from '@atlaskit/menu'
import { Search } from '@atlaskit/navigation-system/top-nav-items'
import Popup from '@atlaskit/popup'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Text } from '@atlaskit/primitives/compiled/text'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { navigate, paths } from '../../router'
import { useAppState } from '../../state/store'
import { BoardSwatch } from '../common/BoardSwatch'

const styles = cssMap({
  panel: { width: '35rem', maxWidth: '90vw', paddingBlock: token('space.150') },
  field: { paddingInline: token('space.150'), paddingBlockEnd: token('space.100') },
  empty: { paddingInline: token('space.200'), paddingBlock: token('space.150') },
  iconPadding: { display: 'flex', paddingInlineStart: token('space.100') },
  // TopNavMiddle aligns items to the end; the trigger wrapper must fill its column like Search does.
  trigger: { width: '100%' },
})

/** Top-nav search: searches card and board titles across the workspace. */
export function SearchMenu() {
  const [isOpen, setOpen] = useState(false)
  return (
    <Popup
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      placement="bottom"
      label="Search Trello"
      role="dialog"
      content={() => <SearchPanel onDone={() => setOpen(false)} />}
      trigger={(triggerProps) => (
        <Box ref={triggerProps.ref} xcss={styles.trigger}>
          <Search label="Search" aria-haspopup="dialog" onClick={() => setOpen((open) => !open)} />
        </Box>
      )}
    />
  )
}

function SearchPanel({ onDone }: { onDone: () => void }) {
  const { cards, boards, lists, boardOrder } = useAppState()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!q) return { cards: [], boards: boardOrder.map((id) => boards[id]).filter((b) => b.lastViewedAt).sort((a, b) => (b.lastViewedAt ?? 0) - (a.lastViewedAt ?? 0)).slice(0, 5) }
    return {
      cards: Object.values(cards)
        .filter((c) => !c.isArchived && !c.isDraft && boards[c.boardId] && !boards[c.boardId].isClosed && !lists[c.listId]?.isArchived && c.title.toLowerCase().includes(q))
        .slice(0, 8),
      boards: boardOrder.map((id) => boards[id]).filter((b) => !b.isClosed && b.title.toLowerCase().includes(q)),
    }
  }, [q, cards, boards, lists, boardOrder])

  const go = (hash: string) => {
    onDone()
    navigate(hash)
  }

  return (
    <Box xcss={styles.panel}>
      <Box xcss={styles.field}>
        <Textfield
          autoFocus
          aria-label="Search cards and boards"
          placeholder="Search cards and boards"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          elemBeforeInput={
            <Box xcss={styles.iconPadding}>
              <SearchIcon label="" color={token('color.icon.subtle')} />
            </Box>
          }
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (results.cards[0]) go(paths.card(results.cards[0].id))
            else if (results.boards[0]) go(paths.board(results.boards[0].id))
          }}
        />
      </Box>
      <MenuGroup maxHeight="60vh" menuLabel="Search results">
        {results.cards.length > 0 && (
          <Section title="Cards">
            {results.cards.map((card) => (
              <ButtonItem
                key={card.id}
                iconBefore={<BoardSwatch accent={boards[card.boardId].accent} />}
                description={`${boards[card.boardId].title}: ${lists[card.listId].title}`}
                onClick={() => go(paths.card(card.id))}
              >
                {card.title}
              </ButtonItem>
            ))}
          </Section>
        )}
        {results.boards.length > 0 && (
          <Section title={q ? 'Boards' : 'Recent boards'} hasSeparator={results.cards.length > 0}>
            {results.boards.map((board) => (
              <ButtonItem key={board.id} iconBefore={<BoardSwatch accent={board.accent} />} onClick={() => go(paths.board(board.id))}>
                {board.title}
              </ButtonItem>
            ))}
          </Section>
        )}
      </MenuGroup>
      {q && results.cards.length === 0 && results.boards.length === 0 && (
        <Box xcss={styles.empty}>
          <Text color="color.text.subtle">We couldn’t find any cards or boards matching “{query.trim()}”.</Text>
        </Box>
      )}
    </Box>
  )
}
