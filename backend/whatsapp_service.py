import os
import requests

def send_whatsapp_receipt(phone_number: str, booking_id: int, booking_type: str, details: str):
    """
    Sends an automated WhatsApp receipt via the Meta Cloud API.
    """
    token = os.getenv("META_WHATSAPP_TOKEN")
    phone_id = os.getenv("META_PHONE_NUMBER_ID")
    
    if not token or not phone_id:
        print(f"Warning: Meta WhatsApp credentials missing! Simulated sending receipt to {phone_number}")
        print(f"SIMULATED WHATSAPP RECEIPT -> To: {phone_number} | ID: {booking_id} | Service: {booking_type} | Details: {details}")
        return True

    # Sanitize phone number (remove spaces, +, etc.)
    safe_phone = "".join(filter(str.isdigit, phone_number))
    
    # Automatically append Indian country code if missing
    if len(safe_phone) == 10:
        safe_phone = "91" + safe_phone

    url = f"https://graph.facebook.com/v17.0/{phone_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # In a real app, this should match an approved WhatsApp message template.
    payload = {
        "messaging_product": "whatsapp",
        "to": safe_phone,
        "type": "template",
        "template": {
            "name": "order_confirmation",
            "language": {
                "code": "en"
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": str(booking_id)},
                        {"type": "text", "text": booking_type},
                        {"type": "text", "text": details}
                    ]
                }
            ]
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print(f"Success: WhatsApp receipt sent successfully to {safe_phone}")
        return True
    except Exception as e:
        print(f"Error: Failed to send WhatsApp message: {e}")
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"Meta API Response: {response.text}")
        return False
