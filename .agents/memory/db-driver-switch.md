---
name: DB Driver Switch
description: Switched from @neondatabase/serverless to pg; Neon credentials are broken
---

The app originally used `@neoldatabase/serverless` + `drizzle-orm/neon-serverless`. This was replaced with `pg` Pool + `drizzle-orm/node-postgres` to support Supabase.

**Why:** The user wants to migrate from Neon to Supabase. The pg driver works with any standard PostgreSQL.

**Current state:** All PG* env vars and DATABASE_URL point to a broken Neon instance ("password authentication failed for user 'neondb_owner'"). The DB cannot be used until credentials are reset.

**How to fix:**
1. Go to Replit's Database panel and reset/regenerate the Neon database credentials (update DATABASE_URL)
2. OR set SUPABASE_DATABASE_URL with a valid Supabase connection string

**How to apply:** db.ts reads `SUPABASE_DATABASE_URL || DATABASE_URL`. Set either env var to a working PostgreSQL connection string. The startup migration in server/migrate.ts will auto-create the classroom tables on next restart.
