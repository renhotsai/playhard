import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

class ReservationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user.role !== "owner" && session.user.role !== "employee")) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    const where: Record<string, unknown> = {};
    if (sessionId) where.sessionId = sessionId;

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        session: {
          include: { script: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reservations);
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, name, phone, email, playerCount, note } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "請填寫姓名" }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "請填寫電話" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "請填寫電子信箱" }, { status: 400 });
    }
    if (!playerCount || Number(playerCount) < 1) {
      return NextResponse.json({ error: "報名人數至少為1人" }, { status: 400 });
    }

    const count = Number(playerCount);

    // Submitting a reservation stays optional/anonymous -- no login
    // required. When a customer IS logged in, associate the reservation
    // with their Better Auth user id.
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user.id ?? null;

    // Check session exists, is open, and has capacity, then create the
    // reservation and increment currentPlayers -- all inside a single
    // transaction so concurrent requests cannot both pass the capacity
    // check before either write lands (TOCTOU race).
    const reservation = await prisma.$transaction(async (tx) => {
      const gameSession = await tx.session.findUnique({
        where: { id: sessionId },
      });

      if (!gameSession) {
        throw new ReservationError("場次不存在", 404);
      }

      if (!gameSession.open) {
        throw new ReservationError("此場次已關閉，無法預約", 400);
      }

      if (gameSession.currentPlayers + count > gameSession.maxPlayers) {
        throw new ReservationError("此場次名額已滿", 400);
      }

      const newReservation = await tx.reservation.create({
        data: {
          sessionId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          playerCount: count,
          note: note?.trim() ?? "",
          userId,
        },
      });

      await tx.session.update({
        where: { id: sessionId },
        data: { currentPlayers: { increment: count } },
      });

      return newReservation;
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (err) {
    if (err instanceof ReservationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
