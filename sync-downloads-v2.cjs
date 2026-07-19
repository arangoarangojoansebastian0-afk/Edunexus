#!/usr/bin/env node
/**
 * sync-downloads.cjs
 * -------------------
 * 1. Detecta qué EXTENSIONES de archivo usa tu proyecto (.ts, .tsx, .js, etc).
 * 2. En la carpeta de origen (por defecto, Descargas), solo mira archivos con
 *    esas extensiones — ignora fotos, PDFs, instaladores, etc.
 * 3. Por cada uno, busca en el proyecto:
 *      - una coincidencia EXACTA de nombre, o
 *      - una coincidencia PARECIDA (ej: "Meet (1).tsx" ~ "Meet.tsx",
 *        "Meet-nuevo.tsx" ~ "Meet.tsx").
 * 4. Te pregunta si quieres reemplazar. Si no hay ninguna coincidencia,
 *    te pide la ruta donde colocarlo (o te deja omitirlo).
 *
 * USO:
 *   node sync-downloads.cjs
 *   node sync-downloads.cjs "C:\Users\PC\Downloads"
 *   node sync-downloads.cjs "C:\Users\PC\Downloads" "C:\ruta\al\proyecto"
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const os = require("os");

const DEFAULT_DOWNLOADS = path.join(os.homedir(), "Downloads");
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".cache", "coverage"]);

const sourceDir = process.argv[2] || DEFAULT_DOWNLOADS;
const projectDir = process.argv[3] || process.cwd();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

// ── 1. Detectar extensiones usadas en el proyecto ───────────────────────────
function collectProjectExtensions(dir, exts = new Set()) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return exts; }
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectProjectExtensions(full, exts);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext) exts.add(ext);
    }
  }
  return exts;
}

// ── 2. Indexar archivos del proyecto por nombre ─────────────────────────────
function indexProjectFiles(dir, index = new Map()) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return index; }
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      indexProjectFiles(full, index);
    } else {
      const key = entry.name.toLowerCase();
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(full);
    }
  }
  return index;
}

// Normaliza un nombre de archivo para comparar "parecidos":
// quita la extensión, espacios/guiones/guion_bajo, y sufijos típicos de
// copias como " (1)", "-copy", "_new", "-final", etc.
function normalize(fileName) {
  let name = fileName.replace(/\.[^.]+$/, ""); // sin extensión
  name = name.toLowerCase();
  name = name.replace(/\s*\(\d+\)\s*$/, ""); // "(1)", "(2)"...
  name = name.replace(/[-_ ]?(copy|copia|nuevo|new|final|updated|actualizado|v\d+)$/i, "");
  name = name.replace(/[-_\s]+/g, "");
  return name;
}

function listSourceFiles(dir, allowedExts) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && allowedExts.has(path.extname(e.name).toLowerCase()))
    .map((e) => path.join(dir, e.name));
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

async function promptManualPath(srcPath, fileName, projectDir) {
  const rel = (
    await ask(`   Ruta donde colocarlo (relativa al proyecto, ej: client/src/pages/${fileName}) o vacío para omitir: `)
  ).trim();
  if (!rel) { console.log("   ⏭️  Omitido."); return false; }
  const dest = path.join(projectDir, rel);
  copyFile(srcPath, dest);
  console.log(`   ✅ Colocado en: ${dest}`);
  return true;
}

async function main() {
  console.log(`\nProyecto:  ${projectDir}`);
  console.log(`Origen:    ${sourceDir}\n`);

  console.log("Detectando qué tipos de archivo usa el proyecto...");
  const projectExts = collectProjectExtensions(projectDir);
  console.log(`Tipos encontrados: ${[...projectExts].sort().join(", ")}\n`);

  const sourceFiles = listSourceFiles(sourceDir, projectExts);
  if (sourceFiles.length === 0) {
    console.log("No hay archivos en el origen que coincidan con esos tipos.");
    rl.close();
    return;
  }

  console.log(`Archivos candidatos en el origen: ${sourceFiles.length}`);
  console.log("Indexando archivos del proyecto...\n");
  const projectIndex = indexProjectFiles(projectDir);
  const normalizedIndex = new Map(); // nombre normalizado -> [rutas]
  for (const [name, paths] of projectIndex) {
    const norm = normalize(name);
    if (!normalizedIndex.has(norm)) normalizedIndex.set(norm, []);
    normalizedIndex.get(norm).push(...paths);
  }

  let replaced = 0, placed = 0, skipped = 0;

  for (const srcPath of sourceFiles) {
    const fileName = path.basename(srcPath);
    console.log("──────────────────────────────────────────────");
    console.log(`Archivo: ${fileName}`);

    const exact = projectIndex.get(fileName.toLowerCase()) || [];
    const similar = exact.length ? [] : (normalizedIndex.get(normalize(fileName)) || []);
    const matches = exact.length ? exact : similar;
    const isExact = exact.length > 0;

    if (matches.length === 0) {
      console.log("   No se encontró ninguna coincidencia (ni exacta ni parecida) en el proyecto.");
      const done = await promptManualPath(srcPath, fileName, projectDir);
      done ? placed++ : skipped++;
      continue;
    }

    if (!isExact) console.log("   ⚠️  No es un nombre idéntico, pero se parece a:");

    if (matches.length === 1) {
      console.log(`   ${isExact ? "Encontrado en" : "Posible coincidencia"}: ${matches[0]}`);
      const ans = (await ask("   ¿Reemplazar este archivo? (s/n): ")).trim().toLowerCase();
      if (["s", "si", "sí", "y"].includes(ans)) {
        copyFile(srcPath, matches[0]);
        console.log("   ✅ Reemplazado.");
        replaced++;
      } else {
        console.log("   ⏭️  Omitido.");
        skipped++;
      }
    } else {
      matches.forEach((m, i) => console.log(`   [${i + 1}] ${m}`));
      console.log(`   [0] Ninguno de estos (dar ruta manual / omitir)`);
      const choice = (await ask("   ¿Cuál reemplazar? (número): ")).trim();
      const idx = parseInt(choice, 10);
      if (idx >= 1 && idx <= matches.length) {
        copyFile(srcPath, matches[idx - 1]);
        console.log("   ✅ Reemplazado.");
        replaced++;
      } else {
        const done = await promptManualPath(srcPath, fileName, projectDir);
        done ? placed++ : skipped++;
      }
    }
  }

  console.log("\n══════════════════════════════════════════════");
  console.log(`Listo. Reemplazados: ${replaced}  |  Colocados nuevos: ${placed}  |  Omitidos: ${skipped}`);
  rl.close();
}

main();
