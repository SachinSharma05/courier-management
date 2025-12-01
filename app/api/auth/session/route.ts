import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const res = new NextResponse();

  const session = await getIronSession(req, res, sessionOptions);

  if (!session.user) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({
    ok: true,
    user: session.user,
  });
}
