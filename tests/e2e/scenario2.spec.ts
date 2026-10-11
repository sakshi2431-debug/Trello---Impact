import { expect, test, type Page } from '@playwright/test'
import { button, openCard } from './helpers'

const SENTENCE = 'Accessibility review must now include the mobile signup flow.'

async function editDescription(page: Page) {
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click()
  const box = page.getByRole('textbox', { name: 'Description' })
  await box.fill(`${await box.inputValue()}\n\n${SENTENCE}`)
  await expect(page.getByText('Unsaved changes').first()).toBeVisible()
  await button(page, 'Review impact').click()
}

test('Linked: proposes editing Accessibility review with Before and After', async ({ page }) => {
  await openCard(page, 'c-launch-launch', '?scenario=2')
  await editDescription(page)
  await expect(page.getByText('1 card may need attention')).toBeVisible()
  await expect(page.getByText('Accessibility review may not cover the mobile signup flow.')).toBeVisible()
  await expect(page.getByText('Basis: Morgan linked the two cards · You are a member of Accessibility review')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Update Accessibility review description' })).toBeChecked()
  await button(page, 'Apply 2 actions').click()
  await expect(page.getByText('2 actions completed')).toBeVisible()
  await expect(page.getByText('No owner question outstanding.')).toBeVisible()
})

test('Not linked: only asks Morgan', async ({ page }) => {
  await openCard(page, 'c-launch-launch', '?scenario=2-unlinked')
  await editDescription(page)
  await expect(page.getByText('1 card may be related')).toBeVisible()
  await expect(page.getByText('@Morgan, the launch requirement now includes the mobile signup flow. Should Accessibility review cover it?')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /Update Accessibility review/ })).toHaveCount(0)
  await button(page, 'Apply 2 actions').click()
  await expect(page.getByText('Question posted.')).toBeVisible()
})

test('Closing keeps the edit and the review (rule 8)', async ({ page }) => {
  await openCard(page, 'c-launch-launch', '?scenario=2')
  await editDescription(page)
  await button(page, 'Close card').click()
  await button(page, 'Keep draft and close').click()
  await page.waitForTimeout(400)
  await openCard(page, 'c-launch-launch', '?scenario=2')
  await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue(new RegExp(SENTENCE))
  await expect(button(page, 'Apply 2 actions')).toBeVisible()
})
