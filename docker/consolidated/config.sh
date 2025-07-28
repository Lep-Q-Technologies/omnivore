#!/bin/bash

# Omnivore Consolidated Configuration Script

echo "Configuring Omnivore..."

# Set default values
export DEPLOYMENT_PROFILE=${DEPLOYMENT_PROFILE:-standard}
export NODE_ENV=${NODE_ENV:-production}

# Validate deployment profile
case $DEPLOYMENT_PROFILE in
    minimal|standard|enterprise)
        echo "Using deployment profile: $DEPLOYMENT_PROFILE"
        ;;
    *)
        echo "Warning: Unknown deployment profile '$DEPLOYMENT_PROFILE', using 'standard'"
        export DEPLOYMENT_PROFILE=standard
        ;;
esac

# Set profile-specific defaults
case $DEPLOYMENT_PROFILE in
    minimal)
        export MAX_WORKERS=${MAX_WORKERS:-2}
        export MAX_CONCURRENT_JOBS=${MAX_CONCURRENT_JOBS:-5}
        export ENABLE_PDF_PROCESSING=${ENABLE_PDF_PROCESSING:-false}
        export ENABLE_THUMBNAIL_GENERATION=${ENABLE_THUMBNAIL_GENERATION:-false}
        export ENABLE_AI_FEATURES=${ENABLE_AI_FEATURES:-false}
        ;;
    standard)
        export MAX_WORKERS=${MAX_WORKERS:-4}
        export MAX_CONCURRENT_JOBS=${MAX_CONCURRENT_JOBS:-10}
        export ENABLE_PDF_PROCESSING=${ENABLE_PDF_PROCESSING:-true}
        export ENABLE_THUMBNAIL_GENERATION=${ENABLE_THUMBNAIL_GENERATION:-true}
        export ENABLE_AI_FEATURES=${ENABLE_AI_FEATURES:-false}
        ;;
    enterprise)
        export MAX_WORKERS=${MAX_WORKERS:-8}
        export MAX_CONCURRENT_JOBS=${MAX_CONCURRENT_JOBS:-20}
        export ENABLE_PDF_PROCESSING=${ENABLE_PDF_PROCESSING:-true}
        export ENABLE_THUMBNAIL_GENERATION=${ENABLE_THUMBNAIL_GENERATION:-true}
        export ENABLE_AI_FEATURES=${ENABLE_AI_FEATURES:-true}
        ;;
esac

# Validate required environment variables
REQUIRED_VARS=(
    "PG_HOST"
    "PG_USER"
    "PG_PASSWORD"
    "PG_DB"
    "REDIS_URL"
    "JWT_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Set application URLs
export BASE_URL=${BASE_URL:-http://localhost:3000}
export SERVER_BASE_URL=${SERVER_BASE_URL:-http://localhost:4000}
export CLIENT_URL=${CLIENT_URL:-$BASE_URL}
export HIGHLIGHTS_BASE_URL=${HIGHLIGHTS_BASE_URL:-$BASE_URL}

# Configure storage
export STORAGE_TYPE=${STORAGE_TYPE:-local}
if [ "$STORAGE_TYPE" = "local" ]; then
    export STORAGE_PATH=${STORAGE_PATH:-/app/data}
    mkdir -p "$STORAGE_PATH"
fi

# Feature flag validation
echo "Enabled features:"
[ "${ENABLE_CONTENT_PROCESSING:-true}" = "true" ] && echo "  - Content Processing"
[ "${ENABLE_PDF_PROCESSING:-true}" = "true" ] && echo "  - PDF Processing"
[ "${ENABLE_THUMBNAIL_GENERATION:-true}" = "true" ] && echo "  - Thumbnail Generation"
[ "${ENABLE_EMAIL_INGESTION:-false}" = "true" ] && echo "  - Email Ingestion"
[ "${ENABLE_AI_FEATURES:-false}" = "true" ] && echo "  - AI Features"
[ "${ENABLE_TEXT_TO_SPEECH:-false}" = "true" ] && echo "  - Text-to-Speech"
[ "${ENABLE_RSS_HANDLING:-true}" = "true" ] && echo "  - RSS Handling"
[ "${ENABLE_INTEGRATIONS:-true}" = "true" ] && echo "  - Integrations"

# Validate AI configuration if enabled
if [ "${ENABLE_AI_FEATURES:-false}" = "true" ]; then
    if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
        echo "Warning: AI features enabled but no API keys configured"
    fi
fi

# Validate email configuration if enabled
if [ "${ENABLE_EMAIL_INGESTION:-false}" = "true" ]; then
    if [ -z "$IMAP_HOST" ] || [ -z "$IMAP_USER" ] || [ -z "$IMAP_PASSWORD" ]; then
        echo "Warning: Email ingestion enabled but IMAP configuration incomplete"
    fi
fi

echo "Configuration complete."