import { cssMap, cx } from '@atlaskit/css'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import type { AccentColor, Label } from '../../types'

const styles = cssMap({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    minWidth: '2.5rem',
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: token('radius.small'),
    paddingInline: token('space.100'),
  },
  compact: { height: '1rem' },
  // New Trello shows labels as short colour bars on card fronts.
  bar: { height: '0.5rem', minWidth: '2.5rem', borderRadius: token('radius.full'), paddingInline: token('space.0') },
  regular: { height: '2rem', paddingInline: token('space.150'), minWidth: '3rem' },
  swatch: {
    width: '100%',
    height: '2rem',
    borderRadius: token('radius.small'),
    borderWidth: token('border.width.selected'),
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  swatchSelected: { borderColor: token('color.border.selected') },
})

/**
 * Trello's label palette maps onto the ADS accent "subtle" backgrounds, so labels read the same
 * as in the product while staying themeable.
 */
const colorStyles = cssMap({
  green: { backgroundColor: token('color.background.accent.green.subtle'), '&:hover': { backgroundColor: token('color.background.accent.green.subtle.hovered') } },
  yellow: { backgroundColor: token('color.background.accent.yellow.subtle'), '&:hover': { backgroundColor: token('color.background.accent.yellow.subtle.hovered') } },
  orange: { backgroundColor: token('color.background.accent.orange.subtle'), '&:hover': { backgroundColor: token('color.background.accent.orange.subtle.hovered') } },
  red: { backgroundColor: token('color.background.accent.red.subtle'), '&:hover': { backgroundColor: token('color.background.accent.red.subtle.hovered') } },
  purple: { backgroundColor: token('color.background.accent.purple.subtle'), '&:hover': { backgroundColor: token('color.background.accent.purple.subtle.hovered') } },
  blue: { backgroundColor: token('color.background.accent.blue.subtle'), '&:hover': { backgroundColor: token('color.background.accent.blue.subtle.hovered') } },
  teal: { backgroundColor: token('color.background.accent.teal.subtle'), '&:hover': { backgroundColor: token('color.background.accent.teal.subtle.hovered') } },
  lime: { backgroundColor: token('color.background.accent.lime.subtle'), '&:hover': { backgroundColor: token('color.background.accent.lime.subtle.hovered') } },
  magenta: { backgroundColor: token('color.background.accent.magenta.subtle'), '&:hover': { backgroundColor: token('color.background.accent.magenta.subtle.hovered') } },
})

export const colorNames: Record<AccentColor, string> = {
  green: 'Green',
  yellow: 'Yellow',
  orange: 'Orange',
  red: 'Red',
  purple: 'Purple',
  blue: 'Blue',
  teal: 'Teal',
  lime: 'Lime',
  magenta: 'Pink',
}

function labelAccessibleName(label: Label) {
  return label.name ? `${label.name} (${colorNames[label.color]})` : `${colorNames[label.color]} label`
}

/**
 * Trello card label. Bars (or compact chips, when label names are switched on) sit at the top of
 * board cards; regular chips are used on the card back and in the labels picker.
 */
export function LabelChip({ label, size = 'compact' }: { label: Label; size?: 'bar' | 'compact' | 'regular' }) {
  return (
    <Box
      as="span"
      xcss={cx(styles.base, styles[size], colorStyles[label.color])}
      aria-label={labelAccessibleName(label)}
      role="img"
    >
      {size !== 'bar' && (
        <Text size={size === 'compact' ? 'small' : 'medium'} weight="medium" maxLines={1}>
          {label.name}
        </Text>
      )}
    </Box>
  )
}

/** Colour option in the "Create a new label" picker. */
export function LabelColorOption({ color, isSelected, onSelect }: { color: AccentColor; isSelected: boolean; onSelect: () => void }) {
  return (
    <Pressable
      role="radio"
      aria-checked={isSelected}
      aria-label={colorNames[color]}
      xcss={cx(styles.swatch, colorStyles[color], isSelected && styles.swatchSelected)}
      onClick={onSelect}
    />
  )
}
