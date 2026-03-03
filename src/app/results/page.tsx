"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"
import { AppShell } from "../../../components/AppShell"

type Player = { id: string; name: string; score: number }

export default function ResultsPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const myId = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("player_id") : null), [])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from("players").select("id,name,score").eq("is_active", true).order("score", { ascending: false })
      if (data) setPlayers(data)
    })()
  }, [])

  const myRank = useMemo(() => {
    if (!myId) return null
    const idx = players.findIndex((p) => p.id === myId)
    return idx >= 0 ? idx + 1 : null
  }, [players, myId])

  return (
    <AppShell title="النتيجة النهائية" subtitle={myRank ? `ترتيبك النهائي: #${myRank}` : "Leaderboard"}>
      <div className="panel p-5">
        <div className="grid gap-2">
          {players.slice(0, 20).map((p, i) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl px-4 py-3"
              style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--stroke)" }}>
                  #{i + 1}
                </span>
                <span className="font-semibold">{p.name}</span>
              </div>
              <span className="font-bold">{p.score}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-primary mt-5 w-full" onClick={() => router.replace("/")}>
          Play again (join جديد)
        </button>
      </div>
    </AppShell>
  )
}