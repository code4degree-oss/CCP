"""
WhatsApp Cloud API Service — One-way message sending (receipts & form PDFs).
Uses Meta's Cloud API to upload media and send template messages.
"""
import io
import os
import logging
import requests
from xhtml2pdf import pisa

logger = logging.getLogger(__name__)

# ── Config from environment ─────────────────────────────────────
WHATSAPP_API_URL = "https://graph.facebook.com/v21.0"
PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
ACCESS_TOKEN = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
TEMPLATE_NAME = os.environ.get("WHATSAPP_TEMPLATE_NAME", "fee_receipt")


def is_configured() -> bool:
    """Check if WhatsApp credentials are present."""
    return bool(PHONE_NUMBER_ID and ACCESS_TOKEN and ACCESS_TOKEN != "PASTE_YOUR_PERMANENT_TOKEN_HERE")


def _headers():
    return {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
    }


# ── PDF Generation ──────────────────────────────────────────────

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


# ── WhatsApp Media Upload ───────────────────────────────────────

def upload_media(pdf_bytes: bytes, filename: str = "receipt.pdf") -> str:
    """
    Upload a PDF to WhatsApp's Media API.
    Returns the media_id for use in template messages.
    """
    url = f"{WHATSAPP_API_URL}/{PHONE_NUMBER_ID}/media"
    
    response = requests.post(
        url,
        headers=_headers(),
        files={
            "file": (filename, pdf_bytes, "application/pdf"),
        },
        data={
            "messaging_product": "whatsapp",
            "type": "application/pdf",
        },
    )
    
    if response.status_code != 200:
        logger.error(f"WhatsApp media upload failed: {response.status_code} {response.text}")
        raise ValueError(f"Failed to upload media to WhatsApp: {response.text}")
    
    media_id = response.json().get("id")
    if not media_id:
        raise ValueError("WhatsApp media upload returned no media ID")
    
    logger.info(f"WhatsApp media uploaded: {media_id}")
    return media_id


# ── Send Template Message ──────────────────────────────────────

def send_template_message(
    phone_number: str,
    media_id: str,
    template_params: list[str],
    template_name: str | None = None,
    language: str = "en",
) -> dict:
    """
    Send a template message with a document attachment via WhatsApp Cloud API.
    
    Args:
        phone_number: Recipient phone (e.g., "917058315935")
        media_id: The uploaded document's media_id
        template_params: List of template body parameters [student_name, course, amount]
        template_name: Override template name (defaults to env WHATSAPP_TEMPLATE_NAME)
        language: Template language code
    
    Returns:
        WhatsApp API response dict
    """
    url = f"{WHATSAPP_API_URL}/{PHONE_NUMBER_ID}/messages"
    
    tpl_name = template_name or TEMPLATE_NAME
    
    payload = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "template",
        "template": {
            "name": tpl_name,
            "language": {"code": language},
            "components": [
                {
                    "type": "header",
                    "parameters": [
                        {
                            "type": "document",
                            "document": {
                                "id": media_id,
                                "filename": "Fee_Receipt.pdf",
                            }
                        }
                    ]
                },
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": p} for p in template_params
                    ]
                }
            ]
        }
    }
    
    response = requests.post(
        url,
        headers={**_headers(), "Content-Type": "application/json"},
        json=payload,
    )
    
    if response.status_code not in (200, 201):
        logger.error(f"WhatsApp send failed: {response.status_code} {response.text}")
        raise ValueError(f"Failed to send WhatsApp message: {response.text}")
    
    result = response.json()
    logger.info(f"WhatsApp message sent: {result}")
    return result


# ── Send Simple Document (without template — for 24hr window) ──

def send_document_message(phone_number: str, media_id: str, caption: str = "") -> dict:
    """
    Send a document directly (only works within 24-hour customer-initiated window).
    Fallback if template isn't approved yet.
    """
    url = f"{WHATSAPP_API_URL}/{PHONE_NUMBER_ID}/messages"
    
    payload = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "document",
        "document": {
            "id": media_id,
            "caption": caption or "Fee Receipt — Chanakya Career Point",
            "filename": "Fee_Receipt.pdf",
        }
    }
    
    response = requests.post(
        url,
        headers={**_headers(), "Content-Type": "application/json"},
        json=payload,
    )
    
    if response.status_code not in (200, 201):
        logger.error(f"WhatsApp document send failed: {response.status_code} {response.text}")
        raise ValueError(f"Failed to send document: {response.text}")
    
    return response.json()


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
    Complete flow: HTML → PDF → Upload → Send via template.
    
    Returns the WhatsApp API response with message IDs.
    """
    if not is_configured():
        raise ValueError(
            "WhatsApp API is not configured. Please set WHATSAPP_PHONE_NUMBER_ID "
            "and WHATSAPP_ACCESS_TOKEN in your .env file."
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
    
    # Step 2: Upload PDF to WhatsApp Media API
    media_id = upload_media(pdf_bytes, filename)
    
    # Step 3: Send via template message
    try:
        result = send_template_message(
            phone_number=phone,
            media_id=media_id,
            template_params=[student_name, course_name, amount],
        )
    except ValueError:
        # Template might not be approved yet — try direct document send as fallback
        logger.warning("Template send failed, attempting direct document send")
        result = send_document_message(
            phone_number=phone,
            media_id=media_id,
            caption=f"Fee Receipt for {student_name} — {course_name} — ₹{amount} — Chanakya Career Point",
        )
    
    return result
