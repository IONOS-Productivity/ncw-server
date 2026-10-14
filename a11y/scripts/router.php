<?php

/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Router for PHP's built-in web server (`php -S`), used to run Nextcloud in CI without Apache:
//   php -S 127.0.0.1:8080 -t . a11y/scripts/router.php   (run from the repository root)
// Handles pretty URLs (/login), PHP entry points with a path suffix (/index.php/login,
// /remote.php/dav/..., /ocs/v2.php/...) and static files.

$root = dirname(__DIR__, 2);
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// static files
if ($path !== '/' && is_file($root . $path) && !str_ends_with($path, '.php')) {
	return false;
}

// PHP entry points, with or without trailing path info: let the built-in server dispatch them
if (preg_match('#^(/.*?\.php)(/.*)?$#', $path, $matches) && is_file($root . $matches[1])) {
	return false;
}

// everything else is a pretty URL handled by index.php
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = $root . '/index.php';
$_SERVER['PATH_INFO'] = $path;
chdir($root);
require $root . '/index.php';
