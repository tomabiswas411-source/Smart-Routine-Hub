import { create } from "zustand";

// Schedule filter state - Semester-based system (NO year)
interface ScheduleFilter {
  program: string; // "bsc" or "msc"
  semester: number; // 1-8 for BSc, 1-3 for MSc
  day: string;
}

interface AppState {
  // Schedule filters
  scheduleFilter: ScheduleFilter;
  setScheduleFilter: (filter: Partial<ScheduleFilter>) => void;
  
  // Notice filters
  noticeCategory: string;
  setNoticeCategory: (category: string) => void;
  
  // Mobile menu
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  
  // Active navigation
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

// Get today's day name
const getTodayDay = () => {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
};

export const useAppStore = create<AppState>((set) => ({
  // Schedule filters - defaults (semester-based)
  scheduleFilter: {
    program: "bsc",
    semester: 1,
    day: getTodayDay(),
  },
  setScheduleFilter: (filter) =>
    set((state) => ({
      scheduleFilter: { ...state.scheduleFilter, ...filter },
    })),
  
  // Notice filters
  noticeCategory: "all",
  setNoticeCategory: (category) => set({ noticeCategory: category }),
  
  // Mobile menu
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  
  // Active navigation
  activeNav: "home",
  setActiveNav: (nav) => set({ activeNav: nav }),
}));
