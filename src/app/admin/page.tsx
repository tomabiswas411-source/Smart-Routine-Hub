"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, BookOpen, DoorOpen, Calendar, Settings, Bell, 
  LogOut, Loader2, Plus, FileText, Clock, AlertCircle,
  Check, X, ChevronRight, LayoutDashboard
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Helper to safely convert Firestore timestamp to Date
function toDate(timestamp: unknown): Date {
  if (!timestamp) return new Date();
  
  // If it's already a Date
  if (timestamp instanceof Date) return timestamp;
  
  // If it's a Firestore Timestamp object with seconds and nanoseconds
  if (typeof timestamp === "object" && timestamp !== null) {
    const ts = timestamp as { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number };
    if (ts.seconds || ts._seconds) {
      return new Date((ts.seconds || ts._seconds || 0) * 1000);
    }
  }
  
  // If it's a string or number
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) return date;
  }
  
  return new Date();
}

interface Stats {
  totalTeachers: number;
  activeCourses: number;
  totalRooms: number;
  totalSchedules: number;
  pendingNotices: number;
  currentSemester: string;
}

interface Notice {
  id: string;
  title: string;
  category: string;
  isApproved: boolean;
  isPinned: boolean;
  postedByName: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/teacher");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [statsRes, noticesRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/notices?limit=10"),
      ]);
      
      const statsData = await statsRes.json();
      const noticesData = await noticesRes.json();
      
      if (statsData.success) setStats(statsData.data);
      if (noticesData.success) setNotices(noticesData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
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
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "teachers", label: "Teachers", icon: Users },
            { id: "courses", label: "Courses", icon: BookOpen },
            { id: "rooms", label: "Rooms", icon: DoorOpen },
            { id: "schedules", label: "Schedules", icon: Calendar },
            { id: "notices", label: "Notices", icon: Bell },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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

      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-foreground">Welcome, {session.user?.name}</h1>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
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
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", stat.color)}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Add Teacher", icon: Plus },
              { label: "Add Course", icon: Plus },
              { label: "Add Schedule", icon: Plus },
              { label: "Post Notice", icon: Plus },
            ].map((action) => (
              <Button key={action.label} variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <action.icon className="w-5 h-5" />
                <span>{action.label}</span>
              </Button>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Recent Notices */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Recent Notices</CardTitle>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {notices.slice(0, 5).map((notice) => (
                      <div key={notice.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2",
                          notice.isApproved ? "bg-green-500" : "bg-amber-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{notice.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(toDate(notice.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">System Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {[
                        { label: "Active Teachers", value: stats?.totalTeachers || 0, total: stats?.totalTeachers || 0 },
                        { label: "Active Courses", value: stats?.activeCourses || 0, total: 20 },
                        { label: "Room Utilization", value: 75, total: 100 },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.value / item.total) * 100}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-primary rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="teachers">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Manage Teachers</CardTitle>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Teacher
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Teacher management features coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notices">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Manage Notices</CardTitle>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Create Notice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notices.map((notice) => (
                      <div key={notice.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{notice.title}</p>
                          <p className="text-xs text-muted-foreground">
                            By {notice.postedByName} • {format(toDate(notice.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={notice.isApproved ? "default" : "outline"}>
                            {notice.isApproved ? "Approved" : "Pending"}
                          </Badge>
                          {!notice.isApproved && (
                            <>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500">
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500">
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Analytics features coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
