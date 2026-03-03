"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { AppShell } from "@/components/AppShell"
import { QUESTIONS } from "@/lib/questions"
import { msLeft } from "@/lib/utils"

type Player = { id: string; name: string; score: number; last_seen_at: string }
type GameState = {
  status: string
  phase: "countdown" | "question" | "leaderboard" | "lobby" | "finished"
  current_question_index: number
  phase_started_at: string | null
  countdown_duration_sec: number
  question_duration_sec: number
  leaderboard_duration_sec: number
  question_set: string[] | null
}

function sinceIso(ms: number) {
  return new Date(Date.now() - ms).toISOString()
}

export default function PlayPage() {
  const router = useRouter()
  const [gs, setGs] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [now, setNow] = useState(Date.now())
  const [picked, setPicked] = useState<number | null>(null)

  const myId = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("player_id") : null),
    []
  )

  useEffect(() => {
    if (!myId) router.replace("/")
  }, [myId, router])

  const fetchPlayers = async () => {
    const since = sinceIso(30_000)
    const { data } = await supabase
      .from("players")
      .select("id,name,score,last_seen_at")
      .gte("last_seen_at", since)
      .order("score", { ascending: false })
    if (data) setPlayers(data as Player[])
  }

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 120)
    return () => clearInterval(t)
  }, [])

  // Heartbeat + leave
  useEffect(() => {
    if (!myId) return

    const tick = async () => {
      await supabase
        .from("players")
        .update({ last_seen_at: new Date().toISOString(), is_active: true })
        .eq("id", myId)
    }

    tick()
    const i = setInterval(tick, 10_000)

    const leave = () => {
      const payload = JSON.stringify({ playerId: myId })
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/player/leave", new Blob([payload], { type: "application/json" }))
      } else {
        fetch("/api/player/leave", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    }

    window.addEventListener("beforeunload", leave)
    return () => {
      clearInterval(i)
      window.removeEventListener("beforeunload", leave)
    }
  }, [myId])

  useEffect(() => {
    let chGs: any, chPlayers: any

    ;(async () => {
      const { data: gs0 } = await supabase.from("game_state").select("*").eq("id", "global").single()
      if (gs0) setGs(gs0 as any)

      await fetchPlayers()

      chGs = supabase
        .channel("gs_watch_play")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_state" }, (payload) => {
          // @ts-ignore
          setGs(payload.new)
          setPicked(null)
        })
        .subscribe()

      chPlayers = supabase
        .channel("players_watch_play")
        .on("postgres_changes", { event: "*", schema: "public", table: "players" }, async () => {
          await fetchPlayers()
        })
        .subscribe()
    })()

    return () => {
      if (chGs) supabase.removeChannel(chGs)
      if (chPlayers) supabase.removeChannel(chPlayers)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (gs?.status === "lobby") router.replace("/lobby")
    if (gs?.status === "finished") router.replace("/results")
  }, [gs?.status, router])

  const qId = useMemo(() => {
    if (!gs?.question_set) return null
    return gs.question_set[gs.current_question_index] ?? null
  }, [gs?.question_set, gs?.current_question_index])

  const q = useMemo(() => {
    if (!qId) return null
    return QUESTIONS.find((x) => x.id === qId) ?? null
  }, [qId])

  const timeLeftMs = useMemo(() => {
    if (!gs) return 0
    const dur =
      gs.phase === "countdown"
        ? gs.countdown_duration_sec
        : gs.phase === "question"
        ? gs.question_duration_sec
        : gs.leaderboard_duration_sec

    return msLeft(gs.phase_started_at, dur)
  }, [gs, now])

  const timeLeftSec = Math.ceil(timeLeftMs / 1000)

  const submit = async (choiceIndex: number) => {
    if (!gs || gs.phase !== "question" || !q || !myId) return
    if (picked !== null) return
    if (timeLeftMs === 0) return

    setPicked(choiceIndex)

    await supabase.from("answers").insert({
      player_id: myId,
      question_index: gs.current_question_index,
      choice_index: choiceIndex,
      is_correct: choiceIndex === q.correctIndex,
    })
  }

  const myRank = useMemo(() => {
    if (!myId) return null
    const idx = players.findIndex((p) => p.id === myId)
    return idx >= 0 ? idx + 1 : null
  }, [players, myId])

  if (!gs) {
    return (
      <AppShell title="اللعب" subtitle="Loading...">
        <div className="panel p-5">Loading…</div>
      </AppShell>
    )
  }

  // ✅ Countdown screen
  if (gs.phase === "countdown") {
    return (
      <AppShell title="الجيم هيبدأ" subtitle={`استعد… ${timeLeftSec}s`}>
        <div className="panel p-5 text-center">
          <div className="text-4xl font-extrabold">{timeLeftSec}</div>
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            الهوست بدأ الجيم—أول سؤال بعد ثواني.
          </p>
        </div>
      </AppShell>
    )
  }

  // Leaderboard phase
  if (gs.phase === "leaderboard") {
    return (
      <AppShell title="الترتيب" subtitle={`هيختفي بعد ${timeLeftSec}s`}>
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              Leaderboard
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              ترتيبك: {myRank ? `#${myRank}` : "—"}
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {players.slice(0, 10).map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--stroke)" }}
                  >
                    #{i + 1}
                  </span>
                  <span className="font-semibold">{p.name}</span>
                </div>
                <span className="font-bold">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  // Question phase
  return (
    <AppShell
      title={`سؤال ${gs.current_question_index + 1}`}
      subtitle={`الوقت: ${timeLeftSec}s — ترتيبك: ${myRank ? `#${myRank}` : "—"}`}
      right={
        <span
          className="px-3 py-1 text-xs rounded-full border"
          style={{ borderColor: "var(--stroke)", background: "var(--panel)" }}
        >
          ⏳ {timeLeftSec}s
        </span>
      }
    >
      <div className="panel p-5">
        <div className="text-lg font-bold leading-snug">{q?.text ?? "…"}</div>

        <div className="mt-4 grid gap-3">
          {q?.choices.map((c, idx) => {
            const disabled = picked !== null || timeLeftMs === 0
            const active = picked === idx
            return (
              <button
                key={idx}
                className="btn w-full text-right"
                style={{
                  opacity: disabled && !active ? 0.75 : 1,
                  borderColor: active ? "rgba(34,211,238,0.5)" : "var(--stroke)",
                  background: active ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.06)",
                }}
                disabled={disabled}
                onClick={() => submit(idx)}
              >
                {c}
              </button>
            )
          })}
        </div>

        <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
          بعد انتهاء الوقت، الترتيب هيظهر لحظيًا.
        </p>
      </div>
    </AppShell>
  )
}