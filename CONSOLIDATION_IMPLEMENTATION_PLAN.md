# Omnivore Architecture Consolidation Implementation Plan

## Executive Summary

This document outlines the step-by-step implementation plan for consolidating Omnivore's 25+ microservices into a simplified architecture following the "Hybrid Approach" recommended in the architecture analysis.

## Target Architecture

### Three Core Services:
1. **omnivore**: Main application (web + api + basic processing)
2. **omnivore-worker**: Heavy processing (puppeteer, PDF, etc.)
3. **omnivore-edge** (optional): CDN/proxy functionality

## Phase 1: Foundation Setup (Week 1-2)

### 1.1 Create Modular Structure
```
packages/
├── omnivore-core/
│   ├── src/
│   │   ├── api/          # GraphQL API
│   │   ├── web/          # Next.js frontend
│   │   ├── modules/      # Feature modules
│   │   │   ├── auth/
│   │   │   ├── content/
│   │   │   ├── search/
│   │   │   └── user/
│   │   └── shared/       # Shared utilities
│   └── package.json
├── omnivore-worker/
│   ├── src/
│   │   ├── processors/   # Content processors
│   │   │   ├── pdf/
│   │   │   ├── puppeteer/
│   │   │   ├── readability/
│   │   │   └── thumbnail/
│   │   └── queue/        # Job queue management
│   └── package.json
└── omnivore-edge/        # Optional
```

### 1.2 Feature Flag System
Create a centralized feature flag configuration:

```typescript
// packages/omnivore-core/src/config/features.ts
export interface FeatureFlags {
  // Core features (always enabled)
  basicReading: true;
  highlighting: true;
  
  // Optional features
  aiSummaries: boolean;
  emailIngestion: boolean;
  advancedSearch: boolean;
  pdfProcessing: boolean;
  rssFeeds: boolean;
  integrations: {
    pocket: boolean;
    instapaper: boolean;
    readwise: boolean;
  };
}

export const loadFeatures = (): FeatureFlags => {
  return {
    basicReading: true,
    highlighting: true,
    aiSummaries: process.env.ENABLE_AI_FEATURES === 'true',
    emailIngestion: process.env.ENABLE_EMAIL === 'true',
    advancedSearch: process.env.ENABLE_ELASTICSEARCH === 'true',
    pdfProcessing: process.env.ENABLE_PDF !== 'false', // Default true
    rssFeeds: process.env.ENABLE_RSS === 'true',
    integrations: {
      pocket: process.env.ENABLE_POCKET === 'true',
      instapaper: process.env.ENABLE_INSTAPAPER === 'true',
      readwise: process.env.ENABLE_READWISE === 'true',
    }
  };
};
```

### 1.3 Deployment Profiles
Create deployment profiles for different use cases:

```yaml
# deploy/profiles/minimal.yaml
version: '3.8'
services:
  omnivore:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        PROFILE: minimal
    environment:
      - ENABLE_PDF=false
      - ENABLE_EMAIL=false
      - ENABLE_RSS=false
      - ENABLE_AI_FEATURES=false
      - DATABASE_TYPE=sqlite
    volumes:
      - ./data:/app/data
    ports:
      - "3000:3000"

# deploy/profiles/standard.yaml
version: '3.8'
services:
  omnivore:
    # ... standard config
  omnivore-worker:
    # ... worker config
  postgres:
    # ... postgres config
  redis:
    # ... redis config

# deploy/profiles/enterprise.yaml
# Full feature set with all services
```

## Phase 2: Service Consolidation (Week 3-4)

### 2.1 API Service Consolidation

Move all handler services into the API as modules:

```typescript
// packages/omnivore-core/src/modules/index.ts
export * from './rss-handler';
export * from './rule-handler';
export * from './export-handler';
export * from './import-handler';
export * from './integration-handler';
```

### 2.2 Content Processing Consolidation

Create a unified content processing pipeline:

```typescript
// packages/omnivore-worker/src/processors/pipeline.ts
export class ContentPipeline {
  private processors: Map<ContentType, Processor>;
  
  constructor(features: FeatureFlags) {
    this.processors = new Map();
    
    if (features.pdfProcessing) {
      this.processors.set('pdf', new PdfProcessor());
    }
    
    // Always include basic HTML processing
    this.processors.set('html', new HtmlProcessor());
    this.processors.set('article', new ReadabilityProcessor());
  }
  
  async process(content: Content): Promise<ProcessedContent> {
    const processor = this.processors.get(content.type);
    if (!processor) {
      throw new Error(`No processor for type: ${content.type}`);
    }
    
    return processor.process(content);
  }
}
```

### 2.3 Queue System Unification

Implement a unified queue system:

```typescript
// packages/omnivore-core/src/queue/manager.ts
export class UnifiedQueueManager {
  private queues: Map<string, Queue>;
  
  constructor(redis: Redis, features: FeatureFlags) {
    this.queues = new Map();
    
    // Core queues
    this.queues.set('content', new Queue('content', redis));
    this.queues.set('thumbnail', new Queue('thumbnail', redis));
    
    // Optional queues
    if (features.emailIngestion) {
      this.queues.set('email', new Queue('email', redis));
    }
    
    if (features.rssFeeds) {
      this.queues.set('rss', new Queue('rss', redis));
    }
  }
}
```

## Phase 3: Docker Optimization (Week 5)

### 3.1 Multi-stage Dockerfile

```dockerfile
# Dockerfile
# Base stage with common dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./

# Dependencies stage
FROM base AS deps
RUN yarn install --frozen-lockfile

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG PROFILE=standard
RUN yarn build:${PROFILE}

# Minimal runtime
FROM node:20-alpine AS runtime-minimal
WORKDIR /app
COPY --from=builder /app/dist/minimal ./
EXPOSE 3000
CMD ["node", "server.js"]

# Standard runtime
FROM node:20-alpine AS runtime-standard
WORKDIR /app
COPY --from=builder /app/dist/standard ./
RUN apk add --no-cache chromium
EXPOSE 3000
CMD ["node", "server.js"]

# Final stage based on profile
FROM runtime-${PROFILE:-standard}
```

### 3.2 Build Scripts

```json
// package.json
{
  "scripts": {
    "build:minimal": "node scripts/build.js --profile=minimal",
    "build:standard": "node scripts/build.js --profile=standard",
    "build:enterprise": "node scripts/build.js --profile=enterprise"
  }
}
```

## Phase 4: Migration Tools (Week 6)

### 4.1 Data Migration Script

```typescript
// scripts/migrate-to-consolidated.ts
export async function migrateToConsolidated() {
  console.log('Starting migration to consolidated architecture...');
  
  // 1. Backup existing data
  await backupDatabase();
  
  // 2. Update configuration
  await updateConfiguration();
  
  // 3. Migrate queue data
  await migrateQueues();
  
  // 4. Update service references
  await updateServiceReferences();
  
  console.log('Migration complete!');
}
```

### 4.2 Compatibility Layer

```typescript
// packages/omnivore-core/src/compat/legacy-api.ts
export class LegacyAPICompatibility {
  // Maintain backward compatibility for existing API endpoints
  async handleLegacyEndpoint(req: Request): Promise<Response> {
    // Map old endpoints to new structure
    const newEndpoint = this.mapLegacyEndpoint(req.path);
    return this.forwardToNewAPI(newEndpoint, req);
  }
}
```

## Phase 5: Testing Strategy (Week 7)

### 5.1 Test Profiles

```typescript
// test/profiles/minimal.test.ts
describe('Minimal Profile', () => {
  it('should start with only core features', async () => {
    const app = await startApp({ profile: 'minimal' });
    expect(app.features.basicReading).toBe(true);
    expect(app.features.pdfProcessing).toBe(false);
  });
});
```

### 5.2 Performance Benchmarks

```typescript
// test/benchmarks/consolidation.bench.ts
describe('Consolidation Performance', () => {
  benchmark('Memory usage', async () => {
    const oldArchitecture = await measureMemory('old');
    const newArchitecture = await measureMemory('new');
    
    expect(newArchitecture.memory).toBeLessThan(oldArchitecture.memory * 0.5);
  });
});
```

## Phase 6: Documentation (Week 8)

### 6.1 Self-Hosting Guide

```markdown
# Quick Start Guide

## Minimal Installation (Single User)
```bash
docker run -d \
  -p 3000:3000 \
  -v omnivore-data:/app/data \
  omnivore/omnivore:minimal
```

## Standard Installation
```bash
curl -O https://omnivore.app/docker-compose.standard.yml
docker-compose -f docker-compose.standard.yml up -d
```
```

### 6.2 Migration Guide

```markdown
# Migrating from Multi-Service to Consolidated

1. Backup your data:
   ```bash
   ./scripts/backup.sh
   ```

2. Run migration:
   ```bash
   ./scripts/migrate-to-consolidated.sh
   ```

3. Update your docker-compose.yml
4. Restart services
```

## Success Metrics

### Week 9-10: Monitoring and Optimization

1. **Performance Metrics**
   - Cold start time: < 10 seconds (from 50+ seconds)
   - Memory usage: < 500MB for minimal profile
   - API response time: < 100ms p95

2. **Cost Metrics**
   - Self-hosted: < $5/month on basic VPS
   - Cloud: 80% reduction in infrastructure costs

3. **Developer Metrics**
   - Setup time: < 5 minutes
   - Build time: < 2 minutes
   - Test suite: < 5 minutes

## Risk Mitigation

### Rollback Plan
1. Feature flags allow disabling new architecture
2. Database migrations are reversible
3. Old service containers remain available

### Monitoring
1. Prometheus metrics for all profiles
2. Health checks for each module
3. Error tracking with Sentry

## Timeline Summary

- **Weeks 1-2**: Foundation and feature flags
- **Weeks 3-4**: Service consolidation
- **Week 5**: Docker optimization
- **Week 6**: Migration tools
- **Week 7**: Testing
- **Week 8**: Documentation
- **Weeks 9-10**: Monitoring and optimization

This plan provides a clear path to consolidate Omnivore while maintaining flexibility and reducing complexity for self-hosters.