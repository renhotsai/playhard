import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireEmployee(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || session.user.role === "client") return null;
  return session;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const session = await requireEmployee(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slotId } = await params;
    const body = await request.json() as Partial<{
      startTime: string;
      endTime: string;
      label: string;
      isActive: boolean;
    }>;

    const timeSlot = await prisma.timeSlot.update({
      where: { id: slotId },
      data: body,
    });

    return NextResponse.json(timeSlot);
  } catch (error) {
    console.error("PATCH time-slot error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const session = await requireEmployee(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slotId } = await params;
    await prisma.timeSlot.delete({ where: { id: slotId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE time-slot error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
