import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get("scriptId");
    const open = searchParams.get("open");

    const where: Record<string, unknown> = {};
    if (scriptId) where.scriptId = scriptId;
    if (open === "true") where.open = true;

    const sessions = await prisma.session.findMany({
      where,
      include: { script: { select: { title: true } } },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await request.json();
    const { scriptId, date, maxPlayers } = body;

    const sessionDate = new Date(date);
    if (sessionDate <= new Date()) {
      return NextResponse.json(
        { error: "場次日期必須是未來的時間" },
        { status: 400 }
      );
    }

    const gameSession = await prisma.session.create({
      data: {
        scriptId,
        date: sessionDate,
        maxPlayers: Number(maxPlayers),
      },
      include: { script: { select: { title: true } } },
    });

    return NextResponse.json(gameSession, { status: 201 });
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
