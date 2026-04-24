"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const AUTH_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, AUTH_TIMEOUT_MS);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    let isMounted = true;

    const failAuth = (message: string) => {
      if (!isMounted) return;
      setError(message);
      setTimeout(() => {
        if (isMounted) {
          router.replace("/login");
        }
      }, 3000);
    };

    const handleCallback = async () => {
      try {
        const persistSession = (session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>) => {
          if (!session.expires_at) {
            failAuth("Authentication session is invalid. Please sign in again.");
            return false;
          }

          setAuth(session.access_token, session.refresh_token ?? "", session.expires_at, {
            id: session.user.id,
            email: session.user.email ?? "",
            created_at: session.user.created_at,
            email_confirmed: session.user.email_confirmed_at != null,
          });

          if (isMounted) {
            router.replace("/dashboard");
          }

          return true;
        };

        const readCurrentSession = async () => {
          const { data, error: sessionError } = await withTimeout(supabase.auth.getSession(), "Authentication timeout. Please try signing in again.");

          if (sessionError) {
            throw sessionError;
          }

          return data.session;
        };

        const searchParams = new URLSearchParams(window.location.search);
        const authError = searchParams.get("error_description") ?? searchParams.get("error");

        if (authError) {
          failAuth(`Authentication failed: ${authError}`);
          return;
        }

        const code = searchParams.get("code");

        const existingSession = await readCurrentSession();
        if (existingSession && persistSession(existingSession)) {
          return;
        }

        if (!code) {
          failAuth("Authentication code is missing. Please try signing in again.");
          return;
        }

        const { data, error: exchangeError } = await withTimeout(supabase.auth.exchangeCodeForSession(code), "Authentication timeout. Please try signing in again.");

        if (exchangeError || !data.session) {
          const recoveredSession = await readCurrentSession();
          if (recoveredSession && persistSession(recoveredSession)) {
            return;
          }

          failAuth(exchangeError?.message ?? "Unable to complete authentication.");
          return;
        }

        persistSession(data.session);
      } catch (err) {
        failAuth(err instanceof Error ? err.message : "Unexpected authentication error. Please try again.");
      }
    };

    void handleCallback();

    return () => {
      isMounted = false;
    };
  }, [router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <Image src="/Login-Head.png" alt="My Jarvis Gua Logo" width={64} height={64} className="rounded-xl" />
        </div>

        {error ? (
          <>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
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
