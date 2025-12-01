import { db } from "@/lib/db/postgres";
import { getServerSession } from "@/lib/auth/getServerSession";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession();
  if (!session.ok) {
    return Response.json({ ok: false, providers: [] }, { status: 401 });
  }

  const userId = session.user.id;

  const row = await db
    .select({
      providers: users.providers,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row.length) {
    return Response.json({ ok: true, providers: [] });
  }

  let providers = row[0].providers;

  // Ensure it's always a JS array
  if (typeof providers === "string") {
    try {
      providers = JSON.parse(providers);
    } catch {
      providers = [];
    }
  }

  return Response.json({
    ok: true,
    providers: Array.isArray(providers) ? providers : [],
  });
}
