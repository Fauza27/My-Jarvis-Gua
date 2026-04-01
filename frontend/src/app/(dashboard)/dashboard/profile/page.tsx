"use client";

import { useState } from "react";
import Link from "next/link";
import { getValidToken } from "@/features/auth/api/authApi";

export default function ProfilePage() {
  const [connectCode, setConnectCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      if (!token) throw new Error("No valid token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/me/telegram/connect-code`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Gagal generate kode");
      }

      const data = await res.json();
      setConnectCode(data.code);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile & Integrasi</h1>
          <p className="text-sm text-gray-600 mt-1">Hubungkan akun kamu dengan layanan pihak ketiga.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-700 hover:text-blue-800 hover:underline">
          Kembali ke Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Telegram Bot (My Jarvis Gua)</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Integrasikan akun ini dengan bot Telegram untuk mencatat keuangan langsung dari chat.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        {connectCode ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-4">
            <p className="text-sm text-gray-500 mb-2">Kode Connect Telegram kamu:</p>
            <div className="flex items-center space-x-3">
              <code className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-lg font-mono font-bold tracking-wider">
                {connectCode}
              </code>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Buka bot telegram kamu dan ketikkan:<br />
              <span className="font-mono bg-gray-200 px-1 py-0.5 rounded text-gray-800 mt-1 inline-block">/connect {connectCode}</span>
            </p>
            <p className="text-xs text-red-500 mt-2">Kode ini berlaku selama 10 menit.</p>
          </div>
        ) : null}

        <button
          onClick={generateCode}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Generating..." : connectCode ? "Generate Ulang Kode" : "Generate Kode Telegram"}
        </button>
      </div>
    </div>
  );
}
