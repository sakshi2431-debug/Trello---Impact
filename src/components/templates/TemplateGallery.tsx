import { useState } from 'react'
import Button from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import Heading from '@atlaskit/heading'
import Lozenge from '@atlaskit/lozenge'
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import type { BoardTemplate } from '../../data/templates'
import { createId } from '../../lib/random'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import { BoardThumbnail } from '../common/BoardSwatch'

const styles = cssMap({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
    gap: token('space.200'),
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '7.5rem',
    padding: token('space.0'),
    textAlign: 'start',
    overflow: 'hidden',
    borderRadius: token('radius.large'),
    backgroundColor: token('elevation.surface.raised'),
    boxShadow: token('elevation.shadow.raised'),
    '&:hover': { boxShadow: token('elevation.shadow.overlay') },
  },
  thumb: { position: 'relative', flexGrow: 1 },
  badge: { position: 'absolute', insetBlockEnd: token('space.075'), insetInlineEnd: token('space.075') },
  footer: { paddingBlock: token('space.075'), paddingInline: token('space.100') },
  preview: {
    display: 'flex',
    gap: token('space.100'),
    overflowX: 'auto',
    padding: token('space.150'),
    borderRadius: token('radius.large'),
  },
  previewList: {
    flexShrink: 0,
    width: '10rem',
    padding: token('space.100'),
    borderRadius: token('radius.large'),
    backgroundColor: token('elevation.surface.sunken'),
  },
  previewCard: {
    paddingBlock: token('space.075'),
    paddingInline: token('space.100'),
    borderRadius: token('radius.medium'),
    backgroundColor: token('elevation.surface.raised'),
    boxShadow: token('elevation.shadow.raised'),
  },
})

/** Grid of board templates; choosing one opens a preview with "Use template". */
export function TemplateGrid({ templates }: { templates: BoardTemplate[] }) {
  const [selected, setSelected] = useState<BoardTemplate | null>(null)
  return (
    <>
      <Box xcss={styles.grid}>
        {templates.map((template) => (
          <Pressable key={template.id} xcss={styles.tile} onClick={() => setSelected(template)} aria-label={`${template.title} template`}>
            <Box as="span" xcss={styles.thumb}>
              <BoardThumbnail accent={template.accent} />
              <Box as="span" xcss={styles.badge}>
                <Lozenge>Template</Lozenge>
              </Box>
            </Box>
            <Box as="span" xcss={styles.footer}>
              <Text weight="semibold" maxLines={1}>
                {template.title}
              </Text>
            </Box>
          </Pressable>
        ))}
      </Box>
      <ModalTransition>{selected && <TemplatePreview template={selected} onClose={() => setSelected(null)} />}</ModalTransition>
    </>
  )
}

function TemplatePreview({ template, onClose }: { template: BoardTemplate; onClose: () => void }) {
  const dispatch = useDispatch()
  const { boards } = useAppState()
  return (
    <Modal onClose={onClose} width="large">
      <ModalHeader hasCloseButton>
        <ModalTitle>{template.title}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <Stack space="space.200">
          <Inline space="space.100" alignBlock="center">
            <Lozenge>{template.category}</Lozenge>
            <Text color="color.text.subtle">{template.description}</Text>
          </Inline>
          <Box xcss={styles.preview}>
            {template.lists.map((list) => (
              <Box key={list.title} xcss={styles.previewList}>
                <Stack space="space.075">
                  <Heading size="xxsmall" as="h3">
                    {list.title}
                  </Heading>
                  {list.cards.map((card) => (
                    <Box key={card} xcss={styles.previewCard}>
                      <Text size="small">{card}</Text>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button appearance="subtle" onClick={onClose}>
          Cancel
        </Button>
        <Button
          appearance="primary"
          onClick={() => {
            const id = createId('b')
            const title = template.title.replace(/ template$/i, '')
            dispatch({ type: 'board/create', id, title, accent: template.accent, visibility: 'workspace', lists: template.lists })
            onClose()
            navigate(paths.board({ id, title }, boards))
          }}
        >
          Use template
        </Button>
      </ModalFooter>
    </Modal>
  )
}
