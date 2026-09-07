/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { createApp } from 'vue'
import AdminLegalUrls from './AdminLegalUrls.vue'

import 'vite/modulepreload-polyfill'

const app = createApp(AdminLegalUrls)
app.config.idPrefix = 'settings'
app.mount('#admin-theming-legal')
