"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { getValidToken } from "@/features/auth/api/authApi";
import { useMyProfile } from "@/features/profile/hooks";
import Link from "next/link";
import {
  CirclePlus,
  House,
  MessageCircle,
  Settings,
  UserRound,
} from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";

const navItems = [
  { href: "/dashboard", icon: House, label: "Home" },
  { href: "/dashboard/add", icon: CirclePlus, label: "Add" },
  { href: "/dashboard/chat", icon: MessageCircle, label: "Chat" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/dashboard/profile", icon: UserRound, label: "Profile" },
];

const leftItems = navItems.slice(0, 2);
const rightItems = navItems.slice(3, 5);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hasHydrated, user } = useAuthStore();
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const profileQuery = useMyProfile(sessionReady && isAuthenticated);
  const isChatRoute = pathname.startsWith("/dashboard/chat");

  // const activeNavItem = navItems.find(({ href }) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href)));

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let active = true;
    void getValidToken(true)
      .then(() => {
        if (active) setSessionReady(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (!useAuthStore.getState().isAuthenticated) router.replace("/login");
        else
          setSessionError(
            error instanceof Error
              ? error.message
              : "Tidak dapat memulihkan sesi",
          );
      });
    return () => {
      active = false;
    };
  }, [hasHydrated, router]);

  if (!hasHydrated) {
    return null;
  }

  if (sessionError) {
    return (
      <p role="alert" className="p-6">
        {sessionError}{" "}
        <button onClick={() => window.location.reload()}>Coba lagi</button>
      </p>
    );
  }
  if (!sessionReady || !isAuthenticated) {
    return null;
  }

  const avatar = {
    display_name:
      profileQuery.data?.display_name || user?.email?.split("@")[0] || "User",
    avatar_url: profileQuery.data?.avatar_url || "",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop: Sidebar + Content */}
      <div className="flex min-h-screen md:h-screen md:overflow-hidden">
        <div className="hidden md:block">
          <AppSidebar avatar={avatar} />
        </div>

        {/* Main content area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Header — only shown on non-chat routes */}
          {!isChatRoute && (
            <div className="px-6 pt-6 pb-4">
              <header className="flex items-center justify-between">
                {/* Empty header area for desktop — sidebar handles navigation */}
              </header>
            </div>
          )}

          {/* Header */}
          {!isChatRoute && (
            <div className="p-4 pb-2 md:hidden">
              <header className="flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 group"
                >
                  {avatar.avatar_url ? (
                    <Image
                      unoptimized
                      src={avatar.avatar_url}
                      alt="avatar profile"
                      width={60}
                      height={60}
                      className="rounded-xl"
                    />
                  ) : (
                    <Image
                      src="/optimized/Logo-profile.webp"
                      alt="avatar profile"
                      width={60}
                      height={60}
                      className="rounded-xl"
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">
                      Hello, {avatar.display_name}
                    </h1>
                  </div>
                </Link>
              </header>
            </div>
          )}

          {/* Main content — padding bottom agar tidak tertutup navbar */}
          <main
            className={`flex-1 overflow-y-auto ${isChatRoute ? "pb-20 md:pb-0" : "pb-28 md:px-6 md:pb-8"}`}
          >
            <div
              className={`mx-auto w-full ${isChatRoute ? "h-full" : "max-w-6xl"}`}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      <div className="md:hidden">
        {/* Bottom Navigation — fixed full width */}
        <nav className="fixed inset-x-0 bottom-0 z-50 rounded-t-lg border-t border-border/60 bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/85">
          <ul className="grid w-full grid-cols-5 items-end px-2 pt-2 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
            {/* Item Kiri */}
            {leftItems.map(({ href, icon: Icon, label }) => {
              const isActive =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors duration-200
                      ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`}
                    />
                    <span className="text-[10px] font-medium">{label}</span>
                  </Link>
                </li>
              );
            })}

            {/* FAB Button Tengah */}
            <li className="flex justify-center">
              <Link
                href="/dashboard/chat"
                className="-mt-5 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary text-primary-foreground
                          shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-[1.03] active:scale-95"
                aria-label="Tambah baru"
              >
                <Image
                  src="/optimized/Logo-Chat.webp"
                  alt="Chat"
                  width={56}
                  height={56}
                  className="h-17 w-17 object-contain"
                />
              </Link>
            </li>

            {/* Item Kanan */}
            {rightItems.map(({ href, icon: Icon, label }) => {
              const isActive =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors duration-200
                      ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`}
                    />
                    <span className="text-[10px] font-medium">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
