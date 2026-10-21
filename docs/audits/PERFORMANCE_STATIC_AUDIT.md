# Performance static audit

Generated: 2026-10-21T20:07:49.647Z

Files scanned: 145
Review flags: 5

- client\src\components\media\MediaComposer.tsx: very short interval detected
- client\src\pages\DirectMessages.tsx: verify polling interval is justified
- client\src\pages\Meet.tsx: verify polling interval is justified
- server\routes.ts: inspect list size before client-side mapping
- server\storage.ts: inspect list size before client-side mapping

Prioritize server-side pagination for datasets that can exceed a few hundred records and measure real requests before optimizing further.
