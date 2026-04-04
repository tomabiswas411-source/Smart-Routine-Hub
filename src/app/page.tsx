"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, BookOpen, DoorOpen, Calendar, ChevronRight, Sparkles, 
  Search, MapPin, Mail, Phone, ExternalLink, Clock, AlertCircle,
  Grid3X3, List, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { 
  StatsCard, SectionHeader, ClassCard, TeacherCard, NoticeCard, 
  LoadingSkeleton, ScheduleFilterBar, NoticeFilterBar 
} from "@/components/shared";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Schedule, Notice, User, DashboardStats, AcademicCalendar } from "@/types";

// Get current day name
function getCurrentDay(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

// Format day for display
function formatDay(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<AcademicCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [seeded, setSeeded] = useState(false);

  const { scheduleFilter, noticeCategory, setNoticeCategory } = useAppStore();

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, schedulesRes, teachersRes, noticesRes, calendarRes] = await Promise.all([
        fetch("/api/stats"),
        fetch(`/api/schedules?year=${scheduleFilter.year}&semester=${scheduleFilter.semester}&section=${scheduleFilter.section}&day=${scheduleFilter.day}`),
        fetch("/api/teachers"),
        fetch(`/api/notices?limit=10${noticeCategory !== "all" ? `&category=${noticeCategory}` : ""}`),
        fetch("/api/calendar"),
      ]);

      const [statsData, schedulesData, teachersData, noticesData, calendarData] = await Promise.all([
        statsRes.json(),
        schedulesRes.json(),
        teachersRes.json(),
        noticesRes.json(),
        calendarRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (schedulesData.success) setSchedules(schedulesData.data);
      if (teachersData.success) setTeachers(teachersData.data);
      if (noticesData.success) setNotices(noticesData.data);
      if (calendarData.success) setCalendarEvents(calendarData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [scheduleFilter, noticeCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter teachers by search
  const filteredTeachers = teachers.filter((teacher) =>
    teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle seed data
  const handleSeedData = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeeded(true);
        fetchData();
      } else {
        alert(data.message || "Database already seeded");
      }
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Hero Section */}
      <section id="home" className="hero-gradient text-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>Academic Portal 2025</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              Information & Communication
              <span className="block mt-2">Engineering</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-white/80 mb-2"
            >
              Rajshahi University
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm md:text-base text-white/60 mb-8"
            >
              Your complete academic companion
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <a
                href="#schedule"
                className="w-full sm:w-auto px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors text-center"
              >
                View Schedule
              </a>
              <a
                href="#teachers"
                className="w-full sm:w-auto px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 font-semibold rounded-lg hover:bg-white/20 transition-colors text-center"
              >
                Teacher Directory
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-6 md:py-8 bg-background">
        <div className="container mx-auto px-4">
          {loading ? (
            <LoadingSkeleton type="stats" count={4} />
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <StatsCard title="Total Teachers" value={stats.totalTeachers} icon={Users} color="primary" index={0} />
              <StatsCard title="Active Courses" value={stats.activeCourses} icon={BookOpen} color="green" index={1} />
              <StatsCard title="Classrooms" value={stats.totalRooms} icon={DoorOpen} color="amber" index={2} />
              <StatsCard title="Current Semester" value={stats.currentSemester.split(" ")[0]} icon={Calendar} color="blue" description={stats.currentSemester.split(" ")[1]} index={3} />
            </div>
          ) : null}
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="py-8 md:py-12 bg-muted/30 scroll-mt-14 md:scroll-mt-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Class Schedule"
            subtitle={`${scheduleFilter.year === 1 ? "1st" : scheduleFilter.year === 2 ? "2nd" : scheduleFilter.year === 3 ? "3rd" : "4th"} Year, ${scheduleFilter.semester === 1 ? "1st" : "2nd"} Semester, Section ${scheduleFilter.section}`}
          />

          {/* Filter Bar */}
          <ScheduleFilterBar />

          {/* View Toggle */}
          <div className="flex items-center justify-between mt-4 mb-4">
            <h3 className="font-semibold text-foreground">
              {formatDay(scheduleFilter.day)}&apos;s Classes
            </h3>
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "cards" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Schedules Display */}
          {loading ? (
            <LoadingSkeleton type="class-card" count={4} />
          ) : schedules.length > 0 ? (
            <div className={cn(
              "gap-4",
              viewMode === "cards" ? "grid md:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1"
            )}>
              {schedules.map((schedule, index) => (
                <ClassCard key={schedule.id} schedule={schedule} change={schedule.change} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-card rounded-xl border border-border"
            >
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No classes scheduled</h3>
              <p className="text-muted-foreground">Try selecting a different day or filter</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Teachers Section */}
      <section id="teachers" className="py-8 md:py-12 bg-background scroll-mt-14 md:scroll-mt-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Our Teachers"
            subtitle="Meet our experienced faculty members"
          />

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {loading ? (
            <LoadingSkeleton type="teacher-card" count={4} />
          ) : filteredTeachers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTeachers.map((teacher, index) => (
                <TeacherCard key={teacher.id} teacher={teacher} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-card rounded-xl border border-border"
            >
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No teachers found</h3>
              <p className="text-muted-foreground">Try a different search term</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Notice Board Section */}
      <section id="notices" className="py-8 md:py-12 bg-muted/30 scroll-mt-14 md:scroll-mt-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Notice Board"
            subtitle="Stay updated with important announcements"
          />

          {/* Category Filter */}
          <div className="mb-6">
            <NoticeFilterBar category={noticeCategory} onCategoryChange={setNoticeCategory} />
          </div>

          {loading ? (
            <LoadingSkeleton type="notice-card" count={3} />
          ) : notices.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notices.map((notice, index) => (
                <NoticeCard key={notice.id} notice={notice} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-card rounded-xl border border-border"
            >
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No notices available</h3>
              <p className="text-muted-foreground">Check back later for updates</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Academic Calendar Section */}
      <section id="calendar" className="py-8 md:py-12 bg-background scroll-mt-14 md:scroll-mt-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Academic Calendar"
            subtitle="Important dates and events"
          />

          {loading ? (
            <LoadingSkeleton type="list" count={5} />
          ) : calendarEvents.length > 0 ? (
            <div className="space-y-3">
              {calendarEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-semibold",
                    event.eventType === "exam" && "bg-red-500/10 text-red-500",
                    event.eventType === "holiday" && "bg-green-500/10 text-green-500",
                    event.eventType === "event" && "bg-purple-500/10 text-purple-500",
                    event.eventType === "class" && "bg-blue-500/10 text-blue-500"
                  )}>
                    {format(new Date(event.date), "dd")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{event.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{format(new Date(event.date), "MMM yyyy")}</span>
                      {event.endDate && (
                        <>
                          <span>-</span>
                          <span>{format(new Date(event.endDate), "MMM dd, yyyy")}</span>
                        </>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{event.description}</p>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    event.eventType === "exam" && "bg-red-500/10 text-red-500",
                    event.eventType === "holiday" && "bg-green-500/10 text-green-500",
                    event.eventType === "event" && "bg-purple-500/10 text-purple-500",
                    event.eventType === "class" && "bg-blue-500/10 text-blue-500"
                  )}>
                    {event.eventType}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-card rounded-xl border border-border"
            >
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No events scheduled</h3>
              <p className="text-muted-foreground">Check back later for updates</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-8 md:py-12 bg-muted/30 scroll-mt-14 md:scroll-mt-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="About ICE Department"
            subtitle="Learn more about our department"
          />

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-muted-foreground leading-relaxed">
                The Department of Information and Communication Engineering (ICE) at Rajshahi University 
                is dedicated to excellence in education and research in the fields of information 
                technology and communication systems.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our department offers undergraduate and graduate programs that prepare students for 
                successful careers in the rapidly evolving field of information and communication technology.
              </p>
              <div className="pt-4">
                <h4 className="font-semibold text-foreground mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                    <a href="mailto:ice@ru.ac.bd" className="hover:text-primary transition-colors">
                      ice@ru.ac.bd
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                    <a href="tel:+880721750123" className="hover:text-primary transition-colors">
                      +880-721-750123
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Rajshahi University", href: "https://ru.ac.bd" },
                  { label: "Academic Portal", href: "#" },
                  { label: "Library", href: "#" },
                  { label: "Research", href: "#" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Seed Data Button (Development) */}
      {!seeded && teachers.length === 0 && (
        <section className="py-6 bg-background">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground text-sm mb-3">
              No data found. Click below to seed sample data.
            </p>
            <button
              onClick={handleSeedData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Seed Sample Data
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
