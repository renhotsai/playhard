import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildScriptUpdateData } from "@/lib/scriptPriceFields";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const requestedAdminView = searchParams.get("admin") === "true";

    const session = await auth.api.getSession({ headers: await headers() });
    const isAdminSession =
      !!session && (session.user.role === "owner" || session.user.role === "employee");
    const adminView = requestedAdminView && isAdminSession;

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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user.role !== "owner" && session.user.role !== "employee")) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const script = await prisma.script.update({
      where: { id },
      data: buildScriptUpdateData(body),
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user.role !== "owner" && session.user.role !== "employee")) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.script.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
