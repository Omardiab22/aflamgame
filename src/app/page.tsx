"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import { AppShell } from "../../components/AppShell"

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const join = async () => {
    setErr(null)
    const trimmed = name.trim()
    if (trimmed.length < 2) return setErr("اكتب اسمك (حرفين على الأقل).")

    setLoading(true)

    // ✅ هنا التعديل المهم: is_active + last_seen_at من أول لحظة
    const { data, error } = await supabase
      .from("players")
      .insert({
        name: trimmed,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    setLoading(false)

    if (error) return setErr(error.message)

    localStorage.setItem("player_id", data.id)
    localStorage.setItem("player_name", trimmed)
    router.push("/lobby")
  }

  return (
    <AppShell
      title="لعبة الأفلام"
      subtitle="اكتب اسمك، ادخل اللوبي، واستنى الهوست يبدأ."
      right={
        <span
          className="px-3 py-1 text-xs rounded-full border"
          style={{ borderColor: "var(--stroke)", background: "var(--panel)" }}
        >
          🎬 Live
        </span>
      }
    >
      <div className="panel p-5">
        <label className="text-sm" style={{ color: "var(--muted)" }}>
          Enter your name
        </label>

        <input
          className="input mt-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثلاً: Omar"
        />

        {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}

        <button
          className={`btn btn-primary mt-4 w-full ${loading ? "opacity-70" : ""}`}
          onClick={join}
          disabled={loading}
        >
          {loading ? "Joining..." : "Join"}
        </button>

        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          بعد ما تدخل هتستنى لحد ما الهوست يضغط Start.
        </p>
      </div>
    </AppShell>
  )
}