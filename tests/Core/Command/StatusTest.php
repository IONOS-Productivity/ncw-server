<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace Test\Core\Command;

use OC\Core\Command\Status;
use OCP\Defaults;
use OCP\IConfig;
use OCP\ServerVersion;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\Console\Tester\CommandTester;
use Test\TestCase;

class StatusTest extends TestCase {
	private CommandTester $commandTester;
	private IConfig&MockObject $config;
	private Defaults&MockObject $themingDefaults;
	private ServerVersion&MockObject $serverVersion;

	protected function setUp(): void {
		parent::setUp();

		$this->config = $this->createMock(IConfig::class);
		$this->themingDefaults = $this->createMock(Defaults::class);
		$this->serverVersion = $this->createMock(ServerVersion::class);

		$command = new Status(
			$this->config,
			$this->themingDefaults,
			$this->serverVersion
		);
		$this->commandTester = new CommandTester($command);
	}

	public function testStatusWithNotInstalled(): void {
		$this->config->expects($this->exactly(2))
			->method('getSystemValueBool')
			->willReturnMap([
				['maintenance', false, false],
				['installed', false, false],
			]);

		$this->serverVersion->expects($this->once())
			->method('getVersion')
			->willReturn([30, 0, 0]);

		$this->serverVersion->expects($this->once())
			->method('getVersionString')
			->willReturn('30.0.0.0');

		$this->themingDefaults->expects($this->once())
			->method('getProductName')
			->willReturn('Nextcloud');

		$this->commandTester->execute([]);

		$output = $this->commandTester->getDisplay();
		$this->assertStringContainsString('"installed":false', $output);
		$this->assertEquals(0, $this->commandTester->getStatusCode());
	}

	public function testStatusWithInstalled(): void {
		$this->config->expects($this->exactly(2))
			->method('getSystemValueBool')
			->willReturnMap([
				['maintenance', false, false],
				['installed', false, true],
			]);

		$this->serverVersion->expects($this->once())
			->method('getVersion')
			->willReturn([30, 0, 0]);

		$this->serverVersion->expects($this->once())
			->method('getVersionString')
			->willReturn('30.0.0.0');

		$this->themingDefaults->expects($this->once())
			->method('getProductName')
			->willReturn('Nextcloud');

		$this->commandTester->execute([]);

		$output = $this->commandTester->getDisplay();
		$this->assertStringContainsString('"installed":true', $output);
		$this->assertEquals(0, $this->commandTester->getStatusCode());
	}

	public function testStatusWithMaintenanceMode(): void {
		$this->config->expects($this->exactly(2))
			->method('getSystemValueBool')
			->willReturnMap([
				['maintenance', false, true],
				['installed', false, true],
			]);

		$this->serverVersion->expects($this->once())
			->method('getVersion')
			->willReturn([30, 0, 0]);

		$this->serverVersion->expects($this->once())
			->method('getVersionString')
			->willReturn('30.0.0.0');

		$this->themingDefaults->expects($this->once())
			->method('getProductName')
			->willReturn('Nextcloud');

		$this->commandTester->execute([]);

		$output = $this->commandTester->getDisplay();
		$this->assertStringContainsString('"maintenance":true', $output);
		$this->assertEquals(0, $this->commandTester->getStatusCode());
	}

	public function testStatusExitCodeNormal(): void {
		$this->config->expects($this->exactly(2))
			->method('getSystemValueBool')
			->willReturnMap([
				['maintenance', false, false],
				['installed', false, true],
			]);

		$this->serverVersion->expects($this->once())
			->method('getVersion')
			->willReturn([30, 0, 0]);

		$this->serverVersion->expects($this->once())
			->method('getVersionString')
			->willReturn('30.0.0.0');

		$this->themingDefaults->expects($this->once())
			->method('getProductName')
			->willReturn('Nextcloud');

		$this->commandTester->execute(['--exit-code' => true]);

		$this->assertEquals(0, $this->commandTester->getStatusCode());
		$this->assertEmpty($this->commandTester->getDisplay()); // No output in exit-code mode
	}

	public function testStatusExitCodeMaintenanceMode(): void {
		$this->config->expects($this->exactly(2))
			->method('getSystemValueBool')
			->willReturnMap([
				['maintenance', false, true],
				['installed', false, true],
			]);

		$this->serverVersion->expects($this->once())
			->method('getVersion')
			->willReturn([30, 0, 0]);

		$this->serverVersion->expects($this->once())
			->method('getVersionString')
			->willReturn('30.0.0.0');

		$this->themingDefaults->expects($this->once())
			->method('getProductName')
			->willReturn('Nextcloud');

		$this->commandTester->execute(['--exit-code' => true]);

		$this->assertEquals(1, $this->commandTester->getStatusCode());
		$this->assertEmpty($this->commandTester->getDisplay()); // No output in exit-code mode
	}

	public function testStatusOutputFormat(): void {
		$this->config->expects($this->exactly(2))
			->method('getSystemValueBool')
			->willReturnMap([
				['maintenance', false, false],
				['installed', false, true],
			]);

		$this->serverVersion->expects($this->once())
			->method('getVersion')
			->willReturn([30, 0, 1]);

		$this->serverVersion->expects($this->once())
			->method('getVersionString')
			->willReturn('30.0.1.2');

		$this->themingDefaults->expects($this->once())
			->method('getProductName')
			->willReturn('Nextcloud Test');

		$this->commandTester->execute([]);

		$output = $this->commandTester->getDisplay();
		$this->assertStringContainsString('"installed":true', $output);
		$this->assertStringContainsString('"version":"30.0.1"', $output);
		$this->assertStringContainsString('"versionstring":"30.0.1.2"', $output);
		$this->assertStringContainsString('"edition":""', $output);
		$this->assertStringContainsString('"maintenance":false', $output);
		$this->assertStringContainsString('"productname":"Nextcloud Test"', $output);
	}
}