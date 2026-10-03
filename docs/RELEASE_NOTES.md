# Catatan rilis — 3 Oktober 2026

## Perubahan utama

Perbaikan ini memulihkan sesi browser melalui cookie, membatasi transaksi dan pekerjaan AI, memastikan retry transaksi memakai operation ID yang sama, serta memperkuat isolasi akses database. Pencatatan tanggal mengikuti zona waktu perangkat. Semantic search mendukung rentang tanggal dan retry embedding mempertahankan status pending ketika gagal.

UI menampilkan nominal desimal dengan benar, mengelola fokus modal dan error mutation, serta memakai aset WebP. Endpoint bot berjalan berurutan dalam request. Workflow CI/CD menjalankan quality gate, antrean deployment, dan batas service backend satu instance.

## Bukti sebelum publikasi source

| Pemeriksaan | Hasil |
|---|---|
| Regresi backend pada Python 3.11 dalam Docker | 148 tes lulus |
| Regresi frontend | 5 tes lulus |
| Lint, typecheck, build frontend | Lulus |
| Build image backend/frontend | Lulus |
| Startup, HTTP, shutdown container terisolasi | Lulus |
| Pemeriksaan kandidat commit terhadap nilai secret lokal | Lulus |

Tes container memakai konfigurasi sintetis dan tanpa jaringan eksternal. Hasil tersebut tidak membuktikan OAuth, reset password, atau integrasi provider pada production. Status deployment aktual diperiksa di [GitHub Actions](https://github.com/Fauza27/My-Jarvis-Gua/actions).

## Tindak lanjut

State percakapan Telegram masih memori dan dapat hilang saat restart. Penyimpanan state/dedup tahan restart, kuota bersama bila aplikasi berkembang ke multi-instance, penjadwalan retry embedding, serta dokumen legal masih menjadi pekerjaan lanjutan. Advisory dependency development yang belum memiliki patch tetap dicatat.

Lihat [ringkasan perbaikan](REMEDIATION.md) untuk migrasi dan kontrak aplikasi. File environment, bukti database, screenshot akun, dan dokumen pribadi tidak ikut publikasi source.
