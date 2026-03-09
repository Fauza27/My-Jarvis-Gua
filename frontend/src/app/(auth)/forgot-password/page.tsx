import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Forgot Password - My Jarvis Gua",
  description: "Reset your My Jarvis Gua account password",
  robots: {
    index: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full bg-background page-transition">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* ── Left Side: Form ──────────────────────────────────────────── */}
        <div className="w-full slide-in-left">
          {/* ── Card ──────────────────────────────────────────────────────────── */}
          <div className="bg-card lg:rounded-r-3xl lg:min-h-screen p-8 sm:p-10">
            {/* ── Header: Logo + Headline (Mobile Only) ──────────────────────────────────── */}
            <div className="text-center mb-8 lg:hidden">
              {/* Logo - Responsive: Head for small screens, FullBody for larger screens */}
              <div className="inline-flex items-center justify-center mb-4">
                {/* Small screens: Login-Head.png */}
                <Image src="/Login-Head.png" alt="My Jarvis Gua Logo" width={48} height={48} className="rounded-xl sm:hidden" priority />
                {/* Medium screens: Login-FullBody.png */}
                <Image src="/Login-FullBody.png" alt="My Jarvis Gua Logo" width={120} height={120} className="rounded-xl hidden sm:block" priority />
              </div>

              {/* Headline */}
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Reset Password</h1>

              {/* Subheading */}
              <p className="mt-2 text-sm text-muted-foreground">Enter your email to receive a password reset link</p>
            </div>

            {/* ── Reset Password (Desktop Only) ──────────────────────────────────── */}
            <div className="hidden lg:block text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Reset your password</h1>
              <p className="mt-2 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link</p>
            </div>

            {/* ── Form Component ──────────────────────────────────────────────*/}
            <ForgotPasswordForm />

            {/* ── Back to Login Link ──────────────────────────────────────────── */}
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground hover:text-foreground/80 hover:underline
                              focus:outline-none focus:underline"
                >
                  Back to Login
                </Link>
              </p>
            </div>

            {/* ── Link Terms & Privacy ──────────────────────────────────────────── */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Need help?{" "}
              <Link href="/support" className="hover:underline hover:text-foreground focus:outline-none focus:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>

        {/* ── Right Side: Illustration ──────────────────────────────────── */}
        <aside className="hidden lg:flex items-center justify-center bg-muted/30 slide-in-right">
          <div className="relative w-full max-w-lg text-center">
            {/* Headline */}
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">Forgot Your Password?</h1>

            {/* Subheading */}
            <p className="text-base text-muted-foreground mb-8">No worries! We&apos;ll help you reset it and get back to your AI Co-Pilot</p>

            {/* Image */}
            <div className="relative">
              <Image 
                src="/Login-FullBody.png" 
                alt="My Jarvis Gua - AI Assistant Illustration" 
                width={400} 
                height={400} 
                className="mx-auto" 
                priority 
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
