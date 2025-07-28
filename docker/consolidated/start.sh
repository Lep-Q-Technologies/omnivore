#!/bin/bash
set -e

echo "Starting Omnivore Consolidated Service..."
echo "Deployment Profile: ${DEPLOYMENT_PROFILE:-standard}"

# Source configuration
source /app/scripts/config.sh

# Initialize database if needed
if [ "${SKIP_DB_MIGRATION:-false}" != "true" ]; then
    echo "Running database migrations..."
    cd /app/db
    ./setup.sh || echo "Database migration failed, continuing..."
    cd /app
fi

# Create necessary directories
mkdir -p /app/data/logs
mkdir -p /app/uploads

# Start services based on configuration
if [ "${WORKER_MODE:-false}" = "true" ]; then
    echo "Starting in worker mode..."
    exec node /app/api/dist/queue-processor.js
else
    echo "Starting web and API services..."
    
    # Start API server in background
    echo "Starting API server on port 4000..."
    cd /app/api
    node dist/server.js &
    API_PID=$!
    
    # Start web server in background
    echo "Starting web server on port 3000..."
    cd /app/web
    node server.js &
    WEB_PID=$!
    
    # Wait for both processes
    wait $API_PID $WEB_PID
fi