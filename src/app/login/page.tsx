"use client";

import { useState, useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Smartphone, KeyRound, ArrowLeft, Delete, Sparkles, GraduationCap, Zap } from "lucide-react";
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
  
  // PIN Login State
  const [showPinLogin, setShowPinLogin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isPinLoading, setIsPinLoading] = useState(false);

  // Clear any corrupted session cookies on mount
  useEffect(() => {
    const clearCorruptedSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        
        if (!response.ok || data.error) {
          await signOut({ redirect: false });
        }
      } catch {
        await signOut({ redirect: false });
      }
    };
    
    clearCorruptedSession();
  }, []);

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
        setError("Invalid email or password. Please try again.");
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
    } catch {
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
      // Sign in using the PIN provider
      const result = await signIn("pin", {
        pin: pinCode,
        redirect: false,
      });

      if (result?.error) {
        setPinError("Invalid PIN code. Please try again.");
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
    } catch {
      setPinError("An error occurred. Please try again.");
      setPin("");
    } finally {
      setIsPinLoading(false);
    }
  };

  const pinDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {!showPinLogin ? (
          <motion.div
            key="email-login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md relative z-10"
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-block group">
                <motion.div 
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 rounded-2xl" />
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10 rounded-2xl" />
                  {/* Shadow */}
                  <div className="absolute inset-0 rounded-2xl shadow-lg shadow-teal-500/30" />
                  
                  <div className="relative flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">ICE</span>
                    <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
                  </div>
                </motion.div>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Teacher & Admin Portal</h1>
              <p className="text-muted-foreground mt-1 flex items-center justify-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-500" />
                ICE Department, Rajshahi University
              </p>
            </div>

            {/* Login Card */}
            <motion.div 
              className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 p-6 shadow-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Card inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent dark:from-white/5 pointer-events-none rounded-2xl" />
              
              {/* Top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
              
              <h2 className="text-lg font-semibold text-foreground mb-4 relative flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Sign In
              </h2>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm mb-4"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 relative">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 focus:border-teal-500 focus:ring-teal-500/20"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 focus:border-teal-500 focus:ring-teal-500/20"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-teal-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-600 hover:via-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 transition-all"
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
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700"
                  onClick={() => setShowPinLogin(true)}
                >
                  <Smartphone className="w-4 h-4 text-teal-500" />
                  Quick PIN Login (Mobile)
                </Button>
              </div>
            </motion.div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-teal-500 transition-colors">
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
            className="w-full max-w-sm relative z-10"
          >
            {/* Logo */}
            <div className="text-center mb-6">
              <motion.div 
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl shadow-lg shadow-amber-500/30" />
                
                <KeyRound className="relative w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">PIN Login</h1>
              <p className="text-muted-foreground text-sm mt-1">Enter your 6-digit PIN</p>
            </div>

            {/* PIN Display */}
            <motion.div 
              className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-700/50 p-6 shadow-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Card inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent dark:from-white/5 pointer-events-none rounded-2xl" />
              {/* Top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />

              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 gap-2 relative"
                onClick={() => setShowPinLogin(false)}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Email Login
              </Button>

              {/* PIN Dots */}
              <div className="flex items-center justify-center gap-3 mb-6 relative">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 transition-all",
                      pin.length > index 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 border-amber-500 shadow-md shadow-amber-500/30" 
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
                  className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm mb-4"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {pinError}
                </motion.div>
              )}

              {/* Loading */}
              {isPinLoading && (
                <div className="flex items-center justify-center gap-2 mb-4 text-amber-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              )}

              {/* PIN Keypad */}
              <div className="grid grid-cols-3 gap-3 relative">
                {pinDigits.map((digit, index) => {
                  if (digit === "") {
                    return <div key={index} className="aspect-square" />;
                  }
                  
                  if (digit === "del") {
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="aspect-square text-lg font-semibold h-auto bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
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
                        "aspect-square rounded-xl text-xl font-semibold transition-all relative overflow-hidden",
                        "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 text-white",
                        "hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600",
                        "shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10 pointer-events-none" />
                      <span className="relative">{digit}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-amber-500 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
