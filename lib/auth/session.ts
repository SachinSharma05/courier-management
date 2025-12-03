import type { SessionOptions } from "iron-session";

export const sessionOptions: SessionOptions = {
  cookieName: "cms_session",
  password: process.env.SESSION_SECRET || "complex_password_here_123456789",

  cookieOptions: {
    secure: process.env.NODE_ENV === "production",  // REQUIRED FOR VERCEL
    sameSite: "lax",
    path: "/",                                      // REQUIRED so all routes receive it
  },
};
