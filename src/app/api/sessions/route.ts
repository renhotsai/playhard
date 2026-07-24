import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user.role !== "owner" && session.user.role !== "employee")) {
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
