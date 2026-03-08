import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const timeSlots = await prisma.timeSlot.findMany({
      where: { scriptId: id, isActive: true },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error("GET /api/scripts/[id]/time-slots error:", error);
    return NextResponse.json({ error: "Failed to fetch time slots" }, { status: 500 });
  }
}
