# 📚 PANDUAN LENGKAP BOT TELEGRAM MY-JARVIS-GUA

> **Target**: Memahami 100% seluruh program bot dan bisa coding sendiri di masa depan

---

## 📖 DAFTAR ISI

1. [Pengenalan & Konsep Dasar](#1-pengenalan--konsep-dasar)
2. [Arsitektur Bot](#2-arsitektur-bot)
3. [Flow Kerja Bot](#3-flow-kerja-bot)
4. [Penjelasan File per File](#4-penjelasan-file-per-file)
5. [Konsep Penting](#5-konsep-penting)
6. [Cara Kerja Setiap Fitur](#6-cara-kerja-setiap-fitur)
7. [Tips Coding & Best Practices](#7-tips-coding--best-practices)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. PENGENALAN & KONSEP DASAR

### 1.1 Apa itu Bot Telegram?

Bot Telegram adalah program yang berjalan di server dan berkomunikasi dengan pengguna melalui aplikasi Telegram. Bot ini:
- Menerima pesan dari user (command atau text biasa)
- Memproses pesan tersebut
- Mengirim balasan ke user

### 1.2 Library yang Digunakan

Bot ini menggunakan **python-telegram-bot** (PTB), library Python paling populer untuk membuat bot Telegram.

```python
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler
```

### 1.3 Konsep Dasar PTB

**Update**: Setiap interaksi user (kirim pesan, klik tombol) = 1 Update
**Handler**: Fungsi yang menangani Update tertentu
**Context**: Tempat menyimpan data sementara per user
**Application**: Inti bot yang mengatur semua handler



---

## 2. ARSITEKTUR BOT

### 2.1 Struktur Folder

```
backend/app/bot/
├── application.py          # Factory bot, daftar semua handler
├── keyboards.py            # Tombol-tombol UI (inline & reply keyboard)
├── messages.py             # Template pesan yang dikirim ke user
└── handlers/
    ├── auth_handler.py     # /start, /connect, /disconnect
    ├── expense_handler.py  # /addexpense, /list, /stats, callbacks
    └── profile_handler.py  # /profile, /editprofile
```

### 2.2 Arsitektur Layered (Clean Architecture)

Bot ini mengikuti pola **Clean Architecture** dengan 4 layer:

```
┌─────────────────────────────────────────┐
│  HANDLER (Bot Interface)                │  ← User berinteraksi di sini
│  - Terima input dari Telegram           │
│  - Validasi format input                │
│  - Panggil Service                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  SERVICE (Business Logic)               │  ← Logika bisnis
│  - Validasi data dengan Pydantic        │
│  - Koordinasi antar repository          │
│  - Transform data                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  REPOSITORY (Data Access)               │  ← Akses database
│  - Query ke Supabase                    │
│  - CRUD operations                      │
│  - Filter & pagination                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  DATABASE (Supabase PostgreSQL)         │  ← Data disimpan di sini
└─────────────────────────────────────────┘
```

**Kenapa pakai arsitektur ini?**
- **Separation of Concerns**: Setiap layer punya tanggung jawab jelas
- **Testable**: Bisa test setiap layer secara terpisah
- **Maintainable**: Mudah ubah satu bagian tanpa rusak yang lain
- **Scalable**: Mudah tambah fitur baru



---

## 3. FLOW KERJA BOT

### 3.1 Lifecycle Bot

```
1. User kirim pesan → Telegram Server
2. Telegram Server → Bot (via webhook/polling)
3. Bot terima Update
4. Application cari Handler yang cocok
5. Handler proses Update
6. Handler kirim response → Telegram Server
7. Telegram Server → User
```

### 3.2 Urutan Pendaftaran Handler (PENTING!)

Di `application.py`, urutan pendaftaran handler sangat penting:

```python
# 1. Error handler (tangkap semua error)
app.add_error_handler(error_handler)

# 2. ConversationHandler (multi-step flow)
app.add_handler(expense_handler.build_addexpense_conversation())
app.add_handler(profile_handler.build_editprofile_conversation())

# 3. Command handlers (/start, /help, dll)
app.add_handler(CommandHandler("start", auth_handler.cmd_start))

# 4. Callback query handlers (tombol inline)
for callback_handler in expense_handler.build_expense_callback_handlers():
    app.add_handler(callback_handler)

# 5. Message handlers (text biasa)
app.add_handler(MessageHandler(filters.Regex(...), handle_menu_button))
```

**Kenapa urutan penting?**
- Handler yang didaftar lebih dulu akan dicek lebih dulu
- ConversationHandler harus sebelum MessageHandler umum
- Kalau tidak, MessageHandler akan "mencuri" input yang seharusnya untuk ConversationHandler



---

## 4. PENJELASAN FILE PER FILE

### 4.1 `application.py` - Factory Bot

**Tanggung Jawab**: Merakit semua handler menjadi satu bot yang siap jalan

**Fungsi Utama**:

#### `create_bot()` - Factory Function
```python
def create_bot() -> Application:
    settings = get_settings()
    
    app = (
        ApplicationBuilder()
        .token(settings.TELEGRAM_BOT_TOKEN)
        .concurrent_updates(False)  # Penting untuk ConversationHandler!
        .post_init(post_init)
        .build()
    )
    
    # Daftar semua handler...
    return app
```

**Penjelasan**:
- `token()`: Token bot dari BotFather
- `concurrent_updates(False)`: Proses update satu per satu (hindari race condition di ConversationHandler)
- `post_init()`: Fungsi yang jalan setelah bot siap (set command list)

#### `error_handler()` - Centralized Error Handler
```python
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.error("Unhandled exception", exc_info=context.error)
    
    if isinstance(update, Update) and update.effective_message:
        await update.effective_message.reply_text(
            messages.UNEXPECTED_ERROR,
            parse_mode=ParseMode.MARKDOWN_V2,
        )
```

**Penjelasan**:
- Tangkap semua error yang tidak ditangani handler
- Log error untuk debugging
- Kirim pesan error ke user (jangan biarkan bot diam saja)

#### `handle_menu_button()` - Router untuk Tombol Menu
```python
async def handle_menu_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (update.message.text or "").strip()
    
    if text == "📋 Lihat Pengeluaran":
        await expense_handler.cmd_list_expenses(update, context)
    elif text == "📊 Ringkasan":
        await expense_handler.cmd_stats(update, context)
    # ... dst
```

**Penjelasan**:
- User klik tombol keyboard → kirim text biasa
- Fungsi ini mapping text ke handler yang sesuai
- Alternatif: bisa pakai banyak MessageHandler dengan Regex berbeda



### 4.2 `keyboards.py` - UI Components

**Tanggung Jawab**: Definisi semua tombol yang ditampilkan ke user

#### Jenis Keyboard di Telegram:

**1. ReplyKeyboardMarkup** - Tombol di bawah chat input
```python
def main_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            ["➕ Tambah Pengeluaran", "📋 Lihat Pengeluaran"],
            ["📊 Ringkasan", "🔌 Putuskan Akun"],
            ["❓ Bantuan"],
        ],
        resize_keyboard=True,      # Sesuaikan ukuran tombol
        one_time_keyboard=False,   # Tetap tampil setelah diklik
    )
```

**Karakteristik**:
- Tombol tetap ada di UI
- Klik tombol = kirim text biasa
- Cocok untuk menu utama

**2. InlineKeyboardMarkup** - Tombol di dalam pesan
```python
def expense_action_keyboard(expense_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🧾 Detail", callback_data=f"view_expense:{expense_id}"),
            InlineKeyboardButton("🗑️ Hapus", callback_data=f"delete_expense:{expense_id}"),
        ]
    ])
```

**Karakteristik**:
- Tombol melekat di pesan tertentu
- Klik tombol = kirim callback query (tidak muncul di chat)
- Cocok untuk aksi per item (detail, hapus, edit)

**Format callback_data**:
```
<action>:<parameter>
view_expense:123e4567-e89b-12d3-a456-426614174000
delete_expense:123e4567-e89b-12d3-a456-426614174000
```

Nanti di handler, kita split dengan `:` untuk ambil action dan parameter.



### 4.3 `messages.py` - Template Pesan

**Tanggung Jawab**: Semua text yang dikirim ke user

**Kenapa dipisah ke file sendiri?**
- **Centralized**: Semua pesan di satu tempat, mudah edit
- **Reusable**: Pesan yang sama bisa dipakai di banyak tempat
- **Multilingual Ready**: Mudah tambah bahasa lain nanti
- **Consistent**: Format pesan konsisten di seluruh bot

**Format Markdown V2**:
```python
WELCOME = """
👋 *Halo, {first_name}!*
 
Selamat datang di *My Jarvis Gua Bot*
 
Untuk mulai, hubungkan akun kamu:
👉 /connect <kode>
""".strip()
```

**Karakter yang harus di-escape di MarkdownV2**:
```
_ * [ ] ( ) ~ ` > # + - = | { } . !
```

Contoh escape:
```python
def _escape_markdown_v2(text: str) -> str:
    special = r"_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{ch}" if ch in special else ch for ch in str(text))
```

**Placeholder dengan `.format()`**:
```python
messages.CONNECT_SUCCESS.format(display_name="John Doe")
# Output: ✅ Berhasil terhubung! Halo, John Doe!
```



### 4.4 `auth_handler.py` - Autentikasi

**Tanggung Jawab**: Mengelola koneksi akun Telegram dengan akun web app

#### Flow Koneksi Akun:

```
1. User buka web app → Generate kode (MYJARVIS-AB12CD)
2. User kirim /connect MYJARVIS-AB12CD di Telegram
3. Bot verifikasi kode di database
4. Jika valid, simpan telegram_chat_id ke profile user
5. User sekarang bisa pakai bot
```

#### Fungsi Utama:

**`get_linked_profile()`** - Cek apakah user sudah connect
```python
async def get_linked_profile(telegram_chat_id: int) -> dict | None:
    profile_repo = _make_profile_repo_admin()
    return profile_repo.find_by_telegram_id(telegram_chat_id)
```

**Penjelasan**:
- Input: `telegram_chat_id` (ID unik setiap chat Telegram)
- Output: Profile user jika sudah connect, `None` jika belum
- Dipakai di hampir semua handler untuk cek autentikasi

**`cmd_start()`** - Handler /start
```python
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    chat_id = update.effective_chat.id
    
    profile = await get_linked_profile(chat_id)
    
    if profile:
        # Sudah connect → tampilkan menu utama
        await update.message.reply_text(
            messages.ALREADY_CONNECTED.format(...),
            reply_markup=main_menu_keyboard(),
        )
    else:
        # Belum connect → minta connect dulu
        await update.message.reply_text(
            messages.WELCOME.format(first_name=user.first_name),
        )
```

**Penjelasan**:
- Branching logic: sudah connect vs belum connect
- `update.effective_user`: Info user Telegram (first_name, username, dll)
- `update.effective_chat.id`: ID chat (untuk 1-on-1 = user ID)



**`cmd_connect()`** - Handler /connect
```python
async def cmd_connect(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    
    # Cek sudah connect atau belum
    profile = await get_linked_profile(chat_id)
    if profile:
        await update.message.reply_text(messages.ALREADY_CONNECTED.format(...))
        return
    
    # Ambil kode dari argument command
    code = (context.args[0] if context.args else "").strip()
    if not code:
        await update.message.reply_text(messages.ASK_CONNECT_CODE)
        return
    
    try:
        # Verifikasi kode dan link telegram_chat_id
        profile_service = _make_profile_service_admin()
        profile_service.verify_and_link_telegram(code=code, telegram_chat_id=chat_id)
        
        # Berhasil → tampilkan menu utama
        await update.message.reply_text(
            messages.CONNECT_SUCCESS.format(...),
            reply_markup=main_menu_keyboard(),
        )
    except AuthenticationError:
        # Kode invalid/expired
        await update.message.reply_text(messages.CONNECT_FAILED_INVALID_CODE)
```

**Penjelasan**:
- `context.args`: List argument setelah command
  - `/connect ABC123` → `context.args = ["ABC123"]`
  - `/connect` → `context.args = []`
- Try-except untuk handle error (kode invalid, network error, dll)
- Setelah berhasil connect, tampilkan main menu keyboard

**`cmd_disconnect()`** - Handler /disconnect
```python
async def cmd_disconnect(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    
    profile = await get_linked_profile(chat_id)
    if not profile:
        await update.message.reply_text(messages.DISCONNECT_NOT_CONNECTED)
        return
    
    profile_repo = _make_profile_repo_admin()
    profile_repo.unlink_telegram(user_id=profile["id"])
    
    # Clear context data
    context.user_data.clear()
    
    await update.message.reply_text(messages.DISCONNECT_SUCCESS)
```

**Penjelasan**:
- Set `telegram_chat_id = NULL` di database
- `context.user_data.clear()`: Hapus semua data temporary user
- Setelah disconnect, user harus connect lagi untuk pakai bot



### 4.5 `expense_handler.py` - Expense Management (BAGIAN 1)

**Tanggung Jawab**: Semua fitur expense (tambah, lihat, hapus, stats)

#### ConversationHandler - Multi-Step Flow

**Apa itu ConversationHandler?**
- Handler untuk percakapan multi-step (tanya-jawab berurutan)
- Punya **state** (tahap percakapan)
- Setiap state punya handler sendiri

**State untuk /addexpense**:
```python
WAITING_AMOUNT = 0       # Tunggu input nominal
WAITING_TYPE = 1         # Tunggu input tipe (expense/income)
WAITING_CATEGORY = 2     # Tunggu input kategori
WAITING_DESCRIPTION = 3  # Tunggu input deskripsi
WAITING_DATE = 4         # Tunggu input tanggal
```

**Struktur ConversationHandler**:
```python
ConversationHandler(
    entry_points=[...],    # Handler untuk mulai conversation
    states={...},          # Handler untuk setiap state
    fallbacks=[...],       # Handler untuk cancel/error
)
```



#### Flow /addexpense:

```
User: /addexpense
Bot: Masukkan nominal
State: WAITING_AMOUNT

User: 50000
Bot: Pilih tipe (expense/income)
State: WAITING_TYPE

User: expense
Bot: Masukkan kategori
State: WAITING_CATEGORY

User: makanan
Bot: Masukkan deskripsi (atau /skip)
State: WAITING_DESCRIPTION

User: makan siang
Bot: Masukkan tanggal (atau /skip)
State: WAITING_DATE

User: 2026-03-31
Bot: ✅ Transaksi berhasil disimpan!
State: END (conversation selesai)
```

#### Implementasi ConversationHandler:

**Entry Point** - Mulai conversation
```python
async def cmd_addexpense_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    # Cek autentikasi
    profile = await require_linked_account(update)
    if not profile:
        return ConversationHandler.END
    
    # Simpan user_id di context untuk dipakai nanti
    context.user_data["current_user_id"] = profile["id"]
    
    # Kirim pertanyaan pertama
    await update.message.reply_text(messages.ASK_EXPENSE_AMOUNT)
    
    # Return state berikutnya
    return WAITING_AMOUNT
```

**Penjelasan**:
- `context.user_data`: Dict untuk simpan data temporary per user
- Return value = state berikutnya
- `ConversationHandler.END` = hentikan conversation



**State Handler** - Proses input per state
```python
async def handle_expense_amount(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    # Ambil input user
    raw_amount = update.message.text.strip().replace(",", "")
    
    # Validasi input
    try:
        amount = float(raw_amount)
        if amount <= 0:
            raise ValueError()
    except ValueError:
        # Input invalid → minta input ulang (tetap di state ini)
        await update.message.reply_text("❌ Nominal tidak valid...")
        return WAITING_AMOUNT
    
    # Input valid → simpan di context
    context.user_data["expense_amount"] = amount
    
    # Kirim pertanyaan berikutnya
    await update.message.reply_text(messages.ASK_EXPENSE_TYPE)
    
    # Pindah ke state berikutnya
    return WAITING_TYPE
```

**Penjelasan**:
- Validasi input di handler (jangan percaya input user!)
- Jika invalid, return state yang sama (minta input ulang)
- Jika valid, simpan di `context.user_data` dan pindah state

**Skip Handler** - Untuk input opsional
```python
async def handle_skip_description(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["expense_description"] = None
    await update.message.reply_text(messages.ASK_EXPENSE_DATE)
    return WAITING_DATE
```

**Penjelasan**:
- User bisa ketik `/skip` untuk lewati input opsional
- Set value ke `None` dan lanjut ke state berikutnya



**Final Handler** - Simpan data ke database
```python
async def handle_expense_date(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    date_input = update.message.text.strip()
    user_id = context.user_data.get("current_user_id")
    
    # Validasi format tanggal
    try:
        datetime.strptime(date_input, "%Y-%m-%d")
    except ValueError:
        await update.message.reply_text("❌ Format tanggal salah...")
        return WAITING_DATE
    
    # Panggil helper untuk simpan ke database
    return await _create_expense_and_reply(update, context, user_id, date_input)
```

**Helper untuk simpan data**:
```python
async def _create_expense_and_reply(...) -> int:
    try:
        # Ambil semua data dari context
        amount = context.user_data["expense_amount"]
        expense_type = context.user_data["expense_type"]
        category = context.user_data["expense_category"]
        description = context.user_data.get("expense_description")
        
        # Buat request object
        request = CreateExpenseRequest(
            amount=amount,
            type=expense_type,
            category=category,
            description=description,
            transaction_date=transaction_date,
        )
        
        # Simpan ke database via service
        expense_service = _make_expense_service_for_user()
        created = expense_service.create_expense(user_id=user_id, request=request)
        
        # Kirim konfirmasi ke user
        await update.message.reply_text(messages.EXPENSE_CREATED.format(...))
    finally:
        # PENTING: Clear context setelah selesai
        _clear_add_expense_context(context)
    
    return ConversationHandler.END
```

**Penjelasan**:
- Kumpulkan semua data dari `context.user_data`
- Buat Pydantic model untuk validasi
- Panggil service layer untuk simpan ke database
- Clear context di `finally` block (jalan meskipun ada error)
- Return `ConversationHandler.END` untuk akhiri conversation



**Builder Function** - Rakit ConversationHandler
```python
def build_addexpense_conversation() -> ConversationHandler:
    return ConversationHandler(
        entry_points=[
            CommandHandler("addexpense", cmd_addexpense_start),
            MessageHandler(filters.Regex("^➕ Tambah Pengeluaran$"), cmd_addexpense_start),
        ],
        states={
            WAITING_AMOUNT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_amount),
            ],
            WAITING_TYPE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_type),
            ],
            WAITING_CATEGORY: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_category),
            ],
            WAITING_DESCRIPTION: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_description),
                CommandHandler("skip", handle_skip_description),
            ],
            WAITING_DATE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_date),
                CommandHandler("skip", handle_skip_date),
            ],
        },
        fallbacks=[
            CommandHandler("cancel", _cancel_addexpense)
        ],
    )
```

**Penjelasan**:
- `entry_points`: Handler untuk mulai conversation (bisa lebih dari 1)
- `states`: Dict mapping state → list of handlers
- `filters.TEXT & ~filters.COMMAND`: Text biasa, bukan command
- `fallbacks`: Handler untuk cancel (keluar dari conversation)



### 4.6 `expense_handler.py` - Expense Management (BAGIAN 2)

#### /list - Tampilkan Daftar Expense

```python
async def cmd_list_expenses(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    # Cek autentikasi
    profile = await require_linked_account(update)
    if not profile:
        return
    
    # Ambil data dari database
    expense_service = _make_expense_service_for_user()
    expense_list = expense_service.get_all_expenses(
        user_id=profile["id"],
        limit=20,
        sort_by="transaction_date",
        sort_order="desc",
    )
    
    # Jika kosong
    if expense_list.total == 0:
        await update.message.reply_text(messages.NO_EXPENSES)
        return
    
    # Kirim header
    await update.message.reply_text(
        messages.EXPENSE_LIST_HEADER.format(count=expense_list.total)
    )
    
    # Kirim setiap item dengan tombol aksi
    for i, expense in enumerate(expense_list.expenses, start=1):
        title = f"Rp {expense.amount:,.2f} | {expense.type} | {expense.category}"
        
        await update.message.reply_text(
            f"{i}. {title}",
            reply_markup=expense_action_keyboard(expense.id),  # Tombol inline
        )
```

**Penjelasan**:
- Kirim banyak pesan (1 header + 1 per item)
- Setiap item punya tombol inline (Detail & Hapus)
- `expense_action_keyboard(expense.id)`: Generate tombol dengan ID expense



#### Callback Query Handler - Tombol Inline

**Apa itu Callback Query?**
- Event yang terjadi saat user klik tombol inline
- Tidak muncul sebagai pesan di chat
- Bawa data (`callback_data`) yang kita set di keyboard

**Handler untuk tombol "Detail"**:
```python
async def callback_view_expense(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()  # PENTING: Harus dipanggil untuk acknowledge
    
    # Parse callback_data
    _, expense_id = query.data.split(":", 1)
    # "view_expense:123-456" → ["view_expense", "123-456"]
    
    # Ambil data dari database
    profile = await get_linked_profile(update.effective_chat.id)
    expense_service = _make_expense_service_for_user()
    expense = expense_service.get_expense_by_id(
        user_id=profile["id"],
        expense_id=expense_id
    )
    
    # Format detail text
    detail_text = (
        "🧾 *Detail Transaksi*\n\n"
        f"💰 Nominal: *Rp {expense.amount:,.2f}*\n"
        f"🧭 Tipe: *{expense.type}*\n"
        f"🏷️ Kategori: *{expense.category}*\n"
        # ... dst
    )
    
    # Edit pesan yang ada (ganti tombol dengan detail)
    await query.edit_message_text(detail_text)
```

**Penjelasan**:
- `query.answer()`: Acknowledge callback (hapus loading di tombol)
- `query.data`: Isi `callback_data` dari tombol
- `query.edit_message_text()`: Edit pesan yang ada (tidak kirim pesan baru)



**Handler untuk tombol "Hapus" (dengan konfirmasi)**:

Flow hapus dengan konfirmasi:
```
1. User klik "🗑️ Hapus"
2. Bot ganti tombol dengan "✅ Ya, hapus" dan "❌ Batal"
3. User klik "✅ Ya, hapus" → hapus data
4. User klik "❌ Batal" → kembalikan tombol awal
```

**Step 1: Minta konfirmasi**
```python
async def callback_delete_expense(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    _, expense_id = query.data.split(":", 1)
    
    # Ganti tombol dengan konfirmasi
    await query.edit_message_reply_markup(
        reply_markup=confirm_delete_expense_keyboard(expense_id)
    )
```

**Step 2a: User konfirmasi hapus**
```python
async def callback_confirm_delete(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    _, expense_id = query.data.split(":", 1)
    profile = await get_linked_profile(update.effective_chat.id)
    
    # Hapus dari database
    expense_service = _make_expense_service_for_user()
    expense_service.delete_expense(user_id=profile["id"], expense_id=expense_id)
    
    # Edit pesan jadi konfirmasi
    await query.edit_message_text("🗑️ Data transaksi berhasil dihapus.")
```

**Step 2b: User cancel hapus**
```python
async def callback_cancel_delete(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer("Hapus dibatalkan")  # Tampilkan toast notification
    
    _, expense_id = query.data.split(":", 1)
    
    # Kembalikan tombol awal
    await query.edit_message_reply_markup(
        reply_markup=expense_action_keyboard(expense_id)
    )
```



**Daftar Callback Handler**:
```python
def build_expense_callback_handlers() -> list[CallbackQueryHandler]:
    return [
        CallbackQueryHandler(callback_view_expense, pattern=r"^view_expense:"),
        CallbackQueryHandler(callback_delete_expense, pattern=r"^delete_expense:"),
        CallbackQueryHandler(callback_confirm_delete, pattern=r"^confirm_delete_expense:"),
        CallbackQueryHandler(callback_cancel_delete, pattern=r"^cancel_delete_expense:"),
    ]
```

**Penjelasan**:
- `pattern`: Regex untuk filter `callback_data`
- `^view_expense:`: Mulai dengan "view_expense:"
- Handler yang match pattern akan dipanggil

#### /stats - Ringkasan Keuangan

```python
async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    profile = await require_linked_account(update)
    if not profile:
        return
    
    expense_service = _make_expense_service_for_user()
    summary = expense_service.get_expense_summary_all_time(user_id=profile["id"])
    
    text = (
        "📊 *Ringkasan Keuangan*\n\n"
        f"⬆️ Total Income: *Rp {summary.total_income:,.2f}*\n"
        f"⬇️ Total Expense: *Rp {summary.total_expense:,.2f}*\n"
        f"💼 Saldo Bersih: *Rp {summary.net_balance:,.2f}*"
    )
    
    await update.message.reply_text(text)
```

**Penjelasan**:
- Ambil summary dari service (total income, expense, net balance)
- Format dengan `:,.2f` untuk format angka (1000 → 1,000.00)
- Kirim sebagai pesan biasa



### 4.7 `profile_handler.py` - Profile Management

**Tanggung Jawab**: Lihat dan edit profil user

#### /profile - Lihat Profil

```python
async def cmd_profile(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    linked = await require_linked_account(update)
    if not linked:
        return
    
    # Ambil data profil dari database
    repo = _make_profile_repo()
    profile_data = repo.find_by_user_id(linked["id"])
    profile_out = ProfileOut.from_db(profile_data)
    
    # Format tanggal
    dt = datetime.fromisoformat(str(profile_out.created_at))
    created_str = dt.strftime("%d %B %Y")
    
    # Kirim info profil
    text = messages.PROFILE_INFO.format(
        display_name=profile_out.display_name or "Belum diset",
        email=linked.get("email") or "-",
        bio=profile_out.bio or "Belum ada bio",
        created_at=created_str,
    )
    
    await update.message.reply_text(text)
```

**Penjelasan**:
- Ambil data dari repository
- Transform ke Pydantic model (`ProfileOut`)
- Format tanggal dengan `strftime()`
- Kirim dengan template dari `messages.py`



#### /editprofile - Edit Profil (ConversationHandler)

**Flow**:
```
User: /editprofile
Bot: Nama kamu saat ini: John. Masukkan nama baru atau /skip
State: WAITING_NAME

User: John Doe
Bot: Bio kamu saat ini: Developer. Masukkan bio baru atau /skip
State: WAITING_BIO

User: Full Stack Developer
Bot: ✅ Profil berhasil diperbarui!
State: END
```

**Entry Point**:
```python
async def cmd_editprofile_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    linked = await require_linked_account(update)
    if not linked:
        return ConversationHandler.END
    
    user_id = linked["id"]
    context.user_data["edit_user_id"] = user_id
    
    # Ambil nama saat ini
    repo = _make_profile_repo()
    profile_data = repo.find_by_user_id(user_id)
    current_name = profile_data.get("display_name") or "Belum diset"
    
    await update.message.reply_text(
        messages.ASK_NEW_DISPLAY_NAME.format(current_name=current_name)
    )
    
    return WAITING_NAME
```



**State Handler - Nama**:
```python
async def handle_new_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    # Simpan nama baru
    context.user_data["edit_display_name"] = update.message.text.strip()
    
    # Tanya bio
    user_id = context.user_data.get("edit_user_id")
    await _prompt_bio_step(update, user_id)
    
    return WAITING_BIO
```

**State Handler - Bio (Final)**:
```python
async def handle_new_bio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    new_bio = update.message.text.strip()
    user_id = context.user_data.get("edit_user_id")
    new_name = context.user_data.get("edit_display_name")
    
    # Buat payload update
    payload = UpdateProfileRequest(display_name=new_name, bio=new_bio).to_update_dict()
    
    if payload:
        repo = _make_profile_repo()
        repo.update(user_id=user_id, update_data=payload)
    
    await update.message.reply_text(messages.PROFILE_UPDATED)
    
    _clear_edit_context(context)
    return ConversationHandler.END
```

**Penjelasan**:
- `UpdateProfileRequest.to_update_dict()`: Convert Pydantic model ke dict, exclude None
- Hanya update field yang diisi user
- Clear context setelah selesai



---

## 5. KONSEP PENTING

### 5.1 Context & User Data

**`context.user_data`** - Dict untuk simpan data temporary per user

```python
# Simpan data
context.user_data["expense_amount"] = 50000
context.user_data["expense_type"] = "expense"

# Ambil data
amount = context.user_data.get("expense_amount")

# Hapus data
context.user_data.clear()
```

**Kapan pakai `context.user_data`?**
- ConversationHandler (simpan input antar state)
- Data temporary yang tidak perlu disimpan ke database
- Session data per user

**PENTING**: Selalu clear setelah selesai!

### 5.2 Async/Await

Semua handler harus `async` dan pakai `await` untuk operasi I/O:

```python
# ✅ BENAR
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("Hello!")

# ❌ SALAH
def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    update.message.reply_text("Hello!")  # Tidak pakai await
```

**Kenapa async?**
- Bot handle banyak user sekaligus
- Operasi I/O (database, network) tidak block thread lain
- Performa lebih baik



### 5.3 Error Handling

**Pattern Try-Except di Handler**:

```python
async def cmd_connect(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        # Business logic
        profile_service.verify_and_link_telegram(code, chat_id)
        await update.message.reply_text(messages.CONNECT_SUCCESS)
        
    except AuthenticationError:
        # Specific error → specific message
        await update.message.reply_text(messages.CONNECT_FAILED_INVALID_CODE)
        
    except AppError as e:
        # General app error → log + generic message
        logger.error("Connect error: %s", e.message)
        await update.message.reply_text(messages.UNEXPECTED_ERROR)
        
    except Exception:
        # Unexpected error → log + generic message
        logger.exception("Unexpected error during /connect")
        await update.message.reply_text(messages.UNEXPECTED_ERROR)
```

**Best Practices**:
1. Catch specific exception dulu (AuthenticationError)
2. Catch general exception (AppError)
3. Catch semua exception (Exception) sebagai fallback
4. Selalu kirim pesan ke user (jangan biarkan bot diam)
5. Log error untuk debugging

### 5.4 Dependency Injection

**Pattern Factory Function**:

```python
def _make_expense_service_for_user() -> ExpenseService:
    admin_client = get_admin_supabase_client()
    return ExpenseService(expense_repo=ExpenseRepository(client=admin_client))
```

**Kenapa pakai pattern ini?**
- Centralized: Semua dependency di satu tempat
- Testable: Mudah mock untuk testing
- Flexible: Mudah ganti implementasi



### 5.5 Admin Client vs User Client

**Admin Client** - Bypass RLS (Row Level Security)
```python
admin_client = get_admin_supabase_client()  # Pakai SERVICE_ROLE_KEY
```

**User Client** - Enforce RLS
```python
user_client = get_user_client(access_token)  # Pakai ANON_KEY + token
```

**Di Bot, kenapa pakai Admin Client?**
- Bot tidak punya access token user
- Bot perlu akses data user berdasarkan `telegram_chat_id`
- Security dijaga dengan filter `user_id` di service/repository

**PENTING**: Selalu filter by `user_id` di query!

```python
# ✅ AMAN
expense_service.get_all_expenses(user_id=profile["id"], ...)

# ❌ BAHAYA (bisa akses data user lain)
expense_service.get_all_expenses(...)
```

### 5.6 Pydantic Models

**Untuk apa Pydantic?**
- Validasi data otomatis
- Type checking
- Serialization/deserialization
- Documentation (schema)

**Contoh**:
```python
class CreateExpenseRequest(BaseModel):
    amount: float
    type: Literal["income", "expense"] = "expense"
    category: str
    
    @field_validator('amount')
    def validate_amount(cls, value):
        if value <= 0:
            raise ValueError('Amount must be greater than zero')
        return round(value, 2)
```

**Keuntungan**:
- Validasi otomatis saat create object
- Error message jelas
- Type hint untuk IDE



---

## 6. CARA KERJA SETIAP FITUR

### 6.1 Fitur Connect Account

**Flow Lengkap**:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. WEB APP                                                  │
│    User klik "Generate Kode"                                │
│    → API generate kode random (MYJARVIS-AB12CD)             │
│    → Simpan ke table telegram_link_codes                    │
│    → Tampilkan kode ke user                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. TELEGRAM BOT                                             │
│    User kirim: /connect MYJARVIS-AB12CD                     │
│    → Bot ambil kode dari command args                       │
│    → Panggil profile_service.verify_and_link_telegram()     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SERVICE LAYER                                            │
│    verify_and_link_telegram(code, telegram_chat_id)         │
│    → Cari kode di table telegram_link_codes                 │
│    → Cek apakah kode valid & belum expired                  │
│    → Update profiles.telegram_chat_id = telegram_chat_id    │
│    → Hapus kode dari table (one-time use)                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. BOT RESPONSE                                             │
│    → Kirim pesan sukses                                     │
│    → Tampilkan main menu keyboard                           │
│    → User sekarang bisa pakai semua fitur bot               │
└─────────────────────────────────────────────────────────────┘
```

**Database Schema**:
```sql
-- Table untuk simpan kode temporary
CREATE TABLE telegram_link_codes (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    code VARCHAR(20) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Table profiles punya kolom telegram_chat_id
ALTER TABLE profiles ADD COLUMN telegram_chat_id BIGINT UNIQUE;
```



### 6.2 Fitur Add Expense (ConversationHandler)

**State Machine Diagram**:

```
                    /addexpense
                         ↓
              ┌──────────────────┐
              │ WAITING_AMOUNT   │
              │ "Masukkan nominal"│
              └──────────────────┘
                         ↓ (input: 50000)
              ┌──────────────────┐
              │ WAITING_TYPE     │
              │ "Pilih tipe"     │
              └──────────────────┘
                         ↓ (input: expense)
              ┌──────────────────┐
              │ WAITING_CATEGORY │
              │ "Masukkan kategori"│
              └──────────────────┘
                         ↓ (input: makanan)
              ┌──────────────────┐
              │ WAITING_DESCRIPTION│
              │ "Deskripsi (skip)"|
              └──────────────────┘
                         ↓ (input: makan siang)
              ┌──────────────────┐
              │ WAITING_DATE     │
              │ "Tanggal (skip)" │
              └──────────────────┘
                         ↓ (input: 2026-03-31)
              ┌──────────────────┐
              │ Simpan ke DB     │
              │ Kirim konfirmasi │
              └──────────────────┘
                         ↓
                       END
```

**Data Flow**:

```python
# State 1: WAITING_AMOUNT
context.user_data = {
    "current_user_id": "uuid-123"
}

# State 2: WAITING_TYPE
context.user_data = {
    "current_user_id": "uuid-123",
    "expense_amount": 50000.0
}

# State 3: WAITING_CATEGORY
context.user_data = {
    "current_user_id": "uuid-123",
    "expense_amount": 50000.0,
    "expense_type": "expense"
}

# State 4: WAITING_DESCRIPTION
context.user_data = {
    "current_user_id": "uuid-123",
    "expense_amount": 50000.0,
    "expense_type": "expense",
    "expense_category": "makanan"
}

# State 5: WAITING_DATE
context.user_data = {
    "current_user_id": "uuid-123",
    "expense_amount": 50000.0,
    "expense_type": "expense",
    "expense_category": "makanan",
    "expense_description": "makan siang"
}

# Final: Simpan ke DB
request = CreateExpenseRequest(
    amount=50000.0,
    type="expense",
    category="makanan",
    description="makan siang",
    transaction_date="2026-03-31"
)
expense_service.create_expense(user_id="uuid-123", request=request)

# Clear context
context.user_data.clear()
```



### 6.3 Fitur List & Delete Expense

**Flow List**:

```
User: /list
  ↓
Bot: Cek autentikasi
  ↓
Bot: Query database (get_all_expenses)
  ↓
Bot: Kirim header "📋 Daftar Transaksi (5 data)"
  ↓
Bot: Loop setiap expense:
     - Format text
     - Generate inline keyboard (Detail & Hapus)
     - Kirim pesan
```

**Flow Delete dengan Konfirmasi**:

```
User: Klik tombol "🗑️ Hapus"
  ↓
callback_data: "delete_expense:uuid-123"
  ↓
callback_delete_expense():
  - Parse expense_id dari callback_data
  - Ganti tombol dengan konfirmasi:
    * "✅ Ya, hapus" (callback: confirm_delete_expense:uuid-123)
    * "❌ Batal" (callback: cancel_delete_expense:uuid-123)
  ↓
User: Klik "✅ Ya, hapus"
  ↓
callback_confirm_delete():
  - Parse expense_id
  - Panggil expense_service.delete_expense()
  - Edit pesan jadi "🗑️ Data berhasil dihapus"
  
ATAU

User: Klik "❌ Batal"
  ↓
callback_cancel_delete():
  - Parse expense_id
  - Kembalikan tombol awal (Detail & Hapus)
```

**Kenapa pakai konfirmasi?**
- Hindari hapus tidak sengaja
- User experience lebih baik
- Standar UX pattern untuk destructive action



### 6.4 Fitur Stats

**Flow**:

```
User: /stats
  ↓
Bot: Cek autentikasi
  ↓
Bot: Panggil expense_service.get_expense_summary_all_time()
  ↓
Service: Query database
  - SELECT SUM(amount) WHERE type='income'
  - SELECT SUM(amount) WHERE type='expense'
  - Calculate net_balance = income - expense
  ↓
Bot: Format hasil
  - Total Income: Rp 5,000,000
  - Total Expense: Rp 3,500,000
  - Saldo Bersih: Rp 1,500,000
  ↓
Bot: Kirim ke user
```

**Repository Query**:

```python
def get_summary_all_time(self, user_id: str) -> dict:
    response = (
        self._client
        .table(self.VIEW)
        .select("amount, type")
        .eq("user_id", user_id)
        .execute()
    )
    
    income = sum(e["amount"] for e in response.data if e["type"] == "income")
    expense = sum(e["amount"] for e in response.data if e["type"] == "expense")
    
    return {
        "total_income": float(income),
        "total_expense": float(expense),
        "net_balance": float(income - expense),
    }
```

**Kenapa cast ke float?**
- Database return Decimal type
- Decimal tidak bisa di-serialize ke JSON
- Float cukup untuk currency (2 decimal places)



---

## 7. TIPS CODING & BEST PRACTICES

### 7.1 Struktur Handler

**Template Handler yang Baik**:

```python
async def cmd_example(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    # 1. Cek autentikasi
    profile = await require_linked_account(update)
    if not profile:
        return
    
    # 2. Ambil input dari user
    user_input = update.message.text.strip()
    
    # 3. Validasi input
    if not user_input:
        await update.message.reply_text("❌ Input tidak boleh kosong")
        return
    
    # 4. Business logic (panggil service)
    try:
        service = _make_service()
        result = service.do_something(user_id=profile["id"], data=user_input)
        
        # 5. Kirim response sukses
        await update.message.reply_text(f"✅ Berhasil: {result}")
        
    except SpecificError as e:
        # 6. Handle specific error
        await update.message.reply_text(f"❌ Error: {e.message}")
        
    except Exception:
        # 7. Handle unexpected error
        logger.exception("Unexpected error in cmd_example")
        await update.message.reply_text(messages.UNEXPECTED_ERROR)
```

### 7.2 Naming Convention

**Handler Functions**:
- Command handler: `cmd_<command_name>` (e.g., `cmd_start`, `cmd_list`)
- Callback handler: `callback_<action>` (e.g., `callback_view_expense`)
- State handler: `handle_<state_name>` (e.g., `handle_expense_amount`)
- Helper: `_<function_name>` (e.g., `_make_service`, `_escape_markdown`)

**Variables**:
- Snake case: `user_id`, `expense_list`, `chat_id`
- Descriptive: `expense_service` bukan `es`, `profile_repo` bukan `pr`



### 7.3 Error Handling Best Practices

**DO**:
- ✅ Catch specific exception dulu
- ✅ Log error dengan context
- ✅ Kirim user-friendly message
- ✅ Pakai try-finally untuk cleanup

**DON'T**:
- ❌ Catch Exception tanpa log
- ❌ Biarkan bot diam saat error
- ❌ Expose technical error ke user
- ❌ Lupa cleanup context

**Contoh Baik**:
```python
try:
    result = service.do_something()
    await update.message.reply_text(f"✅ {result}")
except NotFoundError:
    await update.message.reply_text("❌ Data tidak ditemukan")
except ValidationError as e:
    await update.message.reply_text(f"❌ {e.message}")
except Exception:
    logger.exception("Unexpected error")
    await update.message.reply_text(messages.UNEXPECTED_ERROR)
finally:
    context.user_data.clear()
```

### 7.4 Testing Tips

**Unit Test Handler**:
```python
import pytest
from unittest.mock import AsyncMock, MagicMock

@pytest.mark.asyncio
async def test_cmd_start_already_connected():
    # Mock update & context
    update = MagicMock()
    update.effective_chat.id = 123456
    update.message.reply_text = AsyncMock()
    
    context = MagicMock()
    
    # Mock get_linked_profile
    with patch('auth_handler.get_linked_profile') as mock_get:
        mock_get.return_value = {"id": "uuid", "display_name": "John"}
        
        # Call handler
        await cmd_start(update, context)
        
        # Assert
        update.message.reply_text.assert_called_once()
        assert "sudah terhubung" in update.message.reply_text.call_args[0][0]
```



### 7.5 Performance Tips

**1. Batch Operations**
```python
# ❌ LAMBAT (N queries)
for expense in expenses:
    detail = expense_service.get_expense_by_id(expense.id)
    await update.message.reply_text(str(detail))

# ✅ CEPAT (1 query)
expenses = expense_service.get_all_expenses(user_id=user_id, limit=20)
for expense in expenses.expenses:
    await update.message.reply_text(str(expense))
```

**2. Limit Query Results**
```python
# ✅ Selalu pakai limit
expense_service.get_all_expenses(user_id=user_id, limit=20)

# ❌ Jangan query semua data
expense_service.get_all_expenses(user_id=user_id)  # Bisa ribuan data!
```

**3. Pagination untuk List Panjang**
```python
# Untuk list > 20 item, pakai pagination dengan inline keyboard
keyboard = InlineKeyboardMarkup([
    [
        InlineKeyboardButton("◀️ Prev", callback_data="prev_page:1"),
        InlineKeyboardButton("Next ▶️", callback_data="next_page:3"),
    ]
])
```

### 7.6 Security Best Practices

**1. Selalu Validasi User ID**
```python
# ✅ AMAN
profile = await get_linked_profile(chat_id)
expense_service.get_all_expenses(user_id=profile["id"])

# ❌ BAHAYA
expense_service.get_all_expenses()  # Bisa akses data user lain!
```

**2. Escape User Input**
```python
# ✅ Escape untuk MarkdownV2
text = _escape_markdown_v2(user_input)
await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN_V2)

# ❌ Langsung pakai user input
await update.message.reply_text(user_input, parse_mode=ParseMode.MARKDOWN_V2)
```

**3. Rate Limiting**
```python
# Implementasi rate limiting untuk prevent spam
# (Telegram sudah punya built-in rate limit, tapi bisa tambah custom)
```



---

## 8. TROUBLESHOOTING

### 8.1 Bot Tidak Merespon

**Kemungkinan Penyebab**:

1. **Token salah**
   - Cek `TELEGRAM_BOT_TOKEN` di `.env`
   - Generate token baru dari @BotFather jika perlu

2. **Handler tidak terdaftar**
   - Cek `application.py` → `create_bot()`
   - Pastikan handler sudah di-`add_handler()`

3. **Urutan handler salah**
   - ConversationHandler harus sebelum MessageHandler umum
   - Handler lebih spesifik harus sebelum handler umum

4. **Error di handler**
   - Cek log untuk error message
   - Pastikan semua exception di-catch

### 8.2 ConversationHandler Tidak Jalan

**Kemungkinan Penyebab**:

1. **`concurrent_updates=True`**
   ```python
   # ❌ SALAH
   app = ApplicationBuilder().token(token).build()
   
   # ✅ BENAR
   app = ApplicationBuilder().token(token).concurrent_updates(False).build()
   ```

2. **Lupa return state**
   ```python
   # ❌ SALAH
   async def handle_amount(update, context):
       context.user_data["amount"] = update.message.text
       # Lupa return!
   
   # ✅ BENAR
   async def handle_amount(update, context):
       context.user_data["amount"] = update.message.text
       return WAITING_TYPE
   ```

3. **Filter salah**
   ```python
   # ❌ SALAH (akan tangkap command juga)
   MessageHandler(filters.TEXT, handle_amount)
   
   # ✅ BENAR
   MessageHandler(filters.TEXT & ~filters.COMMAND, handle_amount)
   ```



### 8.3 Callback Query Tidak Jalan

**Kemungkinan Penyebab**:

1. **Lupa `await query.answer()`**
   ```python
   # ❌ SALAH
   async def callback_view(update, context):
       query = update.callback_query
       # Lupa answer!
       await query.edit_message_text("Detail...")
   
   # ✅ BENAR
   async def callback_view(update, context):
       query = update.callback_query
       await query.answer()  # PENTING!
       await query.edit_message_text("Detail...")
   ```

2. **Pattern regex salah**
   ```python
   # ❌ SALAH (tidak match)
   CallbackQueryHandler(callback_view, pattern="view_expense")
   
   # ✅ BENAR
   CallbackQueryHandler(callback_view, pattern=r"^view_expense:")
   ```

3. **callback_data terlalu panjang**
   - Maksimal 64 bytes
   - Pakai ID pendek atau encode

### 8.4 Database Error

**Kemungkinan Penyebab**:

1. **RLS (Row Level Security) block query**
   - Pakai admin client untuk bot
   - Filter by `user_id` di query

2. **Connection timeout**
   - Cek network
   - Cek Supabase status

3. **Query salah**
   - Cek log error
   - Test query di Supabase dashboard

### 8.5 MarkdownV2 Error

**Error**: `Bad Request: can't parse entities`

**Solusi**: Escape special characters
```python
def _escape_markdown_v2(text: str) -> str:
    special = r"_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{ch}" if ch in special else ch for ch in str(text))
```



---

## 9. LATIHAN & CHALLENGE

### 9.1 Latihan Dasar

**1. Tambah Command Baru**
- Buat command `/about` yang tampilkan info bot
- Daftar di `application.py`
- Tambah text di `messages.py`

**2. Modifikasi Keyboard**
- Tambah tombol "📈 Grafik" di main menu
- Buat handler untuk tombol tersebut

**3. Tambah Validasi**
- Validasi kategori harus minimal 3 karakter
- Validasi nominal maksimal 1 juta

### 9.2 Latihan Intermediate

**1. Fitur Edit Expense**
- Buat ConversationHandler untuk edit expense
- Flow: pilih expense → pilih field → input value baru
- Update database

**2. Filter by Category**
- Tambah command `/list <category>`
- Tampilkan hanya expense dengan kategori tertentu

**3. Export Data**
- Buat command `/export`
- Generate CSV dari semua expense
- Kirim file ke user

### 9.3 Challenge Advanced

**1. Pagination**
- Implementasi pagination untuk `/list`
- Pakai inline keyboard untuk navigasi
- Simpan page state di `context.user_data`

**2. Reminder**
- Buat fitur reminder untuk tagihan rutin
- Pakai job queue (APScheduler)
- Kirim notifikasi otomatis

**3. Multi-language**
- Support bahasa Indonesia & Inggris
- User bisa pilih bahasa via `/language`
- Simpan preferensi di database



---

## 10. REFERENSI & RESOURCES

### 10.1 Dokumentasi Resmi

- **python-telegram-bot**: https://docs.python-telegram-bot.org/
- **Telegram Bot API**: https://core.telegram.org/bots/api
- **Supabase Python**: https://supabase.com/docs/reference/python
- **Pydantic**: https://docs.pydantic.dev/

### 10.2 Konsep Penting untuk Dipelajari Lebih Lanjut

1. **Async Programming**
   - `async`/`await` syntax
   - Event loop
   - Concurrent execution

2. **Design Patterns**
   - Factory pattern
   - Repository pattern
   - Dependency injection

3. **Clean Architecture**
   - Separation of concerns
   - Layer responsibilities
   - Dependency rule

4. **Database**
   - PostgreSQL basics
   - Row Level Security (RLS)
   - Query optimization

### 10.3 Tools untuk Development

- **ngrok**: Untuk testing webhook locally
- **Postman**: Testing API endpoints
- **DBeaver**: Database management
- **VS Code**: IDE dengan Python extension

---

## 🎯 KESIMPULAN

Setelah mempelajari panduan ini, kamu sekarang paham:

✅ Arsitektur bot (layered architecture)
✅ Cara kerja handler (command, message, callback)
✅ ConversationHandler untuk multi-step flow
✅ Keyboard (reply & inline)
✅ Error handling & best practices
✅ Security considerations
✅ Troubleshooting common issues

**Next Steps**:
1. Baca ulang bagian yang belum jelas
2. Coba modifikasi kode yang ada
3. Buat fitur baru dari latihan
4. Eksperimen dengan ide sendiri

**Tips Belajar**:
- Jangan takut break things (pakai git!)
- Baca error message dengan teliti
- Debug dengan print/log
- Tanya jika stuck (StackOverflow, Discord, dll)

Selamat coding! 🚀

