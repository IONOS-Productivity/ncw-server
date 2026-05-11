<!--
  - SPDX-FileCopyrightText: 2026 STRATO GmbH
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<section>
		<NcSettingsSection :name="t('theming', 'Advanced options')">
			<div class="admin-theming-legal">
				<TextField v-for="field in legalFields"
					:key="field.name"
					:name="field.name"
					:value.sync="field.value"
					:default-value="field.defaultValue"
					:type="field.type"
					:display-name="field.displayName"
					:placeholder="field.placeholder"
					:maxlength="field.maxlength" />
			</div>
		</NcSettingsSection>
	</section>
</template>

<script>
import { loadState } from '@nextcloud/initial-state'

import NcSettingsSection from '@nextcloud/vue/dist/Components/NcSettingsSection.js'
import TextField from './components/admin/TextField.vue'

const {
	legalNoticeUrl,
	legalNoticeUrlDefault,
	privacyPolicyUrl,
	privacyPolicyUrlDefault,
} = loadState('theming', 'adminLegalUrlsParameters')

const legalFields = [
	{
		name: 'imprintUrl',
		value: legalNoticeUrl,
		defaultValue: legalNoticeUrlDefault,
		type: 'url',
		displayName: t('theming', 'Legal notice link'),
		placeholder: 'https://…',
		maxlength: 500,
	},
	{
		name: 'privacyUrl',
		value: privacyPolicyUrl,
		defaultValue: privacyPolicyUrlDefault,
		type: 'url',
		displayName: t('theming', 'Privacy policy link'),
		placeholder: 'https://…',
		maxlength: 500,
	},
]

export default {
	name: 'AdminLegalUrls',

	components: {
		NcSettingsSection,
		TextField,
	},

	data() {
		return {
			legalFields,
		}
	},
}
</script>

<style lang="scss" scoped>
.admin-theming-legal {
	display: flex;
	flex-direction: column;
	gap: 8px 0;
}
</style>
