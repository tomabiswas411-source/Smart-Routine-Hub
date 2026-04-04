"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, BookOpen, LogOut, Loader2, 
  Ban, RefreshCw, MapPin, X, Check, Bell,
  Building, ChevronLeft, ChevronUp,
  AlignJustify, Grid3X3, BellOff, CheckCircle,
  DoorOpen, Timer, Sparkles,
  GraduationCap, Funnel, FlaskConical, Presentation,
  XCircle, CalendarClock, AlertTriangle, Info
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
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
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
  content: string;
  type: string;
  changeType?: string;
  courseCode?: string;
  createdAt: any;
  isRead?: boolean;
}

// Days including Friday and Saturday
const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

// Color palettes for different class types
const classColors = {
  theory: {
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
    border: "border-emerald-300 dark:border-emerald-700",
    badge: "bg-emerald-500 text-white",
    text: "text-emerald-700 dark:text-emerald-300"
  },
  lab: {
    bg: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
    border: "border-purple-300 dark:border-purple-700",
    badge: "bg-purple-500 text-white",
    text: "text-purple-700 dark:text-purple-300"
  }
};

// Room type icons
const roomTypeIcons: Record<string, React.ReactNode> = {
  classroom: <GraduationCap className="w-3.5 h-3.5" />,
  lab: <FlaskConical className="w-3.5 h-3.5" />,
  seminar: <Presentation className="w-3.5 h-3.5" />,
};

// Helper to convert Firestore timestamp
function toDate(timestamp: unknown): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "object" && timestamp !== null) {
    const ts = timestamp as { seconds?: number; _seconds?: number };
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
  const hour = value ? value.split(":")[0] : "09";
  const minute = value ? value.split(":")[1] : "00";

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Select value={hour} onValueChange={(h) => onChange(`${h}:${minute}`)}>
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
        <Select value={minute} onValueChange={(m) => onChange(`${hour}:${m}`)}>
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
          Select Room (Available rooms shown in green)
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
                  isAvailable && !isSelected && "border-emerald-300 hover:border-emerald-500 bg-background",
                  !isAvailable && "border-red-200 bg-red-50/50 dark:bg-red-900/10 cursor-not-allowed opacity-60"
                )}
              >
                <div className={cn(
                  "absolute top-1 right-1 w-2.5 h-2.5 rounded-full",
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
                  <div className="mt-1.5 pt-1.5 border-t border-red-200 dark:border-red-800">
                    <p className="text-[9px] text-red-600 truncate">{item.occupiedBy.courseCode}</p>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Notification Bar Component
function NotificationBar({ 
  notifications, 
  isOpen, 
  onToggle,
  onMarkAsRead 
}: { 
  notifications: Notification[];
  isOpen: boolean;
  onToggle: () => void;
  onMarkAsRead: (id: string) => void;
}) {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const getNotificationIcon = (type?: string) => {
    switch(type) {
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'rescheduled': return <CalendarClock className="w-4 h-4 text-amber-500" />;
      case 'room_changed': return <MapPin className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ height: isOpen ? "auto" : "56px" }}
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border shadow-lg z-50 overflow-hidden"
    >
      {/* Header */}
      <div 
        onClick={onToggle}
        className="flex items-center justify-between px-4 h-14 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-emerald-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
        </div>
        <ChevronUp className={cn(
          "w-5 h-5 transition-transform",
          isOpen && "rotate-180"
        )} />
      </div>

      {/* Notification List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-4 max-h-80 overflow-y-auto"
          >
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <BellOff className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      notification.isRead 
                        ? "bg-muted/50 border-border" 
                        : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notification.changeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification.id);
                              }}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(toDate(notification.createdAt), "dd MMM yyyy, hh:mm a")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  
  // Filters
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<string>("all");
  
  // Dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Custom time states
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
  
  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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
      fetchNotifications();
    }
  }, [session]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const [schedulesRes, timeSlotsRes, roomsRes] = await Promise.all([
        fetch(`/api/schedules?teacherId=${session?.user?.id}`),
        fetch("/api/timeslots"),
        fetch("/api/rooms"),
      ]);
      
      const schedulesData = await schedulesRes.json();
      const timeSlotsData = await timeSlotsRes.json();
      const roomsData = await roomsRes.json();
      
      if (schedulesData.success) setSchedules(schedulesData.data || []);
      if (timeSlotsData.success) setTimeSlots(timeSlotsData.data || []);
      if (roomsData.success) setRooms(roomsData.data || []);
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notices?category=schedule_change");
      const data = await res.json();
      if (data.success) {
        setNotifications((data.data || []).map((n: any) => ({ ...n, isRead: false })));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Filter schedules
  const filteredSchedules = schedules.filter((s) => {
    if (!s.isActive) return false;
    if (filterSemester !== "all" && s.semester !== parseInt(filterSemester)) return false;
    if (filterProgram !== "all" && s.program !== filterProgram) return false;
    if (filterRoom !== "all" && s.roomId !== filterRoom) return false;
    if (filterDay !== "all" && s.dayOfWeek?.toLowerCase() !== filterDay.toLowerCase()) return false;
    return true;
  });

  // Group by day
  const schedulesByDay: Record<string, TeacherSchedule[]> = {};
  days.forEach((day) => {
    schedulesByDay[day] = filteredSchedules
      .filter((s) => s.dayOfWeek?.toLowerCase() === day.toLowerCase())
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  });

  // Get next 7 days
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

  // Get unique values for filters
  const uniqueSemesters = [...new Set(schedules.map(s => s.semester))].sort((a, b) => a - b);
  const uniquePrograms = [...new Set(schedules.map(s => s.program))];

  // Open cancel dialog
  const openCancelDialog = (schedule: TeacherSchedule) => {
    setSelectedSchedule(schedule);
    setCancelReason("");
    setShowCancelDialog(true);
  };

  // Open room dialog
  const openRoomDialog = (schedule: TeacherSchedule) => {
    setSelectedSchedule(schedule);
    setNewRoomId("");
    setRoomChangeReason("");
    setShowRoomDialog(true);
  };

  // Open reschedule dialog
  const openRescheduleDialog = (schedule: TeacherSchedule) => {
    setSelectedSchedule(schedule);
    setRescheduleData({ newDay: "", timeSlotId: "", reason: "" });
    setUseCustomTime(false);
    setCustomStartTime(schedule.startTime || "09:00");
    setCustomEndTime(schedule.endTime || "10:00");
    setShowRescheduleDialog(true);
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
        toast({ title: "✅ Class Cancelled", description: `${selectedSchedule.courseCode} has been cancelled. Students will be notified.` });
        setShowCancelDialog(false);
        setCancelReason("");
        setSelectedSchedule(null);
        fetchTeacherData();
        fetchNotifications();
      } else {
        toast({ title: "Error", description: data.error || "Failed to cancel class", variant: "destructive" });
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
      toast({ title: "Error", description: "Please select a room and provide a reason", variant: "destructive" });
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
        toast({ title: "✅ Room Changed", description: `${selectedSchedule.courseCode} moved to ${newRoom.roomNumber}` });
        setShowRoomDialog(false);
        setNewRoomId("");
        setRoomChangeReason("");
        setSelectedSchedule(null);
        fetchTeacherData();
        fetchNotifications();
      } else {
        toast({ title: "Error", description: data.error || "Failed to change room", variant: "destructive" });
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
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

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
        toast({ title: "✅ Class Rescheduled", description: `${selectedSchedule.courseCode} has been rescheduled to ${rescheduleData.newDay}` });
        setShowRescheduleDialog(false);
        setRescheduleData({ newDay: "", timeSlotId: "", reason: "" });
        setSelectedSchedule(null);
        fetchTeacherData();
        fetchNotifications();
      } else {
        toast({ title: "Error", description: data.error || "Failed to reschedule class", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error rescheduling class:", error);
      toast({ title: "Error", description: "Failed to reschedule class", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  // Reset filters
  const resetFilters = () => {
    setFilterSemester("all");
    setFilterProgram("all");
    setFilterRoom("all");
    setFilterDay("all");
  };

  // Handle card click
  const handleCardClick = (schedule: TeacherSchedule) => {
    if (selectedSchedule?.id === schedule.id) {
      setSelectedSchedule(null);
    } else {
      setSelectedSchedule(schedule);
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

  const colors = classColors;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 md:py-5 sticky top-0 z-30 shadow-lg">
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
              <h1 className="text-lg md:text-xl font-bold truncate">{session.user?.name}</h1>
              <p className="text-white/80 text-[10px] md:text-xs">Teacher Dashboard • ICE Department</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* Stats */}
      <div className="container mx-auto px-4 -mt-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Today", value: next7Days[0]?.schedules.length || 0, icon: Calendar, color: "from-rose-400 to-pink-500" },
            { label: "This Week", value: filteredSchedules.length, icon: Clock, color: "from-cyan-400 to-sky-500" },
            { label: "Courses", value: new Set(filteredSchedules.map(s => s.courseCode)).size, icon: BookOpen, color: "from-emerald-400 to-teal-500" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-md">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br", stat.color)}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 mt-4">
        <Card className="shadow-md">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Funnel className="w-4 h-4 text-emerald-500" />
              Filter Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Semester Filter */}
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {uniqueSemesters.map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>{sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Program Filter */}
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {uniquePrograms.map((prog) => (
                    <SelectItem key={prog} value={prog} className="uppercase">{prog?.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Room Filter */}
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
              
              {/* Day Filter */}
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
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Showing {filteredSchedules.length} classes
              </p>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="container mx-auto px-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Your Classes</h2>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-7 gap-1 px-2"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Cards</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-7 gap-1 px-2"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">List</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Classes Display */}
      <div className="container mx-auto px-4 mt-3">
        {filteredSchedules.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No classes found</p>
              <Button variant="outline" size="sm" onClick={resetFilters} className="mt-3">
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSchedules
              .sort((a, b) => {
                const dayOrder = days.indexOf(a.dayOfWeek?.toLowerCase() || "");
                const dayOrderB = days.indexOf(b.dayOfWeek?.toLowerCase() || "");
                if (dayOrder !== dayOrderB) return dayOrder - dayOrderB;
                return (a.startTime || "").localeCompare(b.startTime || "");
              })
              .map((schedule, index) => {
                const typeColors = schedule.classType === "lab" ? colors.lab : colors.theory;
                const isSelected = selectedSchedule?.id === schedule.id;
                
                return (
                  <motion.div
                    key={schedule.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg",
                      typeColors.bg,
                      typeColors.border,
                      isSelected && "ring-2 ring-emerald-500"
                    )}
                    onClick={() => handleCardClick(schedule)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm">{schedule.courseCode}</h3>
                          <Badge className={cn("text-[9px]", typeColors.badge)}>
                            {schedule.classType === "lab" ? "LAB" : "THEORY"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{schedule.courseName}</p>
                      </div>
                    </div>
                    
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="capitalize">{schedule.dayOfWeek}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(schedule.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{schedule.roomNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{schedule.semester}{schedule.semester === 1 ? 'st' : schedule.semester === 2 ? 'nd' : schedule.semester === 3 ? 'rd' : 'th'} Sem ({schedule.program?.toUpperCase()})</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-[10px]"
                            onClick={(e) => { e.stopPropagation(); openCancelDialog(schedule); }}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50 h-8 text-[10px]"
                            onClick={(e) => { e.stopPropagation(); openRoomDialog(schedule); }}
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Room
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-cyan-600 border-cyan-200 hover:bg-cyan-50 h-8 text-[10px]"
                            onClick={(e) => { e.stopPropagation(); openRescheduleDialog(schedule); }}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Time
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0 divide-y divide-border">
              {filteredSchedules
                .sort((a, b) => {
                  const dayOrder = days.indexOf(a.dayOfWeek?.toLowerCase() || "");
                  const dayOrderB = days.indexOf(b.dayOfWeek?.toLowerCase() || "");
                  if (dayOrder !== dayOrderB) return dayOrder - dayOrderB;
                  return (a.startTime || "").localeCompare(b.startTime || "");
                })
                .map((schedule) => {
                  const typeColors = schedule.classType === "lab" ? colors.lab : colors.theory;
                  const isSelected = selectedSchedule?.id === schedule.id;
                  
                  return (
                    <div key={schedule.id}>
                      <div
                        onClick={() => handleCardClick(schedule)}
                        className={cn(
                          "flex items-center gap-3 p-3 cursor-pointer transition-all hover:bg-muted/50",
                          isSelected && "bg-emerald-50 dark:bg-emerald-900/20"
                        )}
                      >
                        <div className="w-12 shrink-0">
                          <Badge variant="outline" className="text-[10px] w-full justify-center capitalize">
                            {schedule.dayOfWeek?.substring(0, 3)}
                          </Badge>
                        </div>
                        <div className="w-16 shrink-0">
                          <p className="text-xs font-medium">{formatTime(schedule.startTime)}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{schedule.courseCode}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{schedule.roomNumber}</span>
                            <span>•</span>
                            <span>{schedule.semester}{schedule.semester === 1 ? 'st' : schedule.semester === 2 ? 'nd' : schedule.semester === 3 ? 'rd' : 'th'} Sem</span>
                            <span>•</span>
                            <span className="uppercase">{schedule.program}</span>
                          </div>
                        </div>
                        <Badge className={cn("text-[9px]", typeColors.badge)}>
                          {schedule.classType === "lab" ? "LAB" : "THEORY"}
                        </Badge>
                      </div>
                      
                      {/* Action Buttons for List View */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-end gap-2 px-3 pb-3"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 h-7 text-[10px]"
                              onClick={(e) => { e.stopPropagation(); openCancelDialog(schedule); }}
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-amber-600 border-amber-200 hover:bg-amber-50 h-7 text-[10px]"
                              onClick={(e) => { e.stopPropagation(); openRoomDialog(schedule); }}
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              Room
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-cyan-600 border-cyan-200 hover:bg-cyan-50 h-7 text-[10px]"
                              onClick={(e) => { e.stopPropagation(); openRescheduleDialog(schedule); }}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Time
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cancel Dialog */}
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
                <p className="text-xs text-muted-foreground">{selectedSchedule.courseName}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="capitalize">{selectedSchedule.dayOfWeek}</span>
                  <span>•</span>
                  <span>{formatTime(selectedSchedule.startTime)}</span>
                  <span>•</span>
                  <span>{selectedSchedule.roomNumber}</span>
                </div>
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
                  Current Room: <span className="font-semibold">{selectedSchedule.roomNumber}</span>
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
                  placeholder="e.g., Equipment needed, More capacity..."
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

      {/* Reschedule Dialog */}
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
                  Current: {selectedSchedule.dayOfWeek} • {formatTime(selectedSchedule.startTime)} • {selectedSchedule.roomNumber}
                </p>
              </div>
              
              {/* Day Selection */}
              <div className="space-y-2">
                <Label>New Day *</Label>
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
                    <span className="text-xs text-muted-foreground">Custom Time</span>
                    <Button
                      variant={useCustomTime ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseCustomTime(!useCustomTime)}
                      className="h-7 text-xs"
                    >
                      {useCustomTime ? "ON" : "OFF"}
                    </Button>
                  </div>
                </div>
                
                {useCustomTime ? (
                  <div className="grid grid-cols-2 gap-4">
                    <CustomTimePicker
                      value={customStartTime}
                      onChange={setCustomStartTime}
                      label="Start Time"
                    />
                    <CustomTimePicker
                      value={customEndTime}
                      onChange={setCustomEndTime}
                      label="End Time"
                    />
                  </div>
                ) : (
                  <Select 
                    value={rescheduleData.timeSlotId} 
                    onValueChange={(v) => setRescheduleData(prev => ({ ...prev, timeSlotId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.filter(t => !t.isBreak).map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.label} ({formatTime(slot.startTime)} - {formatTime(slot.endTime)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason for reschedule *</Label>
                <Textarea
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Conflict with another class, Official work..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleRescheduleClass}
              disabled={submitting || !rescheduleData.newDay}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Reschedule Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Bar */}
      <NotificationBar
        notifications={notifications}
        isOpen={showNotifications}
        onToggle={() => setShowNotifications(!showNotifications)}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
}
