import { supabaseAdmin } from "../../../../../lib/supabaseAdmin"
import { assertHost } from "../_auth"

export async function POST() {
  const auth = assertHost()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 })

  const { data: gs, error: gsErr } = await supabaseAdmin
    .from("game_state")
    .select("*")
    .eq("id", "global")
    .single()

  if (gsErr || !gs) return Response.json({ error: gsErr?.message ?? "No game state" }, { status: 500 })
  if (gs.status !== "running") return Response.json({ error: "Game not running" }, { status: 400 })
  if (gs.phase !== "leaderboard") return Response.json({ error: "Not in leaderboard phase" }, { status: 400 })

  const nextIndex = gs.current_question_index + 1
  const total = Array.isArray(gs.question_set) ? gs.question_set.length : 0

  if (nextIndex >= total) {
    const { error } = await supabaseAdmin
      .from("game_state")
      .update({
        status: "finished",
        phase: "finished",
        phase_started_at: new Date().toISOString(),
      })
      .eq("id", "global")

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true, finished: true })
  }

  const { error } = await supabaseAdmin
    .from("game_state")
    .update({
      phase: "question",
      current_question_index: nextIndex,
      phase_started_at: new Date().toISOString(),
    })
    .eq("id", "global")

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, nextIndex })
}