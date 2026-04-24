"use client";

import { RegisterForm } from "@/features/auth/components/RegisterForm";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleRegister = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) {
        console.error("OAuth error:", error);
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error("Failed to initiate Google OAuth:", error);
      setIsGoogleLoading(false);
    }
  };
  return (
    <div className="w-full bg-background page-transition">
      <div className="grid lg:grid-cols-2 ">
        {/* ── Left Side: Illustration ──────────────────────────────────── */}
        <aside className="hidden lg:flex items-center justify-center bg-muted/30 slide-in-left">
          <div className="relative w-full text-center ">
            {/* Headline */}
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">My Jarvis Gua</h1>

            {/* Subheading */}
            <p className="text-base text-muted-foreground mb-8">Create your account to access your personalized Co-Pilot</p>

            {/* Image */}
            <div className="relative flex items-center justify-center">
              <Image 
                src="/Logo-register-fullBody.png" 
                alt="My Jarvis Gua - Register Illustration" 
                width={1780} 
                height={1502} 
                className="mx-auto"
                priority 
              />
            </div>
          </div>
        </aside>

        {/* ── Right Side: Form ──────────────────────────────────────────── */}
        <div className="w-full slide-in-right">
          {/* ── Card ──────────────────────────────────────────────────────────── */}
          <div className="bg-card lg:rounded-l-3xl lg:min-h-screen p-8 sm:p-10">
            {/* ── Header: Logo + Headline (Mobile Only) ──────────────────────────────────── */}
            <div className="text-center mb-8 lg:hidden">
              {/* Logo - Responsive: Head for small screens, FullBody for larger screens */}
              <div className="inline-flex items-center justify-center mb-4">
                {/* Small screens: register mascot */}
                <Image src="/Logo-register-fullBody.png" alt="My Jarvis Gua Register Logo" width={48} height={48} className="rounded-xl sm:hidden" priority />
                {/* Medium screens: register mascot */}
                <Image src="/Logo-register-fullBody.png" alt="My Jarvis Gua Register Logo" width={120} height={120} className="rounded-xl hidden sm:block" priority />
              </div>

              {/* Headline */}
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Create Account</h1>

              {/* Subheading */}
              <p className="mt-2 text-sm text-muted-foreground">Join My Jarvis Gua to get your personalized Co-Pilot</p>
            </div>

            {/* ── Get Started (Desktop Only) ──────────────────────────────────── */}
            <div className="hidden lg:block text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Get started</h1>
              <p className="mt-2 text-sm text-muted-foreground">Create your account to begin your journey</p>
            </div>

            {/* ── Form Component ──────────────────────────────────────────────*/}
            <RegisterForm />

            {/* ── Divider + Social Login───────────────────────── */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-card text-muted-foreground">or register with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="mt-4 grid grid-cols-1">
                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleRegister}
                  disabled={isGoogleLoading}
                  aria-label="Register with Google"
                  className="
                    flex items-center justify-center gap-2 h-10 px-4
                    rounded-lg border border-border bg-background
                    text-sm font-medium text-foreground
                    hover:bg-muted active:bg-muted/80
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
                    transition-colors duration-150
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      {/* Google Icon */}
                      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Google
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Login Link ──────────────────────────────────────────── */}
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground hover:text-foreground/80 hover:underline
                              focus:outline-none focus:underline"
                >
                  Login
                </Link>
              </p>
            </div>

            {/* ── Link Terms & Privacy ──────────────────────────────────────────── */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="hover:underline hover:text-foreground focus:outline-none focus:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="hover:underline hover:text-foreground focus:outline-none focus:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
