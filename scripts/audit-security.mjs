import fs from 'node:fs';
import path from 'node:path';
fs.mkdirSync('docs', { recursive: true });

const file = path.resolve('server/routes.ts');
const source = fs.readFileSync(file, 'utf8');
const lines = source.split(/\r?\n/);
const routeRe = /^\s*app\.(get|post|put|patch|delete)\((['"`])([^'"`]+)\2/;
const publicAllowlist = new Set(['/api/auth/user', '/api/recognitions', '/api/push/vapid-public-key']);
const findings = [];
let routeCount = 0;
for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(routeRe);
  if (!match) continue;
  routeCount++;
  const block = lines.slice(i, Math.min(lines.length, i + 5)).join('\n');
  if (!/requireAuth/.test(block)) {
    const route = match[3];
    if (!publicAllowlist.has(route) && !route.startsWith('/api/public/')) {
      findings.push({ line: i + 1, method: match[1].toUpperCase(), route, reason: 'No requireAuth within route declaration window' });
    }
  }
}
const report = `# Security static audit\n\nGenerated: ${new Date().toISOString()}\n\n- Routes detected: ${routeCount}\n- Potentially unprotected routes: ${findings.length}\n\n${findings.length ? findings.map(f => `- Line ${f.line}: ${f.method} ${f.route} — ${f.reason}`).join('\n') : 'No potentially unprotected application routes were detected by this static heuristic.'}\n\nThis is a static heuristic, not a substitute for authenticated IDOR/cross-institution penetration testing.\n`;
fs.writeFileSync('docs/SECURITY_STATIC_AUDIT.md', report);
console.log(report);
process.exitCode = findings.length ? 1 : 0;
