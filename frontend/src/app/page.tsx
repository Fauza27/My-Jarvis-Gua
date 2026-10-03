import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navbar */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Image
              src="/optimized/logo-maskot.webp"
              alt="My Jarvis Gua Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Jarvis Gua
            </span>
          </div>
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12 md:py-24">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-secondary opacity-50 blur-xl"></div>
            <Image
              src="/optimized/logo-maskot.webp"
              alt="My Jarvis Gua Maskot"
              width={120}
              height={120}
              className="relative rounded-2xl shadow-2xl ring-1 ring-border"
              priority
            />
          </div>
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Your Intelligent{" "}
              <span className="text-primary">Second Brain</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Manage your finances, health, vehicles, and daily tasks in one
              unified workspace. Powered by AI, designed for you.
            </p>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              Go to Dashboard
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mt-24 md:mt-32">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-warning" />
              Core Modules
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* 1. Finance Tracker (Active) */}
            <Link href="/dashboard" className="group block">
              <div className="h-full relative overflow-hidden rounded-2xl border border-primary/30 bg-card p-6 shadow-lg transition-all hover:shadow-primary/20 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Image
                      src="/optimized/Logo-Finance-Tracker.webp"
                      alt="Finance Tracker"
                      width={40}
                      height={40}
                      className="rounded-lg object-contain"
                    />
                  </div>
                  <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                    Active
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  Finance Tracker
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track spending, record transactions, and get actionable budget
                  insights.
                </p>
              </div>
            </Link>

            {/* 2. Vehicle Monitoring (Upcoming) */}
            <div className="h-full relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 opacity-80 transition-all hover:opacity-100 hover:border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl">
                  <Image
                    src="/optimized/Logo-Vechile-Monitoring.webp"
                    alt="Vehicle Monitoring"
                    width={40}
                    height={40}
                    className="rounded-lg object-contain grayscale opacity-70 transition-all group-hover:grayscale-0 group-hover:opacity-100"
                  />
                </div>
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  Upcoming
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground/80">
                Vehicle Monitoring
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stay on top of maintenance. Track mileage, predict repairs, and
                avoid unexpected mechanic bills.
              </p>
            </div>

            {/* 3. Diet & Calorie Monitor (Upcoming) */}
            <div className="h-full relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 opacity-80 transition-all hover:opacity-100 hover:border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl">
                  <Image
                    src="/optimized/Logo-Diet.webp"
                    alt="Diet Monitor"
                    width={40}
                    height={40}
                    className="rounded-lg object-contain grayscale opacity-70 transition-all group-hover:grayscale-0 group-hover:opacity-100"
                  />
                </div>
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  Upcoming
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground/80">
                Diet & Calorie Monitor
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Snap a photo to log meals. Track calories and macros seamlessly.
              </p>
            </div>

            {/* 4. Health Center (Upcoming) */}
            <div className="h-full relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 opacity-80 transition-all hover:opacity-100 hover:border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl">
                  <Image
                    src="/optimized/Logo-Health-center.webp"
                    alt="Health Center"
                    width={40}
                    height={40}
                    className="rounded-lg object-contain grayscale opacity-70 transition-all group-hover:grayscale-0 group-hover:opacity-100"
                  />
                </div>
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  Upcoming
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground/80">
                Health Center
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sync your nutrition and activity data to get personalized health
                guidance.
              </p>
            </div>

            {/* 5. Running Coach (Upcoming) */}
            <div className="h-full relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 opacity-80 transition-all hover:opacity-100 hover:border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl">
                  <Image
                    src="/optimized/Logo-Running-Coach.webp"
                    alt="Running Coach"
                    width={40}
                    height={40}
                    className="rounded-lg object-contain grayscale opacity-70 transition-all group-hover:grayscale-0 group-hover:opacity-100"
                  />
                </div>
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  Upcoming
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground/80">
                Running Coach
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Adaptive training plans designed to help you crush your next
                marathon goal.
              </p>
            </div>

            {/* 6. Study & Task Scheduler (Upcoming) */}
            <div className="h-full relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 opacity-80 transition-all hover:opacity-100 hover:border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl">
                  <Image
                    src="/optimized/Logo-Study-Task-Scheduler.webp"
                    alt="Study Scheduler"
                    width={40}
                    height={40}
                    className="rounded-lg object-contain grayscale opacity-70 transition-all group-hover:grayscale-0 group-hover:opacity-100"
                  />
                </div>
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  Upcoming
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground/80">
                Study & Task Scheduler
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Auto-generate study schedules around your deadlines, classes,
                and downtime.
              </p>
            </div>

            {/* 7. TaskWeave (Upcoming) */}
            <div className="h-full relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 opacity-80 transition-all hover:opacity-100 hover:border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl">
                  <Image
                    src="/optimized/logo-maskot.webp"
                    alt="TaskWeave"
                    width={40}
                    height={40}
                    className="rounded-lg object-contain grayscale opacity-70 transition-all group-hover:grayscale-0 group-hover:opacity-100"
                  />
                </div>
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  Upcoming
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground/80">
                TaskWeave
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your proactive daily assistant. Prioritize tasks and orchestrate
                your workflow automatically.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-24">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} My Jarvis Gua. Built with AI.</p>
        </div>
      </footer>
    </div>
  );
}
