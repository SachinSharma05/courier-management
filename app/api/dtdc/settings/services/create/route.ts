import { NextResponse } from "next/server";
import { courierServices } from "@/db/schema/pricing";
import { db } from "@/lib/db/postgres";

export async function POST(req: Request) {
  const b = await req.json();

  await db.insert(courierServices).values({
    client_id: 0,
    code: b.code,
    base_price: b.base_price,
    priority_multiplier: b.priority_multiplier ?? "1",
  });

  return NextResponse.json({ ok: true });
}
