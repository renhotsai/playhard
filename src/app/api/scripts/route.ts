import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user.role !== "owner" && session.user.role !== "employee")) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      storyText,
      coverImage,
      playerCount,
      duration,
      difficulty,
      genre,
      pricePerPerson,
      priceGroup,
      isContactOnly,
      bookingNote,
      published,
    } = body;

    const script = await prisma.script.create({
      data: {
        title,
        description,
        storyText,
        coverImage,
        playerCount,
        duration,
        difficulty,
        genre,
        pricePerPerson: pricePerPerson === "" || pricePerPerson == null ? null : Number(pricePerPerson),
        priceGroup: priceGroup === "" || priceGroup == null ? null : Number(priceGroup),
        isContactOnly: isContactOnly ?? false,
        bookingNote: bookingNote || null,
        published: published ?? false,
      },
    });

    return NextResponse.json(script, { status: 201 });
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
