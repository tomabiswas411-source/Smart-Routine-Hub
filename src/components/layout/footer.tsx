"use client";

import { Heart, Mail, Phone, MapPin, Facebook, Globe, CalendarDays, Twitter, Instagram, Youtube, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore } from "@/store/settings-store";
import { motion } from "framer-motion";

export function Footer() {
  const { settings } = useSettingsStore();

  return (
    <footer className="mt-auto relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      
      {/* Decorative top gradient bar */}
      <div className="relative h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
      
      {/* Decorative circles */}
      <div className="absolute top-20 -left-20 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />
      
      <div className="relative container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="relative w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 overflow-hidden"
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5" />
                <CalendarDays className="relative w-6 h-6 text-white" />
                <Sparkles className="absolute -top-0.5 -right-0.5 w-3 h-3 text-yellow-300 animate-pulse" />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {settings.siteName || "Smart Routine Hub"}
                </h3>
                <p className="text-xs text-muted-foreground">{settings.siteTagline || "Academic Schedule Management"}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {settings.footerDescription || settings.aboutText || "Your complete academic companion for managing class schedules, routines, and academic activities."}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <div className="w-8 h-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" />
              Quick Links
            </h4>
            <nav className="flex flex-col gap-2">
              {(settings.footerQuickLinks?.length > 0 ? settings.footerQuickLinks : [
                { label: "Home", href: "/" },
                { label: "Master Routine", href: "/?view=master-calendar" },
                { label: "Student View", href: "/?view=student" },
                { label: "Library", href: "/?view=library" },
              ]).map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link 
                    href={link.href} 
                    className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50 group-hover:bg-teal-500 transition-colors" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Link href="/login" className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors" />
                Admin Login
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <div className="w-8 h-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
              Contact Us
            </h4>
            <div className="space-y-3">
              {settings.address && (
                <div className="flex items-start gap-3 text-sm text-muted-foreground group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 flex items-center justify-center shrink-0 group-hover:from-teal-100 group-hover:to-emerald-100 dark:group-hover:from-teal-900/30 dark:group-hover:to-emerald-900/30 transition-colors">
                    <MapPin className="w-4 h-4 text-teal-500" />
                  </div>
                  <span className="pt-1">{settings.address}</span>
                </div>
              )}
              {settings.contactEmail && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center shrink-0 group-hover:from-amber-100 group-hover:to-orange-100 dark:group-hover:from-amber-900/30 dark:group-hover:to-orange-900/30 transition-colors">
                    <Mail className="w-4 h-4 text-amber-500" />
                  </div>
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors pt-1">
                    {settings.contactEmail}
                  </a>
                </div>
              )}
              {settings.contactPhone && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 flex items-center justify-center shrink-0 group-hover:from-cyan-100 group-hover:to-blue-100 dark:group-hover:from-cyan-900/30 dark:group-hover:to-blue-900/30 transition-colors">
                    <Phone className="w-4 h-4 text-cyan-500" />
                  </div>
                  <a href={`tel:${settings.contactPhone}`} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors pt-1">
                    {settings.contactPhone}
                  </a>
                </div>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex gap-2 pt-2">
              {settings.facebookURL && (
                <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-500 transition-all" asChild>
                    <a href={settings.facebookURL} target="_blank" rel="noopener noreferrer">
                      <Facebook className="w-4 h-4" />
                    </a>
                  </Button>
                </motion.div>
              )}
              {settings.twitterURL && (
                <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 hover:border-sky-400 hover:text-sky-500 transition-all" asChild>
                    <a href={settings.twitterURL} target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-4 h-4" />
                    </a>
                  </Button>
                </motion.div>
              )}
              {settings.youtubeURL && (
                <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 hover:border-red-400 hover:text-red-500 transition-all" asChild>
                    <a href={settings.youtubeURL} target="_blank" rel="noopener noreferrer">
                      <Youtube className="w-4 h-4" />
                    </a>
                  </Button>
                </motion.div>
              )}
              {settings.instagramURL && (
                <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 hover:border-pink-400 hover:text-pink-500 transition-all" asChild>
                    <a href={settings.instagramURL} target="_blank" rel="noopener noreferrer">
                      <Instagram className="w-4 h-4" />
                    </a>
                  </Button>
                </motion.div>
              )}
              {settings.websiteURL && (
                <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:text-teal-500 transition-all" asChild>
                    <a href={settings.websiteURL} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4" />
                    </a>
                  </Button>
                </motion.div>
              )}
              {settings.contactEmail && (
                <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:text-emerald-500 transition-all" asChild>
                    <a href={`mailto:${settings.contactEmail}`}>
                      <Mail className="w-4 h-4" />
                    </a>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <p className="flex items-center gap-1">
              Developed with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> for {settings.siteName || "Smart Routine Hub"}
            </p>
            {settings.developerName && (
              <p className="flex items-center gap-1">
                <span className="hidden sm:inline">•</span>
                <span>Developed by</span>
                {settings.developerURL ? (
                  <a 
                    href={settings.developerURL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors font-medium"
                  >
                    {settings.developerName}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-medium text-teal-600 dark:text-teal-400">{settings.developerName}</span>
                )}
              </p>
            )}
          </div>
          <p className="text-center md:text-right">© {new Date().getFullYear()} {settings.departmentName || settings.siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
