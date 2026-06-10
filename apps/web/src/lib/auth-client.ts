"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const loginWithGoogle = async (callbackUrl?: string) => {
    await signIn("google", { callbackUrl: callbackUrl ?? "/dashboard" });
  };

  const loginWithEmail = async (
    email: string,
    password: string,
    callbackUrl?: string
  ) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl ?? "/dashboard",
    });

    if (result?.error) {
      return { error: "Invalid email or password" };
    }

    if (result?.url) {
      router.push(result.url);
    }

    return { success: true };
  };

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    loginWithGoogle,
    loginWithEmail,
    logout,
  };
}

export function useSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Failed to create account");
        return false;
      }

      return true;
    } catch {
      setError("An unexpected error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { signup, isLoading, error };
}
