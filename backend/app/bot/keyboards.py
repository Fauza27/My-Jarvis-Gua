from telegram import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup


def expense_action_keyboard(expense_id: str) -> InlineKeyboardMarkup:
    """
    Tombol aksi untuk setiap data pengeluaran di list.
    callback_data format: "<action>:<expense_id>"
    """
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🧾 Detail", callback_data=f"view_expense:{expense_id}"),
            InlineKeyboardButton("🗑️ Hapus", callback_data=f"delete_expense:{expense_id}"),
        ]
    ])


def confirm_delete_expense_keyboard(expense_id: str) -> InlineKeyboardMarkup:
    """Konfirmasi sebelum hapus data pengeluaran."""
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Ya, hapus", callback_data=f"confirm_delete_expense:{expense_id}"),
            InlineKeyboardButton("❌ Batal", callback_data=f"cancel_delete_expense:{expense_id}"),
        ]
    ])


def main_menu_keyboard() -> ReplyKeyboardMarkup:
    """
    Keyboard utama yang selalu tampil setelah user login.
    Memudahkan navigasi tanpa perlu ingat perintah.
    """
    return ReplyKeyboardMarkup(
        keyboard=[
            ["➕ Tambah Pengeluaran", "📋 Lihat Pengeluaran"],
            ["📊 Ringkasan", "👤 Profil Saya"],
            ["🔌 Putuskan Akun", "❓ Bantuan"],
        ],
        resize_keyboard=True,    # Sesuaikan ukuran tombol
        one_time_keyboard=False, # Tetap tampil setelah diklik
    )