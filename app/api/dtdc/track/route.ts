import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { consignments, trackingEvents, trackingHistory } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// ============================================
// DTDC CONFIG
// ============================================
const TRACK_URL =
  "https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails";

const DTDC_TRACKING_TOKEN = process.env.DTDC_TRACKING_TOKEN!;
const DTDC_CUSTOMER_CODE = process.env.DTDC_CUSTOMER_CODE!;

if (!DTDC_TRACKING_TOKEN) console.error("❌ Missing DTDC_TRACKING_TOKEN");
if (!DTDC_CUSTOMER_CODE) console.error("❌ Missing DTDC_CUSTOMER_CODE");

// ============================================
// PARSERS
// ============================================

function parseDtdcDate(raw: string | null): string | null {
  if (!raw || raw.length !== 8) return null;
  return `${raw.substring(4, 8)}-${raw.substring(2, 4)}-${raw.substring(0, 2)}`;
}

function parseDtdcTime(raw: string | null): string | null {
  if (!raw || raw.length !== 4) return null;
  return `${raw.substring(0, 2)}:${raw.substring(2, 4)}:00`;
}

function parseDtdcDateTime(dateRaw: string | null, timeRaw: string | null): string | null {
  const d = parseDtdcDate(dateRaw);
  const t = parseDtdcTime(timeRaw);
  if (!d) return null;
  return t ? `${d} ${t}` : d;
}

function toJsDate(ts: string | null): Date | null {
  if (!ts) return null;
  const d = new Date(ts.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

function parseDTDC(json: any) {
  const h = json?.trackHeader ?? {};

  return {
    header: {
      shipmentNo: h.strShipmentNo,
      origin: h.strOrigin,
      destination: h.strDestination,
      bookedOn: parseDtdcDate(h.strBookedDate),
      currentStatus: h.strStatus,
      lastUpdatedOn: parseDtdcDateTime(h.strStatusTransOn, h.strStatusTransTime),
    },
    timeline: json?.trackDetails ?? [],
    raw: json,
  };
}

// ============================================
// MAIN API
// ============================================

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { consignments: awbs, clientId, provider } = body;

    if (!Array.isArray(awbs) || awbs.length === 0) {
      return NextResponse.json({ error: "consignments missing" }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: "clientId missing" }, { status: 400 });
    }

    if (!provider) {
      return NextResponse.json({ error: "provider missing" }, { status: 400 });
    }

    const results: any[] = [];

    for (const awb of awbs) {
      try {
        // 1) CALL DTDC
        const res = await fetch(TRACK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Access-Token": DTDC_TRACKING_TOKEN,
          },
          body: JSON.stringify({
            trkType: "cnno",
            strcnno: awb,
            addtnlDtl: "Y",
            customerCode: DTDC_CUSTOMER_CODE,
          }),
        });

        const rawText = await res.text();

        let json;
        try {
          json = JSON.parse(rawText);
        } catch {
          results.push({ awb, error: "Invalid JSON from DTDC", raw: rawText });
          continue;
        }

        if (!res.ok) {
          results.push({ awb, error: json?.message ?? `DTDC returned ${res.status}` });
          continue;
        }

        // 2) PARSE
        const parsed = parseDTDC(json);

        const bookedOnISO = parsed.header.bookedOn;
        const lastUpdatedJS = toJsDate(parsed.header.lastUpdatedOn);

        // 3) PRE-FETCH previous status BEFORE UPDATING
        const prevRow = await db
          .select({ lastStatus: consignments.lastStatus })
          .from(consignments)
          .where(eq(consignments.awb, awb))
          .limit(1);

        const prevStatus = prevRow?.[0]?.lastStatus ?? null;

        // 4) UPSERT CONSIGNMENT with provider + clientId
        const upsert = await db
        .insert(consignments)
        .values({
          awb,
          lastStatus: parsed.header.currentStatus,
          origin: parsed.header.origin,
          destination: parsed.header.destination,
          bookedOn: bookedOnISO,
          lastUpdatedOn: lastUpdatedJS,
          providers: [provider],   // schema expects string[]
          client_id: clientId,     // 🔥 FIXED — MUST MATCH SCHEMA
        })
        .onConflictDoUpdate({
          target: consignments.awb,
          set: {
            lastStatus: parsed.header.currentStatus ?? sql`last_status`,
            origin: parsed.header.origin ?? sql`origin`,
            destination: parsed.header.destination ?? sql`destination`,
            bookedOn: bookedOnISO ?? sql`booked_on`,
            lastUpdatedOn: lastUpdatedJS ?? sql`last_updated_on`,
            updatedAt: sql`NOW()`,
            providers: [provider],  // should overwrite as array
            client_id: clientId,    // 🔥 FIXED
          },
        })
        .returning({ id: consignments.id as any });

        const consignmentId = upsert[0].id;

        // 5) INSERT TIMELINE EVENTS
        for (const t of parsed.timeline) {
          const action = t.strAction ?? "";
          const actionDate = parseDtdcDate(t.strActionDate);
          const actionTime = parseDtdcTime(t.strActionTime);
          const origin = t.strOrigin ?? null;
          const destination = t.strDestination ?? null;
          const remarks = t.sTrRemarks ?? t.strRemarks ?? null;

          const exists = await db
            .select()
            .from(trackingEvents)
            .where(
              and(
                eq(trackingEvents.consignmentId, consignmentId),
                eq(trackingEvents.action, action),
                eq(trackingEvents.actionDate, sql`${actionDate}::date`),
                eq(trackingEvents.actionTime, sql`${actionTime}::time`)
              )
            )
            .limit(1);

          if (exists.length === 0) {
            await db.insert(trackingEvents).values({
              consignmentId,
              action,
              actionDate,
              actionTime,
              origin,
              destination,
              remarks,
            });
          }
        }

        // 6) STATUS HISTORY ONLY IF CHANGED
        const newStatus = parsed.header.currentStatus ?? null;
        if (prevStatus !== newStatus) {
          await db.insert(trackingHistory).values({
            consignmentId,
            oldStatus: prevStatus,
            newStatus,
          });
        }

        results.push({ awb, parsed });
      } catch (err: any) {
        results.push({ awb, error: err.message });
      }
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
