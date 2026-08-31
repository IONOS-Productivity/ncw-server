<?php

/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OCA\Theming\Settings;

use OCA\Theming\ConfigLexicon;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IAppConfig;
use OCP\AppFramework\Services\IInitialState;
use OCP\IL10N;
use OCP\Settings\IDelegatedSettings;
use OCP\Util;

class AdminLegalUrls implements IDelegatedSettings {

	public function __construct(
		private string $appName,
		private IAppConfig $appConfig,
		private IL10N $l,
		private IInitialState $initialState,
	) {
	}

	public function getForm(): TemplateResponse {
		$this->initialState->provideInitialState('adminLegalUrlsParameters', [
			'legalNoticeUrl' => $this->appConfig->getAppValueString(ConfigLexicon::INSTANCE_IMPRINT_URL, ''),
			'legalNoticeUrlDefault' => $this->appConfig->getAppValueString(ConfigLexicon::INSTANCE_IMPRINT_URL_DEFAULT, ''),
			'privacyPolicyUrl' => $this->appConfig->getAppValueString(ConfigLexicon::INSTANCE_PRIVACY_URL, ''),
			'privacyPolicyUrlDefault' => $this->appConfig->getAppValueString(ConfigLexicon::INSTANCE_PRIVACY_URL_DEFAULT, ''),
		]);

		Util::addScript($this->appName, 'admin-legal-urls');

		return new TemplateResponse($this->appName, 'settings-admin-legal');
	}

	public function getSection(): string {
		return $this->appName;
	}

	public function getPriority(): int {
		return 50;
	}

	public function getName(): ?string {
		return $this->l->t('Advanced options');
	}

	public function getAuthorizedAppConfig(): array {
		return [
			$this->appName => ['/^(imprintUrl|privacyUrl)$/'],
		];
	}
}
