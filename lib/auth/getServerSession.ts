export const dynamic = "force-dynamic";

import { cookies } from "next/headers";

export async function getServerSession() {
  try {
    // ✔ Your project requires await here
    const cookieStore = await cookies();

    const token = cookieStore.get("cms_session")?.value;

    if (!token) return { ok: false };

    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "";

    const normalized = base.endsWith("/")
      ? base.slice(0, -1)
      : base;

    const url = normalized.startsWith("http")
      ? normalized
      : `https://${normalized}`;

    const res = await fetch(`${url}/api/auth/session`, {
      method: "GET",
      headers: {
        Cookie: `cms_session=${token}`,
      },
      cache: "no-store",
    });

    return await res.json();
  } catch (err) {
    console.error("getServerSession error:", err);
    return { ok: false };
  }
}
