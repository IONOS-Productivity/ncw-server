/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { getCSPNonce } from '@nextcloud/auth'
import Vue from 'vue'

import App from './AdminLegalUrls.vue'

// eslint-disable-next-line camelcase
__webpack_nonce__ = getCSPNonce()

Vue.prototype.OC = OC
Vue.prototype.t = t

const View = Vue.extend(App)
const legalUrls = new View()
legalUrls.$mount('#admin-theming-legal')
