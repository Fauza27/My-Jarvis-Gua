from typing import Optional, Literal
from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import math

class ExpenseBase(BaseModel):
    
    @field_validator('amount', check_fields=False)
    def validate_amount(cls, value):
        if value is None:
            return value
        if not math.isfinite(value):
            raise ValueError('Amount must be finite')
        try:
            rounded = Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        except InvalidOperation:
            raise ValueError('Invalid amount')
        if not Decimal('0.01') <= rounded <= Decimal('9999999999999.99'):
            raise ValueError('Amount must be between 0.01 and 9999999999999.99')
        return float(rounded)

    @field_validator('category', 'subcategory', 'payment_method', check_fields=False)
    def normalize_category_fields(cls, value):
        if value is None:
            return value
        normalized = value.strip().lower()
        if len(normalized) > 50:
            raise ValueError('Category and payment fields must be at most 50 characters')
        return normalized

    @field_validator('category', check_fields=False)
    def require_category(cls, value):
        if value is not None and not value:
            raise ValueError('Category must not be blank')
        return value

    @field_validator('description', check_fields=False)
    def normalize_description(cls, value):
        if value:
            return value.strip()
        return value

    @field_validator("transaction_date", check_fields=False)
    def validate_date_format(cls, v):
        if v is None:
            return v
        try:
            datetime.strptime(v, "%Y-%m-%d") 
        except ValueError:
            raise ValueError("Date must be in format YYYY-MM-DD")
        return v

class CreateExpenseRequest(ExpenseBase):
    """Request model for creating an expense."""
    amount: float
    type: Literal["income", "expense"] = "expense"
    description: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_date: Optional[str] = None  
    
    @model_validator(mode="after")
    def validate_category_relation(self):
        if self.subcategory and not self.category:
            raise ValueError("Subcategory cannot be set without a category")
        return self
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "amount": 50.75,
                "type": "expense",
                "description": "Dinner at restaurant",
                "category": "food",
                "subcategory": "dining out",
                "payment_method": "credit card",
                "transaction_date": "2024-06-15"
            }
        }
    }

class UpdateExpenseRequest(ExpenseBase):
    """Request model for updating an expense."""
    amount: Optional[float] = None
    type: Optional[Literal["income", "expense"]] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_date: Optional[str] = None  

    @model_validator(mode="after")
    def reject_null_required_fields(self):
        for field in ('amount', 'type', 'category'):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f'{field} cannot be null')
        return self

    def to_update_dict(self) -> dict:
        data = self.model_dump(exclude_unset=True)
        return data
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "amount": 50.75,
                "type": "expense",
                "description": "Dinner at restaurant",
                "category": "food",
                "subcategory": "dining out",
                "payment_method": "credit card",
                "transaction_date": "2024-06-15"
            }
        }
    }

class ExpenseOut(BaseModel):
    """Response model for an expense."""
    id: str
    amount: float
    type: Literal["income", "expense"]
    description: Optional[str]
    category: str
    subcategory: Optional[str]
    payment_method: Optional[str]
    transaction_date: Optional[str]  # ISO format date string
    created_at: str  # ISO format datetime string
    updated_at: str  # ISO format datetime string

    @classmethod
    def from_db(cls, data: dict) -> "ExpenseOut":
        """Factory method to create an ExpenseOut instance from database data."""
        return cls(
            id=str(data["id"]),
            amount=data["amount"],
            type=data["type"],
            description=data.get("description"),
            category=data["category"],
            subcategory=data.get("subcategory"),
            payment_method=data.get("payment_method"),
            transaction_date=str(data["transaction_date"]) if data.get("transaction_date") else None,
            created_at=str(data.get("created_at", "")),
            updated_at=str(data.get("updated_at", ""))
        )

class DeleteExpenseResponse(BaseModel):
    """Response model for deleting an expense."""
    message: str = "Expense deleted successfully"

class ExpensesListOut(BaseModel):
    """Response model for listing expenses."""
    expenses: list[ExpenseOut]
    total: int

class ExpenseSummaryResponse(BaseModel):
    """Response model for expense summary."""
    total_income: float
    total_expense: float
    net_balance: float

class ExpenseSummaryByCategoryResponse(BaseModel):
    """Response model for expense summary by category."""
    category: str
    total_amount: float

class ExpenseSummaryByPaymentMethodResponse(BaseModel):
    """Response model for expense summary by payment method."""
    payment_method: str
    total_amount: float

class ExpenseSummaryByMonthResponse(BaseModel):
    """Response model for expense summary by month."""
    month: str  # Format: YYYY-MM
    total_income: float
    total_expense: float
    net_balance: float

class ExpenseSummaryByYearResponse(BaseModel):
    """Response model for expense summary by year."""
    year: str  # Format: YYYY
    total_income: float
    total_expense: float
    net_balance: float

class ExpenseSummaryBySubcategoryResponse(BaseModel):
    """Response model for expense summary by subcategory."""
    category: str
    subcategory: Optional[str]
    total_amount: float
