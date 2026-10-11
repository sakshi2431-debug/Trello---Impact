import type { ReactNode } from 'react'
import { IconButton } from '@atlaskit/button/new'
import { cssMap } from '@atlaskit/css'
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu'
import AttachmentIcon from '@atlaskit/icon/core/attachment'
import LinkIcon from '@atlaskit/icon/core/link'
import ShowMoreHorizontalIcon from '@atlaskit/icon/core/show-more-horizontal'
import Link from '@atlaskit/link'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Inline } from '@atlaskit/primitives/compiled/inline'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { formatBytes, formatRelativeTime } from '../../lib/dates'
import { navigate, paths } from '../../router'
import { useScreenBoardId } from '../../state/screen'
import { useAppState, useDispatch } from '../../state/store'
import type { Attachment, Card } from '../../types'
import { BoardSwatch } from '../common/BoardSwatch'
import { LabelChip } from '../common/LabelChip'
import { SectionHeading } from './SectionHeading'
import { safeLinkUrl } from '../../lib/urls'

const styles = cssMap({
  body: { paddingInlineStart: token('space.400') },
  linkedCard: {
    display: 'block',
    width: '100%',
    maxWidth: '16rem',
    textAlign: 'start',
    padding: token('space.150'),
    borderRadius: token('radius.large'),
    backgroundColor: token('elevation.surface.raised'),
    boxShadow: token('elevation.shadow.raised'),
    '&:hover': { backgroundColor: token('elevation.surface.raised.hovered') },
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: token('space.100'),
    paddingBlock: token('space.050'),
    paddingInlineStart: token('space.100'),
    paddingInlineEnd: token('space.050'),
    borderRadius: token('radius.medium'),
    borderWidth: token('border.width'),
    borderStyle: 'solid',
    borderColor: token('color.border'),
  },
  fileRow: { display: 'flex', alignItems: 'center', gap: token('space.150') },
  thumb: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '4rem',
    height: '3rem',
    borderRadius: token('radius.small'),
    backgroundColor: token('color.background.neutral'),
  },
  grow: { flexGrow: 1, minWidth: 0 },
})

export function CardAttachments({ card, addButton }: { card: Card; addButton: ReactNode }) {
  const dispatch = useDispatch()
  if (card.attachments.length === 0) return null
  const remove = (attachment: Attachment) => () => dispatch({ type: 'card/removeAttachment', cardId: card.id, attachmentId: attachment.id })
  const linkedCards = card.attachments.filter((a) => a.kind === 'card')
  const links = card.attachments.filter((a) => a.kind === 'link')
  const files = card.attachments.filter((a) => a.kind !== 'card' && a.kind !== 'link')

  return (
    <Stack space="space.150">
      <SectionHeading icon={AttachmentIcon} title="Attachments" actions={addButton} />
      <Box xcss={styles.body}>
        <Stack space="space.200">
          {linkedCards.length > 0 && (
            <AttachmentGroup title="Trello cards">
              {linkedCards.map((a) => (
                <LinkedCard key={a.id} attachment={a} onRemove={remove(a)} />
              ))}
            </AttachmentGroup>
          )}
          {links.length > 0 && (
            <AttachmentGroup title="Links">
              {links.map((a) => (
                <Box key={a.id} xcss={styles.linkRow}>
                  <LinkIcon label="" color={token('color.icon.brand')} />
                  <Box xcss={styles.grow}>
                    {safeLinkUrl(a.url) ? (
                      <Link href={safeLinkUrl(a.url)!} target="_blank">
                        {a.name}
                      </Link>
                    ) : (
                      <Text maxLines={1}>{a.name}</Text>
                    )}
                  </Box>
                  <AttachmentMenu name={a.name} onRemove={remove(a)} />
                </Box>
              ))}
            </AttachmentGroup>
          )}
          {files.length > 0 && (
            <AttachmentGroup title="Files">
              {files.map((a) => (
                <Box key={a.id} xcss={styles.fileRow}>
                  <Box xcss={styles.thumb}>
                    <Text size="small" weight="bold" color="color.text.subtle">
                      {a.kind.toUpperCase().slice(0, 4)}
                    </Text>
                  </Box>
                  <Box xcss={styles.grow}>
                    <Stack space="space.025">
                      <Text weight="semibold" maxLines={1}>
                        {a.name}
                      </Text>
                      <Text size="small" color="color.text.subtle">
                        {[`Added ${formatRelativeTime(a.addedAt)}`, a.sizeBytes ? formatBytes(a.sizeBytes) : null].filter(Boolean).join(' · ')}
                      </Text>
                    </Stack>
                  </Box>
                  <AttachmentMenu name={a.name} onRemove={remove(a)} />
                </Box>
              ))}
            </AttachmentGroup>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}

function AttachmentGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack space="space.100">
      <Text size="small" weight="semibold" color="color.text.subtle">
        {title}
      </Text>
      {children}
    </Stack>
  )
}

function AttachmentMenu({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <DropdownMenu
      placement="bottom-end"
      trigger={({ triggerRef, ...props }) => (
        <IconButton {...props} ref={triggerRef} spacing="compact" icon={ShowMoreHorizontalIcon} label={`Actions for ${name}`} />
      )}
    >
      <DropdownItemGroup>
        <DropdownItem onClick={onRemove}>Remove</DropdownItem>
      </DropdownItemGroup>
    </DropdownMenu>
  )
}

/** A linked card renders as a mini card front, like Trello's card attachments. */
function LinkedCard({ attachment, onRemove }: { attachment: Attachment; onRemove: () => void }) {
  const { cards, boards } = useAppState()
  const screenBoardId = useScreenBoardId()
  const linked = attachment.cardId ? cards[attachment.cardId] : undefined
  const board = linked ? boards[linked.boardId] : undefined
  if (!linked || !board) {
    return (
      <Inline space="space.100" alignBlock="center">
        <Text color="color.text.subtle">{`${attachment.name} (card deleted)`}</Text>
        <AttachmentMenu name={attachment.name} onRemove={onRemove} />
      </Inline>
    )
  }
  const labels = linked.labelIds.map((id) => board.labels.find((l) => l.id === id)).filter((l) => l !== undefined)
  return (
    <Inline space="space.100" alignBlock="start">
      <Pressable
        xcss={styles.linkedCard}
        onClick={() => navigate(paths.card(linked.id, screenBoardId && screenBoardId !== linked.boardId ? screenBoardId : undefined))}
      >
        <Stack space="space.100">
          <Inline space="space.075" alignBlock="center">
            <BoardSwatch accent={board.accent} />
            <Text size="small" weight="semibold" maxLines={1}>
              {board.title}
            </Text>
          </Inline>
          {labels.length > 0 && (
            <Inline space="space.050" shouldWrap>
              {labels.map((label) => (
                <LabelChip key={label.id} label={label} size="bar" />
              ))}
            </Inline>
          )}
          <Text>{linked.title}</Text>
        </Stack>
      </Pressable>
      <AttachmentMenu name={linked.title} onRemove={onRemove} />
    </Inline>
  )
}
