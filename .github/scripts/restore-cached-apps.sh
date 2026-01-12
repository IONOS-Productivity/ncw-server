#!/bin/bash

# SPDX-FileCopyrightText: 2025 STRATO AG
# SPDX-License-Identifier: AGPL-3.0-or-later

# Script to restore cached apps from JFrog or GitHub cache
# Used by the build-artifact job to restore pre-built app artifacts

set -euo pipefail

# Required environment variables
: "${APPS_TO_RESTORE:?APPS_TO_RESTORE not set}"
: "${GH_TOKEN:?GH_TOKEN not set}"

echo "📦 Restoring cached apps..."

# Process each app in the restore list
echo "$APPS_TO_RESTORE" | jq -c '.[]' | while read -r app_json; do
  APP_NAME=$(echo "$app_json" | jq -r '.name')
  APP_SHA=$(echo "$app_json" | jq -r '.sha')
  APP_PATH=$(echo "$app_json" | jq -r '.path')
  SOURCE=$(echo "$app_json" | jq -r '.source')

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Restoring: $APP_NAME (source: $SOURCE)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if [ "$SOURCE" == "jfrog" ]; then
    # Restore from JFrog
    JFROG_PATH=$(echo "$app_json" | jq -r '.jfrog_path')
    ARCHIVE_NAME="${APP_NAME}-${APP_SHA}.tar.gz"

    echo "📥 Downloading from JFrog: $JFROG_PATH"

    if jf rt download "$JFROG_PATH" "$ARCHIVE_NAME" --flat=true; then
      echo "✅ Downloaded successfully"
      echo "Extracting to $APP_PATH..."
      mkdir -p "$(dirname "$APP_PATH")"
      tar -xzf "$ARCHIVE_NAME" -C "$(dirname "$APP_PATH")"

      if [ -d "$APP_PATH" ] && [ -f "$APP_PATH/appinfo/info.xml" ]; then
        echo "✅ Restored $APP_NAME from JFrog"
      else
        echo "❌ Failed to extract or validate $APP_NAME"
        exit 1
      fi

      rm -f "$ARCHIVE_NAME"
    else
      echo "❌ Failed to download from JFrog"
      exit 1
    fi

  elif [ "$SOURCE" == "github-cache" ]; then
    # Restore from GitHub cache
    CACHE_KEY=$(echo "$app_json" | jq -r '.cache_key')

    echo "💾 Restoring from GitHub cache: $CACHE_KEY"

    # Use gh CLI to restore the cache
    if gh cache restore "$CACHE_KEY" --key "$CACHE_KEY"; then
      echo "✅ Restored $APP_NAME from GitHub cache"

      # Validate restoration
      if [ ! -d "$APP_PATH" ] || [ ! -f "$APP_PATH/appinfo/info.xml" ]; then
        echo "❌ Validation failed for $APP_NAME"
        exit 1
      fi
    else
      echo "❌ Failed to restore from GitHub cache"
      exit 1
    fi
  else
    echo "❌ Unknown source: $SOURCE"
    exit 1
  fi
done

echo ""
echo "✅ All cached apps restored successfully"
