<!--
  - SPDX-FileCopyrightText: 2026 STRATO GmbH
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { loadState } from '@nextcloud/initial-state'
import { t } from '@nextcloud/l10n'
import { ref } from 'vue'
import NcSettingsSection from '@nextcloud/vue/components/NcSettingsSection'
import LegalUrlField from './components/admin/LegalUrlField.vue'

interface AdminLegalUrlsParameters {
	legalNoticeUrl: string
	legalNoticeUrlDefault: string
	privacyPolicyUrl: string
	privacyPolicyUrlDefault: string
}

const {
	legalNoticeUrl,
	legalNoticeUrlDefault,
	privacyPolicyUrl,
	privacyPolicyUrlDefault,
} = loadState<AdminLegalUrlsParameters>('theming', 'adminLegalUrlsParameters')

const imprintUrl = ref(legalNoticeUrl)
const privacyUrl = ref(privacyPolicyUrl)
</script>

<template>
	<section>
		<NcSettingsSection :name="t('theming', 'Advanced options')">
			<div class="admin-theming-legal">
				<LegalUrlField
					v-model="imprintUrl"
					name="imprintUrl"
					:label="t('theming', 'Legal notice link')"
					:defaultValue="legalNoticeUrlDefault"
					placeholder="https://…"
					:maxlength="500" />
				<LegalUrlField
					v-model="privacyUrl"
					name="privacyUrl"
					:label="t('theming', 'Privacy policy link')"
					:defaultValue="privacyPolicyUrlDefault"
					placeholder="https://…"
					:maxlength="500" />
			</div>
		</NcSettingsSection>
	</section>
</template>

<style scoped>
.admin-theming-legal {
	display: flex;
	flex-direction: column;
	gap: 8px 0;
	max-width: 650px;
}
</style>
