// DB-aligned Script type (matches Prisma schema)
export interface Script {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  minPlayers: number;
  maxPlayers: number;
  duration: number;       // minutes
  features: string[];
  imageUrl: string | null;
  color: string | null;
  isActive: boolean;
  monthlyRecommended: boolean;
  createdAt: string;
  updatedAt: string;
  timeSlots?: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  scriptId: string;
  startTime: string;
  endTime: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingInfo {
  policies: {
    procedures: string[];
    cancellation: string[];
    notes: string[];
  };
}

export const bookingInfo: BookingInfo = {
  policies: {
    procedures: [
      "填寫預約表單並送出申請",
      "客服人員於2小時內與您確認",
      "確認後繳付訂金完成預約",
      "活動當天提前15分鐘報到",
    ],
    cancellation: [
      "活動前7天：全額退款",
      "活動前3-6天：退款50%",
      "活動前1-2天：不予退款",
      "如需改期請提前3天通知",
    ],
    notes: [
      "每場次最少3人、最多10人",
      "請勿攜帶外食進入遊戲區",
      "遊戲過程請保持手機靜音",
      "18歲以下需家長陪同",
    ],
  },
};
