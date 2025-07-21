# Sample Implementation Tickets - Omnivore Simplification

## Phase 1: Foundation and Analysis (Weeks 1-2)

### OMNI-001: Architecture Audit and Service Dependency Mapping
Priority: P0
Story Points: 5
Dependencies: None

Description:
Create a comprehensive map of all service dependencies, API calls, and data flows between the 25+ microservices. Document which services can be safely merged without breaking functionality.

Technical Approach:
- Use static analysis tools to trace service dependencies
- Document all inter-service API calls
- Create dependency graphs using tools like Graphviz
- Analyze database access patterns per service
- Identify shared code and duplicate functionality

Acceptance Criteria:
- [ ] Complete service dependency matrix created
- [ ] API call flow documented for all services
- [ ] Database access patterns documented
- [ ] Identified top 5 service consolidation opportunities
- [ ] Risk assessment for each consolidation completed

Risks:
- Hidden dependencies not visible in code
- Undocumented service interactions
- Performance implications of consolidation

Migration Notes:
- This is analysis only, no code changes required

---

### OMNI-002: Create Monorepo Package Structure
Priority: P0
Story Points: 3
Dependencies: OMNI-001

Description:
Restructure the codebase to support gradual service consolidation by creating a proper monorepo structure with shared packages.

Technical Approach:
- Create packages/shared for common code
- Move service-specific code into packages/services/*
- Set up proper TypeScript project references
- Configure build tooling for selective builds
- Implement shared configuration management

Acceptance Criteria:
- [ ] Monorepo structure implemented
- [ ] All services building successfully
- [ ] Shared dependencies extracted
- [ ] Build time improved by 30%
- [ ] Documentation updated

Risks:
- Build complexity increases initially
- Potential circular dependencies

Migration Notes:
- No runtime changes, only build structure

---

## Phase 2: Service Consolidation (Weeks 3-6)

### OMNI-003: Consolidate Content Processing Services
Priority: P0
Story Points: 13
Dependencies: OMNI-002

Description:
Merge content-fetch, puppeteer-parse, readabilityjs, and pdf-handler into a single content-processor service with modular handlers.

Technical Approach:
```typescript
// New unified content processor structure
interface ContentProcessor {
  process(url: string, options: ProcessOptions): Promise<Content>
}

class UnifiedContentProcessor {
  private handlers: Map<ContentType, Handler>
  
  constructor() {
    this.handlers.set('html', new HtmlHandler())
    this.handlers.set('pdf', new PdfHandler())
    this.handlers.set('video', new VideoHandler())
  }
}
```

Acceptance Criteria:
- [ ] All content types processed by single service
- [ ] Performance benchmarks meet or exceed current
- [ ] Resource usage reduced by 40%
- [ ] All existing tests pass
- [ ] New integration tests added
- [ ] Rollback plan documented

Risks:
- Memory usage spike during transition
- Chromium instance management complexity
- Potential processing bottlenecks

Migration Notes:
- Feature flag to switch between old and new processor
- Gradual rollout by content type
- Keep old services running during transition

---

### OMNI-004: Implement Feature Flag System
Priority: P0
Story Points: 5
Dependencies: OMNI-002

Description:
Build a comprehensive feature flag system to support gradual migration and different deployment profiles.

Technical Approach:
```typescript
// Feature flag implementation
interface FeatureFlags {
  // Core features
  enablePdfProcessing: boolean
  enableEmailIngestion: boolean
  enableAiFeatures: boolean
  
  // Deployment profiles
  profile: 'minimal' | 'standard' | 'enterprise'
  
  // Service consolidation flags
  useUnifiedContentProcessor: boolean
  useConsolidatedWorker: boolean
}

class FeatureFlagService {
  private flags: FeatureFlags
  
  constructor() {
    this.flags = this.loadFromEnvironment()
  }
  
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature]
  }
}
```

Acceptance Criteria:
- [ ] Feature flag service implemented
- [ ] Environment-based configuration
- [ ] Runtime flag updates supported
- [ ] Admin UI for flag management
- [ ] Flags integrated into all services
- [ ] Documentation complete

Risks:
- Code complexity increases
- Testing combinations becomes harder

---

### OMNI-005: Create Unified Worker Service
Priority: P1
Story Points: 8
Dependencies: OMNI-003, OMNI-004

Description:
Consolidate all background job processing into a single worker service with pluggable job handlers.

Technical Approach:
```typescript
// Unified job processing
interface JobHandler {
  type: string
  process(job: Job): Promise<void>
}

class UnifiedWorker {
  private handlers: Map<string, JobHandler>
  private queue: Queue
  
  async processJobs() {
    while (true) {
      const job = await this.queue.dequeue()
      const handler = this.handlers.get(job.type)
      await handler.process(job)
    }
  }
}
```

Acceptance Criteria:
- [ ] All job types processed by single worker
- [ ] Job processing performance maintained
- [ ] Proper error handling and retries
- [ ] Monitoring and metrics in place
- [ ] Graceful shutdown implemented

Risks:
- Single point of failure for all jobs
- Resource contention between job types

---

## Phase 3: Docker and Deployment Optimization (Weeks 7-8)

### OMNI-006: Create Multi-Stage Docker Build
Priority: P1
Story Points: 5
Dependencies: OMNI-003, OMNI-005

Description:
Implement optimized Docker builds with feature-based image variants.

Technical Approach:
```dockerfile
# Multi-stage Dockerfile
FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY . .
RUN npm run build

# Minimal image
FROM base AS minimal
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
ENV PROFILE=minimal
CMD ["node", "dist/index.js"]

# Standard image with Chromium
FROM base AS standard
RUN apk add --no-cache chromium
COPY --from=minimal . .
ENV PROFILE=standard
CMD ["node", "dist/index.js"]
```

Acceptance Criteria:
- [ ] Docker images under 200MB (minimal)
- [ ] Docker images under 500MB (standard)
- [ ] Build time under 5 minutes
- [ ] All profiles tested
- [ ] Docker Compose updated

---

### OMNI-007: Implement Single-Command Development Setup
Priority: P1
Story Points: 3
Dependencies: OMNI-006

Description:
Create a streamlined development setup that gets developers running in under 5 minutes.

Technical Approach:
```bash
#!/bin/bash
# setup.sh
echo "🚀 Setting up Omnivore development environment..."

# Check prerequisites
check_requirements() {
  command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
  command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }
}

# Setup environment
setup_env() {
  cp .env.example .env.local
  echo "✅ Environment configured"
}

# Start services
start_services() {
  docker-compose up -d postgres redis minio
  npm install
  npm run db:migrate
  echo "✅ Services started"
}

# Main
check_requirements
setup_env
start_services
echo "🎉 Setup complete! Run 'npm run dev' to start developing"
```

Acceptance Criteria:
- [ ] Single command setup working
- [ ] Setup completes in under 5 minutes
- [ ] Works on Mac, Linux, Windows (WSL)
- [ ] Includes health checks
- [ ] Clear error messages

---

## Phase 4: Self-Hosting Excellence (Weeks 9-10)

### OMNI-008: Create Self-Hosting Configuration Wizard
Priority: P1
Story Points: 5
Dependencies: OMNI-007

Description:
Build an interactive configuration wizard for self-hosters to easily set up their instance.

Technical Approach:
```typescript
// Configuration wizard
class SetupWizard {
  async run() {
    const config = await this.promptConfiguration()
    await this.validateConfiguration(config)
    await this.generateEnvFile(config)
    await this.initializeDatabase()
    await this.createAdminUser()
  }
  
  private async promptConfiguration() {
    return {
      baseUrl: await prompt('Enter your domain (e.g., omnivore.mydomain.com):'),
      emailEnabled: await confirm('Enable email ingestion?'),
      aiEnabled: await confirm('Enable AI features? (requires API key)'),
      storageType: await select('Storage type:', ['local', 'minio', 's3'])
    }
  }
}
```

Acceptance Criteria:
- [ ] Interactive CLI wizard implemented
- [ ] Web-based setup option available
- [ ] Configuration validation
- [ ] Automatic SSL setup with Let's Encrypt
- [ ] Database initialization automated
- [ ] First-run experience documented

---

### OMNI-009: Implement Backup and Restore System
Priority: P1
Story Points: 8
Dependencies: OMNI-008

Description:
Create comprehensive backup and restore functionality for self-hosted instances.

Technical Approach:
```bash
# Backup script
omnivore backup create --output backup-$(date +%Y%m%d).tar.gz
# Includes: database dump, uploaded files, configuration

# Restore script  
omnivore backup restore --input backup-20240115.tar.gz
# Validates backup, stops services, restores data, restarts
```

Acceptance Criteria:
- [ ] Automated daily backups configurable
- [ ] Backup includes all user data
- [ ] Restore tested on fresh install
- [ ] Backup encryption supported
- [ ] S3/cloud backup destination supported
- [ ] Backup size optimization (incremental)

---

## Phase 5: Performance and Search (Weeks 11-12)

### OMNI-010: Implement PostgreSQL Full-Text Search
Priority: P2
Story Points: 8
Dependencies: OMNI-001

Description:
Replace external search with optimized PostgreSQL full-text search for self-hosters.

Technical Approach:
```sql
-- Add search columns and indexes
ALTER TABLE articles ADD COLUMN search_vector tsvector;

CREATE INDEX articles_search_idx ON articles USING gin(search_vector);

-- Update trigger for search vector
CREATE TRIGGER articles_search_update
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);
```

Acceptance Criteria:
- [ ] Search results in under 100ms
- [ ] Support for phrase search
- [ ] Relevance ranking implemented
- [ ] Search highlights in results
- [ ] Migration from existing search
- [ ] Fallback to Elasticsearch for cloud

---

### OMNI-011: Implement Smart Caching Layer
Priority: P2
Story Points: 5
Dependencies: OMNI-010

Description:
Add intelligent caching to reduce database load and improve response times.

Technical Approach:
- Implement Redis-based caching with smart invalidation
- Cache article content, user preferences, search results
- Use cache warming for popular content
- Implement edge caching headers

Acceptance Criteria:
- [ ] 80% cache hit rate achieved
- [ ] API response time <50ms for cached content
- [ ] Cache invalidation working correctly
- [ ] Memory usage within limits
- [ ] Cache statistics dashboard

---

## Success Metrics Dashboard

### OMNI-012: Create Unified Monitoring Dashboard
Priority: P2
Story Points: 5
Dependencies: All previous tickets

Description:
Build a comprehensive dashboard showing the success of the simplification effort.

Metrics to Track:
- Deployment time: Current 30min → Target 5min
- Service count: Current 25 → Target 3
- Memory usage: Current 4GB → Target 1GB
- Docker image size: Current 2GB → Target 200MB
- API latency: Current 200ms → Target 50ms
- Development setup: Current 2hr → Target 5min

This sample roadmap demonstrates how to break down the complex task of simplifying Omnivore into manageable, deployable chunks. Each ticket is self-contained, has clear success criteria, and builds toward the ultimate goal of a streamlined, efficient application.