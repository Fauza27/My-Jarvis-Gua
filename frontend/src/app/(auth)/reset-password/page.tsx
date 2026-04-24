"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import Image from "next/image";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-lg p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Check for errors in URL
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashError = hashParams.get("error");
    const hashErrorDescription = hashParams.get("error_description");

    if (errorParam || hashError) {
      setError(errorDescription || hashErrorDescription || "Reset password link is invalid or has expired. Please request a new one.");
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get access token from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");

      if (!accessToken) {
        throw new Error("No access token found. Please use the link from your email.");
      }

      // Use Supabase to update password
      const { supabase } = await import("@/lib/supabase");
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card rounded-lg p-8 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/Login-Head.png" alt="My Jarvis Gua Logo" width={64} height={64} className="rounded-xl" />
          </div>
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password Failed</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button onClick={() => router.push("/forgot-password")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card rounded-lg p-8 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/Login-Head.png" alt="My Jarvis Gua Logo" width={64} height={64} className="rounded-xl" />
          </div>
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset Successful</h1>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/Login-Head.png" alt="My Jarvis Gua Logo" width={64} height={64} className="rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reset Your Password</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Password Field */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter new password"
                disabled={isLoading}
                className={`
                  w-full h-11 pl-10 pr-11 rounded-lg border text-sm
                  text-foreground placeholder:text-muted-foreground
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-offset-1
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.password ? "border-destructive bg-destructive/5 focus:ring-destructive focus:border-destructive" : "border-input bg-background focus:ring-ring"}
                `}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-foreground hover:text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                {...register("confirmPassword")}
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm new password"
                disabled={isLoading}
                className={`
                  w-full h-11 pl-10 pr-3.5 rounded-lg border text-sm
                  text-foreground placeholder:text-muted-foreground
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-offset-1
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.confirmPassword ? "border-destructive bg-destructive/5 focus:ring-destructive focus:border-destructive" : "border-input bg-background focus:ring-ring"}
                `}
              />
            </div>
            {errors.confirmPassword && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full h-11 px-4 rounded-lg
              bg-primary hover:bg-primary/90 active:bg-primary/80
              text-primary-foreground text-sm font-semibold
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
