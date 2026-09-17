<!--
  - SPDX-FileCopyrightText: 2026 STRATO GmbH
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import { toRef } from 'vue'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import NcTextField from '@nextcloud/vue/components/NcTextField'
import { useAdminThemingValue } from '../../composables/useAdminThemingValue.ts'

// IONOS: standalone text field for the legal-URLs admin panel. It mirrors
// ../admin/TextField.vue's save/reset behaviour via the shared
// useAdminThemingValue composable, but reads its initial value from the
// parent (adminLegalUrlsParameters), not from the main theming
// (adminThemingParameters) initial state that TextField.vue is bound to.
const modelValue = defineModel<string>({ required: true })

const props = withDefaults(defineProps<{
	name: string
	label: string
	defaultValue: string
	placeholder?: string
	maxlength?: number
}>(), {
	placeholder: '',
	maxlength: 500,
})

const {
	isSaving,
	isSaved,
	reset,
} = useAdminThemingValue(toRef(() => props.name), modelValue, toRef(() => props.defaultValue))

watchDebounced(modelValue, (value) => {
	if (value.includes('"')) {
		try {
			const url = new URL(value)
			url.pathname = url.pathname.replaceAll(/"/g, '%22')
			modelValue.value = url.href
		} catch {
			// invalid URL, do nothing
		}
	}
}, { debounce: 600 })
</script>

<template>
	<NcTextField
		v-model="modelValue"
		:label="label"
		:placeholder="placeholder"
		:maxlength="maxlength"
		type="url"
		:readonly="isSaving"
		:success="isSaved"
		:showTrailingButton="modelValue !== defaultValue"
		:trailingButtonIcon="defaultValue ? 'undo' : 'close'"
		@trailingButtonClick="reset">
		<template v-if="isSaving" #icon>
			<NcLoadingIcon />
		</template>
	</NcTextField>
</template>
