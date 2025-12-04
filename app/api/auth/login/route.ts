import { NextResponse } from "next/server";
import { db } from "@/lib/db/postgres";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { sessionOptions } from "@/lib/auth/session";

type SessionUser = {
  id: number;
  username: string;
  role: string;
};

export async function POST(req: Request) {
  try {
    console.log("LOGIN API HIT");

    const body = await req.json();
    const { username, password } = body;
    
    const found = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (found.length === 0) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    const user = found[0];
    const ok = await verifyPassword(user.password_hash, password);

    if (!ok) {
      console.log("invalid password");
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    const { getIronSession } = await import("iron-session");

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role },
    });

    const session: any = await getIronSession(req, res, sessionOptions);

    // attach user to the session
    session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    await session.save();
    return res;

  } catch (err: any) {
    console.error("Login Error:", err?.message || err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
