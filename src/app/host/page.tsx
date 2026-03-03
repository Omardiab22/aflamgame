import { isHostAuthed } from "../../../lib/hostAuth"
import HostClient from "./HostClient"
import HostLogin from "./HostLogin"

export default async function HostPage() {
  const authed = await isHostAuthed()
  // ✅ ده بيحسمها من السيرفر: يا Login يا Panel
  return authed ? <HostClient /> : <HostLogin />
}