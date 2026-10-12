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
		<!-- IONOS (NSW-43): AdminSectionThemingAdvanced gates its own
		     colors/background elements internally when disable_admin_theming
		     is set - logo/favicon/nav-bar-logo must stay editable, so this
		     component is never hidden wholesale at the call site -->
		<AdminSectionThemingAdvanced />
	</template>
	<AdminSectionAppMenu />
</template>

<script setup lang="ts">
import type { AdminThemingInfo } from '../types.d.ts'

import { loadState } from '@nextcloud/initial-state'
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard'
import AdminSectionAppMenu from '../components/AdminSectionAppMenu.vue'
import AdminSectionTheming from '../components/AdminSectionTheming.vue'
import AdminSectionThemingAdvanced from '../components/AdminSectionThemingAdvanced.vue'

const { isThemeable, notThemeableErrorMessage } = loadState<AdminThemingInfo>('theming', 'adminThemingInfo')
</script>
