import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/index";

export async function POST(req: Request) {
  const body = await req.json();

  await db.insert(users).values({
    username: body.username,
    email: body.email,
    password_hash: await hashPassword(body.password),
    role: "client",
    company_name: body.company_name,
    providers: body.providers,
  });

  return NextResponse.json({ ok: true });
}
