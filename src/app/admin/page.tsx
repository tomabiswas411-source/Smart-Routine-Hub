"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, BookOpen, DoorOpen, Calendar, Settings, Bell, 
  LogOut, Loader2, Plus, Clock, AlertCircle,
  Check, X, Edit, Trash2, Search, Save,
  LayoutDashboard, ChevronLeft, Key, Mail, Phone,
  MapPin, FileText, GraduationCap, Building
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Types
interface Stats {
  totalTeachers: number;
  activeCourses: number;
  totalRooms: number;
  totalSchedules: number;
  pendingNotices: number;
  currentSemester: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  designation?: string;
  department: string;
  phone?: string;
  officeRoom?: string;
  bio?: string;
  role: string;
  isActive: boolean;
}

interface Course {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  type: string;
  year: number;
  semester: number;
  isActive: boolean;
}

interface Room {
  id: string;
  roomNumber: string;
  building?: string;
  type: string;
  capacity: number;
  isActive: boolean;
}

interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  slotOrder: number;
  isActive: boolean;
}

interface Schedule {
  id: string;
  courseId: string;
  teacherId: string;
  roomId: string;
  timeSlotId: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  roomNumber: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  year: number;
  semester: number;
  section: string;
  classType: string;
  isActive: boolean;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  isApproved: boolean;
  isPinned: boolean;
  postedByName: string;
  createdAt: unknown;
}

type ActiveSection = "dashboard" | "teachers" | "courses" | "rooms" | "schedules" | "notices" | "settings";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  // State
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog States
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [teacherForm, setTeacherForm] = useState({
    fullName: "",
    email: "",
    designation: "",
    phone: "",
    officeRoom: "",
    bio: "",
    password: "",
  });
  
  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    creditHours: 3,
    type: "theory",
    year: 1,
    semester: 1,
  });
  
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    building: "",
    type: "classroom",
    capacity: 60,
  });
  
  const [scheduleForm, setScheduleForm] = useState({
    courseId: "",
    teacherId: "",
    roomId: "",
    timeSlotId: "",
    dayOfWeek: "saturday",
    year: 1,
    semester: 1,
    section: "A",
  });
  
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    content: "",
    category: "general",
    isPinned: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/teacher");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchAllData();
    }
  }, [session]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, teachersRes, coursesRes, roomsRes, schedulesRes, noticesRes, timeSlotsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/teachers"),
        fetch("/api/courses"),
        fetch("/api/rooms"),
        fetch("/api/schedules"),
        fetch("/api/notices?limit=50"),
        fetch("/api/timeslots"),
      ]);
      
      const statsData = await statsRes.json();
      const teachersData = await teachersRes.json();
      const coursesData = await coursesRes.json();
      const roomsData = await roomsRes.json();
      const schedulesData = await schedulesRes.json();
      const noticesData = await noticesRes.json();
      const timeSlotsData = await timeSlotsRes.json();
      
      if (statsData.success) setStats(statsData.data);
      if (teachersData.success) setTeachers(teachersData.data);
      if (coursesData.success) setCourses(coursesData.data);
      if (roomsData.success) setRooms(roomsData.data);
      if (schedulesData.success) setSchedules(schedulesData.data);
      if (noticesData.success) setNotices(noticesData.data);
      if (timeSlotsData.success) setTimeSlots(timeSlotsData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Teacher CRUD
  const handleSaveTeacher = async () => {
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/user?id=${(editingItem as User).id}` : "/api/user";
      const method = editingItem ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...teacherForm,
          role: "teacher",
          department: "Information & Communication Engineering",
          isActive: true,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast({
          title: editingItem ? "Teacher updated" : "Teacher added",
          description: `${teacherForm.fullName} has been ${editingItem ? "updated" : "added"} successfully.`,
        });
        setShowTeacherDialog(false);
        resetTeacherForm();
        fetchAllData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save teacher. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    
    try {
      const res = await fetch(`/api/user?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Teacher deleted", description: "Teacher has been removed." });
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete teacher.", variant: "destructive" });
    }
  };

  const resetTeacherForm = () => {
    setTeacherForm({ fullName: "", email: "", designation: "", phone: "", officeRoom: "", bio: "", password: "" });
    setEditingItem(null);
  };

  // Course CRUD
  const handleSaveCourse = async () => {
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/courses?id=${(editingItem as Course).id}` : "/api/courses";
      const method = editingItem ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...courseForm, isActive: true }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast({ title: editingItem ? "Course updated" : "Course added" });
        setShowCourseDialog(false);
        resetCourseForm();
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to save course.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`/api/courses?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Course deleted" });
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete course.", variant: "destructive" });
    }
  };

  const resetCourseForm = () => {
    setCourseForm({ name: "", code: "", creditHours: 3, type: "theory", year: 1, semester: 1 });
    setEditingItem(null);
  };

  // Room CRUD
  const handleSaveRoom = async () => {
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/rooms?id=${(editingItem as Room).id}` : "/api/rooms";
      const method = editingItem ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...roomForm, isActive: true }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast({ title: editingItem ? "Room updated" : "Room added" });
        setShowRoomDialog(false);
        resetRoomForm();
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to save room.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      const res = await fetch(`/api/rooms?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Room deleted" });
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete room.", variant: "destructive" });
    }
  };

  const resetRoomForm = () => {
    setRoomForm({ roomNumber: "", building: "", type: "classroom", capacity: 60 });
    setEditingItem(null);
  };

  // Schedule CRUD
  const handleSaveSchedule = async () => {
    setSubmitting(true);
    try {
      const course = courses.find(c => c.id === scheduleForm.courseId);
      const teacher = teachers.find(t => t.id === scheduleForm.teacherId);
      const room = rooms.find(r => r.id === scheduleForm.roomId);
      const timeSlot = timeSlots.find(t => t.id === scheduleForm.timeSlotId);
      
      if (!course || !teacher || !room || !timeSlot) {
        throw new Error("Invalid selection");
      }
      
      const scheduleData = {
        ...scheduleForm,
        courseName: course.name,
        courseCode: course.code,
        teacherName: teacher.fullName,
        roomNumber: room.roomNumber,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        classType: course.type,
        isActive: true,
      };
      
      const url = editingItem ? `/api/schedules?id=${(editingItem as Schedule).id}` : "/api/schedules";
      const method = editingItem ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });
      
      const data = await res.json();
      if (data.success) {
        toast({ title: editingItem ? "Schedule updated" : "Schedule added" });
        setShowScheduleDialog(false);
        resetScheduleForm();
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to save schedule.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const res = await fetch(`/api/schedules?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Schedule deleted" });
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete schedule.", variant: "destructive" });
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({ courseId: "", teacherId: "", roomId: "", timeSlotId: "", dayOfWeek: "saturday", year: 1, semester: 1, section: "A" });
    setEditingItem(null);
  };

  // Notice CRUD
  const handleSaveNotice = async () => {
    setSubmitting(true);
    try {
      const noticeData = {
        ...noticeForm,
        postedBy: session?.user?.id,
        postedByName: session?.user?.name,
        isApproved: true,
        isAutoGenerated: false,
      };
      
      const url = editingItem ? `/api/notices?id=${(editingItem as Notice).id}` : "/api/notices";
      const method = editingItem ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noticeData),
      });
      
      const data = await res.json();
      if (data.success) {
        toast({ title: editingItem ? "Notice updated" : "Notice posted" });
        setShowNoticeDialog(false);
        resetNoticeForm();
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to save notice.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveNotice = async (id: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/notices?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: approve }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: approve ? "Notice approved" : "Notice rejected" });
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to update notice.", variant: "destructive" });
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
      const res = await fetch(`/api/notices?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Notice deleted" });
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete notice.", variant: "destructive" });
    }
  };

  const resetNoticeForm = () => {
    setNoticeForm({ title: "", content: "", category: "general", isPinned: false });
    setEditingItem(null);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return null;
  }

  const navItems: { id: ActiveSection; label: string; icon: typeof Users }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "teachers", label: "Teachers", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "rooms", label: "Rooms", icon: DoorOpen },
    { id: "schedules", label: "Schedules", icon: Calendar },
    { id: "notices", label: "Notices", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col z-50">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg hero-gradient flex items-center justify-center">
              <span className="text-white font-bold">ICE</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Admin Panel</p>
              <p className="text-xs text-muted-foreground">ICE-RU</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">ICE</span>
            </div>
            <span className="font-semibold">Admin</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="p-4 md:p-6 space-y-6">
          <AnimatePresence mode="wait">
            {/* Dashboard */}
            {activeSection === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h1 className="text-2xl font-bold">Welcome, {session.user?.name}</h1>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: "Teachers", value: stats?.totalTeachers || 0, icon: Users, color: "text-primary bg-primary/10" },
                    { label: "Courses", value: stats?.activeCourses || 0, icon: BookOpen, color: "text-green-500 bg-green-500/10" },
                    { label: "Rooms", value: stats?.totalRooms || 0, icon: DoorOpen, color: "text-amber-500 bg-amber-500/10" },
                    { label: "Schedules", value: stats?.totalSchedules || 0, icon: Calendar, color: "text-blue-500 bg-blue-500/10" },
                    { label: "Pending", value: stats?.pendingNotices || 0, icon: AlertCircle, color: "text-red-500 bg-red-500/10" },
                    { label: "Semester", value: stats?.currentSemester?.split(" ")[0] || "-", icon: Clock, color: "text-purple-500 bg-purple-500/10" },
                  ].map((stat, index) => (
                    <Card key={stat.label}>
                      <CardContent className="p-4">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", stat.color)}>
                          <stat.icon className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => { resetTeacherForm(); setShowTeacherDialog(true); }}>
                    <Plus className="w-5 h-5" />
                    <span>Add Teacher</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => { resetCourseForm(); setShowCourseDialog(true); }}>
                    <Plus className="w-5 h-5" />
                    <span>Add Course</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => { resetScheduleForm(); setShowScheduleDialog(true); }}>
                    <Plus className="w-5 h-5" />
                    <span>Add Schedule</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => { resetNoticeForm(); setShowNoticeDialog(true); }}>
                    <Plus className="w-5 h-5" />
                    <span>Post Notice</span>
                  </Button>
                </div>

                {/* Recent Notices */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Notices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {notices.slice(0, 5).map((notice) => (
                      <div key={notice.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted">
                        <div className={cn("w-2 h-2 rounded-full mt-2", notice.isApproved ? "bg-green-500" : "bg-amber-500")} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{notice.title}</p>
                          <p className="text-xs text-muted-foreground">{format(toDate(notice.createdAt), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Teachers */}
            {activeSection === "teachers" && (
              <motion.div
                key="teachers"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Manage Teachers</h2>
                  <Button onClick={() => { resetTeacherForm(); setShowTeacherDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Teacher
                  </Button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teachers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="grid gap-3">
                  {teachers
                    .filter(t => t.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((teacher) => (
                    <Card key={teacher.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{teacher.fullName}</p>
                            <p className="text-sm text-muted-foreground">{teacher.designation} • {teacher.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(teacher);
                              setTeacherForm({
                                fullName: teacher.fullName,
                                email: teacher.email,
                                designation: teacher.designation || "",
                                phone: teacher.phone || "",
                                officeRoom: teacher.officeRoom || "",
                                bio: teacher.bio || "",
                                password: "",
                              });
                              setShowTeacherDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleDeleteTeacher(teacher.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Courses */}
            {activeSection === "courses" && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Manage Courses</h2>
                  <Button onClick={() => { resetCourseForm(); setShowCourseDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </Button>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  {courses.map((course) => (
                    <Card key={course.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{course.code}</Badge>
                            <Badge variant={course.type === "theory" ? "default" : "secondary"}>
                              {course.type}
                            </Badge>
                          </div>
                          <p className="font-medium mt-1">{course.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Year {course.year}, Sem {course.semester} • {course.creditHours} Credits
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(course);
                              setCourseForm({
                                name: course.name,
                                code: course.code,
                                creditHours: course.creditHours,
                                type: course.type,
                                year: course.year,
                                semester: course.semester,
                              });
                              setShowCourseDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Rooms */}
            {activeSection === "rooms" && (
              <motion.div
                key="rooms"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Manage Rooms</h2>
                  <Button onClick={() => { resetRoomForm(); setShowRoomDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room
                  </Button>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {rooms.map((room) => (
                    <Card key={room.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-primary" />
                            <span className="font-bold">{room.roomNumber}</span>
                          </div>
                          <Badge variant={room.type === "lab" ? "secondary" : "outline"}>
                            {room.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{room.building} • Capacity: {room.capacity}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem(room);
                              setRoomForm({
                                roomNumber: room.roomNumber,
                                building: room.building || "",
                                type: room.type,
                                capacity: room.capacity,
                              });
                              setShowRoomDialog(true);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Schedules */}
            {activeSection === "schedules" && (
              <motion.div
                key="schedules"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Manage Schedules</h2>
                  <Button onClick={() => { resetScheduleForm(); setShowScheduleDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Schedule
                  </Button>
                </div>
                
                <div className="grid gap-3">
                  {schedules.map((schedule) => (
                    <Card key={schedule.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold",
                            schedule.classType === "lab" ? "bg-purple-500" : "bg-primary"
                          )}>
                            {schedule.courseCode.split("-")[1]?.slice(0, 2) || "CL"}
                          </div>
                          <div>
                            <p className="font-medium">{schedule.courseName}</p>
                            <p className="text-sm text-muted-foreground">
                              {schedule.teacherName} • {schedule.roomNumber} • {schedule.dayOfWeek}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {schedule.startTime} - {schedule.endTime} • Year {schedule.year}, Sem {schedule.semester}, Sec {schedule.section}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(schedule);
                              setScheduleForm({
                                courseId: schedule.courseId,
                                teacherId: schedule.teacherId,
                                roomId: schedule.roomId,
                                timeSlotId: schedule.timeSlotId,
                                dayOfWeek: schedule.dayOfWeek,
                                year: schedule.year,
                                semester: schedule.semester,
                                section: schedule.section,
                              });
                              setShowScheduleDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Notices */}
            {activeSection === "notices" && (
              <motion.div
                key="notices"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Manage Notices</h2>
                  <Button onClick={() => { resetNoticeForm(); setShowNoticeDialog(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Notice
                  </Button>
                </div>
                
                <div className="grid gap-3">
                  {notices.map((notice) => (
                    <Card key={notice.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{notice.category}</Badge>
                              <Badge variant={notice.isApproved ? "default" : "secondary"}>
                                {notice.isApproved ? "Approved" : "Pending"}
                              </Badge>
                              {notice.isPinned && <Badge variant="destructive">Pinned</Badge>}
                            </div>
                            <p className="font-medium">{notice.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{notice.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              By {notice.postedByName} • {format(toDate(notice.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {!notice.isApproved && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-green-500"
                                  onClick={() => handleApproveNotice(notice.id, true)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-500"
                                  onClick={() => handleApproveNotice(notice.id, false)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingItem(notice);
                                setNoticeForm({
                                  title: notice.title,
                                  content: notice.content,
                                  category: notice.category,
                                  isPinned: notice.isPinned,
                                });
                                setShowNoticeDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => handleDeleteNotice(notice.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Settings */}
            {activeSection === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-bold">Settings</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{session.user?.name}</p>
                        <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                        <Badge className="mt-1">Admin</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={() => fetchAllData()}>
                      <Loader2 className="w-4 h-4 mr-2" />
                      Refresh Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => signOut({ callbackUrl: "/" })}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg text-xs",
                activeSection === item.id
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Teacher Dialog */}
      <Dialog open={showTeacherDialog} onOpenChange={setShowTeacherDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={teacherForm.fullName}
                onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                placeholder="Dr. John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={teacherForm.email}
                onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                placeholder="teacher@ru.ac.bd"
              />
            </div>
            {!editingItem && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={teacherForm.designation}
                onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                placeholder="Professor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={teacherForm.phone}
                onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                placeholder="01712345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officeRoom">Office Room</Label>
              <Input
                id="officeRoom"
                value={teacherForm.officeRoom}
                onChange={(e) => setTeacherForm({ ...teacherForm, officeRoom: e.target.value })}
                placeholder="Room 401"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeacherDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTeacher} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Update" : "Add"} Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Course" : "Add Course"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="courseName">Course Name *</Label>
              <Input
                id="courseName"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                placeholder="Digital Electronics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseCode">Course Code *</Label>
              <Input
                id="courseCode"
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                placeholder="ICE-1101"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditHours">Credit Hours</Label>
                <Input
                  id="creditHours"
                  type="number"
                  value={courseForm.creditHours}
                  onChange={(e) => setCourseForm({ ...courseForm, creditHours: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseType">Type</Label>
                <Select value={courseForm.type} onValueChange={(v) => setCourseForm({ ...courseForm, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select value={courseForm.year.toString()} onValueChange={(v) => setCourseForm({ ...courseForm, year: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select value={courseForm.semester.toString()} onValueChange={(v) => setCourseForm({ ...courseForm, semester: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Semester</SelectItem>
                    <SelectItem value="2">2nd Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCourse} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Update" : "Add"} Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Dialog */}
      <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Room" : "Add Room"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number *</Label>
              <Input
                id="roomNumber"
                value={roomForm.roomNumber}
                onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                placeholder="301"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building">Building</Label>
              <Input
                id="building"
                value={roomForm.building}
                onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                placeholder="Main Building"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomType">Type</Label>
                <Select value={roomForm.type} onValueChange={(v) => setRoomForm({ ...roomForm, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classroom">Classroom</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoomDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRoom} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Update" : "Add"} Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Select value={scheduleForm.courseId} onValueChange={(v) => setScheduleForm({ ...scheduleForm, courseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher *</Label>
              <Select value={scheduleForm.teacherId} onValueChange={(v) => setScheduleForm({ ...scheduleForm, teacherId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room">Room *</Label>
                <Select value={scheduleForm.roomId} onValueChange={(v) => setScheduleForm({ ...scheduleForm, roomId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Time Slot *</Label>
                <Select value={scheduleForm.timeSlotId} onValueChange={(v) => setScheduleForm({ ...scheduleForm, timeSlotId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {slot.label} ({slot.startTime}-{slot.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="day">Day *</Label>
              <Select value={scheduleForm.dayOfWeek} onValueChange={(v) => setScheduleForm({ ...scheduleForm, dayOfWeek: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"].map((day) => (
                    <SelectItem key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select value={scheduleForm.year.toString()} onValueChange={(v) => setScheduleForm({ ...scheduleForm, year: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Sem</Label>
                <Select value={scheduleForm.semester.toString()} onValueChange={(v) => setScheduleForm({ ...scheduleForm, semester: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2].map((s) => (
                      <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select value={scheduleForm.section} onValueChange={(v) => setScheduleForm({ ...scheduleForm, section: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSchedule} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Update" : "Add"} Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Notice" : "Create Notice"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="noticeTitle">Title *</Label>
              <Input
                id="noticeTitle"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                placeholder="Notice title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noticeCategory">Category</Label>
              <Select value={noticeForm.category} onValueChange={(v) => setNoticeForm({ ...noticeForm, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noticeContent">Content *</Label>
              <Textarea
                id="noticeContent"
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                placeholder="Notice content..."
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPinned"
                checked={noticeForm.isPinned}
                onChange={(e) => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPinned">Pin this notice</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoticeDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveNotice} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Update" : "Create"} Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
