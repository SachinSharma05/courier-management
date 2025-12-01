import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(eq(users.role, "client"));

    return NextResponse.json({ clients: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
