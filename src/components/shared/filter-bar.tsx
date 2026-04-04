"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const days = [
  { id: "saturday", label: "Sat", shortLabel: "S" },
  { id: "sunday", label: "Sun", shortLabel: "S" },
  { id: "monday", label: "Mon", shortLabel: "M" },
  { id: "tuesday", label: "Tue", shortLabel: "T" },
  { id: "wednesday", label: "Wed", shortLabel: "W" },
  { id: "thursday", label: "Thu", shortLabel: "T" },
];

// Semesters for BSc and MSc programs
const semesters = [
  { value: 1, label: "1st Semester" },
  { value: 2, label: "2nd Semester" },
  { value: 3, label: "3rd Semester" },
  { value: 4, label: "4th Semester" },
  { value: 5, label: "5th Semester" },
  { value: 6, label: "6th Semester" },
  { value: 7, label: "7th Semester" },
  { value: 8, label: "8th Semester" },
];

const programs = [
  { value: "bsc", label: "BSc" },
  { value: "msc", label: "MSc" },
];

export function ScheduleFilterBar() {
  const { scheduleFilter, setScheduleFilter } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-14 md:top-16 z-40 bg-background/80 backdrop-blur-lg border-b border-border py-3"
    >
      <div className="container mx-auto px-4 space-y-3">
        {/* Program, Semester Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Program Dropdown */}
          <select
            value={scheduleFilter.program || "bsc"}
            onChange={(e) => setScheduleFilter({ program: e.target.value })}
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {programs.map((prog) => (
              <option key={prog.value} value={prog.value}>
                {prog.label}
              </option>
            ))}
          </select>

          {/* Semester Dropdown */}
          <select
            value={scheduleFilter.semester}
            onChange={(e) => setScheduleFilter({ semester: parseInt(e.target.value) })}
            className="h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {semesters.map((sem) => (
              <option key={sem.value} value={sem.value}>
                {sem.label}
              </option>
            ))}
          </select>
        </div>

        {/* Day Selector - Horizontal Scrollable */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {days.map((day) => {
            const isToday = day.id === getCurrentDay();
            const isSelected = scheduleFilter.day === day.id;
            
            return (
              <button
                key={day.id}
                onClick={() => setScheduleFilter({ day: day.id })}
                className={cn(
                  "flex-shrink-0 h-10 px-4 rounded-lg text-sm font-medium transition-all relative",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50",
                  isToday && !isSelected && "ring-2 ring-primary/30"
                )}
              >
                {/* Today indicator */}
                {isToday && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
                <span className="hidden sm:inline">{day.label}</span>
                <span className="sm:hidden">{day.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Notice Category Filter
interface NoticeFilterBarProps {
  category: string;
  onCategoryChange: (category: string) => void;
}

const noticeCategories = [
  { id: "all", label: "All" },
  { id: "academic", label: "Academic" },
  { id: "exam", label: "Exam" },
  { id: "event", label: "Event" },
  { id: "general", label: "General" },
  { id: "schedule_change", label: "⚡ Changes" },
];

export function NoticeFilterBar({ category, onCategoryChange }: NoticeFilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2"
    >
      {noticeCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={cn(
            "flex-shrink-0 h-9 px-4 rounded-lg text-sm font-medium transition-all",
            category === cat.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
          )}
        >
          {cat.label}
        </button>
      ))}
    </motion.div>
  );
}

// Helper function
function getCurrentDay(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}
