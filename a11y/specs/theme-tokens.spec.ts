/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { expect, test } from '@playwright/test'
import { expectNoA11yViolations, PATH_PREFIX } from '../helpers/axe'

/**
 * Colour-contrast check of the IONOS design tokens (WCAG 1.4.3, 4.5:1 for text).
 *
 * The page under test is NOT a real Nextcloud page: it is a tiny harness that loads the
 * theme CSS exactly as the server generates it (`/apps/theming/theme/ionos.css`, i.e.
 * IonosTheme.php + apps/theming/css/ionos/*.css) and renders one sample line per
 * foreground/background token pair. axe then computes the contrast for the real,
 * resolved colours (light-dark(), var() chains, ...) in both colour schemes.
 *
 * So whenever someone touches a colour in IonosTheme.php or css/ionos/variables.css
 * this tells us which pairing stopped being readable - without having to click
 * through the whole UI.
 *
 * Disabled states are intentionally not covered: WCAG 1.4.3 exempts inactive components.
 */

interface Pair {
	group: string
	fg: string
	bg: string
	/** Optional text colour of the surface the bg token sits on (when bg is transparent) */
	note?: string
}

const pairs: Pair[] = [
	// --- Nextcloud core tokens as the IONOS theme overrides them
	{ group: 'core text', fg: '--color-main-text', bg: '--color-main-background' },
	{ group: 'core text', fg: '--color-main-text', bg: '--color-background-hover' },
	{ group: 'core text', fg: '--color-main-text', bg: '--color-background-dark' },
	{ group: 'core text', fg: '--color-text-maxcontrast', bg: '--color-main-background' },
	{ group: 'core text', fg: '--color-text-maxcontrast', bg: '--color-background-hover' },
	{ group: 'core text', fg: '--color-text-maxcontrast', bg: '--color-background-dark' },
	{ group: 'core text', fg: '--color-text-maxcontrast', bg: '--color-main-background-blur' },
	{ group: 'core primary', fg: '--color-primary-element-text', bg: '--color-primary-element' },
	{ group: 'core primary', fg: '--color-primary-element-text', bg: '--color-primary-element-hover' },
	{ group: 'core primary', fg: '--color-primary-light-text', bg: '--color-primary-light' },
	{ group: 'core primary', fg: '--color-primary-light-text', bg: '--color-primary-light-hover' },
	{ group: 'core primary', fg: '--color-primary-element-light-text', bg: '--color-primary-element-light' },
	{ group: 'core primary', fg: '--color-primary-element-light-text', bg: '--color-primary-element-light-hover' },

	// --- Talk message bubbles: own messages sit on --color-primary-light (and -hover when hovered) and use
	// --color-primary-light-text in dark mode (talk.css), i.e. the two "core primary" pairs above. Their real rendering,
	// including links, previews and mention chips, is checked by the Talk conversation test in pages.spec.ts.

	// --- Feedback colours: recommended v33 text tokens
	{ group: 'feedback (v33 tokens)', fg: '--color-text-error', bg: '--color-main-background' },
	{ group: 'feedback (v33 tokens)', fg: '--color-text-success', bg: '--color-main-background' },

	// --- Feedback colours: legacy "-text" tokens, still used by core and by IONOS error/warning buttons
	{ group: 'feedback (legacy -text tokens)', fg: '--color-error-text', bg: '--color-main-background' },
	{ group: 'feedback (legacy -text tokens)', fg: '--color-error-text', bg: '--color-error' },
	{ group: 'feedback (legacy -text tokens)', fg: '--color-warning-text', bg: '--color-main-background' },
	{ group: 'feedback (legacy -text tokens)', fg: '--color-warning-text', bg: '--color-warning' },
	{ group: 'feedback (legacy -text tokens)', fg: '--color-success-text', bg: '--color-main-background' },
	{ group: 'feedback (legacy -text tokens)', fg: '--color-success-text', bg: '--color-success' },
	{ group: 'feedback (legacy -text tokens)', fg: '--color-info-text', bg: '--color-main-background' },
	{ group: 'feedback (legacy -text tokens)', fg: '--color-info-text', bg: '--color-info' },

	// --- IONOS general text
	{ group: 'ionos text', fg: '--ion-text', bg: '--ion-surface-primary' },
	{ group: 'ionos text', fg: '--ion-text', bg: '--ion-surface-secondary' },
	{ group: 'ionos text', fg: '--ion-text', bg: '--ion-surface-dialog' },
	{ group: 'ionos text', fg: '--ion-text', bg: '--ion-list-background-hover' },
	{ group: 'ionos text', fg: '--ion-text', bg: '--ion-list-background-active' },
	{ group: 'ionos text', fg: '--ion-text', bg: '--ion-tables-header-background-color' },
	{ group: 'ionos text', fg: '--ion-breadcrumb-text-default', bg: '--ion-color-main-background' },
	{ group: 'ionos text', fg: '--ion-breadcrumb-text-hover', bg: '--ion-color-main-background' },
	{ group: 'ionos text', fg: '--ion-breadcrumb-text-active', bg: '--ion-color-main-background' },

	// --- IONOS buttons
	{ group: 'ionos buttons', fg: '--ion-button-primary-text', bg: '--ion-button-primary-background-default' },
	{ group: 'ionos buttons', fg: '--ion-button-primary-text', bg: '--ion-button-primary-background-hover' },
	{ group: 'ionos buttons', fg: '--ion-button-primary-text', bg: '--ion-button-primary-background-active' },
	{ group: 'ionos buttons', fg: '--ion-button-secondary-text', bg: '--ion-button-secondary-background-default' },
	{ group: 'ionos buttons', fg: '--ion-button-secondary-text-hover', bg: '--ion-button-secondary-background-hover' },
	{ group: 'ionos buttons', fg: '--ion-button-secondary-text-active', bg: '--ion-button-secondary-background-active' },
	{ group: 'ionos buttons', fg: '--ion-button-tertiary-text', bg: '--ion-button-tertiary-background-default' },
	{ group: 'ionos buttons', fg: '--ion-button-tertiary-text', bg: '--ion-button-tertiary-background-hover' },
	{ group: 'ionos buttons', fg: '--ion-button-tertiary-text', bg: '--ion-button-tertiary-background-active' },
	{ group: 'ionos buttons', fg: '--ion-button-sidebar-text', bg: '--ion-button-sidebar-background-hover' },
	{ group: 'ionos buttons', fg: '--ion-button-sidebar-text', bg: '--ion-button-sidebar-background-active' },
	{ group: 'ionos buttons', fg: '--ion-button--icon-only-text', bg: '--ion-button--icon-only-background' },
	{ group: 'ionos buttons', fg: '--ion-button--icon-only-text-hover', bg: '--ion-button--icon-only-background-hover' },
	{ group: 'ionos buttons', fg: '--ion-button-sidebar--icon-only-text', bg: '--ion-button-sidebar--icon-only-background' },
	{ group: 'ionos buttons', fg: '--ion-button-sidebar--icon-only-text', bg: '--ion-button-sidebar--icon-only-background-hover' },
	{ group: 'ionos buttons', fg: '--ion-button-error-text', bg: '--ion-button-error-background-default' },
	{ group: 'ionos buttons', fg: '--ion-button-error-text', bg: '--ion-button-error-background-hover' },
	{ group: 'ionos buttons', fg: '--ion-button-warning-text', bg: '--ion-button-warning-background-default' },
	{ group: 'ionos buttons', fg: '--ion-button-warning-text', bg: '--ion-button-warning-background-hover' },

	// --- IONOS context menu, chips
	{ group: 'ionos menus', fg: '--ion-context-menu-item-text', bg: '--ion-context-menu-background' },
	{ group: 'ionos menus', fg: '--ion-context-menu-item-text', bg: '--ion-context-menu-item-background-hover' },
	{ group: 'ionos menus', fg: '--ion-context-menu-item-text', bg: '--ion-context-menu-item-background-active' },
	{ group: 'ionos menus', fg: '--ion-chip-text', bg: '--ion-chip-background' },
]

const schemes = ['light', 'dark'] as const

/**
 * Ask the instance which IONOS theme stylesheets its login page links, instead of guessing the URL.
 * Works with and without pretty URLs (`/apps/...` vs `/index.php/apps/...`).
 */
let themeCssPromise: Promise<string[]> | undefined
function discoverThemeCss(request: import('@playwright/test').APIRequestContext): Promise<string[]> {
	themeCssPromise ??= (async () => {
		const candidates = [`${PATH_PREFIX}/login`, '/login', '/index.php/login']
		for (const path of [...new Set(candidates)]) {
			const response = await request.get(path).catch((error: Error) => {
				throw new Error(`Cannot reach the Nextcloud instance at BASE_URL (${path}): ${error.message}`)
			})
			if (!response.ok()) continue
			const html = await response.text()
			const links = [...html.matchAll(/<link[^>]*href="([^"]*theming[^"]*theme[^"]*ionos[^"]*)"/g)]
				.map((m) => m[1].replace(/&amp;/g, '&'))
			if (links.length) return links
		}
		throw new Error(
			'Could not find the IONOS theme stylesheets on the login page. '
			+ 'Check BASE_URL, that `enforce_theme` is `ionos` (php occ config:system:get enforce_theme), '
			+ 'and set A11Y_PATH_PREFIX=/index.php if your instance has no pretty URLs.',
		)
	})()
	return themeCssPromise
}

/** HTML harness: theme CSS as generated by the server + one sample line per pair */
function harness(pair: Pair, stylesheets: string[]): string {
	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="color-scheme" content="light dark">
	<title>IONOS theme token harness</title>
	<!-- the stylesheets the real login page links (custom CSS incl. --ion-* tokens + core variables) -->
	${stylesheets.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n\t')}
	<style>
		html { color-scheme: light dark; }
		body { margin: 0; font-family: sans-serif; }
		/* paint the page background first, so transparent token backgrounds resolve like in the real UI */
		main { background: var(--color-main-background); padding: 16px; width: 640px; box-sizing: border-box; }
		.sample { padding: 12px; font-size: 15px; font-weight: 400; line-height: 1.5; }
	</style>
</head>
<body data-theme-ionos>
	<main>
		<h1 style="font-size:15px;color:var(--color-main-text)">Token pair</h1>
		<p class="sample" style="color: var(${pair.fg}); background: var(${pair.bg});">
			${pair.fg} on ${pair.bg}
		</p>
	</main>
</body>
</html>`
}

for (const scheme of schemes) {
	test.describe(`IONOS theme tokens - ${scheme} mode`, () => {
		test.use({ colorScheme: scheme })

		for (const pair of pairs) {
			test(`[${pair.group}] ${pair.fg} on ${pair.bg}`, async ({ page, request }, testInfo) => {
				const stylesheets = await discoverThemeCss(request)
				// serve the harness from the Nextcloud origin so the relative theme CSS URL resolves
				await page.route('**/__a11y-harness', (route) => route.fulfill({
					contentType: 'text/html',
					body: harness(pair, stylesheets),
				}))
				await page.goto('/__a11y-harness')

				// npx playwright test --project=theme-tokens --headed --workers=1 -g "ionos buttons"
				// await page.pause()

				// Guard against vacuous passes: an undefined var() silently falls back to inherited colours.
				// (e.g. when the theme CSS is stale, see README "theme cache")
				for (const token of [pair.fg, pair.bg]) {
					const value = await page.evaluate(
						(name) => getComputedStyle(document.body).getPropertyValue(name).trim(),
						token,
					)
					expect(value, `${token} is not defined by the IONOS theme CSS`).not.toBe('')
				}

				// Screenshot of the rendered pair, attached before the assertion so failing tests have it too
				await testInfo.attach(`pair-${scheme}.png`, {
					body: await page.locator('main').screenshot(),
					contentType: 'image/png',
				})

				await expectNoA11yViolations(page, testInfo, `tokens-${scheme}-${pair.fg}-on-${pair.bg}`, {
					rules: ['color-contrast'],
					include: ['.sample'],
					failOnIncomplete: true,
				})
			})
		}
	})
}
