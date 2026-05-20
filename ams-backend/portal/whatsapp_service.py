"""
WhatsApp API Service — One-way message sending (receipts & form PDFs).
Uses MSG91's WhatsApp API to send template messages with public document URLs.
"""
import io
import os
import uuid
import time
import logging
import requests
import threading
from django.conf import settings
from xhtml2pdf import pisa

logger = logging.getLogger(__name__)

# ── Config from environment ─────────────────────────────────────
MSG91_API_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/"
MSG91_AUTH_KEY = os.environ.get("MSG91_AUTH_KEY", "")
INTEGRATED_NUMBER = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "") # We can reuse this variable for MSG91 integrated number
TEMPLATE_NAME = os.environ.get("WHATSAPP_TEMPLATE_NAME", "fee_receipt")

# The public domain where the backend is hosted
APP_PUBLIC_DOMAIN = os.environ.get("APP_PUBLIC_DOMAIN", "https://ccp.dybusinesssolutions.com")


def is_configured() -> bool:
    """Check if WhatsApp MSG91 credentials are present."""
    return bool(MSG91_AUTH_KEY and INTEGRATED_NUMBER)


def _headers():
    return {
        "authkey": MSG91_AUTH_KEY,
        "content-type": "application/json",
        "accept": "application/json"
    }


# ── PDF Generation & Local Storage ──────────────────────────────

def html_to_pdf(html_content: str) -> bytes:
    """Convert HTML string to PDF bytes using xhtml2pdf."""
    # Wrap in a full HTML document with proper encoding
    full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {{ size: A4; margin: 1cm; }}
        body {{ font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; color: #111827; }}
        img {{ max-width: 56px; max-height: 56px; }}
    </style>
</head>
<body>
{html_content}
</body>
</html>"""
    
    result = io.BytesIO()
    pisa_status = pisa.CreatePDF(io.StringIO(full_html), dest=result)
    
    if pisa_status.err:
        logger.error(f"xhtml2pdf conversion error: {pisa_status.err}")
        raise ValueError("Failed to generate PDF from receipt HTML")
    
    return result.getvalue()


def _delete_file_after_delay(filepath: str, delay_seconds: int = 300):
    """Deletes a file after a specified delay to save storage."""
    def delete_task():
        time.sleep(delay_seconds)
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"Auto-deleted temporary PDF: {filepath}")
        except Exception as e:
            logger.error(f"Failed to auto-delete temporary PDF {filepath}: {e}")
            
    thread = threading.Thread(target=delete_task)
    thread.daemon = True
    thread.start()


def save_temp_pdf_and_get_url(pdf_bytes: bytes, filename: str) -> str:
    """
    Saves the PDF to the media directory and returns its public URL.
    Schedules the file for auto-deletion after 5 minutes.
    """
    # Ensure receipts directory exists
    receipts_dir = os.path.join(settings.MEDIA_ROOT, 'receipts')
    os.makedirs(receipts_dir, exist_ok=True)
    
    # Generate unique filename to avoid collisions
    unique_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
    filepath = os.path.join(receipts_dir, unique_filename)
    
    # Write file
    with open(filepath, 'wb') as f:
        f.write(pdf_bytes)
        
    logger.info(f"Saved temporary PDF for WhatsApp: {filepath}")
    
    # Schedule deletion in 5 minutes (300 seconds) - enough time for MSG91 to fetch it
    _delete_file_after_delay(filepath, 300)
    
    # Construct public URL
    # Clean up domain slashes
    domain = APP_PUBLIC_DOMAIN.rstrip('/')
    public_url = f"{domain}/media/receipts/{unique_filename}"
    return public_url


# ── Send Template Message via MSG91 ────────────────────────────

def send_template_message(
    phone_number: str,
    document_url: str,
    template_params: list[str],
    template_name: str | None = None,
    filename: str = "Fee_Receipt.pdf"
) -> dict:
    """
    Send a template message with a document attachment via MSG91 WhatsApp API.
    
    Args:
        phone_number: Recipient phone (e.g., "917058315935")
        document_url: The public URL of the uploaded document
        template_params: List of template body parameters [student_name, course, amount]
        template_name: Override template name (defaults to env WHATSAPP_TEMPLATE_NAME)
        filename: Name of the file shown in WhatsApp
    
    Returns:
        WhatsApp API response dict
    """
    tpl_name = template_name or TEMPLATE_NAME
    
    # Base payload matching the exact MSG91 bulk API requirements
    payload = {
        "integrated_number": INTEGRATED_NUMBER,
        "content_type": "template",
        "payload": {
            "messaging_product": "whatsapp",
            "type": "template",
            "template": {
                "name": tpl_name,
                "language": {
                    "code": "en",
                    "policy": "deterministic"
                },
                # Defaulting to the namespace provided in the MSG91 dashboard
                "namespace": os.environ.get("WHATSAPP_TEMPLATE_NAMESPACE", "6978e867_1e6a_47c3_9f58_dc0c21c5a464"),
                "to_and_components": [
                    {
                        "to": [
                            phone_number
                        ],
                        "components": {
                            "header_1": {
                                "filename": filename,
                                "type": "document",
                                "value": document_url
                            }
                        }
                    }
                ]
            }
        }
    }
    
    # Dynamically map the body parameters to body_1, body_2, etc.
    for i, param_value in enumerate(template_params, start=1):
        payload["payload"]["template"]["to_and_components"][0]["components"][f"body_{i}"] = {
            "type": "text",
            "value": str(param_value)
        }
    
    response = requests.post(
        MSG91_API_URL,
        headers=_headers(),
        json=payload,
    )
    
    if response.status_code not in (200, 201, 202):
        logger.error(f"MSG91 WhatsApp send failed: {response.status_code} {response.text}")
        raise ValueError(f"Failed to send WhatsApp message via MSG91: {response.text}")
    
    result = response.json()
    # MSG91 usually returns "hasError": False for success
    if result.get("hasError"):
        logger.error(f"MSG91 WhatsApp send returned error: {result}")
        raise ValueError(f"MSG91 Error: {result.get('message')}")
        
    logger.info(f"WhatsApp message sent via MSG91: {result}")
    return result


# ── Convenience: Full Receipt Send Flow ────────────────────────

def send_receipt_pdf(
    phone_number: str,
    receipt_html: str,
    student_name: str = "",
    course_name: str = "",
    amount: str = "",
    filename: str = "Fee_Receipt.pdf",
) -> dict:
    """
    Complete flow: HTML → PDF → Save Local (Temp) → Send via MSG91.
    
    Returns the MSG91 API response.
    """
    if not is_configured():
        raise ValueError(
            "MSG91 API is not configured. Please set WHATSAPP_PHONE_NUMBER_ID (integrated number) "
            "and MSG91_AUTH_KEY in your .env file."
        )
    
    # Normalize phone number (remove spaces, ensure country code)
    phone = phone_number.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        phone = phone[1:]
    if not phone.startswith("91") and len(phone) == 10:
        phone = "91" + phone
    
    # Step 1: Convert HTML to PDF
    pdf_bytes = html_to_pdf(receipt_html)
    logger.info(f"Generated PDF: {len(pdf_bytes)} bytes")
    
    # Step 2: Save PDF locally and get public URL
    # The file will be auto-deleted after 5 minutes
    document_url = save_temp_pdf_and_get_url(pdf_bytes, filename)
    
    # Step 3: Send via MSG91 template message
    try:
        result = send_template_message(
            phone_number=phone,
            document_url=document_url,
            # Fixing the sentence structure for the specific MSG91 template:
            # "Thank you for your purchase of {{1}} from {{2}}. Your {{3}} PDF is attached."
            template_params=[
                course_name, 
                "Chanakya Career Point", 
                f"₹{amount} fee receipt"
            ],
            filename=filename
        )
    except Exception as e:
        logger.error(f"Failed to send receipt via MSG91: {e}")
        raise
        
    return result
