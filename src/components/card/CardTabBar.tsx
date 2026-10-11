import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import Button, { IconButton } from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import AddIcon from '@atlaskit/icon/core/add'
import AiSparkleIcon from '@atlaskit/icon/core/ai-sparkle'
import AutomationIcon from '@atlaskit/icon/core/automation'
import CommentIcon from '@atlaskit/icon/core/comment'
import InformationCircleIcon from '@atlaskit/icon/core/information-circle'
import PowerPlugIcon from '@atlaskit/icon/core/power-plug'
import { Box } from '@atlaskit/primitives/compiled/box'
import Popup from '@atlaskit/popup'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { layers } from '@atlaskit/theme/constants'
import { token } from '@atlaskit/tokens'
import Tooltip from '@atlaskit/tooltip'

const styles = cssMap({
  dock: {
    display: 'flex',
    justifyContent: 'center',
    paddingInline: token('space.100'),
    pointerEvents: 'none',
  },
  bar: {
    pointerEvents: 'auto',
    maxWidth: '100%',
    overflowX: 'auto',
    padding: token('space.075'),
    borderRadius: token('radius.xlarge'),
    backgroundColor: token('elevation.surface.overlay'),
    boxShadow: token('elevation.shadow.overlay'),
  },
  tab: { position: 'relative' },
  // Trello marks the open panel with a short underline under its tab.
  indicator: {
    position: 'absolute',
    insetBlockEnd: token('space.0'),
    insetInline: token('space.0'),
    marginInline: 'auto',
    width: '1rem',
    borderBlockStartWidth: token('border.width.selected'),
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: token('color.border.selected'),
    pointerEvents: 'none',
  },
  menu: { width: '18rem', maxWidth: '90vw', padding: token('space.150') },
  divider: {
    height: '1.5rem',
    borderInlineStartWidth: token('border.width'),
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: token('color.border'),
  },
})

interface Props {
  isCommentsOpen: boolean
  onToggleComments: () => void
  /** Impact shows this card's review, or how to start one. */
  impact: { isOpen: boolean; onToggle: () => void }
}

/** The floating tab bar Trello shows under an open card, with Impact added as a fourth tab. */
export function CardTabBar({ isCommentsOpen, onToggleComments, impact }: Props) {
  const [anchorRef, anchorTop] = useModalAnchor()
  return (
    // Positioned from the modal's measured bottom edge; the offset is a runtime value, not a design token.
    <div ref={anchorRef} style={{ position: 'fixed', top: anchorTop ?? 0, insetInline: 0, zIndex: 1, pointerEvents: 'none', visibility: anchorTop === undefined ? 'hidden' : 'visible' }}>
      <Box xcss={styles.dock}>
        <Box as="nav" aria-label="Card panels" xcss={styles.bar}>
          <Inline space="space.050" alignBlock="center">
            <MenuTab
              label="Power-ups"
              icon={PowerPlugIcon}
              heading="Power-Ups"
              about="Power-Ups add features like custom fields and integrations to cards on this board."
              addLabel="Add Power-Ups"
              addInfo="Power-Ups are added from the board menu. This prototype doesn’t include any."
            />
            <MenuTab
              label="Automations"
              icon={AutomationIcon}
              heading="Automation"
              about="Card buttons run a set of actions on this card in one click."
              addLabel="Add button"
              addInfo="Card buttons are built with Trello automation. This prototype doesn’t build them."
            />
            <Box xcss={styles.divider} />
            <Tab isSelected={isCommentsOpen}>
              <Button appearance="subtle" iconBefore={CommentIcon} isSelected={isCommentsOpen} aria-pressed={isCommentsOpen} onClick={onToggleComments}>
                Comments
              </Button>
            </Tab>
            <Tab isSelected={impact.isOpen}>
              <Button appearance="subtle" iconBefore={AiSparkleIcon} isSelected={impact.isOpen} aria-pressed={impact.isOpen} onClick={impact.onToggle}>
                Impact
              </Button>
            </Tab>
          </Inline>
        </Box>
      </Box>
    </div>
  )
}

const GAP_PX = 16
const VIEWPORT_MARGIN_PX = 8

/**
 * Trello floats this bar just under the open card, so it follows the card's height.
 * When the card fills the screen, the bar stays inside the viewport and overlaps its bottom edge.
 */
function useModalAnchor() {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState<number>()
  useLayoutEffect(() => {
    const element = ref.current
    const dialog = element?.closest('[role="dialog"]')
    if (!element || !dialog) return
    const update = () => {
      const barHeight = element.firstElementChild?.getBoundingClientRect().height ?? 0
      const target = Math.min(dialog.getBoundingClientRect().bottom + GAP_PX, window.innerHeight - barHeight - VIEWPORT_MARGIN_PX)
      // The modal positioner can become the containing block for fixed elements, so correct for its offset.
      const offset = element.getBoundingClientRect().top - (parseFloat(element.style.top) || 0)
      setValue(Math.round(target - offset))
    }
    update()
    // Follow the modal while its entrance animation moves it into place.
    const started = performance.now()
    let frame = requestAnimationFrame(function follow(now) {
      update()
      if (now - started < 1000) frame = requestAnimationFrame(follow)
    })
    const observer = new ResizeObserver(update)
    observer.observe(dialog)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])
  return [ref, value] as const
}

function Tab({ isSelected, children }: { isSelected: boolean; children: ReactNode }) {
  return (
    <Box xcss={styles.tab}>
      {children}
      {isSelected && <Box xcss={styles.indicator} />}
    </Box>
  )
}

/** Power-ups and Automations open a small menu above the bar, as in Trello. */
function MenuTab({ label, icon, heading, about, addLabel, addInfo }: { label: string; icon: typeof CommentIcon; heading: string; about: string; addLabel: string; addInfo: string }) {
  const [isOpen, setOpen] = useState(false)
  const [isAdding, setAdding] = useState(false)
  const close = () => {
    setOpen(false)
    setAdding(false)
  }
  return (
    <Popup
      isOpen={isOpen}
      onClose={close}
      placement="top-start"
      label={heading}
      role="dialog"
      shouldFitViewport
      // Stacks above the card modal, like the card's other popovers.
      zIndex={layers.modal()}
      content={() => (
        <Box xcss={styles.menu}>
          <Stack space="space.100">
            <Inline spread="space-between" alignBlock="center">
              <Text size="small" weight="semibold" color="color.text.subtle">
                {heading}
              </Text>
              <Tooltip content={about}>
                <IconButton appearance="subtle" spacing="compact" icon={InformationCircleIcon} label={`About ${heading}`} />
              </Tooltip>
            </Inline>
            {isAdding ? (
              <Stack space="space.100">
                <Text>{addInfo}</Text>
                <Box>
                  <Button onClick={() => setAdding(false)}>Back</Button>
                </Box>
              </Stack>
            ) : (
              <Box>
                <Button appearance="subtle" iconBefore={AddIcon} onClick={() => setAdding(true)}>
                  {addLabel}
                </Button>
              </Box>
            )}
          </Stack>
        </Box>
      )}
      trigger={(triggerProps) => (
        <Tab isSelected={isOpen}>
          <Button {...triggerProps} appearance="subtle" iconBefore={icon} isSelected={isOpen} onClick={() => (isOpen ? close() : setOpen(true))}>
            {label}
          </Button>
        </Tab>
      )}
    />
  )
}
