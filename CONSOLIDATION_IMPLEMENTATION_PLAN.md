# Omnivore Consolidation Implementation Plan

## Phase 1: Service Consolidation Analysis & Preparation (Week 1-2)

### Current State Assessment
Based on codebase analysis, Omnivore currently has:
- **Core Services**: web, api, content-fetch
- **Processing Services**: puppeteer-parse, pdf-handler, thumbnail-handler, readabilityjs, text-to-speech
- **Background Services**: queue-processor, export-handler, import-handler, integration-handler, rule-handler, rss-handler
- **Email Services**: inbound-email-handler, imap-mail-watcher, local-mail-watcher

### Key Findings
1. **API Service Already Consolidated**: The API service already includes most job processing logic in `/packages/api/src/jobs/`
2. **Shared Dependencies**: Many services share similar dependencies (Express, BullMQ, Redis)
3. **Internal Communication**: Services communicate via Redis queues and HTTP calls

## Phase 1 Implementation Steps

### 1.1 Create Feature Flag System
```typescript
// packages/api/src/config/features.ts
export interface FeatureConfig {
  contentProcessing: boolean
  emailIngestion: boolean
  aiFeatures: boolean
  advancedSearch: boolean
  pdfProcessing: boolean
  thumbnailGeneration: boolean
  textToSpeech: boolean
  rssHandling: boolean
  integrations: boolean
}

export const getFeatureConfig = (): FeatureConfig => ({
  contentProcessing: process.env.ENABLE_CONTENT_PROCESSING !== 'false',
  emailIngestion: process.env.ENABLE_EMAIL_INGESTION === 'true',
  aiFeatures: process.env.ENABLE_AI_FEATURES === 'true',
  advancedSearch: process.env.ENABLE_ELASTICSEARCH === 'true',
  pdfProcessing: process.env.ENABLE_PDF_PROCESSING !== 'false',
  thumbnailGeneration: process.env.ENABLE_THUMBNAIL_GENERATION !== 'false',
  textToSpeech: process.env.ENABLE_TEXT_TO_SPEECH === 'true',
  rssHandling: process.env.ENABLE_RSS_HANDLING !== 'false',
  integrations: process.env.ENABLE_INTEGRATIONS === 'true',
})
```

### 1.2 Move Service Logic into API Package
Create consolidated handlers in `/packages/api/src/handlers/`:
- `content-processor.ts` (combines content-fetch, puppeteer-parse, pdf-handler, thumbnail-handler)
- `email-processor.ts` (combines inbound-email-handler, imap-mail-watcher, local-mail-watcher)
- `background-processor.ts` (combines export-handler, import-handler, integration-handler, rule-handler, rss-handler)

### 1.3 Update Package Dependencies
Consolidate dependencies from separate services into the API package.json:
```json
{
  "dependencies": {
    // Existing API dependencies
    // Add from content-fetch
    "@omnivore/puppeteer-parse": "^1.0.0",
    // Add from pdf-handler
    "pdfjs-dist": "^2.16.105",
    // Add from other services...
  }
}
```

## Phase 2: Docker & Deployment Optimization (Week 3-4)

### 2.1 Create Multi-Stage Dockerfile
```dockerfile
# packages/api/Dockerfile.consolidated
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
FROM base AS deps
RUN yarn install --frozen-lockfile

# Build stage
FROM base AS build
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build

# Production stage with feature selection
FROM node:18-alpine AS production
WORKDIR /app

# Install runtime dependencies based on features
ARG ENABLE_PUPPETEER=true
ARG ENABLE_PDF_PROCESSING=true

RUN if [ "$ENABLE_PUPPETEER" = "true" ]; then \
    apk add --no-cache chromium; \
    fi

COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 8080
CMD ["node", "dist/server.js"]
```

### 2.2 Create Deployment Profiles
```yaml
# deployment-profiles.yml
profiles:
  minimal:
    services: ["omnivore-core"]
    features:
      contentProcessing: true
      pdfProcessing: false
      aiFeatures: false
      emailIngestion: false
    resources:
      memory: "512Mi"
      cpu: "0.5"

  standard:
    services: ["omnivore-core", "omnivore-worker"]
    features:
      contentProcessing: true
      pdfProcessing: true
      aiFeatures: false
      emailIngestion: true
    resources:
      memory: "1Gi"
      cpu: "1"

  enterprise:
    services: ["omnivore-core", "omnivore-worker", "omnivore-ai"]
    features:
      contentProcessing: true
      pdfProcessing: true
      aiFeatures: true
      emailIngestion: true
      integrations: true
    resources:
      memory: "2Gi"
      cpu: "2"
```

### 2.3 Simplified Docker Compose
```yaml
# self-hosting/docker-compose/consolidated/docker-compose.yml
version: '3.8'

services:
  omnivore:
    image: ghcr.io/omnivore-app/omnivore:latest
    container_name: omnivore
    ports:
      - "3000:3000"  # Web UI
      - "4000:4000"  # API
    environment:
      - DEPLOYMENT_PROFILE=standard
      - ENABLE_CONTENT_PROCESSING=true
      - ENABLE_PDF_PROCESSING=true
      - ENABLE_AI_FEATURES=false
    volumes:
      - omnivore_data:/app/data
    depends_on:
      - postgres
      - redis

  postgres:
    image: ankane/pgvector:v0.5.1
    container_name: omnivore-postgres
    environment:
      POSTGRES_DB: omnivore
      POSTGRES_USER: omnivore
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7.2.4
    container_name: omnivore-redis
    volumes:
      - redis_data:/data

volumes:
  omnivore_data:
  postgres_data:
  redis_data:
```

## Phase 3: Configuration & Plugin System (Week 5-6)

### 3.1 Plugin Architecture
```typescript
// packages/api/src/plugins/plugin-manager.ts
export interface OmnivorePlugin {
  name: string
  version: string
  init(context: PluginContext): Promise<void>
  handlers: {
    [event: string]: Handler
  }
  shutdown?(): Promise<void>
}

export class PluginManager {
  private plugins: Map<string, OmnivorePlugin> = new Map()
  
  async loadPlugin(plugin: OmnivorePlugin): Promise<void> {
    await plugin.init(this.createContext())
    this.plugins.set(plugin.name, plugin)
  }
  
  private createContext(): PluginContext {
    return {
      config: getFeatureConfig(),
      logger: this.logger,
      db: this.dataSource,
      redis: this.redis,
    }
  }
}
```

### 3.2 Environment-Based Configuration
```typescript
// packages/api/src/config/deployment.ts
export interface DeploymentConfig {
  profile: 'minimal' | 'standard' | 'enterprise'
  features: FeatureConfig
  resources: ResourceConfig
  storage: StorageConfig
}

export const getDeploymentConfig = (): DeploymentConfig => {
  const profile = process.env.DEPLOYMENT_PROFILE || 'standard'
  
  switch (profile) {
    case 'minimal':
      return {
        profile,
        features: {
          contentProcessing: true,
          pdfProcessing: false,
          aiFeatures: false,
          emailIngestion: false,
          // ... other minimal features
        },
        resources: {
          maxWorkers: 2,
          memoryLimit: '512Mi',
        },
        storage: {
          type: 'local',
          path: '/app/data',
        },
      }
    // ... other profiles
  }
}
```

## Phase 4: Migration & Testing (Week 7-8)

### 4.1 Migration Strategy
1. **Backward Compatibility**: Maintain API compatibility during transition
2. **Feature Flags**: Gradual rollout of consolidated features
3. **Data Migration**: Ensure all existing data remains accessible
4. **Service Discovery**: Update internal service calls to use consolidated endpoints

### 4.2 Testing Plan
```typescript
// tests/integration/consolidation.test.ts
describe('Service Consolidation', () => {
  it('should handle content processing in consolidated service', async () => {
    // Test content-fetch, puppeteer-parse, pdf-handler functionality
  })
  
  it('should process background jobs correctly', async () => {
    // Test export, import, integration handlers
  })
  
  it('should handle email ingestion', async () => {
    // Test email processing functionality
  })
  
  it('should maintain API compatibility', async () => {
    // Test that existing API endpoints still work
  })
})
```

### 4.3 Performance Benchmarks
- Memory usage comparison (before/after consolidation)
- Response time measurements
- Throughput testing
- Cold start time evaluation

## Expected Outcomes

### Cost Reduction
- **Development**: Single codebase to maintain
- **Deployment**: Fewer containers and services
- **Infrastructure**: Reduced resource usage
- **Self-Hosting**: Simplified setup process

### Performance Improvements
- **Latency**: Eliminated inter-service communication
- **Memory**: Shared resources and connection pools
- **Startup**: Faster cold start times
- **Throughput**: Better resource utilization

### Developer Experience
- **Setup**: Single command deployment
- **Debugging**: Unified logging and tracing
- **Testing**: Simplified test environment
- **Contribution**: Lower barrier to entry

## Risk Mitigation

### Technical Risks
1. **Memory Usage**: Monitor and optimize resource consumption
2. **Process Isolation**: Use worker threads for heavy processing
3. **Fault Tolerance**: Implement circuit breakers and retries
4. **Scalability**: Design for horizontal scaling

### Migration Risks
1. **Data Loss**: Comprehensive backup strategy
2. **Downtime**: Blue-green deployment approach
3. **Feature Regression**: Extensive testing coverage
4. **User Impact**: Gradual rollout with rollback capability

## Success Metrics

### Quantitative Goals
- 50% reduction in cold start time
- 75% reduction in memory usage (self-hosted)
- 90% reduction in inter-service latency
- 80% reduction in cloud hosting costs

### Qualitative Goals
- Simplified self-hosting process (5-minute setup)
- Improved developer onboarding experience
- Better resource utilization
- Enhanced system reliability

## Next Steps

1. **Week 1**: Implement feature flag system and begin service consolidation
2. **Week 2**: Complete initial service merging and internal testing
3. **Week 3**: Create consolidated Docker images and deployment profiles
4. **Week 4**: Optimize build process and resource usage
5. **Week 5**: Implement plugin architecture and configuration system
6. **Week 6**: Complete environment-based feature toggles
7. **Week 7**: Comprehensive testing and performance benchmarking
8. **Week 8**: Migration testing and documentation updates

This implementation plan provides a structured approach to consolidating Omnivore's architecture while maintaining functionality and improving the self-hosting experience.