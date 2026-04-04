import json
import logging
from datetime import datetime, timezone
from typing import Any

from app.services.expense_service import ExpenseService
from app.models.expense import CreateExpenseRequest, UpdateExpenseRequest

logger = logging.getLogger(__name__)

TOOLS: list[dict] = [

    # Tools 1: Buat expense
    {
        "type": "function",
        "function": {
            "name": "create_expense",
            "description": (
                "Buat transaksi baru (income/expense). "
                "Gunakan hanya saat user benar-benar ingin mencatat transaksi. "
                "Jika user hanya bertanya atau bercerita tanpa niat mencatat, jangan panggil tool ini. "
                "Format transaction_date wajib YYYY-MM-DD (contoh: 2026-06-01). "
                "Jika transaction_date tidak ada, backend akan pakai tanggal hari ini. "
                "Kirim null untuk field opsional yang tidak diisi user."
            ),
            "strict": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "amount": {
                        "type": "number",
                        "description": "Jumlah uang yang dikeluarkan atau diterima. Gunakan angka tanpa tanda baca, misalnya 150000 untuk seratus lima puluh ribu."
                    },
                    "type": {
                        "type": "string",
                        "enum": ["income", "expense"],
                        "description": "Tipe transaksi, bisa 'income' untuk pemasukan atau 'expense' untuk pengeluaran."
                    },
                    "category": {
                        "type": "string",
                        "description": "Kategori utama dari transaksi, misalnya 'makanan', 'transportasi', 'hadiah', dll."
                    },
                    "description": {
                        "type": ["string", "null"],
                        "description": "Deskripsi tambahan tentang transaksi, misalnya 'makan siang di restoran'. Kirim null jika tidak ada."
                    },
                    "subcategory": {
                        "type": ["string", "null"],
                        "description": "Subkategori dari transaksi, misalnya 'makanan cepat saji' sebagai subkategori dari 'makanan'. Kirim null jika tidak ada."
                    },
                    "payment_method": {
                        "type": ["string", "null"],
                        "description": "Metode pembayaran yang digunakan, misalnya 'tunai', 'kartu kredit', 'e-wallet'. Kirim null jika tidak ada."
                    },
                    "transaction_date": {
                        "type": ["string", "null"],
                        "description": "Tanggal transaksi format YYYY-MM-DD. Contoh: 2026-06-01. Kirim null jika pakai hari ini."
                    }
                },
                "required": ["amount", "type", "category", "description", "subcategory", "payment_method", "transaction_date"],
                "additionalProperties": False,
            },
        },
    },

    # Tools 2: Lihat semua expense
    {
        "type": "function",
        "function": {
            "name": "list_expenses",
            "description": (
                "Lihat daftar transaksi user dengan filter opsional. "
                "Gunakan saat user meminta lihat riwayat/pengeluaran/pemasukan. "
                "Kirim null untuk filter yang tidak dipakai."
            ),
            "strict": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": ["integer", "null"],
                        "description": "Jumlah data per halaman (1-100). Default 20. Kirim null untuk default."
                    },
                    "offset": {
                        "type": ["integer", "null"],
                        "description": "Jumlah data yang dilewati untuk pagination. Default 0. Kirim null untuk default."
                    },
                    "type": {
                        "type": ["string", "null"],
                        "enum": ["income", "expense", None],
                        "description": "Filter tipe transaksi. Kirim null jika tidak filter."
                    },
                    "category": {
                        "type": ["string", "null"],
                        "description": "Filter kategori (partial match). Kirim null jika tidak filter."
                    },
                    "q": {
                        "type": ["string", "null"],
                        "description": "Kata kunci untuk cari di description/category/subcategory. Kirim null jika tidak filter."
                    },
                    "date_from": {
                        "type": ["string", "null"],
                        "description": "Tanggal awal filter, format YYYY-MM-DD. Kirim null jika tidak filter."
                    },
                    "date_to": {
                        "type": ["string", "null"],
                        "description": "Tanggal akhir filter, format YYYY-MM-DD. Kirim null jika tidak filter."
                    },
                    "sort_by": {
                        "type": ["string", "null"],
                        "enum": ["created_at", "transaction_date", "amount", None],
                        "description": "Kolom pengurutan. Default created_at. Kirim null untuk default."
                    },
                    "sort_order": {
                        "type": ["string", "null"],
                        "enum": ["asc", "desc", None],
                        "description": "Urutan sort. Default desc. Kirim null untuk default."
                    }
                },
                "required": ["limit", "offset", "type", "category", "q", "date_from", "date_to", "sort_by", "sort_order"],
                "additionalProperties": False
            }
        }
    },

    # Tools 3: Hapus expense
    {
        "type": "function",
        "function": {
            "name": "delete_expense",
            "description": "Hapus (soft delete) satu transaksi berdasarkan expense_id.",
            "strict": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "expense_id": {
                        "type": "string",
                        "description": "ID transaksi (UUID) yang ingin dihapus."
                    }
                },
                "required": ["expense_id"],
                "additionalProperties": False
            }
        }
    },

    # Tools 4: Perbarui expense
    {
        "type": "function",
        "function": {
            "name": "update_expense",
            "description": (
                "Update sebagian field transaksi berdasarkan expense_id. "
                "Minimal satu field update harus non-null. "
                "Kirim null untuk field yang tidak ingin diubah."
            ),
            "strict": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "expense_id": {
                        "type": "string",
                        "description": "ID transaksi (UUID) yang ingin diupdate."
                    },
                    "amount": {
                        "type": ["number", "null"],
                        "description": "Jumlah baru transaksi. Kirim null jika tidak diubah."
                    },
                    "type": {
                        "type": ["string", "null"],
                        "enum": ["income", "expense", None],
                        "description": "Tipe transaksi baru. Kirim null jika tidak diubah."
                    },
                    "description": {
                        "type": ["string", "null"],
                        "description": "Deskripsi baru transaksi. Kirim null jika tidak diubah."
                    },
                    "category": {
                        "type": ["string", "null"],
                        "description": "Kategori baru transaksi. Kirim null jika tidak diubah."
                    },
                    "subcategory": {
                        "type": ["string", "null"],
                        "description": "Subkategori baru transaksi. Kirim null jika tidak diubah."
                    },
                    "payment_method": {
                        "type": ["string", "null"],
                        "description": "Metode pembayaran baru. Kirim null jika tidak diubah."
                    },
                    "transaction_date": {
                        "type": ["string", "null"],
                        "description": "Tanggal transaksi baru format YYYY-MM-DD. Kirim null jika tidak diubah."
                    }
                },
                "required": ["expense_id", "amount", "type", "description", "category", "subcategory", "payment_method", "transaction_date"],
                "additionalProperties": False
            }
        }
    },

    # Tools 5: Lihat ringkasan bulanan
    {
        "type": "function",
        "function": {
            "name": "get_monthly_summary",
            "description": "Lihat ringkasan income/expense per bulan tertentu.",
            "strict": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 12,
                        "description": "Bulan target, 1 sampai 12."
                    },
                    "year": {
                        "type": "integer",
                        "minimum": 2000,
                        "maximum": 2100,
                        "description": "Tahun target, misalnya 2026."
                    }
                },
                "required": ["month", "year"],
                "additionalProperties": False
            }
        }
    },

    # Tools 6: Lihat ringkasan tahunan
    {
        "type": "function",
        "function": {
            "name": "get_yearly_summary",
            "description": "Lihat ringkasan income/expense per tahun.",
            "strict": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {
                        "type": "integer",
                        "minimum": 2000,
                        "maximum": 2100,
                        "description": "Tahun target, misalnya 2026."
                    }
                },
                "required": ["year"],
                "additionalProperties": False
            }
        }
    },

    # Tools 7: Lihat ringkasan total
    {
        "type": "function",
        "function": {
            "name": "get_all_time_summary",
            "description": "Lihat ringkasan income/expense seluruh waktu.",
            "strict": True,
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            }
        }
    },
]


class ToolDispatcher:
    """Dispatcher that maps tool names to their implementations."""

    def __init__(self, expense_service: ExpenseService, user_id: str):
        self._expense_service = expense_service
        self._user_id = user_id

    def execute(self, function_name: str, arguments: str) -> dict[str, Any]:
        """Executes the specified tool function with the given arguments."""
        try:
            args = self._parse_arguments(arguments)
            logger.info("Executing tool '%s' with args keys: %s", function_name, sorted(args.keys()))

            if function_name == "create_expense":
                return self._create_expense(args)
            if function_name == "list_expenses":
                return self._list_expenses(args)
            if function_name == "delete_expense":
                return self._delete_expense(args)
            if function_name == "update_expense":
                return self._update_expense(args)
            if function_name == "get_monthly_summary":
                return self._get_monthly_summary(args)
            if function_name == "get_yearly_summary":
                return self._get_yearly_summary(args)
            if function_name == "get_all_time_summary":
                return self._get_all_time_summary()

            return {"error": f"Unknown function: {function_name}"}
        except Exception as exc:
            logger.error("Tool execution error [%s]: %s", function_name, exc)
            return {"error": str(exc)}

    def _parse_arguments(self, arguments_json: str) -> dict[str, Any]:
        """Parse argumen JSON tool menjadi dict."""
        if not arguments_json:
            return {}
        try:
            parsed = json.loads(arguments_json)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid tool arguments JSON: {exc}") from exc
        if not isinstance(parsed, dict):
            raise ValueError("Tool arguments must be a JSON object")
        return parsed

    def _default_today(self) -> str:
        """Return today's date in UTC with YYYY-MM-DD format."""
        return datetime.now(timezone.utc).date().isoformat()

    def _strip_none(self, args: dict[str, Any]) -> dict[str, Any]:
        """Remove keys with None values — OpenAI strict mode sends null for optional fields."""
        return {k: v for k, v in args.items() if v is not None}

    def _create_expense(self, args: dict[str, Any]) -> dict[str, Any]:
        args = self._strip_none(args)
        if "transaction_date" not in args:
            args["transaction_date"] = self._default_today()

        created = self._expense_service.create_expense(
            user_id=self._user_id,
            request=CreateExpenseRequest(**args),
        )
        return {
            "status": "success",
            "tool": "create_expense",
            "message": "Transaksi berhasil dibuat.",
            "data": created.model_dump(),
        }

    def _list_expenses(self, args: dict[str, Any]) -> dict[str, Any]:
        args = self._strip_none(args)
        result = self._expense_service.get_all_expenses(
            user_id=self._user_id,
            limit=int(args.get("limit", 20)),
            offset=int(args.get("offset", 0)),
            expense_type=args.get("type"),
            category=args.get("category"),
            q=args.get("q"),
            date_from=args.get("date_from"),
            date_to=args.get("date_to"),
            sort_by=args.get("sort_by", "created_at"),
            sort_order=args.get("sort_order", "desc"),
        )
        return {
            "status": "success",
            "tool": "list_expenses",
            "data": result.model_dump(),
        }

    def _delete_expense(self, args: dict[str, Any]) -> dict[str, Any]:
        expense_id = args.get("expense_id")
        if not expense_id:
            raise ValueError("expense_id is required")

        self._expense_service.delete_expense(user_id=self._user_id, expense_id=expense_id)
        return {
            "status": "success",
            "tool": "delete_expense",
            "message": f"Transaksi {expense_id} berhasil dihapus.",
        }

    def _update_expense(self, args: dict[str, Any]) -> dict[str, Any]:
        expense_id = args.pop("expense_id", None)
        if not expense_id:
            raise ValueError("expense_id is required")

        args = self._strip_none(args)
        updated = self._expense_service.update_expense(
            user_id=self._user_id,
            expense_id=expense_id,
            request=UpdateExpenseRequest(**args),
        )
        return {
            "status": "success",
            "tool": "update_expense",
            "message": "Transaksi berhasil diperbarui.",
            "data": updated.model_dump(),
        }

    def _get_monthly_summary(self, args: dict[str, Any]) -> dict[str, Any]:
        month = args.get("month")
        year = args.get("year")
        if month is None or year is None:
            raise ValueError("month and year are required")

        summary = self._expense_service.get_expense_summary_by_month(
            user_id=self._user_id,
            month=int(month),
            year=int(year),
        )
        return {
            "status": "success",
            "tool": "get_monthly_summary",
            "data": summary.model_dump(),
        }

    def _get_yearly_summary(self, args: dict[str, Any]) -> dict[str, Any]:
        year = args.get("year")
        if year is None:
            raise ValueError("year is required")

        summary = self._expense_service.get_expense_summary_by_year(
            user_id=self._user_id,
            year=int(year),
        )
        return {
            "status": "success",
            "tool": "get_yearly_summary",
            "data": summary.model_dump(),
        }

    def _get_all_time_summary(self) -> dict[str, Any]:
        summary = self._expense_service.get_expense_summary_all_time(user_id=self._user_id)
        return {
            "status": "success",
            "tool": "get_all_time_summary",
            "data": summary.model_dump(),
        }