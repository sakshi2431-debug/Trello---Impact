import { useState, type ReactNode } from 'react'
import Button from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import DateLabel from '@atlaskit/date-label'
import DynamicTable from '@atlaskit/dynamic-table'
import { useFlags } from '@atlaskit/flag'
import { HelperMessage, Label } from '@atlaskit/form'
import Heading from '@atlaskit/heading'
import Link from '@atlaskit/link'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Textarea from '@atlaskit/textarea'
import Textfield from '@atlaskit/textfield'
import Toggle from '@atlaskit/toggle'
import { token } from '@atlaskit/tokens'
import { membersById } from '../../data/members'
import { formatRelativeTime, formatShortDate, getDueStatus } from '../../lib/dates'
import { paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import { MemberAvatar } from '../common/MemberAvatar'

const styles = cssMap({
  page: { maxWidth: '50rem', paddingBlock: token('space.400'), paddingInline: token('space.500') },
  setting: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: token('space.300'),
    paddingBlock: token('space.200'),
    borderBlockEndWidth: token('border.width'),
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: token('color.border'),
  },
  grow: { flexGrow: 1, minWidth: 0 },
  activity: { display: 'flex', gap: token('space.100'), alignItems: 'flex-start' },
  quote: {
    paddingBlock: token('space.075'),
    paddingInline: token('space.150'),
    borderRadius: token('radius.medium'),
    backgroundColor: token('elevation.surface.sunken'),
  },
})

export function SettingsPage({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Box xcss={styles.page}>
      <Stack space="space.300">
        <Stack space="space.100">
          <Heading size="large" as="h1">
            {title}
          </Heading>
          {description && <Text color="color.text.subtle">{description}</Text>}
        </Stack>
        {children}
      </Stack>
    </Box>
  )
}

function SettingRow({ id, title, description, isChecked, onChange }: { id: string; title: string; description: string; isChecked: boolean; onChange: () => void }) {
  return (
    <Box xcss={styles.setting}>
      <Box xcss={styles.grow}>
        <Stack space="space.050">
          <Label htmlFor={id}>{title}</Label>
          <Text color="color.text.subtle">{description}</Text>
        </Stack>
      </Box>
      <Toggle id={id} label={title} isChecked={isChecked} onChange={onChange} />
    </Box>
  )
}

export function ProfileSettings() {
  const { currentUserId, preferences } = useAppState()
  const dispatch = useDispatch()
  const { showFlag } = useFlags()
  const me = membersById[currentUserId]
  const [bio, setBio] = useState(preferences.bio)
  return (
    <SettingsPage title="Profile and visibility" description="Your profile is visible to members of your Workspaces and boards.">
      <Inline space="space.200" alignBlock="center">
        <MemberAvatar name={me.fullName} size="xlarge" />
        <Stack space="space.050">
          <Heading size="medium" as="h2">
            {me.fullName}
          </Heading>
          <Text color="color.text.subtle">{`@${me.username} · ${me.role}`}</Text>
        </Stack>
      </Inline>
      <Stack space="space.050">
        <Label htmlFor="profile-email">Email</Label>
        <Textfield id="profile-email" value={me.email} isReadOnly />
        <HelperMessage>Managed by your Atlassian account.</HelperMessage>
      </Stack>
      <Stack space="space.050">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea id="profile-bio" minimumRows={3} value={bio} onChange={(e) => setBio(e.currentTarget.value)} />
      </Stack>
      <Box>
        <Button
          appearance="primary"
          isDisabled={bio === preferences.bio}
          onClick={() => {
            dispatch({ type: 'preferences/update', patch: { bio } })
            showFlag({ title: 'Profile saved', appearance: 'success', isAutoDismiss: true })
          }}
        >
          Save
        </Button>
      </Box>
    </SettingsPage>
  )
}

export function ActivitySettings() {
  const { cards, boards, currentUserId } = useAppState()
  const entries = Object.values(cards)
    .filter((c) => boards[c.boardId] && !c.isDraft)
    .flatMap((card) => [
      ...card.activity.filter((a) => a.actorId === currentUserId).map((a) => ({ id: a.id, at: a.createdAt, text: a.text, card, comment: undefined as string | undefined })),
      ...card.comments.filter((c) => c.authorId === currentUserId).map((c) => ({ id: c.id, at: c.createdAt, text: 'commented on this card', card, comment: c.text })),
    ])
    .sort((a, b) => b.at - a.at)
    .slice(0, 40)
  const me = membersById[currentUserId]
  return (
    <SettingsPage title="Activity" description="Your recent actions across all boards.">
      <Stack space="space.200">
        {entries.map((e) => (
          <Box key={e.id} xcss={styles.activity}>
            <MemberAvatar name={me.fullName} size="small" />
            <Box xcss={styles.grow}>
              <Stack space="space.075">
                <Text>
                  <Text weight="semibold">{me.fullName}</Text> {e.text.replace('this card', '')}
                  <Link href={paths.card(e.card.id)}>{e.card.title}</Link>
                </Text>
                {e.comment && (
                  <Box xcss={styles.quote}>
                    <Text>{e.comment}</Text>
                  </Box>
                )}
                <Text size="small" color="color.text.subtle">
                  {boards[e.card.boardId].title} · {formatRelativeTime(e.at)}
                </Text>
              </Stack>
            </Box>
          </Box>
        ))}
        {entries.length === 0 && <Text color="color.text.subtle">No activity yet.</Text>}
      </Stack>
    </SettingsPage>
  )
}

export function CardsSettings() {
  const { cards, boards, lists, currentUserId, inboxBoardId } = useAppState()
  const mine = Object.values(cards).filter(
    (c) => c.memberIds.includes(currentUserId) && !c.isArchived && !c.isDraft && boards[c.boardId] && !boards[c.boardId].isClosed && c.boardId !== inboxBoardId,
  )
  const rows = mine.map((card) => {
    const status = card.dueDate ? getDueStatus(card.dueDate, card.isDueComplete) : null
    return {
      key: card.id,
      cells: [
        { key: card.title, content: <Link href={paths.card(card.id)}>{card.title}</Link> },
        { key: boards[card.boardId].title, content: <Text>{boards[card.boardId].title}</Text> },
        { key: lists[card.listId]?.title ?? '', content: <Text>{lists[card.listId]?.title}</Text> },
        {
          key: card.dueDate ?? '9999',
          content: card.dueDate ? (
            <DateLabel label={formatShortDate(card.dueDate)} appearance={status === 'overdue' ? 'danger' : status === 'due-soon' ? 'warning' : 'neutral'} iconLabel="" />
          ) : (
            <Text color="color.text.subtlest">No date</Text>
          ),
        },
      ],
    }
  })
  return (
    <SettingsPage title="Cards" description={`${mine.length} cards are assigned to you.`}>
      <DynamicTable
        head={{
          cells: [
            { key: 'card', content: 'Card', isSortable: true, width: 40 },
            { key: 'board', content: 'Board', isSortable: true, width: 22 },
            { key: 'list', content: 'List', isSortable: true, width: 20 },
            { key: 'due', content: 'Due date', isSortable: true, width: 18 },
          ],
        }}
        rows={rows}
        rowsPerPage={20}
        defaultPage={1}
        defaultSortKey="due"
        defaultSortOrder="ASC"
        label="Cards assigned to you"
      />
    </SettingsPage>
  )
}

export function PreferenceSettings() {
  const { preferences } = useAppState()
  const dispatch = useDispatch()
  return (
    <SettingsPage title="Settings">
      <Box>
        <SettingRow
          id="pref-label-text"
          title="Show label names on cards"
          description="Card fronts show label names instead of colour bars. Helpful if colours are hard to tell apart."
          isChecked={preferences.showLabelText}
          onChange={() => dispatch({ type: 'preferences/update', patch: { showLabelText: !preferences.showLabelText } })}
        />
        <SettingRow
          id="pref-templates"
          title="Show templates on the Boards page"
          description="Suggest popular templates above your boards."
          isChecked={!preferences.isTemplatesPromoDismissed}
          onChange={() => dispatch({ type: 'preferences/update', patch: { isTemplatesPromoDismissed: !preferences.isTemplatesPromoDismissed } })}
        />
      </Box>
    </SettingsPage>
  )
}

export function ExportSettings() {
  const state = useAppState()
  const { showFlag } = useFlags()
  const download = () => {
    const blob = new Blob([JSON.stringify({ workspace: state.workspace, boards: state.boards, lists: state.lists, cards: state.cards }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.workspace.shortName}-export.json`
    a.click()
    URL.revokeObjectURL(url)
    showFlag({ title: 'Export ready', description: 'Your Workspace data was downloaded as JSON.', appearance: 'success', isAutoDismiss: true })
  }
  return (
    <SettingsPage title="Export" description="Download every board, list and card in this Workspace as a JSON file.">
      <Box>
        <Button appearance="primary" onClick={download}>
          Export as JSON
        </Button>
      </Box>
    </SettingsPage>
  )
}
