# Perbaikan autentikasi, transaksi, dan deployment

## Perubahan aplikasi

- Sesi browser dipulihkan dari refresh cookie, dengan satu refresh untuk request paralel dan penjagaan respons sesi yang sudah kedaluwarsa. Logout membersihkan cookie, SDK, dan cache akun.
- Nominal divalidasi sebagai Decimal yang positif dan finite; tanggal memakai kalender valid serta zona waktu perangkat. Retry transaksi memakai UUID Idempotency-Key, dan konflik payload ditolak.
- Summary dan CSV menggunakan pagination; sel CSV berisiko formula dinetralkan. Chat dibatasi dalam history, tool work, dan output, serta mengembalikan receipt bila AI gagal sesudah transaksi berhasil.
- Telegram menerima percakapan private, mengonsumsi connect code secara atomik, dan memproses webhook berurutan dalam request. State percakapan masih memori.
- Semantic search mendukung filter tanggal sebelum ranking. Embedding memiliki penanda pending, invalidasi saat data berubah, conditional write terhadap versi sumber, dan worker retry dengan batas biaya.
- UI memperbaiki fokus modal, angka desimal, error mutation, halaman recovery, avatar, dan kontrol yang belum tersedia. Aset WebP digunakan tanpa menghapus sumber PNG.

## Database

Untuk lingkungan yang sudah berisi data, gunakan migrasi tanggal 2026-10-03 di backend/patches: restore authorization, active_expenses RLS, integrity/privileges, profile timezone, embedding retry, dan semantic date filter. Baseline backend/schema.sql untuk instalasi baru diselaraskan. Migrasi perlu tersedia sebelum kode yang membutuhkan kolom/RPC baru dijalankan. Bukti penerapan per lingkungan tidak dipublikasikan di repository.

## Verifikasi sebelum push

148 tes backend lulus pada Python 3.11 dalam Docker. Lima tes frontend, lint, typecheck, dan build lulus. Image aplikasi dibangun, lalu startup, HTTP, dan shutdown diuji tanpa jaringan eksternal menggunakan konfigurasi sintetis. Pengujian ini tidak menggantikan pengujian provider production. Runtime dependency audit tidak menemukan advisory yang diketahui pada checkpoint pemeriksaan; satu advisory development frontend masih menunggu patch resmi.

## Deployment dan tindak lanjut

Push main memicu quality gate sebelum build/push image dan deployment Cloud Run. Workflow menggunakan antrean deployment dan batas service backend --max=1. Frontend production dibangun ulang oleh CI dengan konfigurasi NEXT_PUBLIC yang sesuai lingkungan, bukan memakai image verifikasi sintetis lokal.

Tindak lanjut: state/dedup Telegram tahan restart, rate limit bersama bila multi-instance diperlukan, penjadwalan worker embedding, pengujian OAuth/recovery dan integrasi production, serta dokumen legal dari pemilik. Batas scaling tidak menjamin tidak ada overlap proses selama rollout.

Alat verifikasi portabel berada di docs/project-review. File .env, laporan mentah, snapshot database, dan screenshot akun tidak ikut commit.
