<?php
/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OCA\Theming\Tests\Settings;

use OCA\Theming\AppInfo\Application;
use OCA\Theming\Settings\AdminLegalUrls;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\IConfig;
use OCP\IL10N;
use Test\TestCase;

class AdminLegalUrlsTest extends TestCase {
	private AdminLegalUrls $adminLegalUrls;
	private IConfig $config;
	private IL10N $l10n;
	private IInitialState $initialState;

	protected function setUp(): void {
		parent::setUp();
		$this->config = $this->createMock(IConfig::class);
		$this->l10n = $this->createMock(IL10N::class);
		$this->initialState = $this->createMock(IInitialState::class);

		$this->adminLegalUrls = new AdminLegalUrls(
			Application::APP_ID,
			$this->config,
			$this->l10n,
			$this->initialState,
		);
	}

	public function testGetForm(): void {
		$this->config
			->expects($this->exactly(2))
			->method('getAppValue')
			->willReturnMap([
				['theming', 'imprintUrl', '', 'https://example.com/legal'],
				['theming', 'privacyUrl', '', 'https://example.com/privacy'],
			]);

		$this->initialState
			->expects($this->once())
			->method('provideInitialState')
			->with('adminLegalUrlsParameters', [
				'legalNoticeUrl' => 'https://example.com/legal',
				'privacyPolicyUrl' => 'https://example.com/privacy',
			]);

		$expected = new TemplateResponse('theming', 'settings-admin-legal');
		$this->assertEquals($expected, $this->adminLegalUrls->getForm());
	}

	public function testGetSection(): void {
		$this->assertSame('theming', $this->adminLegalUrls->getSection());
	}

	public function testGetPriority(): void {
		$this->assertSame(50, $this->adminLegalUrls->getPriority());
	}

	public function testGetName(): void {
		$this->l10n
			->expects($this->once())
			->method('t')
			->with('Advanced options')
			->willReturn('Advanced options');

		$this->assertSame('Advanced options', $this->adminLegalUrls->getName());
	}

	public function testGetAuthorizedAppConfig(): void {
		$config = $this->adminLegalUrls->getAuthorizedAppConfig();

		$this->assertIsArray($config);
		$this->assertArrayHasKey('theming', $config);
		$this->assertIsArray($config['theming']);
		$this->assertCount(1, $config['theming']);
		$this->assertSame('/^(imprintUrl|privacyUrl)$/', $config['theming'][0]);
	}
}
