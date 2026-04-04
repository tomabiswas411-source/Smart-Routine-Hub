"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Database, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedMessage("");
    setError("");
    
    try {
      const response = await fetch("/api/seed", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        setSeedMessage(`Database seeded! Created ${data.data.teachers} teachers, ${data.data.courses} courses.`);
      } else {
        setSeedMessage(data.message || "Database already has data.");
      }
    } catch (err) {
      setSeedMessage("Failed to seed database. Please try again.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again or seed the database first.");
      } else {
        // Check user role and redirect accordingly
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        
        if (session?.user?.role === "admin") {
          router.push("/admin");
        } else if (session?.user?.role === "teacher") {
          router.push("/teacher");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">ICE</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Teacher & Admin Portal</h1>
          <p className="text-muted-foreground mt-1">ICE Department, Rajshahi University</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground mb-4">Sign In</h2>

          {/* Seed Database Button */}
          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSeedDatabase}
              disabled={isSeeding}
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Initialize Database (First Time Setup)
                </>
              )}
            </Button>
            {seedMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400 text-sm mt-2"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {seedMessage}
              </motion.div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials (after seeding):</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-muted rounded-lg">
                <p className="font-medium text-foreground">Admin</p>
                <p className="text-muted-foreground">admin@ice.ru.ac.bd</p>
                <p className="text-muted-foreground">password123</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <p className="font-medium text-foreground">Teacher</p>
                <p className="text-muted-foreground">rahman@ru.ac.bd</p>
                <p className="text-muted-foreground">password123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
