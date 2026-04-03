import json
import logging
from datetime import datetime, timezone

from openai import OpenAI

from app.services.ai_tools import ToolDispatcher, TOOLS
from app.services.embedding_services import EmbeddingService
from app.repositories.ai_repository import AIRepository
from app.services.expense_service import ExpenseService
from app.models.ai import (
    ChatResponse, ConversationMessage,
    SearchResultItem, SemanticSearchResponse,
)
from app.core.config import get_settings

logger = logging.getLogger(__name__)

def _build_system_prompt() -> str:
    """build the system prompt for the AI assistant, including tool descriptions and usage instructions."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"""
Kamu adalah asisten keuangan pribadi berbahasa Indonesia yang membantu user mencatat dan menganalisis pemasukan/pengeluaran.

Tanggal hari ini (UTC): {today}

Tujuan utama:
1) Membantu user mencatat transaksi dengan benar.
2) Menjawab pertanyaan riwayat transaksi.
3) Menyajikan ringkasan keuangan dengan jelas.

Aturan bahasa dan gaya:
- Gunakan Bahasa Indonesia yang natural, ringkas, dan ramah.
- Fokus ke data finansial user. Hindari jawaban bertele-tele.
- Jika ada aksi data (buat/update/hapus), konfirmasi hasil aksi secara eksplisit.

Aturan penggunaan tools (WAJIB):
- Pakai tool hanya jika memang butuh akses data atau perubahan data.
- Jangan panggil tool kalau user hanya ngobrol umum, tanya konsep, atau cerita tanpa niat aksi.
- Jika informasi belum cukup untuk eksekusi tool, tanyakan klarifikasi singkat dulu.

Daftar tool yang tersedia dan kapan dipakai:
- create_expense: saat user ingin mencatat transaksi baru.
- list_expenses: saat user ingin melihat daftar/riwayat transaksi.
- update_expense: saat user ingin mengubah transaksi yang sudah ada.
- delete_expense: saat user ingin menghapus transaksi.
- get_monthly_summary: saat user minta ringkasan bulan tertentu.
- get_yearly_summary: saat user minta ringkasan tahun tertentu.
- get_all_time_summary: saat user minta ringkasan seluruh waktu.

Aturan data penting:
- Format tanggal yang valid untuk input transaksi: YYYY-MM-DD.
- Jika user memberi tanggal ambigu (misal: "kemarin", "awal bulan"), ubah ke tanggal eksplisit sebelum eksekusi.
- Jika user tidak memberi transaction_date saat create_expense, backend akan default ke hari ini.

Aturan keamanan dan ketepatan:
- Jangan mengarang ID transaksi.
- Untuk update/delete, pastikan expense_id tersedia.
- Jika tool mengembalikan error, jelaskan error secara singkat dan beri langkah perbaikan.
- Jangan mengeklaim aksi berhasil jika tool gagal.

Aturan respons setelah tool call:
- Ringkas hasil tool dalam bahasa manusia.
- Sertakan angka penting (amount, kategori, tanggal, total income/expense/net balance) jika relevan.
- Untuk list panjang, tampilkan ringkasan dan tawarkan filter lanjutan.

Jika tidak perlu tool:
- Jawab langsung pertanyaan user secara informatif.
"""

class AIService:
    """Orchestrates AI-related operations, including chat interactions and semantic search."""
    def __init__(
        self,
        openai_client: OpenAI,
        expense_service: ExpenseService,
        embedding_service: EmbeddingService,
        ai_repo: AIRepository,
    ):
        self._openai_client = openai_client
        self._expense_service = expense_service
        self._embedding_service = embedding_service
        self._ai_repo = ai_repo
        self.settings = get_settings()

    # use case 1: chat with function calling

    def chat(
        self,
        user_id: str,
        message: str,
        conversation_history: list[ConversationMessage],
    ) -> ChatResponse:
        """Use case 1: Handles a chat request by generating a response from the AI assistant, including tool function calls if needed."""
        messages = self._build_messages(conversation_history, message)
        dispatcher = ToolDispatcher(
            expense_service=self._expense_service,
            user_id=user_id
        )
        final_reply, actions_taken = self._run_chat_loop(messages, dispatcher)
        updated_history = list(conversation_history) + [
            ConversationMessage(role="user", content=message),
            ConversationMessage(role="assistant", content=final_reply),
        ]
        return ChatResponse(
            reply=final_reply,
            conversation_history=updated_history,
            action_taken=actions_taken
        )

    def _build_messages(
        self,
        history: list[ConversationMessage],
        new_message: str,
    ) -> list[dict]:
        """
        arrange messages array for send to OpenAI.
        format that need by Openai chat completion:
        [
            {"role": "system",    "content": "..."},  ← always in the first
            {"role": "user",      "content": "..."},  ← from history
            {"role": "assistant", "content": "..."},  ← from history
            ...
            {"role": "user",      "content": "..."},  ← new message
        ]
        """
        messages = [
            {"role": "system", "content": _build_system_prompt()}
        ]
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": new_message})
        return messages

    def _run_chat_loop(
        self,
        messages: list[dict],
        dispatcher: ToolDispatcher,
    ) -> tuple[str, list[str]]:
        """
        core loop functon calling.

        it will keep running until the ai return answer text (finish_reason=="stop).
        every iterasi: send to OpenAI -> if there is tool call -> execute -> loop again

        returns:
            Tuple (final_reply_text, list_of_actions_taken)
        """
        actions_taken = []
        MAX_ITERATIONS = 10

        for iteration in range(MAX_ITERATIONS):
            response = self._openai_client.chat.completions.create(
                model=self.settings.OPENAI_CHAT_MODEL,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
            )

            assistant_message = response.choices[0].message
            finish_reason = response.choices[0].finish_reason

            messages.append(assistant_message)

            if finish_reason == "stop":
                return assistant_message.content or "", actions_taken

            if finish_reason == "tool_calls":
                for tool_call in assistant_message.tool_calls:
                    func_name = tool_call.function.name
                    func_args = tool_call.function.arguments

                    logger.info(f"AI calling tool: {func_name}({func_args[:100]}...)")

                    result = dispatcher.execute(func_name, func_args)
                    actions_taken.append(func_name)

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result, ensure_ascii=False),
                    })

                    continue

            logger.warning(f"Unexpected finish reason: {finish_reason}")
            break

        logger.error("Chat loop exceeded maximum iterations without finishing.")
        return "Sorry, there was an error processing your request.", actions_taken

    # use case 2: semantic search

    def search(
        self,
        user_id: str,
        query: str,
        match_threshold: float = 0.5,
        match_count: int = 5,
    ) -> SemanticSearchResponse:
        """
        Use case: find expense or income.
        """

        query_embedding = self._embedding_service.generate_for_query(query)

        raw_results = self._ai_repo.semantic_search(
            query_embedding=query_embedding,
            user_id=user_id,
            match_threshold=match_threshold,
            match_count=match_count,
        )

        results = [
            SearchResultItem(
                id=item["id"],
                amount=item["amount"],
                type=item["type"],
                description=item.get("description"),
                category=item["category"],
                subcategory=item.get("subcategory"),
                payment_method=item.get("payment_method"),
                transaction_date=item.get("transaction_date"),
                similarity=item["similarity"],
            )
            for item in raw_results
        ]

        return SemanticSearchResponse(
            query=query,
            results=results,
            total=len(results),
        )