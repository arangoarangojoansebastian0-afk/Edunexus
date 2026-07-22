/**
 * Envío de correo para recuperación de contraseña y verificación de cuenta.
 *
 * Usa Resend (https://resend.com) porque su API es un solo POST sin SDK
 * pesado. Si no configuras RESEND_API_KEY, la app NO se rompe: el correo se
 * imprime en los logs del servidor en su lugar (útil en desarrollo, o
 * mientras decides qué proveedor usar en producción). En Render, agrega:
 *   RESEND_API_KEY=re_xxx
 *   EMAIL_FROM="EduNexus <no-reply@tudominio.com>"   (debe ser un dominio
 *     verificado en Resend; mientras no verifiques un dominio propio,
 *     puedes usar el remitente de pruebas que da Resend por defecto)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "EduNexus <onboarding@resend.dev>";

export const emailEnabled = !!RESEND_API_KEY;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn(
      `[email] RESEND_API_KEY no configurado — correo NO enviado, solo mostrado en consola.\n` +
      `  Para: ${to}\n  Asunto: ${subject}\n  Contenido:\n${html}\n`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Error enviando correo (${res.status}): ${body}`);
  }
}

export function passwordResetEmailHtml(firstName: string, resetUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#116fd4;">Recuperación de contraseña</h2>
      <p>Hola ${firstName || ""},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, haz clic en el siguiente botón (válido por 1 hora):</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${resetUrl}" style="background:#116fd4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Restablecer contraseña</a>
      </p>
      <p style="color:#666;font-size:13px;">Si no solicitaste esto, puedes ignorar este correo — tu contraseña seguirá siendo la misma.</p>
    </div>
  `;
}

export function verificationEmailHtml(firstName: string, verifyUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#116fd4;">Confirma tu correo</h2>
      <p>Hola ${firstName || ""},</p>
      <p>Confirma tu correo para activar tu cuenta:</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${verifyUrl}" style="background:#116fd4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Verificar mi correo</a>
      </p>
      <p style="color:#666;font-size:13px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
    </div>
  `;
}
