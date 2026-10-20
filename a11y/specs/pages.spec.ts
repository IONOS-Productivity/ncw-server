/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { test, expect, type Page } from '@playwright/test'
import { expectNoA11yViolations, expectReadable } from '../helpers/axe'
import { dismissOverlays, getPathPrefix } from '../helpers/instance'

/**
 * Real Nextcloud pages rendered with the IONOS theme (`enforce_theme=ionos`).
 * Same idea as the workshop's `home page has no a11y issues`, once in light and once in dark mode.
 *
 * By default only the rules a theme can break are checked (A11Y_SCOPE=theme: colour contrast, links distinguishable
 * from text). A11Y_SCOPE=full runs all WCAG A/AA rules; those pages contain a lot of upstream Nextcloud markup
 * (e.g. the hidden upload <input> in Files has no label), so use the baseline diff below with it. To see only what
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
	{ name: 'admin-settings', path: '/settings/admin', ready: '#app-content, #content-vue, main', auth: true },
]

/**
 * Open the "..." menu of the first file row. Language independent: the toggle is the row's button that
 * opens a menu (its label is translated, e.g. "Actions" / "Aktionen").
 */
async function openRowActions(page: Page) {
	await page.locator('[data-cy-files-list-row]:first-child [data-cy-files-list-row-actions] button[aria-haspopup="menu"]').click()
}

for (const scheme of ['light', 'dark'] as const) {
	test.describe(`IONOS theme pages - ${scheme} mode`, () => {
		test.use({ colorScheme: scheme })

		for (const pageCase of pages) {
			test(`${pageCase.name} has no a11y violations`, async ({ browser, page: authedPage }, testInfo) => {
				const prefix = await getPathPrefix()
				// the login page must be scanned logged out
				const context = pageCase.auth
					? undefined
					: await browser.newContext({ colorScheme: scheme, storageState: { cookies: [], origins: [] } })
				const page = context ? await context.newPage() : authedPage

				const response = await test.step(`open ${pageCase.path}`, () => page.goto(`${prefix}${pageCase.path}`))
				const status = response?.status() ?? 0
				if (status >= 400) {
					await context?.close()
					// e.g. an admin page for an account without access: not an a11y finding
					test.skip(status === 403, `${pageCase.path} returned HTTP 403: Nextcloud found no admin settings this account may see here (not an admin, or the section is not available)`)
					throw new Error(`${pageCase.path} returned HTTP ${status}`)
				}

				await test.step('wait until rendered', async () => {
					await expect(page.locator(pageCase.ready).first()).toBeVisible({ timeout: 30_000 })
					// let late Vue rendering settle, but never wait for "network idle" for long:
					// pages with polling requests (notifications, status) never reach it
					await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
					await dismissOverlays(page)
				})

				await test.step('axe scan', () => expectNoA11yViolations(page, testInfo, `page-${scheme}-${pageCase.name}`))
				await context?.close()
			})
		}
	})
}

/**
 * Interactive states styled by apps/theming/css/ionos/{files,buttons}.css and the --ion-context-menu-* tokens.
 * Static page loads never show these, so regressions in them stay invisible without explicit steps.
 * Kept deliberately small (two Files menus, the second one also hovered): they are smoke checks that the tokens
 * really reach the components; the colour pairs themselves are covered by theme-tokens.spec.ts.
 */
for (const scheme of ['light', 'dark'] as const) {
	test.describe(`IONOS theme interactive states - ${scheme} mode`, () => {
		test.use({ colorScheme: scheme })

		test.beforeEach(async ({ page }) => {
			await page.goto(`${await getPathPrefix()}/apps/files/`)
			await expect(page.locator('[data-cy-files-list-row]').first()).toBeVisible({ timeout: 30_000 })
			await dismissOverlays(page)
		})

		test('files: "New" menu open', async ({ page }, testInfo) => {
			await page.locator('[data-cy-upload-picker] button').first().click()
			await expect(page.locator('[role="menu"]').first()).toBeVisible()
			await expectNoA11yViolations(page, testInfo, `state-${scheme}-files-new-menu`, {
				include: ['[role="menu"]'],
			})
		})

		test('files: row action menu open', async ({ page }, testInfo) => {
			await openRowActions(page)
			await expect(page.locator('[role="menu"]').first()).toBeVisible()
			await expectNoA11yViolations(page, testInfo, `state-${scheme}-files-row-actions`, {
				include: ['[role="menu"]'],
			})

			// The IONOS menu tokens that matter most are the hover/active ones, which a resting menu never shows.
			// axe reads the computed colours at scan time, so hovering an item makes it check the hover colours.
			await page.locator('[role="menu"] [role="menuitem"]:visible').nth(1).hover()
			await expectNoA11yViolations(page, testInfo, `state-${scheme}-files-row-actions-hover`, {
				include: ['[role="menu"]'],
			})
		})
	})
}

/**
 * Talk conversation with history, e.g. http://localhost:8080/index.php/call/<token>.
 * The token of a conversation is specific to your instance, so it is not hard-coded:
 *   A11Y_TALK_TOKEN=<token> npx playwright test --project=pages -g talk
 * Use a conversation with messages from you and from another account (own messages are styled differently).
 * The viewport is made tall so the whole history is on screen (axe only checks what it can reach).
 */
const talkToken = process.env.A11Y_TALK_TOKEN

// Talk shows a conversation only once per login session ("Duplicate session ... opened in another tab"), and every
// test here reuses the same stored session. So the light and dark test must not run in parallel: serial mode.
test.describe('IONOS theme Talk', () => {
	test.describe.configure({ mode: 'serial' })

	for (const scheme of ['light', 'dark'] as const) {
		test.describe(`${scheme} mode`, () => {
			test.use({ colorScheme: scheme, viewport: { width: 1280, height: 1800 } })

			test('talk conversation has no a11y violations', async ({ page }, testInfo) => {
				test.skip(!talkToken, 'Set A11Y_TALK_TOKEN to the token of a conversation with messages (the last part of /call/<token>)')

				const prefix = await getPathPrefix()
				const response = await test.step('open conversation', () => page.goto(`${prefix}/call/${talkToken}`))
				expect(response?.status(), `/call/${talkToken} must be reachable for this account`).toBeLessThan(400)

				await test.step('wait until messages are rendered', async () => {
					try {
						await expect(page.locator('li.message .message-body').first()).toBeVisible({ timeout: 30_000 })
					} catch (error) {
						const notes = await page.locator('[role="note"]').allInnerTexts()
						throw new Error(
							`Talk rendered no messages. Notices on the page: ${JSON.stringify(notes)}. `
							+ 'A conversation can be open only once per login session ("Duplicate session"): close other tabs that use the session of this test.',
							{ cause: error },
						)
					}
					await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
					await dismissOverlays(page)
				})

				await testInfo.attach(`talk-${scheme}.png`, { body: await page.screenshot(), contentType: 'image/png' })
				await test.step('axe scan', () => expectNoA11yViolations(page, testInfo, `page-${scheme}-talk-conversation`))

				// axe reports mention chips as "incomplete" (partly covered by their avatar), so it never judges them
				await test.step('mention chips are readable', () => expectReadable(page, testInfo, `talk-${scheme}-chips`, 'li.message .nc-chip__text'))

				// hovering an own message paints it with --color-primary-light-hover, a state the resting scan never shows
				await test.step('axe scan, own message hovered', async () => {
					await page.locator('li.message.outgoing .message-body').first().hover({ timeout: 15_000 })
					await expectNoA11yViolations(page, testInfo, `page-${scheme}-talk-conversation-hover`)
				})
			})
		})
	}
})
