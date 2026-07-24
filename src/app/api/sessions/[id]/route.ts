import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    if (body.date) {
      body.date = new Date(body.date);
    }

    const gameSession = await prisma.session.update({
      where: { id },
      data: body,
      include: { script: { select: { title: true } } },
    });

    return NextResponse.json(gameSession);
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

    await prisma.session.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
