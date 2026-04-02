WELCOME = """
👋 *Halo, {first_name}\!*
 
Selamat datang di *My Jarvis Gua Bot* — Personal asisten kamu di Telegram\!
 
Untuk mulai, hubungkan akun kamu terlebih dahulu dengan perintah:
👉 `/connect <kode>`

Ambil kode dari web app:
Profile → Hubungkan Telegram → Generate Kode
 
Sudah punya akun? Langsung connect\!
Belum punya? Daftar dulu di [My\-Jarvis\-Gua\.com](http://localhost:3000)
""".strip()
 
ALREADY_CONNECTED = """
✅ *Akun kamu sudah terhubung\!*
 
Halo, *{display_name}*\! Akun kamu sudah aktif\.
Gunakan /help untuk melihat semua perintah\.
""".strip()
 
HELP_TEXT = """
📖 *Panduan Bot*
 
*Koneksi Akun:*
/connect \\<kode\\> — Hubungkan akun via kode
/disconnect — Putus koneksi akun
 
*Money Tracker:*
/addexpense — Tambah transaksi baru
/list — Lihat daftar transaksi
/stats — Lihat ringkasan keuangan

*Profil:*
/profile — Lihat profil kamu
/editprofile — Edit nama dan bio
  
Saat tambah transaksi, data utama yang dibutuhkan:
• Nominal
• Tipe \\(expense/income\\)
• Kategori
 
*Lainnya:*
/help — Tampilkan bantuan ini
/cancel — Batalkan aksi saat ini
""".strip()
 
# ── Connect Flow ──────────────────────────────────────────────────────────────
 
ASK_CONNECT_CODE = """
🔗 *Hubungkan Akun Telegram*

Gunakan format berikut:
`/connect MYJARVIS-AB12CD`

Ambil kode dari web app di menu Profile\.
""".strip()
 
CONNECT_SUCCESS = """
✅ *Berhasil terhubung\!*
 
Halo, *{display_name}*\! Akun Telegram kamu sekarang terhubung dengan My\-Jarvis\-Gua\.
 
Gunakan /addexpense untuk mencatat transaksi, atau /list untuk melihat riwayat transaksi\.
""".strip()

CONNECT_FAILED_INVALID_CODE = """
❌ *Kode tidak valid atau sudah kedaluwarsa*

Generate kode baru di web app, lalu coba lagi dengan:
`/connect MYJARVIS-XXXXXX`
""".strip()
 
DISCONNECT_SUCCESS = """
🔌 *Akun berhasil diputus*
 
Akun Telegram kamu tidak lagi terhubung dengan My\-Jarvis\-Gua\.
Gunakan /connect untuk menghubungkan kembali\.
""".strip()
 
DISCONNECT_NOT_CONNECTED = """
ℹ️ Akun Telegram kamu belum terhubung dengan My\-Jarvis\-Gua\.
""".strip()
 
# ── Add Expense Flow ──────────────────────────────────────────────────────────
 
ASK_EXPENSE_AMOUNT = """
💸 *Tambah Transaksi Baru*
 
Masukkan *nominal* transaksi kamu \\(angka saja\\)\.

Contoh: `15000` atau `25000.50`
 
_Ketik /cancel untuk batalkan_
""".strip()

ASK_EXPENSE_TYPE = """
🧭 Pilih *tipe transaksi*:

• `expense` \\(pengeluaran\\)
• `income` \\(pemasukan\\)
""".strip()

ASK_EXPENSE_CATEGORY = """
🏷️ Masukkan *kategori* transaksi:

Contoh: `makanan`, `transport`, `gaji`, `tagihan`
""".strip()

ASK_EXPENSE_DESCRIPTION = """
📝 Masukkan *deskripsi* transaksi \\(opsional\\)\.

Ketik /skip jika tidak ada deskripsi\.
""".strip()
 
ASK_EXPENSE_DATE = """
📅 Kapan *tanggal transaksi*\\-nya?
 
Format: `YYYY-MM-DD` \\(contoh: `2025-03-31`\\)
Atau ketik /skip jika pakai tanggal hari ini\.
""".strip()
 
EXPENSE_CREATED = """
✅ *Transaksi berhasil disimpan\!*
 
📌 *{title}*
{date_line}
 
Gunakan /list untuk melihat semua transaksi\.
""".strip()
 
EXPENSE_CREATED_DATE_LINE = "📅 Tanggal transaksi: {due_date}"
EXPENSE_CREATED_NO_DATE_LINE = "📅 Tanggal transaksi: Hari ini"
 
# ── List Expenses ─────────────────────────────────────────────────────────────
 
NO_EXPENSES = """
📋 *Belum ada data transaksi*
 
Tambahkan transaksi pertama kamu dengan /addexpense\! 🚀
""".strip()
 
EXPENSE_LIST_HEADER = "📋 *Daftar Transaksi kamu \\({count} data\\):*\n\n"
 
EXPENSE_ITEM = """
{index}\\. 📌 *{title}*{date_info}
""".strip()
 
EXPENSE_ITEM_DATE = "\n   📅 _{due_date}_"
EXPENSE_ITEM_URGENT = "\n   📅 _{due_date}_"
 
# ── Profile ───────────────────────────────────────────────────────────────────
 
PROFILE_INFO = """
👤 *Profil Kamu*
 
📛 Nama: *{display_name}*
📧 Email: `{email}`
📝 Bio: _{bio}_
🔗 Telegram: ✅ Terhubung
📅 Bergabung: {created_at}
""".strip()
 
ASK_NEW_DISPLAY_NAME = """
✏️ *Edit Nama Tampilan*
 
Nama kamu saat ini: *{current_name}*
 
Masukkan nama baru, atau /skip untuk lewati:
""".strip()
 
ASK_NEW_BIO = """
📝 *Edit Bio*
 
Bio kamu saat ini:
_{current_bio}_
 
Masukkan bio baru, atau /skip untuk lewati:
""".strip()
 
PROFILE_UPDATED = "✅ Profil berhasil diperbarui\\!"
 
# ── Error & General ───────────────────────────────────────────────────────────
 
NOT_CONNECTED = """
🔒 *Akun belum terhubung*
 
Kamu belum menghubungkan akun My\-Jarvis\-Gua ke Telegram\.
Gunakan /connect untuk memulai\.
""".strip()
 
CANCELLED = "❌ Aksi dibatalkan\\."

UNEXPECTED_ERROR = """
⚠️ *Terjadi kesalahan*
 
Silakan coba lagi\\. Jika masalah berlanjut, hubungi support\\.
""".strip()
 
EXPENSE_NOT_FOUND = "❌ Data transaksi tidak ditemukan atau sudah dihapus\\."