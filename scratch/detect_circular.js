import fs from 'fs';
import path from 'path';

const srcDir = 'c:/Users/PC/Desktop/LoyolaCommunity/client/src';
const absoluteSrcDir = path.resolve(srcDir);

// Dependency graph: maps file paths to set of imported file paths
const graph = {};

function resolveImport(importPath, currentFile) {
  if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
    // External dependency
    return null;
  }

  let targetPath = '';
  if (importPath.startsWith('@/')) {
    targetPath = path.join(absoluteSrcDir, importPath.slice(2));
  } else {
    targetPath = path.resolve(path.dirname(currentFile), importPath);
  }

  // Check possible extensions: .tsx, .ts, /index.tsx, /index.ts
  const candidates = [
    targetPath,
    targetPath + '.tsx',
    targetPath + '.ts',
    path.join(targetPath, 'index.tsx'),
    path.join(targetPath, 'index.ts'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.normalize(candidate);
    }
  }

  return null;
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const normalizedPath = path.normalize(fullPath);
      graph[normalizedPath] = [];

      // Simple regex for imports: import ... from "..." or import "..."
      // Matches both single and double quotes
      const importRegex = /import\s+(?:[^"'\n]+from\s+)?["']([^"']+)["']/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const resolved = resolveImport(match[1], normalizedPath);
        if (resolved) {
          graph[normalizedPath].push(resolved);
        }
      }
    }
  }
}

console.log("Scanning client/src...");
scanDirectory(absoluteSrcDir);

// Find cycles using DFS
const visited = {};
const recStack = {};
const cycles = [];

function findCyclesDFS(node, pathStack = []) {
  visited[node] = true;
  recStack[node] = true;
  pathStack.push(node);

  const neighbors = graph[node] || [];
  for (const neighbor of neighbors) {
    if (!visited[neighbor]) {
      findCyclesDFS(neighbor, pathStack);
    } else if (recStack[neighbor]) {
      const cycleStartIdx = pathStack.indexOf(neighbor);
      const cycle = pathStack.slice(cycleStartIdx);
      cycle.push(neighbor);
      cycles.push(cycle.map(p => path.relative(absoluteSrcDir, p)));
    }
  }

  pathStack.pop();
  recStack[node] = false;
}

for (const node in graph) {
  if (!visited[node]) {
    findCyclesDFS(node);
  }
}

if (cycles.length === 0) {
  console.log("No circular dependencies found!");
} else {
  console.log(`Found ${cycles.length} circular dependencies:`);
  cycles.forEach((cycle, i) => {
    console.log(`Cycle #${i + 1}:`, cycle.join(' -> '));
  });
}
