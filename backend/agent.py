import os
import json
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent
from tools import create_booking, lookup_booking

# Initialize Groq LLM (Requires GROQ_API_KEY environment variable)
# We use openai/gpt-oss-20b to minimize token limits/costs while maintaining tool calling ability
import dotenv
dotenv.load_dotenv()
# Using the user's custom available model from their proxy/endpoint
llm_model = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
llm = ChatGroq(model=llm_model, temperature=0.1)

# List of tools the agent can use
tools = [create_booking, lookup_booking]

SYSTEM_PROMPT = """You are the HealBridge Premium Healthcare Agent. 
Your job is to assist users in booking medical services (Medicine Delivery, Lab Collection, or Home Care Nurse).

CRITICAL RULES:
1. CONVERSE NATURALLY: Respond conversationally to greetings or general messages. DO NOT assume every message is a request to book. ONLY initiate the booking flow if the user explicitly asks to book a service.
2. NEVER provide medical advice, diagnoses, or dosage recommendations. If asked, politely decline and suggest booking a consultation.
3. BOOKING FLOW: If the user explicitly wants to book a service, you MUST collect: First & Last Name, Contact Info (Email/Phone), and specific details (Address, Date, or Medicines). Do NOT ask the user to provide the date in a strict format (like YYYY-MM-DD); let them use natural language (e.g. "tomorrow").
4. EXPLICIT CONSENT REQUIRED: Once you have gathered the info, you MUST summarize it and ask the user "Does this look correct? Reply Yes to confirm." Do NOT call the tool yet.
5. ONLY call the `create_booking` tool AFTER the user has explicitly typed "Yes" or confirmed the details. 
6. LOOKUP RULE: If the user asks to check their booking status, DO NOT guess their email or phone number based on their name. You MUST explicitly ask them: "What email or phone number did you use?" before calling `lookup_booking`.
7. FORMATTING: When you use the lookup tool, DO NOT print raw markdown tables. Instead, summarize the bookings line by line. Separate each booking with a double newline so they appear on completely separate lines.
8. CRITICAL: NEVER hallucinate, guess, or use placeholder data (e.g. "unknown", "N/A", fake emails like name@domain.com, or fake phone numbers) for tool arguments. If the user hasn't explicitly told you their contact info, you MUST ask for it.
9. Keep your responses concise, professional, and friendly.

Always think step-by-step. If you use a tool, explain the outcome to the user."""

# Create the LangGraph Agent
agent_executor = create_react_agent(llm, tools)

# Global dictionary to act as a mock session store for chat memory
# In a real production app, this would be backed by Redis or Postgres
sessions = {}

import datetime

def handle_chat_with_agent(message: str, user_id: str) -> tuple[str, dict]:
    """
    Sends a user message to the LangGraph agent and returns the reply + UI card data if any.
    """
    if user_id not in sessions:
        # Initialize memory for this user with the system prompt
        current_date_str = datetime.date.today().strftime('%Y-%m-%d')
        dynamic_prompt = SYSTEM_PROMPT + f"\n\nCRITICAL CONTEXT: The current date today is {current_date_str}. If the user says 'tomorrow', 'next week', or uses any relative dates, you MUST calculate the exact YYYY-MM-DD date based on today's date before calling the create_booking tool."
        sessions[user_id] = [SystemMessage(content=dynamic_prompt)]
    
    # Add the new user message
    sessions[user_id].append(("user", message))
    
    # --- TOKEN MINIMIZATION: SLIDING WINDOW MEMORY ---
    # To save massive amounts of tokens, we only keep the last 6 messages
    # (plus the System Message at index 0). We delete the older context.
    MAX_MESSAGES = 7 # 1 System + 6 Chat History
    if len(sessions[user_id]) > MAX_MESSAGES:
        sessions[user_id] = [sessions[user_id][0]] + sessions[user_id][-(MAX_MESSAGES-1):]
        
    # Run the agent
    response = agent_executor.invoke({"messages": sessions[user_id]})
    
    # Extract the agent's final text reply
    final_reply_msg = response["messages"][-1]
    sessions[user_id].append(final_reply_msg)
    reply_text = final_reply_msg.content
    
    # Check if a tool was called and if it returned a UI card
    ui_card_data = None
    if len(response["messages"]) >= 3:
        # Look for ToolMessages in recent history
        for msg in reversed(response["messages"]):
            if msg.type == "tool":
                try:
                    tool_result = json.loads(msg.content)
                    if "ui_card" in tool_result:
                        ui_card_data = {"data": tool_result["ui_card"]}
                        break
                except Exception:
                    pass

    return reply_text, ui_card_data
