import { Script, TimeSlot, BookingInfo, bookingInfo as staticBookingInfo } from "@/data/scripts";

// API functions using real Next.js API routes
export const scriptsApi = {
  getAll: async (): Promise<Script[]> => {
    const res = await fetch("/api/scripts");
    if (!res.ok) throw new Error("Failed to fetch scripts");
    return res.json();
  },

  getById: async (id: string): Promise<Script | null> => {
    const res = await fetch(`/api/scripts/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  getMonthlyRecommended: async (): Promise<Script[]> => {
    const res = await fetch("/api/scripts/monthly");
    if (!res.ok) throw new Error("Failed to fetch monthly scripts");
    return res.json();
  },

  search: async (filters: {
    category?: string;
    difficulty?: string;
    playerCount?: string;
  }): Promise<Script[]> => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.playerCount) params.set("playerCount", filters.playerCount);
    const res = await fetch(`/api/scripts?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to search scripts");
    return res.json();
  },

  getTimeSlots: async (scriptId: string): Promise<TimeSlot[]> => {
    const res = await fetch(`/api/scripts/${scriptId}/time-slots`);
    if (!res.ok) throw new Error("Failed to fetch time slots");
    return res.json();
  },
};

// Booking API
export const bookingApi = {
  getBookingInfo: async (): Promise<BookingInfo> => {
    return staticBookingInfo;
  },

  submitBooking: async (bookingData: {
    scriptId: string;
    timeSlotId: string;
    date: string;
    time: string;
    players: string;
    name: string;
    phone: string;
    email?: string;
    notes?: string;
  }): Promise<{ success: boolean; bookingId?: string; message: string }> => {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scriptId: bookingData.scriptId,
        timeSlotId: bookingData.timeSlotId,
        bookingDate: bookingData.date,
        playerCount: bookingData.players,
        name: bookingData.name,
        phone: bookingData.phone,
        email: bookingData.email,
        notes: bookingData.notes,
      }),
    });
    const data = await res.json() as { success?: boolean; bookingId?: string; message?: string; error?: string };
    if (!res.ok) {
      return { success: false, message: data.error || "預約送出失敗，請稍後重試" };
    }
    return data as { success: boolean; bookingId?: string; message: string };
  },
};
