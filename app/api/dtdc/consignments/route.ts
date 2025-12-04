import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { consignments } from "@/db/schema";
import {
  eq,
  sql,
  and,
  ilike,
  gte,
  lte,
} from "drizzle-orm";

// ------------ Helpers ------------
function computeTAT(r: any) {
  const rules: Record<string, number> = { D: 3, M: 5, N: 7, I: 10 };
  const prefix = r.awb?.charAt(0)?.toUpperCase();
  if (!r.booked_on) return "On Time";

  const allowed = rules[prefix as string] ?? 5;
  const age = Math.floor((Date.now() - new Date(r.booked_on).getTime()) / 86400000);

  if (age > allowed + 3) return "Very Critical";
  if (age > allowed) return "Critical";
  if (age >= allowed - 1) return "Warning";
  return "On Time";
}

function computeMovement(timeline: any[]) {
  if (!timeline.length) return "On Time";

  const last = timeline[0];
  const ts = new Date(`${last.actionDate}T${last.actionTime ?? "00:00:00"}`).getTime();
  const hours = Math.floor((Date.now() - ts) / 3600_000);

  if (hours >= 72) return "Stuck (72+ hrs)";
  if (hours >= 48) return "Slow (48 hrs)";
  if (hours >= 24) return "Slow (24 hrs)";
  return "On Time";
}

// ------------ GET Handler ------------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "50");
    const offset = (page - 1) * pageSize;

    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const tatFilter = url.searchParams.get("tat") ?? "all";

    const clientIdParam = url.searchParams.get("clientId");
    if (!clientIdParam) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    const clientId = Number(clientIdParam);

    // --------------------------
    // BUILD DRIZZLE WHERE CLAUSE
    // --------------------------
    const where = [eq(consignments.client_id, clientId)];

    if (search) where.push(ilike(consignments.awb, `%${search}%`));

    const s = status.toLowerCase();

    if (s === "delivered") {
      where.push(sql`LOWER(last_status) LIKE '%deliver%'`);
    } else if (s === "rto") {
      where.push(sql`LOWER(last_status) LIKE '%rto%'`);
    } else if (s === "pending-group") {
      where.push(sql`
        LOWER(last_status) NOT LIKE '%deliver%' 
        AND LOWER(last_status) NOT LIKE '%rto%'
      `);
    } else if (s === "in transit") {
      where.push(sql`LOWER(last_status) LIKE '%transit%'`);
    } else if (s === "out for delivery") {
      where.push(sql`LOWER(last_status) LIKE '%out for delivery%'`);
    } else if (s === "attempted") {
      where.push(sql`LOWER(last_status) LIKE '%attempt%'`);
    } else if (s === "held") {
      where.push(sql`LOWER(last_status) LIKE '%held%'`);
    }

    if (from) where.push(gte(consignments.bookedOn, from));
    if (to) where.push(lte(consignments.bookedOn, to));

    const finalWhere = and(...where);

    // --------------------------
    // COUNT QUERY USING DRIZZLE
    // (SAFE, NO RAW SQL ALIAS ISSUE)
    // --------------------------
    const countRes = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(finalWhere);

    const totalCount = countRes[0].count;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    // --------------------------
    // MAIN RAW SQL QUERY
    // with alias `c`
    // and explicit WHERE condition inserted manually
    // --------------------------
    const rows = await db.execute(sql`
      SELECT
        c.id,
        c.awb,
        c.origin,
        c.destination,
        c.last_status,
        c.booked_on,
        c.last_updated_on,

        COALESCE((
          SELECT json_agg(t ORDER BY t."actionDate" DESC, t."actionTime" DESC)
          FROM (
            SELECT
              e.action,
              e.action_date AS "actionDate",
              e.action_time AS "actionTime",
              e.origin,
              e.destination,
              e.remarks
            FROM tracking_events e
            WHERE e.consignment_id = c.id
          ) t
        ), '[]') AS timeline

      FROM consignments c
      WHERE c.client_id = ${clientId}   -- FIXED alias
      ORDER BY c.last_updated_on DESC, c.awb ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    // --------------------------
    // FINAL RESPONSE BUILD
    // --------------------------
    const items = rows.rows
      .map((r: any) => {
        const tat = computeTAT(r);
        const movement = computeMovement(r.timeline ?? []);

        if (tatFilter !== "all" && !tat.toLowerCase().includes(tatFilter))
          return null;

        return {
          awb: r.awb,
          last_status: r.last_status,
          origin: r.origin,
          destination: r.destination,
          booked_on: r.booked_on,
          last_updated_on: r.last_updated_on,
          timeline: r.timeline,
          tat,
          movement,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      items,
      totalPages,
      totalCount,
      page,
      pageSize,
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}