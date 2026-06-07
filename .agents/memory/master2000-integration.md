---
name: Master 2000 Integration
description: Stub academic system provider ready to wire up when credentials are available
---

Files:
- server/providers/academic-provider.ts — IAcademicProvider interface
- server/providers/master2000.ts — Master2000Provider stub

Admin routes: GET /api/admin/master2000/status, POST /api/admin/master2000/sync

**Activation:** Set MASTER2000_API_URL and MASTER2000_API_KEY environment variables. The provider auto-detects these and becomes available.

**Why:** The school uses Master 2000 as their academic management system. Integration allows syncing student data, grades, and attendance.

**How to apply:** When real API docs are available, uncomment the fetch calls in master2000.ts and implement syncToLocalDB().
