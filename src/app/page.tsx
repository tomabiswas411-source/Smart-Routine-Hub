"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, CalendarDays, User, BookOpen, LogIn, RefreshCw,
  Building, Clock, XCircle, CalendarClock, ChevronLeft, ChevronRight,
  LayoutGrid, Kanban, Filter, Funnel, Users, Download, Bell, BellOff,
  Smartphone, CheckCircle, Wifi, WifiOff
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
  program: string; // Changed from section to program (bsc/msc)
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

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
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
      className="group flex flex-col items-center gap-2 p-4"
    >
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300",
        "bg-gradient-to-br shadow-lg",
        program.color,
        "text-white shadow-lg group-hover:shadow-xl"
      )}>
        {number}
      </div>
      <span className="text-sm font-medium text-foreground">{number}{getOrdinalSuffix(number)} Semester</span>
      <Badge variant="outline" className={cn("text-xs", program.textColor, program.borderColor)}>
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
      <Badge className="bg-green-500 text-white gap-1">
        <CheckCircle className="w-3 h-3" />
        App Installed
      </Badge>
    );
  }

  if (!canInstall) return null;

  return (
    <Button
      onClick={handleInstall}
      disabled={installing}
      className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
    >
      {installing ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Install App
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
        "gap-2",
        hasNotificationPermission && isSubscribed && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
      )}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : hasNotificationPermission && isSubscribed ? (
        <>
          <Bell className="w-4 h-4" />
          Notifications On
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          Enable Notifications
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
      "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
      isOnline 
        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
    )}>
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          Offline
        </>
      )}
    </div>
  );
}

// Home Page Component
function HomePage({ onSelectSemester }: { onSelectSemester: (program: string, semester: number) => void }) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full px-4 py-1.5 text-sm text-emerald-700 dark:text-emerald-300 mb-6">
              <CalendarDays className="w-4 h-4" />
              <span>Academic Session 2025</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Smart Routine Hub
            </h1>
            <p className="text-muted-foreground mb-8">
              Select your program and semester to view class schedules, routines, and more
            </p>
            
            {/* PWA Install & Notification */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <PWAInstallButton />
              <NotificationButton />
              <OnlineStatus />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 space-y-8">
          {programs.map((program) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-2xl border overflow-hidden",
                program.borderColor,
                program.lightColor
              )}
            >
              {/* Program Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-inherit">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    program.color
                  )}>
                    <program.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{program.name}</h2>
                    <p className="text-xs text-muted-foreground">({program.shortName})</p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <span>{program.semesters}</span>
                  <span className="text-muted-foreground">Semesters</span>
                </Badge>
              </div>

              {/* Semesters Grid */}
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
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

      {/* PWA Feature Section */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-foreground mb-2">Install as Mobile App</h3>
                  <p className="text-muted-foreground mb-4">
                    Install Smart Routine Hub on your phone for quick access, offline viewing, and instant notifications when class schedules change.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="outline" className="gap-1">
                      <Download className="w-3 h-3" />
                      One-tap install
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Bell className="w-3 h-3" />
                      Push notifications
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <WifiOff className="w-3 h-3" />
                      Works offline
                    </Badge>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <PWAInstallButton />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: CalendarDays,
                title: "Smart Scheduling",
                description: "Real-time class schedule with instant updates and notifications"
              },
              {
                icon: User,
                title: "Teacher Directory",
                description: "Find and connect with faculty members easily"
              },
              {
                icon: BookOpen,
                title: "Resource Library",
                description: "Access course materials and academic resources"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-card rounded-xl border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
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
  const [selectedProgram, setSelectedProgram] = useState<string>("bsc"); // Changed from section to program

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
    // Use program filter (bsc/msc) instead of section
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

  // Calculate year from semester
  const getYearFromSemester = (sem: number): number => {
    return Math.ceil(sem / 2);
  };

  // Get program info
  const getCurrentProgram = () => {
    return programs.find(p => p.id === selectedProgram) || programs[0];
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-6 border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-5 h-5 text-emerald-600" />
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Student View</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                View your weekly class routine
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationButton />
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {/* Selection */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Program</Label>
                <Select
                  value={selectedProgram}
                  onValueChange={(v) => setSelectedProgram(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.shortName} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Semester</Label>
                <Select
                  value={selectedSemester.toString()}
                  onValueChange={(v) => {
                    const sem = parseInt(v);
                    setSelectedSemester(sem);
                    setSelectedYear(getYearFromSemester(sem));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: getCurrentProgram().semesters }, (_, i) => i + 1).map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        {sem}{getOrdinalSuffix(sem)} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Year</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}{getOrdinalSuffix(y)} Year
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routine Display */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Classes", value: filteredSchedules.length, icon: CalendarDays, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
                { label: "Days with Classes", value: Object.values(schedulesByDay).filter((s) => s.length > 0).length, icon: Clock, color: "text-green-500 bg-green-100 dark:bg-green-900/30" },
                { label: "Year", value: `${selectedYear}${getOrdinalSuffix(selectedYear)}`, icon: GraduationCap, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
                { label: "Program", value: getCurrentProgram().shortName, icon: Users, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.color)}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Weekly Routine */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-600" />
                  Weekly Routine
                </CardTitle>
                <CardDescription>
                  {getCurrentProgram().shortName} - {selectedYear}{getOrdinalSuffix(selectedYear)} Year, {selectedSemester}{getOrdinalSuffix(selectedSemester)} Semester
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {days.map((day) => {
                    const daySchedules = schedulesByDay[day] || [];
                    const isCurrentDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === day.toLowerCase();
                    
                    return (
                      <div key={day} className={cn(
                        "p-4 rounded-xl border",
                        isCurrentDay && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                      )}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={cn(
                            "font-semibold capitalize",
                            isCurrentDay && "text-emerald-600 dark:text-emerald-400"
                          )}>
                            {day}
                            {isCurrentDay && (
                              <Badge className="ml-2 bg-emerald-500 text-white">Today</Badge>
                            )}
                          </h3>
                          <Badge variant="outline">{daySchedules.length} classes</Badge>
                        </div>

                        {daySchedules.length > 0 ? (
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {daySchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className={cn(
                                  "p-3 rounded-lg border",
                                  schedule.classType === "lab"
                                    ? "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20"
                                    : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{schedule.courseCode}</p>
                                    <p className="text-xs text-muted-foreground">{schedule.courseName}</p>
                                  </div>
                                  <Badge variant={schedule.classType === "lab" ? "secondary" : "default"} className="text-xs">
                                    {schedule.classType}
                                  </Badge>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{schedule.startTime} - {schedule.endTime}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Building className="w-3 h-3" />
                                  <span>{schedule.roomNumber}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  <span>{schedule.teacherName}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No classes scheduled
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
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
  const [viewMode, setViewMode] = useState<"timeline" | "kanban">("timeline");
  
  // Filters
  const [filterProgram, setFilterProgram] = useState<string>("all"); // Changed from semester to program
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

  // Calculate stats
  const totalClasses = filteredSchedules.length;
  const activeClasses = filteredSchedules.filter(s => {
    const now = new Date();
    const dayName = days[now.getDay()];
    return s.dayOfWeek?.toLowerCase() === dayName;
  }).length;

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

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
      <section className="py-6 border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-5 h-5 text-emerald-600" />
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Master Routine Calendar</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete department schedule overview with real-time updates
              </p>
            </div>

            <div className="flex items-center gap-2">
              <NotificationButton />
              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={viewMode === "timeline" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("timeline")}
                  className="gap-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Timeline
                </Button>
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  className="gap-2"
                >
                  <Kanban className="w-4 h-4" />
                  Kanban
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {/* Smart Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Funnel className="w-4 h-4" />
              Smart Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {/* Program Filter (BSC/MSC) */}
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      {sem}{getOrdinalSuffix(sem)} Semester
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterRoom} onValueChange={setFilterRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDay} onValueChange={setFilterDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Classes", value: totalClasses, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
            { label: "Active Classes", value: activeClasses, icon: Clock, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
            { label: "Canceled", value: 0, icon: XCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
            { label: "Rescheduled", value: 0, icon: CalendarClock, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">This Week</p>
            <p className="text-xs text-muted-foreground">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 4), "MMM d, yyyy")}
            </p>
          </div>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>
            Today
          </Button>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-6 border-b border-border">
                    <div className="p-3 bg-muted/50 font-medium text-sm text-muted-foreground">Time</div>
                    {weekDays.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "p-3 bg-muted/50 font-medium text-sm text-center border-l border-border",
                          isToday(day) && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        <div>{format(day, "EEE")}</div>
                        <div className="text-xs text-muted-foreground">{format(day, "d")}</div>
                      </div>
                    ))}
                  </div>

                  {/* Time Rows */}
                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-6 border-b border-border last:border-b-0">
                      <div className="p-3 text-sm text-muted-foreground bg-muted/30">
                        {time}
                      </div>
                      {days.map((day) => {
                        const slotSchedules = getSchedulesForSlot(day, time);
                        return (
                          <div
                            key={`${day}-${time}`}
                            className="p-2 border-l border-border min-h-[60px]"
                          >
                            {slotSchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className={cn(
                                  "p-2 rounded-lg text-xs mb-1",
                                  "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                                )}
                              >
                                <p className="font-medium truncate">{schedule.courseCode}</p>
                                <p className="opacity-80 truncate">{schedule.roomNumber}</p>
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
      </div>
    </div>
  );
}

// Main Page Component with Routing
function PageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  // Handle semester selection
  const handleSelectSemester = (program: string, semester: number) => {
    setSelectedProgram(program);
    setSelectedSemester(semester);
    // Navigate to master calendar with filters
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

  // Show Library View
  if (view === "library") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Resource Library</h2>
          <p className="text-muted-foreground">Coming Soon</p>
          <Link href="/">
            <Button className="mt-4">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Default: Show Home Page
  return <HomePage onSelectSemester={handleSelectSemester} />;
}

export default function Page() {
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
