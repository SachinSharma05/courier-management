import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { courierDistanceSlabs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, context: any) {
  const { id } = await context.params;   // MUST await
  const slabId = Number(id);

  if (!slabId) {
    return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(courierDistanceSlabs)
    .where(eq(courierDistanceSlabs.id, slabId));

  return NextResponse.json({ ok: true, row: rows[0] });
}

export async function PUT(req: Request, context: any) {
  const { id } = await context.params;   // MUST await
  const slabId = Number(id);

  if (!slabId) {
    return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();

  await db
    .update(courierDistanceSlabs)
    .set({
      min_km: Number(body.min_km),
      max_km: Number(body.max_km),
      price: Number(body.price),
    })
    .where(eq(courierDistanceSlabs.id, slabId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, context: any) {
  const { id } = await context.params;   // FIX
  const slabId = Number(id);

  if (!slabId) {
    return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });
  }

  await db.delete(courierDistanceSlabs).where(eq(courierDistanceSlabs.id, slabId));

  return NextResponse.json({ ok: true });
}