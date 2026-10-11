import { IconButton } from '@atlaskit/button/new'
import StarStarredIcon from '@atlaskit/icon/core/star-starred'
import StarUnstarredIcon from '@atlaskit/icon/core/star-unstarred'
import type { NewCoreIconProps } from '@atlaskit/icon/types'
import { token } from '@atlaskit/tokens'
import { useDispatch } from '../../state/store'
import type { Board } from '../../types'

function StarredIcon(props: NewCoreIconProps) {
  return <StarStarredIcon {...props} color={token('color.icon.accent.yellow')} />
}

export function StarButton({ board, spacing = 'default' }: { board: Board; spacing?: 'default' | 'compact' }) {
  const dispatch = useDispatch()
  return (
    <IconButton
      appearance="subtle"
      spacing={spacing}
      icon={board.isStarred ? StarredIcon : StarUnstarredIcon}
      label={board.isStarred ? `Unstar ${board.title}` : `Star ${board.title}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch({ type: 'board/toggleStar', boardId: board.id })
      }}
    />
  )
}
