"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface TeacherCardProps {
  teacher: User;
  index?: number;
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Designation badge colors
const designationColors: Record<string, string> = {
  Professor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "Associate Professor": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Assistant Professor": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  Lecturer: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

export function TeacherCard({ teacher, index = 0 }: TeacherCardProps) {
  const designationColor = designationColors[teacher.designation || "Lecturer"] || designationColors.Lecturer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="bg-card rounded-xl border border-border overflow-hidden transition-all card-hover cursor-pointer group"
    >
      <div className="p-6 text-center">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <Avatar className="w-20 h-20 border-4 border-background shadow-lg group-hover:border-primary/20 transition-colors">
            <AvatarImage src={teacher.photoURL || undefined} alt={teacher.fullName} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {getInitials(teacher.fullName)}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator (optional) */}
          {teacher.isActive && (
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-card rounded-full" />
          )}
        </div>

        {/* Name & Designation */}
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {teacher.fullName}
        </h3>
        {teacher.designation && (
          <span className={cn(
            "inline-block mt-2 text-[10px] font-medium px-3 py-1 rounded-full border",
            designationColor
          )}>
            {teacher.designation}
          </span>
        )}

        {/* Quick Contact */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {teacher.email && (
            <a
              href={`mailto:${teacher.email}`}
              className="w-8 h-8 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          {teacher.phone && (
            <a
              href={`tel:${teacher.phone}`}
              className="w-8 h-8 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          {teacher.officeRoom && (
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
