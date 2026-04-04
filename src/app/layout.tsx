import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { NextAuthProvider } from "@/providers/session-provider";
import { SettingsProvider } from "@/providers/settings-provider";
import { DesktopNav, MobileHeader } from "@/components/layout/desktop-nav";
import { MobileBottomNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Routine Hub - Academic Schedule Management",
  description: "Smart Routine Hub - Your complete academic companion for class schedules, routines, and academic activities. Manage and view class schedules with real-time updates.",
  keywords: ["Routine", "Schedule", "Academic", "Class", "University", "Smart Routine Hub"],
  authors: [{ name: "Smart Routine Hub" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Smart Routine Hub - Academic Schedule Management",
    description: "Your complete academic companion for managing class schedules",
    url: "https://smart-routine-hub.vercel.app",
    siteName: "Smart Routine Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Routine Hub - Academic Schedule Management",
    description: "Your complete academic companion for managing class schedules",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <NextAuthProvider>
            <SettingsProvider>
              <div className="min-h-screen flex flex-col">
                {/* Mobile Header */}
                <MobileHeader />
                
                {/* Desktop Navigation */}
                <DesktopNav />
                
                {/* Main Content */}
                <main className="flex-1 pb-20 md:pb-0">
                  {children}
                </main>
                
                {/* Footer - Sticky Footer */}
                <Footer />
              </div>
              
              {/* Mobile Bottom Navigation */}
              <MobileBottomNav />
              
              {/* Toast Notifications */}
              <Toaster position="top-center" />
            </SettingsProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
