from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Import the agent
from agent import handle_chat_with_agent
from guardrails import check_guardrails

app = FastAPI(title="HealBridge Premium Backend")

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    user_id: str = "guest"

class ChatResponse(BaseModel):
    reply: str
    ui_card: Optional[Dict[str, Any]] = None

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    # 1. Run the Semantic Interceptor (Guardrails) first!
    is_safe, fallback_msg = check_guardrails(req.message)
    if not is_safe:
        return ChatResponse(reply=fallback_msg, ui_card=None)
        
    # 2. Pass to LangGraph Agent
    try:
        reply, ui_card = handle_chat_with_agent(req.message, req.user_id)
        return ChatResponse(reply=reply, ui_card=ui_card)
    except Exception as e:
        return ChatResponse(reply=f"Agent Error: {str(e)}", ui_card=None)

@app.get("/health")
def health_check():
    return {"status": "ok"}
