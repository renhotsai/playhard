import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.json(
        { ok: false, error: "帳號或密碼錯誤" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    session.isLoggedIn = true;
    await session.save();

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
