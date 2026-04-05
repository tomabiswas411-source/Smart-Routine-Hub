"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, BookOpen, DoorOpen, Calendar, Settings, Bell, 
  LogOut, Loader2, Plus, Clock, AlertCircle,
  Check, X, Edit, Trash2, Search, Save,
  LayoutDashboard, Key, Mail, Phone, Globe,
  MapPin, FileText, GraduationCap, Building, Link,
  Facebook, Twitter, Instagram, Youtube, ExternalLink,
  Palette, Type, Image, Code, Menu
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/store/settings-store";

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

// Helper for ordinal suffix
const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

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
  year?: number;
  semester: number;
  program?: string;
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
  semester: number;
  program: string; // Changed from section to program (bsc/msc)
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

interface LibraryLink {
  id: string;
  degree: string;
  semester: number;
  url: string;
  title?: string | null;
  isActive: boolean;
}

interface SiteSettings {
  id?: string;
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  departmentName: string;
  universityName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  aboutText: string;
  facebookURL: string;
  websiteURL: string;
  twitterURL: string;
  youtubeURL: string;
  instagramURL: string;
  libraryURL: string;
  // Header settings
  headerLinks: { label: string; href: string }[];
  // Footer settings
  footerQuickLinks: { label: string; href: string }[];
  footerDescription: string;
  // Developer info
  developerName: string;
  developerURL: string;
}

type ActiveSection = "dashboard" | "teachers" | "courses" | "rooms" | "schedules" | "notices" | "library" | "settings";

const defaultSettings: SiteSettings = {
  siteName: "Smart Routine Hub",
  siteTagline: "Academic Schedule Management",
  logoUrl: "",
  departmentName: "Information & Communication Engineering",
  universityName: "Rajshahi University",
  contactEmail: "ice@ru.ac.bd",
  contactPhone: "+880-721-750123",
  address: "ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh",
  aboutText: "The Department of Information and Communication Engineering (ICE) at Rajshahi University is dedicated to excellence in education and research.",
  facebookURL: "https://facebook.com/iceru",
  websiteURL: "https://ice.ru.ac.bd",
  twitterURL: "",
  youtubeURL: "",
  instagramURL: "",
  libraryURL: "",
  headerLinks: [
    { label: "Home", href: "/" },
    { label: "Master Routine", href: "/?view=master-calendar" },
    { label: "Student View", href: "/?view=student" },
  ],
  footerQuickLinks: [
    { label: "Home", href: "/" },
    { label: "Master Routine", href: "/?view=master-calendar" },
    { label: "Student View", href: "/?view=student" },
    { label: "Library", href: "/?view=library" },
  ],
  footerDescription: "Your complete academic companion for managing class schedules, routines, and academic activities.",
  developerName: "",
  developerURL: "",
};

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
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings);
  const [libraryLinks, setLibraryLinks] = useState<LibraryLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog States
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
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
    semester: 1,
    program: "bsc",
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
    dayOfWeek: "sunday",
    semester: 1,
    program: "bsc", // Changed from section to program
  });
  
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    content: "",
    category: "general",
    isPinned: false,
  });

  const [libraryForm, setLibraryForm] = useState({
    degree: "bsc",
    semester: 1,
    url: "",
    title: "",
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
      const [statsRes, teachersRes, coursesRes, roomsRes, schedulesRes, noticesRes, timeSlotsRes, settingsRes, libraryLinksRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/teachers"),
        fetch("/api/courses"),
        fetch("/api/rooms"),
        fetch("/api/schedules"),
        fetch("/api/notices?limit=50"),
        fetch("/api/timeslots"),
        fetch("/api/settings"),
        fetch("/api/library-links"),
      ]);
      
      const statsData = await statsRes.json();
      const teachersData = await teachersRes.json();
      const coursesData = await coursesRes.json();
      const roomsData = await roomsRes.json();
      const schedulesData = await schedulesRes.json();
      const noticesData = await noticesRes.json();
      const timeSlotsData = await timeSlotsRes.json();
      const settingsData = await settingsRes.json();
      const libraryLinksData = await libraryLinksRes.json();
      
      if (statsData.success) setStats(statsData.data);
      if (teachersData.success) setTeachers(teachersData.data || []);
      if (coursesData.success) setCourses(coursesData.data || []);
      if (roomsData.success) setRooms(roomsData.data || []);
      if (schedulesData.success) setSchedules(schedulesData.data || []);
      if (noticesData.success) setNotices(noticesData.data || []);
      if (timeSlotsData.success) setTimeSlots(timeSlotsData.data || []);
      if (settingsData.success && settingsData.data) {
        setSiteSettings({ ...defaultSettings, ...settingsData.data });
      }
      if (libraryLinksData.success) setLibraryLinks(libraryLinksData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Settings Save
  const handleSaveSettings = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteSettings),
      });
      
      const data = await res.json();
      if (data.success) {
        // Update global settings store
        useSettingsStore.getState().updateSettings(siteSettings);
        
        toast({
          title: "Settings saved",
          description: "Site settings have been updated successfully. Changes are now live!",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add Header Link
  const addHeaderLink = () => {
    setSiteSettings({
      ...siteSettings,
      headerLinks: [...siteSettings.headerLinks, { label: "New Link", href: "/" }],
    });
  };

  // Remove Header Link
  const removeHeaderLink = (index: number) => {
    setSiteSettings({
      ...siteSettings,
      headerLinks: siteSettings.headerLinks.filter((_, i) => i !== index),
    });
  };

  // Add Footer Link
  const addFooterLink = () => {
    setSiteSettings({
      ...siteSettings,
      footerQuickLinks: [...siteSettings.footerQuickLinks, { label: "New Link", href: "/" }],
    });
  };

  // Remove Footer Link
  const removeFooterLink = (index: number) => {
    setSiteSettings({
      ...siteSettings,
      footerQuickLinks: siteSettings.footerQuickLinks.filter((_, i) => i !== index),
    });
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
    if (!courseForm.name.trim() || !courseForm.code.trim()) {
      toast({ title: "Error", description: "Please fill course name and code", variant: "destructive" });
      return;
    }
    
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
      } else {
        toast({ title: "Error", description: data.error || "Failed to save course", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error saving course:", error);
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
    setCourseForm({ name: "", code: "", creditHours: 3, type: "theory", semester: 1, program: "bsc" });
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
        toast({ title: "Error", description: "Please select course, teacher, room, and time slot", variant: "destructive" });
        setSubmitting(false);
        return;
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
      } else if (data.conflicts) {
        toast({ 
          title: "⚠️ Scheduling Conflicts", 
          description: data.conflicts.join(". "), 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Error", description: data.error || "Failed to save schedule", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({ title: "Error", description: "Failed to save schedule. Please try again.", variant: "destructive" });
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
    setScheduleForm({ courseId: "", teacherId: "", roomId: "", timeSlotId: "", dayOfWeek: "sunday", semester: 1, program: "bsc" });
    setEditingItem(null);
  };

  // Notice CRUD
  const handleSaveNotice = async () => {
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      toast({ title: "Error", description: "Please fill title and content", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      const noticeData = {
        title: noticeForm.title,
        content: noticeForm.content,
        category: noticeForm.category,
        isPinned: noticeForm.isPinned,
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
      } else {
        toast({ title: "Error", description: data.error || "Failed to save notice", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error saving notice:", error);
      toast({ title: "Error", description: "Failed to save notice. Please try again.", variant: "destructive" });
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

  // Library Link CRUD
  const handleSaveLibraryLink = async () => {
    if (!libraryForm.url.trim()) {
      toast({ title: "Error", description: "Please enter a URL", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/library-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(libraryForm),
      });
      
      const data = await res.json();
      if (data.success) {
        toast({ title: editingItem ? "Link updated" : "Link added" });
        setShowLibraryDialog(false);
        resetLibraryForm();
        fetchAllData();
      } else {
        toast({ title: "Error", description: data.error || "Failed to save link", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error saving library link:", error);
      toast({ title: "Error", description: "Failed to save library link.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLibraryLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this library link?")) return;
    try {
      const res = await fetch(`/api/library-links?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Link deleted" });
        fetchAllData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete link.", variant: "destructive" });
    }
  };

  const resetLibraryForm = () => {
    setLibraryForm({ degree: "bsc", semester: 1, url: "", title: "" });
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
    { id: "library", label: "Library", icon: Link },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Sidebar - Desktop with Premium 3D Design */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-50 overflow-hidden">
        {/* Gradient background with inner glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-600 via-emerald-600 to-teal-700 dark:from-teal-800 dark:via-emerald-800 dark:to-teal-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-emerald-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-md" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-white via-cyan-100 to-emerald-100 flex items-center justify-center shadow-lg shadow-teal-900/30">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
            </div>
            <div>
              <p className="font-bold text-sm text-white">{siteSettings.siteName}</p>
              <p className="text-xs text-white/70">Admin Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="relative flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                  isActive
                    ? "bg-white/20 text-white shadow-lg shadow-black/10"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-white/20 to-white/10 rounded-xl" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-lg shadow-white/50" />
                  </>
                )}
                <div className={cn(
                  "relative w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  isActive
                    ? "bg-gradient-to-br from-white/30 to-white/10 shadow-inner"
                    : "bg-white/10"
                )}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="relative">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        <div className="relative p-3 border-t border-white/10">
          <motion.button
            onClick={() => signOut({ callbackUrl: "/" })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/80 hover:text-white hover:bg-red-500/20 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            Sign Out
          </motion.button>
        </div>
      </aside>

      {/* Mobile Header with Glass-morphism */}
      <header className="md:hidden sticky top-0 z-40 px-4 py-3 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
        <div className="absolute inset-0 backdrop-blur-xl bg-white/10" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.8'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white via-cyan-100 to-emerald-100 flex items-center justify-center shadow-lg shadow-teal-900/30">
              <Calendar className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <span className="font-semibold text-white text-sm">{siteSettings.siteName}</span>
              <p className="text-[10px] text-white/70">Admin Panel</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-white hover:bg-white/20 rounded-xl"
          >
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
                {/* Welcome Header with Premium Design */}
                <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 shadow-xl shadow-teal-500/20">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.8'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl" />
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-cyan-400/30 to-transparent rounded-full blur-3xl" />
                  <div className="relative">
                    <p className="text-white/80 text-sm font-medium mb-1">Welcome back,</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{session.user?.name}</h1>
                    <p className="text-white/70 text-sm mt-1">Admin Dashboard • {siteSettings.departmentName}</p>
                  </div>
                </div>
                
                {/* Stats Grid with Premium 3D Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: "Teachers", value: stats?.totalTeachers || 0, icon: Users, gradient: "from-teal-500 via-emerald-500 to-cyan-500", shadow: "shadow-teal-500/30" },
                    { label: "Courses", value: stats?.activeCourses || 0, icon: BookOpen, gradient: "from-green-500 via-emerald-500 to-teal-500", shadow: "shadow-green-500/30" },
                    { label: "Rooms", value: stats?.totalRooms || 0, icon: DoorOpen, gradient: "from-amber-500 via-orange-500 to-yellow-500", shadow: "shadow-amber-500/30" },
                    { label: "Schedules", value: stats?.totalSchedules || 0, icon: Calendar, gradient: "from-blue-500 via-indigo-500 to-violet-500", shadow: "shadow-blue-500/30" },
                    { label: "Pending", value: stats?.pendingNotices || 0, icon: AlertCircle, gradient: "from-red-500 via-rose-500 to-pink-500", shadow: "shadow-red-500/30" },
                    { label: "Semester", value: stats?.currentSemester?.split(" ")[0] || "-", icon: Clock, gradient: "from-purple-500 via-violet-500 to-indigo-500", shadow: "shadow-purple-500/30" },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="stat-card-premium card-inner-glow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                          stat.gradient, stat.shadow
                        )}>
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{stat.value}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Actions with 3D Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Add Teacher", icon: Users, onClick: () => { resetTeacherForm(); setShowTeacherDialog(true); }, gradient: "from-teal-500 to-emerald-500", shadow: "shadow-teal-500/30" },
                    { label: "Add Course", icon: BookOpen, onClick: () => { resetCourseForm(); setShowCourseDialog(true); }, gradient: "from-green-500 to-emerald-500", shadow: "shadow-green-500/30" },
                    { label: "Add Schedule", icon: Calendar, iconType: Calendar, onClick: () => { resetScheduleForm(); setShowScheduleDialog(true); }, gradient: "from-blue-500 to-indigo-500", shadow: "shadow-blue-500/30" },
                    { label: "Post Notice", icon: Bell, onClick: () => { resetNoticeForm(); setShowNoticeDialog(true); }, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/30" },
                  ].map((action, index) => (
                    <motion.div
                      key={action.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        variant="outline" 
                        className="w-full h-auto py-5 flex flex-col gap-2 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 hover:border-teal-300 dark:hover:border-teal-600 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                        onClick={action.onClick}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                          action.gradient, action.shadow
                        )}>
                          <Plus className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-sm">{action.label}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Notices with Premium Card */}
                <Card className="card-3d card-inner-glow overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/30">
                        <Bell className="w-4 h-4 text-white" />
                      </div>
                      Recent Notices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {notices.slice(0, 5).map((notice, index) => (
                      <motion.div 
                        key={notice.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-teal-50 hover:to-transparent dark:hover:from-teal-900/20 dark:hover:to-transparent transition-all duration-200"
                      >
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full mt-2 shadow-lg",
                          notice.isApproved ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/30" : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{notice.title}</p>
                          <p className="text-xs text-muted-foreground">{format(toDate(notice.createdAt), "MMM d, yyyy")}</p>
                        </div>
                        {notice.isPinned && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] shadow-md shadow-amber-500/30">Pinned</Badge>
                        )}
                      </motion.div>
                    ))}
                    {notices.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No notices yet</p>
                      </div>
                    )}
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
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/30">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    Manage Teachers
                  </h2>
                  <Button 
                    onClick={() => { resetTeacherForm(); setShowTeacherDialog(true); }}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/30"
                  >
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
                    className="pl-9 bg-white dark:bg-gray-800 border-2 shadow-sm"
                  />
                </div>
                
                <div className="grid gap-3">
                  {teachers
                    .filter(t => t.fullName?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((teacher, index) => (
                    <motion.div
                      key={teacher.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ x: 4 }}
                    >
                      <Card className="card-3d card-inner-glow overflow-hidden">
                        <div className="h-0.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                              <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold">{teacher.fullName}</p>
                              <p className="text-sm text-muted-foreground">{teacher.designation} • {teacher.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-teal-100 dark:hover:bg-teal-900/30 hover:text-teal-600"
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
                              className="hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                              onClick={() => handleDeleteTeacher(teacher.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
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
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/30">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    Manage Courses
                  </h2>
                  <Button 
                    onClick={() => { resetCourseForm(); setShowCourseDialog(true); }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </Button>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  {courses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ y: -2 }}
                    >
                      <Card className="card-3d card-inner-glow overflow-hidden h-full">
                        <div className={cn(
                          "h-1",
                          course.type === "theory" 
                            ? "bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"
                            : "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"
                        )} />
                        <CardContent className="p-4 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="font-mono text-xs">{course.code}</Badge>
                              <Badge className={cn(
                                "text-[10px] font-semibold shadow-md",
                                course.type === "theory"
                                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-teal-500/30"
                                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30"
                              )}>
                                {course.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-teal-100 dark:hover:bg-teal-900/30 hover:text-teal-600"
                                onClick={() => {
                                  setEditingItem(course);
                                  setCourseForm({
                                    name: course.name,
                                    code: course.code,
                                    creditHours: course.creditHours,
                                    type: course.type,
                                    semester: course.semester,
                                    program: course.program || "bsc",
                                  });
                                  setShowCourseDialog(true);
                                }}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                onClick={() => handleDeleteCourse(course.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="font-medium flex-1">{course.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {course.semester}{getOrdinal(course.semester)} Semester • {course.creditHours} Credits
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
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
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                      <DoorOpen className="w-4 h-4 text-white" />
                    </div>
                    Manage Rooms
                  </h2>
                  <Button 
                    onClick={() => { resetRoomForm(); setShowRoomDialog(true); }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room
                  </Button>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {rooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ y: -2 }}
                    >
                      <Card className="card-3d card-inner-glow overflow-hidden">
                        <div className={cn(
                          "h-1",
                          room.type === "lab"
                            ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"
                            : "bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"
                        )} />
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                                room.type === "lab"
                                  ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30"
                                  : "bg-gradient-to-br from-teal-500 to-emerald-500 shadow-teal-500/30"
                              )}>
                                <Building className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-bold text-lg">{room.roomNumber}</span>
                            </div>
                            <Badge className={cn(
                              "text-[10px] font-semibold shadow-md",
                              room.type === "lab"
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30"
                                : "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-teal-500/30"
                            )}>
                              {room.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{room.building} • Capacity: {room.capacity}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
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
                              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-md shadow-red-500/20"
                              onClick={() => handleDeleteRoom(room.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
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
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    Manage Schedules
                  </h2>
                  <Button 
                    onClick={() => { resetScheduleForm(); setShowScheduleDialog(true); }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Schedule
                  </Button>
                </div>
                
                <div className="grid gap-3">
                  {schedules.map((schedule, index) => (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ x: 4 }}
                    >
                      <Card className="card-3d card-inner-glow overflow-hidden">
                        <div className={cn(
                          "h-1",
                          schedule.classType === "lab"
                            ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"
                            : "bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"
                        )} />
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg",
                              schedule.classType === "lab"
                                ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30"
                                : "bg-gradient-to-br from-teal-500 to-emerald-500 shadow-teal-500/30"
                            )}>
                              {schedule.courseCode?.split("-")[1]?.slice(0, 2) || "CL"}
                            </div>
                            <div>
                              <p className="font-semibold">{schedule.courseName}</p>
                              <p className="text-sm text-muted-foreground">
                                {schedule.teacherName} • {schedule.roomNumber} • {schedule.dayOfWeek}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {schedule.startTime} - {schedule.endTime} • {schedule.semester}{getOrdinal(schedule.semester)} Semester, {schedule.program?.toUpperCase() || 'BSC'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600"
                              onClick={() => {
                                setEditingItem(schedule);
                                setScheduleForm({
                                  courseId: schedule.courseId,
                                  teacherId: schedule.teacherId,
                                  roomId: schedule.roomId,
                                  timeSlotId: schedule.timeSlotId,
                                  dayOfWeek: schedule.dayOfWeek,
                                  semester: schedule.semester,
                                  program: schedule.program || "bsc",
                                });
                                setShowScheduleDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
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
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    Manage Notices
                  </h2>
                  <Button 
                    onClick={() => { resetNoticeForm(); setShowNoticeDialog(true); }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Notice
                  </Button>
                </div>
                
                <div className="grid gap-3">
                  {notices.map((notice, index) => (
                    <motion.div
                      key={notice.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ x: 4 }}
                    >
                      <Card className="card-3d card-inner-glow overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">{notice.category}</Badge>
                                <Badge className={cn(
                                  "text-[10px] font-semibold shadow-md",
                                  notice.isApproved 
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30"
                                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30"
                                )}>
                                  {notice.isApproved ? "Approved" : "Pending"}
                                </Badge>
                                {notice.isPinned && (
                                  <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] shadow-md shadow-red-500/30">
                                    Pinned
                                  </Badge>
                                )}
                              </div>
                              <p className="font-semibold">{notice.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{notice.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                By {notice.postedByName} • {format(toDate(notice.createdAt), "MMM d, yyyy")}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                              {!notice.isApproved && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500"
                                    onClick={() => handleApproveNotice(notice.id, true)}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                    onClick={() => handleApproveNotice(notice.id, false)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600"
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
                                className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                onClick={() => handleDeleteNotice(notice.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Library Links */}
            {activeSection === "library" && (
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/30">
                      <Link className="w-4 h-4 text-white" />
                    </div>
                    Google Library Links
                  </h2>
                  <Button 
                    onClick={() => { resetLibraryForm(); setShowLibraryDialog(true); }}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                </div>

                {/* BSc Links */}
                <Card className="card-3d card-inner-glow overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-teal-500" />
                      B.Sc. (Bachelor of Science)
                    </CardTitle>
                    <CardDescription>8 Semesters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                        const link = libraryLinks.find(l => l.degree === 'bsc' && l.semester === sem);
                        return (
                          <motion.div
                            key={sem}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: sem * 0.03 }}
                            className={cn(
                              "p-3 rounded-xl border-2 transition-all",
                              link
                                ? "border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10"
                                : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{sem}<sup className="text-[8px]">{getOrdinal(sem)}</sup> Sem</span>
                              {link && (
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      setEditingItem(link);
                                      setLibraryForm({
                                        degree: link.degree,
                                        semester: link.semester,
                                        url: link.url,
                                        title: link.title || "",
                                      });
                                      setShowLibraryDialog(true);
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-red-500 hover:text-red-600"
                                    onClick={() => handleDeleteLibraryLink(link.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            {link ? (
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-teal-600 dark:text-teal-400 hover:underline truncate block"
                              >
                                <ExternalLink className="w-3 h-3 inline mr-1" />
                                Open Drive
                              </a>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-7 text-xs"
                                onClick={() => {
                                  setLibraryForm({ degree: 'bsc', semester: sem, url: '', title: '' });
                                  setShowLibraryDialog(true);
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add
                              </Button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* MSc Links */}
                <Card className="card-3d card-inner-glow overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-amber-500" />
                      M.Sc. (Master of Science)
                    </CardTitle>
                    <CardDescription>3 Semesters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((sem) => {
                        const link = libraryLinks.find(l => l.degree === 'msc' && l.semester === sem);
                        return (
                          <motion.div
                            key={sem}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: sem * 0.03 }}
                            className={cn(
                              "p-3 rounded-xl border-2 transition-all",
                              link
                                ? "border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10"
                                : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{sem}<sup className="text-[8px]">{getOrdinal(sem)}</sup> Sem</span>
                              {link && (
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      setEditingItem(link);
                                      setLibraryForm({
                                        degree: link.degree,
                                        semester: link.semester,
                                        url: link.url,
                                        title: link.title || "",
                                      });
                                      setShowLibraryDialog(true);
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-red-500 hover:text-red-600"
                                    onClick={() => handleDeleteLibraryLink(link.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            {link ? (
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-amber-600 dark:text-amber-400 hover:underline truncate block"
                              >
                                <ExternalLink className="w-3 h-3 inline mr-1" />
                                Open Drive
                              </a>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-7 text-xs"
                                onClick={() => {
                                  setLibraryForm({ degree: 'msc', semester: sem, url: '', title: '' });
                                  setShowLibraryDialog(true);
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add
                              </Button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Settings */}
            {activeSection === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-md shadow-gray-500/30">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  Site Settings
                </h2>

                <Tabs defaultValue="general" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800 dark:to-gray-900 p-1">
                    <TabsTrigger value="general" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md">General</TabsTrigger>
                    <TabsTrigger value="header" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md">Header</TabsTrigger>
                    <TabsTrigger value="footer" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md">Footer</TabsTrigger>
                    <TabsTrigger value="social" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md">Social</TabsTrigger>
                  </TabsList>

                  {/* General Settings */}
                  <TabsContent value="general" className="space-y-4">
                    <Card className="card-3d card-inner-glow overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/30">
                            <Palette className="w-3.5 h-3.5 text-white" />
                          </div>
                          Site Information
                        </CardTitle>
                        <CardDescription>Basic site settings and branding</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Site Name</Label>
                            <Input
                              value={siteSettings.siteName}
                              onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                              placeholder="Smart Routine Hub"
                              className="bg-white dark:bg-gray-800 border-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Site Tagline</Label>
                            <Input
                              value={siteSettings.siteTagline}
                              onChange={(e) => setSiteSettings({ ...siteSettings, siteTagline: e.target.value })}
                              placeholder="Academic Schedule Management"
                              className="bg-white dark:bg-gray-800 border-2"
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Department Name</Label>
                            <Input
                              value={siteSettings.departmentName}
                              onChange={(e) => setSiteSettings({ ...siteSettings, departmentName: e.target.value })}
                              className="bg-white dark:bg-gray-800 border-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>University Name</Label>
                            <Input
                              value={siteSettings.universityName}
                              onChange={(e) => setSiteSettings({ ...siteSettings, universityName: e.target.value })}
                              className="bg-white dark:bg-gray-800 border-2"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="card-3d card-inner-glow overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                            <MapPin className="w-3.5 h-3.5 text-white" />
                          </div>
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Contact Email</Label>
                            <Input
                              type="email"
                              value={siteSettings.contactEmail}
                              onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                              className="bg-white dark:bg-gray-800 border-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Contact Phone</Label>
                            <Input
                              value={siteSettings.contactPhone}
                              onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                              className="bg-white dark:bg-gray-800 border-2"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Address</Label>
                          <Textarea
                            value={siteSettings.address}
                            onChange={(e) => setSiteSettings({ ...siteSettings, address: e.target.value })}
                            rows={2}
                            className="bg-white dark:bg-gray-800 border-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>About Text</Label>
                          <Textarea
                            value={siteSettings.aboutText}
                            onChange={(e) => setSiteSettings({ ...siteSettings, aboutText: e.target.value })}
                            rows={3}
                            className="bg-white dark:bg-gray-800 border-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Header Settings */}
                  <TabsContent value="header" className="space-y-4">
                    <Card className="card-3d card-inner-glow overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/30">
                                <Type className="w-3.5 h-3.5 text-white" />
                              </div>
                              Navigation Links
                            </CardTitle>
                            <CardDescription>Manage header navigation menu items</CardDescription>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={addHeaderLink}
                            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-md shadow-teal-500/30"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Link
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {siteSettings.headerLinks.map((link, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border"
                          >
                            <div className="grid flex-1 grid-cols-2 gap-2">
                              <Input
                                placeholder="Label"
                                value={link.label}
                                onChange={(e) => {
                                  const newLinks = [...siteSettings.headerLinks];
                                  newLinks[index] = { ...newLinks[index], label: e.target.value };
                                  setSiteSettings({ ...siteSettings, headerLinks: newLinks });
                                }}
                                className="bg-white dark:bg-gray-800"
                              />
                              <Input
                                placeholder="URL"
                                value={link.href}
                                onChange={(e) => {
                                  const newLinks = [...siteSettings.headerLinks];
                                  newLinks[index] = { ...newLinks[index], href: e.target.value };
                                  setSiteSettings({ ...siteSettings, headerLinks: newLinks });
                                }}
                                className="bg-white dark:bg-gray-800"
                              />
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                              onClick={() => removeHeaderLink(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Footer Settings */}
                  <TabsContent value="footer" className="space-y-4">
                    <Card className="card-3d card-inner-glow overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
                      <CardHeader>
                        <CardTitle className="text-base">Footer Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={siteSettings.footerDescription}
                          onChange={(e) => setSiteSettings({ ...siteSettings, footerDescription: e.target.value })}
                          rows={2}
                          placeholder="Footer description text..."
                          className="bg-white dark:bg-gray-800 border-2"
                        />
                      </CardContent>
                    </Card>

                    {/* Developer Info Card */}
                    <Card className="card-3d card-inner-glow overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md shadow-purple-500/30">
                            <Code className="w-3.5 h-3.5 text-white" />
                          </div>
                          Developer Info
                        </CardTitle>
                        <CardDescription>This will be shown in the footer as "Developed by"</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Developer Name</Label>
                            <Input
                              placeholder="e.g., Your Name or Company"
                              value={siteSettings.developerName}
                              onChange={(e) => setSiteSettings({ ...siteSettings, developerName: e.target.value })}
                              className="bg-white dark:bg-gray-800 border-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Developer Website URL</Label>
                            <Input
                              placeholder="https://your-website.com"
                              value={siteSettings.developerURL}
                              onChange={(e) => setSiteSettings({ ...siteSettings, developerURL: e.target.value })}
                              className="bg-white dark:bg-gray-800 border-2"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Leave empty to hide the developer credit in footer.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="card-3d card-inner-glow overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Quick Links</CardTitle>
                            <CardDescription>Manage footer quick links</CardDescription>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={addFooterLink}
                            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-md shadow-teal-500/30"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Link
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {siteSettings.footerQuickLinks.map((link, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border"
                          >
                            <div className="grid flex-1 grid-cols-2 gap-2">
                              <Input
                                placeholder="Label"
                                value={link.label}
                                onChange={(e) => {
                                  const newLinks = [...siteSettings.footerQuickLinks];
                                  newLinks[index] = { ...newLinks[index], label: e.target.value };
                                  setSiteSettings({ ...siteSettings, footerQuickLinks: newLinks });
                                }}
                                className="bg-white dark:bg-gray-800"
                              />
                              <Input
                                placeholder="URL"
                                value={link.href}
                                onChange={(e) => {
                                  const newLinks = [...siteSettings.footerQuickLinks];
                                  newLinks[index] = { ...newLinks[index], href: e.target.value };
                                  setSiteSettings({ ...siteSettings, footerQuickLinks: newLinks });
                                }}
                                className="bg-white dark:bg-gray-800"
                              />
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                              onClick={() => removeFooterLink(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Social Settings */}
                  <TabsContent value="social" className="space-y-4">
                    <Card className="card-3d card-inner-glow overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                            <Globe className="w-3.5 h-3.5 text-white" />
                          </div>
                          Social Media Links
                        </CardTitle>
                        <CardDescription>Connect your social media accounts</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Facebook className="w-5 h-5 text-white" />
                          </div>
                          <Input
                            placeholder="Facebook URL"
                            value={siteSettings.facebookURL}
                            onChange={(e) => setSiteSettings({ ...siteSettings, facebookURL: e.target.value })}
                            className="flex-1 bg-white dark:bg-gray-800 border-2"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                            <Twitter className="w-5 h-5 text-white" />
                          </div>
                          <Input
                            placeholder="Twitter URL"
                            value={siteSettings.twitterURL}
                            onChange={(e) => setSiteSettings({ ...siteSettings, twitterURL: e.target.value })}
                            className="flex-1 bg-white dark:bg-gray-800 border-2"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                            <Youtube className="w-5 h-5 text-white" />
                          </div>
                          <Input
                            placeholder="YouTube URL"
                            value={siteSettings.youtubeURL}
                            onChange={(e) => setSiteSettings({ ...siteSettings, youtubeURL: e.target.value })}
                            className="flex-1 bg-white dark:bg-gray-800 border-2"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                            <Instagram className="w-5 h-5 text-white" />
                          </div>
                          <Input
                            placeholder="Instagram URL"
                            value={siteSettings.instagramURL}
                            onChange={(e) => setSiteSettings({ ...siteSettings, instagramURL: e.target.value })}
                            className="flex-1 bg-white dark:bg-gray-800 border-2"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                          <Input
                            placeholder="Website URL"
                            value={siteSettings.websiteURL}
                            onChange={(e) => setSiteSettings({ ...siteSettings, websiteURL: e.target.value })}
                            className="flex-1 bg-white dark:bg-gray-800 border-2"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <Input
                            placeholder="Library URL (e.g., Google Drive link for resources)"
                            value={siteSettings.libraryURL}
                            onChange={(e) => setSiteSettings({ ...siteSettings, libraryURL: e.target.value })}
                            className="flex-1 bg-white dark:bg-gray-800 border-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={submitting} 
                    className="min-w-[180px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/30"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Navigation with Premium Design - Shows All Sections */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
        
        {/* Main Navigation Row - 4 items + More button */}
        <div className="relative grid grid-cols-5 gap-1 p-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = activeSection === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200",
                  isActive 
                    ? "text-teal-600 dark:text-teal-400" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-xl" />
                )}
                <div className={cn(
                  "relative w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  isActive 
                    ? "bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/30" 
                    : "bg-gray-100 dark:bg-gray-800"
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "")} />
                </div>
                <span className="relative text-[10px] font-medium truncate">{item.label}</span>
              </motion.button>
            );
          })}
          
          {/* More Button - Opens Sheet with remaining items */}
          <Sheet>
            <SheetTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground"
              >
                <div className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <Menu className="w-4 h-4" />
                </div>
                <span className="relative text-[10px] font-medium truncate">More</span>
              </motion.button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-3xl p-0">
              <div className="h-1 w-10 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-2" />
              <SheetHeader className="p-4 pb-2">
                <SheetTitle className="text-left text-base">All Sections</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-4 gap-3 p-4 pb-8">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200",
                        isActive 
                          ? "text-teal-600 dark:text-teal-400 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30" 
                          : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className={cn(
                        "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isActive 
                          ? "bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/30" 
                          : "bg-gray-100 dark:bg-gray-800"
                      )}>
                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "")} />
                      </div>
                      <span className="relative text-[11px] font-medium truncate">{item.label}</span>
                    </motion.button>
                  );
                })}
                
                {/* Sign Out Button in More Menu */}
                <motion.button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <div className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="relative text-[11px] font-medium truncate">Sign Out</span>
                </motion.button>
              </div>
            </SheetContent>
          </Sheet>
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
              <Label>Course Name *</Label>
              <Input
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                placeholder="Digital Electronics"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Course Code *</Label>
                <Input
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  placeholder="ICE-101"
                />
              </div>
              <div className="space-y-2">
                <Label>Credit Hours</Label>
                <Input
                  type="number"
                  value={courseForm.creditHours}
                  onChange={(e) => setCourseForm({ ...courseForm, creditHours: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
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
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={courseForm.semester.toString()} onValueChange={(v) => setCourseForm({ ...courseForm, semester: parseInt(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={s.toString()}>{s}{getOrdinal(s)} Semester</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Room Number *</Label>
                <Input
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  placeholder="401"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 60 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Building</Label>
              <Input
                value={roomForm.building}
                onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                placeholder="ICE Building"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
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
              <Label>Course *</Label>
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
              <Label>Teacher *</Label>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Room *</Label>
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
                <Label>Time Slot *</Label>
                <Select value={scheduleForm.timeSlotId} onValueChange={(v) => setScheduleForm({ ...scheduleForm, timeSlotId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {slot.label} ({slot.startTime} - {slot.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Day *</Label>
              <Select value={scheduleForm.dayOfWeek} onValueChange={(v) => setScheduleForm({ ...scheduleForm, dayOfWeek: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["sunday", "monday", "tuesday", "wednesday", "thursday"].map((day) => (
                    <SelectItem key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={scheduleForm.semester.toString()} onValueChange={(v) => setScheduleForm({ ...scheduleForm, semester: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(scheduleForm.program === "msc" ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 7, 8]).map((s) => (
                      <SelectItem key={s} value={s.toString()}>{s}{getOrdinal(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={scheduleForm.program} onValueChange={(v) => setScheduleForm({ ...scheduleForm, program: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">BSc - Bachelor</SelectItem>
                    <SelectItem value="msc">MSc - Master</SelectItem>
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
              <Label>Title *</Label>
              <Input
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                placeholder="Notice title"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
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
              <Label>Content *</Label>
              <Textarea
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                placeholder="Notice content..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoticeDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveNotice} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Update" : "Post"} Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Library Link Dialog */}
      <Dialog open={showLibraryDialog} onOpenChange={setShowLibraryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Library Link" : "Add Library Link"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Degree</Label>
                <Select value={libraryForm.degree} onValueChange={(v) => setLibraryForm({ ...libraryForm, degree: v, semester: v === 'msc' && libraryForm.semester > 3 ? 1 : libraryForm.semester })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bsc">B.Sc.</SelectItem>
                    <SelectItem value="msc">M.Sc.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={libraryForm.semester.toString()} onValueChange={(v) => setLibraryForm({ ...libraryForm, semester: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {libraryForm.degree === 'msc' ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        {sem}{getOrdinal(sem)} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Google Drive URL *</Label>
              <Input
                value={libraryForm.url}
                onChange={(e) => setLibraryForm({ ...libraryForm, url: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Title (Optional)</Label>
              <Input
                value={libraryForm.title}
                onChange={(e) => setLibraryForm({ ...libraryForm, title: e.target.value })}
                placeholder="e.g., 1st Semester Resources"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLibraryDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveLibraryLink} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Update" : "Add"} Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
