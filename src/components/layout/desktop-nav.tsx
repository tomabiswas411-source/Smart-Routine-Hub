"use client";

import { motion } from "framer-motion";
import { Home, CalendarDays, User, BookOpen, LogIn, Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSyncExternalStore, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settings-store";

const defaultNavItems = [
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
  const { settings } = useSettingsStore();
  
  // Use header links from settings, fallback to default
  const navItems = settings.headerLinks?.length > 0 
    ? settings.headerLinks.map((link, index) => ({
        id: `nav-${index}`,
        label: link.label,
        icon: index === 0 ? Home : index === 1 ? CalendarDays : User,
        href: link.href,
      }))
    : defaultNavItems;

  return (
    <header className="sticky top-0 z-50 w-full hidden md:block">
      {/* Premium glass header */}
      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
        {/* Gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
        
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div 
                className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500" />
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5" />
                <CalendarDays className="relative w-5 h-5 text-white" />
                <Sparkles className="absolute -top-0.5 -right-0.5 w-3 h-3 text-yellow-300 animate-pulse" />
              </motion.div>
              <div className="hidden lg:block">
                <h1 className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-teal-600 group-hover:to-emerald-600 transition-all duration-300">
                  {settings.siteName || "Smart Routine Hub"}
                </h1>
                <p className="text-xs text-muted-foreground">{settings.siteTagline || "Academic Schedule Management"}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-1 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl">
              {navItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                      "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-gray-700/50"
                    )}
                  >
                    <Icon className="w-4 h-4 text-teal-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Library Button - Only show if URL is configured */}
              {settings.libraryURL && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20"
                    onClick={() => window.open(settings.libraryURL, '_blank')}
                  >
                    <BookOpen className="h-5 w-5 text-teal-500" />
                  </Button>
                </motion.div>
              )}

              {/* Theme Toggle */}
              {mounted && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Moon className="h-5 w-5 text-teal-500" />
                    )}
                  </Button>
                </motion.div>
              )}
              
              {/* Login Button */}
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button className="rounded-xl gap-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-600 hover:via-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 transition-all">
                    <LogIn className="w-4 h-4" />
                    Login
                  </Button>
                </motion.div>
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
  const { settings } = useSettingsStore();

  return (
    <header className="sticky top-0 z-50 w-full md:hidden">
      <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
        {/* Gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
        
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div 
              className="relative w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-teal-500/20 overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5" />
              <CalendarDays className="relative w-4 h-4 text-white" />
            </motion.div>
            <span className="font-bold text-sm bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {settings.siteName || "Smart Routine Hub"}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl h-8 w-8 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-teal-500" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
