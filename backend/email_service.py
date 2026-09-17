import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

def send_booking_email(patient_name: str, booking_type: str, details: str, booking_id: int, email: str = None):
    """
    Sends an automated email via Gmail SMTP to both the patient and the company.
    """
    sender_email = os.getenv("GMAIL_ADDRESS")
    sender_password = os.getenv("GMAIL_APP_PASSWORD")
    company_email = os.getenv("COMPANY_EMAIL", sender_email) # Defaults to sending company copy to the sender itself

    if not sender_email or not sender_password:
        logger.warning("SMTP credentials not found in .env. Skipping email dispatch.")
        return False

    # 1. Create the Patient HTML Email Template
    patient_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-w-md mx-auto p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 style="color: #0f766e;">Booking Confirmed</h2>
          <p>Hi <strong>{patient_name}</strong>,</p>
          <p>Your booking for <strong>{booking_type}</strong> has been successfully confirmed!</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0f766e; margin: 20px 0;">
            <p style="margin: 0;"><strong>Booking ID:</strong> #{booking_id}</p>
            <p style="margin: 5px 0 0 0;"><strong>Details:</strong> {details}</p>
          </div>
          
          <p>Our team will reach out to you shortly via WhatsApp to confirm details.</p>
          <p>Best regards,<br>The HealBridge Team</p>
        </div>
      </body>
    </html>
    """

    # 2. Create the Company HTML Email Template
    company_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-w-md mx-auto p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 style="color: #1e3a8a;">New Booking Alert 🚨</h2>
          <p>A new patient has just booked a service via the AI Agent.</p>
          
          <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #1e3a8a; margin: 20px 0;">
            <p style="margin: 0;"><strong>Booking ID:</strong> #{booking_id}</p>
            <p style="margin: 5px 0 0 0;"><strong>Service:</strong> {booking_type}</p>
            <p style="margin: 5px 0 0 0;"><strong>Patient Name:</strong> {patient_name}</p>
            <p style="margin: 5px 0 0 0;"><strong>Patient Email:</strong> {email if email else 'Not Provided'}</p>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;" />
            <p style="margin: 0;"><strong>Details:</strong> {details}</p>
          </div>
          
          <p style="font-size: 12px; color: #666;">Generated automatically by HealBridge AI</p>
        </div>
      </body>
    </html>
    """

    try:
        is_patient_email = email and "@" in email
        
        brevo_key = os.getenv("BREVO_API_KEY")
        
        if brevo_key:
            # --- PRODUCTION MODE (Render via Brevo HTTP API) ---
            import json
            import urllib.request
            
            url = "https://api.brevo.com/v3/smtp/email"
            headers = {
                "accept": "application/json",
                "api-key": brevo_key,
                "content-type": "application/json"
            }
            
            # 1. Send to Company
            company_data = {
                "sender": {"name": "HealBridge Agent", "email": sender_email},
                "to": [{"email": company_email}],
                "subject": f"NEW BOOKING: {booking_type} for {patient_name}",
                "htmlContent": company_html
            }
            req_company = urllib.request.Request(url, data=json.dumps(company_data).encode("utf-8"), headers=headers, method="POST")
            urllib.request.urlopen(req_company)
            
            # 2. Send to Patient
            if is_patient_email:
                patient_data = {
                    "sender": {"name": "HealBridge", "email": sender_email},
                    "to": [{"email": email}],
                    "subject": f"Confirmation: {booking_type} for {patient_name}",
                    "htmlContent": patient_html
                }
                req_patient = urllib.request.Request(url, data=json.dumps(patient_data).encode("utf-8"), headers=headers, method="POST")
                urllib.request.urlopen(req_patient)
                
            logger.info(f"Emails sent successfully via Brevo HTTP API (Cloud Mode).")
            return True
            
        else:
            # --- LOCAL MODE (Local PC via Gmail SMTP) ---
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(sender_email, sender_password)
                
                msg_company = MIMEMultipart("alternative")
                msg_company["Subject"] = f"NEW BOOKING: {booking_type} for {patient_name}"
                msg_company["From"] = f"HealBridge Agent <{sender_email}>"
                msg_company["To"] = company_email
                msg_company.attach(MIMEText(company_html, "html"))
                server.sendmail(sender_email, [company_email], msg_company.as_string())
                
                if is_patient_email:
                    msg_patient = MIMEMultipart("alternative")
                    msg_patient["Subject"] = f"Confirmation: {booking_type} for {patient_name}"
                    msg_patient["From"] = f"HealBridge <{sender_email}>"
                    msg_patient["To"] = email
                    msg_patient.attach(MIMEText(patient_html, "html"))
                    server.sendmail(sender_email, [email], msg_patient.as_string())

            logger.info(f"Emails sent successfully via Gmail SMTP (Local Mode).")
            return True

    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False
