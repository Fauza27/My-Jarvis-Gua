"""Telegram replies that stay below the platform's message length limit."""


async def send_long_reply(message, text: str) -> None:
    # Plain text keeps chunk boundaries independent of Markdown escaping.
    for offset in range(0, len(text), 3500):
        await message.reply_text(text[offset:offset + 3500])
