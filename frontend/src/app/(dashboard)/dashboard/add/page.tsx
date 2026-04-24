"use client";

import { useState } from "react";
import { ArrowLeft, X, Construction } from "lucide-react";
import { ExpenseForm } from "@/features/expense/components/ExpenseForm";
import Link from "next/link";
import Image from "next/image";

type AddOption = {
  id: string;
  title: string;
  description: string;
  iconImage: string;
  available: boolean;
};

const addOptions: AddOption[] = [
  {
    id: "expense",
    title: "Transaksi Keuangan",
    description: "Catat pemasukan atau pengeluaran",
    iconImage: "/Logo-Finance-Tracker-HeadVersion(small).png",
    available: true,
  },
  {
    id: "task",
    title: "Tugas",
    description: "Tambah to-do list atau tugas",
    iconImage: "/Logo-Finance-Tracker-HeadVersion(small).png",
    available: false,
  },
  {
    id: "nutrition",
    title: "Catatan Makanan",
    description: "Catat makanan & nutrisi harian",
    iconImage: "/Logo-Finance-Tracker-HeadVersion(small).png",
    available: false,
  },
  {
    id: "fitness",
    title: "Aktivitas Olahraga",
    description: "Log workout & aktivitas fisik",
    iconImage: "/Logo-Finance-Tracker-HeadVersion(small).png",
    available: false,
  },
  {
    id: "journal",
    title: "Jurnal Harian",
    description: "Tulis catatan & refleksi harian",
    iconImage: "/Logo-Finance-Tracker-HeadVersion(small).png",
    available: false,
  },
  {
    id: "goal",
    title: "Target / Goals",
    description: "Set target baru & milestone",
    iconImage: "/Logo-Finance-Tracker-HeadVersion(small).png",
    available: false,
  },
];

// ── Coming Soon Placeholder Form ──
function ComingSoonForm({ option, onClose }: { option: AddOption; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Coming Soon</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Fitur <strong>{option.title}</strong> sedang dalam pengembangan.
        <br />
        Nantikan update berikutnya! 🚀
      </p>
      <button
        onClick={onClose}
        className="
          mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
          bg-primary text-primary-foreground
          text-sm font-medium
          hover:bg-primary/90 transition-colors
        "
      >
        Kembali
      </button>
    </div>
  );
}

export default function AddPage() {
  const [selectedOption, setSelectedOption] = useState<AddOption | null>(null);

  return (
    <>
      <div className="p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Tambah Data</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pilih jenis data yang ingin kamu tambahkan.</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addOptions.map((option) => {
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedOption(option)}
                className={`
                  group text-left bg-card rounded-2xl border p-4
                  transition-all duration-200 hover:-translate-y-0.5
                  ${option.available ? "border-border hover:border-primary/30 hover:shadow-md" : "border-border/50 opacity-70 hover:opacity-90"}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0">
                    <Image src={option.iconImage} alt={`${option.title} icon`} width={40} height={40} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-card-foreground">{option.title}</h3>
                      {!option.available && <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">Soon</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Form Overlay ── */}
      {selectedOption && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center" onClick={() => setSelectedOption(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />

          {/* Form Container */}
          <div
            className="
              relative w-full sm:max-w-lg
              bg-background border-t border-border sm:border sm:rounded-2xl
              rounded-t-3xl
              max-h-[85vh] overflow-y-auto
              animate-in slide-in-from-bottom-4 duration-300
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-background pt-3 pb-2 px-6 border-b border-border/50 rounded-t-3xl sm:rounded-t-2xl z-10">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Image src={selectedOption.iconImage} alt={`${selectedOption.title} icon`} width={32} height={32} className="object-contain" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">{selectedOption.title}</h2>
                </div>
                <button onClick={() => setSelectedOption(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 pt-4">
              {selectedOption.available && selectedOption.id === "expense" ? <ExpenseForm compact onSuccess={() => setSelectedOption(null)} /> : <ComingSoonForm option={selectedOption} onClose={() => setSelectedOption(null)} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
