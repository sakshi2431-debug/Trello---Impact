import { useState } from 'react'
import Button from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import { useFlags } from '@atlaskit/flag'
import { HelperMessage, Label } from '@atlaskit/form'
import Heading from '@atlaskit/heading'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import Select from '@atlaskit/select'
import Textarea from '@atlaskit/textarea'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { useAppState, useDispatch } from '../../state/store'
import type { Workspace } from '../../types'
import { MemberAvatar } from '../common/MemberAvatar'

const styles = cssMap({
  page: { maxWidth: '40rem', marginInline: 'auto', paddingBlock: token('space.400'), paddingInline: token('space.400') },
})

const visibilityOptions: { label: string; value: Workspace['visibility'] }[] = [
  { label: 'Private: only Workspace members can see it', value: 'private' },
  { label: 'Public: anyone can see this Workspace', value: 'public' },
]

export function SettingsPage() {
  const { workspace } = useAppState()
  const dispatch = useDispatch()
  const { showFlag } = useFlags()
  const [name, setName] = useState(workspace.name)
  const [description, setDescription] = useState(workspace.description)
  const [visibility, setVisibility] = useState(workspace.visibility)
  const isDirty = name !== workspace.name || description !== workspace.description || visibility !== workspace.visibility

  return (
    <Box xcss={styles.page}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          dispatch({ type: 'workspace/update', patch: { name: name.trim(), description, visibility } })
          showFlag({ title: 'Workspace settings saved', appearance: 'success', isAutoDismiss: true })
        }}
      >
        <Stack space="space.300">
          <Inline space="space.200" alignBlock="center">
            <MemberAvatar name={workspace.name} appearance="square" size="large" />
            <Heading size="large" as="h1">
              Workspace settings
            </Heading>
          </Inline>
          <Stack space="space.050">
            <Label htmlFor="ws-name">Name</Label>
            <Textfield id="ws-name" value={name} isInvalid={!name.trim()} onChange={(e) => setName(e.currentTarget.value)} />
          </Stack>
          <Stack space="space.050">
            <Label htmlFor="ws-description">Description (optional)</Label>
            <Textarea id="ws-description" value={description} minimumRows={3} onChange={(e) => setDescription(e.currentTarget.value)} />
          </Stack>
          <Stack space="space.050">
            <Label htmlFor="ws-visibility">Workspace visibility</Label>
            <Select
              inputId="ws-visibility"
              options={visibilityOptions}
              value={visibilityOptions.find((o) => o.value === visibility)}
              onChange={(option) => option && setVisibility(option.value)}
            />
            <HelperMessage>Board visibility can be set separately on each board.</HelperMessage>
          </Stack>
          <Inline space="space.100">
            <Button appearance="primary" type="submit" isDisabled={!isDirty || !name.trim()}>
              Save
            </Button>
            <Button
              appearance="subtle"
              isDisabled={!isDirty}
              onClick={() => {
                setName(workspace.name)
                setDescription(workspace.description)
                setVisibility(workspace.visibility)
              }}
            >
              Cancel
            </Button>
          </Inline>
        </Stack>
      </form>
    </Box>
  )
}
