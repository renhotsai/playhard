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

    const banner = await prisma.banner.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(banner);
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

    await prisma.banner.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
