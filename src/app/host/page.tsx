"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"
import { AppShell } from "../../../components/AppShell"

type Player = { id: string; name: string; score: number }
type GameState = { status: string; phase: string; current_question_index: number }

export default function HostPage() {
  const router = useRouter()

  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string | null>(null)

  const [players, setPlayers] = useState<Player[]>([])
  const [gs, setGs] = useState<GameState | null>(null)

  // check auth
  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/host/me", { method: "GET" })
      setAuthed(res.ok)
      setChecking(false)
    })()
  }, [])

  // load dashboard data when authed
  useEffect(() => {
    if (!authed) return
    ;(async () => {
      const { data: gs0 } = await supabase
        .from("game_state")
        .select("status,phase,current_question_index")
        .eq("id", "global")
        .single()
      if (gs0) setGs(gs0)

      const { data: p0 } = await supabase
        .from("players")
        .select("id,name,score")
        .eq("is_active", true)
        .order("joined_at", { ascending: true })
      if (p0) setPlayers(p0)
    })()
  }, [authed])

  const login = async () => {
    setErr(null)
    const res = await fetch("/api/host/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) return setErr(j?.error ?? "Login failed")
    setAuthed(true)
  }

  const logout = async () => {
    await fetch("/api/host/logout", { method: "POST" })
    setAuthed(false)
  }

  const call = async (path: string) => {
    const res = await fetch(path, { method: "POST" })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) alert(j?.error ?? "Host action failed")
  }

  if (checking) {
    return (
      <AppShell title="Host" subtitle="Loading...">
        <div className="panel p-5">Loading…</div>
      </AppShell>
    )
  }

  if (!authed) {
    return (
      <AppShell title="Host Login" subtitle="دخول الهوست فقط">
        <div className="panel p-5">
          <label className="text-sm" style={{ color: "var(--muted)" }}>Username</label>
          <input className="input mt-2" value={username} onChange={(e) => setUsername(e.target.value)} />

          <label className="text-sm mt-4 block" style={{ color: "var(--muted)" }}>Password</label>
          <input className="input mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}

          <button className="btn btn-primary mt-4 w-full" onClick={login}>Login</button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Host Panel" subtitle="تحكم كامل في اللعبة" right={
      <button className="px-3 py-1 text-xs rounded-full border" style={{ borderColor: "var(--stroke)", background: "var(--panel)" }} onClick={logout}>
        Logout
      </button>
    }>
      <div className="panel p-5">
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => call("/api/host/start")}>Start Game</button>
          <button className="btn" onClick={() => call("/api/host/close")}>Close Q → Leaderboard</button>
          <button className="btn" onClick={() => call("/api/host/next")}>Next Question</button>
          <button className="btn" onClick={() => router.push("/lobby")}>View Lobby</button>
        </div>

        <div className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
          status: <b>{gs?.status ?? "…"}</b> — phase: <b>{gs?.phase ?? "…"}</b> — qIndex: <b>{gs?.current_question_index ?? "…"}</b>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--muted)" }}>Players</span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>{players.length} لاعب</span>
          </div>

          <div className="mt-3 grid gap-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)" }}>
                <span className="font-semibold">{p.name}</span>
                <span className="text-sm font-bold">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}