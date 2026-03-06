export interface VenueHours {
  weekdays: string;
  weekends: string;
  holidays: string;
}

export interface VenueContact {
  address: string;
  phone: string;
  email: string;
  transportation: string;
  googleMapsUrl?: string;
  googleMapsEmbedUrl?: string;
}

export interface VenueFacility {
  name: string;
  description: string;
  icon?: string;
}

export interface Venue {
  id: string;
  name: string;
  status: "active" | "coming_soon" | "temporarily_closed";
  isMainBranch: boolean;
  description?: string;
  hours: VenueHours;
  contact: VenueContact;
  facilities: VenueFacility[];
  images?: string[];
  capacity?: {
    maxPlayers: number;
    rooms: number;
  };
}

// 場館資料
export const venues: Venue[] = [
  {
    id: "daan",
    name: "大安本館",
    status: "active",
    isMainBranch: true,
    description: "玩硬劇本館的旗艦店，提供最完整的劇本殺體驗",
    hours: {
      weekdays: "14:00 - 22:00",
      weekends: "10:00 - 23:00",
      holidays: "10:00 - 23:00"
    },
    contact: {
      address: "台北市大安區建國南路二段151號3樓",
      phone: "02-1234-5678",
      email: "daan@playhard-script.com",
      transportation: "捷運大安站2號出口步行3分鐘",
      googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3615.003551308395!2d121.53167687505893!3d25.02669613774609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442abb6da9c9e1f%3A0x1206bcf082fd10a6!2z5aSn5a6J56uZ!5e0!3m2!1szh-TW!2stw!4v1734567890123"
    },
    facilities: [
      { name: "專業遊戲空間", description: "6間主題遊戲包廂" },
      { name: "音響設備", description: "高品質環繞音響系統" },
      { name: "道具庫", description: "豐富的遊戲道具和服裝" },
      { name: "休息區", description: "舒適的等候和討論空間" },
      { name: "飲水設備", description: "免費飲水機" },
      { name: "洗手間", description: "乾淨舒適的洗手間設施" }
    ],
    capacity: {
      maxPlayers: 48,
      rooms: 6
    }
  }
];

// API 函數
export const venuesApi = {
  // 獲取所有場館
  getAll: async (): Promise<Venue[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return venues;
  },

  // 獲取營業中的場館
  getActive: async (): Promise<Venue[]> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return venues.filter(venue => venue.status === "active");
  },

  // 根據ID獲取場館
  getById: async (id: string): Promise<Venue | null> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return venues.find(venue => venue.id === id) || null;
  },

  // 獲取主館
  getMainBranch: async (): Promise<Venue | null> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return venues.find(venue => venue.isMainBranch) || null;
  }
};