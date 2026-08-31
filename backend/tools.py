from langchain_core.tools import tool
from pydantic import BaseModel, Field
from database import SessionLocal, Booking
from email_service import send_booking_email
import json

class BookingInput(BaseModel):
    booking_type: str = Field(default="", description="The type of service (e.g. 'Medicine Delivery', 'Lab Collection', 'Home Care Nurse')")
    patient_name: str = Field(default="", description="The first and last name of the patient")
    contact_info: str = Field(default="", description="The email or phone number of the patient")
    details: str = Field(default="", description="Additional details like date, address, or specific medicines requested")
    is_confirmed: bool = Field(default=False, description="Set to True ONLY if the user's VERY LAST message explicitly said 'Yes' or 'Confirmed' to your summary. If False, the system will block the booking.")

@tool("create_booking", args_schema=BookingInput)
def create_booking(booking_type: str, patient_name: str, contact_info: str, details: str, is_confirmed: bool) -> str:
    """
    Creates a new healthcare booking in the database.
    Call this tool ONLY when you have gathered the patient's name, contact info, and booking details.
    """
    print(f"DEBUG: create_booking called with type={booking_type}, name={patient_name}, contact={contact_info}, details={details}, confirmed={is_confirmed}")
    
    if not is_confirmed:
        return json.dumps({"success": False, "message": "Error: You cannot create the booking yet. You must first summarize the details and ask the user 'Does this look correct? Reply Yes to confirm.'"})
    
    invalid_placeholders = ["unknown", "n/a", "none", "", "not provided", "tbd", "placeholder", "null", "user's name", "your name", "full name"]
    
    import re
    def contains_brackets(text: str) -> bool:
        return bool(re.search(r'[\[\]\<\>\{\}]', text))
    
    if not booking_type or booking_type.lower().strip() in invalid_placeholders or contains_brackets(booking_type):
        return json.dumps({"success": False, "message": "Error: You must determine the exact booking_type (e.g., 'Medicine Delivery', 'Lab Collection') before calling. Do not use placeholders like [type]."})
    
    if not patient_name or patient_name.lower().strip() in invalid_placeholders or len(patient_name) < 2 or contains_brackets(patient_name):
        return json.dumps({"success": False, "message": "Error: You must ask the user for their real patient_name before calling this tool. Do not use placeholders like [user's name]."})
        
    if not contact_info or contact_info.lower().strip() in invalid_placeholders or len(contact_info) < 4 or contains_brackets(contact_info):
        return json.dumps({"success": False, "message": "Error: You must ask the user for their real contact_info before calling this tool. Do not use placeholders like [phone number]."})
        
    if not details or details.lower().strip() in invalid_placeholders or len(details) < 4 or contains_brackets(details):
        return json.dumps({"success": False, "message": "Error: You must ask the user for specific booking details before calling this tool. Do not use placeholders."})

    db = SessionLocal()
    try:
        new_booking = Booking(
            booking_type=booking_type,
            patient_name=patient_name,
            contact_info=contact_info,
            details=details,
            status="Confirmed"
        )
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        
        # Dual-write to Excel
        try:
            import os
            from openpyxl import Workbook, load_workbook
            excel_path = "bookings.xlsx"
            if not os.path.exists(excel_path):
                wb = Workbook()
                ws = wb.active
                ws.title = "Bookings"
                ws.append(["ID", "Date", "Service", "Patient Name", "Contact Info", "Details", "Status"])
            else:
                wb = load_workbook(excel_path)
                ws = wb.active
            
            ws.append([
                new_booking.id,
                new_booking.created_at.strftime("%Y-%m-%d %H:%M:%S") if new_booking.created_at else "",
                new_booking.booking_type,
                new_booking.patient_name,
                new_booking.contact_info,
                new_booking.details,
                new_booking.status
            ])
            wb.save(excel_path)
        except Exception as excel_err:
            print(f"Warning: Failed to save to Excel: {excel_err}")
        
        # Dispatch Gmail SMTP Notification
        # The email_service will intelligently send to both Patient and Company if contact_info is an email,
        # otherwise it will send ONLY to the Company if contact_info is a phone number.
        send_booking_email(
            patient_name=patient_name,
            contact_info=contact_info.strip(),
            booking_type=booking_type,
            details=details,
            booking_id=new_booking.id
        )
        
        # We return a JSON string so the Agent can pass the exact data back to FastAPI for the UI card
        result = {
            "success": True,
            "booking_id": new_booking.id,
            "message": f"Successfully created {booking_type} for {patient_name}.",
            "ui_card": {
                "service": booking_type,
                "patient": patient_name,
                "status": "Confirmed"
            }
        }
        return json.dumps(result)
    except Exception as e:
        db.rollback()
        return json.dumps({"success": False, "message": f"Database error: {str(e)}"})
    finally:
        db.close()

class LookupInput(BaseModel):
    contact_info: str = Field(default="", description="The email or phone number of the patient to search for")

@tool("lookup_booking", args_schema=LookupInput)
def lookup_booking(contact_info: str) -> str:
    """
    Looks up existing bookings for a patient using their email or phone number.
    """
    invalid_placeholders = ["unknown", "n/a", "none", "", "not provided", "tbd", "placeholder", "null"]
    
    if not contact_info or contact_info.lower().strip() in invalid_placeholders or len(contact_info) < 4:
        return json.dumps({"success": False, "message": "Error: You must ask the user for their real contact info (email or phone) before calling this tool. Do not guess it."})
        
    db = SessionLocal()
    try:
        bookings = db.query(Booking).filter(Booking.contact_info.ilike(f"%{contact_info}%")).all()
        if not bookings:
            return json.dumps({"success": False, "message": "No bookings found for this contact info."})
        
        results = []
        for b in bookings:
            results.append({
                "id": b.id,
                "service": b.booking_type,
                "patient": b.patient_name,
                "contact": b.contact_info,
                "details": b.details,
                "date": b.created_at.strftime('%Y-%m-%d'),
                "status": b.status
            })
            
        return json.dumps({
            "success": True,
            "message": f"Found {len(bookings)} bookings.",
            "ui_card": {
                "type": "lookup",
                "bookings": results
            }
        })
    finally:
        db.close()
