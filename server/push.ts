import webpush from "web-push";
import { storage } from "./storage";

// ── Configuración VAPID ──────────────────────────────────────────────────
// Generar un par de llaves una sola vez con: npx web-push generate-vapid-keys
// y guardarlas como variables de entorno VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.
// Sin estas variables, las notificaciones push quedan desactivadas (no rompe
// el resto de la app: sendPushToUser simplemente no hace nada).
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:soporte@edunexus.app";

export const pushEnabled = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (pushEnabled) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn(
    "[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY no están configuradas — " +
    "las notificaciones push están desactivadas. Genera un par con " +
    "`npx web-push generate-vapid-keys` y agrégalas como variables de entorno."
  );
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Manda una notificación push a TODAS las suscripciones (dispositivos/navegadores)
// registradas por ese usuario. Nunca lanza — cualquier fallo queda en el log.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!pushEnabled) return;
  try {
    const subs = await storage.getPushSubscriptionsForUser(userId);
    if (subs.length === 0) return;

    await Promise.all(subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        // 410/404 = la suscripción ya no es válida (el usuario cerró el navegador,
        // desinstaló, etc.) — la limpiamos para no seguir intentando en vano.
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await storage.removePushSubscription(sub.endpoint);
        } else {
          console.error("Error enviando push:", err?.message || err);
        }
      }
    }));
  } catch (err) {
    console.error("Error obteniendo suscripciones push:", err);
  }
}
