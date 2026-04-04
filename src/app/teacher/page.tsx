"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Users, BookOpen, LogOut, Loader2, 
  Ban, RefreshCw, MapPin, Plus, X, Check, AlertCircle, Bell,
  Building, Edit, ChevronLeft, ChevronDown, 
  AlignJustify, Grid3X3, AlignLeft, BellOff, Trash2, CheckCircle,
  DoorOpen, DoorClosed, Timer, Settings, Sparkles, Sun, Moon,
  MonitorPlay, FlaskConical, Presentation, GraduationCap
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isToday, addWeeks, subWeeks } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Types
interface TeacherSchedule {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  roomNumber: string;
  roomId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  year: number;
  semester: number;
  program: string;
  classType: string;
  isActive: boolean;
}

interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
}

interface Room {
  id: string;
  roomNumber: string;
  building: string;
  type: string;
  capacity: number;
}

interface RoomAvailability {
  room: Room;
  isAvailable: boolean;
  occupiedBy: {
    courseCode: string;
    courseName: string;
    teacherName: string;
    startTime?: string;
    endTime?: string;
  } | null;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date | string;
}

// Days including Friday and Saturday
const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

// Beautiful color palettes for different contexts
const colorPalettes = {
  courses: [
    { bg: "from-rose-400 to-pink-500", text: "text-rose-600", light: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800" },
    { bg: "from-orange-400 to-amber-500", text: "text-orange-600", light: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800" },
    { bg: "from-emerald-400 to-teal-500", text: "text-emerald-600", light: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
    { bg: "from-cyan-400 to-sky-500", text: "text-cyan-600", light: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-200 dark:border-cyan-800" },
    { bg: "from-violet-400 to-purple-500", text: "text-violet-600", light: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800" },
    { bg: "from-fuchsia-400 to-pink-500", text: "text-fuchsia-600", light: "bg-fuchsia-50 dark:bg-fuchsia-900/20", border: "border-fuchsia-200 dark:border-fuchsia-800" },
  ],
  lab: { bg: "from-purple-500 to-violet-600", text: "text-purple-600", light: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800" },
  theory: { bg: "from-emerald-500 to-teal-600", text: "text-emerald-600", light: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
  days: [
    { bg: "bg-gradient-to-r from-rose-500 to-pink-500", accent: "text-rose-500" },
    { bg: "bg-gradient-to-r from-orange-500 to-amber-500", accent: "text-orange-500" },
    { bg: "bg-gradient-to-r from-emerald-500 to-teal-500", accent: "text-emerald-500" },
    { bg: "bg-gradient-to-r from-cyan-500 to-sky-500", accent: "text-cyan-500" },
    { bg: "bg-gradient-to-r from-violet-500 to-purple-500", accent: "text-violet-500" },
    { bg: "bg-gradient-to-r from-fuchsia-500 to-pink-500", accent: "text-fuchsia-500" },
    { bg: "bg-gradient-to-r from-rose-400 to-red-500", accent: "text-rose-400" },
  ]
};

// Room type icons
const roomTypeIcons: Record<string, React.ReactNode> = {
  classroom: <GraduationCap className="w-3.5 h-3.5" />,
  lab: <FlaskConical className="w-3.5 h-3.5" />,
  seminar: <Presentation className="w-3.5 h-3.5" />,
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

// Custom Time Picker Component
function CustomTimePicker({ 
  value, 
  onChange, 
  label 
}: { 
  value: string; 
  onChange: (time: string) => void; 
  label: string;
}) {
  // Derive hour and minute from value prop directly
  const hour = value ? value.split(":")[0] : "09";
  const minute = value ? value.split(":")[1] : "00";

  const handleHourChange = (h: string) => {
    onChange(`${h}:${minute}`);
  };

  const handleMinuteChange = (m: string) => {
    onChange(`${hour}:${m}`);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Select value={hour} onValueChange={handleHourChange}>
          <SelectTrigger className="w-20 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((h) => (
              <SelectItem key={h} value={h} className="text-sm">{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-lg font-bold text-muted-foreground">:</span>
        <Select value={minute} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-20 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")).map((m) => (
              <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Room Availability Checker Component
function RoomAvailabilityChecker({ 
  day, 
  startTime, 
  endTime,
  excludeScheduleId,
  onRoomSelect,
  selectedRoomId 
}: { 
  day: string;
  startTime: string;
  endTime: string;
  excludeScheduleId?: string;
  onRoomSelect: (roomId: string) => void;
  selectedRoomId: string;
}) {
  const [rooms, setRooms] = useState<RoomAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailability = useCallback(async () => {
    if (!day || !startTime || !endTime) return;
    
    setLoading(true);
    try {
      const res = await fetch(
        `/api/rooms/availability?day=${day}&startTime=${startTime}&endTime=${endTime}${excludeScheduleId ? `&excludeScheduleId=${excludeScheduleId}` : ""}`
      );
      const data = await res.json();
      if (data.success) {
        setRooms(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching room availability:", error);
    } finally {
      setLoading(false);
    }
  }, [day, startTime, endTime, excludeScheduleId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium flex items-center gap-2">
          <DoorOpen className="w-3.5 h-3.5" />
          Select Room
        </Label>
        <Button variant="ghost" size="sm" onClick={fetchAvailability} className="h-6 text-[10px]">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
          {rooms.map((item) => {
            const isSelected = selectedRoomId === item.room.id;
            const isAvailable = item.isAvailable;
            
            return (
              <motion.button
                key={item.room.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => isAvailable && onRoomSelect(item.room.id)}
                disabled={!isAvailable}
                className={cn(
                  "p-2.5 rounded-lg border-2 text-left transition-all relative overflow-hidden",
                  isSelected && isAvailable && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
                  isAvailable && !isSelected && "border-border hover:border-emerald-300 bg-background",
                  !isAvailable && "border-red-200 bg-red-50/50 dark:bg-red-900/10 cursor-not-allowed opacity-70"
                )}
              >
                {/* Status indicator */}
                <div className={cn(
                  "absolute top-1 right-1 w-2 h-2 rounded-full",
                  isAvailable ? "bg-emerald-500" : "bg-red-500"
                )} />
                
                <div className="flex items-start gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    isAvailable ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"
                  )}>
                    {roomTypeIcons[item.room.type] || <Building className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{item.room.roomNumber}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.room.building}</p>
                  </div>
                </div>
                
                {!isAvailable && item.occupiedBy && (
                  <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                    <p className="text-[9px] text-red-600 dark:text-red-400 flex items-center gap-1">
                      <DoorClosed className="w-2.5 h-2.5" />
                      {item.occupiedBy.courseCode}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {item.occupiedBy.teacherName}
                    </p>
                  </div>
                )}
                
                {isAvailable && (
                  <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-600">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Available
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
      
      {!loading && rooms.length > 0 && (
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Available
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Occupied
          </span>
        </div>
      )}
    </div>
  );
}

// Notification Center Component
function TeacherNotificationCenter({ userId }: { userId: string }) {
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <span className="font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge className="bg-white text-emerald-600 text-xs">{unreadCount}</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="overflow-y-auto h-[calc(100vh-80px)] p-3 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        notification.isRead ? "bg-muted/30" : "bg-background border-emerald-200 dark:border-emerald-800"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          notification.type === "class_cancelled" ? "bg-red-100 text-red-500" :
                          notification.type === "class_rescheduled" ? "bg-orange-100 text-orange-500" :
                          notification.type === "room_changed" ? "bg-yellow-100 text-yellow-600" :
                          "bg-emerald-100 text-emerald-500"
                        )}>
                          {notification.type === "class_cancelled" ? <Ban className="w-4 h-4" /> :
                           notification.type === "class_rescheduled" ? <RefreshCw className="w-4 h-4" /> :
                           notification.type === "room_changed" ? <MapPin className="w-4 h-4" /> :
                           <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.body}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-muted-foreground">{formatTime(notification.createdAt)}</span>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 text-[10px] px-2"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BellOff className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Main Teacher Dashboard Component
export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "list" | "timeline">("cards");
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Custom time states for dialogs
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customStartTime, setCustomStartTime] = useState("09:00");
  const [customEndTime, setCustomEndTime] = useState("10:00");
  
  // Form states
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleData, setRescheduleData] = useState({
    newDay: "",
    timeSlotId: "",
    reason: ""
  });
  const [newRoomId, setNewRoomId] = useState("");
  const [roomChangeReason, setRoomChangeReason] = useState("");
  
  // Add class form
  const [addClassData, setAddClassData] = useState({
    day: "",
    timeSlotId: "",
    roomId: "",
    courseId: "",
    year: 1,
    semester: 1,
    program: "bsc",
    classType: "theory" as "theory" | "lab",
    reason: ""
  });

  // Courses state
  const [courses, setCourses] = useState<{ id: string; code: string; name: string; type: string }[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role === "admin") {
      router.push("/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTeacherData();
    }
  }, [session]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const [schedulesRes, timeSlotsRes, roomsRes, coursesRes] = await Promise.all([
        fetch(`/api/schedules?teacherId=${session?.user?.id}`),
        fetch("/api/timeslots"),
        fetch("/api/rooms"),
        fetch("/api/courses"),
      ]);
      
      const schedulesData = await schedulesRes.json();
      const timeSlotsData = await timeSlotsRes.json();
      const roomsData = await roomsRes.json();
      const coursesData = await coursesRes.json();
      
      if (schedulesData.success) setSchedules(schedulesData.data || []);
      if (timeSlotsData.success) setTimeSlots(timeSlotsData.data || []);
      if (roomsData.success) setRooms(roomsData.data || []);
      if (coursesData.success) setCourses(coursesData.data || []);
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get schedules grouped by day
  const schedulesByDay: Record<string, TeacherSchedule[]> = {};
  days.forEach((day) => {
    schedulesByDay[day] = schedules
      .filter((s) => s.dayOfWeek?.toLowerCase() === day.toLowerCase() && s.isActive)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  });

  // Get schedules for next 7 days from today
  const getNext7Days = () => {
    const today = new Date();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const result = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayName = dayNames[date.getDay()];
      result.push({
        date,
        dayName,
        schedules: schedulesByDay[dayName] || []
      });
    }
    
    return result;
  };

  const next7Days = getNext7Days();

  // Format time
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Create notification for students
  const createStudentNotifications = async (changeType: string, schedule: TeacherSchedule, details: Record<string, unknown>) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: `program_${schedule.program}_year_${schedule.year}_sem_${schedule.semester}`,
          title: changeType === "cancelled" ? "❌ Class Cancelled" :
                 changeType === "rescheduled" ? "🔄 Class Rescheduled" :
                 changeType === "room_changed" ? "📍 Room Changed" :
                 "📢 Extra Class Added",
          body: `${schedule.courseCode} (${schedule.courseName})\n${details.message || ""}`,
          type: `class_${changeType}`,
          data: {
            courseCode: schedule.courseCode,
            courseName: schedule.courseName,
            semester: schedule.semester,
            year: schedule.year,
            program: schedule.program,
            teacherName: session?.user?.name,
            ...details
          }
        })
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  // Handle Cancel Class
  const handleCancelClass = async () => {
    if (!selectedSchedule || !cancelReason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for cancellation", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/schedule-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: selectedSchedule.id,
          changeType: "cancelled",
          originalDay: selectedSchedule.dayOfWeek,
          originalStartTime: selectedSchedule.startTime,
          originalEndTime: selectedSchedule.endTime,
          originalRoomId: selectedSchedule.roomId,
          originalRoomNumber: selectedSchedule.roomNumber,
          effectiveDate: new Date().toISOString().split("T")[0],
          reason: cancelReason,
          courseName: selectedSchedule.courseName,
          courseCode: selectedSchedule.courseCode,
          teacherId: session?.user?.id,
          teacherName: session?.user?.name,
          year: selectedSchedule.year,
          semester: selectedSchedule.semester,
          program: selectedSchedule.program,
          changedBy: session?.user?.id,
          changedByName: session?.user?.name,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await createStudentNotifications("cancelled", selectedSchedule, {
          message: `Cancelled: ${selectedSchedule.dayOfWeek} at ${formatTime(selectedSchedule.startTime)}\nReason: ${cancelReason}`
        });
        
        toast({ title: "Class Cancelled", description: `${selectedSchedule.courseCode} has been cancelled. Students will be notified.` });
        setShowCancelDialog(false);
        setCancelReason("");
        setSelectedSchedule(null);
        fetchTeacherData();
      }
    } catch (error) {
      console.error("Error cancelling class:", error);
      toast({ title: "Error", description: "Failed to cancel class", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Room Change
  const handleRoomChange = async () => {
    if (!selectedSchedule || !newRoomId || !roomChangeReason) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const newRoom = rooms.find(r => r.id === newRoomId);
    if (!newRoom) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/schedule-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: selectedSchedule.id,
          changeType: "room_changed",
          originalRoomId: selectedSchedule.roomId,
          originalRoomNumber: selectedSchedule.roomNumber,
          newRoomId: newRoomId,
          newRoomNumber: newRoom.roomNumber,
          effectiveDate: new Date().toISOString().split("T")[0],
          reason: roomChangeReason,
          courseName: selectedSchedule.courseName,
          courseCode: selectedSchedule.courseCode,
          teacherId: session?.user?.id,
          teacherName: session?.user?.name,
          year: selectedSchedule.year,
          semester: selectedSchedule.semester,
          program: selectedSchedule.program,
          changedBy: session?.user?.id,
          changedByName: session?.user?.name,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await createStudentNotifications("room_changed", selectedSchedule, {
          message: `Room changed from ${selectedSchedule.roomNumber} to ${newRoom.roomNumber}\nReason: ${roomChangeReason}`
        });
        
        toast({ title: "Room Changed", description: `${selectedSchedule.courseCode} moved to ${newRoom.roomNumber}` });
        setShowRoomDialog(false);
        setNewRoomId("");
        setRoomChangeReason("");
        setSelectedSchedule(null);
        fetchTeacherData();
      }
    } catch (error) {
      console.error("Error changing room:", error);
      toast({ title: "Error", description: "Failed to change room", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reschedule Class
  const handleRescheduleClass = async () => {
    if (!selectedSchedule || !rescheduleData.newDay || !rescheduleData.reason) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    // Get time from either time slot or custom time
    let startTime = customStartTime;
    let endTime = customEndTime;
    
    if (!useCustomTime && rescheduleData.timeSlotId) {
      const timeSlot = timeSlots.find(t => t.id === rescheduleData.timeSlotId);
      if (timeSlot) {
        startTime = timeSlot.startTime;
        endTime = timeSlot.endTime;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/schedule-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: selectedSchedule.id,
          changeType: "rescheduled",
          originalDay: selectedSchedule.dayOfWeek,
          originalStartTime: selectedSchedule.startTime,
          originalEndTime: selectedSchedule.endTime,
          newDay: rescheduleData.newDay,
          newStartTime: startTime,
          newEndTime: endTime,
          effectiveDate: new Date().toISOString().split("T")[0],
          reason: rescheduleData.reason,
          courseName: selectedSchedule.courseName,
          courseCode: selectedSchedule.courseCode,
          teacherId: session?.user?.id,
          teacherName: session?.user?.name,
          year: selectedSchedule.year,
          semester: selectedSchedule.semester,
          program: selectedSchedule.program,
          changedBy: session?.user?.id,
          changedByName: session?.user?.name,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await createStudentNotifications("rescheduled", selectedSchedule, {
          message: `Moved from ${selectedSchedule.dayOfWeek} to ${rescheduleData.newDay} at ${formatTime(startTime)}\nReason: ${rescheduleData.reason}`
        });
        
        toast({ title: "Class Rescheduled", description: `${selectedSchedule.courseCode} has been rescheduled` });
        setShowRescheduleDialog(false);
        setRescheduleData({ newDay: "", timeSlotId: "", reason: "" });
        setSelectedSchedule(null);
        fetchTeacherData();
      }
    } catch (error) {
      console.error("Error rescheduling class:", error);
      toast({ title: "Error", description: "Failed to reschedule class", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 md:py-6 sticky top-0 z-30 shadow-lg">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <p className="text-white/80 text-xs">Welcome back,</p>
              </div>
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold truncate">{session.user?.name}</h1>
              <p className="text-white/80 text-[10px] md:text-xs flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                Teacher Dashboard • ICE Department
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <TeacherNotificationCenter userId={session.user?.id || ""} />
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-9 w-9"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="container mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {[
            { label: "Today's Classes", value: next7Days[0]?.schedules.length || 0, icon: Calendar, color: "from-rose-400 to-pink-500", bg: "bg-white dark:bg-gray-800" },
            { label: "This Week", value: schedules.filter(s => s.isActive).length, icon: Clock, color: "from-cyan-400 to-sky-500", bg: "bg-white dark:bg-gray-800" },
            { label: "Courses", value: new Set(schedules.map(s => s.courseCode)).size, icon: BookOpen, color: "from-emerald-400 to-teal-500", bg: "bg-white dark:bg-gray-800" },
            { label: "Programs", value: new Set(schedules.map(s => s.program)).size, icon: GraduationCap, color: "from-violet-400 to-purple-500", bg: "bg-white dark:bg-gray-800" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn("shadow-md hover:shadow-lg transition-shadow", stat.bg)}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", stat.color)}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container mx-auto px-4 mt-4">
        <Card className="shadow-md border-0 bg-white dark:bg-gray-800">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Cancel Class", icon: Ban, color: "from-red-400 to-rose-500", action: () => setShowCancelDialog(true) },
                { label: "Change Room", icon: MapPin, color: "from-amber-400 to-orange-500", action: () => setShowRoomDialog(true) },
                { label: "Reschedule", icon: RefreshCw, color: "from-cyan-400 to-blue-500", action: () => setShowRescheduleDialog(true) },
              ].map((action) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.action}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                    "bg-gradient-to-br text-white shadow-md hover:shadow-lg",
                    action.color
                  )}
                >
                  <action.icon className="w-5 h-5" />
                  <span className="text-[10px] md:text-xs font-medium">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next 7 Days Schedule */}
      <div className="container mx-auto px-4 mt-4">
        <Card className="shadow-md border-0 bg-white dark:bg-gray-800">
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Next 7 Days
              </CardTitle>
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="h-7 w-7 p-0"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={viewMode === "timeline" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("timeline")}
                  className="h-7 w-7 p-0"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {viewMode === "cards" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {next7Days.map((day, index) => (
                  <motion.div
                    key={day.date.toISOString()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all",
                      index === 0 ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-border bg-background"
                    )}
                  >
                    <div className="text-center mb-2">
                      <p className="text-[10px] text-muted-foreground">{format(day.date, "MMM d")}</p>
                      <p className={cn(
                        "text-xs font-semibold capitalize",
                        index === 0 && "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {day.dayName}
                      </p>
                      {index === 0 && (
                        <Badge className="bg-emerald-500 text-white text-[9px] mt-1">Today</Badge>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {day.schedules.length > 0 ? (
                        day.schedules.slice(0, 4).map((schedule, sIndex) => (
                          <motion.div
                            key={schedule.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: sIndex * 0.05 }}
                            onClick={() => setSelectedSchedule(schedule)}
                            className={cn(
                              "p-1.5 rounded-lg text-[10px] cursor-pointer transition-all",
                              "hover:scale-[1.02]",
                              schedule.classType === "lab" 
                                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" 
                                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            )}
                          >
                            <p className="font-medium truncate">{schedule.courseCode}</p>
                            <p className="text-[9px] opacity-75">{formatTime(schedule.startTime)}</p>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-[10px] text-muted-foreground text-center py-2">No classes</p>
                      )}
                      {day.schedules.length > 4 && (
                        <p className="text-[10px] text-muted-foreground text-center">
                          +{day.schedules.length - 4} more
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4">
                  {next7Days.map((day, index) => (
                    <div key={day.date.toISOString()} className="relative pl-10">
                      <div className={cn(
                        "absolute left-2.5 w-3 h-3 rounded-full border-2 border-background",
                        index === 0 ? "bg-emerald-500" : "bg-muted"
                      )} />
                      <div className={cn(
                        "p-3 rounded-lg border",
                        index === 0 && "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10"
                      )}>
                        <p className={cn(
                          "text-xs font-semibold capitalize mb-2",
                          index === 0 && "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {day.dayName} • {format(day.date, "MMM d")}
                          {index === 0 && <Badge className="ml-2 bg-emerald-500 text-white text-[9px]">Today</Badge>}
                        </p>
                        {day.schedules.length > 0 ? (
                          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                            {day.schedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                onClick={() => setSelectedSchedule(schedule)}
                                className={cn(
                                  "p-2 rounded-lg border cursor-pointer transition-all hover:border-emerald-300",
                                  schedule.classType === "lab"
                                    ? "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10"
                                    : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10",
                                  selectedSchedule?.id === schedule.id && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">{schedule.courseCode}</span>
                                  <Badge variant="outline" className="text-[9px]">{schedule.roomNumber}</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No classes scheduled</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Schedule Actions */}
      {selectedSchedule && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 mt-4"
        >
          <Card className="shadow-md border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{selectedSchedule.courseCode}</h3>
                  <p className="text-xs text-muted-foreground">{selectedSchedule.courseName}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSchedule(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <Ban className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  onClick={() => setShowRoomDialog(true)}
                >
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  Room
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-cyan-600 border-cyan-200 hover:bg-cyan-50"
                  onClick={() => setShowRescheduleDialog(true)}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Reschedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cancel Class Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="w-5 h-5" />
              Cancel Class
            </DialogTitle>
            <DialogDescription>
              This will notify all students enrolled in this class.
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{selectedSchedule.courseCode}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedSchedule.dayOfWeek} • {formatTime(selectedSchedule.startTime)} • {selectedSchedule.roomNumber}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Reason for cancellation *</Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Personal emergency, Official work..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelClass}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Change Dialog */}
      <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <MapPin className="w-5 h-5" />
              Change Room
            </DialogTitle>
            <DialogDescription>
              Select a new room. Only available rooms can be selected.
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{selectedSchedule.courseCode}</p>
                <p className="text-xs text-muted-foreground">
                  Current Room: <span className="font-medium">{selectedSchedule.roomNumber}</span>
                </p>
              </div>
              
              <RoomAvailabilityChecker
                day={selectedSchedule.dayOfWeek}
                startTime={selectedSchedule.startTime}
                endTime={selectedSchedule.endTime}
                excludeScheduleId={selectedSchedule.id}
                onRoomSelect={setNewRoomId}
                selectedRoomId={newRoomId}
              />
              
              <div className="space-y-2">
                <Label>Reason for change *</Label>
                <Textarea
                  value={roomChangeReason}
                  onChange={(e) => setRoomChangeReason(e.target.value)}
                  placeholder="e.g., Equipment needed, More capacity required..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoomDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleRoomChange}
              disabled={submitting || !newRoomId}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
              Change Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog with Custom Time */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-600">
              <RefreshCw className="w-5 h-5" />
              Reschedule Class
            </DialogTitle>
            <DialogDescription>
              Choose a new day and time for this class.
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{selectedSchedule.courseCode}</p>
                <p className="text-xs text-muted-foreground">
                  Current: {selectedSchedule.dayOfWeek} • {formatTime(selectedSchedule.startTime)}
                </p>
              </div>
              
              {/* Day Selection */}
              <div className="space-y-2">
                <Label>New Day</Label>
                <Select value={rescheduleData.newDay} onValueChange={(v) => setRescheduleData(prev => ({ ...prev, newDay: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Time Mode Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Time Selection</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Slot</span>
                    <Button
                      variant={useCustomTime ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseCustomTime(!useCustomTime)}
                      className="h-6 w-12 p-0"
                    >
                      {useCustomTime ? "Custom" : "Slot"}
                    </Button>
                  </div>
                </div>
                
                {useCustomTime ? (
                  <div className="p-4 rounded-lg border-2 border-cyan-200 bg-cyan-50/50 dark:bg-cyan-900/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="w-4 h-4 text-cyan-500" />
                      <span className="text-xs font-medium">Custom Time Range</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <CustomTimePicker
                        label="Start Time"
                        value={customStartTime}
                        onChange={setCustomStartTime}
                      />
                      <CustomTimePicker
                        label="End Time"
                        value={customEndTime}
                        onChange={setCustomEndTime}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Example: 09:33 to 10:44 (Random time supported)
                    </p>
                  </div>
                ) : (
                  <Select value={rescheduleData.timeSlotId} onValueChange={(v) => setRescheduleData(prev => ({ ...prev, timeSlotId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.filter(t => !t.isBreak).map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.label} ({slot.startTime} - {slot.endTime})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* Room Availability for new time */}
              {rescheduleData.newDay && (useCustomTime ? (customStartTime && customEndTime) : rescheduleData.timeSlotId) && (
                <RoomAvailabilityChecker
                  day={rescheduleData.newDay}
                  startTime={useCustomTime ? customStartTime : (timeSlots.find(t => t.id === rescheduleData.timeSlotId)?.startTime || "")}
                  endTime={useCustomTime ? customEndTime : (timeSlots.find(t => t.id === rescheduleData.timeSlotId)?.endTime || "")}
                  excludeScheduleId={selectedSchedule.id}
                  onRoomSelect={setNewRoomId}
                  selectedRoomId={newRoomId}
                />
              )}
              
              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason for reschedule *</Label>
                <Textarea
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Conflict with exam schedule..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleRescheduleClass}
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Back to Home */}
      <div className="fixed bottom-4 left-4 z-40">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2 shadow-lg bg-white dark:bg-gray-800">
            <ChevronLeft className="w-4 h-4" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
