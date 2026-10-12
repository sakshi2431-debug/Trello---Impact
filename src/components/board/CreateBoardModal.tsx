import { useState } from 'react'
import Button from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import { ErrorMessage, Label } from '@atlaskit/form'
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Select from '@atlaskit/select'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { createId } from '../../lib/random'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import { useUi } from '../../state/ui'
import type { AccentColor, Visibility } from '../../types'
import { ACCENTS } from '../common/accent'
import { BoardColorOption, BoardThumbnail } from '../common/BoardSwatch'

const styles = cssMap({
  preview: {
    height: '7.5rem',
    overflow: 'hidden',
    borderRadius: token('radius.medium'),
    borderWidth: token('border.width'),
    borderStyle: 'solid',
    borderColor: token('color.border'),
  },
  previewLists: { display: 'flex', gap: token('space.050') },
  previewList: {
    width: '3rem',
    height: '4.5rem',
    borderRadius: token('radius.small'),
    backgroundColor: token('elevation.surface.raised'),
    boxShadow: token('elevation.shadow.raised'),
  },
})

const visibilityOptions: { label: string; value: Visibility }[] = [
  { label: 'Workspace', value: 'workspace' },
  { label: 'Private', value: 'private' },
  { label: 'Public', value: 'public' },
]

export function CreateBoardModal() {
  const { isCreateBoardOpen, closeCreateBoard } = useUi()
  return <ModalTransition>{isCreateBoardOpen && <CreateBoardDialog onClose={closeCreateBoard} />}</ModalTransition>
}

function CreateBoardDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useDispatch()
  const { boards } = useAppState()
  const [title, setTitle] = useState('')
  const [accent, setAccent] = useState<AccentColor>('blue')
  const [visibility, setVisibility] = useState<Visibility>('workspace')
  const [touched, setTouched] = useState(false)
  const isInvalid = touched && title.trim() === ''

  const create = () => {
    setTouched(true)
    if (!title.trim()) return
    const id = createId('b')
    dispatch({ type: 'board/create', id, title: title.trim(), accent, visibility })
    onClose()
    navigate(paths.board({ id, title: title.trim() }, boards))
  }

  return (
    <Modal onClose={onClose} width="small">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          create()
        }}
      >
        <ModalHeader hasCloseButton>
          <ModalTitle>Create board</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Stack space="space.200">
            <Box xcss={styles.preview} aria-hidden>
              <BoardThumbnail accent={accent}>
                <Box xcss={styles.previewLists}>
                  <Box xcss={styles.previewList} />
                  <Box xcss={styles.previewList} />
                  <Box xcss={styles.previewList} />
                </Box>
              </BoardThumbnail>
            </Box>
            <Stack space="space.075">
              <Text weight="semibold" size="small" id="board-background-label">
                Background
              </Text>
              <Inline space="space.075" shouldWrap role="radiogroup" aria-labelledby="board-background-label">
                {ACCENTS.map((color) => (
                  <BoardColorOption key={color} accent={color} isSelected={accent === color} onSelect={() => setAccent(color)} />
                ))}
              </Inline>
            </Stack>
            <Stack space="space.050">
              <Label htmlFor="create-board-title">Board title (required)</Label>
              <Textfield
                id="create-board-title"
                autoFocus
                value={title}
                isInvalid={isInvalid}
                onChange={(e) => setTitle(e.currentTarget.value)}
                onBlur={() => setTouched(true)}
              />
              {isInvalid && <ErrorMessage>Board title is required</ErrorMessage>}
            </Stack>
            <Stack space="space.050">
              <Label htmlFor="create-board-visibility">Visibility</Label>
              <Select
                inputId="create-board-visibility"
                options={visibilityOptions}
                value={visibilityOptions.find((o) => o.value === visibility)}
                onChange={(option) => option && setVisibility(option.value)}
              />
            </Stack>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button appearance="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button appearance="primary" type="submit" isDisabled={!title.trim()}>
            Create
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
