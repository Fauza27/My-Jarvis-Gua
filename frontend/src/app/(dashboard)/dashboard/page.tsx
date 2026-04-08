"use client";

import { DashboardCard } from "@/components/DashboardCard";
import { ClipboardList, Apple, Dumbbell, BookOpen, Target } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-4 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, choose a menu below.</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-3">
        <DashboardCard title="Expense Tracker" description="Kelola pemasukan & pengeluaran" iconImage="/Logo-Finance-Tracker.png" href="/dashboard/expenses" />
        <DashboardCard title="Catat Tugas" description="To-do list & manajemen tugas" icon={ClipboardList} href="/dashboard/tasks" />
        <DashboardCard title="Catat Makanan" description="Tracking nutrisi harian" icon={Apple} href="/dashboard/nutrition" />
        <DashboardCard title="Olahraga" description="Log aktivitas & workout" icon={Dumbbell} href="/dashboard/fitness" />
        <DashboardCard title="Jurnal" description="Catatan harian & refleksi" icon={BookOpen} href="/dashboard/journal" />
        <DashboardCard title="Goals" description="Target & progress tracker" icon={Target} href="/dashboard/goals" />
      </div>
    </div>
  );
}
