"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { verifyToken } from "@/features/auth/api/authApi";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for errors in URL
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashError = hashParams.get("error");
        const hashErrorDescription = hashParams.get("error_description");

        if (errorParam || hashError) {
          setError(errorDescription || hashErrorDescription || "Authentication failed");
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        // Import Supabase client dynamically
        const { supabase } = await import("@/lib/supabase");

        // Check if we have a code parameter (PKCE flow from OAuth)
        const code = searchParams.get("code");
        
        if (code) {
          // PKCE flow - exchange code for session
          // code_verifier should be in localStorage (created when OAuth was initiated)
          console.log("Handling PKCE flow with code");
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.search
          );

          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);
            setError(exchangeError.message || "Failed to complete authentication");
            setTimeout(() => router.push("/login"), 3000);
            return;
          }

          if (!data.session) {
            setError("No session received after code exchange");
            setTimeout(() => router.push("/login"), 3000);
            return;
          }

          const { access_token, refresh_token, expires_at } = data.session;

          // Verify token with backend
          try {
            const userData = await verifyToken(access_token);
            
            const user = {
              id: userData.user_id,
              email: userData.email,
              created_at: new Date().toISOString(),
              email_confirmed: true,
            };

            // Store auth data
            setAuth(access_token, refresh_token, expires_at || 0, user);
            
            // Redirect to dashboard
            router.push("/dashboard");
          } catch (verifyError) {
            console.error("Token verification failed:", verifyError);
            setError("Failed to verify authentication with server");
            setTimeout(() => router.push("/login"), 3000);
          }
        } else {
          // Implicit flow - check for tokens in hash or localStorage
          console.log("Handling implicit flow");
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error("Session error:", sessionError);
            setError(sessionError.message || "Failed to retrieve session");
            setTimeout(() => router.push("/login"), 3000);
            return;
          }

          if (!session) {
            setError("No session found. Please try logging in again.");
            setTimeout(() => router.push("/login"), 3000);
            return;
          }

          const { access_token, refresh_token, expires_at } = session;

          // Verify token with backend
          try {
            const userData = await verifyToken(access_token);
            
            const user = {
              id: userData.user_id,
              email: userData.email,
              created_at: new Date().toISOString(),
              email_confirmed: true,
            };

            // Store auth data
            setAuth(access_token, refresh_token, expires_at || 0, user);
            
            // Redirect to dashboard
            router.push("/dashboard");
          } catch (verifyError) {
            console.error("Token verification failed:", verifyError);
            setError("Failed to verify authentication with server");
            setTimeout(() => router.push("/login"), 3000);
          }
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [router, setAuth, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <Image 
            src="/Login-Head.png" 
            alt="My Jarvis Gua Logo" 
            width={64} 
            height={64} 
            className="rounded-xl" 
          />
        </div>

        {error ? (
          <>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Failed</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Completing Sign In</h1>
            <p className="text-muted-foreground">Please wait while we set up your account...</p>
          </>
        )}
      </div>
    </div>
  );
}
