# Frontend My Jarvis Gua

Next.js App Router, React, TanStack Query, Zustand, dan Tailwind. Panduan konfigurasi, port, database, pemeriksaan, dan deployment ada di [README proyek](../README.md).

Jalankan pnpm dev, pnpm lint, pnpm test, pnpm typecheck, dan pnpm build dari direktori ini. Simpan konfigurasi lokal di .env.local; hanya variabel publik boleh memakai awalan NEXT_PUBLIC_.

public/optimized berisi turunan WebP; PNG asli dipertahankan. Generator scripts/optimize-assets.mjs memakai sharp dari Next.js. Jalankan node scripts/optimize-assets.mjs setelah menambahkan referensi PNG baru dan periksa hasil visual.
