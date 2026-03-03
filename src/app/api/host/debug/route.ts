import { cookies } from "next/headers"
import { HOST_COOKIE_NAME } from "../../../../../lib/hostAuth"

export async function GET() {
  const store = await cookies()
  const hasCookie = !!store.get(HOST_COOKIE_NAME)?.value

  return Response.json(
    {
      hasCookie,
      nodeEnv: process.env.NODE_ENV,
      hasSecret: !!process.env.HOST_SESSION_SECRET,
      hasUser: !!process.env.HOST_USERNAME,
      hasPass: !!process.env.HOST_PASSWORD,
    },
    { status: 200 }
  )
}