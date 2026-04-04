"use client";

import { motion } from "framer-motion";
import { Home, Calendar, Users, Bell, Menu } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "#home" },
  { id: "schedule", label: "Schedule", icon: Calendar, href: "#schedule" },
  { id: "teachers", label: "Teachers", icon: Users, href: "#teachers" },
  { id: "notices", label: "Notices", icon: Bell, href: "#notices" },
  { id: "menu", label: "Menu", icon: Menu, href: "#menu" },
];

export function MobileBottomNav() {
  const { activeNav, setActiveNav } = useAppStore();

  const handleNavClick = (id: string, href: string) => {
    setActiveNav(id);
    // Scroll to section
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-lg border-t border-border" />
      
      {/* Navigation items */}
      <div className="relative flex items-center justify-around h-16 pb-safe px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id, item.href)}
              className={cn(
                "relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
