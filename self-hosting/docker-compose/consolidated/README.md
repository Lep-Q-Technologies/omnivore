# Omnivore Consolidated Deployment

This directory contains a simplified, consolidated deployment of Omnivore that reduces the complexity from 25+ microservices to just 3 main containers:

- **omnivore**: Main application (web UI + API + background processing)
- **postgres**: Database with pgvector extension
- **redis**: Queue and caching layer

## 🚀 Quick Start (5-minute setup)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/omnivore-app/omnivore.git
   cd omnivore/self-hosting/docker-compose/consolidated
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

3. **Start Omnivore**:
   ```bash
   docker compose up -d
   ```

4. **Access the application**:
   - Web UI: http://localhost:3000
   - API: http://localhost:4000

That's it! Omnivore is now running with a default user account.

## 📋 Deployment Profiles

Choose the profile that best fits your needs:

### Minimal Profile
**Best for**: Personal use, low-resource servers, testing
**Resources**: ~512MB RAM, 0.5 CPU cores
**Features**: Basic reading, highlighting, simple content processing

```bash
DEPLOYMENT_PROFILE=minimal
```

### Standard Profile (Default)
**Best for**: Small teams, home servers, most self-hosted deployments
**Resources**: ~1GB RAM, 1 CPU core
**Features**: Full content processing, PDF support, thumbnails, integrations

```bash
DEPLOYMENT_PROFILE=standard
```

### Enterprise Profile
**Best for**: Large teams, production deployments, advanced features
**Resources**: ~2GB RAM, 2 CPU cores
**Features**: All features including AI summaries, advanced search, full integrations

```bash
DEPLOYMENT_PROFILE=enterprise
```

## 🔧 Configuration Options

### Feature Flags
Enable or disable features based on your needs:

```bash
# Core Features (recommended to keep enabled)
ENABLE_CONTENT_PROCESSING=true
ENABLE_RSS_HANDLING=true

# Resource-Intensive Features
ENABLE_PDF_PROCESSING=true          # Requires more memory
ENABLE_THUMBNAIL_GENERATION=true    # Requires more CPU
ENABLE_AI_FEATURES=false           # Requires AI API keys

# Optional Features
ENABLE_EMAIL_INGESTION=false       # Requires email configuration
ENABLE_TEXT_TO_SPEECH=false        # Requires TTS service
ENABLE_INTEGRATIONS=true           # Third-party integrations
```

### Resource Limits
Adjust based on your server capacity:

```bash
MAX_WORKERS=4                      # Number of background workers
MAX_CONCURRENT_JOBS=10             # Max simultaneous processing jobs
```

### Storage Options
Choose where to store your data:

```bash
# Local storage (default, simplest)
STORAGE_TYPE=local

# AWS S3 (for cloud deployments)
STORAGE_TYPE=s3
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Google Cloud Storage
STORAGE_TYPE=gcs
GCS_UPLOAD_BUCKET=your-bucket-name
```

## 🔐 Security Configuration

**Important**: Change these secrets in production:

```bash
# Generate strong random secrets
JWT_SECRET=$(openssl rand -base64 32)
SSO_JWT_SECRET=$(openssl rand -base64 32)
IMAGE_PROXY_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- Main service: `http://localhost:4000/api/health`
- Database: Automatic health checks in Docker Compose
- Redis: Automatic health checks in Docker Compose

### Logs
View application logs:
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f omnivore
```

### Resource Usage
Monitor resource usage:
```bash
docker stats
```

## 🔧 Advanced Configuration

### Separate Worker Service
For high-load deployments, run a separate worker service:

```bash
# Start with worker profile
docker compose --profile worker up -d
```

This adds a dedicated `omnivore-worker` container for heavy processing tasks.

### Custom Domain
To use a custom domain:

1. Update URLs in `.env`:
   ```bash
   BASE_URL=https://omnivore.yourdomain.com
   SERVER_BASE_URL=https://api.omnivore.yourdomain.com
   CLIENT_URL=https://omnivore.yourdomain.com
   HIGHLIGHTS_BASE_URL=https://omnivore.yourdomain.com
   ```

2. Configure your reverse proxy (nginx, Traefik, etc.) to forward:
   - `omnivore.yourdomain.com` → `localhost:3000`
   - `api.omnivore.yourdomain.com` → `localhost:4000`

### Email Integration
To enable email ingestion:

1. Configure IMAP settings:
   ```bash
   ENABLE_EMAIL_INGESTION=true
   IMAP_HOST=imap.gmail.com
   IMAP_PORT=993
   IMAP_USER=your-email@gmail.com
   IMAP_PASSWORD=your-app-password
   IMAP_USE_TLS=true
   ```

2. Restart the service:
   ```bash
   docker compose restart omnivore
   ```

### AI Features
To enable AI summaries and features:

1. Get API keys from OpenAI or Anthropic
2. Configure in `.env`:
   ```bash
   ENABLE_AI_FEATURES=true
   OPENAI_API_KEY=your-openai-api-key
   # OR
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ```

## 🔄 Maintenance

### Updates
Update to the latest version:
```bash
docker compose pull
docker compose up -d
```

### Backups
Backup your data:
```bash
# Database backup
docker exec omnivore-postgres pg_dump -U omnivore omnivore > backup.sql

# Data volume backup
docker run --rm -v omnivore_data:/data -v $(pwd):/backup alpine tar czf /backup/omnivore-data-backup.tar.gz /data
```

### Reset/Clean Install
To start fresh:
```bash
docker compose down -v  # This will delete all data!
docker compose up -d
```

## 🐛 Troubleshooting

### Common Issues

**Service won't start**:
- Check logs: `docker compose logs omnivore`
- Verify environment variables in `.env`
- Ensure ports 3000 and 4000 are available

**Database connection errors**:
- Wait for database to fully initialize (can take 30-60 seconds)
- Check postgres logs: `docker compose logs postgres`

**High memory usage**:
- Reduce `MAX_WORKERS` and `MAX_CONCURRENT_JOBS`
- Disable resource-intensive features like PDF processing
- Switch to minimal profile

**Content processing not working**:
- Check if `ENABLE_CONTENT_PROCESSING=true`
- Verify network connectivity from container
- Check worker logs for specific errors

### Getting Help
- Check the [main documentation](../../../docs/)
- Search [GitHub issues](https://github.com/omnivore-app/omnivore/issues)
- Join the [Discord community](https://discord.gg/h2z5rppzz9)

## 📈 Performance Optimization

### For Low-Resource Servers
```bash
DEPLOYMENT_PROFILE=minimal
MAX_WORKERS=2
MAX_CONCURRENT_JOBS=5
ENABLE_PDF_PROCESSING=false
ENABLE_THUMBNAIL_GENERATION=false
REDIS_MAXMEMORY=128mb
```

### For High-Performance Servers
```bash
DEPLOYMENT_PROFILE=enterprise
MAX_WORKERS=8
MAX_CONCURRENT_JOBS=20
docker compose --profile worker up -d
```

## 🔄 Migration from Multi-Service Setup

If you're migrating from the traditional multi-service setup:

1. **Backup your data** (database and uploaded files)
2. **Stop the old deployment**:
   ```bash
   cd ../  # Go to original docker-compose directory
   docker compose down
   ```
3. **Update configuration** in the consolidated `.env` file
4. **Start the consolidated deployment**:
   ```bash
   cd consolidated/
   docker compose up -d
   ```

The consolidated version maintains full API compatibility and data format compatibility.

---

This consolidated deployment reduces complexity while maintaining all of Omnivore's powerful features. The architecture is designed to be simple to deploy, easy to maintain, and cost-effective for self-hosting.