import type { ComponentType, ReactNode } from 'react'
import Heading from '@atlaskit/heading'
import type { NewCoreIconProps } from '@atlaskit/icon/types'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { token } from '@atlaskit/tokens'

/** Card-back section heading: icon, title and optional actions on the right. */
export function SectionHeading({ icon: Icon, title, actions }: { icon: ComponentType<NewCoreIconProps>; title: string; actions?: ReactNode }) {
  return (
    <Inline spread="space-between" alignBlock="center" space="space.100">
      <Inline space="space.150" alignBlock="center">
        <Icon label="" color={token('color.icon.subtle')} />
        <Heading size="xsmall" as="h3">
          {title}
        </Heading>
      </Inline>
      {actions}
    </Inline>
  )
}
