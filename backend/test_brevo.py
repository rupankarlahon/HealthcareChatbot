import os
import json
import urllib.request
from urllib.error import HTTPError
from dotenv import load_dotenv

load_dotenv()

def test_brevo():
    brevo_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("GMAIL_ADDRESS")
    
    if not brevo_key:
        print("❌ Error: BREVO_API_KEY is not set in your .env file!")
        print("Please add it to backend/.env and try again.")
        return
        
    if not sender_email:
        print("❌ Error: GMAIL_ADDRESS is not set in your .env file!")
        return

    print("Testing Brevo API...")
    print(f"API Key: {brevo_key[:5]}...{brevo_key[-4:]}")
    print(f"Sender Email: {sender_email}")
    
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": brevo_key,
        "content-type": "application/json"
    }
    
    data = {
        "sender": {"name": "HealBridge Test", "email": sender_email},
        "to": [{"email": sender_email}], # Sending to yourself to test
        "subject": "Brevo API Test",
        "htmlContent": "<html><body><h1>It works!</h1></body></html>"
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    try:
        urllib.request.urlopen(req)
        print("✅ SUCCESS! The email was sent successfully.")
        print("Check your inbox (or spam folder)!")
    except HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        print("Response from Brevo:")
        print(e.read().decode())
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

if __name__ == "__main__":
    test_brevo()
