import { isHostAuthed } from "../../../../../lib/hostAuth"

export async function GET() {
  if (!isHostAuthed()) return Response.json({ ok: false }, { status: 401 })
  return Response.json({ ok: true })
}