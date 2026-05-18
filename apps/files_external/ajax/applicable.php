<?php

use OC\Settings\AuthorizedGroupMapper;
use OCA\Files_External\Settings\Admin;
use OCP\IGroupManager;
use OCP\IUserManager;
use OCP\IUserSession;
use OCP\Server;

/**
 * SPDX-FileCopyrightText: 2018-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2016 ownCloud, Inc.
 * SPDX-License-Identifier: AGPL-3.0-only
 */
\OC_JSON::checkAppEnabled('files_external');
\OC_JSON::callCheck();

$emitJson = static function (int $status, array $payload): void {
	http_response_code($status);
	header('Content-Type: application/json; charset=utf-8');
	echo json_encode($payload);
};

$currentUser = Server::get(IUserSession::class)->getUser();
if ($currentUser === null) {
	$emitJson(401, ['status' => 'error', 'data' => ['message' => 'Not logged in']]);
	exit();
}
$groupManager = Server::get(IGroupManager::class);
$authorizedGroupMapper = Server::get(AuthorizedGroupMapper::class);
$isAdmin = $groupManager->isAdmin($currentUser->getUID());
$isDelegated = in_array(Admin::class, $authorizedGroupMapper->findAllClassesForUser($currentUser), true);
if (!$isAdmin && !$isDelegated) {
	$emitJson(403, ['status' => 'error', 'data' => ['message' => 'Not authorized']]);
	exit();
}

$pattern = '';
$limit = null;
$offset = null;
if (isset($_GET['pattern'])) {
	$pattern = (string)$_GET['pattern'];
}
if (isset($_GET['limit'])) {
	$limit = (int)$_GET['limit'];
}
if (isset($_GET['offset'])) {
	$offset = (int)$_GET['offset'];
}

$groups = [];
foreach ($groupManager->search($pattern, $limit, $offset) as $group) {
	$groups[$group->getGID()] = $group->getDisplayName();
}

$users = [];
foreach (Server::get(IUserManager::class)->searchDisplayName($pattern, $limit, $offset) as $user) {
	$users[$user->getUID()] = $user->getDisplayName();
}

$results = ['groups' => $groups, 'users' => $users];

$emitJson(200, ['status' => 'success', 'data' => $results]);
