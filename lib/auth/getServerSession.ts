import { cookies } from "next/headers";

export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("cms_session")?.value; // ✅ FIXED

    if (!sessionToken) {
      return { ok: false };
    }

    // Always call internal API with correct cookie
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/auth/session`, {
      method: "GET",
      headers: {
        Cookie: `cms_session=${sessionToken}`, // ✅ FIXED
      },
      cache: "no-store",
    });

    return await res.json();
  } catch (err) {
    console.error("getServerSession error:", err);
    return { ok: false };
  }
}
