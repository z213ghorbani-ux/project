import { NextRequest, NextResponse } from "next/server";
import { getExpectedSessionValue } from "../../../../lib/session";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (password !== process.env.STAFF_PASSWORD) {
    return NextResponse.json({ error: "رمز عبور اشتباه است" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("staff_session", getExpectedSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
