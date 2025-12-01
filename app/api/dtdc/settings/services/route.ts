import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { courierServices } from "@/db/schema/pricing";

export async function GET() {
  const rows = await db.select().from(courierServices);
  return NextResponse.json({ ok: true, rows });
}
