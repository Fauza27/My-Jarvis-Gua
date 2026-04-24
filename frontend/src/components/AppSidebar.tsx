"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CirclePlus, House, MessageCircle, Settings, UserRound, PanelLeft, PanelLeftClose } from "lucide-react";
import { useSidebarStore } from "@/features/sidebar/store";

interface AppSidebarProps {
  avatar: {
    display_name: string;
    avatar_url: string;
  };
}

const navItems = [
  { href: "/dashboard", icon: House, label: "Home" },
  { href: "/dashboard/add", icon: CirclePlus, label: "Add" },
  { href: "/dashboard/chat", icon: MessageCircle, label: "Chat", useImage: true },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/dashboard/profile", icon: UserRound, label: "Profile" },
];

export function AppSidebar({ avatar }: AppSidebarProps) {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();

  // Keyboard shortcut: Ctrl + . to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ".") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:shrink-0 border-r border-border/40 bg-sidebar transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "md:w-[260px]" : "md:w-0"
        }`}
      >
        <div className="flex h-full w-[260px] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/Logo-Finance-Tracker-HeadVersion(small).png"
                alt="Life OS Logo"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-base font-bold text-sidebar-foreground tracking-tight">Life OS</span>
            </Link>
            <button
              type="button"
              onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Close sidebar"
              title="Close sidebar (Ctrl+.)"
            >
              <PanelLeftClose className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            <ul className="space-y-0.5">
              {navItems.map(({ href, icon: Icon, label, useImage }) => {
                const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      {useImage ? (
                        <Image
                          src="/Logo-Chat.png"
                          alt="Chat"
                          width={40}
                          height={40}
                          className="h-7 w-7 object-contain"
                        />
                      ) : (
                        <Icon className={`h-[18px] w-[18px] ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                      )}
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile - Bottom */}
          <div className="border-t border-sidebar-border/40 px-3 py-3">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-sidebar-accent/50"
            >
              {avatar.avatar_url ? (
                <Image
                  src={avatar.avatar_url}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="rounded-lg shrink-0"
                />
              ) : (
                <Image
                  src="/Logo-profile.png"
                  alt="avatar"
                  width={32}
                  height={32}
                  className="rounded-lg shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">{avatar.display_name}</p>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggle}
          className="hidden md:flex fixed top-4 left-4 z-50 h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-card/80 text-muted-foreground backdrop-blur transition-all duration-200 hover:bg-card hover:text-foreground hover:shadow-sm"
          aria-label="Open sidebar"
          title="Open sidebar (Ctrl+.)"
        >
          <PanelLeft className="h-4.5 w-4.5" />
        </button>
      )}
    </>
  );
}
