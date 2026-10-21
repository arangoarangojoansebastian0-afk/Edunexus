# Configuración del entorno

La plantilla `.env.example` enumera las variables reconocidas por el código. Cópiala a `.env` y reemplaza los valores de ejemplo. En hosting, define las variables en el panel de secretos; no publiques credenciales.

| Variable | Requerida | Uso |
|---|---:|---|
| `DATABASE_URL` | Sí | URL de PostgreSQL; alternativa principal para Drizzle y sesiones. |
| `SUPABASE_DATABASE_URL` | Opcional | URL PostgreSQL prioritaria si está definida. |
| `SESSION_SECRET` | Sí para producción | Firma cookies de sesión; el código tiene un fallback inseguro que debe eliminarse antes de producción. |
| `PORT` | No | Puerto HTTP; predeterminado 2000. |
| `NODE_ENV` | No | Entorno; producción habilita servir `dist/public`. |
| `APP_URL` | Recomendado | URL pública que se coloca en enlaces de verificación y recuperación. |
| `RESEND_API_KEY` | Opcional | Habilita envío de correo transaccional desde `server/email.ts`. |
| `EMAIL_FROM` | Opcional | Remitente de Resend; default `EduNexus <onboarding@resend.dev>`. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Sí para arranque actual | Cliente Supabase se crea al importar las rutas; la clave de servicio es secreta. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Según integración | OAuth de Google Classroom. |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Según integración | Salas de video y tokens LiveKit. |
| `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` | Según llamadas | Servidor TURN para conexiones WebRTC. Credencial secreta. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Opcional | Notificaciones push; sin par VAPID se desactivan. |
| `MASTER2000_API_URL`, `MASTER2000_API_KEY` | Según integración | Adaptador académico Master2000. |
| `SUPER_ADMIN_SETUP_KEY` | Temporal | Protege el endpoint de creación inicial de superadministrador; quitar/desactivar tras su uso. |

## Correo de desarrollo

EduNexus usa Resend directamente por HTTP. Define `RESEND_API_KEY` solo en el servidor. Sin ella, el módulo imprime un aviso en logs y no entrega mensajes. Para enlaces locales, `APP_URL` debe ser una dirección accesible desde el navegador que abre el enlace; en una aplicación local integrada suele ser `http://localhost:2000`.

Para producción, configura un remitente sobre un dominio verificado y `APP_URL` con el origen HTTPS real. No uses la clave de servicio Supabase ni la clave Resend en variables `VITE_*`.

## Cliente Supabase

El código importa un cliente Supabase al arrancar las rutas. Completa `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`. La clave de servicio debe quedarse en el backend y sus permisos deben ser mínimos para el uso previsto.
