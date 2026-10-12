import { useState } from 'react'
import { cssMap, cx } from '@atlaskit/css'
import { Anchor } from '@atlaskit/primitives/compiled/anchor'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { paths } from '../../router'
import { useAppState } from '../../state/store'
import type { Board } from '../../types'
import { BoardThumbnail } from '../common/BoardSwatch'
import { StarButton } from '../common/StarButton'

const TILE_HEIGHT = '6rem'

const styles = cssMap({
  tile: {
    position: 'relative',
    borderRadius: token('radius.large'),
    backgroundColor: token('elevation.surface.raised'),
    boxShadow: token('elevation.shadow.raised'),
    overflow: 'hidden',
    '&:hover': { boxShadow: token('elevation.shadow.overlay') },
  },
  link: {
    display: 'flex',
    flexDirection: 'column',
    height: TILE_HEIGHT,
    textDecoration: 'none',
    color: token('color.text'),
    '&:hover': { textDecoration: 'none', color: token('color.text') },
  },
  thumb: { flexGrow: 1 },
  footer: {
    paddingBlock: token('space.075'),
    paddingInline: token('space.100'),
    paddingInlineEnd: token('space.400'),
    backgroundColor: token('elevation.surface.raised'),
  },
  star: {
    position: 'absolute',
    insetInlineEnd: token('space.050'),
    insetBlockEnd: token('space.025'),
  },
  starHidden: {
    opacity: 0,
  },
  createTile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: TILE_HEIGHT,
    borderRadius: token('radius.large'),
    backgroundColor: token('color.background.neutral'),
    '&:hover': { backgroundColor: token('color.background.neutral.hovered') },
    '&:active': { backgroundColor: token('color.background.neutral.pressed') },
  },
})

export function BoardTile({ board }: { board: Board }) {
  const { boards } = useAppState()
  // Trello only shows the star on hover or focus, unless the board is starred.
  const [isActive, setActive] = useState(false)
  return (
    <Box
      xcss={styles.tile}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <Anchor href={paths.board(board, boards)} xcss={styles.link}>
        <Box xcss={styles.thumb}>
          <BoardThumbnail accent={board.accent} />
        </Box>
        <Box xcss={styles.footer}>
          <Text weight="semibold" maxLines={1}>
            {board.title}
          </Text>
        </Box>
      </Anchor>
      <Box xcss={cx(styles.star, !board.isStarred && !isActive && styles.starHidden)}>
        <StarButton board={board} spacing="compact" />
      </Box>
    </Box>
  )
}

export function CreateBoardTile({ onClick }: { onClick: () => void }) {
  return (
    <Pressable xcss={styles.createTile} onClick={onClick}>
      <Text>Create new board</Text>
    </Pressable>
  )
}
