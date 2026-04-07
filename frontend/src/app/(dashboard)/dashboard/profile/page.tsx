"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { logout, getValidToken } from "@/features/auth/api/authApi";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bot,
  Copy,
  Check,
  Bell,
  Shield,
  Palette,
  Globe,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Camera,
  CircleUserRound,
} from "lucide-react";

// ── Dummy data (nanti diganti dari database) ──
const dummyProfile = {
  display_name: "Muhammad Fauza",
  email: "fauza@example.com",
  phone: "+62 812-3456-7890",
  location: "Jakarta, Indonesia",
  avatar_url: "",
  joined_date: "Maret 2026",
  telegram_connected: false,
};

// ── Menu Item Component ──
function ProfileMenuItem({
  icon: Icon,
  label,
  value,
  onClick,
  variant = "default",
  chevron = true,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  variant?: "default" | "danger";
  chevron?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3.5
        transition-colors duration-150 text-left
        ${variant === "danger"
          ? "hover:bg-destructive/5"
          : "hover:bg-muted/50"
        }
      `}
    >
      <div
        className={`
          w-9 h-9 rounded-xl flex items-center justify-center shrink-0
          ${variant === "danger"
            ? "bg-destructive/10"
            : "bg-primary/10"
          }
        `}
      >
        <Icon
          className={`w-4.5 h-4.5 ${
            variant === "danger" ? "text-destructive" : "text-primary"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            variant === "danger" ? "text-destructive" : "text-foreground"
          }`}
        >
          {label}
        </p>
        {value && (
          <p className="text-xs text-muted-foreground truncate">{value}</p>
        )}
      </div>
      {chevron && (
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
    </button>
  );
}

// ── Section Component ──
function ProfileSection({
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

export default function ProfilePage() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  // ── Telegram Connect ──
  const [connectCode, setConnectCode] = useState<string | null>(null);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  const generateCode = async () => {
    setIsCodeLoading(true);
    setCodeError(null);
    try {
      const token = await getValidToken();
      if (!token) throw new Error("No valid token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/profile/me/telegram/connect-code`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Gagal generate kode");
      }

      const data = await res.json();
      setConnectCode(data.code);
    } catch (err: any) {
      setCodeError(err.message || "Terjadi kesalahan");
    } finally {
      setIsCodeLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!connectCode) return;
    await navigator.clipboard.writeText(`/connect ${connectCode}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  return (
    <>
      <div className="p-4 space-y-5">
        {/* ── Avatar & Name ── */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative mb-3">
            {dummyProfile.avatar_url ? (
              <img
                src={dummyProfile.avatar_url}
                alt="Profile"
                className="w-20 h-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CircleUserRound className="w-10 h-10 text-primary" />
              </div>
            )}
            <button
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              title="Ubah foto profil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {dummyProfile.display_name}
          </h2>
          <p className="text-sm text-muted-foreground">{dummyProfile.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Bergabung sejak {dummyProfile.joined_date}
          </p>
        </div>

        {/* ── Informasi Akun ── */}
        <ProfileSection title="Informasi Akun">
          <ProfileMenuItem
            icon={User}
            label="Nama Lengkap"
            value={dummyProfile.display_name}
            onClick={() => {}}
          />
          <ProfileMenuItem
            icon={Mail}
            label="Email"
            value={dummyProfile.email}
            onClick={() => {}}
          />
          <ProfileMenuItem
            icon={Phone}
            label="Nomor Telepon"
            value={dummyProfile.phone}
            onClick={() => {}}
          />
          <ProfileMenuItem
            icon={MapPin}
            label="Lokasi"
            value={dummyProfile.location}
            onClick={() => {}}
          />
        </ProfileSection>

        {/* ── Integrasi ── */}
        <ProfileSection title="Integrasi">
          <ProfileMenuItem
            icon={Bot}
            label="Telegram Bot"
            value={
              dummyProfile.telegram_connected
                ? "Terhubung"
                : "Belum terhubung"
            }
            onClick={() => setShowTelegramModal(true)}
          />
        </ProfileSection>

        {/* ── Preferensi ── */}
        <ProfileSection title="Preferensi">
          <ProfileMenuItem
            icon={Bell}
            label="Notifikasi"
            value="Aktif"
            onClick={() => {}}
          />
          <ProfileMenuItem
            icon={Palette}
            label="Tema"
            value="Light Mode"
            onClick={() => {}}
          />
          <ProfileMenuItem
            icon={Globe}
            label="Bahasa"
            value="Indonesia"
            onClick={() => {}}
          />
        </ProfileSection>

        {/* ── Lainnya ── */}
        <ProfileSection title="Lainnya">
          <ProfileMenuItem
            icon={Shield}
            label="Privasi & Keamanan"
            onClick={() => {}}
          />
          <ProfileMenuItem
            icon={HelpCircle}
            label="Bantuan & FAQ"
            onClick={() => {}}
          />
          <ProfileMenuItem
            icon={FileText}
            label="Syarat & Ketentuan"
            onClick={() => {}}
          />
        </ProfileSection>

        {/* ── Logout ── */}
        <div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <ProfileMenuItem
              icon={LogOut}
              label="Logout"
              onClick={handleLogout}
              variant="danger"
              chevron={false}
            />
          </div>
        </div>

        {/* ── Version ── */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          My Jarvis Gua · v0.1.0
        </p>
      </div>

      {/* ── Telegram Connect Modal ── */}
      {showTelegramModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          onClick={() => setShowTelegramModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="
              relative w-full sm:max-w-md
              bg-card border border-border
              rounded-t-3xl sm:rounded-2xl
              p-6 pb-8
              animate-in slide-in-from-bottom-4 duration-300
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-card-foreground">
                  Telegram Bot
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Integrasikan akun dengan bot Telegram untuk mencatat keuangan
                  langsung dari chat.
                </p>
              </div>
            </div>

            {/* Error */}
            {codeError && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-xl mb-4 text-sm border border-destructive/20">
                {codeError}
              </div>
            )}

            {/* Connect Code */}
            {connectCode && (
              <div className="bg-muted rounded-xl p-4 mb-4 border border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  Kode Connect kamu:
                </p>
                <div className="flex items-center gap-3">
                  <code className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-lg font-mono font-bold tracking-wider">
                    {connectCode}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg hover:bg-muted-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
                    title="Copy command"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Buka bot telegram lalu ketik:
                  <br />
                  <span className="font-mono bg-muted-foreground/10 px-1.5 py-0.5 rounded text-foreground mt-1 inline-block">
                    /connect {connectCode}
                  </span>
                </p>
                <p className="text-xs text-destructive mt-2">
                  Kode berlaku 10 menit.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={generateCode}
                disabled={isCodeLoading}
                className="
                  flex-1 inline-flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-xl
                  bg-primary text-primary-foreground
                  text-sm font-medium
                  hover:bg-primary/90 active:bg-primary/80
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isCodeLoading
                  ? "Generating..."
                  : connectCode
                    ? "Generate Ulang"
                    : "Generate Kode"}
              </button>
              <button
                onClick={() => setShowTelegramModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
