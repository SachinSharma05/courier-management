// lib/dtdc/sync.ts
import { db } from "@/lib/db/postgres";
import { clientCredentials, consignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildAuthFromRows, fetchDTDCShipments } from "@/lib/dtdc/client";

/**
 * Map DTDC shipment object to your consignments table fields.
 * Adapt keys according to your DB schema and DTDC object.
 */
function mapDTDCToConsignment(clientId: number, s: any) {
  return {
    client_id: clientId,
    awb: s.airwayBillNo || s.awb || s.awbNumber,
    origin: s.origin || s.pickupCity || null,
    destination: s.destination || s.deliveryCity || null,
    lastStatus: s.currentStatus || s.status || null,
    raw: JSON.stringify(s),
    createdAt: s.bookingDate ? new Date(s.bookingDate) : new Date(),
    updatedAt: new Date(),
    // add other fields your consignments table expects (weight, pieces, service etc.)
  };
}

/**
 * Upsert single consignment by AWB.
 * If your DB supports onConflict/upsert in drizzle you can replace with single statement.
 */
async function upsertConsignmentRow(row: Record<string, any>) {
  const existing = await db
    .select()
    .from(consignments)
    .where(eq(consignments.awb, row.awb))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(consignments).values(row);
  } else {
    // update relevant fields
    await db
      .update(consignments)
      .set({
        lastStatus: row.lastStatus,
        origin: row.origin,
        destination: row.destination,
        raw: row.raw,
        updatedAt: row.updatedAt,
      })
      .where(eq(consignments.awb, row.awb));
  }
}

/**
 * Sync all shipments for a client (full scan via pagination).
 */
export async function syncClientShipments(clientId: number) {
  // 1) get all credential rows for this client and DTDC provider(s)
  const rows = await db
    .select()
    .from(clientCredentials)
    .where(eq(clientCredentials.client_id, clientId));

  if (!rows || rows.length === 0) {
    throw new Error("No credentials found for client");
  }

  const auth = buildAuthFromRows(rows);

  // 2) paginate through DTDC shipments
  let pageToken: string | null = null;
  let total = 0;

  do {
    const { data, nextPageToken } = await fetchDTDCShipments(auth, pageToken);
    if (!Array.isArray(data)) break;

    for (const s of data) {
      const mapped = mapDTDCToConsignment(clientId, s);

      // skip invalid awb
      if (!mapped.awb) continue;

      await upsertConsignmentRow(mapped);
      total++;
    }

    pageToken = nextPageToken ?? null;
  } while (pageToken);

  return { ok: true, totalSynced: total };
}
