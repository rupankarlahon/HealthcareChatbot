import os
import requests
import dotenv

dotenv.load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

models_to_test = [
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "allam-2-7b"
]

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get the weather",
        "parameters": {
            "type": "object",
            "properties": {"location": {"type": "string"}},
            "required": ["location"]
        }
    }
}]

for model in models_to_test:
    data = {
        "model": model,
        "messages": [{"role": "user", "content": "What is the weather in London?"}],
        "tools": tools
    }
    resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data)
    if resp.status_code == 200:
        print(f"✅ {model} SUPPORTS tool calling!")
    else:
        print(f"❌ {model} failed: {resp.json().get('error', {}).get('message')}")
