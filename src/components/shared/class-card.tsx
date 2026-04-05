"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, User, Ban, RefreshCw, MapPinned, Timer, Plus, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Schedule, ScheduleChange } from "@/types";

interface ClassCardProps {
  schedule: Schedule;
  change?: ScheduleChange;
  index?: number;
  compact?: boolean;
}

const changeTypeConfig = {
  cancelled: {
    icon: Ban,
    label: "CANCELLED",
    gradient: "from-red-500 to-rose-500",
    shadow: "shadow-red-500/30",
    bg: "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-300 dark:border-red-600",
  },
  rescheduled: {
    icon: RefreshCw,
    label: "RESCHEDULED",
    gradient: "from-orange-500 to-amber-500",
    shadow: "shadow-orange-500/30",
    bg: "bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-300 dark:border-orange-600",
  },
  room_changed: {
    icon: MapPinned,
    label: "ROOM CHANGED",
    gradient: "from-yellow-500 to-amber-500",
    shadow: "shadow-yellow-500/30",
    bg: "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-300 dark:border-yellow-600",
  },
  time_changed: {
    icon: Timer,
    label: "TIME CHANGED",
    gradient: "from-blue-500 to-indigo-500",
    shadow: "shadow-blue-500/30",
    bg: "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-600",
  },
  extra_class: {
    icon: Plus,
    label: "EXTRA CLASS",
    gradient: "from-green-500 to-emerald-500",
    shadow: "shadow-green-500/30",
    bg: "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-300 dark:border-green-600",
  },
};

// Class type color styles
const classTypeStyles = {
  theory: {
    gradient: "from-teal-500 via-emerald-500 to-cyan-500",
    shadow: "shadow-teal-500/30",
    badge: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white",
    border: "border-teal-300 dark:border-teal-600",
    glow: "rgba(13, 148, 136, 0.12)",
  },
  lab: {
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    shadow: "shadow-amber-500/30",
    badge: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    border: "border-amber-300 dark:border-amber-600",
    glow: "rgba(245, 158, 11, 0.12)",
  },
};

export function ClassCard({ schedule, change, index = 0, compact = false }: ClassCardProps) {
  const isLab = schedule.classType === "lab";
  const hasChange = !!change;
  const changeConfig = change ? changeTypeConfig[change.changeType] : null;
  const typeStyle = classTypeStyles[isLab ? "lab" : "theory"];
  
  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        "relative rounded-2xl overflow-hidden transition-all duration-300 grid-item-card",
        hasChange && change?.changeType === "cancelled" && "opacity-70"
      )}
    >
      {/* Top gradient bar */}
      <div className={cn("h-1 bg-gradient-to-r", typeStyle.gradient)} />
      
      {/* Decorative glow */}
      <div 
        className="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: typeStyle.glow }}
      />
      
      {/* Main Content */}
      <div className={cn("p-4 relative z-10", compact && "p-3")}>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {schedule.courseCode}
              </span>
              <Badge className={cn("text-[10px] px-2 py-0.5 font-semibold shadow-md border-0", typeStyle.badge)}>
                {isLab ? "LAB" : "THEORY"}
              </Badge>
            </div>
            <h3 className={cn(
              "font-semibold mt-1 truncate",
              compact ? "text-sm" : "text-base",
              hasChange && change?.changeType === "cancelled" && "line-through",
              "bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
            )}>
              {schedule.courseName}
            </h3>
          </div>
        </div>

        {/* Info Row with Premium styling */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm bg-white/50 dark:bg-black/20 rounded-lg px-3 py-1.5">
            <User className="w-4 h-4 flex-shrink-0 text-purple-500" />
            <span className="truncate text-muted-foreground font-medium">{schedule.teacherName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-white/50 dark:bg-black/20 rounded-lg px-3 py-1.5">
            <MapPin className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span className="text-muted-foreground font-medium">Room {schedule.roomNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-white/50 dark:bg-black/20 rounded-lg px-3 py-1.5">
            <Clock className="w-4 h-4 flex-shrink-0 text-teal-500" />
            <span className="text-muted-foreground font-medium">
              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
            </span>
          </div>
        </div>

        {/* Change Badge with Premium styling */}
        {hasChange && changeConfig && (
          <div className={cn(
            "mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl border backdrop-blur-sm",
            changeConfig.bg,
            changeConfig.border
          )}
          style={{
            boxShadow: `0 4px 12px -2px ${changeConfig.shadow.replace('shadow-', 'rgba(').replace('/30', ', 0.2)')}`
          }}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-br",
              changeConfig.gradient
            )}>
              <changeConfig.icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn("font-semibold text-xs uppercase tracking-wide", changeConfig.text)}>
                {changeConfig.label}
              </div>
              {change.reason && (
                <div className="text-xs mt-0.5 opacity-80 truncate text-muted-foreground">
                  {change.reason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Room/Time Change Info */}
        {hasChange && change && (change.changeType === "room_changed" || change.changeType === "rescheduled" || change.changeType === "time_changed") && (
          <div className="mt-2 text-xs text-muted-foreground bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl px-3 py-2 border border-border/50">
            {change.changeType === "room_changed" && change.newRoomNumber && (
              <span>
                Room changed: <span className="font-semibold text-foreground">{change.originalRoomNumber}</span> → <span className="font-semibold text-teal-600 dark:text-teal-400">{change.newRoomNumber}</span>
              </span>
            )}
            {change.changeType === "time_changed" && change.newStartTime && change.newEndTime && (
              <span>
                Time changed: <span className="font-semibold text-foreground">{change.originalStartTime}</span> → <span className="font-semibold text-teal-600 dark:text-teal-400">{change.newStartTime} - {change.newEndTime}</span>
              </span>
            )}
            {change.changeType === "rescheduled" && (
              <span>
                Rescheduled to: <span className="font-semibold text-teal-600 dark:text-teal-400">{change.newDay} at {change.newStartTime}</span>
              </span>
            )}
          </div>
        )}

        {/* Program/Semester Info */}
        {!compact && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />
              <span className="font-medium">{schedule.semester}{schedule.semester === 1 ? 'st' : schedule.semester === 2 ? 'nd' : schedule.semester === 3 ? 'rd' : 'th'} Semester</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="font-semibold uppercase text-foreground">{schedule.program || 'BSc'}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
