import type { ComponentType, ReactNode } from 'react'
import { cssMap, cx } from '@atlaskit/css'
import Heading from '@atlaskit/heading'
import type { NewCoreIconProps } from '@atlaskit/icon/types'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { token } from '@atlaskit/tokens'
import type { AccentColor } from '../../types'

const styles = cssMap({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    width: '18rem',
    height: '100%',
    overflow: 'hidden',
    borderRadius: token('radius.xlarge'),
    borderWidth: token('border.width'),
    borderStyle: 'solid',
    borderColor: token('color.border'),
    backgroundColor: token('elevation.surface'),
  },
  wide: { width: '22rem' },
  header: {
    paddingBlock: token('space.100'),
    paddingInlineStart: token('space.200'),
    paddingInlineEnd: token('space.100'),
  },
  body: { flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
})

/**
 * The board's wallpaper, so a panel beside the board sits on the same colour. Same wash as the board panel in
 * BoardPage; cssMap only emits its CSS in the file that defines it, so the map is repeated here.
 */
const wallpaperStyles = cssMap({
  green: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.green.subtlest')}, ${token('color.background.accent.green.subtler')})` },
  yellow: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.yellow.subtlest')}, ${token('color.background.accent.yellow.subtler')})` },
  orange: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.orange.subtlest')}, ${token('color.background.accent.orange.subtler')})` },
  red: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.red.subtlest')}, ${token('color.background.accent.red.subtler')})` },
  purple: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.purple.subtlest')}, ${token('color.background.accent.purple.subtler')})` },
  blue: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.blue.subtlest')}, ${token('color.background.accent.blue.subtler')})` },
  teal: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.teal.subtlest')}, ${token('color.background.accent.teal.subtler')})` },
  lime: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.lime.subtlest')}, ${token('color.background.accent.lime.subtler')})` },
  magenta: { backgroundImage: `linear-gradient(160deg, ${token('color.background.accent.magenta.subtlest')}, ${token('color.background.accent.magenta.subtler')})` },
})

/** Floating side panel used by Inbox and Planner on the board screen. */
export function Panel({
  icon: Icon,
  title,
  actions,
  children,
  isWide,
  accent,
}: {
  icon: ComponentType<NewCoreIconProps>
  title: string
  actions?: ReactNode
  children: ReactNode
  isWide?: boolean
  /** Board colour to match; without it the panel uses the plain surface. */
  accent?: AccentColor
}) {
  return (
    <Box as="section" aria-label={title} xcss={cx(styles.panel, isWide && styles.wide, accent && wallpaperStyles[accent])}>
      <Box xcss={styles.header}>
        <Inline spread="space-between" alignBlock="center">
          <Inline space="space.100" alignBlock="center">
            <Icon label="" color={token('color.icon')} />
            <Heading size="small" as="h2">
              {title}
            </Heading>
          </Inline>
          {actions && (
            <Inline space="space.025" alignBlock="center">
              {actions}
            </Inline>
          )}
        </Inline>
      </Box>
      <Box xcss={styles.body}>{children}</Box>
    </Box>
  )
}
