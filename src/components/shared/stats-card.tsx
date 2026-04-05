"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  color?: "primary" | "green" | "amber" | "red" | "blue" | "purple";
  index?: number;
}

const colorStyles = {
  primary: {
    gradient: "from-teal-500 via-emerald-500 to-cyan-500",
    shadow: "shadow-teal-500/30",
    glow: "rgba(13, 148, 136, 0.15)",
  },
  green: {
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    shadow: "shadow-green-500/30",
    glow: "rgba(34, 197, 94, 0.15)",
  },
  amber: {
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    shadow: "shadow-amber-500/30",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  red: {
    gradient: "from-red-500 via-rose-500 to-pink-500",
    shadow: "shadow-red-500/30",
    glow: "rgba(239, 68, 68, 0.15)",
  },
  blue: {
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    shadow: "shadow-blue-500/30",
    glow: "rgba(59, 130, 246, 0.15)",
  },
  purple: {
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    shadow: "shadow-purple-500/30",
    glow: "rgba(139, 92, 246, 0.15)",
  },
};

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  color = "primary",
  index = 0 
}: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="stat-card-premium card-inner-glow relative overflow-hidden"
    >
      {/* Decorative glow */}
      <div 
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-all duration-300"
        style={{ backgroundColor: styles.glow }}
      />
      
      <div className="flex items-center gap-4 relative z-10">
        {/* Icon with 3D effect */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
          `bg-gradient-to-br ${styles.gradient}`,
          styles.shadow
        )}
        style={{
          boxShadow: `0 4px 12px -2px ${styles.glow.replace('0.15', '0.4')}, inset 0 1px 0 rgba(255,255,255,0.2)`
        }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
            className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
          >
            {typeof value === "number" ? (
              <CountUp end={value} />
            ) : (
              value
            )}
          </motion.p>
          {description && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Simple count-up animation component
function CountUp({ end }: { end: number }) {
  return <span>{end}</span>;
}
