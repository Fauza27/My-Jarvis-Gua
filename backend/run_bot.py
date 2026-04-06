"""
Script untuk menjalankan Telegram Bot secara standalone.
Jalankan: python run_bot.py
"""
import sys
import logging
from pathlib import Path

# Pastikan folder backend ada di Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup logging agar bisa lihat apa yang terjadi
log_file = backend_dir / "bot_debug.log"
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.DEBUG,
    handlers=[
        logging.FileHandler(log_file, mode="w", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
# Reduce noise from HTTP libraries
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("hpack").setLevel(logging.WARNING)

from app.bot.application import create_bot

if __name__ == "__main__":
    print(" Starting My Jarvis Gua Bot...")
    print(" Press Ctrl+C to stop\n")
    
    bot = create_bot()
    bot.run_polling(drop_pending_updates=True)
