/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { defineConfig, devices } from '@playwright/test'
import { BASE_URL } from './helpers/instance'

// A running Nextcloud with the IONOS theme enforced, see README.md
const baseURL = BASE_URL

export default defineConfig({
	testDir: './specs',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL,
		trace: 'on-first-retry',
	},

	// Chromium only: axe evaluates DOM/CSSOM, findings do not vary by engine.
	projects: [
		{
			// Pure design-token contrast checks against the *generated* IONOS theme CSS (no login needed)
			name: 'theme-tokens',
			testMatch: /theme-tokens\.spec\.ts/,
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/,
			use: { ...devices['Desktop Chrome'] },
		},
		{
			// Real pages rendered with the IONOS theme
			name: 'pages',
			testMatch: /pages\.spec\.ts/,
			dependencies: ['setup'],
			use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
		},
	],
})
