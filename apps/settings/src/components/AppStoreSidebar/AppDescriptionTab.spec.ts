/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { axe } from '../../../../../__tests__/setup-axe'
import AppDescriptionTab from './AppDescriptionTab.vue'

const mockApp = {
	id: 'test-app',
	name: 'Test App',
	description: 'A simple test description.',
} as any

describe('AppDescriptionTab', () => {
	it('should have no accessibility violations', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const wrapper = shallowMount(AppDescriptionTab as any, {
			propsData: { app: mockApp },
		})

		const results = await axe(wrapper.element)
		expect(results).toHaveNoViolations()
	})
})
