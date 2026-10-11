import type { ReactNode } from 'react'
import { cssMap, cx } from '@atlaskit/css'
import CheckMarkIcon from '@atlaskit/icon/core/check-mark'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { token } from '@atlaskit/tokens'
import type { AccentColor } from '../../types'
import { colorNames } from './LabelChip'

const styles = cssMap({
  swatch: {
    display: 'block',
    flexShrink: 0,
    width: '1.5rem',
    height: '1.25rem',
    borderRadius: token('radius.small'),
    borderWidth: token('border.width'),
    borderStyle: 'solid',
    borderColor: token('color.border'),
  },
  thumbnail: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  option: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2rem',
    borderRadius: token('radius.small'),
    borderWidth: token('border.width'),
    borderStyle: 'solid',
    borderColor: token('color.border'),
    '&:hover': { borderColor: token('color.border.bold') },
  },
  optionSelected: {
    borderWidth: token('border.width.selected'),
    borderColor: token('color.border.selected'),
    '&:hover': { borderColor: token('color.border.selected') },
  },
})

/** Light board colours: the light theme keeps board colour to a pale accent wash. */
const colorStyles = cssMap({
  green: { backgroundColor: token('color.background.accent.green.subtler') },
  yellow: { backgroundColor: token('color.background.accent.yellow.subtler') },
  orange: { backgroundColor: token('color.background.accent.orange.subtler') },
  red: { backgroundColor: token('color.background.accent.red.subtler') },
  purple: { backgroundColor: token('color.background.accent.purple.subtler') },
  blue: { backgroundColor: token('color.background.accent.blue.subtler') },
  teal: { backgroundColor: token('color.background.accent.teal.subtler') },
  lime: { backgroundColor: token('color.background.accent.lime.subtler') },
  magenta: { backgroundColor: token('color.background.accent.magenta.subtler') },
})

/** Small board colour tile used in menus and the sidebar, in place of Trello's background thumbnail. */
export function BoardSwatch({ accent }: { accent: AccentColor }) {
  return <Box as="span" xcss={cx(styles.swatch, colorStyles[accent])} />
}

/** Board colour that fills its container, for board tiles and previews. */
export function BoardThumbnail({ accent, children }: { accent: AccentColor; children?: ReactNode }) {
  return <Box xcss={cx(styles.thumbnail, colorStyles[accent])}>{children}</Box>
}

/** Background option in the Create board dialog. */
export function BoardColorOption({ accent, isSelected, onSelect }: { accent: AccentColor; isSelected: boolean; onSelect: () => void }) {
  return (
    <Pressable
      role="radio"
      aria-checked={isSelected}
      aria-label={colorNames[accent]}
      xcss={cx(styles.option, colorStyles[accent], isSelected && styles.optionSelected)}
      onClick={onSelect}
    >
      {isSelected && <CheckMarkIcon label="" size="small" />}
    </Pressable>
  )
}
