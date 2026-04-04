"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Users, BookOpen, LogOut, ChevronRight, Loader2, 
  Ban, RefreshCw, MapPin, Plus, X, Check, AlertCircle, Bell,
  Building, Timer, Edit, Send, ChevronLeft, ChevronDown, 
  AlignJustify, Grid3X3, AlignLeft, BellOff, Trash2, CheckCircle
} from "lucide-react";
import { signOut } from "next-auth/react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday"];

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

// Notification Center Component for Teacher Dashboard
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
      await fetch(`/api/notifications?id=${notificationId}`, { method: "DELETE" });
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
      {/* Notification Badge in Header */}
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

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <span className="font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge className="bg-white text-emerald-600 text-xs">{unreadCount}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-white hover:bg-white/20 h-8 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
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
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm font-medium leading-tight",
                              !notification.isRead && "text-foreground"
                            )}>
                              {notification.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BellOff className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">No notifications</p>
                    <p className="text-xs mt-1">You're all caught up!</p>
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

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "list" | "timeline">("cards");
  
  // Dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showExtraDialog, setShowExtraDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleData, setRescheduleData] = useState({
    newDay: "",
    newTimeSlotId: "",
    reason: ""
  });
  const [newRoomId, setNewRoomId] = useState("");
  const [roomChangeReason, setRoomChangeReason] = useState("");
  const [extraClassData, setExtraClassData] = useState({
    day: "",
    timeSlotId: "",
    roomId: "",
    reason: ""
  });

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

  // Get today's schedules
  const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || "sunday";
  const todaySchedules = schedules.filter(s => s.dayOfWeek?.toLowerCase() === today.toLowerCase() && s.isActive);

  // Group schedules by day for weekly view
  const schedulesByDay: Record<string, TeacherSchedule[]> = {};
  days.forEach((day) => {
    schedulesByDay[day] = schedules
      .filter((s) => s.dayOfWeek?.toLowerCase() === day.toLowerCase() && s.isActive)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  });

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
      // Create notification record
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

      // Also send push notification
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: changeType === "cancelled" ? "❌ Class Cancelled" :
                 changeType === "rescheduled" ? "🔄 Class Rescheduled" :
                 changeType === "room_changed" ? "📍 Room Changed" :
                 "📢 Extra Class Added",
          body: `${schedule.courseCode}: ${details.message || ""}`,
          data: {
            url: "/?view=student",
            semester: schedule.semester,
            year: schedule.year,
            program: schedule.program,
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
        // Create notifications for students
        await createStudentNotifications("cancelled", selectedSchedule, {
          message: `Cancelled: ${selectedSchedule.dayOfWeek} at ${formatTime(selectedSchedule.startTime)}\nReason: ${cancelReason}`
        });
        
        toast({ 
          title: "Class Cancelled", 
          description: `${selectedSchedule.courseCode} has been cancelled. Students will be notified.` 
        });
        setShowCancelDialog(false);
        setCancelReason("");
        setSelectedSchedule(null);
      }
    } catch (error) {
      console.error("Error cancelling class:", error);
      toast({ title: "Error", description: "Failed to cancel class", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reschedule Class
  const handleRescheduleClass = async () => {
    if (!selectedSchedule || !rescheduleData.newDay || !rescheduleData.newTimeSlotId || !rescheduleData.reason) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const newTimeSlot = timeSlots.find(t => t.id === rescheduleData.newTimeSlotId);
    if (!newTimeSlot) return;

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
          newStartTime: newTimeSlot.startTime,
          newEndTime: newTimeSlot.endTime,
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
        // Create notifications for students
        await createStudentNotifications("rescheduled", selectedSchedule, {
          message: `Moved from ${selectedSchedule.dayOfWeek} to ${rescheduleData.newDay} at ${formatTime(newTimeSlot.startTime)}\nReason: ${rescheduleData.reason}`
        });
        
        toast({ 
          title: "Class Rescheduled", 
          description: `${selectedSchedule.courseCode} has been rescheduled to ${rescheduleData.newDay}` 
        });
        setShowRescheduleDialog(false);
        setRescheduleData({ newDay: "", newTimeSlotId: "", reason: "" });
        setSelectedSchedule(null);
      }
    } catch (error) {
      console.error("Error rescheduling class:", error);
      toast({ title: "Error", description: "Failed to reschedule class", variant: "destructive" });
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
        // Create notifications for students
        await createStudentNotifications("room_changed", selectedSchedule, {
          message: `Room changed from ${selectedSchedule.roomNumber} to ${newRoom.roomNumber}\nReason: ${roomChangeReason}`
        });
        
        toast({ 
          title: "Room Changed", 
          description: `${selectedSchedule.courseCode} moved to ${newRoom.roomNumber}` 
        });
        setShowRoomDialog(false);
        setNewRoomId("");
        setRoomChangeReason("");
        setSelectedSchedule(null);
      }
    } catch (error) {
      console.error("Error changing room:", error);
      toast({ title: "Error", description: "Failed to change room", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Extra Class
  const handleAddExtraClass = async () => {
    if (!extraClassData.day || !extraClassData.timeSlotId || !extraClassData.roomId) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const timeSlot = timeSlots.find(t => t.id === extraClassData.timeSlotId);
    const room = rooms.find(r => r.id === extraClassData.roomId);
    
    if (!timeSlot || !room || schedules.length === 0) return;

    setSubmitting(true);
    try {
      const template = schedules[0];
      
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: template.courseId,
          courseName: template.courseName,
          courseCode: template.courseCode,
          teacherId: session?.user?.id,
          teacherName: session?.user?.name,
          roomId: extraClassData.roomId,
          roomNumber: room.roomNumber,
          timeSlotId: extraClassData.timeSlotId,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          dayOfWeek: extraClassData.day,
          year: template.year,
          semester: template.semester,
          program: template.program,
          classType: template.classType,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Create notifications for students
        await createStudentNotifications("extra_class", template, {
          message: `Extra class on ${extraClassData.day} at ${formatTime(timeSlot.startTime)} in ${room.roomNumber}\n${extraClassData.reason ? `Reason: ${extraClassData.reason}` : ""}`
        });
        
        toast({ 
          title: "Extra Class Added", 
          description: `Extra class scheduled for ${extraClassData.day}` 
        });
        setShowExtraDialog(false);
        setExtraClassData({ day: "", timeSlotId: "", roomId: "", reason: "" });
        fetchTeacherData();
      }
    } catch (error) {
      console.error("Error adding extra class:", error);
      toast({ title: "Error", description: "Failed to add extra class", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 md:py-6 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-xs">Welcome back,</p>
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold truncate">{session.user?.name}</h1>
              <p className="text-white/80 text-[10px] md:text-xs">Teacher Dashboard</p>
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
            { label: "Today", value: todaySchedules.length, icon: Calendar, color: "text-primary bg-primary/10" },
            { label: "Courses", value: new Set(schedules.map(s => s.courseCode)).size, icon: BookOpen, color: "text-green-500 bg-green-500/10" },
            { label: "Weekly", value: schedules.length, icon: Users, color: "text-amber-500 bg-amber-500/10" },
            { label: "Programs", value: new Set(schedules.map(s => s.program)).size, icon: Clock, color: "text-blue-500 bg-blue-500/10" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.color)}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-lg md:text-xl font-bold">{stat.value}</p>
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
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Cancel", icon: Ban, color: "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", action: () => setShowCancelDialog(true) },
                { label: "Reschedule", icon: RefreshCw, color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800", action: () => setShowRescheduleDialog(true) },
                { label: "Room", icon: MapPin, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800", action: () => setShowRoomDialog(true) },
                { label: "Extra", icon: Plus, color: "text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800", action: () => setShowExtraDialog(true) },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl transition-all border",
                    action.color
                  )}
                >
                  <action.icon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-[10px] md:text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <div className="container mx-auto px-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Weekly Schedule</h2>
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
            <Button
              variant={viewMode === "timeline" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("timeline")}
              className="h-7 gap-1 px-2"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Timeline</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Display */}
      <div className="container mx-auto px-4 mt-3">
        {/* Cards View */}
        {viewMode === "cards" && (
          <div className="space-y-3">
            {days.map((day) => {
              const daySchedules = schedulesByDay[day] || [];
              const isCurrentDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === day.toLowerCase();
              
              return (
                <Card key={day} className={cn(isCurrentDay && "border-emerald-500 border-2")}>
                  <CardHeader className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={cn(
                        "text-sm capitalize",
                        isCurrentDay && "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {day}
                        {isCurrentDay && (
                          <Badge className="ml-2 bg-emerald-500 text-white text-[10px]">Today</Badge>
                        )}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px]">{daySchedules.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    {daySchedules.length > 0 ? (
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            onClick={() => setSelectedSchedule(schedule)}
                            className={cn(
                              "p-2.5 rounded-lg border cursor-pointer transition-all",
                              "hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
                              selectedSchedule?.id === schedule.id && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
                              schedule.classType === "lab"
                                ? "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10"
                                : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-xs">{schedule.courseCode}</span>
                                  <Badge variant="outline" className="text-[9px] px-1">
                                    {schedule.classType === "lab" ? "LAB" : "THEORY"}
                                  </Badge>
                                  <Badge variant="secondary" className="text-[9px] px-1">
                                    {schedule.program?.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{schedule.courseName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(schedule.startTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {schedule.roomNumber}
                              </span>
                              <span>Y{schedule.year} S{schedule.semester}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-3">No classes</p>
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
            <CardContent className="p-0 divide-y divide-border">
              {schedules.length > 0 ? (
                schedules
                  .filter(s => s.isActive)
                  .sort((a, b) => {
                    const dayOrder = days.indexOf(a.dayOfWeek?.toLowerCase() || "");
                    const dayOrderB = days.indexOf(b.dayOfWeek?.toLowerCase() || "");
                    if (dayOrder !== dayOrderB) return dayOrder - dayOrderB;
                    return (a.startTime || "").localeCompare(b.startTime || "");
                  })
                  .map((schedule) => (
                    <div
                      key={schedule.id}
                      onClick={() => setSelectedSchedule(schedule)}
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer transition-all",
                        "hover:bg-muted/50",
                        selectedSchedule?.id === schedule.id && "bg-emerald-50 dark:bg-emerald-900/20"
                      )}
                    >
                      <div className="w-12 shrink-0">
                        <Badge variant="outline" className="text-[10px] w-full justify-center capitalize">
                          {schedule.dayOfWeek?.substring(0, 3)}
                        </Badge>
                      </div>
                      <div className="w-16 shrink-0">
                        <p className="text-xs font-medium">{formatTime(schedule.startTime)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatTime(schedule.endTime)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{schedule.courseCode}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{schedule.roomNumber}</p>
                      </div>
                      <Badge variant={schedule.classType === "lab" ? "secondary" : "default"} className="text-[10px]">
                        {schedule.classType}
                      </Badge>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No classes found</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-4">
              {days.map((day) => {
                const daySchedules = schedulesByDay[day] || [];
                const isCurrentDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === day.toLowerCase();
                
                return (
                  <div key={day} className="relative pl-10">
                    <div className={cn(
                      "absolute left-2 w-4 h-4 rounded-full border-2 border-background",
                      isCurrentDay ? "bg-emerald-500" : "bg-muted"
                    )} />
                    <div className="mb-2">
                      <h3 className={cn(
                        "font-semibold text-sm capitalize",
                        isCurrentDay && "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {day}
                        {isCurrentDay && (
                          <Badge className="ml-2 bg-emerald-500 text-white text-[10px]">Today</Badge>
                        )}
                      </h3>
                    </div>
                    {daySchedules.length > 0 ? (
                      <div className="space-y-2">
                        {daySchedules.map((schedule) => (
                          <div key={schedule.id} className="relative">
                            <div className="absolute -left-6 top-3 w-3 h-0.5 bg-border" />
                            <div
                              onClick={() => setSelectedSchedule(schedule)}
                              className={cn(
                                "p-2.5 rounded-lg border cursor-pointer transition-all",
                                "hover:border-emerald-500",
                                selectedSchedule?.id === schedule.id && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
                                schedule.classType === "lab"
                                  ? "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10"
                                  : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-xs">{schedule.courseCode}</span>
                                  <p className="text-[10px] text-muted-foreground truncate">{schedule.courseName}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-[10px] font-medium">{formatTime(schedule.startTime)}</p>
                                  <p className="text-[10px] text-muted-foreground">{schedule.roomNumber}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground pl-2 py-2">No classes</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Class Actions */}
      {selectedSchedule && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-20"
        >
          <div className="container mx-auto">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{selectedSchedule.courseCode}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedSchedule.courseName} • {selectedSchedule.dayOfWeek} • {formatTime(selectedSchedule.startTime)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setShowCancelDialog(true);
                  }}
                  className="gap-1 h-8"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRescheduleDialog(true);
                  }}
                  className="gap-1 h-8"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reschedule</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRoomDialog(true);
                  }}
                  className="gap-1 h-8"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Room</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSchedule(null)}
                  className="h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Dialogs */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Ban className="w-5 h-5" />
              Cancel Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSchedule && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{selectedSchedule.courseCode}</p>
                <p className="text-xs text-muted-foreground">{selectedSchedule.courseName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedSchedule.dayOfWeek} • {formatTime(selectedSchedule.startTime)} • {selectedSchedule.roomNumber}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm">Reason for Cancellation *</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Students will be notified via push notification
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCancelClass} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
              Cancel Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-500">
              <RefreshCw className="w-5 h-5" />
              Reschedule Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSchedule && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{selectedSchedule.courseCode}</p>
                <p className="text-xs text-muted-foreground">Current: {selectedSchedule.dayOfWeek} at {formatTime(selectedSchedule.startTime)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm">New Day *</Label>
              <Select value={rescheduleData.newDay} onValueChange={(v) => setRescheduleData({...rescheduleData, newDay: v})}>
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
            <div className="space-y-2">
              <Label className="text-sm">New Time Slot *</Label>
              <Select value={rescheduleData.newTimeSlotId} onValueChange={(v) => setRescheduleData({...rescheduleData, newTimeSlotId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.filter(t => !t.isBreak).map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.label} ({formatTime(slot.startTime)} - {formatTime(slot.endTime)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Reason *</Label>
              <Textarea
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({...rescheduleData, reason: e.target.value})}
                placeholder="Enter reason for rescheduling..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>Cancel</Button>
            <Button onClick={handleRescheduleClass} disabled={submitting} className="bg-orange-500 hover:bg-orange-600">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <MapPin className="w-5 h-5" />
              Change Room
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSchedule && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{selectedSchedule.courseCode}</p>
                <p className="text-xs text-muted-foreground">Current Room: {selectedSchedule.roomNumber}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm">New Room *</Label>
              <Select value={newRoomId} onValueChange={setNewRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.roomNumber} ({room.type}) - {room.building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Reason *</Label>
              <Textarea
                value={roomChangeReason}
                onChange={(e) => setRoomChangeReason(e.target.value)}
                placeholder="Enter reason for room change..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoomDialog(false)}>Cancel</Button>
            <Button onClick={handleRoomChange} disabled={submitting} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
              Change Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExtraDialog} onOpenChange={setShowExtraDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <Plus className="w-5 h-5" />
              Add Extra Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm">Day *</Label>
              <Select value={extraClassData.day} onValueChange={(v) => setExtraClassData({...extraClassData, day: v})}>
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
            <div className="space-y-2">
              <Label className="text-sm">Time Slot *</Label>
              <Select value={extraClassData.timeSlotId} onValueChange={(v) => setExtraClassData({...extraClassData, timeSlotId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.filter(t => !t.isBreak).map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.label} ({formatTime(slot.startTime)} - {formatTime(slot.endTime)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Room *</Label>
              <Select value={extraClassData.roomId} onValueChange={(v) => setExtraClassData({...extraClassData, roomId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.roomNumber} ({room.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Reason</Label>
              <Input
                value={extraClassData.reason}
                onChange={(e) => setExtraClassData({...extraClassData, reason: e.target.value})}
                placeholder="Optional reason for extra class"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtraDialog(false)}>Cancel</Button>
            <Button onClick={handleAddExtraClass} disabled={submitting} className="bg-green-500 hover:bg-green-600">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
