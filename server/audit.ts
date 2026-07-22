import { db } from "./db";
import { auditLogs } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Registra una acción sensible en `audit_logs`. Se llama "de lado" (no se
 * espera con `await` en el flujo principal salvo que se necesite el id) para
 * no retrasar la respuesta al usuario ni tumbar la operación si falla el
 * log — un log que no se pudo escribir no debería impedir, por ejemplo,
 * borrar un usuario.
 *
 * NOTA DE ALCANCE: esto no está enganchado todavía en las ~190 rutas del
 * sistema — se aplicó a un primer set de acciones de alto impacto (borrar/
 * expulsar estudiantes, cambios de rol, crear/borrar observaciones, crear
 * super_admin, cambios de configuración institucional). Extenderlo a más
 * rutas es repetir este mismo patrón de una línea en cada handler.
 */
export async function logAudit(params: {
  institutionId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      institutionId: params.institutionId || null,
      actorId: params.actorId || null,
      actorName: params.actorName || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details || null,
    });
  } catch (err) {
    console.warn("[audit] No se pudo escribir el log:", err);
  }
}

export async function getAuditLogs(institutionId: string, limit = 100) {
  return db.select().from(auditLogs)
    .where(eq(auditLogs.institutionId, institutionId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
