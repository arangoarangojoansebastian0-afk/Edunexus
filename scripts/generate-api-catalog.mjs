import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sources = ["server/authRoutes.ts", "server/routes.ts"];
const lines = [
  "# Catálogo de API",
  "",
  "> Generado desde las declaraciones Express en `server/authRoutes.ts` y `server/routes.ts`. Actualiza con `npm run docs:api`. La presencia de una ruta no documenta por sí sola el contrato, permiso o estado funcional: confirma su middleware y lógica en el código fuente.",
  "",
];

for (const sourcePath of sources) {
  const source = await readFile(resolve(root, sourcePath), "utf8");
  const routes = [...source.matchAll(/\bapp\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g)]
    .map((match) => ({ method: match[1].toUpperCase(), path: match[2] }));

  lines.push(`## ${sourcePath}`, "");
  if (routes.length === 0) {
    lines.push("No se detectaron rutas en este archivo.", "");
    continue;
  }

  lines.push("| Método | Ruta |", "|---|---|");
  for (const route of routes) {
    lines.push(`| \`${route.method}\` | \`${route.path}\` |`);
  }
  lines.push("", `Total: ${routes.length} rutas declaradas.`, "");
}

await writeFile(resolve(root, "docs/reference/api-endpoints.md"), `${lines.join("\n")}\n`);
console.log(`Catálogo actualizado: ${resolve(root, "docs/reference/api-endpoints.md")}`);
