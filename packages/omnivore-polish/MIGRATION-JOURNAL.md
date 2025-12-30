# Migration Journal: web-vite → omnivore-polish

**Migration Start Date**: December 21, 2024
**Target Completion**: February 15, 2025 (8 weeks)
**Migration Branch**: `migration/omnivore-polish`

---

## 🎯 Mission Statement

Migrate from `packages/web-vite` (custom CSS, manual GraphQL client) to `packages/omnivore-polish` (Lovable-generated, Tailwind + shadcn/ui, Tanstack Query) to deliver a production-ready, polished reading experience with:

- ✅ Core reading (Library, Reader, Highlights)
- ✅ AI-powered Today page
- ✅ Newsletter management (per-newsletter emails)
- ✅ Topics (tag grouping for knowledge synthesis)

**Strategy**: Accelerated single-codebase migration with hard cutover after 6-8 weeks.

---

## 📊 Progress Tracker

### Week 1-2: Foundation (Backend Integration)
- [ ] ARC-027: GraphQL Integration Layer
- [ ] ARC-028: Authentication System
- [ ] Set up Docusaurus skeleton

### Week 3-4: Core Features (Library & Reader)
- [ ] ARC-029: Library System Refactor
- [ ] ARC-030: Reader & Highlights
- [ ] ARC-031: Labels/Tags System

### Week 5-6: Advanced Features (AI & Subscriptions)
- [ ] ARC-032: Today Page with AI Recommendations
- [ ] ARC-033: Newsletter Email Management
- [ ] ARC-034: Topics (Tag Grouping)
- [ ] ARC-035: RSS Feed Management

### Week 7-8: Production Readiness
- [ ] ARC-036: Profile & Settings Pages
- [ ] ARC-037: Testing & Quality
- [ ] ARC-038: Production Infrastructure
- [ ] ARC-039: Documentation & Launch

---

## 🚢 Latest Progress

### 2024-12-21: Docker Compose Integration Complete

**Completed**:
- ✅ Created `Dockerfile.dev` for omnivore-polish (mirrored from web-vite)
- ✅ Added `omnivore-polish` service to `docker-compose.dev.yml`
- ✅ Configured environment variables for containerized API access
- ✅ Set up volume mounts for hot-reload during development
- ✅ Configured port mapping: 3001:3000 (host:container)

**Configuration Details**:
```yaml
omnivore-polish:
  build:
    context: .
    dockerfile: packages/omnivore-polish/Dockerfile.dev
  container_name: "omnivore-polish-dev"
  ports:
    - "3001:3000"
  depends_on:
    api-nest:
      condition: service_healthy
  volumes:
    - ./packages/omnivore-polish:/app/packages/omnivore-polish
    - /app/packages/omnivore-polish/node_modules
```

**Access URLs**:
- omnivore-polish: http://localhost:3001
- web-vite: http://localhost:3000
- api-nest: http://localhost:4001

**Next Steps**:
- Test Docker Compose build: `docker-compose -f docker-compose.dev.yml up omnivore-polish`
- Verify hot-reload works in containerized environment
- Continue with ARC-027: Create first Tanstack Query hook

---

## 📝 Decision Log

### 2024-12-21: Migration Strategy Chosen

**Decision**: Direct migration to omnivore-polish (no cutover needed)

**Context**:
- omnivore-polish has superior UI/UX (Lovable-generated, Tailwind, shadcn/ui)
- web-vite uses custom CSS, manual GraphQL hooks, no server-state caching
- User requirement: Low tolerance for dual codebases
- **CRITICAL**: web-vite is NOT in production - no live users to migrate

**Options Considered**:
1. ✅ **Direct Migration** (CHOSEN): Build omnivore-polish to production-ready state
2. ❌ Hybrid Approach: Not needed - no production users
3. ❌ Design Reference: Slower than necessary

**Rationale**:
- omnivore-polish already has 95% of UI implemented
- Backend integration is straightforward (copy graphql-client.ts)
- Tanstack Query provides better UX (auto-refetch, caching, optimistic updates)
- Single codebase achieved faster
- **No migration complexity** - we're building new, not migrating users

**Risks Eliminated**:
- ✅ No deployment cutover risk (no production users)
- ✅ No rollback plan needed
- ✅ No dual maintenance burden
- ✅ Can iterate rapidly without user impact

**Remaining Risks**:
- Feature gaps → Mitigated by comprehensive ARC planning
- Quality → Mitigated by testing before first production deploy

---

### 2024-12-21: GraphQL Client Strategy

**Decision**: Port existing custom GraphQL client from web-vite, wrap with Tanstack Query

**Context**:
- web-vite has working `graphql-client.ts` (1,722 lines, all hooks implemented)
- omnivore-polish uses Tanstack Query for state management
- web-vite has Apollo Client as dependency but doesn't use it

**Options Considered**:
1. ✅ **Port + Wrap** (CHOSEN): Copy graphql-client.ts, wrap hooks with Tanstack Query
2. ❌ Apollo Client: Set up Apollo from scratch (heavyweight, not needed)
3. ❌ urql: Lighter than Apollo but requires rewriting all queries

**Rationale**:
- Existing hooks are battle-tested in production
- Tanstack Query provides better DevTools, caching, and developer experience
- Can incrementally migrate hooks to Tanstack Query patterns
- Low risk, high compatibility

**Implementation**:
```typescript
// Before (web-vite custom hook)
const { data, loading, error, archiveItem } = useArchiveItem()

// After (Tanstack Query wrapped)
const archiveMutation = useMutation({
  mutationFn: (vars) => graphqlRequest(ARCHIVE_MUTATION, vars),
  onSuccess: () => queryClient.invalidateQueries(['libraryItems'])
})
```

---

### 2024-12-21: Type Generation Strategy

**Decision**: Use graphql-codegen to auto-generate types from NestJS schema

**Context**:
- web-vite manually maintains 400+ lines of TypeScript types
- NestJS backend has authoritative `schema.graphql`
- Type drift causes bugs (backend uses "Label", frontend uses "Tag")

**Options Considered**:
1. ✅ **graphql-codegen** (CHOSEN): Auto-generate from schema.graphql
2. ❌ Manual types: Copy from web-vite (fragile, drift risk)
3. ❌ Share types package: Requires backend refactor

**Rationale**:
- Single source of truth (backend schema)
- No type drift
- IDE autocomplete for queries
- Catches breaking changes at build time

**Configuration**:
```yaml
# codegen.yml
schema: ../api-nest/schema.graphql
documents: src/**/*.graphql
generates:
  src/types/generated-graphql.ts:
    plugins:
      - typescript
      - typescript-operations
```

---

## 🐛 Issues Encountered

### [Date] Issue Title
**Symptom**: Description
**Cause**: Root cause
**Solution**: How it was fixed
**Prevention**: How to avoid in future

---

## 🔍 Technical Discoveries

### web-vite Architecture Insights

1. **No Apollo Client Used**: Despite being in package.json, Apollo Client is not imported anywhere. Custom fetch-based client used instead.

2. **Label vs. Tag Terminology**: Backend uses "Label", frontend uses "Tag". Requires abstraction layer:
   ```typescript
   export const labelToTag = (label: Label): Tag => ({ ...label })
   ```

3. **No Server State Caching**: Every component refetches data. Tanstack Query will be huge UX improvement.

4. **Zustand for Auth Only**: Minimal state management. Most state is local component state.

5. **JWT in localStorage**: Simple auth. Token attached to all requests via `Authorization: Bearer <token>`.

---

## 📚 Key Files Reference

### Source (web-vite)
- `/Users/tim/Documents/Documents/Lep-Q/Projects/omnivore/packages/web-vite/src/lib/graphql-client.ts` - GraphQL client (copy this)
- `/Users/tim/Documents/Documents/Lep-Q/Projects/omnivore/packages/web-vite/src/lib/graphql-fragments.ts` - Reusable fragments
- `/Users/tim/Documents/Documents/Lep-Q/Projects/omnivore/packages/web-vite/src/stores/index.ts` - Auth store (Zustand)
- `/Users/tim/Documents/Documents/Lep-Q/Projects/omnivore/packages/web-vite/src/types/api.ts` - Type definitions

### Target (omnivore-polish)
- `/Users/tim/Documents/Documents/Lep-Q/Projects/omnivore/packages/omnivore-polish/src/lib/` - New lib folder
- `/Users/tim/Documents/Documents/Lep-Q/Projects/omnivore/packages/omnivore-polish/src/types/` - Generated types
- `/Users/tim/Documents/Documents/Lep-Q/Projects/omnivore/packages/omnivore-polish/src/hooks/` - Tanstack Query hooks

### Backend
- `/Users/tim/Documents/Documents/Lep-Q/Projects/omnivore/packages/api-nest/schema.graphql` - Source of truth for types

---

## 🧪 Testing Notes

### Test Strategy
- Unit tests: Business logic (>70% coverage)
- Integration tests: API layer (all mutations)
- E2E tests: Critical paths (auth, CRUD, reading)

### Test Files
```
packages/omnivore-polish/
├── src/__tests__/           # Unit tests (colocated)
├── tests/
│   ├── integration/         # API integration tests
│   └── e2e/                 # Playwright E2E tests
└── playwright.config.ts
```

---

## 📦 Dependencies Added

### Week 1 (GraphQL + Auth)
```bash
npm install @tanstack/react-query
npm install -D @graphql-codegen/cli @graphql-codegen/typescript
npm install -D @graphql-codegen/typescript-operations
npm install graphql
```

### Week 7 (Testing)
```bash
npm install -D @playwright/test
npm install -D vitest @vitest/ui
```

---

## 🚀 Deployment Notes

### Environment Variables
```env
VITE_API_URL=http://localhost:4001
VITE_GRAPHQL_ENDPOINT=/api/graphql
VITE_REST_ENDPOINT=/api/v2
VITE_GAUTH_CLIENT_ID=xxx
VITE_APPLE_CLIENT_ID=xxx
```

### Staging Deployment
- URL: https://staging.omnivore.app
- Deploy via: GitHub Actions
- Database: staging-omnivore-db

### Production Cutover Checklist
- [ ] All ARCs completed
- [ ] E2E tests passing
- [ ] Load testing completed (1000+ concurrent users)
- [ ] Rollback procedure documented
- [ ] Beta users approved
- [ ] Monitoring dashboards ready (Sentry, Grafana)
- [ ] Database backups verified
- [ ] Feature flags configured
- [ ] DNS cutover plan ready

---

## 📈 Metrics & KPIs

### Development Velocity
- ARCs completed per week: Target 2-3
- Test coverage: Target >70%
- Build time: <60s
- Type errors: 0

### Production Health (Post-Launch)
- Page load time (p95): <2s
- API response time (p95): <500ms
- Error rate: <0.1%
- Lighthouse score: >90

---

## 🎓 Lessons Learned

### [Date] Lesson Title
**What Happened**: Description
**What We Learned**: Key insight
**Action Items**: How to apply learning

---

## 🔗 Related Documents

- [ARC-027 to ARC-040](../api-nest/docs/architecture/) - Architecture decision records
- [LOVABLE-PROMPT-FINAL-MVP-v2.1.md](../web-vite/LOVABLE-PROMPT-FINAL-MVP-v2.1.md) - Design spec
- [LOVABLE-PROMPT-PROFILE-SETTINGS.md](../web-vite/LOVABLE-PROMPT-PROFILE-SETTINGS.md) - Profile/Settings spec
- [NEWSLETTER-UI-DESIGN-PROMPT.md](../web-vite/NEWSLETTER-UI-DESIGN-PROMPT.md) - Newsletter spec
- [BACKLOG-RECALIBRATION-DEC-2024.md](../api-nest/docs/architecture/BACKLOG-RECALIBRATION-DEC-2024.md) - Production roadmap

---

**Last Updated**: 2024-12-21
**Next Review**: Weekly on Fridays
