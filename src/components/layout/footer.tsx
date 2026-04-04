"use client";

import { Heart, Mail, Phone, MapPin, Facebook, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="mt-auto bg-card border-t border-border">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Department Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg hero-gradient flex items-center justify-center">
                <span className="text-white font-bold text-lg">ICE</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">ICE Department</h3>
                <p className="text-xs text-muted-foreground">Rajshahi University</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Department of Information and Communication Engineering, dedicated to excellence in education and research.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link href="#schedule" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Class Schedule
              </Link>
              <Link href="#teachers" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Teacher Directory
              </Link>
              <Link href="#notices" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Notice Board
              </Link>
              <Link href="#calendar" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Academic Calendar
              </Link>
              <Link href="#about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <a href="mailto:ice@ru.ac.bd" className="hover:text-primary transition-colors">
                  ice@ru.ac.bd
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <a href="tel:+880721750123" className="hover:text-primary transition-colors">
                  +880-721-750123
                </a>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Facebook className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" asChild>
                <a href="mailto:ice@ru.ac.bd">
                  <Mail className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            Developed with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for ICE Department
          </p>
          <p>© {new Date().getFullYear()} ICE Department, Rajshahi University. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
