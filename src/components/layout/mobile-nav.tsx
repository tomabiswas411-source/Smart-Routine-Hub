"use client";

import { motion } from "framer-motion";
import { Home, CalendarDays, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "master", label: "Routine", icon: CalendarDays, href: "/?view=master-calendar" },
  { id: "student", label: "Student", icon: User, href: "/?view=student" },
  { id: "library", label: "Library", icon: BookOpen, href: "/?view=library" },
];

function MobileBottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  const getActiveId = () => {
    if (view === "master-calendar") return "master";
    if (view === "student") return "student";
    if (view === "library") return "library";
    return "home";
  };

  const activeId = getActiveId();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-lg border-t border-border" />
      
      {/* Navigation items */}
      <div className="relative flex items-center justify-around h-16 pb-safe px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-colors",
                isActive 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeMobileNav"
                  className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={cn(
                "relative z-10 w-5 h-5 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "relative z-10 text-[10px] mt-1 font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
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
