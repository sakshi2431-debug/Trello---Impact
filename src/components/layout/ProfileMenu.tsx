import { useCallback, useState } from 'react'
import Button from '@atlaskit/button/new'
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu'
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog'
import { EndItem } from '@atlaskit/navigation-system/top-nav-items'
import { Text } from '@atlaskit/primitives/compiled/text'
import { membersById } from '../../data/members'
import { navigate, paths } from '../../router'
import { resetStoredState, useAppState, useDispatch } from '../../state/store'
import { MemberAvatar } from '../common/MemberAvatar'

export function ProfileMenu() {
  const { currentUserId } = useAppState()
  const dispatch = useDispatch()
  const [isResetOpen, setResetOpen] = useState(false)
  const me = membersById[currentUserId]
  // Same as the navigation Profile item, but with Trello's initials avatar instead of a photo.
  const ProfileAvatar = useCallback(() => <MemberAvatar name={me.fullName} size="small" />, [me.fullName])

  return (
    <>
      <DropdownMenu
        placement="bottom-end"
        trigger={({ triggerRef, ...props }) => <EndItem {...props} ref={triggerRef} icon={ProfileAvatar} label="Your profile and settings" />}
      >
        <DropdownItemGroup title="Account">
          <DropdownItem elemBefore={<MemberAvatar name={me.fullName} size="medium" />} description={me.email} href={paths.settings('profile')}>
            {me.fullName}
          </DropdownItem>
        </DropdownItemGroup>
        <DropdownItemGroup hasSeparator>
          <DropdownItem href={paths.settings('profile')}>Profile and visibility</DropdownItem>
          <DropdownItem href={paths.settings('activity')}>Activity</DropdownItem>
          <DropdownItem href={paths.settings('cards')}>Cards</DropdownItem>
          <DropdownItem href={paths.settings('preferences')}>Settings</DropdownItem>
        </DropdownItemGroup>
        <DropdownItemGroup hasSeparator>
          <DropdownItem onClick={() => setResetOpen(true)}>Reset demo data</DropdownItem>
        </DropdownItemGroup>
      </DropdownMenu>
      <ModalTransition>
        {isResetOpen && (
          <Modal onClose={() => setResetOpen(false)} width="small">
            <ModalHeader>
              <ModalTitle appearance="warning">Reset demo data?</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <Text as="p">All boards, cards and changes you made in this browser will be replaced with the original mock data.</Text>
            </ModalBody>
            <ModalFooter>
              <Button appearance="subtle" onClick={() => setResetOpen(false)}>
                Cancel
              </Button>
              <Button
                appearance="warning"
                onClick={() => {
                  dispatch({ type: 'reset', state: resetStoredState() })
                  setResetOpen(false)
                  navigate(paths.boards())
                }}
              >
                Reset
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>
    </>
  )
}
