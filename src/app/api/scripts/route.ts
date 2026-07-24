import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");

    const where = published === "true" ? { published: true } : {};

    const scripts = await prisma.script.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scripts);
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
    const { title, description, coverImage, playerCount, duration, difficulty, genre, published } = body;

    const script = await prisma.script.create({
      data: {
        title,
        description,
        coverImage,
        playerCount,
        duration,
        difficulty,
        genre,
        published: published ?? false,
      },
    });

    return NextResponse.json(script, { status: 201 });
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
