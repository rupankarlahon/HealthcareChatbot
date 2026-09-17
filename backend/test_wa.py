import os
from dotenv import load_dotenv
import requests

load_dotenv()

token = os.getenv("META_WHATSAPP_TOKEN")
phone_id = os.getenv("META_PHONE_NUMBER_ID")

print("Token:", token[:10] if token else "None", "...")
print("Phone ID:", phone_id)

url = f"https://graph.facebook.com/v17.0/{phone_id}/messages"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

payload = {
    "messaging_product": "whatsapp",
    "to": "916002323454", # Using the user's test number from the log
    "type": "template",
    "template": {
        "name": "booking_receipt",
        "language": {
            "code": "en"
        },
        "components": [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": "TEST_ID_123"},
                    {"type": "text", "text": "Test Service"},
                    {"type": "text", "text": "Test Details"}
                ]
            }
        ]
    }
}

print("Sending request to Meta API...")
response = requests.post(url, headers=headers, json=payload)
print("Status Code:", response.status_code)
print("Response:", response.text)
