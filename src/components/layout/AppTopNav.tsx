import { useState } from 'react'
import { cssMap } from '@atlaskit/css'
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu'
import Heading from '@atlaskit/heading'
import MegaphoneIcon from '@atlaskit/icon/core/megaphone'
import QuestionCircleIcon from '@atlaskit/icon/core/question-circle'
import Link from '@atlaskit/link'
import { TrelloIcon } from '@atlaskit/logo/trello-icon'
import { ButtonItem, MenuGroup, Section } from '@atlaskit/menu'
import { TopNav, TopNavEnd, TopNavMiddle, TopNavStart } from '@atlaskit/navigation-system/layout/top-nav'
import { AppLogo, AppSwitcher, CreateButton, EndItem } from '@atlaskit/navigation-system/top-nav-items'
import Popup from '@atlaskit/popup'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { navigate, paths } from '../../router'
import { useAppState } from '../../state/store'
import { useUi } from '../../state/ui'
import { BoardSwatch } from '../common/BoardSwatch'
import { NotificationsMenu } from './NotificationsMenu'
import { ProfileMenu } from './ProfileMenu'
import { SearchMenu } from './SearchMenu'

const styles = cssMap({
  panel: { width: '22rem', maxWidth: '90vw', padding: token('space.200') },
  menu: { width: '18rem', paddingBlock: token('space.100') },
  kbd: {
    paddingInline: token('space.075'),
    borderRadius: token('radius.small'),
    backgroundColor: token('color.background.neutral'),
  },
})

export function AppTopNav({ sideNavToggle }: { sideNavToggle?: React.ReactNode }) {
  return (
    <TopNav>
      <TopNavStart sideNavToggleButton={sideNavToggle ?? null}>
        <AppSwitcherMenu />
        <AppLogo href={paths.boards()} icon={TrelloIcon} name="Trello" label="Go to your boards" />
      </TopNavStart>
      <TopNavMiddle>
        <SearchMenu />
        <CreateMenu />
      </TopNavMiddle>
      <TopNavEnd>
        <WhatsNew />
        <NotificationsMenu />
        <HelpMenu />
        <ProfileMenu />
      </TopNavEnd>
    </TopNav>
  )
}

function AppSwitcherMenu() {
  const { boards, boardOrder } = useAppState()
  const [isOpen, setOpen] = useState(false)
  const recent = boardOrder
    .map((id) => boards[id])
    .filter((b) => b.lastViewedAt && !b.isClosed)
    .sort((a, b) => (b.lastViewedAt ?? 0) - (a.lastViewedAt ?? 0))
    .slice(0, 4)
  const go = (hash: string) => {
    setOpen(false)
    navigate(hash)
  }
  return (
    <Popup
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      placement="bottom-start"
      label="Switch to"
      role="dialog"
      content={() => (
        <Box xcss={styles.menu}>
          <MenuGroup menuLabel="Switch to">
            <Section title="Trello">
              <ButtonItem onClick={() => go(paths.boards())}>Boards</ButtonItem>
              <ButtonItem onClick={() => go(paths.templates())}>Templates</ButtonItem>
              <ButtonItem onClick={() => go(paths.home())}>Home</ButtonItem>
            </Section>
            {recent.length > 0 && (
              <Section title="Recent boards" hasSeparator>
                {recent.map((board) => (
                  <ButtonItem key={board.id} iconBefore={<BoardSwatch accent={board.accent} />} onClick={() => go(paths.board(board.id))}>
                    {board.title}
                  </ButtonItem>
                ))}
              </Section>
            )}
          </MenuGroup>
        </Box>
      )}
      trigger={(triggerProps) => <AppSwitcher {...triggerProps} label="Switch apps and boards" isSelected={isOpen} onClick={() => setOpen((v) => !v)} />}
    />
  )
}

function CreateMenu() {
  const { openCreateBoard } = useUi()
  return (
    <DropdownMenu placement="bottom-end" trigger={({ triggerRef, ...props }) => <CreateButton {...props} ref={triggerRef}>Create</CreateButton>}>
      <DropdownItemGroup>
        <DropdownItem description="A board is made up of cards ordered on lists. Use it to manage projects, track information, or organize anything." shouldDescriptionWrap onClick={openCreateBoard}>
          Create board
        </DropdownItem>
        <DropdownItem description="Get started faster with a board template." shouldDescriptionWrap href={paths.templates()}>
          Start with a template
        </DropdownItem>
      </DropdownItemGroup>
    </DropdownMenu>
  )
}

const updates = [
  {
    title: 'Trello Impact (prototype)',
    body: 'When you add or reschedule a card, see which other cards the change might disrupt before anything is updated.',
    link: { label: 'Open AI settings', href: paths.settings('ai') },
  },
  {
    title: 'Inbox, Planner and Board together',
    body: 'Use the bar at the bottom of a board to show Inbox and Planner beside it. Drag a card onto a Planner day to schedule it.',
  },
  {
    title: 'Coloured and collapsible lists',
    body: 'Give lists a colour from the list menu, and collapse lists you are not working in.',
  },
]

function WhatsNew() {
  const [isOpen, setOpen] = useState(false)
  return (
    <Popup
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label="What's new"
      role="dialog"
      content={() => (
        <Box xcss={styles.panel}>
          <Stack space="space.200">
            <Heading size="xsmall" as="h2">
              What’s new in Trello
            </Heading>
            {updates.map((u) => (
              <Stack key={u.title} space="space.050">
                <Text weight="semibold">{u.title}</Text>
                <Text color="color.text.subtle">{u.body}</Text>
                {u.link && (
                  <Link href={u.link.href} onClick={() => setOpen(false)}>
                    {u.link.label}
                  </Link>
                )}
              </Stack>
            ))}
          </Stack>
        </Box>
      )}
      trigger={(triggerProps) => <EndItem {...triggerProps} icon={MegaphoneIcon} label="What's new" isSelected={isOpen} onClick={() => setOpen((v) => !v)} />}
    />
  )
}

function HelpMenu() {
  const [isOpen, setOpen] = useState(false)
  return (
    <Popup
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label="Help"
      role="dialog"
      content={() => (
        <Box xcss={styles.panel}>
          <Stack space="space.200">
            <Heading size="xsmall" as="h2">
              Help
            </Heading>
            <Stack space="space.100">
              <Text weight="semibold">Keyboard shortcuts</Text>
              <Inline space="space.100" alignBlock="center">
                <Box as="span" xcss={styles.kbd}>
                  <Text size="small" weight="semibold">
                    B
                  </Text>
                </Box>
                <Text>Open the board switcher</Text>
              </Inline>
              <Inline space="space.100" alignBlock="center">
                <Box as="span" xcss={styles.kbd}>
                  <Text size="small" weight="semibold">
                    Esc
                  </Text>
                </Box>
                <Text>Close card details and popovers</Text>
              </Inline>
            </Stack>
            <Text color="color.text.subtle">
              This is a design prototype. Data is mock data saved in your browser; reset it from your profile menu.
            </Text>
          </Stack>
        </Box>
      )}
      trigger={(triggerProps) => <EndItem {...triggerProps} icon={QuestionCircleIcon} label="Help" isSelected={isOpen} onClick={() => setOpen((v) => !v)} />}
    />
  )
}
