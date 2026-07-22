import { db } from "./db";
import { googleClassroomTokens } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";

/**
 * Devuelve un access_token válido de Google Classroom para el usuario dado.
 * Si el token guardado ya expiró (o expira en menos de 2 minutos), lo
 * renueva usando el refresh_token antes de devolverlo, y actualiza la fila
 * en `google_classroom_tokens`. Si no hay refresh_token o Google lo rechaza
 * (cuenta desconectada desde el lado de Google, refresh_token revocado,
 * etc.), lanza un error explícito para que el endpoint que llama le pida al
 * usuario reconectar en vez de fallar con un 401 críptico de Google.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const rows = await db.select().from(googleClassroomTokens)
    .where(eq(googleClassroomTokens.userId, userId)).limit(1);
  if (rows.length === 0) {
    throw new Error("NOT_CONNECTED");
  }
  const row = rows[0];

  const expiresAt = row.expiresAt ? new Date(row.expiresAt).getTime() : 0;
  const stillValid = expiresAt - Date.now() > 2 * 60 * 1000; // margen de 2 min
  if (stillValid) {
    return row.accessToken;
  }

  if (!row.refreshToken) {
    // No hay refresh_token guardado (pasa si el usuario conectó antes de que
    // existiera este flujo, o si Google no lo entregó). Solo queda pedirle
    // que reconecte manualmente una vez.
    throw new Error("RECONNECT_REQUIRED");
  }

  const institution = row.institutionId
    ? await storage.getInstitutionSettings(row.institutionId)
    : null;
  const clientId = institution?.gcClientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = institution?.gcClientSecret || process.env.GOOGLE_CLIENT_SECRET;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: row.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokens = await tokenRes.json() as any;

  if (tokens.error) {
    // El refresh_token fue revocado (usuario quitó el acceso desde Google,
    // o expiró por inactividad prolongada) — hay que reconectar de cero.
    throw new Error("RECONNECT_REQUIRED");
  }

  const newExpiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;

  await db.update(googleClassroomTokens)
    .set({
      accessToken: tokens.access_token,
      expiresAt: newExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(googleClassroomTokens.userId, userId));

  return tokens.access_token;
}

/** Traduce los errores de arriba a una respuesta HTTP consistente. */
export function handleGcAuthError(e: any, res: any) {
  if (e.message === "NOT_CONNECTED") {
    return res.status(401).json({ error: "No conectado a Google Classroom", code: "NOT_CONNECTED" });
  }
  if (e.message === "RECONNECT_REQUIRED") {
    return res.status(401).json({
      error: "Tu conexión con Google Classroom expiró o fue revocada. Vuelve a conectar tu cuenta.",
      code: "RECONNECT_REQUIRED",
    });
  }
  return res.status(500).json({ error: e.message || "Error de Google Classroom" });
}
