import { NextResponse } from "next/server";
import { pinDB } from "@/lib/pinDB";
import { pincodes } from "@/db/pincodeSchema";
import { eq, like } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get("pin");

  if (!pin) {
    return NextResponse.json({ ok: false, error: "pin required" }, { status: 400 });
  }

  // Exact 6-digit pincode
  if (/^\d{6}$/.test(pin)) {
    const rows = await pinDB
      .select()
      .from(pincodes)
      .where(eq(pincodes.pincode, pin))
      .limit(1);

    return NextResponse.json({
      ok: true,
      result: rows[0] || null,
    });
  }

  // Partial search (autocomplete)
  const rows = await pinDB
    .select()
    .from(pincodes)
    .where(like(pincodes.pincode, `${pin}%`))
    .limit(20);

  return NextResponse.json({
    ok: true,
    results: rows,
  });
}
