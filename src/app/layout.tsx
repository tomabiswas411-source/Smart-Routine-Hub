import type { Metadata, Viewport } from "next";
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
  keywords: ["Routine", "Schedule", "Academic", "Class", "University", "Smart Routine Hub", "ICE", "Rajshahi University"],
  authors: [{ name: "Smart Routine Hub" }],
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Routine Hub",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Smart Routine Hub" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
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
