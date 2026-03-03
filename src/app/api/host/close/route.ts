import { supabaseAdmin } from "../../../../../lib/supabaseAdmin"
import { QUESTIONS } from "../../../../../lib/questions"
import { assertHost } from "../_auth"

export async function POST() {
  const auth = await assertHost()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 })

  const { data: gs, error: gsErr } = await supabaseAdmin
    .from("game_state")
    .select("*")
    .eq("id", "global")
    .single()

  if (gsErr || !gs) {
    return Response.json({ error: gsErr?.message ?? "No game state" }, { status: 500 })
  }
  if (gs.status !== "running") return Response.json({ error: "Game not running" }, { status: 400 })
  if (gs.phase !== "question") return Response.json({ error: "Not in question phase" }, { status: 400 })

  const qId = gs.question_set?.[gs.current_question_index]
  const q = QUESTIONS.find((x) => x.id === qId)
  if (!q) return Response.json({ error: "Question not found" }, { status: 400 })

  // answers for this question index
  const { data: ans, error: ansErr } = await supabaseAdmin
    .from("answers")
    .select("player_id,is_correct")
    .eq("question_index", gs.current_question_index)

  if (ansErr) return Response.json({ error: ansErr.message }, { status: 500 })

  // +5 لكل لاعب صح (مرة واحدة)
  const correctPlayers = new Set<string>()
  for (const a of ans ?? []) {
    if (a.is_correct) correctPlayers.add(a.player_id)
  }

  for (const pid of correctPlayers) {
    const { error: rpcErr } = await supabaseAdmin.rpc("increment_player_score", { pid, inc: 5 })
    if (rpcErr) return Response.json({ error: rpcErr.message }, { status: 500 })
  }

  // move to leaderboard phase
  const { error: upErr } = await supabaseAdmin
    .from("game_state")
    .update({
      phase: "leaderboard",
      phase_started_at: new Date().toISOString(),
    })
    .eq("id", "global")

  if (upErr) return Response.json({ error: upErr.message }, { status: 500 })
  return Response.json({ ok: true, awarded: correctPlayers.size })
}