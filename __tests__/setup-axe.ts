/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Pre-configured axe instance for EN 301 549 (which maps to WCAG 2.1 AA).
 * Import `axe` from this file in all accessibility tests instead of from jest-axe directly.
 */
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import { expect } from 'vitest'

expect.extend(toHaveNoViolations)

export const axe = configureAxe({
	runOnly: {
		type: 'tag',
		values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
	},
})
