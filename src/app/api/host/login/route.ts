import { NextResponse } from "next/server"
import { HOST_COOKIE_NAME, makeHostCookieValue } from "../../../../../lib/hostAuth"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = (body.username ?? "").toString()
  const password = (body.password ?? "").toString()

  const u = process.env.HOST_USERNAME
  const p = process.env.HOST_PASSWORD
  const s = process.env.HOST_SESSION_SECRET

  if (!u || !p || !s) {
    return NextResponse.json(
      { error: "Missing HOST_USERNAME / HOST_PASSWORD / HOST_SESSION_SECRET in env" },
      { status: 500 }
    )
  }

  if (username !== u || password !== p) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const value = makeHostCookieValue()

  const res = NextResponse.json({ ok: true }, { status: 200 })
  res.cookies.set(HOST_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
  return res
}