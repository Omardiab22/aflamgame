import { clearHostCookie } from "../../../../../lib/hostAuth"

export async function POST() {
  clearHostCookie()
  return Response.json({ ok: true })
}