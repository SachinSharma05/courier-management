import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { courierWeightSlabs } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(courierWeightSlabs).orderBy(courierWeightSlabs.min_weight);
  return NextResponse.json({ ok: true, rows });
}