import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { assertHost } from "../_auth"

export async function POST() {
  const auth = await assertHost()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 })

  // نفضّي answers ونرجّع state للّوبي (اختياري تصفير السكور)
  await supabaseAdmin.from("answers").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  await supabaseAdmin.from("players").update({ score: 0 }).eq("is_active", true)

  const { error } = await supabaseAdmin
    .from("game_state")
    .update({
      status: "lobby",
      phase: "lobby",
      current_question_index: 0,
      phase_started_at: new Date().toISOString(),
      question_set: null,
    })
    .eq("id", "global")

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}