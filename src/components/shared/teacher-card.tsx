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

// Designation gradient styles
const designationStyles: Record<string, { gradient: string; shadow: string }> = {
  Professor: { gradient: "from-purple-500 to-violet-500", shadow: "shadow-purple-500/30" },
  "Associate Professor": { gradient: "from-blue-500 to-indigo-500", shadow: "shadow-blue-500/30" },
  "Assistant Professor": { gradient: "from-teal-500 to-emerald-500", shadow: "shadow-teal-500/30" },
  Lecturer: { gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/30" },
};

export function TeacherCard({ teacher, index = 0 }: TeacherCardProps) {
  const designationStyle = designationStyles[teacher.designation || "Lecturer"] || designationStyles.Lecturer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative rounded-2xl overflow-hidden transition-all duration-300 grid-item-card group"
    >
      {/* Top gradient bar */}
      <div className={cn("h-1 bg-gradient-to-r", designationStyle.gradient)} />
      
      {/* Decorative glow */}
      <div 
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle, ${designationStyle.gradient.includes('purple') ? 'rgba(139, 92, 246, 0.2)' : 
            designationStyle.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.2)' :
            designationStyle.gradient.includes('teal') ? 'rgba(20, 184, 166, 0.2)' : 
            'rgba(245, 158, 11, 0.2)'} 0%, transparent 70%)`
        }}
      />
      
      <div className="p-6 text-center relative z-10">
        {/* Avatar with 3D effect */}
        <div className="relative inline-block mb-4">
          <Avatar className="w-20 h-20 border-4 border-background shadow-xl group-hover:scale-105 transition-transform duration-300"
            style={{
              boxShadow: `0 8px 24px -4px rgba(0,0,0,0.15), 0 4px 12px -2px rgba(0,0,0,0.1)`
            }}
          >
            <AvatarImage src={teacher.photoURL || undefined} alt={teacher.fullName} />
            <AvatarFallback className={cn(
              "text-lg font-bold text-white bg-gradient-to-br",
              designationStyle.gradient
            )}>
              {getInitials(teacher.fullName)}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator */}
          {teacher.isActive && (
            <div className="absolute bottom-1 right-1">
              <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-card rounded-full shadow-lg shadow-green-500/30" />
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-50" />
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-teal-600 group-hover:to-emerald-600 dark:group-hover:from-teal-400 dark:group-hover:to-emerald-400 transition-all duration-300">
          {teacher.fullName}
        </h3>
        
        {/* Designation Badge */}
        {teacher.designation && (
          <span className={cn(
            "inline-block mt-2 text-[10px] font-semibold px-3 py-1 rounded-full text-white shadow-md bg-gradient-to-r",
            designationStyle.gradient,
            designationStyle.shadow
          )}>
            {teacher.designation}
          </span>
        )}

        {/* Quick Contact with 3D buttons */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {teacher.email && (
            <motion.a
              href={`mailto:${teacher.email}`}
              className="w-9 h-9 rounded-xl bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-teal-100 hover:to-teal-200 dark:hover:from-teal-900/50 dark:hover:to-teal-800/50 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={(e) => e.stopPropagation()}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                boxShadow: '0 2px 8px -2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)'
              }}
            >
              <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </motion.a>
          )}
          {teacher.phone && (
            <motion.a
              href={`tel:${teacher.phone}`}
              className="w-9 h-9 rounded-xl bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-900/50 dark:hover:to-amber-800/50 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={(e) => e.stopPropagation()}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                boxShadow: '0 2px 8px -2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)'
              }}
            >
              <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </motion.a>
          )}
          {teacher.officeRoom && (
            <motion.div
              className="w-9 h-9 rounded-xl bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.1, y: -2 }}
              style={{
                boxShadow: '0 2px 8px -2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)'
              }}
            >
              <MapPin className="w-4 h-4 text-rose-500" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
