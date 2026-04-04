"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Database, CheckCircle, Smartphone, KeyRound, ArrowLeft, Delete } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  
  // PIN Login State
  const [showPinLogin, setShowPinLogin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isPinLoading, setIsPinLoading] = useState(false);

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

  // PIN Login Handler
  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setPinError("");
      
      // Auto submit when 6 digits entered
      if (newPin.length === 6) {
        handlePinSubmit(newPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setPinError("");
  };

  const handlePinSubmit = async (pinCode: string) => {
    setIsPinLoading(true);
    setPinError("");

    try {
      // PIN to email/password mapping (demo PINs)
      const pinMap: Record<string, { email: string; password: string }> = {
        "123456": { email: "admin@ice.ru.ac.bd", password: "password123" },
        "654321": { email: "rahman@ru.ac.bd", password: "password123" },
        "111111": { email: "karim@ru.ac.bd", password: "password123" },
        "222222": { email: "ahmed@ru.ac.bd", password: "password123" },
      };

      const credentials = pinMap[pinCode];
      
      if (!credentials) {
        setPinError("Invalid PIN code");
        setPin("");
        setIsPinLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        setPinError("Login failed. Please try again.");
        setPin("");
      } else {
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
      setPinError("An error occurred. Please try again.");
      setPin("");
    } finally {
      setIsPinLoading(false);
    }
  };

  const pinDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <AnimatePresence mode="wait">
        {!showPinLogin ? (
          <motion.div
            key="email-login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-block">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
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

              {/* PIN Login Option */}
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowPinLogin(true)}
                >
                  <Smartphone className="w-4 h-4" />
                  Quick PIN Login (Mobile)
                </Button>
              </div>

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
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  PIN: 123456 (Admin) | 654321 (Teacher)
                </p>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to Home
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pin-login"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
          >
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">PIN Login</h1>
              <p className="text-muted-foreground text-sm mt-1">Enter your 6-digit PIN</p>
            </div>

            {/* PIN Display */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 gap-2"
                onClick={() => setShowPinLogin(false)}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Email Login
              </Button>

              {/* PIN Dots */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 transition-all",
                      pin.length > index 
                        ? "bg-emerald-500 border-emerald-500" 
                        : "border-muted-foreground/30"
                    )}
                  />
                ))}
              </div>

              {/* Error Message */}
              {pinError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm mb-4"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {pinError}
                </motion.div>
              )}

              {/* Loading */}
              {isPinLoading && (
                <div className="flex items-center justify-center gap-2 mb-4 text-emerald-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              )}

              {/* PIN Keypad */}
              <div className="grid grid-cols-3 gap-3">
                {pinDigits.map((digit, index) => {
                  if (digit === "") {
                    return <div key={index} className="aspect-square" />;
                  }
                  
                  if (digit === "del") {
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="aspect-square text-lg font-semibold h-auto"
                        onClick={handlePinDelete}
                        disabled={pin.length === 0 || isPinLoading}
                      >
                        <Delete className="w-6 h-6" />
                      </Button>
                    );
                  }
                  
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePinInput(digit)}
                      disabled={isPinLoading}
                      className={cn(
                        "aspect-square rounded-xl text-xl font-semibold transition-all",
                        "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
                        "hover:from-emerald-600 hover:to-teal-700",
                        "shadow-md hover:shadow-lg",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {digit}
                    </motion.button>
                  );
                })}
              </div>

              {/* Demo PINs */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center mb-2">Demo PINs:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded-lg text-center">
                    <p className="font-medium text-foreground">Admin</p>
                    <p className="text-emerald-600 font-mono font-bold">123456</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg text-center">
                    <p className="font-medium text-foreground">Teacher</p>
                    <p className="text-emerald-600 font-mono font-bold">654321</p>
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
        )}
      </AnimatePresence>
    </div>
  );
}
