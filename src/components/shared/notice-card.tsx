"use client";

import { motion } from "framer-motion";
import { Pin, Calendar, Clock, Ban, RefreshCw, MapPinned, Timer, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Notice } from "@/types";

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

interface NoticeCardProps {
  notice: Notice;
  index?: number;
  compact?: boolean;
}

// Category badge colors
const categoryColors: Record<string, string> = {
  academic: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  exam: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  event: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  general: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  schedule_change: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

// Change type icons
const changeTypeIcons = {
  cancelled: Ban,
  rescheduled: RefreshCw,
  room_changed: MapPinned,
  time_changed: Timer,
  extra_class: Plus,
};

export function NoticeCard({ notice, index = 0, compact = false }: NoticeCardProps) {
  const categoryColor = categoryColors[notice.category] || categoryColors.general;
  const isScheduleChange = notice.category === "schedule_change";
  const ChangeIcon = notice.changeType ? changeTypeIcons[notice.changeType] : AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "relative bg-card rounded-xl border border-border overflow-hidden transition-all",
        "hover:shadow-md card-hover cursor-pointer",
        notice.isPinned && "border-l-4 border-l-amber-500"
      )}
    >
      {/* Pinned Indicator */}
      {notice.isPinned && (
        <div className="absolute top-3 right-3">
          <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
        </div>
      )}

      <div className={cn("p-4", compact && "p-3")}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Schedule Change Icon */}
          {isScheduleChange && ChangeIcon && (
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              notice.changeType === "cancelled" && "bg-red-500/10",
              notice.changeType === "rescheduled" && "bg-orange-500/10",
              notice.changeType === "room_changed" && "bg-yellow-500/10",
              notice.changeType === "time_changed" && "bg-blue-500/10",
              notice.changeType === "extra_class" && "bg-green-500/10",
            )}>
              <ChangeIcon className={cn(
                "w-5 h-5",
                notice.changeType === "cancelled" && "text-red-500",
                notice.changeType === "rescheduled" && "text-orange-500",
                notice.changeType === "room_changed" && "text-yellow-500",
                notice.changeType === "time_changed" && "text-blue-500",
                notice.changeType === "extra_class" && "text-green-500",
              )} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={cn(
              "font-semibold text-foreground pr-6",
              compact ? "text-sm" : "text-base"
            )}>
              {notice.title}
            </h3>

            {/* Meta Row */}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(toDate(notice.createdAt), "MMM d, yyyy")}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5" />
              <span>{format(toDate(notice.createdAt), "h:mm a")}</span>
            </div>
          </div>
        </div>

        {/* Category Badge */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="outline" className={cn("text-[10px] px-2", categoryColor)}>
            {notice.category === "schedule_change" ? "⚡ SCHEDULE CHANGE" : notice.category.toUpperCase()}
          </Badge>
          {notice.isAutoGenerated && (
            <Badge variant="outline" className="text-[10px] px-2 bg-muted text-muted-foreground">
              AUTO
            </Badge>
          )}
        </div>

        {/* Content Preview */}
        {!compact && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notice.content}
          </p>
        )}

        {/* Schedule Change Details */}
        {isScheduleChange && !compact && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <span>Posted by: </span>
              <span className="font-medium text-foreground">{notice.postedByName}</span>
            </div>
            {notice.affectedYear && notice.affectedSemester && notice.affectedSection && (
              <div className="text-xs text-muted-foreground mt-1">
                <span>Affects: </span>
                <span className="font-medium text-foreground">
                  Year {notice.affectedYear}, Sem {notice.affectedSemester}, Sec {notice.affectedSection}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
