import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireEmployee(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  if (session.user.role === "client") return null;
  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireEmployee(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scripts = await prisma.script.findMany({
      include: { timeSlots: true, _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scripts);
  } catch (error) {
    console.error("GET /api/scripts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireEmployee(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      title: string;
      description?: string;
      category: string;
      difficulty: string;
      minPlayers: number;
      maxPlayers: number;
      duration: number;
      features?: string[];
      imageUrl?: string;
      color?: string;
      isActive?: boolean;
      monthlyRecommended?: boolean;
    };

    const script = await prisma.script.create({
      data: {
        title: body.title,
        description: body.description || "",
        category: body.category,
        difficulty: body.difficulty,
        minPlayers: body.minPlayers,
        maxPlayers: body.maxPlayers,
        duration: body.duration,
        features: body.features || [],
        imageUrl: body.imageUrl || null,
        color: body.color || null,
        isActive: body.isActive ?? true,
        monthlyRecommended: body.monthlyRecommended ?? false,
      },
      include: { timeSlots: true },
    });

    return NextResponse.json(script, { status: 201 });
  } catch (error) {
    console.error("POST /api/scripts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
