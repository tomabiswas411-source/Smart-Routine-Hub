"use client";

import { motion } from "framer-motion";
import { Home, CalendarDays, User, BookOpen, LogIn, Moon, Sun, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSyncExternalStore, useCallback } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "master", label: "Master Routine", icon: CalendarDays, href: "/?view=master-calendar" },
  { id: "student", label: "Student View", icon: User, href: "/?view=student" },
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
  const mounted = useMounted();

  return (
    <header className="sticky top-0 z-50 w-full hidden md:block">
      <div className="bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div className="hidden lg:block">
                <h1 className="font-bold text-lg text-foreground">Smart Routine Hub</h1>
                <p className="text-xs text-muted-foreground">Academic Schedule Management</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Library Button */}
              <Button variant="ghost" size="icon" className="rounded-lg" asChild>
                <Link href="/?view=library">
                  <BookOpen className="h-5 w-5" />
                </Link>
              </Button>

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
                <Button variant="outline" size="sm" className="rounded-lg gap-2">
                  <LogIn className="w-4 h-4" />
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
      <div className="bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">Smart Routine Hub</span>
          </Link>

          <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
