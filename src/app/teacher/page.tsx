"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, BookOpen, LogOut, Loader2, 
  Ban, RefreshCw, MapPin, Bell, Plus,
  Building, AlignJustify, Grid3X3, BellOff, CheckCircle,
  Sparkles, GraduationCap, Funnel, FlaskConical, Presentation,
  XCircle, CalendarClock, Info, ChevronUp, Check,
  AlertTriangle, Megaphone, Save
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { 
  useRealtimeSchedules, 
  useRealtimeScheduleChanges, 
  useRealtimeNotices,
  useRealtimeTimeSlots,
  useRealtimeRooms,
  type Schedule,
  type ScheduleChange,
  type TimeSlot,
  type Room,
  type Notice
} from "@/hooks/use-realtime-data";

// Types
type TeacherSchedule = Schedule;

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  changeType?: string;
  courseCode?: string;
  affectedSemester?: number;
  affectedProgram?: string;
  createdAt: any;
  isRead?: boolean;
}

// Days
const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

// Color palettes - Premium 3D Design
const classColors = {
  theory: {
    bg: "bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-900/30 dark:via-emerald-900/20 dark:to-cyan-900/30",
    border: "border-teal-300 dark:border-teal-600",
    badge: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/30",
    glow: "shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20",
  },
  lab: {
    bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/30",
    border: "border-amber-300 dark:border-amber-600",
    badge: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30",
    glow: "shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20",
  }
};

// Status styles
const statusStyles = {
  cancelled: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-300 dark:border-red-700", icon: XCircle },
  rescheduled: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700", icon: CalendarClock },
  room_changed: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700", icon: MapPin }
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
    if (ts.seconds || ts._seconds) return new Date((ts.seconds || ts._seconds || 0) * 1000);
  }
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) return date;
  }
  return new Date();
}

// Custom Time Picker Component
function CustomTimePicker({ value, onChange, label }: { value: string; onChange: (time: string) => void; label: string }) {
  const hour = value ? value.split(":")[0] : "09";
  const minute = value ? value.split(":")[1] : "00";

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Select value={hour} onValueChange={(h) => onChange(`${h}:${minute}`)}>
          <SelectTrigger className="w-20 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((h) => (
              <SelectItem key={h} value={h} className="text-sm">{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-lg font-bold text-muted-foreground">:</span>
        <Select value={minute} onValueChange={(m) => onChange(`${hour}:${m}`)}>
          <SelectTrigger className="w-20 h-9"><SelectValue /></SelectTrigger>
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

// Notification Bar Component
function NotificationBar({ notifications, isOpen, onToggle, onMarkAsRead }: { 
  notifications: Notification[]; isOpen: boolean; onToggle: () => void; onMarkAsRead: (id: string) => void; 
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
      <div onClick={onToggle} className="flex items-center justify-between px-4 h-14 cursor-pointer hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-emerald-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unreadCount}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">Notifications</p>
            <p className="text-xs text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}</p>
          </div>
        </div>
        <ChevronUp className={cn("w-5 h-5 transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pb-4 max-h-80 overflow-y-auto">
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
                    className={cn("p-3 rounded-lg border transition-all", notification.isRead ? "bg-muted/50 border-border" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">{getNotificationIcon(notification.changeType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          {!notification.isRead && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] shrink-0" onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id); }}>
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.content}</p>
                        {notification.affectedSemester && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px]">
                              {notification.affectedSemester}{notification.affectedSemester === 1 ? 'st' : notification.affectedSemester === 2 ? 'nd' : notification.affectedSemester === 3 ? 'rd' : 'th'} Semester
                            </Badge>
                            {notification.affectedProgram && (
                              <Badge variant="outline" className="text-[10px] uppercase">{notification.affectedProgram}</Badge>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{format(toDate(notification.createdAt), "dd MMM yyyy, hh:mm a")}</p>
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

// Schedule Card Component
function ScheduleCard({ schedule, isSelected, onSelect, onCancel, onReschedule, scheduleChange }: { 
  schedule: TeacherSchedule; isSelected: boolean; onSelect: () => void; onCancel: () => void; onReschedule: () => void; scheduleChange?: ScheduleChange;
}) {
  const typeColors = schedule.classType === "lab" ? classColors.lab : classColors.theory;
  const isCancelled = scheduleChange?.changeType === "cancelled" && scheduleChange?.isActive;
  const isRescheduled = scheduleChange?.changeType === "rescheduled" && scheduleChange?.isActive;
  const wasMoved = isRescheduled && scheduleChange?.newDay && scheduleChange.newDay.toLowerCase() !== scheduleChange.originalDay?.toLowerCase();
  
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusInfo = () => {
    if (isCancelled) return { label: "Cancelled", style: statusStyles.cancelled, icon: XCircle };
    if (isRescheduled) return { label: wasMoved ? "Moved" : "Rescheduled", style: statusStyles.rescheduled, icon: CalendarClock };
    return null;
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="relative">
      <motion.div
        className={cn(
          "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
          typeColors.bg, typeColors.border, typeColors.glow,
          isSelected && "ring-2 ring-teal-500 ring-offset-2 ring-offset-background",
          isCancelled && "opacity-60"
        )}
        onClick={onSelect}
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* 3D Card Effect - Inner Shadow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/50 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10 pointer-events-none" />
        
        {statusInfo && (
          <div className={cn("absolute -top-2 -right-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg z-10 border backdrop-blur-sm", statusInfo.style.bg, statusInfo.text, statusInfo.style.border)}>
            <statusInfo.icon className="w-3 h-3" />
            {statusInfo.label}
          </div>
        )}
        
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn("font-bold text-sm", isCancelled && "line-through")}>{schedule.courseCode}</h3>
              <Badge className={cn("text-[9px]", typeColors.badge)}>{schedule.classType === "lab" ? "LAB" : "THEORY"}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{schedule.courseName}</p>
          </div>
        </div>
        
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
        
        {isRescheduled && scheduleChange && wasMoved && (
          <div className={cn("mt-3 p-2 rounded-lg text-[10px] border", statusStyles.rescheduled.bg, statusStyles.rescheduled.border)}>
            <div className="flex items-center gap-1 font-medium mb-1">
              <CalendarClock className="w-3 h-3" />
              Moved from original schedule
            </div>
            <div className="space-y-0.5 text-muted-foreground">
              {scheduleChange.originalDay && <p>Original Day: <span className="capitalize font-medium text-foreground">{scheduleChange.originalDay}</span></p>}
              {scheduleChange.originalStartTime && scheduleChange.originalEndTime && <p>Original Time: <span className="font-medium text-foreground">{formatTime(scheduleChange.originalStartTime)} - {formatTime(scheduleChange.originalEndTime)}</span></p>}
              {scheduleChange.reason && <p className="italic">Reason: {scheduleChange.reason}</p>}
            </div>
          </div>
        )}
      </motion.div>
      
      <AnimatePresence>
        {isSelected && !isCancelled && (
          <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-red-600 border-red-300 bg-red-50 hover:bg-red-100 h-9 text-xs font-medium" onClick={onCancel}>
              <Ban className="w-3.5 h-3.5 mr-1.5" />Cancel Class
            </Button>
            <Button variant="outline" size="sm" className="text-cyan-600 border-cyan-300 bg-cyan-50 hover:bg-cyan-100 h-9 text-xs font-medium" onClick={onReschedule}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Reschedule
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main Teacher Dashboard Component
export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // Real-time data hooks
  const { schedules, loading: schedulesLoading } = useRealtimeSchedules(session?.user?.id ? { teacherId: session.user.id } : undefined);
  const { changes, loading: changesLoading } = useRealtimeScheduleChanges(session?.user?.id ? { teacherId: session.user.id } : undefined);
  const { timeSlots, loading: timeSlotsLoading } = useRealtimeTimeSlots();
  const { rooms, loading: roomsLoading } = useRealtimeRooms();
  const { notices, loading: noticesLoading } = useRealtimeNotices({ limitCount: 10 });

  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<string>("all");
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showAddClassDialog, setShowAddClassDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Add class form state
  const [newClassForm, setNewClassForm] = useState({
    courseCode: "",
    courseName: "",
    dayOfWeek: "",
    startTime: "09:00",
    endTime: "10:00",
    roomId: "",
    semester: 1,
    program: "bsc",
    classType: "theory" as "theory" | "lab"
  });
  
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customStartTime, setCustomStartTime] = useState("09:00");
  const [customEndTime, setCustomEndTime] = useState("10:00");
  
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleData, setRescheduleData] = useState({ newDay: "", timeSlotId: "", reason: "" });
  const [newRoomId, setNewRoomId] = useState("");
  
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Notice form
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "", category: "general", affectedYear: "", affectedSemester: "", affectedProgram: "bsc" });

  // Auth redirect
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && session?.user?.role === "admin") router.push("/admin");
  }, [status, session, router]);

  // Convert notices to notifications
  useEffect(() => {
    if (notices.length > 0) {
      setNotifications(notices.map((n: Notice) => ({ ...n, isRead: false })));
    }
  }, [notices]);

  // Create schedule change map
  const scheduleChangeMap = useCallback(() => {
    const map: Record<string, ScheduleChange> = {};
    changes.forEach((change) => {
      if (change.isActive && change.scheduleId) {
        if (!map[change.scheduleId] || (change.createdAt && map[change.scheduleId].createdAt && new Date(change.createdAt) > new Date(map[change.scheduleId].createdAt))) {
          map[change.scheduleId] = change;
        }
      }
    });
    return map;
  }, [changes]);

  const changeMap = scheduleChangeMap();

  // Get effective schedule
  const getEffectiveSchedule = useCallback((schedule: TeacherSchedule): TeacherSchedule => {
    const change = changeMap[schedule.id];
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
  }, [changeMap]);

  const isScheduleCancelled = useCallback((scheduleId: string): boolean => {
    const change = changeMap[scheduleId];
    return change?.changeType === "cancelled" && change?.isActive;
  }, [changeMap]);

  // Effective schedules
  const effectiveSchedules = schedules.filter((s) => s.isActive).map((s) => getEffectiveSchedule(s));

  // Filtered schedules
  const filteredSchedules = effectiveSchedules.filter((s) => {
    if (isScheduleCancelled(s.id)) return false;
    if (filterSemester !== "all" && s.semester !== parseInt(filterSemester)) return false;
    if (filterProgram !== "all" && s.program !== filterProgram) return false;
    if (filterRoom !== "all" && s.roomId !== filterRoom) return false;
    if (filterDay !== "all" && s.dayOfWeek?.toLowerCase() !== filterDay.toLowerCase()) return false;
    return true;
  });

  // Group by day
  const schedulesByDay: Record<string, TeacherSchedule[]> = {};
  days.forEach((day) => {
    schedulesByDay[day] = filteredSchedules.filter((s) => s.dayOfWeek?.toLowerCase() === day.toLowerCase()).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  });

  // Next 7 days
  const getNext7Days = () => {
    const today = new Date();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const result = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayName = dayNames[date.getDay()];
      result.push({ date, dayName, schedules: schedulesByDay[dayName] || [] });
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

  // Unique values for filters
  const uniqueSemesters = [...new Set(schedules.map(s => s.semester))].sort((a, b) => a - b);
  const uniquePrograms = [...new Set(schedules.map(s => s.program))];

  // Fetch available rooms
  const fetchAvailableRooms = useCallback(async (day: string, startTime: string, endTime: string) => {
    if (!day || !startTime || !endTime) { setAvailableRooms([]); return; }
    setLoadingRooms(true);
    try {
      const res = await fetch(`/api/rooms/availability?day=${day}&startTime=${startTime}&endTime=${endTime}${selectedSchedule?.id ? `&excludeScheduleId=${selectedSchedule.id}` : ""}`);
      const data = await res.json();
      if (data.success) {
        setAvailableRooms((data.data || []).filter((item: any) => item.isAvailable).map((item: any) => item.room));
      }
    } catch (error) {
      console.error("Error fetching available rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  }, [selectedSchedule?.id]);

  // Get current time values
  const getCurrentTimeValues = useCallback(() => {
    let startTime = customStartTime;
    let endTime = customEndTime;
    if (!useCustomTime && rescheduleData.timeSlotId) {
      const timeSlot = timeSlots.find(t => t.id === rescheduleData.timeSlotId);
      if (timeSlot) { startTime = timeSlot.startTime; endTime = timeSlot.endTime; }
    }
    return { startTime, endTime };
  }, [useCustomTime, customStartTime, customEndTime, rescheduleData.timeSlotId, timeSlots]);

  // Update available rooms
  useEffect(() => {
    if (showRescheduleDialog && rescheduleData.newDay) {
      const { startTime, endTime } = getCurrentTimeValues();
      fetchAvailableRooms(rescheduleData.newDay, startTime, endTime);
    }
  }, [showRescheduleDialog, rescheduleData.newDay, rescheduleData.timeSlotId, customStartTime, customEndTime, useCustomTime, getCurrentTimeValues, fetchAvailableRooms]);

  // Handlers
  const handleOpenCancel = (schedule: TeacherSchedule) => { setSelectedSchedule(schedule); setCancelReason(""); setShowCancelDialog(true); };
  const handleOpenReschedule = (schedule: TeacherSchedule) => {
    setSelectedSchedule(schedule);
    setRescheduleData({ newDay: "", timeSlotId: "", reason: "" });
    setUseCustomTime(false);
    setCustomStartTime(schedule.startTime || "09:00");
    setCustomEndTime(schedule.endTime || "10:00");
    setNewRoomId("");
    setShowRescheduleDialog(true);
  };

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

  const handleRescheduleClass = async () => {
    if (!selectedSchedule || !rescheduleData.newDay || !rescheduleData.reason) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const { startTime, endTime } = getCurrentTimeValues();
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
          originalRoomId: selectedSchedule.roomId,
          originalRoomNumber: selectedSchedule.roomNumber,
          newDay: rescheduleData.newDay,
          newStartTime: startTime,
          newEndTime: endTime,
          newRoomId: newRoomId || selectedSchedule.roomId,
          effectiveDate: new Date().toISOString().split("T")[0],
          reason: rescheduleData.reason,
          courseName: selectedSchedule.courseName,
          courseCode: selectedSchedule.courseCode,
          teacherId: session?.user?.id,
          teacherName: session?.user?.name,
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
        setNewRoomId("");
        setSelectedSchedule(null);
      } else if (data.conflicts) {
        toast({ title: "⚠️ Conflicts Detected", description: data.conflicts.join(", "), variant: "destructive" });
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

  const handleCreateNotice = async () => {
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noticeForm.title,
          content: noticeForm.content,
          category: noticeForm.category,
          affectedYear: noticeForm.affectedYear ? parseInt(noticeForm.affectedYear) : undefined,
          affectedSemester: noticeForm.affectedSemester ? parseInt(noticeForm.affectedSemester) : undefined,
          affectedProgram: noticeForm.affectedProgram,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "✅ Notice Created", description: data.message || "Notice has been created successfully" });
        setShowNoticeDialog(false);
        setNoticeForm({ title: "", content: "", category: "general", affectedYear: "", affectedSemester: "", affectedProgram: "bsc" });
      } else {
        toast({ title: "Error", description: data.error || "Failed to create notice", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating notice:", error);
      toast({ title: "Error", description: "Failed to create notice", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  const resetFilters = () => { setFilterSemester("all"); setFilterProgram("all"); setFilterRoom("all"); setFilterDay("all"); };
  
  // Handle Add Class
  const handleAddClass = async () => {
    if (!newClassForm.courseCode.trim() || !newClassForm.courseName.trim() || !newClassForm.dayOfWeek || !newClassForm.roomId) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      const selectedRoom = rooms.find(r => r.id === newClassForm.roomId);
      
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: newClassForm.courseCode,
          courseName: newClassForm.courseName,
          dayOfWeek: newClassForm.dayOfWeek,
          startTime: newClassForm.startTime,
          endTime: newClassForm.endTime,
          roomId: newClassForm.roomId,
          roomNumber: selectedRoom?.roomNumber,
          semester: newClassForm.semester,
          program: newClassForm.program,
          classType: newClassForm.classType,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast({ title: "✅ Class Added", description: `${newClassForm.courseCode} has been added to your schedule` });
        setShowAddClassDialog(false);
        setNewClassForm({
          courseCode: "",
          courseName: "",
          dayOfWeek: "",
          startTime: "09:00",
          endTime: "10:00",
          roomId: "",
          semester: 1,
          program: "bsc",
          classType: "theory"
        });
      } else if (data.conflicts) {
        toast({ title: "⚠️ Conflicts Detected", description: data.conflicts.join(", "), variant: "destructive" });
      } else {
        toast({ title: "Error", description: data.error || "Failed to add class", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error adding class:", error);
      toast({ title: "Error", description: "Failed to add class", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const loading = status === "loading" || schedulesLoading || changesLoading || timeSlotsLoading || roomsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const { startTime: currentTimeStart, endTime: currentTimeEnd } = getCurrentTimeValues();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white py-4 md:py-5 sticky top-0 z-30 shadow-lg">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <p className="text-white/80 text-xs">Welcome back,</p>
              </div>
              <h1 className="text-lg md:text-xl font-bold truncate">{session.user?.name}</h1>
              <p className="text-white/80 text-[10px] md:text-xs">Teacher Dashboard • ICE Department</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1.5 h-8 px-3 bg-white/10" onClick={() => setShowAddClassDialog(true)}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">Add Class</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9" onClick={() => setShowNoticeDialog(true)}>
                <Megaphone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9" onClick={() => signOut({ callbackUrl: "/" })}>
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
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
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
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Semester" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {uniqueSemesters.map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>{sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Program" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {uniquePrograms.map((prog) => (
                    <SelectItem key={prog} value={prog} className="uppercase">{prog?.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRoom} onValueChange={setFilterRoom}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Room" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>{room.roomNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDay} onValueChange={setFilterDay}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Day" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {days.map((day) => (
                    <SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Showing {filteredSchedules.length} classes</p>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">Reset Filters</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="container mx-auto px-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Your Classes</h2>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button variant={viewMode === "cards" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("cards")} className="h-7 gap-1 px-2">
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Cards</span>
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="h-7 gap-1 px-2">
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
              <Button variant="outline" size="sm" onClick={resetFilters} className="mt-3">Reset Filters</Button>
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSchedules.sort((a, b) => {
              const dayOrder = days.indexOf(a.dayOfWeek?.toLowerCase() || "");
              const dayOrderB = days.indexOf(b.dayOfWeek?.toLowerCase() || "");
              if (dayOrder !== dayOrderB) return dayOrder - dayOrderB;
              return (a.startTime || "").localeCompare(b.startTime || "");
            }).map((schedule, index) => (
              <motion.div key={schedule.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <ScheduleCard
                  schedule={schedule}
                  isSelected={selectedSchedule?.id === schedule.id}
                  onSelect={() => setSelectedSchedule(selectedSchedule?.id === schedule.id ? null : schedule)}
                  onCancel={() => handleOpenCancel(schedule)}
                  onReschedule={() => handleOpenReschedule(schedule)}
                  scheduleChange={changeMap[schedule.id]}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0 divide-y divide-border">
              {filteredSchedules.sort((a, b) => {
                const dayOrder = days.indexOf(a.dayOfWeek?.toLowerCase() || "");
                const dayOrderB = days.indexOf(b.dayOfWeek?.toLowerCase() || "");
                if (dayOrder !== dayOrderB) return dayOrder - dayOrderB;
                return (a.startTime || "").localeCompare(b.startTime || "");
              }).map((schedule) => {
                const typeColors = schedule.classType === "lab" ? classColors.lab : classColors.theory;
                const isSelected = selectedSchedule?.id === schedule.id;
                const change = changeMap[schedule.id];
                const isCancelled = change?.changeType === "cancelled" && change?.isActive;
                return (
                  <div key={schedule.id}>
                    <div onClick={() => setSelectedSchedule(isSelected ? null : schedule)} className={cn("flex items-center gap-3 p-3 cursor-pointer transition-all hover:bg-muted/50", isSelected && "bg-emerald-50 dark:bg-emerald-900/20")}>
                      <div className="w-12 shrink-0">
                        <Badge variant="outline" className="text-[10px] w-full justify-center capitalize">{schedule.dayOfWeek?.substring(0, 3)}</Badge>
                      </div>
                      <div className="w-16 shrink-0">
                        <p className="text-xs font-medium">{formatTime(schedule.startTime)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium truncate", isCancelled && "line-through")}>{schedule.courseCode}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{schedule.roomNumber}</span>
                          <span>•</span>
                          <span>{schedule.semester}{schedule.semester === 1 ? 'st' : schedule.semester === 2 ? 'nd' : schedule.semester === 3 ? 'rd' : 'th'} Sem</span>
                          <span>•</span>
                          <span className="uppercase">{schedule.program}</span>
                        </div>
                      </div>
                      <Badge className={cn("text-[9px]", typeColors.badge)}>{schedule.classType === "lab" ? "LAB" : "THEORY"}</Badge>
                      {change && change.isActive && (
                        <Badge className={cn("text-[9px]", change.changeType === "cancelled" && "bg-red-500 text-white", change.changeType === "rescheduled" && "bg-amber-500 text-white")}>
                          {change.changeType === "cancelled" ? "CANCELLED" : "RESCHEDULED"}
                        </Badge>
                      )}
                    </div>
                    <AnimatePresence>
                      {isSelected && !isCancelled && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-end gap-2 px-3 pb-3">
                          <Button variant="outline" size="sm" className="text-red-600 border-red-300 bg-red-50 hover:bg-red-100 h-8 text-xs" onClick={() => handleOpenCancel(schedule)}>
                            <Ban className="w-3.5 h-3.5 mr-1.5" />Cancel
                          </Button>
                          <Button variant="outline" size="sm" className="text-cyan-600 border-cyan-300 bg-cyan-50 hover:bg-cyan-100 h-8 text-xs" onClick={() => handleOpenReschedule(schedule)}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Reschedule
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
            <DialogTitle className="flex items-center gap-2 text-red-600"><XCircle className="w-5 h-5" />Cancel Class</DialogTitle>
            <DialogDescription>Cancel {selectedSchedule?.courseCode} - {selectedSchedule?.courseName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="capitalize">{selectedSchedule?.dayOfWeek}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>{selectedSchedule?.startTime} - {selectedSchedule?.endTime}</span></div>
              <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-muted-foreground" /><span>{selectedSchedule?.semester}{selectedSchedule?.semester === 1 ? 'st' : selectedSchedule?.semester === 2 ? 'nd' : selectedSchedule?.semester === 3 ? 'rd' : 'th'} Semester ({selectedSchedule?.program?.toUpperCase()})</span></div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason for Cancellation *</Label>
              <Textarea placeholder="Please provide a reason for cancelling this class..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleCancelClass} disabled={submitting || !cancelReason.trim()}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelling...</> : <><XCircle className="w-4 h-4 mr-2" />Confirm Cancellation</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-600"><RefreshCw className="w-5 h-5" />Reschedule Class</DialogTitle>
            <DialogDescription>Reschedule {selectedSchedule?.courseCode} - {selectedSchedule?.courseName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
              <p className="font-medium text-xs mb-2 text-muted-foreground">Original Schedule</p>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="capitalize">{selectedSchedule?.dayOfWeek}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>{selectedSchedule?.startTime} - {selectedSchedule?.endTime}</span></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{selectedSchedule?.roomNumber}</span></div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">New Schedule</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">New Day *</Label>
                  <Select value={rescheduleData.newDay} onValueChange={(value) => setRescheduleData({ ...rescheduleData, newDay: value })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select day" /></SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (<SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Time Slot</Label>
                  <Select value={rescheduleData.timeSlotId} onValueChange={(value) => { setRescheduleData({ ...rescheduleData, timeSlotId: value }); setUseCustomTime(false); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select slot" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (<SelectItem key={slot.id} value={slot.id}>{slot.label} ({slot.startTime} - {slot.endTime})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="customTime" checked={useCustomTime} onChange={(e) => setUseCustomTime(e.target.checked)} className="rounded" />
                <Label htmlFor="customTime" className="text-xs">Use custom time</Label>
              </div>
              {useCustomTime && (
                <div className="grid grid-cols-2 gap-3">
                  <CustomTimePicker value={customStartTime} onChange={setCustomStartTime} label="Start Time" />
                  <CustomTimePicker value={customEndTime} onChange={setCustomEndTime} label="End Time" />
                </div>
              )}
              {rescheduleData.newDay && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Select Room {loadingRooms && <Loader2 className="w-3 h-3 animate-spin inline ml-1" />}</Label>
                  <Select value={newRoomId} onValueChange={setNewRoomId} disabled={loadingRooms}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={loadingRooms ? "Loading rooms..." : "Select room"} /></SelectTrigger>
                    <SelectContent>
                      {availableRooms.length > 0 ? (
                        availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            <div className="flex items-center gap-2">{roomTypeIcons[room.type]}{room.roomNumber}<span className="text-muted-foreground text-xs">({room.capacity} seats)</span></div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-rooms" disabled>No rooms available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {availableRooms.length === 0 && !loadingRooms && rescheduleData.newDay && (
                    <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />No rooms available for this time slot</p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason for Reschedule *</Label>
              <Textarea placeholder="Please provide a reason for rescheduling..." value={rescheduleData.reason} onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleRescheduleClass} disabled={submitting || !rescheduleData.newDay || !rescheduleData.reason} className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rescheduling...</> : <><RefreshCw className="w-4 h-4 mr-2" />Confirm Reschedule</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-emerald-500" />Create Notice</DialogTitle>
            <DialogDescription>Post an announcement for students</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Title *</Label>
              <Input placeholder="Notice title..." value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Content *</Label>
              <Textarea placeholder="Notice content..." value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={noticeForm.category} onValueChange={(v) => setNoticeForm({ ...noticeForm, category: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Program</Label>
                <Select value={noticeForm.affectedProgram} onValueChange={(v) => setNoticeForm({ ...noticeForm, affectedProgram: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">BSc</SelectItem>
                    <SelectItem value="msc">MSc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Semester (Optional)</Label>
                <Input type="number" min="1" max="8" placeholder="e.g. 1" value={noticeForm.affectedSemester} onChange={(e) => setNoticeForm({ ...noticeForm, affectedSemester: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNoticeDialog(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleCreateNotice} disabled={submitting || !noticeForm.title.trim() || !noticeForm.content.trim()} className="bg-gradient-to-r from-emerald-500 to-teal-500">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Plus className="w-4 h-4 mr-2" />Create Notice</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Class Dialog */}
      <Dialog open={showAddClassDialog} onOpenChange={setShowAddClassDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-600">
              <Plus className="w-5 h-5" />
              Add New Class
            </DialogTitle>
            <DialogDescription>
              Add a new class to your schedule. Conflicts will be automatically detected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Course Code *</Label>
                <Input placeholder="e.g. ICE-301" value={newClassForm.courseCode} onChange={(e) => setNewClassForm({ ...newClassForm, courseCode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Class Type</Label>
                <Select value={newClassForm.classType} onValueChange={(v: "theory" | "lab") => setNewClassForm({ ...newClassForm, classType: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Course Name *</Label>
              <Input placeholder="e.g. Digital Signal Processing" value={newClassForm.courseName} onChange={(e) => setNewClassForm({ ...newClassForm, courseName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Day *</Label>
                <Select value={newClassForm.dayOfWeek} onValueChange={(v) => setNewClassForm({ ...newClassForm, dayOfWeek: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select day" /></SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (<SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Room *</Label>
                <Select value={newClassForm.roomId} onValueChange={(v) => setNewClassForm({ ...newClassForm, roomId: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        <div className="flex items-center gap-2">
                          {roomTypeIcons[room.type]}
                          {room.roomNumber}
                          <span className="text-muted-foreground text-xs">({room.capacity} seats)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Start Time</Label>
                <Input type="time" value={newClassForm.startTime} onChange={(e) => setNewClassForm({ ...newClassForm, startTime: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">End Time</Label>
                <Input type="time" value={newClassForm.endTime} onChange={(e) => setNewClassForm({ ...newClassForm, endTime: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Program</Label>
                <Select value={newClassForm.program} onValueChange={(v) => setNewClassForm({ ...newClassForm, program: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">BSc</SelectItem>
                    <SelectItem value="msc">MSc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Semester</Label>
                <Select value={newClassForm.semester.toString()} onValueChange={(v) => setNewClassForm({ ...newClassForm, semester: parseInt(v) })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>{sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddClassDialog(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleAddClass} disabled={submitting || !newClassForm.courseCode || !newClassForm.courseName || !newClassForm.dayOfWeek || !newClassForm.roomId} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><Plus className="w-4 h-4 mr-2" />Add Class</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Bar */}
      <NotificationBar notifications={notifications} isOpen={showNotifications} onToggle={() => setShowNotifications(!showNotifications)} onMarkAsRead={handleMarkAsRead} />
    </div>
  );
}
