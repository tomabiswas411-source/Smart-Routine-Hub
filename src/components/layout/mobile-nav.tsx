"use client";

import { motion } from "framer-motion";
import { Home, CalendarDays, User, BookOpen, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSettingsStore } from "@/store/settings-store";

const defaultNavItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "master", label: "Routine", icon: CalendarDays, href: "/?view=master-calendar" },
  { id: "student", label: "Student", icon: User, href: "/?view=student" },
  { id: "alerts", label: "Alerts", icon: Bell, href: "/?view=notifications" },
];

function MobileBottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const { settings } = useSettingsStore();

  // Use header links from settings, fallback to default
  const navItems = settings.headerLinks?.length > 0 
    ? settings.headerLinks.slice(0, 4).map((link, index) => ({
        id: `mobile-nav-${index}`,
        label: link.label.length > 10 ? link.label.slice(0, 8) + "..." : link.label,
        icon: index === 0 ? Home : index === 1 ? CalendarDays : index === 2 ? User : Bell,
        href: link.href,
      }))
    : defaultNavItems;

  const getActiveId = () => {
    if (view === "master-calendar") return "mobile-nav-1";
    if (view === "student") return "mobile-nav-2";
    if (view === "notifications" || view === "library") return "mobile-nav-3";
    return "mobile-nav-0";
  };

  const activeId = getActiveId();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Premium glass background */}
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" />
      
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
      
      {/* Navigation items */}
      <div className="relative flex items-center justify-around h-16 pb-safe px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200",
                  isActive && "scale-105"
                )}
              >
                {isActive && (
                  <>
                    {/* Active background with gradient */}
                    <motion.div
                      layoutId="activeMobileNav"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 shadow-lg shadow-teal-500/30"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-black/5" />
                  </>
                )}
                
                <Icon className={cn(
                  "relative z-10 w-5 h-5 transition-all duration-200",
                  isActive ? "text-white" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "relative z-10 text-[10px] mt-1 font-medium transition-all duration-200",
                  isActive ? "text-white font-semibold" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavContent />
    </Suspense>
  );
}
