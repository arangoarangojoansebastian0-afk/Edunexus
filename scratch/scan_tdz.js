import fs from 'fs';
import path from 'path';

const srcDir = 'c:/Users/PC/Desktop/LoyolaCommunity/client/src';

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Simple parser to find top-level declarations and references.
  // We'll search for:
  // - Declarations: const X =, let X =, class X, function X, enum X
  // - We only care about declarations at the module level (no indentation or export prefix).
  const declarations = []; // array of { name, line }
  const references = []; // array of { name, line }

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // Skip comments and imports
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('import')) {
      return;
    }

    // Match top-level declarations: const name, let name, class name, function name, enum name
    // Optionally prefixed by export
    const declMatch = line.match(/^(?:export\s+)?(?:const|let|class|enum|function)\s+([a-zA-Z0-9_]+)/);
    if (declMatch) {
      declarations.push({ name: declMatch[1], line: lineNum });
    }

    // Match potential identifiers on the line
    const words = line.match(/[a-zA-Z_][a-zA-Z0-9_]*/g);
    if (words) {
      words.forEach(word => {
        // Exclude language keywords
        if (['const', 'let', 'class', 'enum', 'function', 'export', 'import', 'from', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'default', 'new', 'this', 'typeof', 'void', 'delete', 'in', 'instanceof', 'try', 'catch', 'finally', 'throw'].includes(word)) {
          return;
        }
        references.push({ name: word, line: lineNum });
      });
    }
  });

  // Now, find if any reference to a declared variable occurs BEFORE its declaration.
  const tdzViolations = [];
  declarations.forEach(decl => {
    // Find references to this name before the declaration line
    const earlyRefs = references.filter(ref => ref.name === decl.name && ref.line < decl.line);
    if (earlyRefs.length > 0) {
      tdzViolations.push({
        name: decl.name,
        declLine: decl.line,
        earlyLines: earlyRefs.map(r => r.line),
      });
    }
  });

  return tdzViolations;
}

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const violations = scanFile(fullPath);
      if (violations.length > 0) {
        console.log(`\nFile: ${path.relative(srcDir, fullPath)}`);
        violations.forEach(v => {
          console.log(`  Variable '${v.name}' declared on line ${v.declLine} is used early on line(s): ${v.earlyLines.join(', ')}`);
        });
      }
    }
  }
}

console.log("Scanning source files for early declarations...");
scanDir(srcDir);
