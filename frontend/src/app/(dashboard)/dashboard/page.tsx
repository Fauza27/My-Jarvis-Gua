import { DashboardCard } from "@/components/DashboardCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-4 md:space-y-7 md:p-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-foreground md:text-2xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, choose a menu below.</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        <DashboardCard title="Finance Tracker" description="Kelola pemasukan & pengeluaran" iconImage="/Logo-Finance-Tracker.png" href="/dashboard/expenses" />
        <DashboardCard title="Catat Tugas" description="To-do list & manajemen tugas" iconImage="/Logo-Finance-Tracker.png" href="/dashboard/tasks" disabled />
        <DashboardCard title="Catat Makanan" description="Tracking nutrisi harian" iconImage="/Logo-Finance-Tracker.png" href="/dashboard/nutrition" disabled />
        <DashboardCard title="Olahraga" description="Log aktivitas & workout" iconImage="/Logo-Finance-Tracker.png" href="/dashboard/fitness" disabled />
        <DashboardCard title="Jurnal" description="Catatan harian & refleksi" iconImage="/Logo-Finance-Tracker.png" href="/dashboard/journal" disabled />
        <DashboardCard title="Goals" description="Target & progress tracker" iconImage="/Logo-Finance-Tracker.png" href="/dashboard/goals" disabled />
      </div>
    </div>
  );
}
