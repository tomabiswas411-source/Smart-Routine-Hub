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
  AlertTriangle, Megaphone, Save, Layers, Zap, Trash2, Eye
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
  useRealtimeCourses,
  type Schedule,
  type ScheduleChange,
  type TimeSlot,
  type Room,
  type Notice,
  type Course
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

// Premium 3D Color palettes with depth effects
const classColors = {
  theory: {
    bg: "bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-900/40 dark:via-emerald-900/30 dark:to-cyan-900/40",
    border: "border-teal-200/80 dark:border-teal-500/50",
    badge: "bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-white shadow-lg shadow-teal-500/40",
    glow: "shadow-[0_8px_30px_rgb(0,150,136,0.12)] hover:shadow-[0_12px_40px_rgb(0,150,136,0.18)]",
    innerGlow: "from-teal-200/30 via-transparent to-emerald-300/20",
  },
  lab: {
    bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/40 dark:via-orange-900/30 dark:to-yellow-900/40",
    border: "border-amber-200/80 dark:border-amber-500/50",
    badge: "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white shadow-lg shadow-amber-500/40",
    glow: "shadow-[0_8px_30px_rgb(245,158,11,0.12)] hover:shadow-[0_12px_40px_rgb(245,158,11,0.18)]",
    innerGlow: "from-amber-200/30 via-transparent to-orange-300/20",
  }
};

// Status styles with 3D effect
const statusStyles = {
  cancelled: { 
    bg: "bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/30", 
    text: "text-red-700 dark:text-red-300", 
    border: "border-red-300 dark:border-red-600", 
    icon: XCircle,
    glow: "shadow-lg shadow-red-500/20"
  },
  rescheduled: { 
    bg: "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/30", 
    text: "text-amber-700 dark:text-amber-300", 
    border: "border-amber-300 dark:border-amber-600", 
    icon: CalendarClock,
    glow: "shadow-lg shadow-amber-500/20"
  },
  room_changed: { 
    bg: "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/30", 
    text: "text-blue-700 dark:text-blue-300", 
    border: "border-blue-300 dark:border-blue-600", 
    icon: MapPin,
    glow: "shadow-lg shadow-blue-500/20"
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
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Select value={hour} onValueChange={(h) => onChange(`${h}:${minute}`)}>
          <SelectTrigger className="w-20 h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((h) => (
              <SelectItem key={h} value={h} className="text-sm">{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-lg font-bold text-muted-foreground">:</span>
        <Select value={minute} onValueChange={(m) => onChange(`${hour}:${m}`)}>
          <SelectTrigger className="w-20 h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700"><SelectValue /></SelectTrigger>
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
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 overflow-hidden"
    >
      <div onClick={onToggle} className="flex items-center justify-between px-4 h-14 cursor-pointer hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur-md opacity-50" />
            <Bell className="w-5 h-5 text-emerald-600 relative" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg shadow-red-500/30">{unreadCount}</span>
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
                    className={cn("p-3 rounded-xl border transition-all", notification.isRead ? "bg-muted/50 border-border" : "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800")}
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
                            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] shadow-md shadow-emerald-500/30">
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

// Schedule Card Component with Premium 3D Design
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
          "relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden",
          typeColors.bg, typeColors.border, typeColors.glow,
          isSelected && "ring-2 ring-teal-500 ring-offset-2 ring-offset-background scale-[1.02]",
          isCancelled && "opacity-60"
        )}
        onClick={onSelect}
        whileHover={{ y: -6, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* 3D Card Effect - Multi-layer gradients */}
        <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br pointer-events-none", typeColors.innerGlow)} />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/5 via-transparent to-white/40 dark:from-black/20 dark:via-transparent dark:to-white/10 pointer-events-none" />
        
        {/* Decorative corner glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 rounded-full blur-xl pointer-events-none" />
        
        {statusInfo && (
          <div className={cn("absolute -top-2 -right-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg z-10 border backdrop-blur-sm", statusInfo.style.bg, statusInfo.style.text, statusInfo.style.border, statusInfo.style.glow)}>
            <statusInfo.icon className="w-3 h-3" />
            {statusInfo.label}
          </div>
        )}
        
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={cn("font-bold text-base bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent", isCancelled && "line-through")}>{schedule.courseCode}</h3>
                <Badge className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full", typeColors.badge)}>
                  {schedule.classType === "lab" ? "LAB" : "THEORY"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">{schedule.courseName}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground bg-white/50 dark:bg-black/20 rounded-lg px-2 py-1">
              <Calendar className="w-3.5 h-3.5 text-teal-500" />
              <span className="capitalize font-medium">{schedule.dayOfWeek}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground bg-white/50 dark:bg-black/20 rounded-lg px-2 py-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium">{formatTime(schedule.startTime)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground bg-white/50 dark:bg-black/20 rounded-lg px-2 py-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-medium">{schedule.roomNumber}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground bg-white/50 dark:bg-black/20 rounded-lg px-2 py-1">
              <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-medium">{schedule.semester}{schedule.semester === 1 ? 'st' : schedule.semester === 2 ? 'nd' : schedule.semester === 3 ? 'rd' : 'th'} Sem ({schedule.program?.toUpperCase()})</span>
            </div>
          </div>
        </div>
        
        {isRescheduled && scheduleChange && wasMoved && (
          <div className={cn("relative z-10 mt-3 p-2 rounded-xl text-[10px] border backdrop-blur-sm", statusStyles.rescheduled.bg, statusStyles.rescheduled.border)}>
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
            <Button variant="outline" size="sm" className="text-red-600 border-red-300 bg-gradient-to-b from-red-50 to-rose-100 hover:from-red-100 hover:to-rose-200 h-9 text-xs font-medium shadow-md shadow-red-500/10" onClick={onCancel}>
              <Ban className="w-3.5 h-3.5 mr-1.5" />Cancel Class
            </Button>
            <Button variant="outline" size="sm" className="text-cyan-600 border-cyan-300 bg-gradient-to-b from-cyan-50 to-sky-100 hover:from-cyan-100 hover:to-sky-200 h-9 text-xs font-medium shadow-md shadow-cyan-500/10" onClick={onReschedule}>
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
  const { notices, loading: noticesLoading } = useRealtimeNotices({ limitCount: 50 }); // Increased limit for teacher dashboard
  const { courses, loading: coursesLoading } = useRealtimeCourses();

  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<string>("all");
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showAddClassDialog, setShowAddClassDialog] = useState(false);
  const [showDeleteNoticeDialog, setShowDeleteNoticeDialog] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Add class form state
  const [newClassForm, setNewClassForm] = useState({
    courseId: "",
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
  
  // Available rooms for new class (based on selected day/time)
  const [availableRoomsForNewClass, setAvailableRoomsForNewClass] = useState<{room: Room; isAvailable: boolean; occupiedBy?: { courseCode?: string; courseName?: string; teacherName?: string; startTime?: string; endTime?: string } | null}[]>([]);
  const [loadingAvailableRooms, setLoadingAvailableRooms] = useState(false);
  
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
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "", category: "general", affectedSemester: "", affectedProgram: "bsc" });

  // Auth redirect
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && session?.user?.role === "admin") router.push("/admin");
  }, [status, session, router]);

  // Convert notices to notifications
  useEffect(() => {
    if (notices.length > 0) {
      setNotifications(notices.map((n: Notice) => ({ 
        id: n.id,
        title: n.title,
        content: n.content,
        type: n.category,
        changeType: n.changeType,
        courseCode: n.content?.match(/[A-Z]+-\d+/)?.[0],
        affectedSemester: n.affectedSemester,
        affectedProgram: n.affectedProgram,
        createdAt: n.createdAt,
        isRead: false 
      })));
    }
  }, [notices]);

  // Create schedule change map
  const scheduleChangeMap = useCallback(() => {
    const map: Record<string, ScheduleChange> = {};
    changes.forEach((change) => {
      if (change.isActive && change.scheduleId) {
        if (!map[change.scheduleId] || (change.createdAt && map[change.scheduleId].createdAt && toDate(change.createdAt).getTime() > toDate(map[change.scheduleId].createdAt).getTime())) {
          map[change.scheduleId] = change;
        }
      }
    });
    return map;
  }, [changes]);

  const changeMap = scheduleChangeMap();

  // Derive teacher's courses from their schedules
  const teacherCourseIds = new Set(schedules.map(s => s.courseId));
  const teacherCourses = courses.filter(c => teacherCourseIds.has(c.id));
  const availableCoursesToAdd = courses;

  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  const todayDateString = new Date(now.getTime() - timezoneOffsetMs).toISOString().split("T")[0];

  // Get effective schedule
  const getEffectiveSchedule = useCallback((schedule: TeacherSchedule): TeacherSchedule => {
    const change = changeMap[schedule.id];
    const isEffectiveToday = change?.effectiveDate === todayDateString;
    if (change?.isActive && isEffectiveToday && (
      change.changeType === "rescheduled" ||
      change.changeType === "room_changed" ||
      change.changeType === "time_changed"
    )) {
      return {
        ...schedule,
        dayOfWeek: change.newDay || schedule.dayOfWeek,
        startTime: change.newStartTime || schedule.startTime,
        endTime: change.newEndTime || schedule.endTime,
        roomNumber: change.newRoomNumber || schedule.roomNumber,
      };
    }
    return schedule;
  }, [changeMap, todayDateString]);

  const isScheduleCancelled = useCallback((scheduleId: string): boolean => {
    const change = changeMap[scheduleId];
    return change?.changeType === "cancelled" && change?.isActive && change?.effectiveDate === todayDateString;
  }, [changeMap, todayDateString]);

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
    const result: { date: Date; dayName: string; schedules: TeacherSchedule[] }[] = [];
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

  // Fetch room availability for Add Class dialog
  const fetchAvailableRoomsForNewClass = useCallback(async (day: string, startTime: string, endTime: string) => {
    if (!day || !startTime || !endTime) { 
      setAvailableRoomsForNewClass([]); 
      return; 
    }
    setLoadingAvailableRooms(true);
    try {
      const res = await fetch(`/api/rooms/availability?day=${day}&startTime=${startTime}&endTime=${endTime}`);
      const data = await res.json();
      if (data.success) {
        setAvailableRoomsForNewClass(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching available rooms:", error);
    } finally {
      setLoadingAvailableRooms(false);
    }
  }, []);

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

  // Update available rooms for reschedule
  useEffect(() => {
    if (showRescheduleDialog && rescheduleData.newDay) {
      const { startTime, endTime } = getCurrentTimeValues();
      fetchAvailableRooms(rescheduleData.newDay, startTime, endTime);
    }
  }, [showRescheduleDialog, rescheduleData.newDay, rescheduleData.timeSlotId, customStartTime, customEndTime, useCustomTime, getCurrentTimeValues, fetchAvailableRooms]);
  
  // Update available rooms for Add Class dialog
  useEffect(() => {
    if (showAddClassDialog && newClassForm.dayOfWeek && newClassForm.startTime && newClassForm.endTime) {
      fetchAvailableRoomsForNewClass(newClassForm.dayOfWeek, newClassForm.startTime, newClassForm.endTime);
    }
  }, [showAddClassDialog, newClassForm.dayOfWeek, newClassForm.startTime, newClassForm.endTime, fetchAvailableRoomsForNewClass]);

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
    
    if (!session?.user?.id) {
      toast({ title: "Error", description: "You must be logged in to cancel a class", variant: "destructive" });
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
          teacherId: session.user.id,
          teacherName: session.user.name,
          semester: selectedSchedule.semester,
          program: selectedSchedule.program,
          changedBy: session.user.id,
          changedByName: session.user.name,
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
      toast({ title: "Error", description: "Failed to cancel class. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRescheduleClass = async () => {
    if (!selectedSchedule || !rescheduleData.newDay || !rescheduleData.reason) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    if (!session?.user?.id) {
      toast({ title: "Error", description: "You must be logged in to reschedule a class", variant: "destructive" });
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
          teacherId: session.user.id,
          teacherName: session.user.name,
          semester: selectedSchedule.semester,
          program: selectedSchedule.program,
          changedBy: session.user.id,
          changedByName: session.user.name,
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
      toast({ title: "Error", description: "Failed to reschedule class. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNotice = async () => {
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      toast({ title: "Error", description: "Please fill title and content", variant: "destructive" });
      return;
    }
    
    if (!session?.user?.id) {
      toast({ title: "Error", description: "You must be logged in to create a notice", variant: "destructive" });
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
          affectedSemester: noticeForm.affectedSemester ? parseInt(noticeForm.affectedSemester) : undefined,
          affectedProgram: noticeForm.affectedProgram,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "✅ Notice Created", description: data.message || "Notice has been created successfully" });
        setShowNoticeDialog(false);
        setNoticeForm({ title: "", content: "", category: "general", affectedSemester: "", affectedProgram: "bsc" });
      } else {
        toast({ title: "Error", description: data.error || "Failed to create notice", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating notice:", error);
      toast({ title: "Error", description: "Failed to create notice. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Notice
  const handleDeleteNotice = async () => {
    if (!selectedNotice) return;
    
    if (!session?.user?.id) {
      toast({ title: "Error", description: "You must be logged in to delete a notice", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/notices?id=${selectedNotice.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "✅ Notice Deleted", description: "The notice has been removed" });
        setShowDeleteNoticeDialog(false);
        setSelectedNotice(null);
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete notice", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast({ title: "Error", description: "Failed to delete notice. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Get my notices (notices created by this teacher)
  const myNotices = notices.filter((n: Notice) => n.postedBy === session?.user?.id);

  const handleMarkAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  const resetFilters = () => { setFilterSemester("all"); setFilterProgram("all"); setFilterRoom("all"); setFilterDay("all"); };
  
  // Handle course selection in Add Class dialog
  const handleCourseSelect = (courseId: string) => {
    if (courseId === "custom") {
      setNewClassForm({
        ...newClassForm,
        courseId: "custom",
        courseCode: "",
        courseName: "",
        classType: "theory",
        semester: 1,
        program: "bsc"
      });
    } else {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        setNewClassForm({
          ...newClassForm,
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          classType: course.type as "theory" | "lab",
          semester: course.semester || 1,
          program: course.program || "bsc"
        });
      }
    }
  };
  
  // Handle Add Class
  const handleAddClass = async () => {
    if (!newClassForm.courseCode.trim() || !newClassForm.courseName.trim() || !newClassForm.dayOfWeek || !newClassForm.roomId) {
      toast({ title: "Error", description: "Please fill all required fields (Course, Day, Room)", variant: "destructive" });
      return;
    }
    
    if (!session?.user?.id) {
      toast({ title: "Error", description: "You must be logged in to add a class", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      const selectedRoom = rooms.find(r => r.id === newClassForm.roomId);
      
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: newClassForm.courseId !== "custom" ? newClassForm.courseId : undefined,
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
          courseId: "",
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
      toast({ title: "Error", description: "Failed to add class. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const loading = status === "loading" || schedulesLoading || changesLoading || timeSlotsLoading || roomsLoading || coursesLoading || noticesLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto relative" />
          </div>
          <p className="text-muted-foreground mt-4 font-medium">Loading your dashboard...</p>
          <p className="text-xs text-muted-foreground/60 mt-2">Setting up real-time connections...</p>
        </div>
      </div>
    );
  }

  // Show error state if session is null but not loading
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Session not found</p>
          <Button onClick={() => router.push("/login")} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const { startTime: currentTimeStart, endTime: currentTimeEnd } = getCurrentTimeValues();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-20">
      {/* Header with Premium 3D Design */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.8'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-cyan-400/30 to-transparent rounded-full blur-3xl" />
        
        <div className="relative py-5 md:py-6 sticky top-0 z-30">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <div className="absolute inset-0 bg-yellow-300 blur-md opacity-50" />
                  </div>
                  <p className="text-white/80 text-xs font-medium">Welcome back,</p>
                </div>
                <h1 className="text-lg md:text-2xl font-bold text-white truncate">{session.user?.name}</h1>
                <p className="text-white/70 text-[10px] md:text-xs flex items-center gap-1.5">
                  <Layers className="w-3 h-3" />
                  Teacher Dashboard • ICE Department
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/20 gap-1.5 h-9 px-4 bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg shadow-black/10" 
                  onClick={() => setShowAddClassDialog(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Add Class</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/20 gap-1.5 h-9 px-4 bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg shadow-black/10" 
                  onClick={() => setShowNoticeDialog(true)}
                >
                  <Megaphone className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Notice</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9 bg-white/10 backdrop-blur-sm border border-white/20" onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats with 3D Cards */}
      <div className="container mx-auto px-4 -mt-3 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Today", value: next7Days[0]?.schedules.length || 0, icon: Calendar, gradient: "from-rose-400 via-pink-500 to-fuchsia-500", shadow: "shadow-rose-500/30" },
            { label: "This Week", value: filteredSchedules.length, icon: Clock, gradient: "from-cyan-400 via-sky-500 to-blue-500", shadow: "shadow-cyan-500/30" },
            { label: "Courses", value: new Set(filteredSchedules.map(s => s.courseCode)).size, icon: BookOpen, gradient: "from-emerald-400 via-teal-500 to-green-500", shadow: "shadow-emerald-500/30" },
          ].map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="shadow-xl border-0 overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
                <CardContent className="p-4 relative">
                  {/* Decorative gradient */}
                  <div className={cn("absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br blur-xl opacity-50", stat.gradient)} />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg", stat.gradient, stat.shadow)}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filters with Premium Design */}
      <div className="container mx-auto px-4 mt-4">
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl overflow-hidden">
          {/* Decorative top bar */}
          <div className="h-1 bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500" />
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/30">
                <Funnel className="w-4 h-4 text-white" />
              </div>
              Filter Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue placeholder="Semester" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {uniqueSemesters.map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>{sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue placeholder="Program" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {uniquePrograms.map((prog) => (
                    <SelectItem key={prog} value={prog} className="uppercase">{prog?.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRoom} onValueChange={setFilterRoom}>
                <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue placeholder="Room" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>{room.roomNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDay} onValueChange={setFilterDay}>
                <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue placeholder="Day" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {days.map((day) => (
                    <SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground font-medium">Showing <span className="font-bold text-foreground">{filteredSchedules.length}</span> classes</p>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs font-medium text-teal-600 hover:text-teal-700">Reset Filters</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="container mx-auto px-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Your Classes
          </h2>
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <Button variant={viewMode === "cards" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("cards")} className={cn("h-8 gap-1 px-3 rounded-lg", viewMode === "cards" && "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md")}>
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-medium">Cards</span>
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className={cn("h-8 gap-1 px-3 rounded-lg", viewMode === "list" && "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md")}>
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-medium">List</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Classes Display */}
      <div className="container mx-auto px-4 mt-3">
        {filteredSchedules.length === 0 ? (
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <CardContent className="py-12 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full blur-xl opacity-30" />
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 relative" />
              </div>
              <p className="text-muted-foreground mt-4 font-medium">No classes found</p>
              <Button variant="outline" size="sm" onClick={resetFilters} className="mt-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 shadow-lg shadow-teal-500/30">Reset Filters</Button>
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500" />
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
                    <div onClick={() => setSelectedSchedule(isSelected ? null : schedule)} className={cn("flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-muted/50", isSelected && "bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20")}>
                      <div className="w-12 shrink-0">
                        <Badge variant="outline" className="text-[10px] w-full justify-center capitalize bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">{schedule.dayOfWeek?.substring(0, 3)}</Badge>
                      </div>
                      <div className="w-16 shrink-0">
                        <p className="text-xs font-bold">{formatTime(schedule.startTime)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-semibold truncate", isCancelled && "line-through")}>{schedule.courseCode}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{schedule.roomNumber}</span>
                          <span>•</span>
                          <span>{schedule.semester}{schedule.semester === 1 ? 'st' : schedule.semester === 2 ? 'nd' : schedule.semester === 3 ? 'rd' : 'th'} Sem</span>
                          <span>•</span>
                          <span className="uppercase">{schedule.program}</span>
                        </div>
                      </div>
                      <Badge className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full", typeColors.badge)}>{schedule.classType === "lab" ? "LAB" : "THEORY"}</Badge>
                      {change && change.isActive && (
                        <Badge className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full", change.changeType === "cancelled" && "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md shadow-red-500/30", change.changeType === "rescheduled" && "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30")}>
                          {change.changeType === "cancelled" ? "CANCELLED" : "RESCHEDULED"}
                        </Badge>
                      )}
                    </div>
                    <AnimatePresence>
                      {isSelected && !isCancelled && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-end gap-2 px-4 pb-4">
                          <Button variant="outline" size="sm" className="text-red-600 border-red-300 bg-gradient-to-b from-red-50 to-rose-100 hover:from-red-100 hover:to-rose-200 h-8 text-xs shadow-md shadow-red-500/10" onClick={() => handleOpenCancel(schedule)}>
                            <Ban className="w-3.5 h-3.5 mr-1.5" />Cancel
                          </Button>
                          <Button variant="outline" size="sm" className="text-cyan-600 border-cyan-300 bg-gradient-to-b from-cyan-50 to-sky-100 hover:from-cyan-100 hover:to-sky-200 h-8 text-xs shadow-md shadow-cyan-500/10" onClick={() => handleOpenReschedule(schedule)}>
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

      {/* My Notices Section */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-emerald-500" />
            My Notices
          </h2>
          <p className="text-xs text-muted-foreground">
            {myNotices.length} notice{myNotices.length !== 1 ? 's' : ''} • Auto-delete after 30 days
          </p>
        </div>
        
        {myNotices.length === 0 ? (
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <CardContent className="py-8 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">You haven't posted any notices yet</p>
              <Button variant="outline" size="sm" onClick={() => setShowNoticeDialog(true)} className="mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                <Plus className="w-3.5 h-3.5 mr-1.5" />Create Notice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {myNotices.map((notice: Notice, index: number) => (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm truncate">{notice.title}</h3>
                          {notice.isPinned && (
                            <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5">📌 Pinned</Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {notice.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notice.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                          <span>{notice.createdAt ? format(toDate(notice.createdAt), "dd MMM yyyy, hh:mm a") : 'Just now'}</span>
                          {notice.affectedSemester && (
                            <>
                              <span>•</span>
                              <span>{notice.affectedSemester}{notice.affectedSemester === 1 ? 'st' : notice.affectedSemester === 2 ? 'nd' : notice.affectedSemester === 3 ? 'rd' : 'th'} Sem</span>
                            </>
                          )}
                          {notice.affectedProgram && (
                            <>
                              <span>•</span>
                              <span className="uppercase">{notice.affectedProgram}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0 shrink-0"
                        onClick={() => {
                          setSelectedNotice(notice);
                          setShowDeleteNoticeDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <XCircle className="w-4 h-4 text-white" />
              </div>
              Cancel Class
            </DialogTitle>
            <DialogDescription>Cancel {selectedSchedule?.courseCode} - {selectedSchedule?.courseName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl space-y-1 text-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-teal-500" /><span className="capitalize font-medium">{selectedSchedule?.dayOfWeek}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /><span>{selectedSchedule?.startTime} - {selectedSchedule?.endTime}</span></div>
              <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-purple-500" /><span>{selectedSchedule?.semester}{selectedSchedule?.semester === 1 ? 'st' : selectedSchedule?.semester === 2 ? 'nd' : selectedSchedule?.semester === 3 ? 'rd' : 'th'} Semester ({selectedSchedule?.program?.toUpperCase()})</span></div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason for Cancellation *</Label>
              <Textarea placeholder="Please provide a reason for cancelling this class..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} className="resize-none bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleCancelClass} disabled={submitting || !cancelReason.trim()} className="bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/30">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelling...</> : <><XCircle className="w-4 h-4 mr-2" />Confirm Cancellation</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-600">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              Reschedule Class
            </DialogTitle>
            <DialogDescription>Reschedule {selectedSchedule?.courseCode} - {selectedSchedule?.courseName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl space-y-1 text-sm border border-gray-200 dark:border-gray-700">
              <p className="font-medium text-xs mb-2 text-muted-foreground">Original Schedule</p>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-teal-500" /><span className="capitalize">{selectedSchedule?.dayOfWeek}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /><span>{selectedSchedule?.startTime} - {selectedSchedule?.endTime}</span></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500" /><span>{selectedSchedule?.roomNumber}</span></div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">New Schedule</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">New Day *</Label>
                  <Select value={rescheduleData.newDay} onValueChange={(value) => setRescheduleData({ ...rescheduleData, newDay: value })}>
                    <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue placeholder="Select day" /></SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (<SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Time Slot</Label>
                  <Select value={rescheduleData.timeSlotId} onValueChange={(value) => { setRescheduleData({ ...rescheduleData, timeSlotId: value }); setUseCustomTime(false); }}>
                    <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue placeholder="Select slot" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (<SelectItem key={slot.id} value={slot.id}>{slot.label} ({slot.startTime} - {slot.endTime})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="customTime" checked={useCustomTime} onChange={(e) => setUseCustomTime(e.target.checked)} className="rounded border-gray-300" />
                <Label htmlFor="customTime" className="text-xs font-medium">Use custom time</Label>
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
                    <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue placeholder={loadingRooms ? "Loading rooms..." : "Select room"} /></SelectTrigger>
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
              <Textarea placeholder="Please provide a reason for rescheduling..." value={rescheduleData.reason} onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })} rows={2} className="resize-none bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleRescheduleClass} disabled={submitting || !rescheduleData.newDay || !rescheduleData.reason} className="bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rescheduling...</> : <><RefreshCw className="w-4 h-4 mr-2" />Confirm Reschedule</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Megaphone className="w-4 h-4 text-white" />
              </div>
              Create Notice
            </DialogTitle>
            <DialogDescription>Post an announcement for students</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Title *</Label>
              <Input placeholder="Notice title..." value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Content *</Label>
              <Textarea placeholder="Notice content..." value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} rows={4} className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={noticeForm.category} onValueChange={(v) => setNoticeForm({ ...noticeForm, category: v })}>
                  <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">BSc</SelectItem>
                    <SelectItem value="msc">MSc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Semester (Optional)</Label>
              <Input type="number" min="1" max="8" placeholder="e.g. 1" value={noticeForm.affectedSemester} onChange={(e) => setNoticeForm({ ...noticeForm, affectedSemester: e.target.value })} className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNoticeDialog(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleCreateNotice} disabled={submitting || !noticeForm.title.trim() || !noticeForm.content.trim()} className="bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Plus className="w-4 h-4 mr-2" />Create Notice</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Notice Dialog */}
      <Dialog open={showDeleteNoticeDialog} onOpenChange={setShowDeleteNoticeDialog}>
        <DialogContent className="max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Trash2 className="w-4 h-4 text-white" />
              </div>
              Delete Notice
            </DialogTitle>
            <DialogDescription>Are you sure you want to delete this notice?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="font-medium text-sm truncate">{selectedNotice?.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{selectedNotice?.content}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              This action cannot be undone. The notice will be permanently removed.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteNoticeDialog(false)} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteNotice} disabled={submitting} className="bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/30">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : <><Trash2 className="w-4 h-4 mr-2" />Delete</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Class Dialog */}
      <Dialog open={showAddClassDialog} onOpenChange={setShowAddClassDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-600">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Plus className="w-4 h-4 text-white" />
              </div>
              Add New Class
            </DialogTitle>
            <DialogDescription>
              Select a course and check room availability before adding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Course Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-500" />
                Select Course *
              </Label>
              <Select value={newClassForm.courseId} onValueChange={handleCourseSelect}>
                <SelectTrigger className="h-10 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {/* Teacher's existing courses */}
                  {teacherCourses.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-teal-600 bg-teal-50 dark:bg-teal-900/30">Your Courses</div>
                      {teacherCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-1.5">{course.code}</Badge>
                            <span className="truncate">{course.name}</span>
                            <span className="text-xs text-muted-foreground">({course.type})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {/* Other available courses */}
                  {availableCoursesToAdd.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/30 mt-1">Other Courses</div>
                      {availableCoursesToAdd.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-1.5">{course.code}</Badge>
                            <span className="truncate">{course.name}</span>
                            <span className="text-xs text-muted-foreground">({course.type})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Plus className="w-4 h-4" />
                      <span>Enter custom course...</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Course Details (editable if custom) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Course Code</Label>
                <Input 
                  placeholder="e.g. ICE-301" 
                  value={newClassForm.courseCode} 
                  onChange={(e) => setNewClassForm({ ...newClassForm, courseCode: e.target.value })} 
                  className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Class Type</Label>
                <Select value={newClassForm.classType} onValueChange={(v: "theory" | "lab") => setNewClassForm({ ...newClassForm, classType: v })}>
                  <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">📖 Theory</SelectItem>
                    <SelectItem value="lab">🔬 Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-medium">Course Name</Label>
              <Input placeholder="e.g. Digital Signal Processing" value={newClassForm.courseName} onChange={(e) => setNewClassForm({ ...newClassForm, courseName: e.target.value })} className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" />
            </div>
            
            {/* Day and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Day *</Label>
                <Select value={newClassForm.dayOfWeek} onValueChange={(v) => setNewClassForm({ ...newClassForm, dayOfWeek: v })}>
                  <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue placeholder="Select day" /></SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (<SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Time Slot</Label>
                <Select 
                  value={`${newClassForm.startTime}-${newClassForm.endTime}`} 
                  onValueChange={(v) => {
                    const [start, end] = v.split('-');
                    setNewClassForm({ ...newClassForm, startTime: start, endTime: end });
                  }}
                >
                  <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.id} value={`${slot.startTime}-${slot.endTime}`}>
                        {slot.label} ({slot.startTime} - {slot.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Custom Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Start Time</Label>
                <Input type="time" value={newClassForm.startTime} onChange={(e) => setNewClassForm({ ...newClassForm, startTime: e.target.value })} className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">End Time</Label>
                <Input type="time" value={newClassForm.endTime} onChange={(e) => setNewClassForm({ ...newClassForm, endTime: e.target.value })} className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" />
              </div>
            </div>
            
            {/* Room Selection with Availability */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                Select Room *
                {loadingAvailableRooms && <Loader2 className="w-3 h-3 animate-spin" />}
              </Label>
              {newClassForm.dayOfWeek && newClassForm.startTime && newClassForm.endTime ? (
                <div className="space-y-3">
                  {/* Availability Summary */}
                  <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        {availableRoomsForNewClass.filter(r => r.isAvailable).length} Available
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">
                        {availableRoomsForNewClass.filter(r => !r.isAvailable).length} Occupied
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTime(newClassForm.startTime)} - {formatTime(newClassForm.endTime)}
                    </span>
                  </div>
                  
                  {/* Available Rooms */}
                  {availableRoomsForNewClass.filter(r => r.isAvailable).length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Available Rooms (click to select)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {availableRoomsForNewClass.filter(r => r.isAvailable).map((item) => (
                          <motion.button
                            key={item.room.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setNewClassForm({ ...newClassForm, roomId: item.room.id })}
                            className={cn(
                              "p-2.5 rounded-xl border-2 text-left transition-all",
                              newClassForm.roomId === item.room.id
                                ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 shadow-md ring-2 ring-teal-500/20"
                                : "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20 hover:border-green-400 dark:hover:border-green-600"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                {roomTypeIcons[item.room.type]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.room.roomNumber}</p>
                                <p className="text-[10px] text-muted-foreground">{item.room.capacity} seats • {item.room.type}</p>
                              </div>
                              {newClassForm.roomId === item.room.id && (
                                <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">No rooms available at this time</p>
                    </div>
                  )}
                  
                  {/* Occupied Rooms */}
                  {availableRoomsForNewClass.filter(r => !r.isAvailable).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Occupied Rooms
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {availableRoomsForNewClass.filter(r => !r.isAvailable).map((item) => {
                          const occupied = item.occupiedBy as { courseCode?: string; courseName?: string; teacherName?: string; startTime?: string; endTime?: string } | null;
                          return (
                            <div
                              key={item.room.id}
                              className="p-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                                  {roomTypeIcons[item.room.type]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.room.roomNumber}</p>
                                  <p className="text-[10px] text-red-600 dark:text-red-400 truncate">
                                    {occupied?.courseCode} • {occupied?.teacherName}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-[9px] border-red-300 text-red-600 shrink-0">
                                  {occupied?.startTime}-{occupied?.endTime}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Select Day & Time First</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Room availability will be shown based on your selected time slot</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Program and Semester */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Program</Label>
                <Select value={newClassForm.program} onValueChange={(v) => setNewClassForm({ ...newClassForm, program: v })}>
                  <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">BSc</SelectItem>
                    <SelectItem value="msc">MSc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Semester</Label>
                <Select value={newClassForm.semester.toString()} onValueChange={(v) => setNewClassForm({ ...newClassForm, semester: parseInt(v) })}>
                  <SelectTrigger className="h-9 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(newClassForm.program === "msc" ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 7, 8]).map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>{sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddClassDialog(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleAddClass} disabled={submitting || !newClassForm.courseCode || !newClassForm.courseName || !newClassForm.dayOfWeek || !newClassForm.roomId} className="bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/30">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><Plus className="w-4 h-4 mr-2" />Add Class</>}
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
