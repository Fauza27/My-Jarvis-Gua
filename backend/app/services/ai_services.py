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
        Arrange messages array for OpenAI Responses API input.
        Supported format:
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

    @staticmethod
    def _normalize_tools_for_responses(tools: list[dict]) -> list[dict]:
        """Convert Chat Completions tool schema into Responses API tool schema."""
        normalized: list[dict] = []
        for tool in tools:
            if (
                isinstance(tool, dict)
                and tool.get("type") == "function"
                and isinstance(tool.get("function"), dict)
            ):
                function_def = dict(tool["function"])
                normalized.append({"type": "function", **function_def})
            else:
                normalized.append(tool)
        return normalized

    @staticmethod
    def _safe_attr(item, key: str, default=None):
        """Read value from typed SDK objects or plain dict payloads."""
        if isinstance(item, dict):
            return item.get(key, default)
        return getattr(item, key, default)

    def _extract_tool_calls_from_response(self, response) -> list[dict[str, str]]:
        """Extract function calls from a Responses API result."""
        tool_calls: list[dict[str, str]] = []

        for output_item in getattr(response, "output", []) or []:
            item_type = self._safe_attr(output_item, "type")
            if item_type != "function_call":
                continue

            name = self._safe_attr(output_item, "name")
            arguments = self._safe_attr(output_item, "arguments") or "{}"
            call_id = self._safe_attr(output_item, "call_id") or self._safe_attr(output_item, "id")

            if not name or not call_id:
                logger.warning("Skipping malformed function_call item from Responses API")
                continue

            tool_calls.append(
                {
                    "name": str(name),
                    "arguments": str(arguments),
                    "call_id": str(call_id),
                }
            )

        return tool_calls

    def _extract_text_from_response(self, response) -> str:
        """Extract assistant text from a Responses API result."""
        output_text = getattr(response, "output_text", None)
        if output_text:
            return str(output_text).strip()

        chunks: list[str] = []
        for output_item in getattr(response, "output", []) or []:
            if self._safe_attr(output_item, "type") != "message":
                continue

            content_items = self._safe_attr(output_item, "content", []) or []
            for content_item in content_items:
                content_type = self._safe_attr(content_item, "type")
                if content_type not in {"output_text", "text"}:
                    continue

                text = self._safe_attr(content_item, "text")
                if isinstance(text, dict):
                    text = text.get("value")

                if text:
                    chunks.append(str(text))

        return "\n".join(chunks).strip()

    def _run_chat_loop(
        self,
        messages: list[dict],
        dispatcher: ToolDispatcher,
    ) -> tuple[str, list[str]]:
        """
        Core loop for OpenAI Responses API + function calling.

        Flow:
        1) Send initial messages to Responses API
        2) If model returns function_call items, execute tools
        3) Send function_call_output items back to Responses API
        4) Repeat until model returns plain assistant text

        returns:
            Tuple (final_reply_text, list_of_actions_taken)
        """
        actions_taken: list[str] = []
        MAX_ITERATIONS = 10
        tools = self._normalize_tools_for_responses(TOOLS)

        response = self._openai_client.responses.create(
            model=self.settings.OPENAI_CHAT_MODEL,
            input=messages,
            tools=tools,
            tool_choice="auto",
        )

        for _ in range(MAX_ITERATIONS):
            tool_calls = self._extract_tool_calls_from_response(response)

            if not tool_calls:
                final_reply = self._extract_text_from_response(response)
                if final_reply:
                    return final_reply, actions_taken

                logger.warning("Responses API returned no tool call and no text output")
                return "Maaf, saya belum bisa memproses permintaan ini.", actions_taken

            tool_outputs = []
            for tool_call in tool_calls:
                func_name = tool_call["name"]
                func_args = tool_call["arguments"]
                call_id = tool_call["call_id"]

                logger.info("AI calling tool: %s(%s...)", func_name, func_args[:100])

                result = dispatcher.execute(func_name, func_args)
                actions_taken.append(func_name)
                tool_outputs.append(
                    {
                        "type": "function_call_output",
                        "call_id": call_id,
                        "output": json.dumps(result, ensure_ascii=False),
                    }
                )

            response = self._openai_client.responses.create(
                model=self.settings.OPENAI_CHAT_MODEL,
                previous_response_id=response.id,
                input=tool_outputs,
                tools=tools,
                tool_choice="auto",
            )

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