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
    # Replace ₹ with Rs. — xhtml2pdf's default fonts don't support the rupee symbol
    html_content = html_content.replace('₹', 'Rs.')
    
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


# ── Server-side Receipt HTML Builder ──────────────────────────

def build_receipt_html(
    receipt_no: str,
    student_name: str,
    student_mobile: str,
    parent_mobile: str,
    course_name: str,
    course_fee: float,
    amount_paid: float,
    cumulative_paid: float,
    balance: float,
    payment_mode: str,
    reference_no: str,
    branch_name: str,
    branch_address: str,
    date_str: str,
    filled_by: str = "Coordinator",
    payment_index: int = 1,
    total_payments: int = 1,
) -> str:
    """
    Build receipt HTML server-side using table-based layout (xhtml2pdf compatible).
    Matches the frontend buildSingleReceiptHTML() output exactly.
    """
    from datetime import datetime as _dt

    now = _dt.now()
    date_time_str = now.strftime("%d/%m/%y, %I:%M %p")
    has_multiple = total_payments > 1
    show_cumulative = has_multiple and cumulative_paid != amount_paid
    page_label = f"{payment_index}/{total_payments}" if has_multiple else "1/1"

    def _fmt(val):
        try:
            return f"₹{int(val):,}"
        except Exception:
            return f"₹{val}"

    html = '<div style="font-family:\'Segoe UI\',\'Helvetica Neue\',Arial,sans-serif;color:#111827">'

    # ── Top meta bar ──
    html += f'''<table style="width:100%;border:none;margin-bottom:10px"><tr>
    <td style="text-align:left;font-size:9px;color:#6b7280;padding:0">{date_time_str}</td>
    <td style="text-align:right;font-size:9px;color:#6b7280;padding:0">CCP — Admission Management System</td>
    </tr></table>'''

    # ── Header: Logo + Title ──
    html += '''<table style="width:100%;border:none;margin-bottom:6px"><tr>
    <td style="text-align:center;padding:0">
      <table style="margin:0 auto;border:none"><tr>
        <td style="padding:0 10px 0 0;vertical-align:middle"><img src="/LOGO CCP.png" alt="CCP" style="width:50px;height:50px;object-fit:contain" /></td>
        <td style="padding:0;vertical-align:middle"><h1 style="margin:0;font-size:22px;font-weight:900;color:#1e3a5f;font-style:italic;font-family:Georgia,serif">Chanakya Career Point | Fees Receipt</h1></td>
      </tr></table>
    </td>
    </tr></table>'''

    # ── Branch address bar ──
    if branch_address:
        html += f'''<div style="border-top:1px solid #d1d5db;border-bottom:1px solid #d1d5db;padding:6px 0;margin-bottom:4px;text-align:center">
        <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f"><span style="font-weight:800">{branch_name or "CCP"} Branch : </span>{branch_address}</p>
        </div>'''

    # ── Receipt info ──
    html += '<div style="border-top:2px solid #1e3a5f;padding-top:12px;margin-bottom:8px">'

    # Receipt No
    html += f'''<table style="width:100%;border:none;margin-bottom:8px"><tr>
    <td style="padding:0;text-align:left"><p style="margin:0;font-size:13px;color:#111827"><span style="font-weight:800">Receipt No : </span><span style="font-family:monospace;font-weight:700;color:#1e40af">{receipt_no}</span></p></td>'''
    if has_multiple:
        html += f'<td style="padding:0;text-align:right"><span style="font-size:10px;font-weight:700;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:4px;border:1px solid #e5e7eb">Payment {payment_index} of {total_payments}</span></td>'
    html += '</tr></table>'

    # Name
    html += f'<p style="margin:0 0 8px;font-size:13px;color:#111827"><span style="font-weight:800">Name : </span><span style="text-transform:uppercase;font-weight:600">{student_name}</span></p>'

    # Course + Student Mo
    html += f'''<table style="width:100%;border:none;margin-bottom:8px"><tr>
    <td style="padding:0;text-align:left"><p style="margin:0;font-size:13px;color:#111827"><span style="font-weight:800">Course: </span><span style="font-weight:600">{course_name}</span></p></td>
    <td style="padding:0;text-align:right"><p style="margin:0;font-size:13px;color:#111827"><span style="font-weight:800">Student Mo: </span><span style="font-weight:600">{student_mobile}</span></p></td>
    </tr></table>'''

    # Parent Mo + Date
    html += f'''<table style="width:100%;border:none;margin-bottom:4px"><tr>
    <td style="padding:0;text-align:left"><p style="margin:0;font-size:13px;color:#111827"><span style="font-weight:800">Parent&#39;s Mo: </span><span style="font-weight:600">{parent_mobile or "—"}</span></p></td>
    <td style="padding:0;text-align:right"><p style="margin:0;font-size:13px;color:#111827"><span style="font-weight:800">Date : </span><span style="font-weight:600">{date_str}</span></p></td>
    </tr></table>'''

    html += '</div>'

    # ── Fee table ──
    cs = 'padding:8px 12px;font-size:12px;border:1px solid #374151;text-align:center'
    ths = f'{cs};font-weight:800;color:#111827'
    sr = 1
    html += f'''<table style="width:100%;border-collapse:collapse;border:1.5px solid #374151;margin:14px 0 18px">
    <thead><tr style="background:#f3f4f6">
      <th style="{ths};width:15%">Sr No.</th><th style="{ths};width:55%">Particulars</th><th style="{ths};width:30%">Amount</th>
    </tr></thead><tbody>'''
    html += f'<tr><td style="{cs};color:#374151">{sr}</td><td style="{cs};color:#374151">Total Course Fees</td><td style="{cs};color:#374151;font-weight:600">{_fmt(course_fee)}</td></tr>'
    sr += 1
    received_label = f"Received (Payment {payment_index})" if has_multiple else "Received Fees"
    html += f'<tr><td style="{cs};color:#374151">{sr}</td><td style="{cs};color:#374151">{received_label}</td><td style="{cs};color:#059669;font-weight:700">{_fmt(amount_paid)}</td></tr>'
    sr += 1
    if show_cumulative:
        html += f'<tr><td style="{cs};color:#374151">{sr}</td><td style="{cs};color:#374151">Total Paid Till Date</td><td style="{cs};color:#059669;font-weight:700">{_fmt(cumulative_paid)}</td></tr>'
        sr += 1
    bal_color = '#dc2626' if balance > 0 else '#059669'
    html += f'<tr><td style="{cs};color:#374151">{sr}</td><td style="{cs};color:#374151">Balance Fees</td><td style="{cs};color:{bal_color};font-weight:700">{_fmt(balance)}</td></tr>'
    html += '</tbody></table>'

    # ── Payment mode ──
    if payment_mode and payment_mode != '—':
        html += f'<p style="margin:0 0 10px;font-size:12px;color:#374151"><span style="font-weight:800">Payment Mode:</span> {payment_mode}'
        if reference_no:
            html += f'&nbsp;&nbsp;&nbsp;&nbsp;<span style="font-weight:800">Ref/TXN:</span> {reference_no}'
        html += '</p>'

    # ── Terms & Conditions ──
    html += '''<div style="margin-top:10px;border-top:1.5px solid #1e3a5f;padding-top:6px">
    <h3 style="font-size:9px;font-weight:900;color:#dc2626;text-align:center;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.04em">Terms &amp; Conditions: Chanakya Career Point Counselling Program</h3>
    <p style="font-size:7px;color:#6b7280;text-align:center;margin:0 0 5px">Before participating in the counselling services, it is mandatory to carefully read and fully accept the following terms and conditions.</p>
    <table style="width:100%;border:none;font-size:7.5px;line-height:1.35;color:#374151"><tr>
      <td style="vertical-align:top;width:50%;padding:0 7px 0 0">
        <p style="font-size:8px;font-weight:800;color:#1e3a5f;margin:3px 0 1px">1. Counselling Fee Policy</p>
        <ul style="padding-left:12px;margin:0 0 2px"><li style="margin:0 0 1px">The counselling fee must be paid in a single installment and will remain valid for the entire duration of the program.</li><li style="margin:0 0 1px">The counselling process will only commence after the fee has been paid.</li><li style="margin:0 0 1px">The fee covers guidance services only; admission is not guaranteed.</li></ul>
        <p style="font-size:8px;font-weight:800;color:#1e3a5f;margin:3px 0 1px">2. Strict No-Refund Policy</p>
        <ul style="padding-left:12px;margin:0 0 2px"><li style="margin:0 0 1px">Counselling fees paid will not be refunded under any circumstances or for any reason.</li><li style="margin:0 0 1px">No refunds if the student/parent leaves midway, remains absent, expresses dissatisfaction, or discontinues for personal reasons.</li><li style="margin:0 0 1px">Fees will not be refunded if the student fails to secure admission, changes college/course, or due to government policy changes.</li><li style="margin:0 0 1px">Fee transfers, credits, or adjustments for future sessions are not permitted.</li></ul>
        <p style="font-size:8px;font-weight:800;color:#1e3a5f;margin:3px 0 1px">3. Schedule and Attendance</p>
        <ul style="padding-left:12px;margin:0 0 2px"><li style="margin:0 0 1px">All counselling sessions will be organized according to a fixed schedule.</li><li style="margin:0 0 1px">Students and parents must strictly adhere to the scheduled timings.</li><li style="margin:0 0 1px">The institution assumes no responsibility if a participant arrives late, is absent, or violates the schedule.</li></ul>
        <p style="font-size:8px;font-weight:800;color:#1e3a5f;margin:3px 0 1px">4. Official Communication</p>
        <ul style="padding-left:12px;margin:0 0 2px"><li style="margin:0 0 1px">It is mandatory to follow official instructions via WhatsApp groups, email, or official calling channels.</li><li style="margin:0 0 1px">Information from unofficial sources should not be relied upon. The institution&#39;s official directives are final and legally binding.</li></ul>
      </td>
      <td style="vertical-align:top;width:50%;padding:0 0 0 7px">
        <p style="font-size:8px;font-weight:800;color:#1e3a5f;margin:3px 0 1px">5. Office Visit Policy</p>
        <ul style="padding-left:12px;margin:0 0 2px"><li style="margin:0 0 1px">Office visits are permitted by prior appointment only. Unnecessary, frequent, or unscheduled visits should be avoided.</li><li style="margin:0 0 1px">Unauthorized interference in the counselling process will not be tolerated.</li></ul>
        <p style="font-size:8px;font-weight:800;color:#1e3a5f;margin:3px 0 1px">6. Discipline and Cooperation</p>
        <ul style="padding-left:12px;margin:0 0 2px"><li style="margin:0 0 1px">Students and parents must comply with all institutional rules.</li><li style="margin:0 0 1px">The institution reserves the right to immediately cancel services in cases of misconduct, disputes, or breach of discipline.</li></ul>
        <p style="font-size:8px;font-weight:800;color:#1e3a5f;margin:3px 0 1px">7. Limitation of Liability</p>
        <ul style="padding-left:12px;margin:0 0 2px"><li style="margin:0 0 1px">Chanakya Career Point provides guidance services only; it does not provide a legal guarantee of admission.</li><li style="margin:0 0 1px">The institution is not responsible if a student does not secure admission or achieve expected results.</li></ul>
        <p style="font-size:8px;font-weight:800;color:#1e3a5f;margin:3px 0 1px">8. Right to Final Decision</p>
        <ul style="padding-left:12px;margin:0 0 2px"><li style="margin:0 0 1px">The decision of Chanakya Career Point regarding the counselling process, policies, and related matters shall be final and binding.</li></ul>
      </td>
    </tr></table>
    </div>'''

    # ── Declaration + Signatures ──
    html += f'''<div style="margin-top:6px;border-top:1px solid #374151;padding-top:5px">
    <p style="font-size:8px;font-weight:700;color:#111827;margin:0 0 5px;text-align:center">I have carefully read the above terms and conditions, understood them fully, and accept them without any objection.</p>
    <table style="width:100%;border:none;margin-top:30px"><tr>
      <td style="width:33%;text-align:center;padding:0 8px;vertical-align:bottom"><div style="border-top:1px solid #374151;padding-top:4px"><p style="margin:0;font-size:9px;font-weight:800;color:#111827">Parent Sign</p></div></td>
      <td style="width:33%;text-align:center;padding:0 8px;vertical-align:bottom"><div style="border-top:1px solid #374151;padding-top:4px"><p style="margin:0;font-size:9px;font-weight:800;color:#111827">Student Sign</p></div></td>
      <td style="width:33%;text-align:center;padding:0 8px;vertical-align:bottom"><div style="border-top:1px solid #374151;padding-top:4px"><p style="margin:0 0 1px;font-size:9px;font-weight:800;color:#111827">Test Branch Admin</p><p style="margin:0;font-size:7px;font-weight:600;color:#6b7280">Coordinator Sign</p></div></td>
    </tr></table>
    </div>'''

    # ── Footer ──
    gen_str = now.strftime("%d %b %Y, %I:%M %p")
    html += f'''<table style="width:100%;border:none;margin-top:5px;padding-top:3px;border-top:1px solid #e5e7eb"><tr>
    <td style="text-align:left;font-size:7px;color:#9ca3af;padding:3px 0 0">Generated on: {gen_str} &nbsp;|&nbsp; This is a computer-generated receipt.</td>
    <td style="text-align:right;font-size:9px;color:#6b7280;padding:3px 0 0">{page_label}</td>
    </tr></table>'''

    html += '''<table style="width:100%;border:none;margin-top:4px"><tr>
    <td style="text-align:left;font-size:8px;color:#2563eb;padding:0"><a href="https://crm.chanakyacp.com/#admissions" style="color:#2563eb;text-decoration:none">https://crm.chanakyacp.com/#admissions</a></td>
    </tr></table>'''

    html += '</div>'
    return html
