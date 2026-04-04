"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth(requiredRole?: "teacher" | "admin") {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (requiredRole && session?.user?.role !== requiredRole && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [status, session, requiredRole, router]);

  return {
    user: session?.user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isTeacher: session?.user?.role === "teacher" || session?.user?.role === "admin",
    isAdmin: session?.user?.role === "admin",
  };
}
