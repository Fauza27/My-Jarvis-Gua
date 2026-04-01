"use client";

import { useAuthStore } from "@/features/auth/store";
import { useRouter } from "next/navigation";
import { logout } from "@/features/auth/api/authApi";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Dashboard</h2>
        <div className="space-y-2">
          <p className="text-gray-600">
            <span className="font-medium">Email:</span> {user?.email}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">User ID:</span> {user?.id}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Email Confirmed:</span> {user?.email_confirmed ? "Yes" : "No"}
          </p>
        </div>
      </div>

      <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
        Logout
      </button>

      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard/expenses" className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Buka Expense Tracker
        </Link>
        <Link href="/dashboard/profile" className="inline-flex px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          Buka Profile (Connect Telegram)
        </Link>
      </div>
    </div>
  );
}
