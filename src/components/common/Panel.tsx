import type { ComponentType, ReactNode } from 'react'
import { cssMap, cx } from '@atlaskit/css'
import Heading from '@atlaskit/heading'
import type { NewCoreIconProps } from '@atlaskit/icon/types'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { token } from '@atlaskit/tokens'

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

/** Floating side panel used by Inbox and Planner on the board screen. */
export function Panel({
  icon: Icon,
  title,
  actions,
  children,
  isWide,
}: {
  icon: ComponentType<NewCoreIconProps>
  title: string
  actions?: ReactNode
  children: ReactNode
  isWide?: boolean
}) {
  return (
    <Box as="section" aria-label={title} xcss={cx(styles.panel, isWide && styles.wide)}>
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
