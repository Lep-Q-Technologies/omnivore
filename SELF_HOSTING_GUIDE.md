# Omnivore Self-Hosting Guide (Consolidated Architecture)

## Overview

This guide will help you self-host Omnivore using our new consolidated architecture, which dramatically simplifies deployment and reduces resource requirements.

## Deployment Profiles

We offer three pre-configured profiles:

### 1. Minimal Profile (Recommended for Personal Use)
- **Memory**: ~256-512MB
- **Storage**: SQLite database
- **Features**: Core reading, highlighting, folders, labels
- **Best for**: Single user, Raspberry Pi, small VPS
- **Monthly cost**: < $5

### 2. Standard Profile (Recommended for Small Teams)
- **Memory**: ~1-2GB
- **Storage**: PostgreSQL + S3/MinIO
- **Features**: All content types, email ingestion, RSS, integrations
- **Best for**: Small teams, family sharing
- **Monthly cost**: $10-20

### 3. Enterprise Profile (Full Features)
- **Memory**: 4GB+
- **Storage**: PostgreSQL + S3 + Elasticsearch
- **Features**: AI summaries, advanced search, all integrations
- **Best for**: Organizations, power users
- **Monthly cost**: $50+

## Quick Start

### Minimal Installation (5 minutes)

```bash
# Download and run
docker run -d \
  --name omnivore \
  -p 3000:3000 \
  -v omnivore-data:/data \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  omnivore/omnivore:minimal

# Access at http://localhost:3000
```

### Standard Installation (10 minutes)

```bash
# 1. Download the configuration
curl -O https://raw.githubusercontent.com/omnivore-app/omnivore/main/deploy/profiles/standard.yaml

# 2. Create environment file
cat > .env << EOF
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 16)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 16)
EOF

# 3. Start services
docker-compose -f standard.yaml up -d

# 4. Access at http://localhost:3000
```

## Detailed Installation Guide

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+ (for standard/enterprise)
- 1GB+ free disk space
- Port 3000 available (or configure alternative)

### Step 1: Choose Your Profile

Evaluate your needs:

| Feature | Minimal | Standard | Enterprise |
|---------|---------|----------|------------|
| Users | 1-2 | 2-50 | 50+ |
| Articles stored | 10,000 | 100,000 | Unlimited |
| PDF support | ❌ | ✅ | ✅ |
| Email ingestion | ❌ | ✅ | ✅ |
| RSS feeds | ❌ | ✅ | ✅ |
| AI features | ❌ | ❌ | ✅ |
| Full-text search | Basic | Good | Advanced |
| Integrations | ❌ | Most | All |

### Step 2: Prepare Your Environment

#### For Minimal Profile:

```bash
# Create a directory for Omnivore
mkdir ~/omnivore && cd ~/omnivore

# Create docker-compose.yml
curl -O https://raw.githubusercontent.com/omnivore-app/omnivore/main/deploy/profiles/minimal.yaml
mv minimal.yaml docker-compose.yml
```

#### For Standard Profile:

```bash
# Create a directory for Omnivore
mkdir ~/omnivore && cd ~/omnivore

# Download configuration
curl -O https://raw.githubusercontent.com/omnivore-app/omnivore/main/deploy/profiles/standard.yaml
mv standard.yaml docker-compose.yml

# Create .env file
cat > .env << EOF
# Security - CHANGE THESE!
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
SSO_JWT_SECRET=$(openssl rand -base64 32)

# Database
POSTGRES_PASSWORD=$(openssl rand -base64 16)

# Storage
MINIO_ROOT_USER=omnivore
MINIO_ROOT_PASSWORD=$(openssl rand -base64 16)

# URLs - Update these for your domain
CLIENT_URL=http://localhost:3000
GATEWAY_URL=http://localhost:3000/api
EOF
```

### Step 3: Configure Features (Optional)

Edit your `.env` file to enable/disable features:

```bash
# Core Features (minimal profile has these disabled)
ENABLE_PDF=true              # PDF processing
ENABLE_EMAIL=true            # Email ingestion
ENABLE_RSS=true              # RSS feed support
ENABLE_NEWSLETTERS=true      # Newsletter subscriptions

# Integrations
ENABLE_POCKET=true           # Pocket import
ENABLE_READWISE=true         # Readwise sync
ENABLE_LOGSEQ=true          # Logseq export
ENABLE_OBSIDIAN=true        # Obsidian export

# Advanced Features (enterprise only)
ENABLE_AI_FEATURES=true      # AI summaries
ENABLE_ELASTICSEARCH=true    # Advanced search
```

### Step 4: Start Omnivore

```bash
# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Wait for services to be ready (usually 30-60 seconds)
```

### Step 5: Initial Setup

1. Navigate to http://localhost:3000
2. Click "Sign up" to create your account
3. Verify your email (check logs if using local email)
4. Start saving articles!

## Configuration Options

### Using a Custom Domain

1. Update your `.env` file:
```bash
CLIENT_URL=https://read.yourdomain.com
GATEWAY_URL=https://read.yourdomain.com/api
```

2. Set up a reverse proxy (nginx example):
```nginx
server {
    listen 80;
    server_name read.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Email Configuration

To enable email ingestion, add to your `.env`:

```bash
# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Email ingestion
ENABLE_EMAIL=true
EMAIL_DOMAIN=yourdomain.com
```

### Storage Options

#### Local Storage (Minimal Profile)
Files are stored in the Docker volume. No configuration needed.

#### S3/MinIO (Standard Profile)
Default configuration uses MinIO. For AWS S3:

```bash
USE_S3=true
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
GCS_UPLOAD_BUCKET=your-bucket
```

## Backup and Restore

### Automated Backups

Create a backup script:

```bash
#!/bin/bash
# backup-omnivore.sh

BACKUP_DIR="/backups/omnivore/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
docker exec omnivore-postgres pg_dumpall -U postgres > "$BACKUP_DIR/postgres.sql"

# Backup files
docker run --rm -v omnivore-data:/source:ro -v "$BACKUP_DIR":/backup alpine \
  tar -czf /backup/data.tar.gz -C /source .

echo "Backup completed: $BACKUP_DIR"
```

Add to crontab for daily backups:
```bash
0 2 * * * /path/to/backup-omnivore.sh
```

### Restore from Backup

```bash
# Restore database
docker exec -i omnivore-postgres psql -U postgres < /backups/postgres.sql

# Restore files
docker run --rm -v omnivore-data:/target -v /backups:/backup alpine \
  tar -xzf /backup/data.tar.gz -C /target
```

## Upgrading

### Automatic Updates

Use Watchtower for automatic updates:

```yaml
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 86400 --cleanup omnivore
```

### Manual Updates

```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose down && docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Change port in docker-compose.yml
   ports:
     - "8080:3000"
   ```

2. **Out of memory**
   - Switch to minimal profile
   - Increase swap space
   - Upgrade your server

3. **Cannot access from external network**
   - Check firewall rules
   - Ensure CLIENT_URL is set correctly
   - Verify reverse proxy configuration

### Debug Mode

Enable debug logging:
```bash
# Add to .env
LOG_LEVEL=debug
NODE_ENV=development
```

### Health Checks

Check service health:
```bash
# Overall health
curl http://localhost:3000/health

# Detailed status
docker-compose ps
docker-compose logs --tail=50
```

## Performance Tuning

### For Minimal Profile

```bash
# Optimize SQLite
SQLITE_PRAGMA_JOURNAL_MODE=WAL
SQLITE_PRAGMA_SYNCHRONOUS=NORMAL
```

### For Standard Profile

```bash
# PostgreSQL tuning
PG_POOL_MAX=20
PG_STATEMENT_TIMEOUT=30000

# Redis optimization
REDIS_MAXMEMORY=256mb
REDIS_MAXMEMORY_POLICY=allkeys-lru
```

## Security Best Practices

1. **Use strong secrets**
   ```bash
   # Generate secure secrets
   openssl rand -base64 32
   ```

2. **Enable HTTPS**
   - Use Let's Encrypt with nginx
   - Or use Cloudflare Tunnel

3. **Regular updates**
   - Enable automatic updates
   - Monitor security advisories

4. **Backup encryption**
   ```bash
   # Encrypt backups
   tar -czf - /backup | openssl enc -aes-256-cbc -salt -out backup.tar.gz.enc
   ```

## Migration from Old Architecture

If you're running the old multi-service architecture:

```bash
# Download migration script
curl -O https://raw.githubusercontent.com/omnivore-app/omnivore/main/scripts/migration/migrate-to-consolidated.sh
chmod +x migrate-to-consolidated.sh

# Run migration
./migrate-to-consolidated.sh
```

## Getting Help

- 📚 [Documentation](https://docs.omnivore.app)
- 💬 [Discord Community](https://discord.gg/h2z5rppzz9)
- 🐛 [GitHub Issues](https://github.com/omnivore-app/omnivore/issues)
- 📧 Email: support@omnivore.app

## Contributing

We welcome contributions! The consolidated architecture makes it easier than ever to:

1. Run Omnivore locally
2. Add new features
3. Fix bugs
4. Improve documentation

See our [Contributing Guide](CONTRIBUTING.md) for details.

---

Happy reading! 📚✨