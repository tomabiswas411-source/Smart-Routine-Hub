"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Calendar, Clock, Users, BookOpen, Settings, Bell, 
  LogOut, ChevronRight, Loader2, Ban, RefreshCw, MapPined, Timer, Plus
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TeacherSchedule {
  id: string;
  courseName: string;
  courseCode: string;
  roomNumber: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  year: number;
  semester: number;
  section: string;
  classType: string;
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const res = await fetch(`/api/schedules?teacherId=${session?.user?.id}`);
      const data = await res.json();
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get today's schedules
  const today = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
  const todaySchedules = schedules.filter(s => s.dayOfWeek === today);
  const upcomingSchedules = schedules.filter(s => s.dayOfWeek !== today);

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
      <div className="hero-gradient text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-white/70 text-sm">Welcome back,</p>
              <h1 className="text-2xl md:text-3xl font-bold">{session.user?.name}</h1>
              <p className="text-white/80 text-sm mt-1">Teacher Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Today's Classes", value: todaySchedules.length, icon: Calendar, color: "text-primary bg-primary/10" },
            { label: "Total Courses", value: new Set(schedules.map(s => s.courseCode)).size, icon: BookOpen, color: "text-green-500 bg-green-500/10" },
            { label: "Total Batches", value: new Set(schedules.map(s => `${s.year}-${s.section}`)).size, icon: Users, color: "text-amber-500 bg-amber-500/10" },
            { label: "Weekly Hours", value: schedules.length * 50, icon: Clock, color: "text-blue-500 bg-blue-500/10" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.color)}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container mx-auto px-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Cancel Class", icon: Ban, color: "text-red-500 bg-red-500/10 hover:bg-red-500/20" },
                { label: "Reschedule", icon: RefreshCw, color: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20" },
                { label: "Change Room", icon: MapPined, color: "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20" },
                { label: "Add Extra", icon: Plus, color: "text-green-500 bg-green-500/10 hover:bg-green-500/20" },
              ].map((action) => (
                <button
                  key={action.label}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl transition-colors",
                    action.color
                  )}
                >
                  <action.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Today's Classes */}
      <div className="container mx-auto px-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Today&apos;s Classes</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(), "EEEE, MMM d")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {todaySchedules.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedules.map((schedule, index) => (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                    >
                      <div className={cn(
                        "w-1 h-12 rounded-full",
                        schedule.classType === "lab" ? "bg-green-500" : "bg-primary"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {schedule.courseCode}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {schedule.classType === "lab" ? "LAB" : "THEORY"}
                          </Badge>
                        </div>
                        <p className="font-medium text-foreground truncate">{schedule.courseName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>Room {schedule.roomNumber}</span>
                          <span>•</span>
                          <span>Year {schedule.year}, Sec {schedule.section}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {formatTime(schedule.startTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(schedule.endTime)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No classes today! Enjoy your day off 🎉</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Schedule */}
      <div className="container mx-auto px-4 mt-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"].map((day) => {
                  const daySchedules = schedules.filter(s => s.dayOfWeek === day);
                  const isToday = day === today;
                  
                  return (
                    <div key={day} className={cn(
                      "p-3 rounded-lg border",
                      isToday ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-transparent"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "font-medium capitalize",
                          isToday && "text-primary"
                        )}>
                          {day}
                          {isToday && <span className="ml-2 text-xs">(Today)</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {daySchedules.length} classes
                        </span>
                      </div>
                      {daySchedules.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {daySchedules.map((s) => (
                            <Badge key={s.id} variant="outline" className="text-xs">
                              {s.courseCode} • {formatTime(s.startTime)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
