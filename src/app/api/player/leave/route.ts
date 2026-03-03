import { supabaseAdmin } from "../../../../../lib/supabaseAdmin"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const playerId = (body.playerId ?? "").toString()

  if (!playerId) {
    return Response.json({ error: "Missing playerId" }, { status: 400 })
  }

  // Mark inactive + push last_seen far in the past so it disappears immediately
  const { error } = await supabaseAdmin
    .from("players")
    .update({ is_active: false, last_seen_at: new Date(0).toISOString() })
    .eq("id", playerId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}