import os
import requests
import dotenv

dotenv.load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

headers = {
    "Authorization": f"Bearer {api_key}"
}
response = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
models = response.json()
print("AVAILABLE GROQ MODELS:")
for model in models.get("data", []):
    print(f"- {model['id']}")
