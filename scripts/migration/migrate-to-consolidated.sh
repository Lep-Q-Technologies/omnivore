#!/bin/bash

# Omnivore Architecture Migration Script
# Migrates from multi-service to consolidated architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backup-$(date +%Y%m%d-%H%M%S)"
PROFILE="${OMNIVORE_PROFILE:-standard}"

echo -e "${GREEN}Omnivore Architecture Migration Tool${NC}"
echo "====================================="
echo ""

# Function to print colored messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running in Docker environment
check_environment() {
    info "Checking environment..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if old services are running
    if docker ps | grep -q "omnivore-api\|omnivore-web\|omnivore-content-fetch"; then
        info "Detected running Omnivore services"
    else
        warn "No running Omnivore services detected. Is Omnivore currently installed?"
    fi
}

# Backup existing data
backup_data() {
    info "Creating backup in $BACKUP_DIR..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup PostgreSQL if it exists
    if docker ps | grep -q "omnivore-postgres"; then
        info "Backing up PostgreSQL database..."
        docker exec omnivore-postgres pg_dumpall -U postgres > "$BACKUP_DIR/postgres-backup.sql"
    fi
    
    # Backup Redis if it exists
    if docker ps | grep -q "omnivore-redis"; then
        info "Backing up Redis data..."
        docker exec omnivore-redis redis-cli BGSAVE
        sleep 2
        docker cp omnivore-redis:/data/dump.rdb "$BACKUP_DIR/redis-backup.rdb"
    fi
    
    # Backup volumes
    info "Backing up Docker volumes..."
    for volume in $(docker volume ls -q | grep omnivore); do
        mkdir -p "$BACKUP_DIR/volumes/$volume"
        docker run --rm -v "$volume:/source:ro" -v "$BACKUP_DIR/volumes/$volume:/backup" alpine tar -czf /backup/data.tar.gz -C /source .
    done
    
    # Backup environment files
    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/.env.backup"
    fi
    
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml.backup"
    fi
    
    info "Backup completed in $BACKUP_DIR"
}

# Detect current deployment profile
detect_profile() {
    info "Detecting deployment profile..."
    
    # Check number of services
    service_count=$(docker ps --filter "name=omnivore" | grep -c omnivore || true)
    
    if [ "$service_count" -lt 3 ]; then
        DETECTED_PROFILE="minimal"
    elif [ "$service_count" -lt 10 ]; then
        DETECTED_PROFILE="standard"
    else
        DETECTED_PROFILE="enterprise"
    fi
    
    info "Detected profile: $DETECTED_PROFILE"
    
    # Ask user to confirm
    read -p "Use profile '$DETECTED_PROFILE'? (y/n/custom): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "Available profiles: minimal, standard, enterprise"
        read -p "Enter profile name: " PROFILE
    elif [[ $REPLY =~ ^[Cc]$ ]]; then
        PROFILE="custom"
    else
        PROFILE=$DETECTED_PROFILE
    fi
}

# Generate new configuration
generate_config() {
    info "Generating configuration for profile: $PROFILE"
    
    # Create .env file for new architecture
    cat > .env.new << EOF
# Omnivore Consolidated Architecture Configuration
# Generated on $(date)

# Deployment Profile
DEPLOYMENT_PROFILE=$PROFILE

# Security - PLEASE CHANGE THESE!
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
SSO_JWT_SECRET=$(openssl rand -base64 32)

# Database
POSTGRES_PASSWORD=$(openssl rand -base64 16)

# Storage
MINIO_ROOT_USER=omnivore
MINIO_ROOT_PASSWORD=$(openssl rand -base64 16)

# URLs
CLIENT_URL=http://localhost:3000
GATEWAY_URL=http://localhost:3000/api

EOF

    # Copy additional settings from old .env if exists
    if [ -f ".env" ]; then
        info "Migrating settings from existing .env file..."
        
        # Extract custom settings
        grep -E "^(OPENAI_API_KEY|ANTHROPIC_API_KEY|SMTP_|EMAIL_|SENTRY_)" .env >> .env.new || true
    fi
    
    # Download appropriate docker-compose file
    info "Downloading docker-compose configuration..."
    if [ "$PROFILE" = "custom" ]; then
        cp deploy/profiles/standard.yaml docker-compose.new.yml
        warn "Using standard profile as base for custom configuration. Please edit docker-compose.new.yml"
    else
        cp deploy/profiles/${PROFILE}.yaml docker-compose.new.yml
    fi
}

# Stop old services
stop_old_services() {
    info "Stopping old services..."
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose down
    else
        # Stop individual containers
        docker ps --filter "name=omnivore" -q | xargs -r docker stop
    fi
    
    info "Old services stopped"
}

# Migrate data
migrate_data() {
    info "Starting data migration..."
    
    # Start only the database services for the new architecture
    docker-compose -f docker-compose.new.yml up -d postgres redis minio 2>/dev/null || true
    
    # Wait for services to be ready
    info "Waiting for services to be ready..."
    sleep 10
    
    # Restore PostgreSQL data if backup exists
    if [ -f "$BACKUP_DIR/postgres-backup.sql" ]; then
        info "Restoring PostgreSQL data..."
        docker exec -i $(docker ps -qf "name=postgres") psql -U postgres < "$BACKUP_DIR/postgres-backup.sql"
    fi
    
    # Restore Redis data if backup exists
    if [ -f "$BACKUP_DIR/redis-backup.rdb" ]; then
        info "Restoring Redis data..."
        docker cp "$BACKUP_DIR/redis-backup.rdb" $(docker ps -qf "name=redis"):/data/dump.rdb
        docker exec $(docker ps -qf "name=redis") redis-cli SHUTDOWN SAVE
        docker-compose -f docker-compose.new.yml restart redis
    fi
    
    info "Data migration completed"
}

# Start new services
start_new_services() {
    info "Starting new consolidated services..."
    
    # Rename new files to active
    mv .env.new .env
    mv docker-compose.new.yml docker-compose.yml
    
    # Start all services
    docker-compose up -d
    
    info "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        info "Services are healthy!"
    else
        warn "Services may still be starting. Check 'docker-compose logs' for details."
    fi
}

# Cleanup old resources
cleanup() {
    read -p "Remove old Docker images and volumes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Cleaning up old resources..."
        
        # Remove old images
        docker images | grep omnivore | grep -v "omnivore/omnivore" | awk '{print $3}' | xargs -r docker rmi
        
        # Remove unused volumes
        docker volume prune -f
        
        info "Cleanup completed"
    fi
}

# Main migration flow
main() {
    echo "This script will migrate your Omnivore installation to the new consolidated architecture."
    echo "A full backup will be created before any changes are made."
    echo ""
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    check_environment
    backup_data
    detect_profile
    generate_config
    
    echo ""
    echo "Ready to migrate to the consolidated architecture."
    echo "This will:"
    echo "  1. Stop all current Omnivore services"
    echo "  2. Migrate your data to the new architecture"
    echo "  3. Start the new consolidated services"
    echo ""
    read -p "Proceed with migration? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Migration cancelled. Backup saved in $BACKUP_DIR"
        exit 0
    fi
    
    stop_old_services
    migrate_data
    start_new_services
    cleanup
    
    echo ""
    echo -e "${GREEN}Migration completed successfully!${NC}"
    echo ""
    echo "Your Omnivore instance is now running with the consolidated architecture."
    echo "Access it at: http://localhost:3000"
    echo ""
    echo "Backup location: $BACKUP_DIR"
    echo ""
    echo "If you encounter any issues:"
    echo "  1. Check logs: docker-compose logs"
    echo "  2. Restore from backup: ./scripts/migration/restore-backup.sh $BACKUP_DIR"
    echo "  3. Report issues: https://github.com/omnivore-app/omnivore/issues"
}

# Run main function
main