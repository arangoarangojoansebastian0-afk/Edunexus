# Session Plan - Migración Completa + Classroom + Master 2000

## Objective
Fix DB (migrate to pg driver / Supabase-compatible), fix all features, Classroom module, Master 2000 integration layer, admin dashboard improvements.

## Tasks

### T001: DB Fix — pg driver (Supabase-compatible)  [BLOCKED BY: user action]
- Install `pg`, `@types/pg`
- Update server/db.ts to use standard pg (works with Supabase or any PostgreSQL)
- Request SUPABASE_DATABASE_URL from user

### T002: Schema — Add Classroom tables
- courses, course_enrollments, activities, submissions, attendance

### T003: Storage — Classroom + fix all interfaces
- All CRUD for Classroom module
- Fix Badges storage (getBadges in IStorage)

### T004: Routes — Classroom + Master 2000 + fixes
- POST/GET/PATCH/DELETE for courses, activities, submissions, attendance
- Master 2000 sync routes

### T005: Master 2000 provider
- server/providers/academic-provider.ts (interface)
- server/providers/master2000.ts (stub implementation)

### T006: Frontend — Classroom pages
- client/src/pages/Classroom.tsx
- client/src/pages/CourseDetail.tsx

### T007: Frontend — Navigation + routing
- Update AppSidebar, App.tsx

### T008: Admin dashboard improvements
- Better stats, user role management UI

### T009: Joan Arango promotion (works once DB fixed)

