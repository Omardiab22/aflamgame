import { isHostAuthed } from "../../../../../lib/hostAuth"

export async function GET() {
  const loggedIn = await isHostAuthed()
  return Response.json({ loggedIn }, { status: 200 })
}