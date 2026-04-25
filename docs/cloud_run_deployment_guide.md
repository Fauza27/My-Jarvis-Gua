# 🚀 Panduan Deploy ke Google Cloud Run (Pemula)

Panduan ini step-by-step untuk deploy backend Life OS ke Cloud Run.
Setiap langkah ada screenshot mental dan command yang bisa di-copy-paste.

---

## Fase 0: Persiapan — Apa yang Dibutuhkan

| Item | Status |
|------|--------|
| Google Account (Gmail) | Wajib punya |
| Kartu kredit/debit | Wajib untuk aktivasi billing (tidak akan dicharge jika masih free tier) |
| Project backend Life OS | ✅ Sudah ada |
| Dockerfile | ✅ Sudah dibuat |

---

## Fase 1: Buat Google Cloud Project

### 1.1 Buka Google Cloud Console

Buka browser → [console.cloud.google.com](https://console.cloud.google.com)

Login dengan akun Google kamu.

### 1.2 Buat Project Baru

1. Klik dropdown **project** di pojok kiri atas (sebelah logo "Google Cloud")
2. Klik **"New Project"**
3. Isi:
   - **Project name:** `life-os` (atau nama apapun)
   - **Organization:** biarkan default
4. Klik **"Create"**
5. Tunggu beberapa detik → project terbuat

> [!IMPORTANT]
> Catat **Project ID** (bukan Project Name). Biasanya format: `life-os-123456`. Ini yang akan dipakai di command-command selanjutnya.

### 1.3 Aktifkan Billing

1. Di console, buka **Navigation menu (☰)** → **Billing**
2. Klik **"Link a billing account"**
3. Ikuti wizard → masukkan kartu kredit/debit
4. Pilih **"Start my free trial"** jika tersedia → kamu dapat **$300 free credits** selama 90 hari

> [!NOTE]
> Google **tidak akan mencharge** kartu kamu setelah free trial habis kecuali kamu upgrade manual. Jadi aman.

---

## Fase 2: Install Google Cloud CLI (gcloud) di Windows

### 2.1 Download Installer

Buka: [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

Klik **"Windows"** → Download **Google Cloud CLI installer (.exe)**

### 2.2 Install

1. Jalankan `GoogleCloudSDKInstaller.exe`
2. Ikuti wizard — **pastikan semua checkbox tercentang:**
   - ☑ Add gcloud CLI to PATH
   - ☑ Start Cloud SDK Shell
3. Setelah install selesai, akan otomatis buka terminal

### 2.3 Login & Setup

Buka **PowerShell baru** (penting: harus terminal baru agar PATH ter-update), lalu:

```powershell
# Login ke Google Cloud
gcloud init
```

Ini akan:
1. Buka browser → login dengan Google Account
2. Tanya pilih project → pilih project yang tadi dibuat (`life-os`)
3. Tanya default region → pilih **`asia-southeast3`** (Bangkok)

### 2.4 Verifikasi

```powershell
gcloud --version
```

Harus muncul versi gcloud. Kalau error "not recognized", restart PowerShell.

---

## Fase 3: Enable API yang Dibutuhkan

Cloud Run butuh beberapa API diaktifkan. Jalankan ini di PowerShell:

```powershell
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

> [!NOTE]
> Command ini cukup dijalankan **sekali saja**. Tunggu beberapa detik sampai selesai.

---

## Fase 4: Deploy! 🚀

### 4.1 Navigasi ke Folder Backend

```powershell
cd "C:\Users\Muhammad Fauza\life-os\backend"
```

### 4.2 Deploy dari Source

```powershell
gcloud run deploy life-os-backend `
  --source . `
  --region asia-southeast3 `
  --allow-unauthenticated
```

> [!IMPORTANT]
> **Pertama kali deploy akan makan waktu 3-5 menit** karena Cloud Build harus build Docker image. Deploy berikutnya lebih cepat (~1-2 menit).

Saat diminta konfirmasi, ketik **Y** lalu Enter.

### 4.3 Hasil Deploy

Setelah selesai, kamu akan melihat output seperti:

```
Service [life-os-backend] revision [life-os-backend-00001-abc] has been deployed
Service URL: https://life-os-backend-xxxxx-xx.a.run.app
```

**Catat URL ini!** Ini adalah URL publik backend kamu.

### 4.4 Test

Buka URL di browser atau jalankan:

```powershell
# Ganti URL dengan URL kamu yang asli
Invoke-RestMethod -Uri "https://life-os-backend-xxxxx-xx.a.run.app/health"
```

Harusnya keluar response health check (mungkin error Supabase karena belum set env vars — itu normal).

---

## Fase 5: Set Environment Variables

Deploy pertama **pasti gagal** karena belum ada env vars (Supabase, OpenAI, Telegram). Kita perlu set semuanya.

### 5.1 Set Env Vars via gcloud CLI

```powershell
gcloud run services update life-os-backend `
  --region asia-southeast3 `
  --set-env-vars "SUPABASE_URL=https://your-project.supabase.co" `
  --set-env-vars "SUPABASE_ANON_KEY=your-anon-key" `
  --set-env-vars "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" `
  --set-env-vars "SUPABASE_JWT_SECRET=your-jwt-secret" `
  --set-env-vars "SUPABASE_TEST_URL=https://your-test.supabase.co" `
  --set-env-vars "SUPABASE_TEST_SERVICE_ROLE_KEY=your-test-key" `
  --set-env-vars "SUPABASE_TEST_ANON_KEY=your-test-anon" `
  --set-env-vars "OPENAI_API_KEY=sk-proj-xxxxx" `
  --set-env-vars "TELEGRAM_BOT_TOKEN=your-bot-token" `
  --set-env-vars "TELEGRAM_WEBHOOK_SECRET=your-random-secret" `
  --set-env-vars "ENVIRONMENT=production"
```

> [!WARNING]
> **Ganti semua value** di atas dengan value asli dari file `.env` kamu. Jangan copy-paste mentah!

> [!TIP]
> **Alternatif: Via Google Cloud Console (GUI)**
> 1. Buka [console.cloud.google.com/run](https://console.cloud.google.com/run)
> 2. Klik service `life-os-backend`
> 3. Klik **"Edit & Deploy New Revision"**
> 4. Scroll ke **"Variables & Secrets"**
> 5. Tambahkan env vars satu per satu
> 6. Klik **"Deploy"**
>
> Cara GUI ini **lebih mudah untuk pemula** karena bisa lihat semua vars sekaligus.

### 5.2 Set Webhook URL

Setelah env vars diset, kita perlu set `TELEGRAM_WEBHOOK_URL` ke URL Cloud Run kamu:

```powershell
gcloud run services update life-os-backend `
  --region asia-southeast3 `
  --update-env-vars "TELEGRAM_WEBHOOK_URL=https://life-os-backend-xxxxx-xx.a.run.app"
```

> [!IMPORTANT]
> Ganti `https://life-os-backend-xxxxx-xx.a.run.app` dengan URL Cloud Run **yang asli** dari output deploy di Fase 4.

### 5.3 Verifikasi

```powershell
# Test health check
Invoke-RestMethod -Uri "https://life-os-backend-xxxxx-xx.a.run.app/health"
```

Seharusnya sekarang keluar:
```json
{
  "status": "healthy",
  "supabase": "connected",
  "telegram_bot": "running"
}
```

---

## Fase 6: Test Telegram Bot! 🤖

1. Buka Telegram
2. Cari bot kamu
3. Kirim `/start`
4. Jika bot merespons → **Selamat! Deployment berhasil!** 🎉

---

## Troubleshooting

### ❌ "Build failed"

```powershell
# Lihat log build
gcloud builds log --region=asia-southeast3
```

Biasanya karena:
- Typo di `Dockerfile` atau `requirements.txt`
- Package yang tidak kompatibel

### ❌ Bot tidak merespons

```powershell
# Lihat log runtime
gcloud run services logs read life-os-backend --region asia-southeast3 --limit 50
```

Periksa:
- Apakah `TELEGRAM_WEBHOOK_URL` sudah benar?
- Apakah `TELEGRAM_BOT_TOKEN` sudah benar?
- Apakah ada error di log?

### ❌ "Container failed to start"

Biasanya karena env vars yang belum diset. Pastikan semua env vars dari `.env` sudah diset di Cloud Run.

### ❌ Health check menunjukkan "unhealthy"

Periksa `SUPABASE_URL` dan key-key lainnya. Mungkin ada yang typo.

---

## Tips Biaya & Monitoring

### Cek Penggunaan
1. Buka [console.cloud.google.com/run](https://console.cloud.google.com/run)
2. Klik service kamu
3. Tab **"Metrics"** → lihat request count, latency, dll.

### Cek Biaya
1. Buka [console.cloud.google.com/billing](https://console.cloud.google.com/billing)
2. Klik **"Reports"** → lihat breakdown biaya

### Atur Alert Biaya
1. **Billing** → **Budgets & alerts**
2. Buat budget $5 → set alert di 50%, 90%, 100%
3. Kamu akan dapat email kalau biaya mendekati limit

> [!TIP]
> Dengan free tier di `asia-southeast3`, bot personal kemungkinan besar **$0/bulan**. Tapi tetap set alert untuk jaga-jaga.

---

## Cheat Sheet — Command yang Sering Dipakai

```powershell
# Deploy ulang (setelah update kode)
gcloud run deploy life-os-backend --source . --region asia-southeast3

# Lihat log real-time
gcloud run services logs tail life-os-backend --region asia-southeast3

# Lihat log terakhir
gcloud run services logs read life-os-backend --region asia-southeast3 --limit 30

# Update env vars
gcloud run services update life-os-backend --region asia-southeast3 `
  --update-env-vars "KEY=value"

# Lihat detail service
gcloud run services describe life-os-backend --region asia-southeast3

# Lihat URL service
gcloud run services describe life-os-backend --region asia-southeast3 --format="value(status.url)"
```

---

## Apa Selanjutnya?

Setelah deploy berhasil, kamu bisa setup:

1. **Custom Domain** — Pakai domain sendiri instead of `xxxxx.run.app`
2. **CI/CD Auto-deploy** — Push ke GitHub → otomatis deploy (via Cloud Build trigger)
3. **Frontend deploy** — Deploy Next.js frontend juga ke Cloud Run atau Vercel
