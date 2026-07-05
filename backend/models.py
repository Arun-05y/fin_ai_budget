# backend/models.py
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class UserAuth(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)

class Token(BaseModel):
    token: str
    username: str
    message: str

class BudgetData(BaseModel):
    currency: str = "₹"
    income: float = 0.0
    otherIncome: float = 0.0
    expenses: Dict[str, float] = {}
    debt: float = 0.0
    currentSavings: float = 0.0
    savingsGoal: float = 0.0
    financialGoals: str = ""

class ChatHistoryItem(BaseModel):
    sender: str  # "user" or "bot" / "model"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatHistoryItem]] = []

class ChatResponse(BaseModel):
    reply: str
