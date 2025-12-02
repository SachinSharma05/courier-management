import { db } from "@/lib/db/postgres";
import { consignments, users } from "@/db/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/getServerSession";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session.ok) {
      return Response.json({ ok: false }, { status: 401 });
    }

    const clientId = session.user.id;

    // Load providers of this client
    const [row] = await db
      .select({ providers: users.providers })
      .from(users)
      .where(eq(users.id, clientId))
      .limit(1);

    let providers = row?.providers || [];
    if (typeof providers === "string") providers = JSON.parse(providers);

    // QUERY: All consignments of this client across all allowed providers
    const pgArray = `ARRAY[${providers.map(p => `'${p}'`).join(",")}]`;
    const statsQuery = await db
      .select({
        total: sql<number>`COUNT(*)`,
        delivered: sql<number>`SUM(CASE WHEN LOWER(${consignments.lastStatus}) LIKE '%deliver%' THEN 1 ELSE 0 END)`,
        rto: sql<number>`SUM(CASE WHEN LOWER(${consignments.lastStatus}) LIKE '%rto%' THEN 1 ELSE 0 END)`,
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
          sql`${consignments.providers}::jsonb ?| ${sql.raw(pgArray)}`
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
          sql`${consignments.providers}::jsonb ?| ${sql.raw(pgArray)}`
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
    console.error("Client dashboard error:", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
