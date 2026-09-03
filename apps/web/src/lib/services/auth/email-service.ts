import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

const MOCK_EMAIL = process.env.MOCK_EMAIL === 'true' || process.env.MOCK_FULFILLMENT === 'true'

export type EmailContext = 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET'

interface VerificationEmailParams {
  email: string
  code: string
  context: EmailContext
}

function getSubject(context: EmailContext): string {
  switch (context) {
    case 'REGISTRATION':
      return 'Tu código de verificación - KindStyle'
    case 'LOGIN':
      return 'Código de inicio de sesión - KindStyle'
    case 'PASSWORD_RESET':
      return 'Código de recuperación de contraseña - KindStyle'
  }
}

function getContextMessage(context: EmailContext): string {
  switch (context) {
    case 'REGISTRATION':
      return 'Has solicitado registrarte en KindStyle. Usa el siguiente código para verificar tu email:'
    case 'LOGIN':
      return 'Has solicitado iniciar sesión en KindStyle. Usa el siguiente código para verificar tu email:'
    case 'PASSWORD_RESET':
      return 'Has solicitado recuperar tu contraseña. Usa el siguiente código para verificar tu email:'
  }
}

function getHtmlTemplate(code: string, context: EmailContext): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #8A2BE2;">KindStyle</h1>
      <h2>${getSubject(context)}</h2>
      <p style="font-size: 18px;">${getContextMessage(context)}</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #8A2BE2;">
          ${code}
        </span>
      </div>
      <p style="color: #6b7280; margin-top: 16px;">
        Este código expira en <strong>10 minutos</strong>.
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        Si no solicitaste este código, ignora este email. No compartas este código con nadie.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 24px;" />
      <p style="color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} KindStyle. Todos los derechos reservados.
      </p>
    </div>
  `
}

export async function sendVerificationCode(params: VerificationEmailParams): Promise<void> {
  const { email, code, context } = params

  if (MOCK_EMAIL) {
    console.log(`[MockEmail] Verification code for ${email}: ${code} (context: ${context})`)
    return
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@kindstyle.com',
      to: email,
      subject: getSubject(context),
      html: getHtmlTemplate(code, context),
    })
    console.log(`[EmailService] Verification code sent to ${email} (context: ${context})`)
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${email} (context: ${context}):`, error)
    throw new Error('No se pudo enviar el código de verificación')
  }
}
