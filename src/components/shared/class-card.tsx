"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, User, Ban, RefreshCw, MapPinned, Timer, Plus } from "lucide-react";
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
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    borderClass: "border-l-red-500",
  },
  rescheduled: {
    icon: RefreshCw,
    label: "RESCHEDULED",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    borderClass: "border-l-orange-500",
  },
  room_changed: {
    icon: MapPinned,
    label: "ROOM CHANGED",
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    borderClass: "border-l-yellow-500",
  },
  time_changed: {
    icon: Timer,
    label: "TIME CHANGED",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    borderClass: "border-l-blue-500",
  },
  extra_class: {
    icon: Plus,
    label: "EXTRA CLASS",
    color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    borderClass: "border-l-green-500",
  },
};

export function ClassCard({ schedule, change, index = 0, compact = false }: ClassCardProps) {
  const isLab = schedule.classType === "lab";
  const hasChange = !!change;
  const changeConfig = change ? changeTypeConfig[change.changeType] : null;
  
  // Format time for display
  const formatTime = (time: string) => {
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
      className={cn(
        "relative bg-card rounded-xl border border-border overflow-hidden transition-all",
        "hover:shadow-md card-hover",
        "border-l-4",
        hasChange && changeConfig ? changeConfig.borderClass : isLab ? "border-l-green-500" : "border-l-primary",
        hasChange && change?.changeType === "cancelled" && "opacity-70"
      )}
    >
      {/* Main Content */}
      <div className={cn("p-4", compact && "p-3")}>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-semibold text-primary">
                {schedule.courseCode}
              </span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] px-2",
                  isLab 
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" 
                    : "bg-primary/10 text-primary border-primary/20"
                )}
              >
                {isLab ? "LAB" : "THEORY"}
              </Badge>
            </div>
            <h3 className={cn(
              "font-semibold text-foreground mt-1 truncate",
              compact ? "text-sm" : "text-base",
              hasChange && change?.changeType === "cancelled" && "line-through"
            )}>
              {schedule.courseName}
            </h3>
          </div>
        </div>

        {/* Info Row */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{schedule.teacherName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>Room {schedule.roomNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>
              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
            </span>
          </div>
        </div>

        {/* Change Badge */}
        {hasChange && changeConfig && (
          <div className={cn(
            "mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border",
            changeConfig.color
          )}>
            <changeConfig.icon className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs uppercase tracking-wide">
                {changeConfig.label}
              </div>
              {change.reason && (
                <div className="text-xs mt-0.5 opacity-80 truncate">
                  {change.reason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Room/Time Change Info */}
        {hasChange && change && (change.changeType === "room_changed" || change.changeType === "rescheduled" || change.changeType === "time_changed") && (
          <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            {change.changeType === "room_changed" && change.newRoomNumber && (
              <span>
                Room changed: <span className="font-medium text-foreground">{change.originalRoomNumber}</span> → <span className="font-medium text-foreground">{change.newRoomNumber}</span>
              </span>
            )}
            {change.changeType === "time_changed" && change.newStartTime && change.newEndTime && (
              <span>
                Time changed: <span className="font-medium text-foreground">{change.originalStartTime}</span> → <span className="font-medium text-foreground">{change.newStartTime} - {change.newEndTime}</span>
              </span>
            )}
            {change.changeType === "rescheduled" && (
              <span>
                Rescheduled to: <span className="font-medium text-foreground">{change.newDay} at {change.newStartTime}</span>
              </span>
            )}
          </div>
        )}

        {/* Section Info */}
        {!compact && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Year {schedule.year}</span>
              <span>•</span>
              <span>Sem {schedule.semester}</span>
              <span>•</span>
              <span>Section {schedule.section}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
