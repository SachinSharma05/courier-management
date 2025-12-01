import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { courierSurcharges } from "@/db/schema/pricing";

export async function POST(req: Request) {
  const b = await req.json();

  await db.insert(courierSurcharges).values({
    client_id: 0, // global surcharge
    load_type: b.load_type, // NON-DOCUMENT or SPECIAL
    price: Number(b.price),
  });

  return NextResponse.json({ ok: true });
}
