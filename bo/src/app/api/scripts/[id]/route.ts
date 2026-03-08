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
    const script = await prisma.script.findUnique({
      where: { id },
      include: { timeSlots: true, bookings: true },
    });

    if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(script);
  } catch (error) {
    console.error("GET /api/scripts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEmployee(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json() as Partial<{
      title: string;
      description: string;
      category: string;
      difficulty: string;
      minPlayers: number;
      maxPlayers: number;
      duration: number;
      features: string[];
      imageUrl: string;
      color: string;
      isActive: boolean;
      monthlyRecommended: boolean;
    }>;

    const script = await prisma.script.update({
      where: { id },
      data: body,
      include: { timeSlots: true },
    });

    return NextResponse.json(script);
  } catch (error) {
    console.error("PATCH /api/scripts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireEmployee(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.script.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/scripts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
