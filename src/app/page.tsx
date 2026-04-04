"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, CalendarDays, User, BookOpen, LogIn, RefreshCw,
  Building, Clock, XCircle, CalendarClock, ChevronLeft, ChevronRight,
  LayoutGrid, Kanban, Filter, Funnel, Users, Download, Bell, BellOff,
  Smartphone, CheckCircle, Wifi, WifiOff, Grid3X3, AlignLeft,
  Calendar, MapPin, Timer, AlignJustify
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
import { usePWA, usePushNotifications } from "@/hooks/use-pwa";

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
  year: number;
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

// Program configuration
const programs = [
  {
    id: "bsc",
    name: "Bachelor of Science",
    shortName: "BSc",
    icon: GraduationCap,
    semesters: 8,
    color: "from-blue-500 to-cyan-500",
    lightColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "msc",
    name: "Master of Science",
    shortName: "MSc",
    icon: GraduationCap,
    semesters: 3,
    color: "from-purple-500 to-violet-500",
    lightColor: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
];

const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
const daysShort = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

// Semester Card Component
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: number * 0.05 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group flex flex-col items-center gap-1.5 p-2 sm:p-4"
    >
      <div className={cn(
        "w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold transition-all duration-300",
        "bg-gradient-to-br shadow-lg",
        program.color,
        "text-white shadow-lg group-hover:shadow-xl"
      )}>
        {number}
      </div>
      <span className="text-xs sm:text-sm font-medium text-foreground text-center">{number}{getOrdinalSuffix(number)} Sem</span>
      <Badge variant="outline" className={cn("text-[10px] sm:text-xs", program.textColor, program.borderColor)}>
        {program.shortName}
      </Badge>
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

// Schedule Card Component (Reusable)
function ScheduleCard({ schedule, compact = false }: { schedule: Schedule; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        schedule.classType === "lab"
          ? "border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20"
          : "border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
      )}
    >
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
  timestamp: string;
  isRead: boolean;
}

// Notification Section Component
function NotificationSection() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
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
  }, []);

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

  const formatTime = (timestamp: string) => {
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification, index) => (
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
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatTime(notification.timestamp)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BellOff className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Class changes and updates will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Home Page Component
function HomePage({ onSelectSemester }: { onSelectSemester: (program: string, semester: number) => void }) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 mb-4 sm:mb-6">
              <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Academic Session 2025</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Smart Routine Hub
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2">
              Select your program and semester to view class schedules
            </p>
            
            {/* Login Button - Visible on Mobile */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
              <Link href="/login" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg">
                  <LogIn className="w-4 h-4" />
                  <span>Teacher/Admin Login</span>
                </Button>
              </Link>
            </div>
            
            {/* PWA Install & Notification */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <PWAInstallButton />
              <NotificationButton />
              <OnlineStatus />
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Notifications Section */}
      <section className="py-4 sm:py-6">
        <div className="container mx-auto px-4">
          <NotificationSection />
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-4 space-y-6 sm:space-y-8">
          {programs.map((program) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-xl sm:rounded-2xl border overflow-hidden",
                program.borderColor,
                program.lightColor
              )}
            >
              {/* Program Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-inherit">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br",
                    program.color
                  )}>
                    <program.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-foreground">{program.name}</h2>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">({program.shortName})</p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span>{program.semesters}</span>
                  <span className="hidden sm:inline text-muted-foreground">Semesters</span>
                  <span className="sm:hidden">Sem</span>
                </Badge>
              </div>

              {/* Semesters Grid */}
              <div className="p-3 sm:p-4 md:p-6">
                <div className={cn(
                  "grid gap-1 sm:gap-2",
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

      {/* Features Section */}
      <section className="py-6 sm:py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: CalendarDays,
                title: "Smart Scheduling",
                description: "Real-time class schedule with instant updates"
              },
              {
                icon: User,
                title: "Teacher Directory",
                description: "Find and connect with faculty members"
              },
              {
                icon: BookOpen,
                title: "Resource Library",
                description: "Access course materials and resources"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 sm:p-6 bg-card rounded-xl border border-border"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Student View Component
function StudentView() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedProgram, setSelectedProgram] = useState<string>("bsc");
  const [viewMode, setViewMode] = useState<"cards" | "list" | "timeline">("cards");

  // Fetch schedules
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/schedules");
        const data = await res.json();
        if (data.success) setSchedules(data.data || []);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter schedules based on selection
  const filteredSchedules = schedules.filter((s) => {
    if (!s.isActive) return false;
    if (s.year !== selectedYear) return false;
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

  const getYearFromSemester = (sem: number): number => Math.ceil(sem / 2);
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
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
                  onValueChange={(v) => {
                    const sem = parseInt(v);
                    setSelectedSemester(sem);
                    setSelectedYear(getYearFromSemester(sem));
                  }}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: getCurrentProgram().semesters }, (_, i) => i + 1).map((sem) => (
                      <SelectItem key={sem} value={sem.toString()} className="text-sm">
                        {sem}{getOrdinalSuffix(sem)} Sem
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Year</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((y) => (
                      <SelectItem key={y} value={y.toString()} className="text-sm">
                        {y}{getOrdinalSuffix(y)} Year
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
                { label: "Year", value: `${selectedYear}${getOrdinalSuffix(selectedYear)}`, icon: GraduationCap, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
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
                  {getCurrentProgram().shortName} - {selectedYear}{getOrdinalSuffix(selectedYear)} Year, {selectedSemester}{getOrdinalSuffix(selectedSemester)} Semester
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
                                <ScheduleCard key={schedule.id} schedule={schedule} />
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
                                    
                                    <ScheduleCard schedule={schedule} />
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
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"grid" | "cards" | "list">("cards");
  
  // Filters
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<string>("all");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [schedulesRes, teachersRes, roomsRes] = await Promise.all([
          fetch("/api/schedules"),
          fetch("/api/teachers"),
          fetch("/api/rooms"),
        ]);

        const [schedulesData, teachersData, roomsData] = await Promise.all([
          schedulesRes.json(),
          teachersRes.json(),
          roomsRes.json(),
        ]);

        if (schedulesData.success) setSchedules(schedulesData.data || []);
        if (teachersData.success) setTeachers(teachersData.data || []);
        if (roomsData.success) setRooms(roomsData.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter schedules
  const filteredSchedules = schedules.filter((s) => {
    if (!s.isActive) return false;
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

  // Show Master Routine Calendar if view=master-calendar
  if (view === "master-calendar") {
    return <MasterRoutineCalendar />;
  }

  // Show Student View
  if (view === "student") {
    return <StudentView />;
  }

  // Default to Home Page
  return <HomePage onSelectSemester={handleSelectSemester} />;
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
