import crypto from "crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "host_session"

function hmac(data: string) {
  const secret = process.env.HOST_SESSION_SECRET!
  return crypto.createHmac("sha256", secret).update(data).digest("hex")
}

// ✅ لازم async في Next 15
export async function createHostCookie() {
  const ts = Date.now().toString()
  const sig = hmac(ts)
  const value = `${ts}.${sig}`

  const store = await cookies()
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  })
}

export async function clearHostCookie() {
  const store = await cookies()
  store.set(COOKIE_NAME, "", { path: "/", maxAge: 0 })
}

// ✅ لازم async برضه
export async function isHostAuthed() {
  const store = await cookies()
  const v = store.get(COOKIE_NAME)?.value
  if (!v) return false

  const [ts, sig] = v.split(".")
  if (!ts || !sig) return false
  if (hmac(ts) !== sig) return false

  const ageMs = Date.now() - Number(ts)
  if (!Number.isFinite(ageMs) || ageMs < 0) return false
  if (ageMs > 12 * 60 * 60 * 1000) return false

  return true
}