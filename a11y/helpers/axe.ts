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
	/** Only run these axe rules (e.g. `['color-contrast']`) */
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
	builder = options.rules ? builder.withRules(options.rules) : builder.withTags(WCAG_TAGS)
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
