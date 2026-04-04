"use client";

import { motion } from "framer-motion";
import { Home, Calendar, Users, Bell, CalendarDays, Info, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { useSyncExternalStore, useCallback } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "#home" },
  { id: "schedule", label: "Schedule", icon: Calendar, href: "#schedule" },
  { id: "teachers", label: "Teachers", icon: Users, href: "#teachers" },
  { id: "notices", label: "Notices", icon: Bell, href: "#notices" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, href: "#calendar" },
  { id: "about", label: "About", icon: Info, href: "#about" },
];

// Custom hook to check if component is mounted (avoids hydration mismatch)
function useMounted() {
  return useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false
  );
}

export function DesktopNav() {
  const { theme, setTheme } = useTheme();
  const { activeNav, setActiveNav } = useAppStore();
  const mounted = useMounted();

  const handleNavClick = (id: string, href: string) => {
    setActiveNav(id);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full hidden md:block">
      <div className="bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg hero-gradient flex items-center justify-center">
                <span className="text-white font-bold text-lg">ICE</span>
              </div>
              <div className="hidden lg:block">
                <h1 className="font-semibold text-sm text-foreground">ICE Department</h1>
                <p className="text-xs text-muted-foreground">Rajshahi University</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = activeNav === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id, item.href)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeDesktopNav"
                        className="absolute inset-0 bg-primary/10 rounded-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-lg"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              )}
              
              {/* Login Button */}
              <Link href="/login">
                <Button variant="default" size="sm" className="rounded-lg">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Mobile Header
export function MobileHeader() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <header className="sticky top-0 z-50 w-full md:hidden">
      <div className="bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">ICE</span>
            </div>
            <span className="font-semibold text-sm">ICE-RU</span>
          </div>

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg h-8 w-8"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
