# Omnivore Consolidation Implementation Plan

## Phase 1: Service Consolidation Strategy

### 1.1 Content Processing Consolidation

**Current State:**
- `content-fetch`: HTTP content fetching
- `puppeteer-parse`: Browser-based parsing
- `pdf-handler`: PDF processing
- `thumbnail-handler`: Image processing
- `readabilityjs`: Content extraction

**Consolidated Service: `content-processor`**

```typescript
// packages/content-processor/src/index.ts
import { ContentProcessor } from './processors/content-processor'
import { PdfProcessor } from './processors/pdf-processor'
import { ThumbnailProcessor } from './processors/thumbnail-processor'
import { ReadabilityProcessor } from './processors/readability-processor'
import { PuppeteerManager } from './browser/puppeteer-manager'

export class ContentProcessorService {
  private puppeteerManager: PuppeteerManager
  private processors: Map<string, any> = new Map()

  constructor(config: ContentProcessorConfig) {
    this.puppeteerManager = new PuppeteerManager(config.puppeteer)
    this.initializeProcessors(config)
  }

  private initializeProcessors(config: ContentProcessorConfig) {
    if (config.features.pdf) {
      this.processors.set('pdf', new PdfProcessor())
    }
    if (config.features.thumbnails) {
      this.processors.set('thumbnail', new ThumbnailProcessor())
    }
    if (config.features.readability) {
      this.processors.set('readability', new ReadabilityProcessor())
    }
  }

  async processUrl(url: string, options: ProcessOptions = {}): Promise<ProcessedContent> {
    const browser = await this.puppeteerManager.getBrowser()
    const page = await browser.newPage()
    
    try {
      await page.goto(url, { waitUntil: 'networkidle0' })
      
      const content = await page.content()
      const readability = this.processors.get('readability')
      const extracted = await readability.extract(content, url)
      
      if (options.generateThumbnail) {
        const thumbnail = this.processors.get('thumbnail')
        extracted.thumbnail = await thumbnail.generate(page)
      }
      
      return extracted
    } finally {
      await page.close()
    }
  }

  async processPdf(buffer: Buffer): Promise<ProcessedContent> {
    const pdf = this.processors.get('pdf')
    return await pdf.process(buffer)
  }

  async generateThumbnail(url: string): Promise<Thumbnail> {
    const thumbnail = this.processors.get('thumbnail')
    return await thumbnail.generateFromUrl(url)
  }
}
```

### 1.2 Email Services Consolidation

**Current State:**
- `inbound-email-handler`: Google Cloud Function
- `imap-mail-watcher`: IMAP monitoring
- `local-mail-watcher`: Local mail processing

**Consolidated Service: `email-processor`**

```typescript
// packages/email-processor/src/index.ts
import { ImapWatcher } from './watchers/imap-watcher'
import { LocalMailWatcher } from './watchers/local-mail-watcher'
import { EmailProcessor } from './processors/email-processor'
import { MailParser } from './parsers/mail-parser'

export class EmailProcessorService {
  private watchers: Map<string, any> = new Map()
  private processor: EmailProcessor
  private parser: MailParser

  constructor(config: EmailProcessorConfig) {
    this.processor = new EmailProcessor(config.api)
    this.parser = new MailParser()
    
    if (config.features.imap) {
      this.watchers.set('imap', new ImapWatcher(config.imap))
    }
    if (config.features.localMail) {
      this.watchers.set('local', new LocalMailWatcher(config.localMail))
    }
  }

  async start(): Promise<void> {
    for (const [name, watcher] of this.watchers) {
      await watcher.start((email: Email) => this.processEmail(email))
    }
  }

  async processInboundEmail(emailData: any): Promise<void> {
    const email = await this.parser.parse(emailData)
    await this.processor.process(email)
  }

  private async processEmail(email: Email): Promise<void> {
    await this.processor.process(email)
  }
}
```

### 1.3 Queue Processing Consolidation

**Current State:**
- `queue-manager`: Job queue management
- `export-handler`: Export functionality
- `import-handler`: Import functionality
- `integration-handler`: Third-party integrations
- `rule-handler`: Rule processing
- `rss-handler`: RSS feed processing

**Consolidated Service: `job-processor`**

```typescript
// packages/job-processor/src/index.ts
import { Queue, Worker } from 'bullmq'
import { ExportProcessor } from './processors/export-processor'
import { ImportProcessor } from './processors/import-processor'
import { IntegrationProcessor } from './processors/integration-processor'
import { RuleProcessor } from './processors/rule-processor'
import { RssProcessor } from './processors/rss-processor'

export class JobProcessorService {
  private queues: Map<string, Queue> = new Map()
  private workers: Map<string, Worker> = new Map()
  private processors: Map<string, any> = new Map()

  constructor(config: JobProcessorConfig) {
    this.initializeProcessors(config)
    this.initializeQueues(config)
  }

  private initializeProcessors(config: JobProcessorConfig) {
    if (config.features.export) {
      this.processors.set('export', new ExportProcessor(config.export))
    }
    if (config.features.import) {
      this.processors.set('import', new ImportProcessor(config.import))
    }
    if (config.features.integration) {
      this.processors.set('integration', new IntegrationProcessor(config.integration))
    }
    if (config.features.rules) {
      this.processors.set('rules', new RuleProcessor(config.rules))
    }
    if (config.features.rss) {
      this.processors.set('rss', new RssProcessor(config.rss))
    }
  }

  private initializeQueues(config: JobProcessorConfig) {
    const queueNames = ['export', 'import', 'integration', 'rules', 'rss']
    
    for (const name of queueNames) {
      if (config.features[name]) {
        const queue = new Queue(name, { connection: config.redis })
        const worker = new Worker(name, async (job) => {
          const processor = this.processors.get(name)
          return await processor.process(job.data)
        }, { connection: config.redis })
        
        this.queues.set(name, queue)
        this.workers.set(name, worker)
      }
    }
  }

  async addJob(queueName: string, data: any, options: any = {}): Promise<void> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not available`)
    }
    await queue.add('default', data, options)
  }
}
```

## Phase 2: API Integration

### 2.1 Internal Service Interfaces

```typescript
// packages/api/src/services/content-service.ts
import { ContentProcessorService } from '@omnivore/content-processor'

export class ContentService {
  private processor: ContentProcessorService

  constructor(config: any) {
    this.processor = new ContentProcessorService(config)
  }

  async processUrl(url: string): Promise<ProcessedContent> {
    return await this.processor.processUrl(url)
  }

  async processPdf(buffer: Buffer): Promise<ProcessedContent> {
    return await this.processor.processPdf(buffer)
  }
}
```

```typescript
// packages/api/src/services/email-service.ts
import { EmailProcessorService } from '@omnivore/email-processor'

export class EmailService {
  private processor: EmailProcessorService

  constructor(config: any) {
    this.processor = new EmailProcessorService(config)
  }

  async startEmailWatchers(): Promise<void> {
    await this.processor.start()
  }

  async processInboundEmail(emailData: any): Promise<void> {
    await this.processor.processInboundEmail(emailData)
  }
}
```

```typescript
// packages/api/src/services/job-service.ts
import { JobProcessorService } from '@omnivore/job-processor'

export class JobService {
  private processor: JobProcessorService

  constructor(config: any) {
    this.processor = new JobProcessorService(config)
  }

  async addExportJob(userId: string, format: string): Promise<void> {
    await this.processor.addJob('export', { userId, format })
  }

  async addImportJob(userId: string, file: Buffer): Promise<void> {
    await this.processor.addJob('import', { userId, file })
  }
}
```

### 2.2 Feature Flag System

```typescript
// packages/api/src/config/feature-flags.ts
export class FeatureManager {
  private features: Map<string, boolean> = new Map()

  constructor(env: NodeJS.ProcessEnv) {
    this.features.set('puppeteer', env.ENABLE_PUPPETEER === 'true')
    this.features.set('pdf', env.ENABLE_PDF === 'true')
    this.features.set('thumbnails', env.ENABLE_THUMBNAILS === 'true')
    this.features.set('email', env.ENABLE_EMAIL === 'true')
    this.features.set('export', env.ENABLE_EXPORT === 'true')
    this.features.set('import', env.ENABLE_IMPORT === 'true')
    this.features.set('integration', env.ENABLE_INTEGRATION === 'true')
    this.features.set('rules', env.ENABLE_RULES === 'true')
    this.features.set('rss', env.ENABLE_RSS === 'true')
  }

  isEnabled(feature: string): boolean {
    return this.features.get(feature) ?? false
  }

  getEnabledFeatures(): string[] {
    return Array.from(this.features.entries())
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature)
  }
}
```

## Phase 3: Docker Optimization

### 3.1 Multi-Stage Dockerfile

```dockerfile
# packages/api/Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage for content processing
FROM base AS content-processor
ENV ENABLE_PUPPETEER=true
ENV ENABLE_PDF=true
ENV ENABLE_THUMBNAILS=true
ENV ENABLE_READABILITY=true

# Install Chromium for Puppeteer
RUN apk add --no-cache chromium

COPY packages/content-processor ./packages/content-processor
RUN npm run build --workspace=@omnivore/content-processor

# Build stage for email processing
FROM base AS email-processor
ENV ENABLE_EMAIL=true
ENV ENABLE_IMAP=true
ENV ENABLE_LOCAL_MAIL=true

COPY packages/email-processor ./packages/email-processor
RUN npm run build --workspace=@omnivore/email-processor

# Build stage for job processing
FROM base AS job-processor
ENV ENABLE_EXPORT=true
ENV ENABLE_IMPORT=true
ENV ENABLE_INTEGRATION=true
ENV ENABLE_RULES=true
ENV ENABLE_RSS=true

COPY packages/job-processor ./packages/job-processor
RUN npm run build --workspace=@omnivore/job-processor

# Final API stage
FROM base AS api
ARG ENABLE_CONTENT_PROCESSING=false
ARG ENABLE_EMAIL_PROCESSING=false
ARG ENABLE_JOB_PROCESSING=false

COPY packages/api ./packages/api
RUN npm run build --workspace=@omnivore/api

# Copy consolidated services based on feature flags
COPY --from=content-processor /app/packages/content-processor ./packages/content-processor
COPY --from=email-processor /app/packages/email-processor ./packages/email-processor
COPY --from=job-processor /app/packages/job-processor ./packages/job-processor

EXPOSE 8080
CMD ["npm", "start", "--workspace=@omnivore/api"]
```

### 3.2 Docker Compose Configuration

```yaml
# docker-compose.consolidated.yml
version: '3.8'

services:
  omnivore-api:
    build:
      context: .
      dockerfile: packages/api/Dockerfile
      args:
        ENABLE_CONTENT_PROCESSING: ${ENABLE_CONTENT_PROCESSING:-true}
        ENABLE_EMAIL_PROCESSING: ${ENABLE_EMAIL_PROCESSING:-false}
        ENABLE_JOB_PROCESSING: ${ENABLE_JOB_PROCESSING:-true}
    environment:
      - ENABLE_PUPPETEER=${ENABLE_PUPPETEER:-true}
      - ENABLE_PDF=${ENABLE_PDF:-true}
      - ENABLE_THUMBNAILS=${ENABLE_THUMBNAILS:-true}
      - ENABLE_EMAIL=${ENABLE_EMAIL:-false}
      - ENABLE_EXPORT=${ENABLE_EXPORT:-true}
      - ENABLE_IMPORT=${ENABLE_IMPORT:-true}
      - ENABLE_RULES=${ENABLE_RULES:-true}
      - ENABLE_RSS=${ENABLE_RSS:-true}
    ports:
      - "4000:8080"
    depends_on:
      - postgres
      - redis

  omnivore-web:
    build:
      context: .
      dockerfile: packages/web/Dockerfile
    ports:
      - "3000:8080"
    depends_on:
      - omnivore-api

  postgres:
    image: ankane/pgvector:v0.5.1
    environment:
      POSTGRES_DB: omnivore
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7.2.4
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Phase 4: Migration Scripts

### 4.1 Service Migration

```typescript
// scripts/migrate-services.ts
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

interface MigrationConfig {
  sourceServices: string[]
  targetService: string
  features: string[]
}

const migrations: MigrationConfig[] = [
  {
    sourceServices: ['content-fetch', 'puppeteer-parse', 'pdf-handler', 'thumbnail-handler', 'readabilityjs'],
    targetService: 'content-processor',
    features: ['puppeteer', 'pdf', 'thumbnails', 'readability']
  },
  {
    sourceServices: ['inbound-email-handler', 'imap-mail-watcher', 'local-mail-watcher'],
    targetService: 'email-processor',
    features: ['email', 'imap', 'localMail']
  },
  {
    sourceServices: ['queue-manager', 'export-handler', 'import-handler', 'integration-handler', 'rule-handler', 'rss-handler'],
    targetService: 'job-processor',
    features: ['export', 'import', 'integration', 'rules', 'rss']
  }
]

async function migrateServices() {
  for (const migration of migrations) {
    console.log(`Migrating ${migration.sourceServices.join(', ')} to ${migration.targetService}`)
    
    // Create new service directory
    execSync(`mkdir -p packages/${migration.targetService}/src`)
    
    // Copy source code
    for (const service of migration.sourceServices) {
      execSync(`cp -r packages/${service}/src/* packages/${migration.targetService}/src/`)
    }
    
    // Create package.json for new service
    const packageJson = {
      name: `@omnivore/${migration.targetService}`,
      version: "1.0.0",
      main: "build/src/index.js",
      scripts: {
        build: "tsc",
        start: "node build/src/index.js"
      },
      dependencies: {
        "@omnivore/utils": "1.0.0"
      }
    }
    
    writeFileSync(
      `packages/${migration.targetService}/package.json`,
      JSON.stringify(packageJson, null, 2)
    )
  }
}

migrateServices().catch(console.error)
```

### 4.2 Configuration Migration

```typescript
// scripts/migrate-config.ts
import { readFileSync, writeFileSync } from 'fs'

interface OldConfig {
  services: string[]
  environment: Record<string, string>
}

interface NewConfig {
  features: Record<string, boolean>
  services: string[]
  environment: Record<string, string>
}

function migrateConfig(oldConfigPath: string, newConfigPath: string) {
  const oldConfig: OldConfig = JSON.parse(readFileSync(oldConfigPath, 'utf8'))
  
  const newConfig: NewConfig = {
    features: {
      puppeteer: oldConfig.services.includes('puppeteer-parse'),
      pdf: oldConfig.services.includes('pdf-handler'),
      thumbnails: oldConfig.services.includes('thumbnail-handler'),
      email: oldConfig.services.includes('inbound-email-handler') || 
             oldConfig.services.includes('imap-mail-watcher') ||
             oldConfig.services.includes('local-mail-watcher'),
      export: oldConfig.services.includes('export-handler'),
      import: oldConfig.services.includes('import-handler'),
      integration: oldConfig.services.includes('integration-handler'),
      rules: oldConfig.services.includes('rule-handler'),
      rss: oldConfig.services.includes('rss-handler')
    },
    services: ['api', 'web'],
    environment: {
      ...oldConfig.environment,
      ENABLE_PUPPETEER: oldConfig.services.includes('puppeteer-parse') ? 'true' : 'false',
      ENABLE_PDF: oldConfig.services.includes('pdf-handler') ? 'true' : 'false',
      ENABLE_EMAIL: (oldConfig.services.includes('inbound-email-handler') || 
                     oldConfig.services.includes('imap-mail-watcher') ||
                     oldConfig.services.includes('local-mail-watcher')) ? 'true' : 'false'
    }
  }
  
  writeFileSync(newConfigPath, JSON.stringify(newConfig, null, 2))
}

migrateConfig('config/old.json', 'config/new.json')
```

## Phase 5: Testing Strategy

### 5.1 Integration Tests

```typescript
// packages/api/test/integration/content-processor.test.ts
import { ContentProcessorService } from '../../src/services/content-processor'
import { expect } from 'chai'

describe('ContentProcessor Integration', () => {
  let processor: ContentProcessorService

  before(async () => {
    processor = new ContentProcessorService({
      features: {
        puppeteer: true,
        pdf: true,
        thumbnails: true,
        readability: true
      }
    })
  })

  it('should process URL with all features enabled', async () => {
    const result = await processor.processUrl('https://example.com', {
      generateThumbnail: true
    })
    
    expect(result).to.have.property('title')
    expect(result).to.have.property('content')
    expect(result).to.have.property('thumbnail')
  })

  it('should process PDF with text extraction', async () => {
    const pdfBuffer = Buffer.from('fake-pdf-content')
    const result = await processor.processPdf(pdfBuffer)
    
    expect(result).to.have.property('text')
    expect(result).to.have.property('pages')
  })
})
```

### 5.2 Performance Tests

```typescript
// packages/api/test/performance/consolidation-benchmark.ts
import { performance } from 'perf_hooks'
import { ContentProcessorService } from '../../src/services/content-processor'

async function benchmarkConsolidation() {
  const processor = new ContentProcessorService({
    features: {
      puppeteer: true,
      pdf: true,
      thumbnails: true,
      readability: true
    }
  })

  const urls = [
    'https://example.com',
    'https://test.com',
    'https://sample.com'
  ]

  const startTime = performance.now()
  
  const promises = urls.map(url => processor.processUrl(url))
  const results = await Promise.all(promises)
  
  const endTime = performance.now()
  const totalTime = endTime - startTime
  
  console.log(`Processed ${urls.length} URLs in ${totalTime}ms`)
  console.log(`Average time per URL: ${totalTime / urls.length}ms`)
  
  return {
    totalTime,
    averageTime: totalTime / urls.length,
    results
  }
}

benchmarkConsolidation().catch(console.error)
```

## Phase 6: Deployment Profiles

### 6.1 Minimal Profile

```yaml
# profiles/minimal.yml
services:
  - api
  - web

features:
  puppeteer: false
  pdf: false
  thumbnails: false
  email: false
  export: false
  import: false
  integration: false
  rules: false
  rss: false

resources:
  memory: 512MB
  cpu: 0.5
  storage: sqlite
```

### 6.2 Standard Profile

```yaml
# profiles/standard.yml
services:
  - api
  - web

features:
  puppeteer: true
  pdf: true
  thumbnails: true
  email: false
  export: true
  import: true
  integration: false
  rules: true
  rss: true

resources:
  memory: 1GB
  cpu: 1.0
  storage: postgres
```

### 6.3 Enterprise Profile

```yaml
# profiles/enterprise.yml
services:
  - api
  - web

features:
  puppeteer: true
  pdf: true
  thumbnails: true
  email: true
  export: true
  import: true
  integration: true
  rules: true
  rss: true

resources:
  memory: 2GB
  cpu: 2.0
  storage: postgres
```

## Implementation Checklist

### Week 1-2: Foundation
- [ ] Create consolidated service packages
- [ ] Implement feature flag system
- [ ] Design internal service interfaces
- [ ] Set up build system for consolidated services

### Week 3-4: Core Integration
- [ ] Integrate content processing into API
- [ ] Integrate job processing into API
- [ ] Update Docker configurations
- [ ] Create migration scripts

### Week 5-6: Email and Testing
- [ ] Integrate email processing into API
- [ ] Write comprehensive tests
- [ ] Performance benchmarking
- [ ] Update documentation

### Week 7-8: Deployment and Migration
- [ ] Create deployment profiles
- [ ] Migration tools
- [ ] Community testing
- [ ] Final documentation updates

This implementation plan provides a concrete roadmap for consolidating Omnivore's microservices architecture while maintaining functionality and improving operational efficiency.