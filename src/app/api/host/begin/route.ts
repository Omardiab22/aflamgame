import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { assertHost } from "../_auth"

export async function POST() {
  const auth = await assertHost()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 })

  const { data: gs, error: gsErr } = await supabaseAdmin
    .from("game_state")
    .select("*")
    .eq("id", "global")
    .single()

  if (gsErr || !gs) return Response.json({ error: gsErr?.message ?? "No game state" }, { status: 500 })
  if (gs.status !== "running") return Response.json({ error: "Game not running" }, { status: 400 })
  if (gs.phase !== "countdown") return Response.json({ error: "Not in countdown phase" }, { status: 400 })

  const { error } = await supabaseAdmin
    .from("game_state")
    .update({
      phase: "question",
      phase_started_at: new Date().toISOString(),
    })
    .eq("id", "global")

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}