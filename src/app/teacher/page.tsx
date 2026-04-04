"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Users, BookOpen, LogOut, ChevronRight, Loader2, 
  Ban, RefreshCw, MapPin, Plus, X, Check, AlertCircle, Bell,
  Building, Timer, Edit, Send
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
import { format } from "date-fns";
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
}

interface Room {
  id: string;
  roomNumber: string;
  building: string;
  type: string;
}

const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"];

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

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || "saturday";
  const todaySchedules = schedules.filter(s => s.dayOfWeek?.toLowerCase() === today.toLowerCase() && s.isActive);

  // Format time
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Handle Cancel Class
  const handleCancelClass = async () => {
    if (!selectedSchedule || !cancelReason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for cancellation", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Create schedule change record
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
        toast({ 
          title: "Class Cancelled", 
          description: `${selectedSchedule.courseCode} has been cancelled. Students will be notified.` 
        });
        setShowCancelDialog(false);
        setCancelReason("");
        setSelectedSchedule(null);
        
        // Send notification
        await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "❌ Class Cancelled",
            body: `${selectedSchedule.courseCode} (${selectedSchedule.courseName}) has been cancelled.\nReason: ${cancelReason}\n${selectedSchedule.program.toUpperCase()} - ${selectedSchedule.year} Year, ${selectedSchedule.semester} Semester`,
            data: {
              url: "/?view=student",
              semester: selectedSchedule.semester,
              year: selectedSchedule.year,
              program: selectedSchedule.program,
              changeType: "cancelled",
              courseCode: selectedSchedule.courseCode,
              teacherName: session?.user?.name,
            }
          })
        });
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
      // Use first schedule as template for course info
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-6 md:py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-xs md:text-sm">Welcome back,</p>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">{session.user?.name}</h1>
              <p className="text-white/80 text-xs md:text-sm mt-1">Teacher Dashboard</p>
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

      {/* Quick Stats */}
      <div className="container mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Today's Classes", value: todaySchedules.length, icon: Calendar, color: "text-primary bg-primary/10" },
            { label: "Total Courses", value: new Set(schedules.map(s => s.courseCode)).size, icon: BookOpen, color: "text-green-500 bg-green-500/10" },
            { label: "Weekly Classes", value: schedules.length, icon: Users, color: "text-amber-500 bg-amber-500/10" },
            { label: "Programs", value: new Set(schedules.map(s => s.program)).size, icon: Clock, color: "text-blue-500 bg-blue-500/10" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0", stat.color)}>
                      <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg md:text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container mx-auto px-4 mt-4 md:mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Manage your classes</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {[
                { label: "Cancel Class", icon: Ban, color: "text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-200 dark:border-red-800", action: () => setShowCancelDialog(true) },
                { label: "Reschedule", icon: RefreshCw, color: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-200 dark:border-orange-800", action: () => setShowRescheduleDialog(true) },
                { label: "Change Room", icon: MapPin, color: "text-yellow-600 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-800", action: () => setShowRoomDialog(true) },
                { label: "Add Extra", icon: Plus, color: "text-green-500 bg-green-500/10 hover:bg-green-500/20 border border-green-200 dark:border-green-800", action: () => setShowExtraDialog(true) },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className={cn(
                    "flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl transition-all duration-200",
                    action.color
                  )}
                >
                  <action.icon className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-xs md:text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Today's Classes */}
      <div className="container mx-auto px-4 mt-4 md:mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg">Today&apos;s Classes</CardTitle>
                <Badge variant="outline" className="text-[10px] md:text-xs">
                  {format(new Date(), "EEE, MMM d")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {todaySchedules.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {todaySchedules.map((schedule, index) => (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50"
                    >
                      <div className={cn(
                        "w-1 h-10 md:h-12 rounded-full flex-shrink-0",
                        schedule.classType === "lab" ? "bg-purple-500" : "bg-emerald-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs md:text-sm font-semibold text-primary">
                            {schedule.courseCode}
                          </span>
                          <Badge variant="outline" className="text-[9px] md:text-[10px]">
                            {schedule.classType === "lab" ? "LAB" : "THEORY"}
                          </Badge>
                          <Badge variant="secondary" className="text-[9px] md:text-[10px]">
                            {schedule.program?.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm text-foreground truncate">{schedule.courseName}</p>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" />{schedule.roomNumber}</span>
                          <span>•</span>
                          <span>Y{schedule.year} S{schedule.semester}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs md:text-sm font-medium text-foreground">
                          {formatTime(schedule.startTime)}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          {formatTime(schedule.endTime)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-muted-foreground">
                  <Calendar className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-50" />
                  <p className="text-sm">No classes today!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* All Classes */}
      <div className="container mx-auto px-4 mt-4 md:mt-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-base md:text-lg">Your Classes</CardTitle>
              <CardDescription className="text-xs">Click on a class to manage it</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      "hover:border-primary/50 hover:bg-muted/50",
                      selectedSchedule?.id === schedule.id && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{schedule.courseCode}</span>
                          <Badge variant="outline" className="text-[10px]">{schedule.program?.toUpperCase()}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{schedule.courseName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium capitalize">{schedule.dayOfWeek?.slice(0, 3)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatTime(schedule.startTime)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cancel Class Dialog */}
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
                <p className="font-medium">{selectedSchedule.courseCode}</p>
                <p className="text-sm text-muted-foreground">{selectedSchedule.courseName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedSchedule.dayOfWeek} • {formatTime(selectedSchedule.startTime)} • {selectedSchedule.roomNumber}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason for Cancellation *</Label>
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

      {/* Reschedule Dialog */}
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
                <p className="font-medium">{selectedSchedule.courseCode}</p>
                <p className="text-sm text-muted-foreground">Current: {selectedSchedule.dayOfWeek} at {formatTime(selectedSchedule.startTime)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>New Day *</Label>
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
              <Label>New Time Slot *</Label>
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
              <Label>Reason *</Label>
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

      {/* Room Change Dialog */}
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
                <p className="font-medium">{selectedSchedule.courseCode}</p>
                <p className="text-sm text-muted-foreground">Current Room: {selectedSchedule.roomNumber}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>New Room *</Label>
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
              <Label>Reason *</Label>
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

      {/* Extra Class Dialog */}
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
              <Label>Day *</Label>
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
              <Label>Time Slot *</Label>
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
              <Label>Room *</Label>
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
              <Label>Reason</Label>
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
