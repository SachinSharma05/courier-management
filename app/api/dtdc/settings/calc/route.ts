import { NextResponse } from "next/server";
import { getIronSession, sessionOptions } from "@/lib/auth/session";
import { calculatePrice } from "@/lib/pricing/engine";

export async function POST(req: Request) {
  try {
    const res = new Response();
    const session = await getIronSession(req, res, sessionOptions);
    if (!session.user) return NextResponse.json({ ok: false, error: "Unauthorized" });

    const body = await req.json();

    const result = await calculatePrice({
      client_id: session.user.id,
      service_type: body.service_type_id,
      load_type: body.load_type,
      weight: Number(body.weight),
      origin_pincode: body.origin_pincode,
      dest_pincode: body.dest_pincode,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
