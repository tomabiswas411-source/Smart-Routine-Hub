"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, X, Check, Trash2, ChevronUp, ChevronDown, 
  Calendar, Clock, MapPin, AlertCircle, Info, CheckCircle,
  BellOff, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: "general" | "class_cancelled" | "class_rescheduled" | "room_changed" | "extra_class" | "info";
  data?: {
    courseCode?: string;
    courseName?: string;
    teacherName?: string;
    semester?: number;
    year?: number;
    program?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  createdAt: Date | string;
}

interface NotificationCenterProps {
  userId?: string;
  className?: string;
}

const typeConfig = {
  general: { icon: Info, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800" },
  class_cancelled: { icon: X, color: "text-red-500 bg-red-100 dark:bg-red-900/30", border: "border-red-200 dark:border-red-800" },
  class_rescheduled: { icon: RefreshCw, color: "text-orange-500 bg-orange-100 dark:bg-orange-900/30", border: "border-orange-200 dark:border-orange-800" },
  room_changed: { icon: MapPin, color: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30", border: "border-yellow-200 dark:border-yellow-800" },
  extra_class: { icon: Calendar, color: "text-green-500 bg-green-100 dark:bg-green-900/30", border: "border-green-200 dark:border-green-800" },
  info: { icon: CheckCircle, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30", border: "border-purple-200 dark:border-purple-800" },
};

// Helper to safely convert Firestore timestamp to Date
function toDate(timestamp: unknown): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "object" && timestamp !== null) {
    const ts = timestamp as { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number };
    if (ts.seconds || ts._seconds) {
      return new Date((ts.seconds || ts._seconds || 0) * 1000);
    }
  }
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) return date;
  }
  return new Date();
}

export function NotificationCenter({ userId, className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${userId}&limit=30`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true, userId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatTime = (date: Date | string) => {
    const d = toDate(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(d, "MMM d");
  };

  return (
    <>
      {/* Notification Bar - Fixed at bottom */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-4 md:right-auto md:w-96",
          className
        )}
      >
        {/* Expanded Notification Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="rounded-b-none md:rounded-b-xl border-b-0 md:border-b border-t-4 border-t-emerald-500 shadow-xl max-h-[70vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-[10px] px-1.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-7 text-xs gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-7 w-7"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto max-h-[50vh] p-2 space-y-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => {
                      const config = typeConfig[notification.type] || typeConfig.general;
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "p-3 rounded-lg border transition-all",
                            config.border,
                            notification.isRead ? "bg-background/50" : "bg-background"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", config.color)}>
                              <config.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn(
                                  "text-sm font-medium leading-tight",
                                  !notification.isRead && "text-foreground",
                                  notification.isRead && "text-muted-foreground"
                                )}>
                                  {notification.title}
                                </p>
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.body}
                              </p>
                              {notification.data?.courseCode && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <Badge variant="outline" className="text-[10px]">
                                    {notification.data.courseCode}
                                  </Badge>
                                  {notification.data.program && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      {notification.data.program.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-1 mt-2">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-6 text-[10px] gap-1 px-2"
                                  >
                                    <Check className="w-3 h-3" />
                                    Read
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="h-6 text-[10px] gap-1 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <BellOff className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button Bar */}
        <Card 
          className={cn(
            "rounded-t-xl md:rounded-xl shadow-lg border-t-4 border-t-emerald-500 cursor-pointer",
            !isOpen && "rounded-b-xl"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="w-5 h-5 text-emerald-500" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Notification Center</p>
                <p className="text-[10px] text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOpen && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="h-7 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
              )}
              <ChevronUp className={cn("w-5 h-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Spacer for content */}
      <div className="h-20 md:hidden" />
    </>
  );
}

// Notification Badge for headers
export function NotificationBadge({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-muted transition-colors"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
        >
          {count > 9 ? "9+" : count}
        </motion.span>
      )}
    </button>
  );
}
