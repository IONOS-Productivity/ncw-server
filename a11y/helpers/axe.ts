/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Page, type TestInfo } from '@playwright/test'
import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/** Same rule set as the workshop: WCAG 2.0/2.1 level A + AA */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * Rules a *theme* (CSS / colour) customisation can plausibly break. Missing labels, ARIA misuse, `lang` etc.
 * come from markup, which the IONOS theme does not change.
 */
export const THEME_RULES = ['color-contrast', 'link-in-text-block']

/**
 * `theme` (default): only THEME_RULES, so findings are about our customisation.
 * `full`: all WCAG A/AA rules (WCAG_TAGS); most findings will be upstream Nextcloud, use together with the baseline diff.
 */
export const SCOPE = process.env.A11Y_SCOPE === 'full' ? 'full' : 'theme'

/** Label of this run (e.g. `ionos` vs `default`) so two runs can be diffed afterwards */
export const RUN_LABEL = process.env.A11Y_LABEL ?? 'ionos'

/** Do not fail the test on violations, only report them (useful while a baseline is cleaned up) */
export const REPORT_ONLY = process.env.A11Y_REPORT_ONLY === '1'

const RESULTS_DIR = join(__dirname, '..', 'a11y-results')

export interface ScanOptions {
	/** CSS selectors to restrict the scan to */
	include?: string[]
	/** CSS selectors to skip (e.g. third party widgets we do not own) */
	exclude?: string[]
	/** Only run these axe rules (e.g. `['color-contrast']`); overrides the A11Y_SCOPE default */
	rules?: string[]
	/**
	 * Treat axe "incomplete" results (axe could not decide, e.g. text over an image) as failures.
	 * Use for synthetic pages where every check must be conclusive, so a pass can't be vacuous.
	 */
	failOnIncomplete?: boolean
}

/**
 * Run axe on the page, attach the raw result to the Playwright report,
 * append a flat record to a11y-results/findings-<label>.jsonl and
 * fail the test if there are any violations.
 */
export async function expectNoA11yViolations(
	page: Page,
	testInfo: TestInfo,
	name: string,
	options: ScanOptions = {},
) {
	let builder = new AxeBuilder({ page })
	if (options.rules) {
		builder = builder.withRules(options.rules)
	} else if (SCOPE === 'theme') {
		builder = builder.withRules(THEME_RULES)
	} else {
		builder = builder.withTags(WCAG_TAGS)
	}
	for (const selector of options.include ?? []) {
		builder = builder.include(selector)
	}
	for (const selector of options.exclude ?? []) {
		builder = builder.exclude(selector)
	}

	const { violations, incomplete } = await builder.analyze()

	await testInfo.attach(`axe-${name}.json`, {
		body: JSON.stringify(violations, null, 2),
		contentType: 'application/json',
	})

	mkdirSync(RESULTS_DIR, { recursive: true })
	for (const violation of violations) {
		for (const node of violation.nodes) {
			const data = node.any?.[0]?.data as { contrastRatio?: number, fgColor?: string, bgColor?: string, expectedContrastRatio?: string } | undefined
			appendFileSync(join(RESULTS_DIR, `findings-${RUN_LABEL}.jsonl`), JSON.stringify({
				label: RUN_LABEL,
				scenario: name,
				rule: violation.id,
				impact: violation.impact,
				help: violation.help,
				helpUrl: violation.helpUrl,
				target: node.target.join(' '),
				html: node.html.slice(0, 200),
				contrast: data?.contrastRatio,
				expected: data?.expectedContrastRatio,
				fg: data?.fgColor,
				bg: data?.bgColor,
			}) + '\n')
		}
	}

	const inconclusive = options.failOnIncomplete
		? incomplete.map((i) => `${i.id}: axe could not verify ${i.nodes.length} node(s)`)
		: []

	if (REPORT_ONLY) {
		testInfo.annotations.push({ type: 'a11y-report-only', description: `${violations.length} violation(s)` })
		return
	}

	expect(
		[
			...violations.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s)`),
			...inconclusive,
		],
	).toEqual([])
}

/**
 * Prefix for instances without pretty URLs, e.g. `A11Y_PATH_PREFIX=/index.php`
 * (then `/login` becomes `/index.php/login`). Leave empty when `/login` works.
 */
export const PATH_PREFIX = process.env.A11Y_PATH_PREFIX ?? ''

/**
 * Fallback contrast check for elements axe reports as "incomplete" (it cannot decide, e.g. a chip partly covered
 * by its avatar: `elmPartiallyObscured`). A green axe result says nothing about those, so compute the WCAG ratio of
 * the resolved text colour against the resolved background (composited over the ancestors) ourselves.
 * Only plain colours are supported; an unknown colour format throws instead of passing silently.
 */
export async function expectReadable(
	page: Page,
	testInfo: TestInfo,
	name: string,
	selector: string,
	minRatio = 4.5,
) {
	const results = await page.evaluate(({ selector, minRatio }) => {
		const parse = (css: string): [number, number, number, number] => {
			const match = css.match(/^rgba?\(([^)]+)\)$/)
			if (!match) throw new Error(`unsupported colour format: ${css}`)
			const [r, g, b, a = 1] = match[1].split(/[\s,/]+/).filter(Boolean).map(Number)
			return [r, g, b, a]
		}
		const luminance = ([r, g, b]: number[]) => {
			const [R, G, B] = [r, g, b].map((v) => {
				const c = v / 255
				return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
			})
			return 0.2126 * R + 0.7152 * G + 0.0722 * B
		}
		const background = (element: Element): [number, number, number] => {
			const layers: [number, number, number, number][] = []
			for (let node: Element | null = element; node; node = node.parentElement) {
				const bg = parse(getComputedStyle(node).backgroundColor)
				if (bg[3] > 0) layers.push(bg)
				if (bg[3] === 1) break
			}
			let [r, g, b] = layers.length && layers[layers.length - 1][3] === 1 ? layers.pop()!.slice(0, 3) : [255, 255, 255]
			for (const [lr, lg, lb, la] of layers.reverse()) {
				r = lr * la + r * (1 - la)
				g = lg * la + g * (1 - la)
				b = lb * la + b * (1 - la)
			}
			return [r, g, b]
		}

		return [...document.querySelectorAll(selector)].map((element) => {
			const fg = parse(getComputedStyle(element).color)
			const bg = background(element)
			const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
			const ratio = (hi + 0.05) / (lo + 0.05)
			return {
				text: (element.textContent ?? '').trim().slice(0, 40),
				ratio: Math.round(ratio * 100) / 100,
				fg: `rgb(${fg.slice(0, 3).map(Math.round).join(', ')})`,
				bg: `rgb(${bg.map(Math.round).join(', ')})`,
				ok: ratio >= minRatio,
			}
		})
	}, { selector, minRatio })

	await testInfo.attach(`readable-${name}.json`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' })
	if (results.length === 0) {
		testInfo.annotations.push({ type: 'a11y-no-match', description: `no element matched "${selector}"` })
		return
	}

	const failing = results.filter((r) => !r.ok)
	if (REPORT_ONLY) {
		testInfo.annotations.push({ type: 'a11y-report-only', description: `${failing.length} of ${results.length} below ${minRatio}:1` })
		return
	}
	expect(
		failing.map((r) => `"${r.text}" ${r.fg} on ${r.bg} = ${r.ratio}:1 (needs ${minRatio}:1)`),
		`${selector}: ${results.length} element(s) checked`,
	).toEqual([])
}
