import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { courierDistanceSlabs } from "@/db/schema";

export async function GET() {
  const rows = await db
    .select()
    .from(courierDistanceSlabs)
    .orderBy(courierDistanceSlabs.min_km);

  return NextResponse.json({ ok: true, rows });
}

export async function POST(req: Request) {
  const b = await req.json();

  await db.insert(courierDistanceSlabs).values({
    client_id: 0,
    min_km: Number(b.min_km),
    max_km: Number(b.max_km),
    price: Number(b.price),
  });

  return NextResponse.json({ ok: true });
}
