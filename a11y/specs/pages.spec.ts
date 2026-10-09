/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { test, expect } from '@playwright/test'
import { expectNoA11yViolations } from '../helpers/axe'

/**
 * Real Nextcloud pages rendered with the IONOS theme (`enforce_theme=ionos`).
 * Same idea as the workshop's `home page has no a11y issues`, once in light and once in dark mode.
 *
 * Note: these pages contain a lot of upstream Nextcloud / third-party app markup. To see only what
 * *our* customisation breaks, run the suite twice (A11Y_LABEL=default with `enforce_theme=default`,
 * A11Y_LABEL=ionos with `enforce_theme=ionos`) and diff the findings, see README.md.
 */

interface PageCase {
	name: string
	path: string
	/** Selector that is present once the page is rendered */
	ready: string
	/** Needs the logged in session */
	auth: boolean
}

const pages: PageCase[] = [
	{ name: 'login', path: '/login', ready: 'form[name="login"], #body-login form', auth: false },
	{ name: 'files', path: '/apps/files/', ready: '[data-cy-files-list], .files-list, #app-content-vue', auth: true },
	{ name: 'personal-settings', path: '/settings/user', ready: '#app-content, #content-vue, main', auth: true },
	{ name: 'admin-overview', path: '/settings/admin/overview', ready: '#app-content, #content-vue, main', auth: true },
]

for (const scheme of ['light', 'dark'] as const) {
	test.describe(`IONOS theme pages - ${scheme} mode`, () => {
		test.use({ colorScheme: scheme })

		for (const pageCase of pages) {
			test(`${pageCase.name} has no a11y violations`, async ({ browser, page: authedPage }, testInfo) => {
				// the login page must be scanned logged out
				const context = pageCase.auth
					? undefined
					: await browser.newContext({ colorScheme: scheme, storageState: { cookies: [], origins: [] } })
				const page = context ? await context.newPage() : authedPage

				await page.goto(pageCase.path)
				await expect(page.locator(pageCase.ready).first()).toBeVisible({ timeout: 30_000 })
				// let late Vue rendering settle
				await page.waitForLoadState('networkidle').catch(() => {})

				await expectNoA11yViolations(page, testInfo, `page-${scheme}-${pageCase.name}`)
				await context?.close()
			})
		}
	})
}

/**
 * Interactive states styled by apps/theming/css/ionos/{files,buttons,sidebar}.css.
 * Static page loads never show these, so regressions in them stay invisible without explicit steps.
 */
for (const scheme of ['light', 'dark'] as const) {
	test.describe(`IONOS theme interactive states - ${scheme} mode`, () => {
		test.use({ colorScheme: scheme })

		test.beforeEach(async ({ page }) => {
			await page.goto('/apps/files/')
			await expect(page.locator('[data-cy-files-list-row]').first()).toBeVisible({ timeout: 30_000 })
		})

		test('files: "New" menu open', async ({ page }, testInfo) => {
			await page.locator('[data-cy-upload-picker] button').first().click()
			await expect(page.locator('[role="menu"]').first()).toBeVisible()
			await expectNoA11yViolations(page, testInfo, `state-${scheme}-files-new-menu`, {
				include: ['[role="menu"]'],
			})
		})

		test('files: row action menu open', async ({ page }, testInfo) => {
			await page.locator('[data-cy-files-list-row] button[aria-label="Actions"]').first().click()
			await expect(page.locator('[role="menu"]').first()).toBeVisible()
			await expectNoA11yViolations(page, testInfo, `state-${scheme}-files-row-actions`, {
				include: ['[role="menu"]'],
			})
		})

		test('files: details sidebar open', async ({ page }, testInfo) => {
			await page.locator('[data-cy-files-list-row] button[aria-label="Actions"]').first().click()
			await page.getByRole('menuitem', { name: 'Details' }).click()
			await expect(page.locator('#app-sidebar-vue, .app-sidebar').first()).toBeVisible()
			await expectNoA11yViolations(page, testInfo, `state-${scheme}-files-sidebar`, {
				include: ['#app-sidebar-vue, .app-sidebar'],
			})
		})
	})
}
