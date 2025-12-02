import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { consignments, trackingEvents } from "@/db/schema";
import { eq, sql, inArray, and, ilike, gte, lte, desc, asc } from "drizzle-orm";

type TrackingEvent = {
  consignmentId: string;
  action: string;
  actionDate: string | Date | null;
  actionTime: string | Date | null;
  origin: string | null;
  destination: string | null;
  remarks: string | null;
};

// ------------------------------
// Helper: TAT Computation
// ------------------------------
function computeTAT(awb: string | undefined, bookedOn: string | null) {
  const rules: Record<string, number> = { D: 3, M: 5, N: 7, I: 10 };
  if (!bookedOn) return "On Time";

  const prefix = (awb?.charAt?.(0) ?? "").toUpperCase();
  const allowed = rules[prefix] ?? 5;

  const age = Math.floor((Date.now() - new Date(bookedOn).getTime()) / 86400000);

  if (age > allowed + 3) return "Very Critical";
  if (age > allowed) return "Critical";
  if (age >= allowed - 1) return "Warning";

  return "On Time";
}

// ------------------------------
// Helper: Movement Computation
// ------------------------------
function computeMovement(timeline: any[]) {
  if (!timeline?.length) return "On Time";

  const last = timeline[0];
  const ts = new Date(`${last.actionDate}T${last.actionTime ?? "00:00:00"}`).getTime();
  const hours = Math.floor((Date.now() - ts) / (3600 * 1000));

  if (hours >= 72) return "Stuck (72+ hrs)";
  if (hours >= 48) return "Slow (48 hrs)";
  if (hours >= 24) return "Slow (24 hrs)";
  return "On Time";
}

// ------------------------------
// GET Handler
// ------------------------------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "50");

    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const clientId = url.searchParams.get("clientId") ?? "";
    const provider = url.searchParams.get("provider") ?? "";
    const tatFilter = url.searchParams.get("tat") ?? "all";

    // --------------------
    // WHERE CLAUSE
    // --------------------
    const where: any[] = [];

    if (search) where.push(ilike(consignments.awb, `%${search}%`));
    if (status === "delivered") {
      where.push(sql`LOWER(last_status) LIKE '%deliver%'`);
    }

    else if (status === "rto") {
      where.push(sql`LOWER(last_status) LIKE '%rto%'`);
    }

    else if (status === "pending-group") {
      where.push(sql`
        LOWER(last_status) NOT LIKE '%deliver%' 
        AND LOWER(last_status) NOT LIKE '%rto%'
      `);
    }

    if (from) where.push(gte(consignments.bookedOn, from));
    if (to) where.push(lte(consignments.bookedOn, to));
    if (clientId) where.push(eq(consignments.client_id, Number(clientId)));
    if (provider) {
      where.push(
        sql`${provider} = ANY (string_to_array(array_to_string(providers, ','), ','))`
      );
    }

    const finalWhere = where.length ? and(...where) : undefined;

    // --------------------
    // COUNT
    // --------------------
    const totalRes = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(finalWhere);

    const totalCount = totalRes[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const offset = (page - 1) * pageSize;

    // --------------------
    // QUERY CONSIGNMENTS
    // --------------------
    const rows = await db
      .select()
      .from(consignments)
      .where(finalWhere)
      .orderBy(desc(consignments.lastUpdatedOn), asc(consignments.awb))
      .limit(pageSize)
      .offset(offset);

    if (!rows.length) {
      return NextResponse.json({
        items: [],
        totalPages,
        totalCount,
        page,
        pageSize,
      });
    }

    // --------------------
    // FETCH TIMELINE
    // --------------------
    const ids = rows.map((r) => r.id); // UUID[]

    const events = await db
      .select()
      .from(trackingEvents)
      .where(inArray(trackingEvents.consignmentId, ids))
      .orderBy(desc(trackingEvents.actionDate), desc(trackingEvents.actionTime));

    // --------------------
    // FIX: USE UUID KEYS (STRING)
    // --------------------
    const eventMap = new Map<string, any[]>();

    for (const ev of events as TrackingEvent[]) {
      const actionDate =
        typeof ev.actionDate === "string"
          ? ev.actionDate
          : ev.actionDate instanceof Date
          ? ev.actionDate.toISOString().slice(0, 10)
          : null;

      const actionTime =
        typeof ev.actionTime === "string"
          ? ev.actionTime
          : ev.actionTime instanceof Date
          ? ev.actionTime.toISOString().slice(11, 19)
          : null;

      const list = eventMap.get(ev.consignmentId) ?? [];

      list.push({
        action: ev.action,
        actionDate,
        actionTime,
        origin: ev.origin,
        destination: ev.destination,
        remarks: ev.remarks,
      });

      eventMap.set(ev.consignmentId, list);
    }

    // --------------------
    // FINAL OUTPUT
    // --------------------
    const items = rows
      .map((r) => {
        const timeline = eventMap.get(r.id) ?? [];
        const tat = computeTAT(r.awb, r.bookedOn);
        const movement = computeMovement(timeline);

        return {
          awb: r.awb,
          last_status: r.lastStatus,
          origin: r.origin,
          destination: r.destination,
          booked_on: r.bookedOn,
          last_updated_on: r.lastUpdatedOn,
          timeline,
          tat,
          movement,
        };
      })
      .filter((r) => tatFilter === "all" || r.tat.toLowerCase().includes(tatFilter));

    return NextResponse.json({
      items,
      totalPages,
      totalCount,
      page,
      pageSize,
    });
  } catch (err: any) {
    console.error("ERROR /api/dtdc/consignments:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
