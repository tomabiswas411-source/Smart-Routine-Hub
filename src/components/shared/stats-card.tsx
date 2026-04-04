"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  color?: "primary" | "green" | "amber" | "red" | "blue";
  index?: number;
}

const colorStyles = {
  primary: {
    bg: "bg-primary/10",
    icon: "text-primary",
  },
  green: {
    bg: "bg-green-500/10",
    icon: "text-green-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    icon: "text-amber-500",
  },
  red: {
    bg: "bg-red-500/10",
    icon: "text-red-500",
  },
  blue: {
    bg: "bg-blue-500/10",
    icon: "text-blue-500",
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
      className="bg-card rounded-xl border border-border p-4 card-hover"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", styles.bg)}>
          <Icon className={cn("w-6 h-6", styles.icon)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
            className="text-2xl font-bold text-foreground"
          >
            {typeof value === "number" ? (
              <CountUp end={value} />
            ) : (
              value
            )}
          </motion.p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
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
