import { db } from "@/lib/db/postgres";
import { consignments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/getServerSession";
import { sql, desc } from "drizzle-orm";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession();
    if (!session.ok) {
      return Response.json({ ok: false }, { status: 401 });
    }

    const provider = params.provider; // dtdc / delhivery / xpressbees
    const clientId = session.user.id;

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
        and(
          eq(consignments.client_id, clientId),
          eq(consignments.providers, provider)
        )
      );

    const stats = statsQuery[0] ?? {
      total: 0,
      delivered: 0,
      pending: 0,
      rto: 0,
    };

    const latest = await db
      .select()
      .from(consignments)
      .where(
        and(
          eq(consignments.client_id, clientId),
          eq(consignments.providers, provider)
        )
      )
      .orderBy(desc(consignments.createdAt))
      .limit(10);

    return Response.json({
      ok: true,
      stats,
      latest,
    });
  } catch (err) {
    console.error("Provider dashboard error:", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
