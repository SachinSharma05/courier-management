import { db } from "@/lib/db/postgres";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, context: any) {
  const { id } = await context.params; // ✅ FIXED

  const numId = Number(id);

  if (isNaN(numId)) {
    return Response.json(
      { ok: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, numId))
    .limit(1);

  return Response.json({ ok: true, client: rows[0] || null });
}

export async function PUT(req: Request, context: any) {
  const { id } = await context.params; // ✅ FIXED

  const numId = Number(id);
  if (isNaN(numId)) {
    return Response.json(
      { ok: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  const body = await req.json();

  await db
    .update(users)
    .set({
      username: body.username,
      email: body.email,
      company_name: body.company_name,
      company_address: body.company_address,
      contact_person: body.contact_person,
      phone: body.phone,
      providers: body.providers ?? [],
    })
    .where(eq(users.id, numId));

  return Response.json({ ok: true });
}
