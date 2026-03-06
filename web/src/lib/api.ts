import { Script, BookingInfo } from "@/data/scripts";
import { scripts, bookingInfo } from "@/data/scripts";

// Simulate API delay for more realistic behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API functions that simulate server requests
export const scriptsApi = {
  // Get all scripts
  getAll: async (): Promise<Script[]> => {
    await delay(200); // Simulate network delay
    return scripts;
  },

  // Get script by ID
  getById: async (id: number): Promise<Script | null> => {
    await delay(150);
    return scripts.find(script => script.id === id) || null;
  },

  // Get monthly recommended scripts
  getMonthlyRecommended: async (): Promise<Script[]> => {
    await delay(250);
    return scripts.filter(script => script.monthlyRecommended);
  },

  // Get scripts by category
  getByCategory: async (category: string): Promise<Script[]> => {
    await delay(200);
    if (category === "全部") return scripts;
    return scripts.filter(script => script.category.includes(category));
  },

  // Get scripts by difficulty
  getByDifficulty: async (difficulty: string): Promise<Script[]> => {
    await delay(200);
    if (difficulty === "全部") return scripts;
    return scripts.filter(script => script.difficulty === difficulty);
  },

  // Search scripts with filters
  search: async (filters: {
    category?: string;
    difficulty?: string;
    playerCount?: string;
  }): Promise<Script[]> => {
    await delay(300);

    return scripts.filter((script) => {
      const categoryMatch = !filters.category || filters.category === "全部" || script.category.includes(filters.category);
      const difficultyMatch = !filters.difficulty || filters.difficulty === "全部" || script.difficulty === filters.difficulty;

      let playerCountMatch = true;
      if (filters.playerCount && filters.playerCount !== "全部") {
        if (filters.playerCount === "4-6人") {
          playerCountMatch = script.players >= 4 && script.players <= 6;
        } else if (filters.playerCount === "6-8人") {
          playerCountMatch = script.players >= 6 && script.players <= 8;
        } else if (filters.playerCount === "8人以上") {
          playerCountMatch = script.players >= 8;
        }
      }

      return categoryMatch && difficultyMatch && playerCountMatch;
    });
  },

  // Mock create method (for development)
  create: async (scriptData: Omit<Script, 'id'>): Promise<Script> => {
    await delay(300);
    const newScript: Script = {
      id: Date.now(), // Simple ID generation for mock
      ...scriptData,
      color: scriptData.color || '#3B82F6' // Default color for mock data
    };
    console.log('Mock: Creating script:', newScript);
    return newScript;
  },

  // Mock update method (for development)
  update: async (script: Script): Promise<Script> => {
    await delay(300);
    console.log('Mock: Updating script:', script);
    return script;
  },

  // Mock delete method (for development)
  delete: async (id: number): Promise<void> => {
    await delay(200);
    console.log('Mock: Deleting script with id:', id);
  },
};

// Booking API functions
export const bookingApi = {

  // Get booking info (policies, player options, etc.)
  getBookingInfo: async (): Promise<BookingInfo> => {
    await delay(200);
    return bookingInfo;
  },

  // Submit booking (simulate API call)
  submitBooking: async (_bookingData: {
    name: string;
    phone: string;
    email: string;
    date: string;
    time: string;
    script: string;
    players: string;
    notes?: string;
  }): Promise<{ success: boolean; bookingId?: string; message: string }> => {
    await delay(1000); // Simulate processing time

    // Simulate random success/failure for demo
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        success: true,
        bookingId: `BK${Date.now()}`,
        message: "預約申請已成功送出！我們將於2小時內與您聯繫確認詳細資訊。"
      };
    } else {
      return {
        success: false,
        message: "預約送出失敗，請檢查網路連線後重試，或直接撥打客服專線。"
      };
    }
  }
};
