import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { courierSurcharges } from "@/db/schema/pricing";

export async function GET() {
  const rows = await db.select().from(courierSurcharges);
  return NextResponse.json({ ok: true, rows });
}
