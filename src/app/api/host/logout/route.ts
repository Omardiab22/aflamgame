import { clearHostCookie } from "../../../../../lib/hostAuth"

export async function POST() {
  await clearHostCookie()
  return Response.json({ ok: true })
}