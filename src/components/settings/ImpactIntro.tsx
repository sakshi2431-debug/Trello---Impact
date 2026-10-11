import { useState } from 'react'
import Button, { IconButton } from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import Heading from '@atlaskit/heading'
import AiSparkleIcon from '@atlaskit/icon/core/ai-sparkle'
import ArrowRightIcon from '@atlaskit/icon/core/arrow-right'
import CloseIcon from '@atlaskit/icon/core/close'
import Lozenge from '@atlaskit/lozenge'
import Modal, { ModalTransition } from '@atlaskit/modal-dialog'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'

const styles = cssMap({
  header: { position: 'relative', paddingBlockStart: token('space.300'), paddingInline: token('space.300') },
  close: { position: 'absolute', insetBlockStart: token('space.200'), insetInlineEnd: token('space.200') },
  intro: { paddingInline: token('space.400'), paddingBlock: token('space.300'), textAlign: 'center' },
  illustration: {
    display: 'flex',
    justifyContent: 'center',
    paddingBlockStart: token('space.400'),
    paddingInline: token('space.300'),
    backgroundImage: `linear-gradient(180deg, ${token('elevation.surface')}, ${token('color.background.accent.purple.subtler')})`,
  },
  window: {
    width: '100%',
    maxWidth: '24rem',
    padding: token('space.200'),
    borderStartStartRadius: token('radius.large'),
    borderStartEndRadius: token('radius.large'),
    backgroundColor: token('elevation.surface.raised'),
    boxShadow: token('elevation.shadow.overlay'),
  },
  card: {
    padding: token('space.100'),
    borderRadius: token('radius.medium'),
    backgroundColor: token('elevation.surface.raised'),
    boxShadow: token('elevation.shadow.raised'),
  },
  affected: {
    padding: token('space.100'),
    borderRadius: token('radius.medium'),
    borderWidth: token('border.width'),
    borderStyle: 'dashed',
    borderColor: token('color.border.warning'),
    backgroundColor: token('color.background.warning'),
  },
})

/** Opens the Trello Impact introduction, laid out like Trello's AI feature intros (e.g. Schedule Focus Time). */
export function ImpactIntroButton() {
  const [isOpen, setOpen] = useState(false)
  return (
    <>
      <Button iconBefore={AiSparkleIcon} onClick={() => setOpen(true)}>
        What is Trello Impact?
      </Button>
      <ModalTransition>{isOpen && <ImpactIntroModal onClose={() => setOpen(false)} />}</ModalTransition>
    </>
  )
}

function ImpactIntroModal({ onClose }: { onClose: () => void }) {
  const { boards, boardOrder } = useAppState()
  const dispatch = useDispatch()
  const target = boardOrder.map((id) => boards[id]).find((b) => !b.isClosed)
  return (
    <Modal onClose={onClose} width="large" label="Trello Impact">
      <Box xcss={styles.header}>
        <Inline space="space.100" alignBlock="center" alignInline="center">
          <AiSparkleIcon label="" color={token('color.icon.discovery')} />
          <Text weight="medium">Trello Impact</Text>
        </Inline>
        <Box xcss={styles.close}>
          <IconButton appearance="subtle" icon={CloseIcon} label="Close" onClick={onClose} />
        </Box>
      </Box>
      <Box xcss={styles.intro}>
        <Stack space="space.300" alignInline="center">
          <Heading size="large" as="h2">
            See what a change will disrupt before you make it
          </Heading>
          <Button
            appearance="primary"
            onClick={() => {
              dispatch({ type: 'preferences/update', patch: { isImpactEnabled: true } })
              onClose()
              if (target) navigate(paths.board(target.id))
            }}
          >
            Try it on a board
          </Button>
        </Stack>
      </Box>
      <Box xcss={styles.illustration} aria-hidden>
        <Box xcss={styles.window}>
          <Stack space="space.150">
            <Box xcss={styles.card}>
              <Stack space="space.075">
                <Text weight="medium">Finalize dashboard wireframes</Text>
                <Inline space="space.075" alignBlock="center">
                  <Lozenge>Oct 18</Lozenge>
                  <ArrowRightIcon label="" size="small" color={token('color.icon.subtle')} />
                  <Lozenge appearance="moved">Oct 22</Lozenge>
                </Inline>
              </Stack>
            </Box>
            <Text size="small" weight="semibold" color="color.text.subtle">
              2 cards may be affected
            </Text>
            <Box xcss={styles.affected}>
              <Stack space="space.050">
                <Text weight="medium">Review sprint deliverables</Text>
                <Text size="small" color="color.text.subtle">
                  Due Oct 20 and waits on the wireframes
                </Text>
              </Stack>
            </Box>
            <Box xcss={styles.affected}>
              <Stack space="space.050">
                <Text weight="medium">Prepare usability testing prototype</Text>
                <Text size="small" color="color.text.subtle">
                  Same owner, now overlaps on Oct 22
                </Text>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Modal>
  )
}
