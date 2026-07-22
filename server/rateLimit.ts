import rateLimit from "express-rate-limit";

/**
 * Límites de tasa (rate limiting) para proteger rutas sensibles de fuerza
 * bruta / abuso automatizado. Requiere `app.set("trust proxy", 1)` en
 * server/index.ts para leer la IP real detrás del proxy de Render.
 */

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos." },
  skipSuccessfulRequests: true,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados registros desde esta red. Intenta de nuevo más tarde." },
});

export const messagingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Estás enviando mensajes muy rápido. Espera un momento." },
  keyGenerator: (req) => (req as any).user?.id || req.ip,
});

// Nivel 3: recuperación de contraseña — 5 solicitudes cada 15 min por IP,
// para que no se pueda usar para bombardear el correo de alguien.
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes de recuperación. Intenta de nuevo más tarde." },
});
