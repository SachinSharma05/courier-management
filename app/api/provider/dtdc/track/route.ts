// app/api/providers/dtdc/track/route.ts
import { NextResponse } from "next/server";
import { getIronSession, sessionOptions } from "@/lib/auth/session";
import { getClientProviderCredentials } from "@/lib/providerAuth";
import { makeDTDCClient } from "@/lib/providers/dtdc";

export async function POST(req: Request) {
  try {
    // authenticate session from incoming request (server-side has cookies)
    const res = new Response();
    const session = await getIronSession(req, res, sessionOptions);
    if (!session.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { awb } = body;
    if (!awb) return NextResponse.json({ ok: false, error: "awb required" }, { status: 400 });

    // load credentials for logged-in client
    const { credentials } = await getClientProviderCredentials(session.user.id, "dtdc");

    // create provider client and call track
    const client = makeDTDCClient(credentials);
    const result = await client.track(awb);

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("DTDC track error:", err);
    return NextResponse.json({ ok: false, error: err.message ?? "Server error" }, { status: 500 });
  }
}
