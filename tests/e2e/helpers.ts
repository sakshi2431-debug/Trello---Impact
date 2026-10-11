import { expect, type Page } from '@playwright/test'

/** Each test has its own browser context, so it starts from the seeded Marketing launch board. */
export async function openCard(page: Page, cardId: string, query = '') {
  await page.goto(`/${query}#/c/${cardId}`)
  await expect(page.getByRole('dialog').first()).toBeVisible()
}

export async function openBoard(page: Page, query = '') {
  await page.goto(`/${query}#/b/b-launch`)
  await expect(page.getByText('Marketing launch').first()).toBeVisible()
}

export const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

/** Saves go to localStorage after a short debounce; wait for it before reloading or switching identity. */
export const settle = (page: Page) => page.waitForTimeout(400)

export async function changeDue(page: Page, current: RegExp, next: string) {
  await page.getByRole('button', { name: current }).first().click()
  const dates = page.getByRole('dialog', { name: 'Dates' })
  await dates.locator('#dates-due').fill(next)
  await dates.locator('#dates-due').blur()
  await dates.getByRole('button', { name: 'Review impact' }).click()
}
