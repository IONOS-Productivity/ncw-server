<?php
/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OCA\Theming\Settings;

use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\IConfig;
use OCP\IL10N;
use OCP\Settings\IDelegatedSettings;
use OCP\Util;

class AdminLegalUrls implements IDelegatedSettings {

	public function __construct(
		private string $appName,
		private IConfig $config,
		private IL10N $l,
		private IInitialState $initialState,
	) {
	}

	public function getForm(): TemplateResponse {
		$this->initialState->provideInitialState('adminLegalUrlsParameters', [
			'legalNoticeUrl' => $this->config->getAppValue('theming', 'imprintUrl', ''),
			'legalNoticeUrlDefault' => $this->config->getAppValue('theming', 'imprintUrlDefault', ''),
			'privacyPolicyUrl' => $this->config->getAppValue('theming', 'privacyUrl', ''),
			'privacyPolicyUrlDefault' => $this->config->getAppValue('theming', 'privacyUrlDefault', ''),
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
