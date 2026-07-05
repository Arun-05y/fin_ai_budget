# backend/main.py
import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
import google.generativeai as genai

# Load environment variables
load_dotenv()

from database import db_manager
from models import UserAuth, Token, BudgetData, ChatRequest, ChatResponse

app = FastAPI(title="FinAI Budget Planning API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Configurations
JWT_SECRET = os.getenv("JWT_SECRET", "finai-secure-token-secret-key-99887766")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Security Schemas
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Gemini AI configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai_model = None

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Create system instruction
        SYSTEM_PROMPT = """
You are FinAI, an intelligent Budget Planning Agent designed to help users create monthly/yearly budgets.
Your role is to:
1. Welcome the user politely.
2. Collect financial details step-by-step: Monthly income, other income, rent/EMI, food, transportation, utilities, healthcare, education, entertainment, shopping, debt/loans, current savings, monthly savings goal, financial goals.
3. Highlight top spending categories.
4. Recommend ways to reduce expenses (reduce subscriptions, limit entertainment, cook more).
5. Generate a budget table mapping income, rent, food, transport, utilities, shopping, entertainment, healthcare, savings, investments, and remaining balance.
6. Provide a savings plan (monthly/yearly projection & goal timeline).
7. Give smart insights (e.g. average comparison, emergency fund duration).
8. Recommend 50/30/20 rule and other practical tips.

Guidelines:
- Present currency values clearly.
- Keep advice practical and personalized.
- Be supportive, professional, and non-judgmental.
- If income or expenses change, recalculate immediately.
- Never make assumptions; ask for clarification if values are missing.
"""
        genai_model = genai.GenerativeModel(
            model_name='gemini-2.5-flash',
            system_instruction=SYSTEM_PROMPT
        )
        print("Gemini AI successfully initialized.")
    except Exception as e:
        print(f"Failed to initialize Gemini AI: {e}")
else:
    print("No GEMINI_API_KEY found. Chatbot running in rule-based local intelligence mode.")


# --- Security Helpers ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        user_id: str = payload.get("id")
        if username is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"id": user_id, "username": username}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user: UserAuth):
    db_user = db_manager.get_user_by_username(user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    hashed_pwd = get_password_hash(user.password)
    new_user = db_manager.create_user(user.username, hashed_pwd)
    
    token = create_access_token(data={"id": new_user["id"], "username": new_user["username"]})
    return {
        "token": token,
        "username": new_user["username"],
        "message": "Registration successful"
    }

@app.post("/api/auth/login", response_model=Token)
def login(user: UserAuth):
    db_user = db_manager.get_user_by_username(user.username)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid credentials"
        )
    
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid credentials"
        )
    
    token = create_access_token(data={"id": db_user["id"], "username": db_user["username"]})
    return {
        "token": token,
        "username": db_user["username"],
        "message": "Login successful"
    }


# --- Budget Endpoints ---

@app.get("/api/budget")
def get_budget(current_user: dict = Depends(get_current_user)):
    budget = db_manager.get_budget_by_user_id(current_user["id"])
    if not budget:
        return {"budget": None}
    return {"budget": budget}

@app.post("/api/budget")
def save_budget(budget: BudgetData, current_user: dict = Depends(get_current_user)):
    budget_dict = budget.dict()
    budget_dict["updatedAt"] = datetime.utcnow().isoformat()
    saved = db_manager.save_budget(current_user["id"], budget_dict)
    return {"message": "Budget saved successfully", "budget": saved}

@app.get("/api/debug-gemini")
def debug_gemini():
    return {
        "gemini_api_key_exists": bool(os.getenv("GEMINI_API_KEY")),
        "gemini_api_key": os.getenv("GEMINI_API_KEY")[:10] if os.getenv("GEMINI_API_KEY") else None,
        "genai_model_exists": genai_model is not None,
    }

# --- AI Chatbot Endpoint ---

def generate_local_reply(message: str, history: List) -> str:
    text = message.lower()
    if any(greet in text for greet in ["hello", "hi", "hey"]):
        return "Hello! I'm your AI Budget Planning Assistant. I'll help you create a personalized budget and improve your financial planning. What is your total monthly income to get started?"
    
    if any(demo in text for demo in ["demo", "auto", "fill"]):
        return "✨ <strong>Demo profile loaded successfully!</strong> I've populated the planner with sample financial values. Let's analyze your results on the dashboard."

    if "50/30/20" in text or "rule" in text:
        return "The **50/30/20 Rule** suggests splitting your income into:<br>• **50% Needs**: Housing, utilities, food, healthcare.<br>• **30% Wants**: Entertainment, shopping, dining out.<br>• **20% Savings**: Savings goals, emergency funds, debt payment."

    if "emergency" in text or "fund" in text:
        return "An **Emergency Fund** should cover 3 to 6 months of your essential living expenses. Keep it in a liquid, high-yield account so it is easily accessible in times of unexpected job loss or medical events."

    return "Got it! I am processing this update. Your budget calculations and interactive sheet on the right have been synchronized. What other financial adjustments or savings goals can I help you map out?"

@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    if not payload.message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message is required"
        )
    
    if genai_model:
        try:
            contents = []
            if payload.history:
                for h in payload.history:
                    role = "user" if h.sender == "user" else "model"
                    contents.append({
                        "role": role,
                        "parts": [h.content]
                    })
            # Append current message
            contents.append({
                "role": "user",
                "parts": [payload.message]
            })
            
            response = genai_model.generate_content(contents)
            return {"reply": response.text}
        except Exception as e:
            print(f"Gemini API call failed, falling back to local chat engine: {e}")
            
    # Fallback to local rule-based response
    reply = generate_local_reply(payload.message, payload.history)
    return {"reply": reply}


# Serve static files from the public folder if it exists (resolved via absolute path)
backend_dir = os.path.dirname(os.path.abspath(__file__))
public_dir = os.path.join(os.path.dirname(backend_dir), "public")
if os.path.exists(public_dir):
    app.mount("/", StaticFiles(directory=public_dir, html=True), name="public")
else:
    print(f"Warning: Static files directory '{public_dir}' not found. Frontend static serving skipped on backend.")


if __name__ == "__main__":
    import uvicorn
    # Read port from env or default to 8080
    port = int(os.getenv("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
