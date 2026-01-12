#!/bin/bash

# SPDX-FileCopyrightText: 2025 STRATO AG
# SPDX-License-Identifier: AGPL-3.0-or-later

# Script to upload a built app to JFrog Artifactory
# Used by build-external-apps job after building each app

set -euo pipefail

# Required environment variables
: "${APP_NAME:?APP_NAME not set}"
: "${APP_SHA:?APP_SHA not set}"
: "${APP_PATH:?APP_PATH not set}"
: "${ARTIFACTORY_REPOSITORY_SNAPSHOT:?ARTIFACTORY_REPOSITORY_SNAPSHOT not set}"
: "${CACHE_VERSION:?CACHE_VERSION not set}"
: "${GITHUB_REF_NAME:?GITHUB_REF_NAME not set}"
: "${GITHUB_SHA:?GITHUB_SHA not set}"

echo "=== JFrog Upload Debug Info ==="
echo "📦 Packaging $APP_NAME for JFrog upload..."
echo "App Name: $APP_NAME"
echo "App SHA: $APP_SHA"
echo "App Path: $APP_PATH"
echo "Repository: $ARTIFACTORY_REPOSITORY_SNAPSHOT"
echo "==============================="

# Verify app path exists
if [ ! -d "$APP_PATH" ]; then
  echo "❌ ERROR: App path does not exist: $APP_PATH"
  exit 1
fi

echo "App directory contents (top level):"
ls -la "$APP_PATH" | head -20

# Create tar.gz archive of the built app (excluding node_modules and other build artifacts)
ARCHIVE_NAME="${APP_NAME}-${APP_SHA}.tar.gz"
echo ""
echo "Creating archive: $ARCHIVE_NAME"
echo "Running: tar -czf \"$ARCHIVE_NAME\" --exclude=\"node_modules\" --exclude=\".git\" --exclude=\"*.log\" -C \"$(dirname "$APP_PATH")\" \"$(basename "$APP_PATH")\""

tar -czf "$ARCHIVE_NAME" \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude="*.log" \
  -C "$(dirname "$APP_PATH")" \
  "$(basename "$APP_PATH")"

echo "✓ Archive created successfully"
echo "Archive size:"
ls -lh "$ARCHIVE_NAME"

# Upload to JFrog - store in snapshot repo under apps/
# Include CACHE_VERSION in path to enable complete cache invalidation
JFROG_PATH="${ARTIFACTORY_REPOSITORY_SNAPSHOT}/apps/${CACHE_VERSION}/${APP_NAME}/${ARCHIVE_NAME}"

echo ""
echo "Uploading to JFrog..."
echo "Target Path: $JFROG_PATH"
echo "Properties: app.name=${APP_NAME};app.sha=${APP_SHA};vcs.branch=${GITHUB_REF_NAME};vcs.revision=${GITHUB_SHA}"

if jf rt upload "$ARCHIVE_NAME" "$JFROG_PATH" \
  --target-props "app.name=${APP_NAME};app.sha=${APP_SHA};vcs.branch=${GITHUB_REF_NAME};vcs.revision=${GITHUB_SHA}"; then
  echo "✅ Successfully uploaded $APP_NAME to JFrog"
  echo ""
  echo "Verifying upload..."
  if jf rt s "$JFROG_PATH"; then
    echo "✓ Upload verified - artifact is accessible in JFrog"
  else
    echo "⚠ Upload succeeded but verification search failed"
  fi
else
  UPLOAD_EXIT_CODE=$?
  echo "❌ Failed to upload to JFrog (exit code: $UPLOAD_EXIT_CODE)"
  echo "⚠️ Continuing workflow despite upload failure..."
fi

# Clean up archive
echo ""
echo "Cleaning up local archive..."
rm -f "$ARCHIVE_NAME"
echo "✓ Cleanup complete"
