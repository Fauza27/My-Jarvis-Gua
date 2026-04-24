"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { isTokenExpired } from "@/features/auth/utils";
import { useMyProfile } from "@/features/profile/hooks";
import Link from "next/link";
import { CirclePlus, House, MessageCircle, Settings, UserRound } from "lucide-react";
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, accessToken, expiresAt, hasHydrated, user } = useAuthStore();
  const profileQuery = useMyProfile();
  const isChatRoute = pathname.startsWith("/dashboard/chat");

  // const activeNavItem = navItems.find(({ href }) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href)));

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated || !accessToken || isTokenExpired(expiresAt)) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, accessToken, expiresAt, router]);

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated || !accessToken || isTokenExpired(expiresAt)) {
    return null;
  }

  const avatar = {
    display_name: profileQuery.data?.display_name || user?.email?.split("@")[0] || "User",
    avatar_url: profileQuery.data?.avatar_url || "",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop: Sidebar + Content */}
      <div className="hidden md:flex md:h-screen md:overflow-hidden">
        <AppSidebar avatar={avatar} />

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

          {/* Main content */}
          <main className={`flex-1 overflow-y-auto ${isChatRoute ? "" : "px-6 pb-8"}`}>
            <div className={`mx-auto w-full ${isChatRoute ? "h-full" : "max-w-6xl"}`}>{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile: Classic layout with bottom nav */}
      <div className="md:hidden">
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          {!isChatRoute && (
            <div className="p-4 pb-2">
              <header className="flex items-center justify-between">
                <Link href="/dashboard" className="inline-flex items-center gap-3 group">
                  {avatar.avatar_url ? (
                    <Image src={avatar.avatar_url} alt="avatar profile" width={60} height={60} className="rounded-xl" />
                  ) : (
                    <Image src="/Logo-profile.png" alt="avatar profile" width={60} height={60} className="rounded-xl" />
                  )}
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">Hello, {avatar.display_name}</h1>
                  </div>
                </Link>
              </header>
            </div>
          )}

          {/* Main content — padding bottom agar tidak tertutup navbar */}
          <main className={`flex-1 ${isChatRoute ? "pb-20" : "pb-28"}`}>
            <div className={`mx-auto w-full ${isChatRoute ? "" : ""}`}>{children}</div>
          </main>
        </div>

        {/* Bottom Navigation — fixed full width */}
        <nav className="fixed inset-x-0 bottom-0 z-50 rounded-t-lg border-t border-border/60 bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/85">
          <ul className="grid w-full grid-cols-5 items-end px-2 pt-2 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
            {/* Item Kiri */}
            {leftItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors duration-200
                      ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
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
                <Image src="/Logo-Chat.png" alt="Chat" width={56} height={56} className="h-17 w-17 object-contain" />
              </Link>
            </li>

            {/* Item Kanan */}
            {rightItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors duration-200
                      ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
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
