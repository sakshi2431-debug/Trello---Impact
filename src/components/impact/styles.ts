import { cssMap } from '@atlaskit/css'
import { token } from '@atlaskit/tokens'

export const styles = cssMap({
  panel: { display: 'flex', flexDirection: 'column', gap: token('space.0') },
  header: { paddingBlockEnd: token('space.150') },
  section: {
    paddingBlock: token('space.200'),
    borderBlockStartWidth: token('border.width'),
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: token('color.border'),
  },
  // Aligns content with the checkbox labels of optional actions.
  indent: { paddingInlineStart: token('space.300') },
  evidence: {
    paddingInlineStart: token('space.150'),
    borderInlineStartWidth: token('border.width.selected'),
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: token('color.border'),
  },
  box: {
    padding: token('space.150'),
    borderRadius: token('radius.medium'),
    backgroundColor: token('elevation.surface'),
  },
  checking: {
    paddingBlock: token('space.400'),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: token('space.150'),
    textAlign: 'center',
  },
  textAction: {
    font: token('font.body'),
    color: token('color.link'),
    textDecorationLine: 'underline',
    backgroundColor: token('color.background.neutral.subtle'),
    padding: token('space.0'),
    transitionProperty: 'color',
    transitionDuration: token('motion.duration.xshort'),
    transitionTimingFunction: token('motion.easing.out.practical'),
    '&:hover': { color: token('color.link.pressed') },
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: token('motion.duration.instant') },
  },
  textActionSmall: { font: token('font.body.small') },
  footer: {
    position: 'sticky',
    insetBlockEnd: token('space.negative.200'),
    paddingBlockEnd: token('space.200'),
    backgroundColor: token('elevation.surface.sunken'),
  },
  headingRow: { display: 'flex', alignItems: 'center', gap: token('space.100') },
  previousDate: {
    paddingBlock: token('space.050'),
    paddingInline: token('space.100'),
    borderRadius: token('radius.small'),
    backgroundColor: token('color.background.neutral'),
  },
  wrap: { whiteSpace: 'pre-wrap' },
  // Status icon beside the row text; the icon's width plus the gap matches the checkbox indent.
  statusRow: { display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: token('space.100'), alignItems: 'start' },
  statusIcon: { paddingBlockStart: token('space.025') },
})
