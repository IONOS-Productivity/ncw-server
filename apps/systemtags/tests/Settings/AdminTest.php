<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2016 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OCA\SystemTags\Tests\Settings;

use OCA\SystemTags\Settings\Admin;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\IAppConfig;
use OCP\IL10N;
use OCP\Settings\IDelegatedSettings;
use OCP\Settings\ISettings;
use PHPUnit\Framework\MockObject\MockObject;
use Test\TestCase;

class AdminTest extends TestCase {
	private IAppConfig&MockObject $appConfig;
	private IInitialState&MockObject $initialState;
	private IL10N&MockObject $l10n;
	private Admin $admin;

	protected function setUp(): void {
		parent::setUp();

		$this->appConfig = $this->createMock(IAppConfig::class);
		$this->initialState = $this->createMock(IInitialState::class);
		$this->l10n = $this->createMock(IL10N::class);

		$this->admin = new Admin(
			$this->appConfig,
			$this->initialState,
			$this->l10n,
		);
	}

	public function testGetForm(): void {
		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->with('systemtags', 'restrict_creation_to_admin', false)
			->willReturn(false);

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('restrictSystemTagsCreationToAdmin', false);

		$expected = new TemplateResponse('systemtags', 'admin', [], '');
		$this->assertEquals($expected, $this->admin->getForm());
	}

	public function testGetFormWithRestrictedCreation(): void {
		$this->appConfig->expects($this->once())
			->method('getValueBool')
			->with('systemtags', 'restrict_creation_to_admin', false)
			->willReturn(true);

		$this->initialState->expects($this->once())
			->method('provideInitialState')
			->with('restrictSystemTagsCreationToAdmin', true);

		$expected = new TemplateResponse('systemtags', 'admin', [], '');
		$this->assertEquals($expected, $this->admin->getForm());
	}

	public function testGetSection(): void {
		$this->assertSame('server', $this->admin->getSection());
	}

	public function testGetPriority(): void {
		$this->assertSame(70, $this->admin->getPriority());
	}

	public function testGetName(): void {
		$translatedName = 'Collaborative tags';
		$this->l10n->expects($this->once())
			->method('t')
			->with('Collaborative tags')
			->willReturn($translatedName);

		$this->assertSame($translatedName, $this->admin->getName());
	}

	public function testGetAuthorizedAppConfig(): void {
		$this->assertSame(
			['systemtags' => ['/^restrict_creation_to_admin$/']],
			$this->admin->getAuthorizedAppConfig(),
		);
	}

	public function testImplementsIDelegatedSettings(): void {
		$this->assertInstanceOf(IDelegatedSettings::class, $this->admin);
		$this->assertInstanceOf(ISettings::class, $this->admin);
	}
}
