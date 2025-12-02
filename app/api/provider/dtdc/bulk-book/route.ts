// app/api/providers/dtdc/bulk-book/route.ts
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/auth/session";
import { getClientProviderCredentials } from "@/lib/providerAuth";
import { makeDTDCClient } from "@/lib/providers/dtdc";
import { AppSession } from "@/types/session";

export async function POST(req: Request) {
  try {
    const res = new Response();
    const session = await getIronSession<AppSession>(req, res, sessionOptions);

    if (!session.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!Array.isArray(body?.consignments)) {
      return NextResponse.json({ ok: false, error: "consignments[] required" }, { status: 400 });
    }

    // Load decrypted client credentials
    const { credentials } = await getClientProviderCredentials(session.user.id, "dtdc");

    const client = makeDTDCClient(credentials);

    const response = await client.book(body.consignments);

    return NextResponse.json({ ok: true, result: response });

  } catch (err: any) {
    console.error("Bulk booking error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
