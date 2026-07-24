import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true });
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    session.destroy();

    return response;
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
