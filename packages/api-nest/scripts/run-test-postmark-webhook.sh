#!/usr/bin/env bash

PROJECT_DIR=$(
  cd "$(dirname "$0")/.." || exit
  pwd
)

run() {
  TS_NODE_TRANSPILE_ONLY=true npx ts-node -r tsconfig-paths/register \
    "${PROJECT_DIR}/scripts/test-postmark-webhook.ts" "$@"
}

run "$@"
