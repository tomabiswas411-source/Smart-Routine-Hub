"use client";

import { motion } from "framer-motion";
import { Home, CalendarDays, User, BookOpen, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { useSettingsStore } from "@/store/settings-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, CalendarClock, MapPin, RefreshCw } from "lucide-react";

const defaultNavItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "master", label: "Routine", icon: CalendarDays, href: "/?view=master-calendar" },
  { id: "student", label: "Student", icon: User, href: "/?view=student" },
];

// Notification type
interface NotificationItem {
  id: string;
  type: "class_cancelled" | "class_rescheduled" | "room_changed" | "general";
  title: string;
  message: string;
  semester?: number;
  program?: string;
  courseCode?: string;
  timestamp: string;
  isRead: boolean;
}

// Helper functions for notifications
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "class_cancelled":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "class_rescheduled":
      return <CalendarClock className="w-4 h-4 text-amber-500" />;
    case "room_changed":
      return <MapPin className="w-4 h-4 text-blue-500" />;
    default:
      return <Bell className="w-4 h-4 text-emerald-500" />;
  }
};

const formatNotificationTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

function MobileBottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const { settings } = useSettingsStore();
  
  // Notification drawer state
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount((data.data || []).filter((n: NotificationItem) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when drawer opens
  useEffect(() => {
    if (notificationDrawerOpen) {
      const fetchNotifications = async () => {
        setNotificationsLoading(true);
        try {
          const res = await fetch("/api/notifications");
          const data = await res.json();
          if (data.success) {
            setNotifications(data.data || []);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          setNotificationsLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [notificationDrawerOpen]);

  // Use header links from settings, fallback to default
  const navItems = settings.headerLinks?.length > 0 
    ? settings.headerLinks.slice(0, 3).map((link, index) => ({
        id: `mobile-nav-${index}`,
        label: link.label.length > 10 ? link.label.slice(0, 8) + "..." : link.label,
        icon: index === 0 ? Home : index === 1 ? CalendarDays : User,
        href: link.href,
      }))
    : defaultNavItems;

  const getActiveId = () => {
    if (view === "master-calendar") return "mobile-nav-1";
    if (view === "student") return "mobile-nav-2";
    if (view === "notifications" || view === "library") return "notifications";
    return "mobile-nav-0";
  };

  const activeId = getActiveId();

  return (
    <>
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
          
          {/* Notification Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotificationDrawerOpen(true)}
            className={cn(
              "relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200",
              activeId === "notifications" && "scale-105"
            )}
          >
            {activeId === "notifications" && (
              <>
                <motion.div
                  layoutId="activeMobileNavNotif"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 shadow-lg shadow-teal-500/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-black/5" />
              </>
            )}
            <div className="relative z-10">
              <Bell className={cn(
                "w-5 h-5 transition-all duration-200",
                activeId === "notifications" ? "text-white" : "text-muted-foreground"
              )} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className={cn(
              "relative z-10 text-[10px] mt-1 font-medium transition-all duration-200",
              activeId === "notifications" ? "text-white font-semibold" : "text-muted-foreground"
            )}>
              Alerts
            </span>
          </motion.button>
        </div>
      </nav>

      {/* Notification Drawer */}
      <Sheet open={notificationDrawerOpen} onOpenChange={setNotificationDrawerOpen}>
        <SheetContent side="bottom" className="h-[80vh] p-0">
          <SheetHeader className="p-4 border-b bg-gradient-to-r from-teal-500/10 to-emerald-500/10">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/30">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                Notifications
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] px-1.5 py-0.5 shadow-md">
                    {notifications.filter(n => !n.isRead).length} new
                  </Badge>
                )}
              </SheetTitle>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(80vh-80px)]">
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BellOff className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Class changes and updates will appear here
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-4 border-b last:border-b-0",
                    !notification.isRead && "bg-teal-50/50 dark:bg-teal-900/10"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.semester && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[10px] px-2 py-0.5">
                          {notification.semester}{notification.semester === 1 ? 'st' : notification.semester === 2 ? 'nd' : notification.semester === 3 ? 'rd' : 'th'} Semester
                        </Badge>
                        {notification.program && (
                          <Badge variant="outline" className="text-[10px] uppercase px-2 py-0.5">
                            {notification.program}
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatNotificationTime(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavContent />
    </Suspense>
  );
}
