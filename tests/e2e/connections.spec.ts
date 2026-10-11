import { expect, test } from '@playwright/test'
import { button, openCard } from './helpers'

async function openImpact(page: import('@playwright/test').Page, query = '') {
  await openCard(page, 'c-launch-launch', query)
  await button(page, 'Impact').click()
  await expect(page.getByText(/2 cards may need attention · Checked Marketing launch board/)).toBeVisible()
}

test('A card with no review offers questions with checkboxes and Apply', async ({ page }) => {
  await openImpact(page)
  await expect(page.getByRole('checkbox', { name: 'Post comment on Set up analytics' })).toBeChecked()
  await expect(page.getByText('Posts 2 comments.')).toBeVisible()
  await button(page, 'Apply 2 actions').click()
  await expect(page.getByText('2 Impact actions completed.')).toBeVisible()
  await button(page, 'Done').click()
  await expect(page.getByText('Already followed up')).toBeVisible()
})

test('A failed action holds the rest; Retry runs them in order', async ({ page }) => {
  await openImpact(page, '?impact=creation-failed')
  await button(page, 'Apply 2 actions').click()
  await expect(page.getByText('Not posted · Trello did not respond')).toBeVisible()
  await expect(page.getByText('Not run · Waits for the step before it')).toBeVisible()
  await button(page, 'Retry 2 actions').click()
  await expect(page.getByText('2 Impact actions completed.')).toBeVisible()
})

test('An unknown outcome is checked, never retried blindly', async ({ page }) => {
  await openImpact(page, '?impact=outcome-unknown')
  await button(page, 'Apply 2 actions').click()
  await expect(page.getByText('Status unknown · It may or may not have posted')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Retry/ })).toHaveCount(0)
  await button(page, 'Check status').click()
  await expect(page.getByText('2 Impact actions completed.')).toBeVisible()
})
