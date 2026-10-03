"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Database,
  Trash2,
  Download,
  RefreshCw,
  ChevronRight,
  Info,
} from "lucide-react";
import { exportExpensesCsv } from "@/features/expense/api/expenseApi";
import { getQueryClient } from "@/lib/query-client";
import { useChatStore } from "@/features/chat/store";
import {
  getStoredDarkMode,
  setDarkModePreference,
  subscribeThemeChange,
} from "@/lib/theme";

// ── Toggle Component ──
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
        transition-colors duration-200
        ${enabled ? "bg-primary" : "bg-muted-foreground/30"}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 rounded-full bg-background shadow-sm
          transition-transform duration-200
          ${enabled ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}

// ── Settings Item ──
function SettingsItem({
  icon: Icon,
  label,
  description,
  action,
  onClick,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger";
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick } : {})}
      className={`
        w-full flex items-center gap-3 px-4 py-3.5 text-left
        transition-colors duration-150
        ${onClick ? (variant === "danger" ? "hover:bg-destructive/5" : "hover:bg-muted/50") : ""}
      `}
    >
      <div
        className={`
          w-9 h-9 rounded-xl flex items-center justify-center shrink-0
          ${variant === "danger" ? "bg-destructive/10" : "bg-primary/10"}
        `}
      >
        <Icon
          className={`w-4.5 h-4.5 ${variant === "danger" ? "text-destructive" : "text-primary"}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${variant === "danger" ? "text-destructive" : "text-foreground"}`}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onClick && !action && (
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
    </Wrapper>
  );
}

// ── Section ──
function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-1">
        {title}
      </h3>
      <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const darkMode = useSyncExternalStore(
    subscribeThemeChange,
    () => getStoredDarkMode() ?? false,
    () => false,
  );
  const [isExporting, setIsExporting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleDarkModeChange = (value: boolean) => {
    setDarkModePreference(value);
  };

  const handleExportData = async () => {
    setActionMessage(null);
    setIsExporting(true);

    try {
      const blob = await exportExpensesCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `expenses_export_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setActionMessage("Export berhasil. File CSV sudah diunduh.");
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Gagal export data",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 space-y-5">
      {actionMessage && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
          {actionMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Konfigurasi aplikasi sesuai preferensi kamu.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>

      {/* ── Tampilan ── */}
      <SettingsSection title="Tampilan">
        <SettingsItem
          icon={darkMode ? Moon : Sun}
          label="Mode Gelap"
          description={darkMode ? "Tema gelap aktif" : "Tema terang aktif"}
          action={<Toggle enabled={darkMode} onChange={handleDarkModeChange} />}
        />
      </SettingsSection>

      {/* ── Notifikasi ── */}
      <SettingsSection title="Notifikasi">
        <SettingsItem
          icon={Bell}
          label="Push Notifications"
          description="Belum tersedia"
        />
      </SettingsSection>

      {/* ── Data & Sinkronisasi ── */}
      <SettingsSection title="Data & Sinkronisasi">
        <SettingsItem
          icon={RefreshCw}
          label="Sinkronisasi"
          description="Data dimuat dari server ketika halaman dibuka atau diperbarui"
        />
        <SettingsItem
          icon={Download}
          label="Export Data"
          description="Download semua data sebagai CSV"
          onClick={handleExportData}
          action={
            isExporting ? (
              <span className="text-xs text-muted-foreground">
                Exporting...
              </span>
            ) : undefined
          }
        />
        <SettingsItem
          icon={Database}
          label="Cache & Storage"
          description="Kelola penyimpanan lokal"
          onClick={() => {
            useChatStore.getState().clearConversation();
            void getQueryClient().resetQueries();
            setActionMessage("Cache dan percakapan lokal dibersihkan.");
          }}
        />
      </SettingsSection>

      {/* ── Zona Bahaya ── */}
      <SettingsSection title="Zona Bahaya">
        <SettingsItem
          icon={Trash2}
          label="Hapus Semua Data"
          description="Belum tersedia. Hapus transaksi melalui halaman transaksi."
          variant="danger"
        />
      </SettingsSection>

      {/* ── App Info ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <SettingsItem
          icon={Info}
          label="Tentang Aplikasi"
          description="My Jarvis Gua v0.1.0"
        />
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        Made with 💜 by Muhammad Fauza
      </p>
    </div>
  );
}
