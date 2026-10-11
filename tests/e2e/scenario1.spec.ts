import { expect, test } from '@playwright/test'
import { button, openBoard, openCard, settle } from './helpers'

test('Add card still works without Impact (rule 1)', async ({ page }) => {
  await openBoard(page)
  await page.getByRole('button', { name: 'Add a card' }).first().click()
  await page.keyboard.type('Plain card')
  await button(page, 'Add card').click()
  await expect(page.getByText('Plain card')).toBeVisible()
})

test('Scenario 1: new work arrives, end to end', async ({ page }) => {
  await openBoard(page)
  await page.getByRole('button', { name: 'Add a card' }).first().click()
  await page.keyboard.type('Accessibility review')
  await button(page, 'Review impact').click()
  await expect(page.getByText('Checking this board…')).toBeVisible()

  // Review: own change first with no checkbox, two questions, one AI disclaimer.
  await expect(page.getByText('2 cards may need attention · Checked Marketing launch board ·')).toBeVisible()
  await expect(page.getByText('In To do · Always included')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Create Accessibility review' })).toHaveCount(0)
  await expect(page.getByText('@Morgan, should we link the new Accessibility review task to the existing accessibility requirement?')).toBeVisible()
  await expect(page.getByText('Suggestions are AI generated and can be wrong. Nothing changes until you apply.')).toHaveCount(1)

  // Why? separates the quoted source from the interpretation.
  await page.getByRole('button', { name: 'Why? Post comment on Website Launch' }).click()
  await expect(page.getByText('From Website Launch’s description')).toBeVisible()
  await expect(page.getByText('“Complete accessibility checks before launch.”')).toBeVisible()
  await button(page, 'Hide explanation').click()

  // Untick is the only way to exclude; the summary and count follow.
  await page.getByRole('checkbox', { name: 'Post comment on Release checklist' }).click({ force: true })
  await expect(page.getByText('Release checklist is left out. Tick it to include it again.')).toBeVisible()
  await expect(button(page, 'Apply 2 actions')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Post comment on Release checklist' }).click({ force: true })

  await button(page, 'Apply 3 actions').click()
  await expect(page.getByText('3 Impact actions completed.')).toBeVisible()
  await expect(page.getByText('Posted · Morgan mentioned.')).toBeVisible()
  await expect(page.getByText('Connections remain unconfirmed.')).toBeVisible()
  await button(page, 'Back to board').click()
  await expect(page.getByText('1 card created · 2 comments posted')).toBeVisible()
})

test('Owner side: only Morgan can confirm with Link cards', async ({ page }) => {
  await openBoard(page)
  await page.getByRole('button', { name: 'Add a card' }).first().click()
  await page.keyboard.type('Accessibility review')
  await button(page, 'Review impact').click()
  await button(page, 'Apply 3 actions').click()
  await button(page, 'Back to board').click()
  await settle(page)

  await openCard(page, 'c-launch-launch')
  await expect(page.getByText('Asked through an Impact review').first()).toBeVisible()
  await expect(button(page, 'Link cards')).toHaveCount(0)

  await openCard(page, 'c-launch-launch', '?as=morgan')
  await page.reload()
  await button(page, 'Link cards').click()
  await expect(page.getByText('Linked Accessibility review to this card.')).toBeVisible()
})

test('Creation failed keeps the draft and holds the comments', async ({ page }) => {
  await openBoard(page, '?impact=creation-failed')
  await page.getByRole('button', { name: 'Add a card' }).first().click()
  await page.keyboard.type('Accessibility review')
  await button(page, 'Review impact').click()
  await button(page, 'Apply 3 actions').click()
  await expect(page.getByText('Not created · Trello did not respond')).toBeVisible()
  await expect(page.getByText('Not run · Needs the new card first')).toHaveCount(2)
  await expect(page.getByText('Nothing was changed.')).toBeVisible()
  await button(page, 'Retry 3 actions').click()
  await expect(page.getByText('3 Impact actions completed.')).toBeVisible()
})
