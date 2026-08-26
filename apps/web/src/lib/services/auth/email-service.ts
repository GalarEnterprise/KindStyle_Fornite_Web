import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

const MOCK_EMAIL = process.env.MOCK_EMAIL === 'true' || process.env.MOCK_FULFILLMENT === 'true'

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  if (MOCK_EMAIL) {
    console.log(`[MockEmail] Verification code for ${email}: ${code}`)
    return
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@kindstyle.com',
      to: email,
      subject: 'Tu código de verificación - KindStyle',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8A2BE2;">KindStyle</h1>
          <h2>Tu código de verificación</h2>
          <p style="font-size: 18px;">Tu código es:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #8A2BE2;">
              ${code}
            </span>
          </div>
          <p style="color: #6b7280; margin-top: 16px;">
            Este código expira en <strong>10 minutos</strong>.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Si no solicitaste este código, ignora este email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 24px;" />
          <p style="color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} KindStyle. Todos los derechos reservados.
          </p>
        </div>
      `,
    })
    console.log(`[EmailService] Verification code sent to ${email}`)
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${email}:`, error)
    throw new Error('No se pudo enviar el código de verificación')
  }
}
