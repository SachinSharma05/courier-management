// app/api/admin/track/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { consignments, trackingEvents } from "@/db/schema";
import { eq, inArray, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const awb = url.searchParams.get("awb");

    if (!awb)
      return NextResponse.json({ error: "awb is required" }, { status: 400 });

    /* -----------------------------------------
       1. Lookup in DB
    ------------------------------------------*/
    const cons = await db
      .select()
      .from(consignments)
      .where(eq(consignments.awb, awb))
      .limit(1);

    if (cons.length === 0) {
      return NextResponse.json({
        found: false,
        message: "AWB not found in database",
      });
    }

    const record = cons[0];

    /* -----------------------------------------
       2. Fetch timeline
    ------------------------------------------*/
    const events = await db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.consignmentId, record.id))
      .orderBy(desc(trackingEvents.actionDate), desc(trackingEvents.actionTime));

    const timeline = events.map((e) => ({
      action: e.action,
      actionDate:
        typeof e.actionDate === "string"
          ? e.actionDate
          : e.actionDate?.toISOString().slice(0, 10),
      actionTime:
        typeof e.actionTime === "string"
          ? e.actionTime
          : e.actionTime?.toISOString().slice(11, 19),
      origin: e.origin,
      destination: e.destination,
      remarks: e.remarks,
    }));

    /* -----------------------------------------
       3. Response
    ------------------------------------------*/
    return NextResponse.json({
      found: true,
      awb,
      provider: record.providers ?? [],
      consignment: record,
      timeline,
    });
  } catch (err: any) {
    console.error("Master Track Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
