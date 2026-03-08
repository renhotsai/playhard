import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const playerCount = searchParams.get("playerCount");

    const where: Record<string, unknown> = { isActive: true };

    if (category && category !== "全部") where.category = category;
    if (difficulty && difficulty !== "全部") where.difficulty = difficulty;
    if (playerCount && playerCount !== "全部") {
      const count = parseInt(playerCount);
      if (!isNaN(count)) {
        where.minPlayers = { lte: count };
        where.maxPlayers = { gte: count };
      }
    }

    const scripts = await prisma.script.findMany({
      where,
      include: { timeSlots: { where: { isActive: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scripts);
  } catch (error) {
    console.error("GET /api/scripts error:", error);
    return NextResponse.json({ error: "Failed to fetch scripts" }, { status: 500 });
  }
}
