import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY
const senderEmail = process.env.SENDER_EMAIL ?? "onboarding@resend.dev"
const senderName = process.env.SENDER_NAME?.trim()
const fromEmail = senderName
  ? `${senderName} <${senderEmail}>`
  : senderEmail
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

function getResend() {
  if (!apiKey) return null
  return new Resend(apiKey)
}

export type OrderConfirmationPayload = {
  to: string
  userName: string
  orderId: string
  total: string
  items: { name: string; quantity: number; price: string }[]
}

export async function sendOrderConfirmation(
  payload: OrderConfirmationPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping order confirmation email")
    return { ok: true }
  }

  const itemsList = payload.items
    .map((i) => `• ${i.name} × ${i.quantity} — ${i.price}`)
    .join("\n")

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2>Подтверждение заказа</h2>
  <p>Здравствуйте, ${escapeHtml(payload.userName)}!</p>
  <p>Ваш заказ <strong>#${escapeHtml(payload.orderId)}</strong> успешно оплачен.</p>
  <p><strong>Сумма:</strong> ${escapeHtml(payload.total)}</p>
  <h3>Товары:</h3>
  <pre style="background: #f5f5f5; padding: 12px; border-radius: 8px;">${escapeHtml(itemsList)}</pre>
  <p><a href="${escapeHtml(appUrl)}/dashboard/orders/${payload.orderId}" style="color: #2563eb;">Посмотреть заказ</a></p>
  <p style="color: #666; font-size: 12px;">С уважением, команда магазина.</p>
</body>
</html>
`.trim()

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: payload.to,
    subject: `Заказ #${payload.orderId} оплачен`,
    html,
  })

  if (error) {
    console.error("Resend order confirmation error:", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export type ShippingUpdatePayload = {
  to: string
  userName: string
  orderId: string
  address: string
}

export async function sendShippingUpdate(
  payload: ShippingUpdatePayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping shipping update email")
    return { ok: true }
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2>Заказ отправлен</h2>
  <p>Здравствуйте, ${escapeHtml(payload.userName)}!</p>
  <p>Ваш заказ <strong>#${escapeHtml(payload.orderId)}</strong> отправлен.</p>
  <p><strong>Адрес доставки:</strong><br/>${escapeHtml(payload.address).replace(/\n/g, "<br/>")}</p>
  <p><a href="${escapeHtml(appUrl)}/dashboard/orders/${payload.orderId}" style="color: #2563eb;">Отследить заказ</a></p>
  <p style="color: #666; font-size: 12px;">С уважением, команда магазина.</p>
</body>
</html>
`.trim()

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: payload.to,
    subject: `Заказ #${payload.orderId} отправлен`,
    html,
  })

  if (error) {
    console.error("Resend shipping update error:", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export type PasswordResetPayload = {
  to: string
  resetUrl: string
}

export async function sendPasswordResetEmail(
  payload: PasswordResetPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping password reset email")
    return { ok: false, error: "Email service not configured" }
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2>Сброс пароля</h2>
  <p>Вы запросили сброс пароля. Нажмите ссылку ниже, чтобы задать новый пароль:</p>
  <p><a href="${escapeHtml(payload.resetUrl)}" style="color: #2563eb;">Сбросить пароль</a></p>
  <p>Ссылка действительна 1 час. Если вы не запрашивали сброс, проигнорируйте это письмо.</p>
  <p style="color: #666; font-size: 12px;">С уважением, команда магазина.</p>
</body>
</html>
`.trim()

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: payload.to,
    subject: "Сброс пароля",
    html,
  })

  if (error) {
    console.error("Resend password reset error:", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
