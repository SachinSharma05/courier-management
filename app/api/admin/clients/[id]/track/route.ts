import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { clientCredentials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/crypto/encryption";

export async function POST(req: Request, context: any) {
  try {
    const id = Number((await context.params).id);
    const body = await req.json();

    const awbs: string[] = body.awbs || [];

    if (!Array.isArray(awbs) || awbs.length === 0) {
      return NextResponse.json({ ok: false, error: "No AWBs" });
    }

    // Load credentials
    const creds = await db
      .select()
      .from(clientCredentials)
      .where(eq(clientCredentials.client_id, id));

    let token = "";
    for (const c of creds) {
      if (c.env_key === "DTDC_TRACKING_TOKEN") token = decrypt(c.encrypted_value) || "";
    }

    if (!token) {
      return NextResponse.json({ ok: false, error: "No DTDC token" });
    }

    const results: any[] = [];

    // Call DTDC tracking API for each AWB
    for (const awb of awbs) {
      const res = await fetch("https://blktracksvc.datatruck.in/Api/TrackingAPI/ConsignmentTrackDetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Access-Token": token,
        },
        body: JSON.stringify({ AWBNo: awb }),
      });

      const json = await res.json();

      results.push({
        awb,
        status: json?.TrackDetails?.Status || "N/A",
        date: json?.TrackDetails?.ScanDatetime || "N/A",
        origin: json?.TrackDetails?.Origin || "",
        destination: json?.TrackDetails?.Destination || "",
      });
    }

    return NextResponse.json({ ok: true, data: results });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message });
  }
}
