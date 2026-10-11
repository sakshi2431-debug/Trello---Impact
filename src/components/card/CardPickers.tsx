import { useRef, useState } from 'react'
import Button from '@atlaskit/button/new'
import { Checkbox } from '@atlaskit/checkbox'
import { cssMap } from '@atlaskit/css'
import { ErrorMessage, Label, RequiredAsterisk } from '@atlaskit/form'
import BoardIcon from '@atlaskit/icon/core/board'
import CardIcon from '@atlaskit/icon/core/card'
import CheckMarkIcon from '@atlaskit/icon/core/check-mark'
import { ButtonItem, MenuGroup, Section } from '@atlaskit/menu'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Select from '@atlaskit/select'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import { membersById, workspace } from '../../data/members'
import { formatRelativeTime } from '../../lib/dates'
import { paths } from '../../router'
import { createId } from '../../lib/random'
import { useAppState, useDispatch } from '../../state/store'
import type { AccentColor, Board, Card } from '../../types'
import { ACCENTS } from '../common/accent'
import { LabelChip, LabelColorOption } from '../common/LabelChip'
import { MemberAvatar } from '../common/MemberAvatar'
import { safeLinkUrl } from '../../lib/urls'

const styles = cssMap({
  bleed: { marginInline: token('space.negative.150') },
  rule: { borderBlockStartWidth: token('border.width'), borderBlockStartStyle: 'solid', borderBlockStartColor: token('color.border') },
  swatchGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: token('space.050') },
  labelRow: { display: 'flex', alignItems: 'center', gap: token('space.050') },
  chipGrow: { flexGrow: 1, minWidth: 0, display: 'flex' },
})

export function MembersPicker({ card, board }: { card: Card; board: Board }) {
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const shown = board.memberIds.map((id) => membersById[id]).filter((m) => m.fullName.toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <Stack space="space.100">
      <Textfield autoFocus aria-label="Search members" placeholder="Search members" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
      <Box xcss={styles.bleed}>
        <MenuGroup menuLabel="Board members">
          <Section title="Board members">
            {shown.map((member) => {
              const isOn = card.memberIds.includes(member.id)
              return (
                <ButtonItem
                  key={member.id}
                  isSelected={isOn}
                  iconBefore={<MemberAvatar name={member.fullName} size="small" />}
                  iconAfter={isOn ? <CheckMarkIcon label="Assigned" /> : undefined}
                  onClick={() => dispatch({ type: 'card/toggleMember', cardId: card.id, memberId: member.id })}
                >
                  {member.fullName}
                </ButtonItem>
              )
            })}
            {shown.length === 0 && <ButtonItem isDisabled>No members match</ButtonItem>}
          </Section>
        </MenuGroup>
      </Box>
    </Stack>
  )
}

export function LabelsPicker({ card, board }: { card: Card; board: Board }) {
  const dispatch = useDispatch()
  const [mode, setMode] = useState<'pick' | 'create'>('pick')
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [color, setColor] = useState<AccentColor>('green')

  if (mode === 'create') {
    return (
      <Stack space="space.150">
        <Box xcss={styles.chipGrow}>
          <LabelChip label={{ id: 'preview', name, color }} size="regular" />
        </Box>
        <Stack space="space.050">
          <Label htmlFor="new-label-title">Title</Label>
          <Textfield id="new-label-title" autoFocus value={name} onChange={(e) => setName(e.currentTarget.value)} />
        </Stack>
        <Stack space="space.050">
          <Text weight="semibold" size="small" id="new-label-color">
            Select a color
          </Text>
          <Box xcss={styles.swatchGrid} role="radiogroup" aria-labelledby="new-label-color">
            {ACCENTS.map((c) => (
              <LabelColorOption key={c} color={c} isSelected={color === c} onSelect={() => setColor(c)} />
            ))}
          </Box>
        </Stack>
        <Inline spread="space-between">
          <Button
            appearance="primary"
            onClick={() => {
              const id = createId('lb')
              dispatch({ type: 'board/createLabel', boardId: board.id, label: { id, name: name.trim(), color } })
              dispatch({ type: 'card/toggleLabel', cardId: card.id, labelId: id })
              setName('')
              setMode('pick')
            }}
          >
            Create
          </Button>
          <Button appearance="subtle" onClick={() => setMode('pick')}>
            Back
          </Button>
        </Inline>
      </Stack>
    )
  }

  const shown = board.labels.filter((l) => l.name.toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <Stack space="space.150">
      <Textfield autoFocus aria-label="Search labels" placeholder="Search labels…" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
      <Stack space="space.050">
        <Text weight="semibold" size="small" color="color.text.subtle">
          Labels
        </Text>
        {shown.map((label) => (
          <Box key={label.id} xcss={styles.labelRow}>
            <Checkbox
              isChecked={card.labelIds.includes(label.id)}
              onChange={() => dispatch({ type: 'card/toggleLabel', cardId: card.id, labelId: label.id })}
              label={
                <Box as="span" xcss={styles.chipGrow}>
                  <LabelChip label={label} size="regular" />
                </Box>
              }
            />
          </Box>
        ))}
      </Stack>
      <Button shouldFitContainer onClick={() => setMode('create')}>
        Create a new label
      </Button>
    </Stack>
  )
}

export function ChecklistCreator({ card, onDone }: { card: Card; onDone: () => void }) {
  const dispatch = useDispatch()
  const [title, setTitle] = useState('Checklist')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        dispatch({ type: 'card/addChecklist', cardId: card.id, title: title.trim() })
        onDone()
      }}
    >
      <Stack space="space.150">
        <Stack space="space.050">
          <Label htmlFor="checklist-title">Title</Label>
          <Textfield id="checklist-title" autoFocus value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        </Stack>
        <Box>
          <Button appearance="primary" type="submit">
            Add
          </Button>
        </Box>
      </Stack>
    </form>
  )
}

/** Trello's Attach popover: upload a file, or paste a link or pick something you viewed recently. */
export function AttachmentPicker({ card, onDone }: { card: Card; onDone: () => void }) {
  const { cards, boards, boardOrder, inboxBoardId } = useAppState()
  const dispatch = useDispatch()
  const fileRef = useRef<HTMLInputElement>(null)
  const [link, setLink] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [display, setDisplay] = useState('')
  const linked = new Set(card.attachments.map((a) => a.cardId).filter(Boolean))
  const query = link.trim().toLowerCase()
  const isUrl = /^[a-z]+:\/\/|^www\./i.test(link.trim())
  const recent = [
    ...Object.values(cards)
      .filter((c) => c.lastViewedAt && c.id !== card.id && !linked.has(c.id) && !c.isArchived && !c.isDraft && c.boardId !== inboxBoardId)
      .map((c) => ({ kind: 'card' as const, id: c.id, title: c.title, where: boards[c.boardId]?.title ?? '', viewedAt: c.lastViewedAt! })),
    ...boardOrder
      .map((id) => boards[id])
      .filter((b) => b?.lastViewedAt && !b.isClosed && b.id !== inboxBoardId)
      .map((b) => ({ kind: 'board' as const, id: b.id, title: b.title, where: workspace.name, viewedAt: b.lastViewedAt! })),
  ]
    .filter((item) => isUrl || !query || item.title.toLowerCase().includes(query))
    .sort((x, y) => y.viewedAt - x.viewedAt)
    .slice(0, 5)

  const attachRecent = (item: (typeof recent)[number]) => {
    const name = display.trim() || item.title
    if (item.kind === 'card') dispatch({ type: 'card/addAttachment', cardId: card.id, attachment: { name, kind: 'card', cardId: item.id, sizeBytes: 0 } })
    else
      dispatch({
        type: 'card/addAttachment',
        cardId: card.id,
        attachment: { name, kind: 'link', url: `${location.origin}${location.pathname}${paths.board(item.id)}`, sizeBytes: 0 },
      })
    onDone()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!link.trim()) return
        // Only web and email links are attached; anything that could run code when clicked is refused.
        const url = safeLinkUrl(link)
        if (!url) {
          setLinkError('Enter a web address, such as https://example.com.')
          return
        }
        dispatch({ type: 'card/addAttachment', cardId: card.id, attachment: { name: display.trim() || link.trim(), kind: 'link', url, sizeBytes: 0 } })
        onDone()
      }}
    >
      <Stack space="space.150">
        <Stack space="space.100">
          <Stack space="space.050">
            <Text weight="semibold">Attach a file from your computer</Text>
            <Text size="small" color="color.text.subtle">
              You can also drag and drop files to upload them.
            </Text>
          </Stack>
          <input
            ref={fileRef}
            type="file"
            hidden
            multiple
            onChange={(e) => {
              Array.from(e.currentTarget.files ?? []).forEach((file) =>
                dispatch({
                  type: 'card/addAttachment',
                  cardId: card.id,
                  attachment: { name: file.name, kind: file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'file', sizeBytes: file.size },
                }),
              )
              onDone()
            }}
          />
          <Box>
            <Button onClick={() => fileRef.current?.click()}>Choose a file</Button>
          </Box>
        </Stack>
        <Box xcss={styles.rule} />
        <Stack space="space.050">
          <Label htmlFor="attach-link">
            Search or paste a link
            <RequiredAsterisk />
          </Label>
          <Textfield
            id="attach-link"
            placeholder="Find recent links or paste a new link"
            value={link}
            isInvalid={!!linkError}
            aria-describedby={linkError ? 'attach-link-error' : undefined}
            onChange={(e) => {
              setLink(e.currentTarget.value)
              setLinkError(null)
            }}
          />
          {linkError && (
            <Box id="attach-link-error">
              <ErrorMessage>{linkError}</ErrorMessage>
            </Box>
          )}
        </Stack>
        <Stack space="space.050">
          <Label htmlFor="attach-display">Display text (optional)</Label>
          <Textfield
            id="attach-display"
            placeholder="Text to display"
            aria-describedby="attach-display-help"
            value={display}
            onChange={(e) => setDisplay(e.currentTarget.value)}
          />
          <Text size="small" color="color.text.subtle" id="attach-display-help">
            Give this link a title or description
          </Text>
        </Stack>
        {recent.length > 0 && (
          <Stack space="space.050">
            <Text size="small" weight="semibold">
              Recently viewed
            </Text>
            <Box xcss={styles.bleed}>
              <MenuGroup>
                <Section>
                  {recent.map((item) => (
                    <ButtonItem
                      key={`${item.kind}-${item.id}`}
                      iconBefore={
                        item.kind === 'card' ? (
                          <CardIcon label="Card" color={token('color.icon.information')} />
                        ) : (
                          <BoardIcon label="Board" color={token('color.icon.information')} />
                        )
                      }
                      description={`${item.where} · Viewed ${formatRelativeTime(item.viewedAt)}`}
                      onClick={() => attachRecent(item)}
                    >
                      {item.title}
                    </ButtonItem>
                  ))}
                </Section>
              </MenuGroup>
            </Box>
          </Stack>
        )}
        <Inline space="space.100" alignInline="end">
          <Button appearance="subtle" onClick={onDone}>
            Cancel
          </Button>
          <Button appearance="primary" type="submit" isDisabled={!link.trim()}>
            Insert
          </Button>
        </Inline>
      </Stack>
    </form>
  )
}

/** Links another Trello card to this one, the way Trello's attachment picker finds cards. */
export function CardLinkPicker({ card, onDone }: { card: Card; onDone: () => void }) {
  const { cards, boards, lists, inboxBoardId } = useAppState()
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const linked = new Set(card.attachments.map((a) => a.cardId).filter(Boolean))
  const q = query.trim().toLowerCase()
  const matches = Object.values(cards)
    .filter((c) => {
      if (c.id === card.id || linked.has(c.id) || c.isArchived || c.isDraft || c.boardId === inboxBoardId) return false
      if (boards[c.boardId]?.isClosed || lists[c.listId]?.isArchived) return false
      return !q || c.title.toLowerCase().includes(q)
    })
    // Same-board cards first: they are the likeliest to be related.
    .sort((a, b) => Number(b.boardId === card.boardId) - Number(a.boardId === card.boardId))
    .slice(0, 6)
  return (
    <Stack space="space.100">
      <Label htmlFor="link-card">Search cards</Label>
      <Textfield id="link-card" placeholder="Card title" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
      <Box xcss={styles.bleed}>
        <MenuGroup>
          <Section>
            {matches.map((c) => (
              <ButtonItem
                key={c.id}
                description={`${boards[c.boardId].title}: ${lists[c.listId]?.title ?? ''}`}
                onClick={() => {
                  dispatch({ type: 'card/addAttachment', cardId: card.id, attachment: { name: c.title, kind: 'card', cardId: c.id, sizeBytes: 0 } })
                  onDone()
                }}
              >
                {c.title}
              </ButtonItem>
            ))}
          </Section>
        </MenuGroup>
      </Box>
      {matches.length === 0 && <Text color="color.text.subtle">No matching cards.</Text>}
    </Stack>
  )
}

export function CoverPicker({ card, onDone }: { card: Card; onDone: () => void }) {
  const dispatch = useDispatch()
  return (
    <Stack space="space.150">
      <Text weight="semibold" size="small" id="cover-colors">
        Colors
      </Text>
      <Box xcss={styles.swatchGrid} role="radiogroup" aria-labelledby="cover-colors">
        {ACCENTS.map((c) => (
          <LabelColorOption key={c} color={c} isSelected={card.cover === c} onSelect={() => dispatch({ type: 'card/setCover', cardId: card.id, cover: c })} />
        ))}
      </Box>
      <Button
        shouldFitContainer
        isDisabled={!card.cover}
        onClick={() => {
          dispatch({ type: 'card/setCover', cardId: card.id, cover: undefined })
          onDone()
        }}
      >
        Remove cover
      </Button>
    </Stack>
  )
}

export function MovePicker({ card, onDone }: { card: Card; onDone: () => void }) {
  const { boards, boardOrder, lists, inboxBoardId } = useAppState()
  const dispatch = useDispatch()
  const [boardId, setBoardId] = useState(card.boardId)
  const [listId, setListId] = useState(card.listId)
  const targetLists = boards[boardId].listIds.map((id) => lists[id])
  const targetList = lists[listId] ?? targetLists[0]
  const positions = targetList ? targetList.cardIds.filter((id) => id !== card.id).length + 1 : 1
  const currentIndex = targetList?.cardIds.indexOf(card.id) ?? -1
  const [position, setPosition] = useState(currentIndex >= 0 ? currentIndex : 0)

  const boardOptions = [inboxBoardId, ...boardOrder.filter((id) => !boards[id].isClosed)].map((id) => ({ label: boards[id].title, value: id }))
  const listOptions = targetLists.map((l) => ({ label: l.title, value: l.id }))
  const positionOptions = Array.from({ length: positions }, (_, i) => ({ label: String(i + 1), value: i }))

  return (
    <Stack space="space.150">
      <Stack space="space.050">
        <Label htmlFor="move-board">Board</Label>
        <Select
          inputId="move-board"
          options={boardOptions}
          value={boardOptions.find((o) => o.value === boardId)}
          onChange={(o) => {
            if (!o) return
            setBoardId(o.value)
            const first = boards[o.value].listIds[0]
            setListId(first)
            setPosition(0)
          }}
        />
      </Stack>
      <Inline space="space.100">
        <Box xcss={styles.chipGrow}>
          <Stack space="space.050">
            <Label htmlFor="move-list">List</Label>
            <Select
              inputId="move-list"
              options={listOptions}
              value={listOptions.find((o) => o.value === targetList?.id)}
              onChange={(o) => {
                if (!o) return
                setListId(o.value)
                setPosition(0)
              }}
            />
          </Stack>
        </Box>
        <Stack space="space.050">
          <Label htmlFor="move-position">Position</Label>
          <Select
            inputId="move-position"
            options={positionOptions}
            value={positionOptions.find((o) => o.value === Math.min(position, positions - 1))}
            onChange={(o) => o && setPosition(o.value)}
          />
        </Stack>
      </Inline>
      <Box>
        <Button
          appearance="primary"
          isDisabled={!targetList}
          onClick={() => {
            dispatch({ type: 'card/move', cardId: card.id, toListId: targetList.id, toIndex: position })
            onDone()
          }}
        >
          Move
        </Button>
      </Box>
    </Stack>
  )
}
