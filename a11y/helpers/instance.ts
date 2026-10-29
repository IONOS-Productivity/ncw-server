/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { request as playwrightRequest, type Page } from '@playwright/test'

/** Address of the Nextcloud instance under test */
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080'

let prefixPromise: Promise<string> | undefined

/**
 * URL prefix of the instance: `''` when pretty URLs work (`/login`), `'/index.php'` when they do not.
 * Detected once per worker; `A11Y_PATH_PREFIX` overrides the detection.
 */
export function getPathPrefix(): Promise<string> {
	if (process.env.A11Y_PATH_PREFIX !== undefined) {
		return Promise.resolve(process.env.A11Y_PATH_PREFIX)
	}

	prefixPromise ??= (async () => {
		// own, cookie-less context: with a logged-in session /login would redirect into the app.
		// The explicit empty storageState matters: the test runner would otherwise apply the project's saved session.
		const request = await playwrightRequest.newContext({
			baseURL: BASE_URL,
			storageState: { cookies: [], origins: [] },
		})
		const problems: string[] = []
		for (const prefix of ['', '/index.php']) {
			const response = await request.get(`${prefix}/login`).catch((error: Error) => {
				throw new Error(`Cannot reach the Nextcloud instance (BASE_URL): ${error.message}`)
			})
			const body = await response.text()
			if (/untrusted domain/i.test(body)) {
				await request.dispose()
				throw new Error(
					'Nextcloud rejects this host as an untrusted domain. Add it with '
					+ '`php occ config:system:set trusted_domains 1 --value=<host:port>` or change BASE_URL.',
				)
			}
			if (!response.ok()) {
				problems.push(`${prefix}/login -> HTTP ${response.status()}`)
				continue
			}
			// the form itself is rendered by JS, but the login page's <body> is marked in the server HTML
			if (!body.includes('id="body-login"')) {
				problems.push(`${prefix}/login did not return a login form, got: "${body.replace(/\s+/g, ' ').slice(0, 160)}"`)
				continue
			}
			// a redirect to /index.php/login also means: no pretty URLs
			const detected = new URL(response.url()).pathname.startsWith('/index.php') ? '/index.php' : prefix
			await request.dispose()
			return detected
		}
		await request.dispose()
		throw new Error(`Could not find the Nextcloud login page (${problems.join('; ')}). Check BASE_URL.`)
	})()

	return prefixPromise
}

/** Close first-run wizards / news dialogs that would cover the page and pollute the scan. */
export async function dismissOverlays(page: Page) {
	const overlay = page.locator('.modal-mask:visible, [role="dialog"]:visible').first()
	if (await overlay.isVisible().catch(() => false)) {
		await page.keyboard.press('Escape')
		await overlay.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {})
	}
}
