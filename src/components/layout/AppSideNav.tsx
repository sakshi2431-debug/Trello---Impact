import { cssMap } from '@atlaskit/css'
import ActivityIcon from '@atlaskit/icon/core/pulse'
import BoardsIcon from '@atlaskit/icon/core/boards'
import CardIcon from '@atlaskit/icon/core/card'
import DownloadIcon from '@atlaskit/icon/core/download'
import HomeIcon from '@atlaskit/icon/core/home'
import PeopleGroupIcon from '@atlaskit/icon/core/people-group'
import PersonAvatarIcon from '@atlaskit/icon/core/person-avatar'
import SettingsIcon from '@atlaskit/icon/core/settings'
import TemplateIcon from '@atlaskit/icon/core/screen-plus'
import { SideNav, SideNavBody } from '@atlaskit/navigation-system/layout/side-nav'
import { Box } from '@atlaskit/primitives/compiled/box'
import {
  ExpandableMenuItem,
  ExpandableMenuItemContent,
  ExpandableMenuItemTrigger,
} from '@atlaskit/side-nav-items/expandable-menu-item'
import { LinkMenuItem } from '@atlaskit/side-nav-items/link-menu-item'
import { MenuList } from '@atlaskit/side-nav-items/menu-list'
import { Divider, MenuSection, MenuSectionHeading } from '@atlaskit/side-nav-items/menu-section'
import { token } from '@atlaskit/tokens'
import { paths, type Route, type SettingsSection } from '../../router'
import { useAppState } from '../../state/store'
import { MemberAvatar } from '../common/MemberAvatar'

const styles = cssMap({
  top: { paddingBlockStart: token('space.200') },
})

/** Boards, Templates and Home, then the Workspace — the redesigned Trello home sidebar. */
export function HomeSideNav({ route }: { route: Route }) {
  const { workspace } = useAppState()
  return (
    <SideNav label="Trello navigation">
      <SideNavBody>
        <Box xcss={styles.top}>
          <MenuList>
            <LinkMenuItem href={paths.boards()} elemBefore={<BoardsIcon label="" color="currentColor" />} isSelected={route.name === 'boards'}>
              Boards
            </LinkMenuItem>
            <LinkMenuItem href={paths.templates()} elemBefore={<TemplateIcon label="" color="currentColor" />} isSelected={route.name === 'templates'}>
              Templates
            </LinkMenuItem>
            <LinkMenuItem href={paths.home()} elemBefore={<HomeIcon label="" color="currentColor" />} isSelected={route.name === 'home'}>
              Home
            </LinkMenuItem>
          </MenuList>
        </Box>
        <Divider />
        <MenuSection>
          <MenuSectionHeading>Workspaces</MenuSectionHeading>
          <MenuList>
            <ExpandableMenuItem isDefaultExpanded={false}>
              <ExpandableMenuItemTrigger elemBefore={<MemberAvatar name={workspace.name} appearance="square" size="small" />}>
                {workspace.name}
              </ExpandableMenuItemTrigger>
              <ExpandableMenuItemContent>
                <LinkMenuItem href={paths.boards()} elemBefore={<BoardsIcon label="" color="currentColor" />}>
                  Boards
                </LinkMenuItem>
                <LinkMenuItem href={paths.settings('members')} elemBefore={<PeopleGroupIcon label="" color="currentColor" />}>
                  Members
                </LinkMenuItem>
                <LinkMenuItem href={paths.settings('workspace')} elemBefore={<SettingsIcon label="" color="currentColor" />}>
                  Settings
                </LinkMenuItem>
              </ExpandableMenuItemContent>
            </ExpandableMenuItem>
          </MenuList>
        </MenuSection>
      </SideNavBody>
    </SideNav>
  )
}

const personal: { section: SettingsSection; label: string; icon: typeof BoardsIcon }[] = [
  { section: 'profile', label: 'Profile and visibility', icon: PersonAvatarIcon },
  { section: 'activity', label: 'Activity', icon: ActivityIcon },
  { section: 'cards', label: 'Cards', icon: CardIcon },
  { section: 'preferences', label: 'Settings', icon: SettingsIcon },
]

const workspaceItems: { section: SettingsSection; label: string; icon: typeof BoardsIcon }[] = [
  { section: 'members', label: 'Members', icon: PeopleGroupIcon },
  { section: 'workspace', label: 'Settings', icon: SettingsIcon },
  { section: 'export', label: 'Export', icon: DownloadIcon },
]

/** Personal and Workspace settings, as in Trello's settings screens. */
export function SettingsSideNav({ section }: { section: SettingsSection }) {
  const { workspace } = useAppState()
  return (
    <SideNav label="Settings navigation">
      <SideNavBody>
        <Box xcss={styles.top}>
          <MenuSection>
            <MenuSectionHeading>Personal settings</MenuSectionHeading>
            <MenuList>
              {personal.map(({ section: s, label, icon: Icon }) => (
                <LinkMenuItem key={s} href={paths.settings(s)} elemBefore={<Icon label="" color="currentColor" />} isSelected={section === s}>
                  {label}
                </LinkMenuItem>
              ))}
            </MenuList>
          </MenuSection>
        </Box>
        <Divider />
        <MenuSection>
          <MenuSectionHeading>Workspace</MenuSectionHeading>
          <MenuList>
            <LinkMenuItem href={paths.boards()} elemBefore={<MemberAvatar name={workspace.name} appearance="square" size="small" />}>
              {workspace.name}
            </LinkMenuItem>
            <LinkMenuItem href={paths.boards()} elemBefore={<BoardsIcon label="" color="currentColor" />}>
              Boards
            </LinkMenuItem>
            {workspaceItems.map(({ section: s, label, icon: Icon }) => (
              <LinkMenuItem key={s} href={paths.settings(s)} elemBefore={<Icon label="" color="currentColor" />} isSelected={section === s}>
                {label}
              </LinkMenuItem>
            ))}
          </MenuList>
        </MenuSection>
      </SideNavBody>
    </SideNav>
  )
}
