import { supabaseAdmin } from "../../../../../lib/supabaseAdmin"
import { QUESTIONS } from "../../../../../lib/questions"
import { assertHost } from "../_auth"

export async function POST(req: Request) {
  const auth = assertHost()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 })

  // read game_state
  const { data: gs, error: gsErr } = await supabaseAdmin
    .from("game_state")
    .select("*")
    .eq("id", "global")
    .single()

  if (gsErr || !gs) return Response.json({ error: gsErr?.message ?? "No game state" }, { status: 500 })
  if (gs.status !== "running") return Response.json({ error: "Game not running" }, { status: 400 })
  if (gs.phase !== "question") return Response.json({ error: "Not in question phase" }, { status: 400 })

  const qId = gs.question_set?.[gs.current_question_index]
  const q = QUESTIONS.find((x) => x.id === qId)
  if (!q) return Response.json({ error: "Question not found" }, { status: 400 })

  // fetch answers for this question_index
  const { data: ans, error: ansErr } = await supabaseAdmin
    .from("answers")
    .select("player_id,is_correct")
    .eq("question_index", gs.current_question_index)

  if (ansErr) return Response.json({ error: ansErr.message }, { status: 500 })

  // build score updates: +5 for correct (one per player)
  const correctPlayers = new Set<string>()
  for (const a of ans ?? []) {
    if (a.is_correct) correctPlayers.add(a.player_id)
  }

  // increment players score in batch (loop is OK for MVP 30 players)
  for (const pid of correctPlayers) {
    await supabaseAdmin.rpc("increment_player_score", { pid, inc: 5 }).catch(() => null)
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