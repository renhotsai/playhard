import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const requestedAdminView = searchParams.get("admin") === "true";

    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    const adminView = requestedAdminView && !!session.isLoggedIn;

    const now = new Date();

    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        sessions: adminView
          ? { orderBy: { date: "asc" } }
          : {
              where: { open: true, date: { gte: now } },
              orderBy: { date: "asc" },
            },
      },
    });

    if (!script) {
      return NextResponse.json({ error: "劇本不存在" }, { status: 404 });
    }

    return NextResponse.json(script);
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const script = await prisma.script.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(script);
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.script.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
