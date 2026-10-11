import Avatar, { AvatarContent, type AvatarPropTypes } from '@atlaskit/avatar'
import { cssMap, cx } from '@atlaskit/css'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { accentFor } from './accent'

const styles = cssMap({
  initials: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
})

/** Bold fills for initials avatars. */
const fillStyles = cssMap({
  green: { backgroundColor: token('color.background.accent.green.bolder') },
  yellow: { backgroundColor: token('color.background.accent.yellow.bolder') },
  orange: { backgroundColor: token('color.background.accent.orange.bolder') },
  red: { backgroundColor: token('color.background.accent.red.bolder') },
  purple: { backgroundColor: token('color.background.accent.purple.bolder') },
  blue: { backgroundColor: token('color.background.accent.blue.bolder') },
  teal: { backgroundColor: token('color.background.accent.teal.bolder') },
  lime: { backgroundColor: token('color.background.accent.lime.bolder') },
  magenta: { backgroundColor: token('color.background.accent.magenta.bolder') },
})

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

type Props = Omit<AvatarPropTypes, 'children' | 'src'> & { name: string }

/**
 * ADS Avatar showing initials, like Trello does for people without a profile photo.
 * Also usable as the `avatar` component of AvatarGroup.
 */
export function MemberAvatar({ name, appearance, ...rest }: Props) {
  const label = appearance === 'square' ? name.slice(0, 1).toUpperCase() : initialsOf(name)
  return (
    <Avatar name={name} appearance={appearance} {...rest}>
      <AvatarContent>
        <Box xcss={cx(styles.initials, fillStyles[accentFor(name)])}>
          <Text size="small" weight="semibold" color="color.text.inverse">
            {label}
          </Text>
        </Box>
      </AvatarContent>
    </Avatar>
  )
}
