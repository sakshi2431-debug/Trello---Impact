import { forwardRef, useEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import Button from '@atlaskit/button/new'
import { cx } from '@atlaskit/css'
import { Label } from '@atlaskit/form'
import Heading from '@atlaskit/heading'
import AiSparkleIcon from '@atlaskit/icon/core/ai-sparkle'
import CheckCircleIcon from '@atlaskit/icon/core/check-circle'
import CheckCircleUncheckedIcon from '@atlaskit/icon/core/check-circle-unchecked'
import ClockIcon from '@atlaskit/icon/core/clock'
import CrossCircleIcon from '@atlaskit/icon/core/cross-circle'
import QuestionCircleIcon from '@atlaskit/icon/core/question-circle'
import StatusErrorIcon from '@atlaskit/icon/core/status-error'
import { FadeIn, useIsReducedMotion } from '@atlaskit/motion'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Spinner from '@atlaskit/spinner'
import Textarea from '@atlaskit/textarea'
import { token } from '@atlaskit/tokens'
import { joinNames } from '../../impact/format'
import type { ReviewScope } from '../../impact/types'
import { useDisclosure } from './focus'
import type { RowIcon } from './status'
import { styles } from './styles'

/** Underlined text action, matching the link-style actions in the Impact designs. */
export const TextAction = forwardRef<HTMLButtonElement, { children: ReactNode; onClick: () => void; isSmall?: boolean; label?: string }>(function TextAction(
  { children, onClick, isSmall, label },
  ref,
) {
  return (
    <Pressable ref={ref} xcss={cx(styles.textAction, isSmall && styles.textActionSmall)} onClick={onClick} aria-label={label}>
      {children}
    </Pressable>
  )
})

/**
 * Expanded detail (Why?, calculation, scope) fades in without moving the layout (motion audit C4), and scrolls into view
 * only as far as needed, clear of the pinned summary. FadeIn is instant when the person prefers reduced motion.
 */
export function Reveal({ children }: { children: ReactNode }) {
  const isReducedMotion = useIsReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const footer = document.querySelector<HTMLElement>('[data-testid="impact-footer"]')
    element.style.scrollMarginBlockEnd = `${footer?.offsetHeight ?? 0}px`
    element.scrollIntoView({ block: 'nearest', behavior: isReducedMotion ? 'auto' : 'smooth' })
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <FadeIn duration="small">
      {(props) => (
        <div {...props}>
          <div ref={ref}>{children}</div>
        </div>
      )}
    </FadeIn>
  )
}

export function PanelHeading({ title, children, headingRef }: { title: string; children?: ReactNode; headingRef?: Ref<HTMLDivElement> }) {
  return (
    <Box xcss={styles.header}>
      <Stack space="space.050">
        {/* Focus target when the panel changes stage. */}
        <Box ref={headingRef} tabIndex={-1} xcss={styles.headingRow}>
          <AiSparkleIcon label="" color={token('color.icon')} />
          <Heading size="medium" as="h2">
            {title}
          </Heading>
        </Box>
        {children}
      </Stack>
    </Box>
  )
}

/** "Review impact", what may need attention, and View scope: the same header in every review. */
export function ReviewHeading({
  headingRef,
  attention,
  scope,
  showsBoard = true,
}: {
  headingRef: Ref<HTMLDivElement>
  attention: string
  scope: ReviewScope
  showsBoard?: boolean
}) {
  const [isScopeOpen, setScopeOpen] = useDisclosure()
  return (
    <PanelHeading title="Review impact" headingRef={headingRef}>
      {isScopeOpen ? (
        <>
          <Text size="small" color="color.text.subtle">
            {attention}
          </Text>
          <Reveal>
            <Box xcss={styles.box}>
              <Stack space="space.100">
                <Text size="small" weight="semibold">
                  What was checked
                </Text>
                <Text size="small">{scope.checked}</Text>
                <Text size="small">{scope.notChecked}</Text>
                <Box>
                  <TextAction isSmall onClick={() => setScopeOpen(false)}>
                    Hide scope
                  </TextAction>
                </Box>
              </Stack>
            </Box>
          </Reveal>
        </>
      ) : (
        <Text size="small" color="color.text.subtle">
          {`${attention} · ${showsBoard ? `Checked ${scope.boardTitle} board · ` : ''}`}
          <TextAction isSmall onClick={() => setScopeOpen(true)}>
            View scope
          </TextAction>
        </Text>
      )}
    </PanelHeading>
  )
}

/** Behind Why?: the quoted source, labelled as such, separate from Impact's interpretation (spec rule 7). */
export function EvidenceDetails({
  sourceLabel,
  quote,
  interpretation,
  onOpenSource,
  onHide,
  children,
}: {
  sourceLabel: string
  quote: string
  interpretation: string
  onOpenSource?: () => void
  onHide: () => void
  children?: ReactNode
}) {
  return (
    <Reveal>
      <Box xcss={styles.evidence}>
        <Stack space="space.075">
          <Text weight="semibold">{sourceLabel}</Text>
          <Text>{`“${quote}”`}</Text>
          <Text weight="semibold">Why it may matter</Text>
          <Text>{interpretation}</Text>
          {children}
          <Inline space="space.200">
            {onOpenSource && <TextAction onClick={onOpenSource}>Open source</TextAction>}
            <TextAction onClick={onHide}>Hide explanation</TextAction>
          </Inline>
        </Stack>
      </Box>
    </Reveal>
  )
}

/** Editing a proposed text in place. Save changes is offered only for a real, non-empty change. */
export function InlineTextEditor({
  id,
  label,
  initial,
  before,
  after,
  onSave,
  onCancel,
}: {
  id: string
  label: string
  initial: string
  before?: ReactNode
  after?: ReactNode
  onSave: (text: string) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  return (
    <Stack space="space.100">
      {before}
      <Stack space="space.050">
        <Label htmlFor={id}>{label}</Label>
        <Textarea id={id} autoFocus minimumRows={3} value={draft} onChange={(e) => setDraft(e.currentTarget.value)} />
      </Stack>
      {after}
      <Text size="small" color="color.text.subtle">
        Nothing changes in Trello until you select Apply.
      </Text>
      <Inline space="space.150" alignBlock="center">
        <Button isDisabled={draft.trim() === initial || !draft.trim()} onClick={() => onSave(draft.trim())}>
          Save changes
        </Button>
        <TextAction onClick={onCancel}>Cancel</TextAction>
      </Inline>
    </Stack>
  )
}

/** Unticked actions, named, with how to bring them back (spec rule 5). */
export function LeftOutNote({ titles }: { titles: string[] }) {
  if (titles.length === 0) return null
  return (
    <Text size="small" color="color.text.subtle">
      {titles.length === 1 ? `${titles[0]} is left out. Tick it to include it again.` : `${joinNames(titles)} are left out. Tick them to include them again.`}
    </Text>
  )
}

/** One applying or result row: the action and exactly one status. */
export function ActionRow({ name, status, icon, children }: { name: string; status: ReactNode; icon: RowIcon; children?: ReactNode }) {
  return (
    <Box xcss={styles.section}>
      <Box xcss={styles.statusRow}>
        {/* Keyed by status, so each change fades in (motion audit C3); FadeIn is instant with reduced motion. */}
        <FadeIn key={icon} duration="small">
          {(props) => (
            <div {...props}>
              <StatusIcon icon={icon} />
            </div>
          )}
        </FadeIn>
        <Stack space="space.075">
          <Text weight="semibold">{name}</Text>
          <Box aria-live="polite">
            <FadeIn key={icon} duration="small">
              {(props) => <div {...props}>{status}</div>}
            </FadeIn>
          </Box>
          {children}
        </Stack>
      </Box>
    </Box>
  )
}

/**
 * The status icons from the Figma rows. ADS has no minus-in-circle icon, so Not run and Not selected use the empty
 * circle. Icons are decorative; the status text beside them says the same thing.
 */
export function StatusIcon({ icon }: { icon: RowIcon }) {
  const props = { label: '', color: token('color.icon') }
  // The running step spins; with reduced motion it keeps the static clock (motion audit C1).
  const isReducedMotion = useIsReducedMotion()
  return (
    <Box xcss={styles.statusIcon}>
      {icon === 'applied' && <CheckCircleIcon {...props} />}
      {icon === 'applying' && (isReducedMotion ? <ClockIcon {...props} /> : <Spinner size="small" label="" />)}
      {icon === 'waiting' && <ClockIcon {...props} />}
      {icon === 'failed' && <StatusErrorIcon {...props} />}
      {icon === 'not-run' && <CheckCircleUncheckedIcon {...props} />}
      {icon === 'unknown' && <QuestionCircleIcon {...props} />}
      {icon === 'declined' && <CrossCircleIcon {...props} />}
    </Box>
  )
}
