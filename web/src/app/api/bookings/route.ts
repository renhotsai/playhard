import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      scriptId: string;
      timeSlotId: string;
      bookingDate: string;
      playerCount: string;
      name: string;
      phone: string;
      email?: string;
      notes?: string;
    };

    const { scriptId, timeSlotId, bookingDate, playerCount, name, phone, email, notes } = body;

    if (!scriptId || !timeSlotId || !bookingDate || !playerCount || !name || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [script, timeSlot] = await Promise.all([
      prisma.script.findUnique({ where: { id: scriptId } }),
      prisma.timeSlot.findUnique({ where: { id: timeSlotId } }),
    ]);

    if (!script || !timeSlot) {
      return NextResponse.json({ error: "Script or time slot not found" }, { status: 404 });
    }

    const bookingRef = `BK${Date.now()}`;

    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        scriptId,
        timeSlotId,
        userId: session.user.id,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || null,
        bookingDate: new Date(bookingDate),
        playerCount: parseInt(playerCount),
        notes: notes || null,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.bookingRef,
      message: "預約申請已送出，我們將盡快與您聯繫確認！",
    });
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
