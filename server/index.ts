

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { runMigrations } from "./migrate";
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const app = express();
const httpServer = createServer(app);

// Render corre la app detrás de un proxy inverso; sin esto, Express ve la IP
// interna del proxy como si fuera la de todos los usuarios por igual, lo cual
// rompe el rate limiting (y cualquier lógica futura basada en IP).
app.set("trust proxy", 1);

// Red de seguridad: en versiones recientes de Node, una promesa rechazada
// sin manejar (unhandledRejection) o una excepción no atrapada por defecto
// TUMBAN el proceso completo — con ~2900 líneas de rutas y websockets, un
// solo error suelto en cualquier parte podía desconectar a todos los
// usuarios de golpe. Preferimos loguearlo y seguir funcionando.
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// IMPORTANTE: sin un "store" explícito, express-session usa MemoryStore por
// defecto — vive solo en la RAM del proceso. Cada vez que Render reinicia el
// servidor (cualquier deploy, o si el plan gratuito "duerme" el servicio por
// inactividad y luego arranca de nuevo), esa memoria se borra por completo y
// TODAS las sesiones activas desaparecen de golpe — por eso todos quedaban
// deslogueados aunque la cookie en su navegador siguiera siendo válida por 7
// días: el servidor ya no tenía con qué reconocerla. Usamos Postgres (la
// misma base de datos de la app) para que la sesión sobreviva a reinicios.
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || "loyola-community-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
    },
  })
);

app.use(express.urlencoded({ extended: false, limit: "50mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("[server] starting...");
  await runMigrations();
  console.log("[server] migrations done");
  await registerRoutes(httpServer, app);
  console.log("[server] routes registered");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // OJO: antes había un "throw err;" aquí después de responder. Eso lanza
    // una excepción por fuera de cualquier try/catch (el error-handler de
    // Express ya no la atrapa), y sin un manejador global de excepciones no
    // capturadas, Node se cae por completo — tumbando la conexión de TODOS
    // los usuarios conectados, no solo la de quien causó el error original.
    // Render reinicia el contenedor automáticamente después de eso, lo cual
    // se sentía como "el sistema se reinicia solo" en momentos aleatorios
    // (cualquier error de una sola petición podía derribar todo el servidor).
    console.error(`[error] ${status} ${message}`, err.stack || err);
    if (!res.headersSent) res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
  serveStatic(app);
}

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 2000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.

 const port = parseInt(process.env.PORT || "2000", 10);
httpServer.listen(port, () => {
  log(`serving on port ${port}`);
});
})();
