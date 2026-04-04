import { create } from "zustand";

// Schedule filter state
interface ScheduleFilter {
  year: number;
  semester: number;
  section: "A" | "B";
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
  // Schedule filters - defaults
  scheduleFilter: {
    year: 1,
    semester: 1,
    section: "A",
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
