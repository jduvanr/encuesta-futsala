import { NextResponse } from "next/server";
import { COOKIE_ADMIN } from "@/lib/auth";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url), 303);
  res.cookies.set(COOKIE_ADMIN, "", { path: "/", maxAge: 0 });
  return res;
}
