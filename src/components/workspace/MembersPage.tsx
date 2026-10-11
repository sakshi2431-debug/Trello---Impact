import { useState } from 'react'
import { cssMap } from '@atlaskit/css'
import Heading from '@atlaskit/heading'
import SearchIcon from '@atlaskit/icon/core/search'
import Lozenge from '@atlaskit/lozenge'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { members } from '../../data/members'
import { useAppState } from '../../state/store'
import { MemberAvatar } from '../common/MemberAvatar'

const styles = cssMap({
  page: { maxWidth: '60rem', marginInline: 'auto', paddingBlock: token('space.400'), paddingInline: token('space.400') },
  row: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: token('space.150'),
    paddingBlock: token('space.150'),
    marginBlockStart: token('space.0'),
    borderBlockEndWidth: token('border.width'),
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: token('color.border'),
  },
  who: { flexGrow: 1, minWidth: '12rem' },
  list: { listStyle: 'none', margin: token('space.0'), padding: token('space.0') },
  icon: { display: 'flex', paddingInlineStart: token('space.100') },
})

export function MembersPage() {
  const { boards, boardOrder, workspace, currentUserId } = useAppState()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = members.filter((m) => !q || m.fullName.toLowerCase().includes(q) || m.username.includes(q))

  return (
    <Box xcss={styles.page}>
      <Stack space="space.300">
        <Stack space="space.100">
          <Heading size="large" as="h1">{`Workspace members (${members.length})`}</Heading>
          <Text color="color.text.subtle">Members of {workspace.name} can view and join all Workspace visible boards and create new boards.</Text>
        </Stack>
        <Box>
          <Textfield
            aria-label="Filter by name"
            placeholder="Filter by name"
            width={320}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            elemBeforeInput={
              <Box xcss={styles.icon}>
                <SearchIcon label="" color={token('color.icon.subtle')} />
              </Box>
            }
          />
        </Box>
        <Box as="ul" role="list" xcss={styles.list}>
          {shown.map((member) => {
            const boardCount = boardOrder.filter((id) => boards[id].memberIds.includes(member.id)).length
            return (
              <Box as="li" key={member.id} xcss={styles.row}>
                <MemberAvatar name={member.fullName} size="medium" />
                <Box xcss={styles.who}>
                  <Stack space="space.025">
                    <Inline space="space.100" alignBlock="center">
                      <Text weight="semibold">{member.fullName}</Text>
                      {member.id === currentUserId && <Lozenge>You</Lozenge>}
                    </Inline>
                    <Text size="small" color="color.text.subtle">
                      @{member.username} · {member.role}
                    </Text>
                  </Stack>
                </Box>
                <Text color="color.text.subtle">{`Boards (${boardCount})`}</Text>
                <Lozenge appearance={member.id === 'm-jordan' || member.id === currentUserId ? 'inprogress' : 'default'}>
                  {member.id === 'm-jordan' || member.id === currentUserId ? 'Admin' : 'Member'}
                </Lozenge>
              </Box>
            )
          })}
          {shown.length === 0 && <Text color="color.text.subtle">No members match “{query.trim()}”.</Text>}
        </Box>
      </Stack>
    </Box>
  )
}
