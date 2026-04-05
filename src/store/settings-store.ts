import { create } from "zustand";

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  departmentName: string;
  universityName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  aboutText: string;
  facebookURL: string;
  websiteURL: string;
  twitterURL: string;
  youtubeURL: string;
  instagramURL: string;
  headerLinks: { label: string; href: string }[];
  footerQuickLinks: { label: string; href: string }[];
  footerDescription: string;
  // Developer info for footer
  developerName: string;
  developerURL: string;
}

interface SettingsState {
  settings: SiteSettings;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
}

const defaultSettings: SiteSettings = {
  siteName: "Smart Routine Hub",
  siteTagline: "Academic Schedule Management",
  logoUrl: "",
  departmentName: "Information & Communication Engineering",
  universityName: "Rajshahi University",
  contactEmail: "ice@ru.ac.bd",
  contactPhone: "+880-721-750123",
  address: "ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh",
  aboutText: "The Department of Information and Communication Engineering (ICE) at Rajshahi University is dedicated to excellence in education and research.",
  facebookURL: "https://facebook.com/iceru",
  websiteURL: "https://ice.ru.ac.bd",
  twitterURL: "",
  youtubeURL: "",
  instagramURL: "",
  headerLinks: [
    { label: "Home", href: "/" },
    { label: "Master Routine", href: "/?view=master-calendar" },
    { label: "Student View", href: "/?view=student" },
  ],
  footerQuickLinks: [
    { label: "Home", href: "/" },
    { label: "Master Routine", href: "/?view=master-calendar" },
    { label: "Student View", href: "/?view=student" },
    { label: "Library", href: "/?view=library" },
  ],
  footerDescription: "Your complete academic companion for managing class schedules, routines, and academic activities.",
  developerName: "",
  developerURL: "",
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  loading: true,
  fetchSettings: async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.data) {
        set({
          settings: { ...defaultSettings, ...data.data },
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      set({ loading: false });
    }
  },
  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },
}));
