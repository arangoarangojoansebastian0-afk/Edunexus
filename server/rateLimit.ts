import { rateLimit, ipKeyGenerator } from "express-rate-limit";

/**
 * Límites de tasa para proteger rutas sensibles contra fuerza bruta
 * y abuso automatizado.
 *
 * Si la aplicación está detrás de un proxy, configura correctamente
 * `trust proxy` en server/index.ts.
 */

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.",
  },
  skipSuccessfulRequests: true,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Demasiados registros desde esta red. Intenta de nuevo más tarde.",
  },
});

export const messagingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Estás enviando mensajes muy rápido. Espera un momento.",
  },
  keyGenerator: (req) => {
    const userId = (req as typeof req & {
      user?: { id?: string | number };
    }).user?.id;

    if (userId !== undefined && userId !== null) {
      return `user:${userId}`;
    }

    return `ip:${ipKeyGenerator(req.ip ?? "127.0.0.1")}`;
  },
});

// Recuperación de contraseña: 5 solicitudes cada 15 minutos por IP.
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Demasiadas solicitudes de recuperación. Intenta de nuevo más tarde.",
  },
});

