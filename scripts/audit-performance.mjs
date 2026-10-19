import fs from 'node:fs';
import path from 'node:path';
fs.mkdirSync('docs', { recursive: true });
const roots = ['client/src', 'server'];
const files = [];
function walk(dir) { for (const e of fs.readdirSync(dir, {withFileTypes:true})) { const f=path.join(dir,e.name); if(e.isDirectory()) walk(f); else if(/\.(tsx|ts|jsx|js)$/.test(e.name)) files.push(f); } }
for (const r of roots) walk(path.resolve(r));
const findings=[];
for (const f of files) {
  const t=fs.readFileSync(f,'utf8');
  if (/refetchInterval\s*:\s*[0-9]{1,4}\b/.test(t)) findings.push(`${path.relative(process.cwd(),f)}: verify polling interval is justified`);
  if (/setInterval\([^\n]+,\s*[0-9]{1,4}\s*\)/.test(t)) findings.push(`${path.relative(process.cwd(),f)}: very short interval detected`);
  if (/\.map\(\(.*=>.*\)/s.test(t) && /getAll|findMany|select\(/.test(t)) findings.push(`${path.relative(process.cwd(),f)}: inspect list size before client-side mapping`);
}
const report=`# Performance static audit\n\nGenerated: ${new Date().toISOString()}\n\nFiles scanned: ${files.length}\nReview flags: ${findings.length}\n\n${findings.length ? findings.map(x=>`- ${x}`).join('\n') : 'No heuristic flags.'}\n\nPrioritize server-side pagination for datasets that can exceed a few hundred records and measure real requests before optimizing further.\n`;
fs.writeFileSync('docs/PERFORMANCE_STATIC_AUDIT.md',report); console.log(report);
