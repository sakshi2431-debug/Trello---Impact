import { useState, type ReactNode } from 'react'
import AvatarGroup from '@atlaskit/avatar-group'
import Button, { IconButton } from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import DropdownMenu, { DropdownItem, DropdownItemCheckbox, DropdownItemGroup, DropdownItemRadio, DropdownItemRadioGroup } from '@atlaskit/dropdown-menu'
import { useFlags } from '@atlaskit/flag'
import { Label } from '@atlaskit/form'
import Heading from '@atlaskit/heading'
import AutomationIcon from '@atlaskit/icon/core/automation'
import BoardIcon from '@atlaskit/icon/core/board'
import ChevronDownIcon from '@atlaskit/icon/core/chevron-down'
import GlobeIcon from '@atlaskit/icon/core/globe'
import LockLockedIcon from '@atlaskit/icon/core/lock-locked'
import PeopleGroupIcon from '@atlaskit/icon/core/people-group'
import PersonAddIcon from '@atlaskit/icon/core/person-add'
import PowerPlugIcon from '@atlaskit/icon/core/power-plug'
import ShowMoreHorizontalIcon from '@atlaskit/icon/core/show-more-horizontal'
import TableIcon from '@atlaskit/icon/core/table'
import InlineEdit from '@atlaskit/inline-edit'
import Lozenge from '@atlaskit/lozenge'
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Select from '@atlaskit/select'
import Textarea from '@atlaskit/textarea'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import VisuallyHidden from '@atlaskit/visually-hidden'
import { members, membersById } from '../../data/members'
import { navigate, paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import type { Board, Visibility } from '../../types'
import { MemberAvatar } from '../common/MemberAvatar'
import { StarButton } from '../common/StarButton'
import { CardPopover } from '../card/CardPopover'
import { FilterPopup } from './FilterPopup'
import type { BoardFilter } from './filters'

const styles = cssMap({
  header: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: token('space.050'),
    paddingBlock: token('space.100'),
    paddingInlineStart: token('space.150'),
    paddingInlineEnd: token('space.100'),
  },
  title: { minWidth: 0, maxWidth: '100%' },
  titleRead: { paddingBlock: token('space.050'), paddingInline: token('space.075') },
  end: { marginInlineStart: 'auto' },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: token('space.150'),
    paddingBlock: token('space.100'),
    marginBlockStart: token('space.0'),
  },
  grow: { flexGrow: 1 },
  list: { listStyle: 'none', margin: token('space.0'), padding: token('space.0') },
})

const visibilityMeta: Record<Visibility, { label: string; description: string; icon: typeof LockLockedIcon }> = {
  private: { label: 'Private', description: 'Only board members can see this board.', icon: LockLockedIcon },
  workspace: { label: 'Workspace', description: 'All members of the Workspace can see and edit this board.', icon: PeopleGroupIcon },
  public: { label: 'Public', description: 'Anyone on the internet can see this board. Only board members can edit.', icon: GlobeIcon },
}

export type BoardView = 'board' | 'table'

const viewMeta: Record<BoardView, { label: string; icon: typeof BoardIcon }> = {
  board: { label: 'Board', icon: BoardIcon },
  table: { label: 'Table', icon: TableIcon },
}

interface Props {
  board: Board
  filter: BoardFilter
  onFilterChange: (filter: BoardFilter) => void
  view: BoardView
  onViewChange: (view: BoardView) => void
}

export function BoardHeader({ board, filter, onFilterChange, view, onViewChange }: Props) {
  const dispatch = useDispatch()
  const { preferences } = useAppState()
  const { showFlag } = useFlags()
  const [dialog, setDialog] = useState<'share' | 'about' | 'archived' | null>(null)
  const VisibilityIcon = visibilityMeta[board.visibility].icon
  const ViewIcon = viewMeta[view].icon

  return (
    <Box xcss={styles.header}>
      <Box xcss={styles.title}>
        <InlineEdit
          key={board.title}
          defaultValue={board.title}
          editButtonLabel={`Edit board title: ${board.title}`}
          hideActionButtons
          onConfirm={(value: string) => value.trim() && dispatch({ type: 'board/update', boardId: board.id, patch: { title: value.trim() } })}
          editView={({ errorMessage: _errorMessage, ...fieldProps }, ref) => <Textfield {...fieldProps} ref={ref} autoFocus aria-label="Board title" />}
          readView={() => (
            <Box xcss={styles.titleRead}>
              <Heading size="small" as="h1">
                {board.title}
              </Heading>
            </Box>
          )}
        />
      </Box>
      <DropdownMenu
        trigger={({ triggerRef, ...props }) => (
          <Button {...props} ref={triggerRef} appearance="subtle" spacing="compact" iconBefore={ViewIcon} iconAfter={ChevronDownIcon}>
            <VisuallyHidden>{`${viewMeta[view].label} view`}</VisuallyHidden>
          </Button>
        )}
      >
        <DropdownItemRadioGroup id="board-view" title="Views">
          {(Object.keys(viewMeta) as BoardView[]).map((v) => {
            const Icon = viewMeta[v].icon
            return (
              <DropdownItemRadio key={v} id={`view-${v}`} isSelected={view === v} onClick={() => onViewChange(v)}>
                <Inline space="space.100" alignBlock="center" as="span">
                  <Icon label="" />
                  {viewMeta[v].label}
                </Inline>
              </DropdownItemRadio>
            )
          })}
        </DropdownItemRadioGroup>
      </DropdownMenu>

      <Box xcss={styles.end}>
        <Inline space="space.050" alignBlock="center" shouldWrap>
          <AvatarGroup
            appearance="stack"
            size="small"
            maxCount={3}
            label="Board members"
            avatar={MemberAvatar}
            data={board.memberIds.map((id) => ({ key: id, name: membersById[id].fullName }))}
          />
          <InfoButton label="Power-Ups" icon={PowerPlugIcon}>
            Power-Ups add features like custom fields and integrations. None are enabled on this board.
          </InfoButton>
          <InfoButton label="Automation" icon={AutomationIcon}>
            Rules, buttons and scheduled commands run actions on this board. None are set up yet.
          </InfoButton>
          <FilterPopup board={board} filter={filter} onChange={onFilterChange} />
          <StarButton board={board} />
          <DropdownMenu
            trigger={({ triggerRef, ...props }) => (
              <IconButton {...props} ref={triggerRef} appearance="subtle" icon={VisibilityIcon} label={`Change visibility (currently ${visibilityMeta[board.visibility].label})`} />
            )}
          >
            <DropdownItemGroup title="Change visibility">
              {(Object.keys(visibilityMeta) as Visibility[]).map((v) => {
                const Icon = visibilityMeta[v].icon
                return (
                  <DropdownItem
                    key={v}
                    isSelected={board.visibility === v}
                    elemBefore={<Icon label="" />}
                    description={visibilityMeta[v].description}
                    shouldDescriptionWrap
                    onClick={() => dispatch({ type: 'board/update', boardId: board.id, patch: { visibility: v } })}
                  >
                    {visibilityMeta[v].label}
                  </DropdownItem>
                )
              })}
            </DropdownItemGroup>
          </DropdownMenu>
          <Button iconBefore={PersonAddIcon} onClick={() => setDialog('share')}>
            Share
          </Button>
          <DropdownMenu
            placement="bottom-end"
            trigger={({ triggerRef, ...props }) => <IconButton {...props} ref={triggerRef} appearance="subtle" icon={ShowMoreHorizontalIcon} label="Board menu" />}
          >
            <DropdownItemGroup title="Menu">
              <DropdownItem onClick={() => setDialog('about')}>About this board</DropdownItem>
              <DropdownItem onClick={() => setDialog('archived')}>Archived items</DropdownItem>
              <DropdownItem onClick={() => dispatch({ type: 'board/toggleStar', boardId: board.id })}>{board.isStarred ? 'Unstar board' : 'Star board'}</DropdownItem>
            </DropdownItemGroup>
            <DropdownItemGroup hasSeparator>
              <DropdownItemCheckbox
                id="show-label-text"
                isSelected={preferences.showLabelText}
                onClick={() => dispatch({ type: 'preferences/update', patch: { showLabelText: !preferences.showLabelText } })}
              >
                Show label names on cards
              </DropdownItemCheckbox>
            </DropdownItemGroup>
            <DropdownItemGroup hasSeparator>
              <DropdownItem
                onClick={() => {
                  dispatch({ type: 'board/setClosed', boardId: board.id, isClosed: true })
                  showFlag({
                    title: `${board.title} closed`,
                    description: 'You can reopen it from the Boards page.',
                    isAutoDismiss: true,
                    actions: [{ content: 'Reopen', onClick: () => dispatch({ type: 'board/setClosed', boardId: board.id, isClosed: false }) }],
                  })
                  navigate(paths.boards())
                }}
              >
                Close board
              </DropdownItem>
            </DropdownItemGroup>
          </DropdownMenu>
        </Inline>
      </Box>

      <ModalTransition>
        {dialog === 'share' && <ShareDialog board={board} onClose={() => setDialog(null)} />}
        {dialog === 'about' && <AboutDialog board={board} onClose={() => setDialog(null)} />}
        {dialog === 'archived' && <ArchivedDialog board={board} onClose={() => setDialog(null)} />}
      </ModalTransition>
    </Box>
  )
}

function ShareDialog({ board, onClose }: { board: Board; onClose: () => void }) {
  const dispatch = useDispatch()
  const { showFlag } = useFlags()
  const { currentUserId } = useAppState()
  const [selected, setSelected] = useState<string[]>([])
  const options = members.filter((m) => !board.memberIds.includes(m.id)).map((m) => ({ label: m.fullName, value: m.id }))

  return (
    <Modal onClose={onClose} width="medium">
      <ModalHeader hasCloseButton>
        <ModalTitle>Share board</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <Stack space="space.300">
          <Stack space="space.050">
            <Label htmlFor="share-members">Add Workspace members</Label>
            <Inline space="space.100" alignBlock="start">
              <Box xcss={styles.grow}>
                <Select
                  inputId="share-members"
                  isMulti
                  placeholder={options.length ? 'Name or username' : 'Everyone in the Workspace is on this board'}
                  isDisabled={options.length === 0}
                  options={options}
                  value={options.filter((o) => selected.includes(o.value))}
                  onChange={(value) => setSelected(value.map((o) => o.value))}
                />
              </Box>
              <Button
                appearance="primary"
                isDisabled={selected.length === 0}
                onClick={() => {
                  selected.forEach((memberId) => dispatch({ type: 'board/addMember', boardId: board.id, memberId }))
                  showFlag({ title: `Added ${selected.length} member${selected.length === 1 ? '' : 's'} to ${board.title}`, appearance: 'success', isAutoDismiss: true })
                  setSelected([])
                }}
              >
                Share
              </Button>
            </Inline>
          </Stack>
          <Stack space="space.100">
            <Text weight="semibold">{`Board members (${board.memberIds.length})`}</Text>
            <Box as="ul" role="list" xcss={styles.list}>
              {board.memberIds.map((id) => {
                const member = membersById[id]
                return (
                  <Box as="li" key={id} xcss={styles.memberRow}>
                    <MemberAvatar name={member.fullName} size="medium" />
                    <Box xcss={styles.grow}>
                      <Stack space="space.025">
                        <Text weight="medium">{id === currentUserId ? `${member.fullName} (you)` : member.fullName}</Text>
                        <Text size="small" color="color.text.subtle">{`@${member.username} · ${member.role}`}</Text>
                      </Stack>
                    </Box>
                    <Lozenge appearance={id === board.memberIds[0] ? 'inprogress' : 'default'}>{id === board.memberIds[0] ? 'Admin' : 'Member'}</Lozenge>
                  </Box>
                )
              })}
            </Box>
          </Stack>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Done</Button>
      </ModalFooter>
    </Modal>
  )
}

function AboutDialog({ board, onClose }: { board: Board; onClose: () => void }) {
  const dispatch = useDispatch()
  const [description, setDescription] = useState(board.description)
  const admin = membersById[board.memberIds[0]]
  return (
    <Modal onClose={onClose} width="medium">
      <ModalHeader hasCloseButton>
        <ModalTitle>About this board</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <Stack space="space.300">
          <Stack space="space.100">
            <Text weight="semibold">Board admin</Text>
            <Inline space="space.100" alignBlock="center">
              <MemberAvatar name={admin.fullName} size="medium" />
              <Stack>
                <Text weight="medium">{admin.fullName}</Text>
                <Text size="small" color="color.text.subtle">{`@${admin.username}`}</Text>
              </Stack>
            </Inline>
          </Stack>
          <Stack space="space.050">
            <Label htmlFor="board-description">Description</Label>
            <Textarea id="board-description" minimumRows={4} placeholder="Add a description to let your teammates know what this board is used for." value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
          </Stack>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button appearance="subtle" onClick={onClose}>
          Cancel
        </Button>
        <Button
          appearance="primary"
          onClick={() => {
            dispatch({ type: 'board/update', boardId: board.id, patch: { description } })
            onClose()
          }}
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  )
}

function ArchivedDialog({ board, onClose }: { board: Board; onClose: () => void }) {
  const { cards, lists } = useAppState()
  const dispatch = useDispatch()
  const archivedCards = Object.values(cards).filter((c) => c.boardId === board.id && c.isArchived)
  const archivedLists = Object.values(lists).filter((l) => l.boardId === board.id && l.isArchived)

  return (
    <Modal onClose={onClose} width="medium">
      <ModalHeader hasCloseButton>
        <ModalTitle>Archived items</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <Stack space="space.300">
          <Stack space="space.100">
            <Text weight="semibold">{`Cards (${archivedCards.length})`}</Text>
            {archivedCards.length === 0 && <Text color="color.text.subtle">No archived cards.</Text>}
            {archivedCards.map((card) => (
              <Box key={card.id} xcss={styles.memberRow}>
                <Box xcss={styles.grow}>
                  <Stack space="space.025">
                    <Text weight="medium">{card.title}</Text>
                    <Text size="small" color="color.text.subtle">{`In list ${lists[card.listId]?.title ?? ''}`}</Text>
                  </Stack>
                </Box>
                <Button spacing="compact" onClick={() => dispatch({ type: 'card/setArchived', cardId: card.id, isArchived: false })}>
                  Send to board
                </Button>
              </Box>
            ))}
          </Stack>
          <Stack space="space.100">
            <Text weight="semibold">{`Lists (${archivedLists.length})`}</Text>
            {archivedLists.length === 0 && <Text color="color.text.subtle">No archived lists.</Text>}
            {archivedLists.map((list) => (
              <Box key={list.id} xcss={styles.memberRow}>
                <Box xcss={styles.grow}>
                  <Text weight="medium">{list.title}</Text>
                </Box>
                <Button spacing="compact" onClick={() => dispatch({ type: 'list/restore', listId: list.id })}>
                  Send to board
                </Button>
              </Box>
            ))}
          </Stack>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Done</Button>
      </ModalFooter>
    </Modal>
  )
}

/** Board header shortcut Trello shows for features the prototype does not simulate. */
function InfoButton({ label, icon, children }: { label: string; icon: typeof BoardIcon; children: ReactNode }) {
  return (
    <CardPopover
      title={label}
      placement="bottom-end"
      trigger={({ triggerProps, isOpen, toggle }) => (
        <IconButton {...triggerProps} appearance="subtle" icon={icon} label={label} isTooltipDisabled={false} isSelected={isOpen} onClick={toggle} />
      )}
    >
      {() => <Text>{children}</Text>}
    </CardPopover>
  )
}
