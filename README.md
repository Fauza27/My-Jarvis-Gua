# My Jarvis Gua / Life OS

Aplikasi pencatatan keuangan dengan Next.js, FastAPI, Supabase, chat AI, dan Telegram. Modul lain pada landing masih merupakan roadmap.

## Menjalankan lokal

Gunakan Python 3.11, Node.js 24, dan pnpm 10.30.0. Salin backend/.env.example ke backend/.env dan frontend/.env.example ke frontend/.env.local, lalu isi konfigurasi. Jangan commit kredensial. Telegram webhook aktif ketika URL webhook diisi.

```powershell
cd backend
python -m venv venv
./venv/Scripts/python -m pip install -r requirements-dev.txt
./venv/Scripts/python -m uvicorn app.core.application:create_app --factory --reload --port 8080
```

Terminal kedua:

```powershell
cd frontend
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Frontend berjalan pada http://localhost:3000, API pada http://localhost:8080. Permintaan browser /api diteruskan Next.js ke NEXT_PUBLIC_API_URL. CORS dan FRONTEND_URL harus cocok dengan host aplikasi.

## Database dan deployment

backend/schema.sql adalah baseline proyek baru. Untuk database berisi data, gunakan migrasi di backend/patches; jangan menjalankan seluruh baseline berulang. Ringkasan perubahan tersedia di [docs/REMEDIATION.md](docs/REMEDIATION.md). Bukti database per lingkungan disimpan lokal.

Workflow quality-checks.yml memeriksa backend serta lint, tes, dan build frontend. Push ke main memicu deployment setelah pemeriksaan tersebut lulus. Deployment diserialisasi agar beberapa push tidak menjalankan deployment bersamaan. Terapkan migrasi sebelum menjalankan kode yang membutuhkan kolom atau RPC baru.

Webhook diproses berurutan per proses. ConversationHandler masih memakai memori: gunakan satu instance/satu worker sampai tersedia penyimpanan percakapan dan deduplikasi update yang tahan restart. Workflow deployment memakai batas service Cloud Run `--max=1`. Batas scaling bukan pengganti state durable: restart dan overlap rollout tetap perlu ditangani. API multi-instance memerlukan RATE_LIMIT_STORAGE_URI menuju Redis bersama. Jangan mempercayai forwarded header dari semua alamat; verifikasi rantai proxy deployment terlebih dahulu.

## Pemeriksaan

```powershell
./backend/venv/Scripts/python docs/project-review/run_remediation_checks.py
cd frontend
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

Runner backend memakai mock dan memblokir layanan eksternal. Tes integration live memerlukan database test terpisah; jangan arahkan fixture atau destructive test ke production. Alat verifikasi portabel ada di docs/project-review; snapshot, screenshot, dan laporan audit mentah tetap lokal dan diabaikan Git.

## Embedding dan zona waktu

Tanggal relatif mengikuti zona waktu perangkat frontend. Profil menyimpan zona waktu saat login/refresh untuk Telegram. Akun lama memakai UTC sampai sinkronisasi pertama.

Dari backend, `python scripts/retry_embeddings.py --limit 20` hanya memeriksa antrean. Tambahkan `--execute` untuk menghasilkan embedding melalui OpenAI: teks transaksi akan dikirim dan API berbayar digunakan. Batas default `--max-cost-usd 0.01` mencadangkan estimasi konservatif sebelum setiap request; model dengan tarif tidak dikenal ditolak dan retry otomatis dimatikan. Periksa kembali tarif resmi sebelum pemakaian berikutnya. Worker membaca versi terbaru transaksi dan menolak hasil kedaluwarsa. Embedding yang gagal tetap pending. Gunakan `--report hasil.json` untuk menyimpan statistik agregat tanpa teks transaksi.
