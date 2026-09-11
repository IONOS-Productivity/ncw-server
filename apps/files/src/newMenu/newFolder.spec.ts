/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { axe } from '../../../../__tests__/setup-axe'

import { entry } from './newFolder'
import NewNodeDialog from '../components/NewNodeDialog.vue'

vi.mock('@nextcloud/axios')
vi.mock('@nextcloud/l10n', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@nextcloud/l10n')>()
	return { ...actual, translate: (_app: string, text: string) => text, t: (_app: string, text: string) => text }
})
vi.mock('@nextcloud/capabilities', () => ({
	getCapabilities: () => ({
		files: {
			forbidden_filename_characters: ['/', '\\'],
			forbidden_filenames: ['.htaccess'],
			forbidden_filename_basenames: [],
			forbidden_filename_extensions: ['.part', '.filepart'],
		},
	}),
}))

describe('newFolder entry – accessibility', () => {
	it('icon SVG is aria-hidden (decorative)', () => {
		// The icon is rendered inline next to a visible label, so it must be hidden from AT
		const div = document.createElement('div')
		div.innerHTML = entry.iconSvgInline as string
		const svg = div.querySelector('svg')
		expect(svg).not.toBeNull()
		expect(svg?.getAttribute('aria-hidden')).toBe('true')
	})

	it('NewNodeDialog has no accessibility violations', async () => {
		const wrapper = shallowMount(NewNodeDialog as any, {
			propsData: {
				defaultName: 'New folder',
				otherNames: [],
				open: true,
			},
		})

		const results = await axe(wrapper.element)
		expect(results).toHaveNoViolations()
	})
})
