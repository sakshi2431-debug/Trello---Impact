import { expect, test } from '@playwright/test'
import { button, changeDue, openCard } from './helpers'

test('Moving Legal Approval to Nov 6 asks Ana and keeps the announcement date', async ({ page }) => {
  await openCard(page, 'c-launch-legal')
  await changeDue(page, /Nov 4, 3:36 AM/, '11/06/2026')
  await expect(page.getByText('1 card may need attention · Checked Marketing launch board ·')).toBeVisible()
  await expect(
    page.getByText(
      '@Ana, Legal Approval is now due Nov 6. If preparation still needs five working days afterward, Partner announcement may be ready Nov 13, one day after its current due date. Should we adjust the date?',
    ),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Why? Post comment on Partner announcement' }).click()
  await button(page, 'View calculation').click()
  await expect(page.getByText('Counted working days: Nov 9, 10, 11, 12, 13.')).toBeVisible()
  await button(page, 'Apply 2 actions').click()
  await expect(page.getByText('Partner announcement is still due Nov 12.')).toBeVisible()
})

test('A later date follows the chain across lists', async ({ page }) => {
  await openCard(page, 'c-launch-copy')
  await changeDue(page, /^Oct 26/, '11/02/2026')
  await expect(page.getByText(/^3 cards may need attention/)).toBeVisible()
  await expect(page.getByText(/Through Build landing page \(may move to Nov 4\), then Set up analytics \(may move to Nov 5\), Website Launch may slip to Nov 5/)).toBeVisible()
  await page.getByRole('button', { name: 'Why? Post comment on Website Launch' }).click()
  await expect(page.getByText('How it reaches Website Launch')).toBeVisible()
  await expect(page.getByText('Comes after Set up analytics · may move to Nov 5, due Nov 4')).toBeVisible()
  await expect(button(page, 'Apply 4 actions')).toBeVisible()
})

test('Finishing a card early shows the flag; Review impact and Reopen', async ({ page }) => {
  await openCard(page, 'c-launch-landing')
  await page.getByRole('button', { name: 'Mark complete' }).first().click()
  await expect(page.getByText('Build landing page marked complete')).toBeVisible()
  await expect(page.getByText('It depends on Final homepage copy, which isn’t done yet.')).toBeVisible()
  await button(page, 'Review impact').click()
  await expect(page.getByText('Finished before 1 card it depends on')).toBeVisible()
  const reopen = page.getByRole('checkbox', { name: 'Reopen Build landing page' })
  await expect(reopen).not.toBeChecked()
  await reopen.click({ force: true })
  await button(page, 'Apply 3 actions').click()
  await expect(page.getByText('Reopened · Marked incomplete.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mark complete' }).first()).toBeVisible()
})

test('Undo on the early-finish flag reverts the completion', async ({ page }) => {
  await openCard(page, 'c-launch-qa')
  await page.getByRole('button', { name: 'Mark complete' }).first().click()
  await expect(page.getByText('It depends on Release checklist, which isn’t done yet.')).toBeVisible()
  await button(page, 'Undo').click()
  await expect(page.getByRole('button', { name: 'Mark complete' }).first()).toBeVisible()
})
