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

// Category badge colors with gradients
const categoryStyles: Record<string, { gradient: string; shadow: string }> = {
  academic: { gradient: "from-blue-500 to-indigo-500", shadow: "shadow-blue-500/30" },
  exam: { gradient: "from-red-500 to-rose-500", shadow: "shadow-red-500/30" },
  event: { gradient: "from-purple-500 to-violet-500", shadow: "shadow-purple-500/30" },
  general: { gradient: "from-gray-500 to-slate-500", shadow: "shadow-gray-500/30" },
  schedule_change: { gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/30" },
};

// Change type icons and styles
const changeTypeStyles: Record<string, { gradient: string; icon: typeof Ban }> = {
  cancelled: { gradient: "from-red-500 to-rose-500", icon: Ban },
  rescheduled: { gradient: "from-orange-500 to-amber-500", icon: RefreshCw },
  room_changed: { gradient: "from-yellow-500 to-amber-500", icon: MapPinned },
  time_changed: { gradient: "from-blue-500 to-cyan-500", icon: Timer },
  extra_class: { gradient: "from-green-500 to-emerald-500", icon: Plus },
};

export function NoticeCard({ notice, index = 0, compact = false }: NoticeCardProps) {
  const categoryStyle = categoryStyles[notice.category] || categoryStyles.general;
  const isScheduleChange = notice.category === "schedule_change";
  const changeStyle = notice.changeType ? changeTypeStyles[notice.changeType] : null;
  const ChangeIcon = changeStyle?.icon || AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        "relative rounded-2xl overflow-hidden transition-all duration-300 grid-item-card",
        notice.isPinned && "ring-2 ring-amber-400/50"
      )}
    >
      {/* Top gradient bar */}
      <div className={cn("h-1 bg-gradient-to-r", categoryStyle.gradient)} />
      
      {/* Pinned Indicator */}
      {notice.isPinned && (
        <div className="absolute top-3 right-3 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-50" />
            <Pin className="w-4 h-4 text-amber-500 fill-amber-500 relative" />
          </div>
        </div>
      )}

      <div className={cn("p-4 relative", compact && "p-3")}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Schedule Change Icon with 3D effect */}
          {isScheduleChange && changeStyle && (
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br",
              changeStyle.gradient
            )}
            style={{
              boxShadow: `0 4px 12px -2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)`
            }}
            >
              <ChangeIcon className="w-5 h-5 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={cn(
              "font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent pr-6",
              compact ? "text-sm" : "text-base"
            )}>
              {notice.title}
            </h3>

            {/* Meta Row */}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-teal-500" />
              <span className="font-medium">{format(toDate(notice.createdAt), "MMM d, yyyy")}</span>
              <span className="text-muted-foreground/50">•</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium">{format(toDate(notice.createdAt), "h:mm a")}</span>
            </div>
          </div>
        </div>

        {/* Category Badge */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge className={cn(
            "text-[10px] px-2.5 py-0.5 font-semibold shadow-md bg-gradient-to-r text-white border-0",
            categoryStyle.gradient,
            categoryStyle.shadow
          )}>
            {notice.category === "schedule_change" ? "⚡ SCHEDULE CHANGE" : notice.category.toUpperCase()}
          </Badge>
          {notice.isAutoGenerated && (
            <Badge variant="outline" className="text-[10px] px-2 bg-muted/50 text-muted-foreground">
              AUTO
            </Badge>
          )}
        </div>

        {/* Content Preview */}
        {!compact && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {notice.content}
          </p>
        )}

        {/* Schedule Change Details */}
        {isScheduleChange && !compact && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              <span>Posted by: </span>
              <span className="font-semibold text-foreground">{notice.postedByName}</span>
            </div>
            {notice.affectedSemester && (
              <div className="text-xs text-muted-foreground mt-1">
                <span>Affects: </span>
                <span className="font-semibold text-foreground">
                  {notice.affectedSemester}{notice.affectedSemester === 1 ? 'st' : notice.affectedSemester === 2 ? 'nd' : notice.affectedSemester === 3 ? 'rd' : 'th'} Semester
                  {notice.affectedProgram && ` • ${notice.affectedProgram.toUpperCase()}`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
