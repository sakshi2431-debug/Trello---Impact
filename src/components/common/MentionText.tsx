import { Fragment } from 'react'
import { cssMap } from '@atlaskit/css'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Text } from '@atlaskit/primitives/compiled/text'
import { token } from '@atlaskit/tokens'
import { members } from '../../data/members'
import { useAppState } from '../../state/store'

const styles = cssMap({
  // Mentions use the ADS link color, like links, so a tagged person stands out from the surrounding text.
  mention: { color: token('color.link'), fontWeight: token('font.weight.medium') },
})

/** Comment text with each @name of a board member shown in the link color. Other text is unchanged. */
export function MentionText({ text, boardId }: { text: string; boardId: string }) {
  const boardMembers = useAppState().boards[boardId]?.memberIds ?? []
  const names = new Set(members.filter((m) => boardMembers.includes(m.id)).map((m) => m.fullName.split(' ')[0].toLowerCase()))
  const parts = text.split(/(@[\p{L}]+)/u)
  return (
    <Text>
      {parts.map((part, i) =>
        part.startsWith('@') && names.has(part.slice(1).toLowerCase()) ? (
          <Box key={i} as="span" xcss={styles.mention}>
            {part}
          </Box>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </Text>
  )
}
