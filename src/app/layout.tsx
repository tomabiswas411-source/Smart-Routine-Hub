import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { NextAuthProvider } from "@/providers/session-provider";
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
  title: "ICE Department - Rajshahi University",
  description: "Department of Information and Communication Engineering, Rajshahi University. Your complete academic companion for class schedules, teacher information, notices, and academic calendar.",
  keywords: ["ICE", "Rajshahi University", "Engineering", "Class Schedule", "Academic", "Bangladesh"],
  authors: [{ name: "ICE Department" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ICE Department - Rajshahi University",
    description: "Your complete academic companion for ICE Department",
    url: "https://ice.ru.ac.bd",
    siteName: "ICE-RU Department Management System",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ICE Department - Rajshahi University",
    description: "Your complete academic companion for ICE Department",
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
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
