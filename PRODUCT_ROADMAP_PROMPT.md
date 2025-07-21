# Omnivore Technical Roadmap and Work Breakdown Prompt

## Context

You are analyzing the Omnivore project - an open-source read-it-later application that has recently transitioned to community stewardship. The project needs to be transformed from a complex multi-service architecture into a streamlined, self-hostable solution that can serve both individual self-hosters and cloud customers.

### Current State Analysis Required

Please analyze the existing codebase at https://github.com/omnivore-app/omnivore and document:

1. **Architecture Overview**
   - Current microservices (25+ services including: web, api, content-fetch, puppeteer-parse, pdf-handler, thumbnail-handler, rss-handler, rule-handler, text-to-speech, queue-manager, export-handler, import-handler, integration-handler, etc.)
   - Database structure (PostgreSQL with pgvector)
   - Queue/messaging system (Redis)
   - Storage system (MinIO/S3)
   - Authentication and authorization flow
   - Email handling system
   - Content parsing pipeline

2. **Recent Work Completed** (Based on commit history)
   - PDF upload functionality
   - Authentication fixes
   - Infrastructure improvements
   - Redis client updates
   - URL handling improvements
   - Nginx configuration for self-hosting

3. **Technical Debt Assessment**
   - Service redundancies and overlap
   - Complex inter-service dependencies
   - Resource-intensive components
   - Deployment complexity

## Objectives

Transform Omnivore into a lightweight, cost-effective platform that:
- Runs efficiently as a single Docker deployment for self-hosters
- Scales appropriately for cloud deployment
- Maintains all current functionality while reducing complexity
- Provides clear separation between dev/staging/prod environments
- Minimizes operational costs until user base grows
- Enables rapid developer onboarding and contribution

## Work Breakdown Structure

Create a comprehensive list of work tickets organized by priority and dependencies. Each ticket should be:
- Self-contained and deployable
- Estimated in story points (1, 2, 3, 5, 8, 13)
- Include clear acceptance criteria
- Specify technical approach
- Identify risks and dependencies

### Phase 1: Architecture Simplification (Foundation)

**Ticket Template:**
```
TICKET-ID: [Descriptive Title]
Priority: P0/P1/P2
Story Points: X
Dependencies: [List other tickets]

Description:
[Clear description of what needs to be done]

Technical Approach:
[Specific technical steps and considerations]

Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass
- [ ] Documentation updated

Risks:
- [Potential issues]

Migration Notes:
- [Any data migration or backward compatibility considerations]
```

### Required Analysis Areas:

1. **Service Consolidation Analysis**
   - Which services can be merged?
   - What are the performance implications?
   - How to maintain modularity while reducing complexity?

2. **Docker Optimization**
   - Single container vs. minimal multi-container approach
   - Resource requirements and limits
   - Development vs. production configurations

3. **Database and Search Strategy**
   - PostgreSQL optimization for text search
   - Elasticsearch integration for advanced search
   - Vector search capabilities for AI features

4. **API Gateway and Service Mesh**
   - Simplify routing and authentication
   - Reduce inter-service communication overhead
   - API versioning strategy

5. **Queue and Background Job Consolidation**
   - Merge queue processors
   - Optimize job scheduling
   - Reduce Redis dependency where possible

6. **Storage and CDN Strategy**
   - Self-hosted MinIO vs. cloud storage abstraction
   - Image proxy optimization
   - Content delivery for self-hosters

7. **Authentication and Multi-tenancy**
   - Simplified auth flow
   - Support for both self-hosted (single tenant) and cloud (multi-tenant)
   - API key management

8. **Email and Newsletter Processing**
   - Simplified email ingestion
   - Newsletter parsing optimization
   - IMAP integration improvements

9. **Content Processing Pipeline**
   - Merge content-fetch, puppeteer-parse, and readability services
   - Optimize resource usage
   - Support for various content types (articles, PDFs, videos)

10. **AI and ML Features**
    - Self-hosted vs. API-based approach
    - API key management for self-hosters
    - Cost optimization for cloud deployment

### Deliverables Expected:

1. **Phase 1: Core Consolidation (Weeks 1-4)**
   - List of services to merge with technical approach
   - New simplified architecture diagram
   - Database optimization tickets
   - Docker compose simplification

2. **Phase 2: Self-Hosting Excellence (Weeks 5-8)**
   - Single Docker image creation
   - Environment configuration system
   - Backup and restore functionality
   - Update mechanism

3. **Phase 3: Cloud Platform Foundation (Weeks 9-12)**
   - Multi-tenancy implementation
   - Billing and subscription infrastructure
   - Monitoring and logging system
   - Auto-scaling configuration

4. **Phase 4: Feature Parity and Enhancement (Weeks 13-16)**
   - AI integration framework
   - Advanced search implementation
   - Performance optimization
   - Mobile app compatibility updates

### Special Considerations:

1. **Cost Optimization**
   - Identify services that can run on-demand vs. always-on
   - Serverless opportunities for certain handlers
   - Caching strategies to reduce compute

2. **Developer Experience**
   - Single command local development setup
   - Clear contribution guidelines
   - Automated testing framework
   - CI/CD pipeline simplification

3. **Migration Path**
   - Zero-downtime migration strategy
   - Data migration tools
   - Rollback procedures
   - Feature flags for gradual rollout

4. **Monitoring and Observability**
   - Lightweight monitoring for self-hosters
   - Comprehensive monitoring for cloud
   - Error tracking and alerting
   - Performance metrics

### Output Format:

Provide a structured markdown document with:

1. Executive Summary
   - Current state assessment
   - Proposed architecture
   - Timeline and milestones

2. Detailed Ticket Breakdown
   - Organized by phase and priority
   - Dependencies clearly mapped
   - Risk assessment for each major change

3. Architecture Diagrams
   - Current state
   - Proposed simplified architecture
   - Data flow diagrams

4. Implementation Roadmap
   - Gantt chart or timeline
   - Resource requirements
   - Go/no-go decision points

5. Success Metrics
   - Performance benchmarks
   - Cost reduction targets
   - Developer velocity improvements
   - User experience metrics

### Key Questions to Answer:

1. Which services can be combined without sacrificing functionality?
2. How can we implement a plugin/extension system for optional features?
3. What's the optimal database schema for performance and flexibility?
4. How do we handle backward compatibility during the transition?
5. What's the minimum viable infrastructure for self-hosting?
6. How do we implement feature flags for self-hosted vs. cloud deployments?
7. What's the strategy for handling large-scale content processing?
8. How do we ensure security in both deployment models?
9. What's the approach for third-party integrations?
10. How do we maintain the open-source community while building a sustainable business?

### Constraints and Requirements:

- Maintain all current functionality
- Ensure smooth migration path for existing users
- Keep the solution open-source and self-hostable
- Optimize for both single-user and multi-tenant deployments
- Minimize operational complexity and costs
- Enable rapid feature development
- Maintain high performance for search and content retrieval
- Support offline functionality where applicable
- Ensure GDPR compliance and data portability

Please analyze the codebase thoroughly and provide a comprehensive technical roadmap that addresses these objectives while maintaining the project's open-source ethos and user-centric focus.