import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { assertHost } from "./_auth"

export async function POST() {
  const auth = await assertHost()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401 })

  const { error } = await supabaseAdmin
    .from("game_state")
    .update({
      status: "finished",
      phase: "finished",
      phase_started_at: new Date().toISOString(),
    })
    .eq("id", "global")

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}