import { supabaseAdmin } from "../../../../../lib/supabaseAdmin"
import { QUESTIONS } from "../../../../../lib/questions"
import { shuffle } from "../../../../../lib/utils"
import { assertHost } from "../_auth"

export async function POST() {
  const auth = await assertHost()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 })

  const ids = shuffle(QUESTIONS.map((q) => q.id))

  const { error } = await supabaseAdmin
    .from("game_state")
    .update({
      status: "running",
      phase: "question",
      current_question_index: 0,
      phase_started_at: new Date().toISOString(),
      question_duration_sec: 3,
      leaderboard_duration_sec: 2,
      question_set: ids,
    })
    .eq("id", "global")

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}