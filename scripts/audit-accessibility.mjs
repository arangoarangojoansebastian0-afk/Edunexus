import fs from 'node:fs';
import path from 'node:path';
fs.mkdirSync('docs', { recursive: true });

const root = path.resolve('client/src');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|jsx)$/.test(entry.name)) files.push(full);
  }
}
walk(root);
const findings = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const imgMatches = [...text.matchAll(/<img\b[^>]*>/g)];
  for (const m of imgMatches) if (!/\balt\s*=/.test(m[0])) findings.push(`${path.relative(process.cwd(), file)}: <img> without alt`);
  const autoButtonMatches = [...text.matchAll(/<button\b([^>]*)>/g)];
  for (const m of autoButtonMatches) {
    const attrs = m[1];
    if (/aria-hidden\s*=\s*["']true/.test(attrs)) continue;
    if (!/aria-label\s*=|title\s*=|>\s*[^<{]/.test(attrs + '>')) findings.push(`${path.relative(process.cwd(), file)}: button may need an accessible name`);
  }
}
const report = `# Accessibility static audit\n\nGenerated: ${new Date().toISOString()}\n\nFiles scanned: ${files.length}\nPotential findings: ${findings.length}\n\n${findings.length ? findings.map(x => `- ${x}`).join('\n') : 'No heuristic findings.'}\n\nManual keyboard, screen-reader, contrast and focus testing is still required.\n`;
fs.writeFileSync('docs/ACCESSIBILITY_STATIC_AUDIT.md', report);
console.log(report);
