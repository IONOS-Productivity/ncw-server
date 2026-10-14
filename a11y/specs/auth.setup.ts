/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { test as setup, expect } from '@playwright/test'
import { getPathPrefix } from '../helpers/instance'

const user = process.env.A11Y_USER ?? 'admin'
const password = process.env.A11Y_PASSWORD ?? 'admin'

// Log in once and re-use the session in the `pages` project
setup('log in', async ({ page }) => {
	const prefix = await getPathPrefix()
	await page.goto(`${prefix}/login`)
	await page.locator('input[name="user"]').fill(user)
	await page.locator('input[name="password"]').fill(password)
	await page.locator('button[type="submit"], input[type="submit"]').first().click()

	// success = we leave /login; failure = the login form stays and shows an error. Do not wait 30 s for the latter.
	const outcome = await Promise.race([
		page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 30_000 }).then(() => 'ok' as const),
		page.getByText(/wrong login or password|login failed|account (is )?disabled|too many/i).first()
			.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'rejected' as const),
	])
	if (outcome === 'rejected') {
		throw new Error(
			`Login as "${user}" was rejected. Set A11Y_USER / A11Y_PASSWORD to a valid account `
			+ '(admin rights are needed for the admin-overview test; accounts with 2FA/SSO cannot be used).',
		)
	}

	await expect(page.locator('#header, header').first()).toBeVisible()
	await page.context().storageState({ path: '.auth/user.json' })
})
