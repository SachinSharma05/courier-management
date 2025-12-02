import { NextResponse } from "next/server";
import { getIronSession, sessionOptions } from "@/lib/auth/session";
import { getClientProviderCredentials } from "@/lib/providerAuth";
import { makeDTDCClient } from "@/lib/providers/dtdc";
import { calculatePrice } from "@/lib/pricing/engine";

export async function POST(req: Request) {
  try {
    const res = new Response();
    const session = await getIronSession(req, res, sessionOptions);

    // Now TS recognizes "session.user"
    if (!session.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const consignments = body.consignments;

    if (!Array.isArray(consignments) || consignments.length === 0) {
      return NextResponse.json(
        { ok: false, error: "consignments[] required" },
        { status: 400 }
      );
    }

    const { credentials } = await getClientProviderCredentials(
      session.user.id,
      "dtdc"
    );

    const client = makeDTDCClient(credentials);
    const result = await client.book(consignments);

    const awb =
      result?.data?.[0]?.reference_number ??
      result?.data?.[0]?.awb_no ??
      null;

    const c = consignments[0];

    const pricing = await calculatePrice({
      client_id: session.user.id,
      service_type: c.service_type_id,
      load_type: c.load_type,
      weight: Number(c.weight),
      origin_pincode: c.origin_details.pincode,
      dest_pincode: c.destination_details.pincode,
    });

    return NextResponse.json({
      ok: true,
      result,
      pricing,
      awb,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
