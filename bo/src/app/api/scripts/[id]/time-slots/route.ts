import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireEmployee(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || session.user.role === "client") return null;
  return session;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEmployee(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const timeSlots = await prisma.timeSlot.findMany({
      where: { scriptId: id },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error("GET time-slots error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEmployee(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: scriptId } = await params;
    const body = await request.json() as {
      startTime: string;
      endTime: string;
      label: string;
    };

    const timeSlot = await prisma.timeSlot.create({
      data: {
        scriptId,
        startTime: body.startTime,
        endTime: body.endTime,
        label: body.label,
        isActive: true,
      },
    });

    return NextResponse.json(timeSlot, { status: 201 });
  } catch (error) {
    console.error("POST time-slots error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
