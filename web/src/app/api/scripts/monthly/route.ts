import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const scripts = await prisma.script.findMany({
      where: { isActive: true, monthlyRecommended: true },
      include: { timeSlots: { where: { isActive: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scripts);
  } catch (error) {
    console.error("GET /api/scripts/monthly error:", error);
    return NextResponse.json({ error: "Failed to fetch monthly scripts" }, { status: 500 });
  }
}
