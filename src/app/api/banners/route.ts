import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const where = active === "true" ? { active: true } : {};

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(banners);
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
    const { imageUrl, linkUrl, sortOrder } = body;

    const banner = await prisma.banner.create({
      data: {
        imageUrl,
        linkUrl: linkUrl ?? "",
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
