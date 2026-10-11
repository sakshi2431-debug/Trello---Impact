import { expect, test } from '@playwright/test'
import { button, openBoard, openCard } from './helpers'

test('Link attachments refuse javascript: and add https to bare addresses', async ({ page }) => {
  await openCard(page, 'c-launch-landing')
  const attach = async (value: string) => {
    await page.getByRole('button', { name: 'Attachment', exact: true }).first().click()
    await page.locator('#attach-link').fill(value)
    await page.locator('#attach-link').press('Enter')
  }
  await attach('javascript:alert(1)')
  await expect(page.getByText('Enter a web address, such as https://example.com.')).toBeVisible()
  await expect(page.locator('#attach-link')).toHaveAttribute('aria-describedby', 'attach-link-error')
  await page.keyboard.press('Escape')
  await attach('example.com/docs')
  await expect(page.getByRole('link', { name: 'example.com/docs' })).toHaveAttribute('href', 'https://example.com/docs')
})

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('no animation while checking or applying; focus returns after Why?', async ({ page }) => {
    const running = () =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && (a.effect as KeyframeEffect | null)?.target instanceof Element && ((a.effect as KeyframeEffect).target as Element).closest('[role="dialog"]')).length)
    await openBoard(page)
    await page.getByRole('button', { name: 'Add a card' }).first().click()
    await page.keyboard.type('Accessibility review')
    await button(page, 'Review impact').click()
    await expect(page.getByText('Checking this board…')).toBeVisible()
    expect(await running()).toBe(0)
    await page.getByRole('button', { name: 'Why? Post comment on Website Launch' }).click()
    await button(page, 'Hide explanation').click()
    await expect(page.getByRole('button', { name: 'Why? Post comment on Website Launch' })).toBeFocused()
    await button(page, 'Apply 3 actions').click()
    await expect(page.getByText('Creating…')).toBeVisible()
    expect(await running()).toBe(0)
  })
})
