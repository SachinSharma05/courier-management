import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { consignments } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/getServerSession";

export async function GET(
  req: NextRequest,
  context: { params: { provider: string } }
) {
  try {
    const session = await getServerSession();
    if (!session.ok) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const provider = context.params.provider.toLowerCase(); // dtdc / delhivery / xpressbees
    const clientId = session.user.id;

    /* -------------------------
       Provider filter FIXED
    --------------------------*/
    const providerFilter = sql`${consignments.providers}::jsonb ? ${provider}`;

    /* -------- STATS -------- */
    const statsQuery = await db
      .select({
        total: sql<number>`COUNT(*)`,
        delivered: sql<number>`
          SUM(CASE WHEN LOWER(${consignments.lastStatus}) LIKE '%deliver%' THEN 1 ELSE 0 END)
        `,
        rto: sql<number>`
          SUM(CASE WHEN LOWER(${consignments.lastStatus}) LIKE '%rto%' THEN 1 ELSE 0 END)
        `,
        pending: sql<number>`
          SUM(
            CASE WHEN LOWER(${consignments.lastStatus}) NOT LIKE '%deliver%'
               AND LOWER(${consignments.lastStatus}) NOT LIKE '%rto%'
            THEN 1 ELSE 0 END
          )
        `,
      })
      .from(consignments)
      .where(
        and(eq(consignments.client_id, clientId), providerFilter)
      );

    const stats = statsQuery[0] ?? {
      total: 0,
      delivered: 0,
      pending: 0,
      rto: 0,
    };

    /* -------- LATEST -------- */
    const latest = await db
      .select()
      .from(consignments)
      .where(and(eq(consignments.client_id, clientId), providerFilter))
      .orderBy(desc(consignments.createdAt))
      .limit(10);

    return NextResponse.json({
      ok: true,
      stats,
      latest,
    });
  } catch (err: any) {
    console.error("Provider dashboard error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
