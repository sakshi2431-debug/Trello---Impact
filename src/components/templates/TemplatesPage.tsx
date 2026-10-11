import { useState } from 'react'
import { cssMap } from '@atlaskit/css'
import Heading from '@atlaskit/heading'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs'
import { token } from '@atlaskit/tokens'
import { boardTemplates, templateCategories } from '../../data/templates'
import { TemplateGrid } from './TemplateGallery'

const styles = cssMap({
  page: { maxWidth: '58rem', marginInline: 'auto', paddingBlock: token('space.400'), paddingInline: token('space.400') },
  panel: { paddingBlockStart: token('space.200'), width: '100%' },
})

const tabs = ['All', ...templateCategories] as const

export function TemplatesPage() {
  const [selected, setSelected] = useState(0)
  return (
    <Box xcss={styles.page}>
      <Stack space="space.300">
        <Stack space="space.100">
          <Heading size="large" as="h1">
            Templates
          </Heading>
          <Text color="color.text.subtle">Get going faster with a board template. Each one creates a new board with lists and starter cards.</Text>
        </Stack>
        <Tabs id="template-categories" selected={selected} onChange={setSelected}>
          <TabList>
            {tabs.map((t) => (
              <Tab key={t}>{t}</Tab>
            ))}
          </TabList>
          {tabs.map((t) => (
            <TabPanel key={t}>
              <Box xcss={styles.panel}>
                <TemplateGrid templates={t === 'All' ? boardTemplates : boardTemplates.filter((b) => b.category === t)} />
              </Box>
            </TabPanel>
          ))}
        </Tabs>
      </Stack>
    </Box>
  )
}
