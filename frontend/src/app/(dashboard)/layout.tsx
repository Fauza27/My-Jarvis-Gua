"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { isTokenExpired } from "@/features/auth/utils";
import Link from "next/link";
import { CirclePlus, CircleUserRound, House, MessageCircle, Settings, UserRound } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: House, label: "Home" },
  { href: "/dashboard/add", icon: CirclePlus, label: "Add" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/dashboard/profile", icon: UserRound, label: "Profile" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, accessToken, expiresAt, hasHydrated } = useAuthStore();

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
    display_name: "Muhammad Fauza",
    avatar_url: "",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="p-4 pb-2">
        <header>
          <Link href="/dashboard" className="inline-flex items-center gap-3 group">
            {avatar.avatar_url ? (
              <Image src={avatar.avatar_url} alt="avatar profile" width={40} height={40} className="rounded-xl" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CircleUserRound className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Selamat datang 👋</p>
              <h1 className="text-sm font-semibold text-foreground">{avatar.display_name}</h1>
            </div>
          </Link>
        </header>
      </div>

      {/* Main content — padding bottom agar tidak tertutup navbar */}
      <main className="pb-24">{children}</main>

      {/* Bottom Navigation — fixed sticky */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border px-4 py-2 safe-area-pb">
        <ul className="flex items-center justify-between max-w-lg mx-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`
                    flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl
                    transition-colors duration-200
                    ${isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
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
  );
}
