<!--
  - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcNoteCard
		v-if="!isThemeable"
		:text="notThemeableErrorMessage"
		showAlert
		type="error" />
	<template v-else>
		<AdminSectionTheming />
		<!-- IONOS: hide colors/background/logo/favicon customization and the
		     "disable user theming" toggle when the admin has disabled admin
		     theming customization (disable_admin_theming) -->
		<AdminSectionThemingAdvanced v-if="!adminThemingDisabled" />
	</template>
	<AdminSectionAppMenu />
</template>

<script setup lang="ts">
import type { AdminThemingInfo, AdminThemingParameters } from '../types.d.ts'

import { loadState } from '@nextcloud/initial-state'
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard'
import AdminSectionAppMenu from '../components/AdminSectionAppMenu.vue'
import AdminSectionTheming from '../components/AdminSectionTheming.vue'
import AdminSectionThemingAdvanced from '../components/AdminSectionThemingAdvanced.vue'

const { isThemeable, notThemeableErrorMessage } = loadState<AdminThemingInfo>('theming', 'adminThemingInfo')
const { adminThemingDisabled } = loadState<AdminThemingParameters>('theming', 'adminThemingParameters')
</script>
