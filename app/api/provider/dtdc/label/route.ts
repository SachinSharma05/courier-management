// app/api/providers/dtdc/label/route.ts
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

    if (!session.user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { awb } = body;
    if (!awb) return NextResponse.json({ ok: false, error: "awb required" }, { status: 400 });

    const { credentials } = await getClientProviderCredentials(session.user.id, "dtdc");
    const client = makeDTDCClient(credentials);
    const labelResp = await client.getLabel(awb);

    if (!labelResp.ok) return NextResponse.json({ ok: false, error: labelResp.error }, { status: 500 });

    // return base64 label directly
    return NextResponse.json({ ok: true, label_base64: labelResp.label_base64 });
  } catch (err: any) {
    console.error("label route error", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}
