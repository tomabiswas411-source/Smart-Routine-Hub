"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, CalendarDays, User, BookOpen, LogIn, RefreshCw,
  Building, Clock, XCircle, CalendarClock, ChevronLeft, ChevronRight,
  LayoutGrid, Kanban, Filter, Funnel, Users, Download, Bell, BellOff,
  Smartphone, CheckCircle, Wifi, WifiOff, Grid3X3, AlignLeft,
  Calendar, MapPin, Timer, AlignJustify, Home as HomeIcon, X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePWA, usePushNotifications } from "@/hooks/use-pwa";
import { useRealtimeNotices, useRealtimeSchedules, useRealtimeScheduleChanges, useRealtimeTeachers, useRealtimeRooms, type Notice as RealtimeNotice, type Schedule as RealtimeScheduleType, type ScheduleChange } from "@/hooks/use-realtime-data";

// Types
interface Schedule {
  id: string;
  courseId: string;
  teacherId: string;
  roomId: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  roomNumber: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  semester: number;
  program: string;
  classType: "theory" | "lab";
  isActive: boolean;
}

interface Teacher {
  id: string;
  fullName: string;
  designation: string | null;
}

interface Room {
  id: string;
  roomNumber: string;
  building: string | null;
}

// Program configuration - Premium Color Palette
const programs = [
  {
    id: "bsc",
    name: "Bachelor of Science",
    shortName: "BSc",
    icon: GraduationCap,
    semesters: 8,
    // Primary - Deep Teal
    color: "from-teal-600 to-teal-500",
    lightColor: "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/20",
    textColor: "text-teal-700 dark:text-teal-300",
    borderColor: "border-teal-200 dark:border-teal-800",
    iconBg: "bg-gradient-to-br from-teal-600 to-teal-500",
    badgeBg: "bg-teal-100 dark:bg-teal-900/50",
  },
  {
    id: "msc",
    name: "Master of Science",
    shortName: "MSc",
    icon: GraduationCap,
    semesters: 3,
    // Secondary - Warm Amber
    color: "from-amber-600 to-amber-500",
    lightColor: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20",
    textColor: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-gradient-to-br from-amber-600 to-amber-500",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50",
  },
];

const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
const daysShort = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

// Semester Card Component - Premium Design with Subtle Depth
function SemesterCard({ 
  number, 
  program, 
  onClick 
}: { 
  number: number; 
  program: typeof programs[0];
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: number * 0.04,
        duration: 0.3,
        ease: "easeOut"
      }}
      onClick={onClick}
      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-200 card-depth"
    >
      {/* Icon Container - Clean Design */}
      <div className={cn(
        "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold text-white transition-transform duration-200 group-hover:scale-105",
        program.iconBg
      )}>
        <span className="drop-shadow-sm">{number}</span>
      </div>
      
      {/* Semester Label */}
      <div className="text-center">
        <span className="text-xs sm:text-sm font-medium text-foreground">
          {number}<sup className="text-[7px] sm:text-[8px] ml-0.5">{getOrdinalSuffix(number)}</sup> Sem
        </span>
      </div>
      
      {/* Program Badge */}
      <div className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-medium",
        program.badgeBg,
        program.textColor
      )}>
        {program.shortName}
      </div>
    </motion.button>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}

// PWA Install Button Component
function PWAInstallButton() {
  const { canInstall, installPWA, isInstalled, isStandalone } = usePWA();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    const success = await installPWA();
    setInstalling(false);
  };

  if (isStandalone || isInstalled) {
    return (
      <Badge className="bg-green-500 text-white gap-1 text-xs">
        <CheckCircle className="w-3 h-3" />
        Installed
      </Badge>
    );
  }

  if (!canInstall) return null;

  return (
    <Button
      onClick={handleInstall}
      disabled={installing}
      size="sm"
      className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
    >
      {installing ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </Button>
  );
}

// Notification Button Component
function NotificationButton() {
  const { hasNotificationPermission, requestNotificationPermission } = usePWA();
  const { isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    if (!hasNotificationPermission) {
      await requestNotificationPermission();
    }
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "gap-1 sm:gap-2",
        hasNotificationPermission && isSubscribed && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
      )}
    >
      {loading ? (
        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
      ) : hasNotificationPermission && isSubscribed ? (
        <>
          <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Notifications On</span>
        </>
      ) : (
        <>
          <BellOff className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Enable Notifications</span>
        </>
      )}
    </Button>
  );
}

// Online Status Indicator
function OnlineStatus() {
  const { isOnline } = usePWA();
  
  return (
    <div className={cn(
      "flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full",
      isOnline 
        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
    )}>
      {isOnline ? (
        <>
          <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          Offline
        </>
      )}
    </div>
  );
}

// Schedule Change type for views
interface ScheduleChangeForView {
  id: string;
  scheduleId: string;
  changeType: "cancelled" | "rescheduled" | "room_changed";
  isActive: boolean;
  originalDay?: string;
  originalStartTime?: string;
  originalEndTime?: string;
  originalRoomNumber?: string;
  newDay?: string;
  newStartTime?: string;
  newEndTime?: string;
  newRoomNumber?: string;
  reason?: string;
  createdAt?: any;
}

// Schedule Card Component (Reusable)
function ScheduleCard({ 
  schedule, 
  compact = false,
  scheduleChange,
  showStatus = false
}: { 
  schedule: Schedule; 
  compact?: boolean;
  scheduleChange?: ScheduleChangeForView;
  showStatus?: boolean;
}) {
  // Determine card status
  const isRescheduled = scheduleChange?.changeType === "rescheduled" && scheduleChange?.isActive;
  const wasMoved = isRescheduled && scheduleChange?.newDay && 
                   scheduleChange.newDay.toLowerCase() !== scheduleChange.originalDay?.toLowerCase();

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden relative",
        schedule.classType === "lab"
          ? "border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20"
          : "border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
      )}
    >
      {/* Status Badge for rescheduled classes */}
      {showStatus && wasMoved && (
        <div className="absolute -top-1 -right-1 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md z-10 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
          <CalendarClock className="w-3 h-3" />
          Moved
        </div>
      )}
      
      <div className={cn("p-3", compact && "p-2")}>
        {/* Course Info */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{schedule.courseCode}</p>
            {!compact && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{schedule.courseName}</p>
            )}
          </div>
          <Badge 
            variant={schedule.classType === "lab" ? "secondary" : "default"} 
            className={cn(
              "text-[10px] px-1.5 py-0.5 shrink-0",
              schedule.classType === "lab" 
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" 
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
            )}
          >
            {schedule.classType}
          </Badge>
        </div>
        
        {/* Details */}
        <div className={cn("mt-2 space-y-1", compact && "mt-1.5")}>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{schedule.startTime} - {schedule.endTime}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{schedule.roomNumber}</span>
          </div>
          {!compact && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">{schedule.teacherName}</span>
            </div>
          )}
        </div>
        
        {/* Show original schedule info if moved */}
        {showStatus && wasMoved && scheduleChange && (
          <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-[10px]">
            <p className="text-muted-foreground">
              Moved from <span className="capitalize font-medium text-foreground">{scheduleChange.originalDay}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Notification Data Type
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

// Shared helper functions for notifications
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

// Notification List Component - Reusable
function NotificationList({ 
  notifications, 
  loading,
  compact = false 
}: { 
  notifications: NotificationItem[];
  loading: boolean;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BellOff className="w-8 h-8 text-muted-foreground/50 mb-2" />
        <p className="text-xs sm:text-sm text-muted-foreground">No notifications yet</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          Class changes and updates will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-y-auto", compact ? "max-h-[60vh]" : "max-h-80")}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex items-start gap-3 p-3 sm:p-4 border-b last:border-b-0",
            !notification.isRead && "bg-emerald-50/50 dark:bg-emerald-900/10"
          )}
        >
          <div className="mt-0.5 shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs sm:text-sm text-foreground">
              {notification.title}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
            {/* Semester Highlight */}
            {notification.semester && (
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-2 py-0.5">
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
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
          )}
        </div>
      ))}
    </div>
  );
}

// Notification Section Component (for home page) - Now with Real-time Updates
function NotificationSection() {
  const { notices, loading } = useRealtimeNotices({ limitCount: 20 });
  
  // Transform notices to notification format
  const notifications: NotificationItem[] = notices.map((notice) => {
    let type: "class_cancelled" | "class_rescheduled" | "room_changed" | "general" = "general";
    if (notice.changeType === "cancelled") type = "class_cancelled";
    else if (notice.changeType === "rescheduled") type = "class_rescheduled";
    else if (notice.changeType === "room_changed") type = "room_changed";

    let timestamp = new Date().toISOString();
    if (notice.createdAt) {
      if (typeof notice.createdAt === "string") {
        timestamp = notice.createdAt;
      } else if (typeof notice.createdAt === "object" && notice.createdAt !== null) {
        const ts = notice.createdAt as { seconds?: number; _seconds?: number };
        if (ts.seconds || ts._seconds) {
          timestamp = new Date((ts.seconds || ts._seconds || 0) * 1000).toISOString();
        }
      }
    }

    return {
      id: notice.id,
      type,
      title: notice.title,
      message: notice.content,
      semester: notice.affectedSemester,
      program: notice.affectedProgram,
      courseCode: notice.content?.match(/[A-Z]+-\d+/)?.[0] || undefined,
      timestamp,
      isRead: false,
    };
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          Notifications
          {notifications.filter(n => !n.isRead).length > 0 && (
            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 ml-auto">
              {notifications.filter(n => !n.isRead).length} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <NotificationList notifications={notifications} loading={loading} />
      </CardContent>
    </Card>
  );
}

// Mobile Bottom Navigation Component
function MobileBottomNav({ 
  unreadCount, 
  onNotificationClick,
  currentView,
  onViewChange
}: { 
  unreadCount: number;
  onNotificationClick: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border shadow-lg z-50 sm:hidden">
      <div className="flex items-center justify-around h-16">
        {/* Home Button */}
        <button 
          onClick={() => onViewChange('home')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            currentView === 'home' ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </button>
        
        {/* Master Calendar Button */}
        <button 
          onClick={() => onViewChange('master-calendar')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            currentView === 'master-calendar' ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Master</span>
        </button>
        
        {/* Student View Button */}
        <button 
          onClick={() => onViewChange('student')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            currentView === 'student' ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Student</span>
        </button>
        
        {/* Notification Button */}
        <button 
          onClick={onNotificationClick}
          className="flex flex-col items-center justify-center w-full h-full relative text-muted-foreground"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">Alerts</span>
        </button>
      </div>
    </div>
  );
}

// Notification Drawer Component (for mobile)
function NotificationDrawer({ 
  open, 
  onOpenChange 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      const fetchNotifications = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/notifications");
          const data = await res.json();
          if (data.success) {
            setNotifications(data.data || []);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-emerald-600" />
              Notifications
              {notifications.filter(n => !n.isRead).length > 0 && (
                <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5">
                  {notifications.filter(n => !n.isRead).length} new
                </Badge>
              )}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="overflow-y-auto">
          <NotificationList notifications={notifications} loading={loading} compact />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Home Page Component
function HomePage({ 
  onSelectSemester,
  currentView,
  onViewChange
}: { 
  onSelectSemester: (program: string, semester: number) => void;
  currentView: string;
  onViewChange: (view: string) => void;
}) {
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.success) {
          const notifications = data.data || [];
          setUnreadCount(notifications.filter((n: NotificationItem) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      {/* Hero Section - Clean & Professional */}
      <section className="hero-bg py-10 sm:py-14 md:py-18">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            {/* Session Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 glass border border-primary/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Academic Session 2025
              </span>
            </motion.div>
            
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-primary">Smart Routine Hub</span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              ICE-RU Department Management System — View schedules, notices & more
            </p>
            
            {/* Login Button */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-3 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link href="/login" className="w-full sm:w-auto">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto gap-2 btn-depth bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Teacher/Admin Login</span>
                </Button>
              </Link>
            </motion.div>
            
            {/* PWA & Status */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <PWAInstallButton />
              <NotificationButton />
              <OnlineStatus />
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Notifications Section */}
      <section className="py-4 sm:py-6">
        <div className="container mx-auto px-4">
          <NotificationSection />
        </div>
      </section>

      {/* Programs Section - Clean Cards */}
      <section className="py-6 sm:py-8 md:py-10">
        <div className="container mx-auto px-4 space-y-6">
          {programs.map((program, programIndex) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: programIndex * 0.1, duration: 0.4 }}
              className="program-card card-depth"
            >
              {/* Program Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-card/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-sm",
                    program.iconBg
                  )}>
                    <program.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base sm:text-lg text-foreground">{program.name}</h2>
                    <p className="text-xs text-muted-foreground">{program.semesters} Semesters</p>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  program.badgeBg,
                  program.textColor
                )}>
                  {program.shortName}
                </div>
              </div>

              {/* Semesters Grid */}
              <div className={cn("p-4 sm:p-5", program.lightColor)}>
                <div className={cn(
                  "grid gap-3 sm:gap-4",
                  program.semesters <= 4 ? "grid-cols-4" : "grid-cols-4 sm:grid-cols-8"
                )}>
                  {Array.from({ length: program.semesters }, (_, i) => i + 1).map((sem) => (
                    <SemesterCard
                      key={sem}
                      number={sem}
                      program={program}
                      onClick={() => onSelectSemester(program.id, sem)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section - Clean Cards */}
      <section className="py-6 sm:py-8 md:py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Why <span className="text-gradient-primary">Smart Routine Hub</span>?
            </h2>
            <p className="text-sm text-muted-foreground">Everything you need for academic management</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                icon: CalendarDays,
                title: "Smart Scheduling",
                description: "Real-time class schedule with instant updates and notifications",
                color: "bg-teal-500"
              },
              {
                icon: User,
                title: "Teacher Directory",
                description: "Find and connect with faculty members easily",
                color: "bg-amber-500"
              },
              {
                icon: BookOpen,
                title: "Resource Library",
                description: "Access course materials and resources in one place",
                color: "bg-cyan-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.08, duration: 0.3 }}
                className="feature-card card-depth"
              >
                <div className={cn(
                  "feature-icon w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-white shadow-sm",
                  feature.color
                )}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        unreadCount={unreadCount} 
        onNotificationClick={() => setNotificationDrawerOpen(true)}
        currentView={currentView}
        onViewChange={onViewChange}
      />

      {/* Notification Drawer for Mobile */}
      <NotificationDrawer 
        open={notificationDrawerOpen} 
        onOpenChange={setNotificationDrawerOpen} 
      />
    </div>
  );
}

// Student View Component - Now with Real-time Updates
function StudentView() {
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedProgram, setSelectedProgram] = useState<string>("bsc");
  const [viewMode, setViewMode] = useState<"cards" | "list" | "timeline">("cards");
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // Use real-time hooks instead of fetch
  const { schedules, loading: schedulesLoading } = useRealtimeSchedules();
  const { changes, loading: changesLoading } = useRealtimeScheduleChanges();

  const loading = schedulesLoading || changesLoading;

  // Create a map of scheduleId -> active change (same logic as before)
  const scheduleChanges: Record<string, ScheduleChangeForView> = {};
  changes.forEach((change) => {
    if (change.isActive && change.scheduleId) {
      // Only keep the most recent change per schedule
      if (!scheduleChanges[change.scheduleId] || 
          (change.createdAt && scheduleChanges[change.scheduleId].createdAt &&
           new Date(change.createdAt as Date) > new Date(scheduleChanges[change.scheduleId].createdAt as Date))) {
        scheduleChanges[change.scheduleId] = change as ScheduleChangeForView;
      }
    }
  });

  // Get effective schedule based on schedule changes
  const getEffectiveSchedule = (schedule: Schedule): Schedule => {
    const change = scheduleChanges[schedule.id];
    
    if (change?.changeType === "rescheduled" && change?.isActive) {
      return {
        ...schedule,
        dayOfWeek: change.newDay || schedule.dayOfWeek,
        startTime: change.newStartTime || schedule.startTime,
        endTime: change.newEndTime || schedule.endTime,
        roomNumber: change.newRoomNumber || schedule.roomNumber,
      };
    }
    
    return schedule;
  };

  // Check if a schedule is cancelled
  const isScheduleCancelled = (scheduleId: string): boolean => {
    const change = scheduleChanges[scheduleId];
    return change?.changeType === "cancelled" && change?.isActive;
  };

  // Create effective schedules list
  const effectiveSchedules = schedules.map((s) => getEffectiveSchedule(s));

  // Filter schedules based on selection - now using effective schedules
  const filteredSchedules = effectiveSchedules.filter((s) => {
    if (!s.isActive) return false;
    // Don't show cancelled classes
    if (isScheduleCancelled(s.id)) return false;
    if (s.semester !== selectedSemester) return false;
    if (s.program && s.program !== selectedProgram) return false;
    return true;
  });

  // Group by day
  const schedulesByDay: Record<string, Schedule[]> = {};
  days.forEach((day) => {
    schedulesByDay[day] = filteredSchedules
      .filter((s) => s.dayOfWeek?.toLowerCase() === day.toLowerCase())
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  });

  const getCurrentProgram = () => programs.find(p => p.id === selectedProgram) || programs[0];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-4 sm:py-6 border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Student View</h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                View your weekly class routine
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationButton />
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Selection */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Program</Label>
                <Select value={selectedProgram} onValueChange={(v) => setSelectedProgram(v)}>
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-sm">
                        {p.shortName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Semester</Label>
                <Select
                  value={selectedSemester.toString()}
                  onValueChange={(v) => setSelectedSemester(parseInt(v))}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: getCurrentProgram().semesters }, (_, i) => i + 1).map((sem) => (
                      <SelectItem key={sem} value={sem.toString()} className="text-sm">
                        {sem}{getOrdinalSuffix(sem)} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs sm:text-sm text-muted-foreground">View:</span>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="gap-1.5 h-8"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Cards</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-1.5 h-8"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">List</span>
            </Button>
            <Button
              variant={viewMode === "timeline" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("timeline")}
              className="gap-1.5 h-8"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Timeline</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {[
                { label: "Classes", value: filteredSchedules.length, icon: CalendarDays, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
                { label: "Days", value: Object.values(schedulesByDay).filter((s) => s.length > 0).length, icon: Clock, color: "text-green-500 bg-green-100 dark:bg-green-900/30" },
                { label: "Semester", value: `${selectedSemester}${getOrdinalSuffix(selectedSemester)}`, icon: GraduationCap, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
                { label: "Program", value: getCurrentProgram().shortName, icon: Users, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center", stat.color)}>
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <p className="text-base sm:text-xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Routine Display - Based on View Mode */}
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  Weekly Routine
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {getCurrentProgram().shortName} - {selectedSemester}{getOrdinalSuffix(selectedSemester)} Semester
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Cards View */}
                {viewMode === "cards" && (
                  <div className="space-y-4 sm:space-y-6">
                    {days.map((day) => {
                      const daySchedules = schedulesByDay[day] || [];
                      const isCurrentDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === day.toLowerCase();
                      
                      return (
                        <div key={day} className={cn(
                          "p-3 sm:p-4 rounded-xl border",
                          isCurrentDay && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                        )}>
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h3 className={cn(
                              "font-semibold capitalize text-sm sm:text-base",
                              isCurrentDay && "text-emerald-600 dark:text-emerald-400"
                            )}>
                              {day}
                              {isCurrentDay && (
                                <Badge className="ml-2 bg-emerald-500 text-white text-[10px]">Today</Badge>
                              )}
                            </h3>
                            <Badge variant="outline" className="text-[10px] sm:text-xs">{daySchedules.length} classes</Badge>
                          </div>

                          {daySchedules.length > 0 ? (
                            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                              {daySchedules.map((schedule) => (
                                <ScheduleCard 
                                  key={schedule.id} 
                                  schedule={schedule} 
                                  scheduleChange={scheduleChanges[schedule.id]}
                                  showStatus={true}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                              No classes scheduled
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <div className="space-y-2">
                    {filteredSchedules.length > 0 ? (
                      filteredSchedules
                        .sort((a, b) => {
                          const dayOrder = days.indexOf(a.dayOfWeek?.toLowerCase() || "");
                          const dayOrderB = days.indexOf(b.dayOfWeek?.toLowerCase() || "");
                          if (dayOrder !== dayOrderB) return dayOrder - dayOrderB;
                          return (a.startTime || "").localeCompare(b.startTime || "");
                        })
                        .map((schedule) => (
                          <div
                            key={schedule.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border",
                              schedule.classType === "lab"
                                ? "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10"
                                : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                            )}
                          >
                            {/* Day Badge */}
                            <div className="w-14 sm:w-16 shrink-0">
                              <Badge variant="outline" className="text-[10px] sm:text-xs w-full justify-center capitalize">
                                {schedule.dayOfWeek?.substring(0, 3)}
                              </Badge>
                            </div>
                            
                            {/* Time */}
                            <div className="w-20 sm:w-24 shrink-0">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{schedule.startTime?.substring(0, 5)}</span>
                              </div>
                            </div>
                            
                            {/* Course */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">{schedule.courseCode}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{schedule.roomNumber}</p>
                            </div>
                            
                            {/* Type Badge */}
                            <Badge 
                              variant={schedule.classType === "lab" ? "secondary" : "default"} 
                              className="text-[10px] px-1.5 py-0.5 shrink-0"
                            >
                              {schedule.classType}
                            </Badge>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No classes found
                      </p>
                    )}
                  </div>
                )}

                {/* Timeline View */}
                {viewMode === "timeline" && (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-border" />
                    
                    <div className="space-y-4 sm:space-y-6">
                      {days.map((day, dayIndex) => {
                        const daySchedules = schedulesByDay[day] || [];
                        const isCurrentDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === day.toLowerCase();
                        
                        return (
                          <div key={day} className="relative pl-10 sm:pl-16">
                            {/* Day marker */}
                            <div className={cn(
                              "absolute left-2 sm:left-6 w-4 h-4 rounded-full border-2 border-background",
                              isCurrentDay ? "bg-emerald-500" : "bg-muted"
                            )} />
                            
                            {/* Day header */}
                            <div className="mb-2 sm:mb-3">
                              <h3 className={cn(
                                "font-semibold capitalize text-sm sm:text-base",
                                isCurrentDay && "text-emerald-600 dark:text-emerald-400"
                              )}>
                                {day}
                                {isCurrentDay && (
                                  <Badge className="ml-2 bg-emerald-500 text-white text-[10px]">Today</Badge>
                                )}
                              </h3>
                            </div>
                            
                            {/* Classes */}
                            {daySchedules.length > 0 ? (
                              <div className="space-y-2">
                                {daySchedules.map((schedule) => (
                                  <div key={schedule.id} className="relative">
                                    {/* Time connector */}
                                    <div className="absolute -left-6 sm:-left-8 top-3 w-3 sm:w-4 h-0.5 bg-border" />
                                    
                                    <ScheduleCard 
                                      schedule={schedule} 
                                      scheduleChange={scheduleChanges[schedule.id]}
                                      showStatus={true}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground pl-2">No classes</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Master Routine Calendar Component
function MasterRoutineCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"grid" | "cards" | "list">("cards");
  
  // Filters
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<string>("all");

  // Use real-time hooks instead of fetch
  const { schedules, loading: schedulesLoading } = useRealtimeSchedules();
  const { changes, loading: changesLoading } = useRealtimeScheduleChanges();
  const { teachers, loading: teachersLoading } = useRealtimeTeachers();
  const { rooms, loading: roomsLoading } = useRealtimeRooms();

  const loading = schedulesLoading || changesLoading || teachersLoading || roomsLoading;

  // Create a map of scheduleId -> active change
  const scheduleChanges: Record<string, ScheduleChangeForView> = {};
  changes.forEach((change) => {
    if (change.isActive && change.scheduleId) {
      if (!scheduleChanges[change.scheduleId] || 
          (change.createdAt && scheduleChanges[change.scheduleId].createdAt &&
           new Date(change.createdAt as Date) > new Date(scheduleChanges[change.scheduleId].createdAt as Date))) {
        scheduleChanges[change.scheduleId] = change as ScheduleChangeForView;
      }
    }
  });

  // Get effective schedule based on schedule changes
  const getEffectiveSchedule = (schedule: Schedule): Schedule => {
    const change = scheduleChanges[schedule.id];
    
    if (change?.changeType === "rescheduled" && change?.isActive) {
      return {
        ...schedule,
        dayOfWeek: change.newDay || schedule.dayOfWeek,
        startTime: change.newStartTime || schedule.startTime,
        endTime: change.newEndTime || schedule.endTime,
        roomNumber: change.newRoomNumber || schedule.roomNumber,
      };
    }
    
    return schedule;
  };

  // Check if a schedule is cancelled
  const isScheduleCancelled = (scheduleId: string): boolean => {
    const change = scheduleChanges[scheduleId];
    return change?.changeType === "cancelled" && change?.isActive;
  };

  // Create effective schedules list
  const effectiveSchedules = schedules.map((s) => getEffectiveSchedule(s));

  // Filter schedules - now using effective schedules
  const filteredSchedules = effectiveSchedules.filter((s) => {
    if (!s.isActive) return false;
    // Don't show cancelled classes
    if (isScheduleCancelled(s.id)) return false;
    if (filterProgram !== "all" && s.program !== filterProgram) return false;
    if (filterSemester !== "all" && s.semester !== parseInt(filterSemester)) return false;
    if (filterTeacher !== "all" && s.teacherId !== filterTeacher) return false;
    if (filterRoom !== "all" && s.roomId !== filterRoom) return false;
    if (filterDay !== "all" && s.dayOfWeek?.toLowerCase() !== filterDay.toLowerCase()) return false;
    return true;
  });

  // Group by day
  const schedulesByDay: Record<string, Schedule[]> = {};
  days.forEach((day) => {
    schedulesByDay[day] = filteredSchedules
      .filter((s) => s.dayOfWeek?.toLowerCase() === day.toLowerCase())
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 }); // Week starts on Saturday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const resetFilters = () => {
    setFilterProgram("all");
    setFilterSemester("all");
    setFilterTeacher("all");
    setFilterRoom("all");
    setFilterDay("all");
  };

  // Get schedules for a specific day and time
  const getSchedulesForSlot = (day: string, time: string) => {
    return filteredSchedules.filter((s) => {
      const scheduleDay = s.dayOfWeek?.toLowerCase() || '';
      const matchesDay = scheduleDay === day.toLowerCase();
      const matchesTime = s.startTime?.startsWith(time.split(":")[0]);
      return matchesDay && matchesTime;
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-4 sm:py-6 border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Master Routine</h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Complete department schedule overview
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <NotificationButton />
              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="gap-1 h-8"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Cards</span>
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="gap-1 h-8"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">List</span>
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="gap-1 h-8"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Grid</span>
                </Button>
              </div>
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Smart Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Funnel className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Smart Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.shortName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>{sem}{getOrdinalSuffix(sem)} Sem</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id} className="text-sm">{teacher.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterRoom} onValueChange={setFilterRoom}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>{room.roomNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDay} onValueChange={setFilterDay}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {days.map((day) => (
                    <SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters} className="gap-2 h-9">
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {[
            { label: "Total", value: filteredSchedules.length, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
            { label: "Today", value: schedulesByDay[new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()]?.length || 0, icon: Clock, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
            { label: "Teachers", value: teachers.length, icon: User, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
            { label: "Rooms", value: rooms.length, icon: Building, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Week Navigation (for grid view) */}
        {viewMode === "grid" && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center">
              <p className="font-medium text-sm text-foreground">This Week</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d")}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())} className="h-8 text-xs">
              Today
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Cards View */}
            {viewMode === "cards" && (
              <div className="space-y-4">
                {days.map((day) => {
                  const daySchedules = schedulesByDay[day] || [];
                  const isCurrentDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === day.toLowerCase();
                  
                  return (
                    <Card key={day} className={cn(isCurrentDay && "border-emerald-500")}>
                      <CardHeader className="py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className={cn(
                            "text-sm sm:text-base capitalize",
                            isCurrentDay && "text-emerald-600 dark:text-emerald-400"
                          )}>
                            {day}
                            {isCurrentDay && (
                              <Badge className="ml-2 bg-emerald-500 text-white text-[10px]">Today</Badge>
                            )}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] sm:text-xs">{daySchedules.length} classes</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {daySchedules.length > 0 ? (
                          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {daySchedules.map((schedule) => (
                              <ScheduleCard key={schedule.id} schedule={schedule} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                            No classes scheduled
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {filteredSchedules.length > 0 ? (
                      filteredSchedules
                        .sort((a, b) => {
                          const dayOrder = days.indexOf(a.dayOfWeek?.toLowerCase() || "");
                          const dayOrderB = days.indexOf(b.dayOfWeek?.toLowerCase() || "");
                          if (dayOrder !== dayOrderB) return dayOrder - dayOrderB;
                          return (a.startTime || "").localeCompare(b.startTime || "");
                        })
                        .map((schedule) => (
                          <div
                            key={schedule.id}
                            className={cn(
                              "flex items-center gap-3 p-3 sm:p-4",
                              schedule.classType === "lab"
                                ? "bg-purple-50/50 dark:bg-purple-900/10"
                                : "bg-emerald-50/50 dark:bg-emerald-900/10"
                            )}
                          >
                            <div className="w-12 sm:w-16 shrink-0">
                              <Badge variant="outline" className="text-[10px] sm:text-xs w-full justify-center capitalize">
                                {schedule.dayOfWeek?.substring(0, 3)}
                              </Badge>
                            </div>
                            <div className="w-16 sm:w-20 shrink-0">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{schedule.startTime?.substring(0, 5)}</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">{schedule.courseCode}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{schedule.courseName}</p>
                            </div>
                            <div className="hidden sm:block w-24 shrink-0">
                              <p className="text-xs truncate">{schedule.roomNumber}</p>
                            </div>
                            <Badge 
                              variant={schedule.classType === "lab" ? "secondary" : "default"} 
                              className="text-[10px] px-1.5 py-0.5 shrink-0"
                            >
                              {schedule.classType}
                            </Badge>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No classes found
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grid View (Weekly Calendar) */}
            {viewMode === "grid" && (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="min-w-[640px] sm:min-w-0">
                      {/* Header Row */}
                      <div className="grid grid-cols-8 border-b border-border">
                        <div className="p-2 sm:p-3 bg-muted/50 font-medium text-[10px] sm:text-sm text-muted-foreground">Time</div>
                        {weekDays.map((day) => (
                          <div
                            key={day.toISOString()}
                            className={cn(
                              "p-2 sm:p-3 bg-muted/50 font-medium text-[10px] sm:text-sm text-center border-l border-border",
                              isToday(day) && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            <div className="text-xs sm:text-sm">{format(day, "EEE")}</div>
                            <div className="text-[10px] text-muted-foreground">{format(day, "d")}</div>
                          </div>
                        ))}
                      </div>

                      {/* Time Rows */}
                      {timeSlots.map((time) => (
                        <div key={time} className="grid grid-cols-8 border-b border-border last:border-b-0">
                          <div className="p-2 sm:p-3 text-[10px] sm:text-sm text-muted-foreground bg-muted/30">
                            {time}
                          </div>
                          {days.map((day) => {
                            const slotSchedules = getSchedulesForSlot(day, time);
                            return (
                              <div
                                key={`${day}-${time}`}
                                className="p-1 sm:p-2 border-l border-border min-h-[40px] sm:min-h-[60px]"
                              >
                                {slotSchedules.map((schedule) => (
                                  <div
                                    key={schedule.id}
                                    className={cn(
                                      "p-1.5 sm:p-2 rounded text-[10px] sm:text-xs mb-1",
                                      "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                                    )}
                                  >
                                    <p className="font-medium truncate">{schedule.courseCode}</p>
                                    <p className="opacity-80 truncate text-[9px] sm:text-[10px]">{schedule.roomNumber}</p>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Main Page Component with Routing
function PageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const programParam = searchParams.get("program");
  const semesterParam = searchParams.get("semester");

  // Handle semester selection
  const handleSelectSemester = (program: string, semester: number) => {
    window.location.href = `/?view=master-calendar&program=${program}&semester=${semester}`;
  };

  // Handle view change from mobile nav
  const handleViewChange = (newView: string) => {
    if (newView === 'home') {
      window.location.href = '/';
    } else {
      window.location.href = `/?view=${newView}`;
    }
  };

  // Current view for mobile nav
  const currentView = view || 'home';

  // Show Master Routine Calendar if view=master-calendar
  if (view === "master-calendar") {
    return (
      <>
        <MasterRoutineCalendar />
        <MobileBottomNav 
          unreadCount={0} 
          onNotificationClick={() => {}}
          currentView={currentView}
          onViewChange={handleViewChange}
        />
      </>
    );
  }

  // Show Student View
  if (view === "student") {
    return (
      <>
        <StudentView />
        <MobileBottomNav 
          unreadCount={0} 
          onNotificationClick={() => {}}
          currentView={currentView}
          onViewChange={handleViewChange}
        />
      </>
    );
  }

  // Default to Home Page
  return (
    <HomePage 
      onSelectSemester={handleSelectSemester}
      currentView={currentView}
      onViewChange={handleViewChange}
    />
  );
}

// Main Export
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <PageContent />
    </Suspense>
  );
}
