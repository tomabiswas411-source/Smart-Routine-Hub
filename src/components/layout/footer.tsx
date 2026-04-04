"use client";

import { Heart, Mail, Phone, MapPin, Facebook, Globe, CalendarDays, Twitter, Instagram, Youtube } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore } from "@/store/settings-store";

export function Footer() {
  const { settings } = useSettingsStore();

  return (
    <footer className="mt-auto bg-card border-t border-border">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{settings.siteName || "Smart Routine Hub"}</h3>
                <p className="text-xs text-muted-foreground">{settings.siteTagline || "Academic Schedule Management"}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {settings.footerDescription || settings.aboutText || "Your complete academic companion for managing class schedules, routines, and academic activities."}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              {(settings.footerQuickLinks?.length > 0 ? settings.footerQuickLinks : [
                { label: "Home", href: "/" },
                { label: "Master Routine", href: "/?view=master-calendar" },
                { label: "Student View", href: "/?view=student" },
                { label: "Library", href: "/?view=library" },
              ]).map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Admin Login
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact Us</h4>
            <div className="space-y-3">
              {settings.address && (
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>{settings.address}</span>
                </div>
              )}
              {settings.contactEmail && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-primary transition-colors">
                    {settings.contactEmail}
                  </a>
                </div>
              )}
              {settings.contactPhone && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <a href={`tel:${settings.contactPhone}`} className="hover:text-primary transition-colors">
                    {settings.contactPhone}
                  </a>
                </div>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex gap-2 pt-2">
              {settings.facebookURL && (
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" asChild>
                  <a href={settings.facebookURL} target="_blank" rel="noopener noreferrer">
                    <Facebook className="w-4 h-4" />
                  </a>
                </Button>
              )}
              {settings.twitterURL && (
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" asChild>
                  <a href={settings.twitterURL} target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-4 h-4" />
                  </a>
                </Button>
              )}
              {settings.youtubeURL && (
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" asChild>
                  <a href={settings.youtubeURL} target="_blank" rel="noopener noreferrer">
                    <Youtube className="w-4 h-4" />
                  </a>
                </Button>
              )}
              {settings.instagramURL && (
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" asChild>
                  <a href={settings.instagramURL} target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-4 h-4" />
                  </a>
                </Button>
              )}
              {settings.websiteURL && (
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" asChild>
                  <a href={settings.websiteURL} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4" />
                  </a>
                </Button>
              )}
              {settings.contactEmail && (
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" asChild>
                  <a href={`mailto:${settings.contactEmail}`}>
                    <Mail className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            Developed with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for {settings.siteName || "Smart Routine Hub"}
          </p>
          <p>© {new Date().getFullYear()} {settings.departmentName || settings.siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
