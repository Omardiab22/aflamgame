import { createHostCookie } from "../../../../../lib/hostAuth"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = (body.username ?? "").toString()
  const password = (body.password ?? "").toString()

  const u = process.env.HOST_USERNAME
  const p = process.env.HOST_PASSWORD
  const s = process.env.HOST_SESSION_SECRET

  if (!u || !p || !s) {
    return Response.json(
      { error: "Missing HOST_USERNAME / HOST_PASSWORD / HOST_SESSION_SECRET in env" },
      { status: 500 }
    )
  }

  if (username === u && password === p) {
    await createHostCookie()
    return Response.json({ ok: true })
  }

  return Response.json({ error: "Invalid credentials" }, { status: 401 })
}