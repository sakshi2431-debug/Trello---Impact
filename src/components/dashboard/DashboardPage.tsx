import { useState, type ComponentType, type ReactNode } from 'react'
import Button, { IconButton, LinkButton } from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import Heading from '@atlaskit/heading'
import BoardsIcon from '@atlaskit/icon/core/boards'
import ClockIcon from '@atlaskit/icon/core/clock'
import CloseIcon from '@atlaskit/icon/core/close'
import PersonIcon from '@atlaskit/icon/core/person'
import TemplateIcon from '@atlaskit/icon/core/screen-plus'
import SettingsIcon from '@atlaskit/icon/core/settings'
import StarUnstarredIcon from '@atlaskit/icon/core/star-unstarred'
import type { NewCoreIconProps } from '@atlaskit/icon/types'
import Link from '@atlaskit/link'
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Grid } from '@atlaskit/primitives/compiled/grid'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Select from '@atlaskit/select'
import { token } from '@atlaskit/tokens'
import { boardTemplates, templateCategories, type BoardTemplate } from '../../data/templates'
import { paths } from '../../router'
import { useAppState, useDispatch } from '../../state/store'
import { useUi } from '../../state/ui'
import type { Board } from '../../types'
import { BoardSwatch } from '../common/BoardSwatch'
import { MemberAvatar } from '../common/MemberAvatar'
import { TemplateGrid } from '../templates/TemplateGallery'
import { BoardTile, CreateBoardTile } from './BoardTile'

const styles = cssMap({
  page: {
    maxWidth: '58rem',
    marginInline: 'auto',
    paddingBlock: token('space.400'),
    paddingInline: token('space.400'),
  },
  // The ADS reset spaces sibling list items; grid gap handles spacing here.
  item: { marginBlockStart: token('space.0') },
  grid: { gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))', listStyle: 'none', margin: token('space.0'), padding: token('space.0') },
  categorySelect: { width: '15rem' },
  row: { display: 'flex', alignItems: 'center', gap: token('space.150'), paddingBlock: token('space.100') },
  grow: { flexGrow: 1 },
})

type CategoryOption = { label: string; value: BoardTemplate['category'] | 'Popular' }
const categoryOptions: CategoryOption[] = [{ label: 'Most popular', value: 'Popular' }, ...templateCategories.map((c) => ({ label: c, value: c }))]

export function DashboardPage() {
  const { boards, boardOrder, workspace, preferences } = useAppState()
  const dispatch = useDispatch()
  const { openCreateBoard } = useUi()
  const [category, setCategory] = useState<CategoryOption>(categoryOptions[0])
  const [isClosedOpen, setClosedOpen] = useState(false)
  const all = boardOrder.map((id) => boards[id])
  const open = all.filter((b) => !b.isClosed)
  const closed = all.filter((b) => b.isClosed)
  const starred = open.filter((b) => b.isStarred)
  const recent = open
    .filter((b) => b.lastViewedAt)
    .sort((a, b) => (b.lastViewedAt ?? 0) - (a.lastViewedAt ?? 0))
    .slice(0, 4)
  const templates = (category.value === 'Popular' ? boardTemplates : boardTemplates.filter((t) => t.category === category.value)).slice(0, 4)

  return (
    <Box xcss={styles.page}>
      <Stack space="space.500">
        {!preferences.isTemplatesPromoDismissed && (
          <Stack space="space.200">
            <Inline spread="space-between" alignBlock="center">
              <Inline space="space.100" alignBlock="center">
                <TemplateIcon label="" color={token('color.icon')} />
                <Heading size="medium" as="h2">
                  Most popular templates
                </Heading>
              </Inline>
              <IconButton icon={CloseIcon} label="Hide templates" onClick={() => dispatch({ type: 'preferences/update', patch: { isTemplatesPromoDismissed: true } })} />
            </Inline>
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <Text>Get going faster with a template from the Trello community or</Text>
              <Box xcss={styles.categorySelect}>
                <Select aria-label="Choose a template category" options={categoryOptions} value={category} onChange={(o) => o && setCategory(o)} />
              </Box>
            </Inline>
            <TemplateGrid templates={templates} />
            <Box>
              <Link href={paths.templates()}>Browse the full template gallery</Link>
            </Box>
          </Stack>
        )}
        {starred.length > 0 && (
          <Section icon={StarUnstarredIcon} title="Starred boards">
            <BoardGrid boards={starred} />
          </Section>
        )}
        {recent.length > 0 && (
          <Section icon={ClockIcon} title="Recently viewed">
            <BoardGrid boards={recent} />
          </Section>
        )}
        <Stack space="space.200">
          <Heading size="xsmall" as="h2" color="color.text">
            YOUR WORKSPACES
          </Heading>
          <Inline spread="space-between" alignBlock="center" shouldWrap rowSpace="space.150">
            <Inline space="space.150" alignBlock="center">
              <MemberAvatar name={workspace.name} appearance="square" size="medium" />
              <Heading size="small" as="h3">
                {workspace.name}
              </Heading>
            </Inline>
            <Inline space="space.100" shouldWrap>
              <LinkButton href={paths.boards()} iconBefore={BoardsIcon}>
                Boards
              </LinkButton>
              <LinkButton href={paths.settings('members')} iconBefore={PersonIcon}>
                Members
              </LinkButton>
              <LinkButton href={paths.settings('workspace')} iconBefore={SettingsIcon}>
                Settings
              </LinkButton>
            </Inline>
          </Inline>
          <BoardGrid boards={open}>
            <CreateBoardTile onClick={openCreateBoard} />
          </BoardGrid>
          <Box>
            <Button onClick={() => setClosedOpen(true)}>View all closed boards</Button>
          </Box>
        </Stack>
      </Stack>
      <ModalTransition>
        {isClosedOpen && <ClosedBoardsDialog boards={closed} onClose={() => setClosedOpen(false)} />}
      </ModalTransition>
    </Box>
  )
}

function ClosedBoardsDialog({ boards, onClose }: { boards: Board[]; onClose: () => void }) {
  const dispatch = useDispatch()
  return (
    <Modal onClose={onClose} width="medium">
      <ModalHeader hasCloseButton>
        <ModalTitle>Closed boards</ModalTitle>
      </ModalHeader>
      <ModalBody>
        {boards.length === 0 ? (
          <Text color="color.text.subtle">No closed boards. Close a board from its board menu to hide it from your workspace.</Text>
        ) : (
          boards.map((board) => (
            <Box key={board.id} xcss={styles.row}>
              <BoardSwatch accent={board.accent} />
              <Box xcss={styles.grow}>
                <Text weight="medium">{board.title}</Text>
              </Box>
              <Button spacing="compact" onClick={() => dispatch({ type: 'board/setClosed', boardId: board.id, isClosed: false })}>
                Reopen
              </Button>
            </Box>
          ))
        )}
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Done</Button>
      </ModalFooter>
    </Modal>
  )
}

function Section({ icon: Icon, title, children }: { icon: ComponentType<NewCoreIconProps>; title: string; children: ReactNode }) {
  return (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center">
        <Icon label="" color={token('color.icon')} />
        <Heading size="small" as="h2">
          {title}
        </Heading>
      </Inline>
      {children}
    </Stack>
  )
}

function BoardGrid({ boards, children }: { boards: Board[]; children?: ReactNode }) {
  return (
    <Grid xcss={styles.grid} gap="space.200" as="ul" role="list">
      {boards.map((board) => (
        <Box as="li" key={board.id} xcss={styles.item}>
          <BoardTile board={board} />
        </Box>
      ))}
      {children && (
        <Box as="li" xcss={styles.item}>
          {children}
        </Box>
      )}
    </Grid>
  )
}
