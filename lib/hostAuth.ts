import crypto from "crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "host_session"

function hmac(data: string) {
  const secret = process.env.HOST_SESSION_SECRET
  if (!secret) throw new Error("Missing HOST_SESSION_SECRET")
  return crypto.createHmac("sha256", secret).update(data).digest("hex")
}

// بنرجّع القيمة اللي تتحط في الكوكي
export function makeHostCookieValue() {
  const ts = Date.now().toString()
  const sig = hmac(ts)
  return `${ts}.${sig}`
}

export async function isHostAuthed() {
  const store = await cookies()
  const v = store.get(COOKIE_NAME)?.value
  if (!v) return false

  const [ts, sig] = v.split(".")
  if (!ts || !sig) return false

  if (hmac(ts) !== sig) return false

  const ageMs = Date.now() - Number(ts)
  if (!Number.isFinite(ageMs) || ageMs < 0) return false
  if (ageMs > 12 * 60 * 60 * 1000) return false // 12h

  return true
}

export const HOST_COOKIE_NAME = COOKIE_NAME