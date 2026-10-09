/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { test as setup, expect } from '@playwright/test'

const user = process.env.A11Y_USER ?? 'admin'
const password = process.env.A11Y_PASSWORD ?? 'admin123'

// Log in once and re-use the session in the `pages` project
setup('log in', async ({ page }) => {
	await page.goto('/login')
	await page.locator('input[name="user"]').fill(user)
	await page.locator('input[name="password"]').fill(password)
	await page.locator('button[type="submit"], input[type="submit"]').first().click()
	await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 })
	await expect(page.locator('#header, header').first()).toBeVisible()

	await page.context().storageState({ path: '.auth/user.json' })
})
