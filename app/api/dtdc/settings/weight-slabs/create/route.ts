import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { courierWeightSlabs } from "@/db/schema";

export async function POST(req: Request) {
  const body = await req.json();

  await db.insert(courierWeightSlabs).values({
    client_id: 0,
    min_weight: body.min_weight,
    max_weight: body.max_weight,
    price: body.price,
  });

  return NextResponse.json({ ok: true });
}
