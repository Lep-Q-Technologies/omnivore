# Database Migrations

This directory contains SQL migration scripts for the Omnivore API database schema changes.

## Applying Migrations

Since the TypeORM migration infrastructure is not yet fully configured, these are manual SQL migrations that should be applied directly to the database.

### Production/Staging

```bash
# Connect to your PostgreSQL database
psql -h <host> -U <username> -d omnivore

# Apply the migration
\i src/database/migrations/1732377600000-RemoveRedundantLibraryItemColumns.sql
```

### Development (Local)

```bash
# Using psql with local database
psql -U app_user -d omnivore -f src/database/migrations/1732377600000-RemoveRedundantLibraryItemColumns.sql

# Or using any PostgreSQL client (DBeaver, pgAdmin, etc.)
# Simply execute the SQL file contents
```

## Migration History

### 1732377600000-RemoveRedundantLibraryItemColumns.sql

**Date**: 2024-11-23
**Related**: ARC-014 (Additional Content Types)

**Changes**:
- Drops `folder` column (now computed from `state`)
- Drops `content_reader` column (now computed from `item_type`/`contentType`)

**Rationale**: These columns were denormalized duplicates. The folder can always be derived from the item's state, and the content reader can be derived from the content type.

## Future: TypeORM Migration Setup

To set up automated TypeORM migrations in the future:

1. Create `src/config/typeorm.ts` with DataSource configuration
2. Use `npm run migration:generate -- src/database/migrations/MigrationName` to auto-generate migrations
3. Use `npm run migration:run` to apply pending migrations
4. Update `database.module.ts` to set `migrationsRun: true` for automatic application

Example `typeorm.ts`:
```typescript
import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'

export const AppDataSource = new DataSource({
  type: 'postgres',
  // ... connection config
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
})
```
