// lib/auth/session.ts
import type { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";

declare module "iron-session" {
  interface IronSessionData {
    user?: {
      id: number;
      username: string;
      role: string;
    };
  }
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD || process.env.NEXTAUTH_SECRET || "change_this_in_production_32chars_min",
  cookieName: "cms_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export { getIronSession };
