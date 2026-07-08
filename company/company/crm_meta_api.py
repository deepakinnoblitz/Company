import frappe
import json
import requests
from frappe.utils import now_datetime
from werkzeug.wrappers import Response


def get_logger():
    return frappe.logger("meta_lead_ads")


def _plain_response(text, status=200):
    """Return a plain-text werkzeug Response, bypassing Frappe's JSON wrapper."""
    resp = Response(text, status=status, mimetype="text/plain")
    return resp


@frappe.whitelist(allow_guest=True)
def webhook():
    logger = get_logger()

    try:
        settings = frappe.get_single("CRM Meta Integration Settings")
    except Exception:
        logger.error("CRM Meta Integration Settings not found.")
        raise frappe.exceptions.DoesNotExistError("CRM Meta Integration Settings not found. Please configure it in Frappe.")

    if not settings.enable_meta_integration:
        logger.warning("Meta Webhook request rejected: Integration is disabled in CRM Meta Integration Settings.")
        raise frappe.PermissionError("Integration Disabled")

    # 1. GET Request: Verification
    if frappe.request.method == "GET":
        mode = frappe.request.args.get("hub.mode")
        token = frappe.request.args.get("hub.verify_token")
        challenge = frappe.request.args.get("hub.challenge")

        try:
            expected_token = settings.get_password("verify_token")
        except Exception:
            expected_token = None

        # Must have a configured token; reject if unconfigured
        if mode == "subscribe" and token and expected_token and token == expected_token:
            logger.info("Meta Webhook verification successful.")
            return _plain_response(challenge or "")
        else:
            logger.warning(f"Meta Webhook verification failed. Token mismatch. Received: {token}")
            return _plain_response("Verification Failed", status=403)

    # 2. POST Request: Meta Lead Ads event
    elif frappe.request.method == "POST":
        if not settings.webhook_enabled:
            logger.warning("Meta Webhook POST event rejected: Webhook is disabled in settings.")
            return _plain_response("Webhook Disabled", status=403)

        try:
            payload_data = frappe.request.data.decode("utf-8") if isinstance(frappe.request.data, bytes) else frappe.request.data
            payload = json.loads(payload_data) if payload_data else {}
        except Exception as e:
            logger.error(f"Meta Webhook payload parsing error: {str(e)}")
            return _plain_response("Invalid Payload", status=400)

        logger.info(f"Meta Webhook event received. Payload: {json.dumps(payload)}")

        leadgen_id = None
        form_id = None
        page_id = None

        if payload.get("object") == "page":
            for entry in payload.get("entry", []):
                for change in entry.get("changes", []):
                    if change.get("field") == "leadgen":
                        value = change.get("value", {})
                        leadgen_id = value.get("leadgen_id")
                        form_id = value.get("form_id")
                        page_id = value.get("page_id")
                        break

        if leadgen_id:
            # Check if Form ID is in the subscribed forms list (if configured)
            if settings.form_ids:
                subscribed_forms = [f.strip() for f in settings.form_ids.split(",") if f.strip()]
                if subscribed_forms and form_id not in subscribed_forms:
                    logger.info(f"Meta event ignored: Form ID {form_id} is not in the subscribed list ({settings.form_ids}).")
                    return _plain_response("EVENT_RECEIVED")

            # Create log entry
            log_doc = frappe.get_doc({
                "doctype": "Meta Lead Log",
                "lead_id": leadgen_id,
                "form_id": form_id,
                "page_id": page_id,
                "raw_payload": json.dumps(payload, indent=4),
                "status": "Pending",
                "received_on": now_datetime()
            })
            log_doc.insert(ignore_permissions=True)
            frappe.db.commit()

            # Enqueue detail extraction background job
            frappe.enqueue(
                "company.company.crm_meta_api.process_meta_lead_log",
                queue="default",
                log_name=log_doc.name
            )
        else:
            logger.warning("Meta Webhook payload did not contain a valid leadgen_id.")

        return _plain_response("EVENT_RECEIVED")

    # Unsupported method
    return _plain_response("Method Not Allowed", status=405)


def process_meta_lead_log(log_name):
    """
    Retrieves lead details from Meta Graph API using leadgen_id,
    maps fields, runs duplicate checks, and creates or updates a Lead record.
    """
    logger = get_logger()
    logger.info(f"Processing Meta Lead Log: {log_name}")
    log = frappe.get_doc("Meta Lead Log", log_name)
    try:
        settings = frappe.get_single("CRM Meta Integration Settings")
        access_token = settings.get_password("access_token")

        if not access_token:
            raise ValueError("Meta Access Token is not configured in CRM Meta Integration Settings.")

        url = f"https://graph.facebook.com/v23.0/{log.lead_id}"
        headers = {"Authorization": f"Bearer {access_token}"}

        logger.info(f"Fetching leadgen ID {log.lead_id} from Graph API...")
        response = requests.get(url, headers=headers, timeout=15)

        lead_data = {}
        if response.status_code == 400 and log.lead_id == "444444444444":
            logger.info("Test Lead ID detected. Generating mock field data.")
            field_data = [
                {"name": "full_name", "values": ["John Doe (Test)"]},
                {"name": "email", "values": ["test_lead@example.com"]},
                {"name": "phone_number", "values": ["+15555550199"]},
                {"name": "company_name", "values": ["Test Company Ltd"]},
                {"name": "city", "values": ["San Francisco"]},
                {"name": "state", "values": ["California"]},
                {"name": "country", "values": ["US"]}
            ]
        elif response.status_code != 200:
            raise Exception(f"Facebook Graph API responded with status {response.status_code}: {response.text}")
        else:
            lead_data = response.json()
            logger.info(f"Successfully retrieved Leadgen data from Graph API: {json.dumps(lead_data)}")
            field_data = lead_data.get("field_data", [])

        lead_name = ""
        first_name = ""
        last_name = ""
        email = ""
        phone = ""
        company_name = ""
        city = ""
        state = ""
        country = ""
        custom_questions = []

        # Standard field identifiers in Meta Lead Ads
        for field in field_data:
            name = field.get("name")
            values = field.get("values", [])
            val = values[0] if values else ""

            if name == "full_name":
                lead_name = val
            elif name == "first_name":
                first_name = val
            elif name == "last_name":
                last_name = val
            elif name == "email":
                email = val
            elif name in ("phone", "phone_number"):
                phone = val
            elif name in ("company_name", "company"):
                company_name = val
            elif name == "city":
                city = val
            elif name == "state":
                state = val
            elif name == "country":
                country = val
            else:
                # Store any custom/unmatched questions
                custom_questions.append(f"{name}: {val}")

        # Construct full name if full_name wasn't explicitly present
        if not lead_name and (first_name or last_name):
            lead_name = f"{first_name} {last_name}".strip()
        if not lead_name:
            lead_name = f"Meta Lead {log.lead_id}"

        log.lead_name = lead_name
        log.email = email
        log.phone = phone

        # Format custom questions for Lead Remarks
        remarks_str = ""
        if custom_questions:
            remarks_str = "\n".join(custom_questions)

        # Duplicate Detection
        duplicate_lead = None
        if email:
            duplicate_lead = frappe.db.get_value("Lead", {"email": email}, "name")
        if not duplicate_lead and phone:
            duplicate_lead = frappe.db.get_value("Lead", {"phone_number": phone}, "name")

        if duplicate_lead:
            logger.info(f"Duplicate lead detected: {duplicate_lead}. Updating details...")
            lead_doc = frappe.get_doc("Lead", duplicate_lead)

            if lead_name and lead_doc.lead_name == f"Meta Lead {log.lead_id}":
                lead_doc.lead_name = lead_name
            if email:
                lead_doc.email = email
            if phone:
                lead_doc.phone_number = phone
            if company_name:
                lead_doc.company_name = company_name
            if city:
                lead_doc.city = city
            if state:
                lead_doc.state = state
            if country:
                lead_doc.country = country
            if remarks_str:
                lead_doc.remarks = f"{lead_doc.remarks or ''}\n\n[Meta Lead Ads Updates]:\n{remarks_str}".strip()

            lead_doc.save(ignore_permissions=True)
            log.created_lead = lead_doc.name
            logger.info(f"Existing Lead {duplicate_lead} successfully updated.")
        else:
            logger.info("No duplicate found. Creating a new Lead record...")
            lead_doc = frappe.get_doc({
                "doctype": "Lead",
                "lead_name": lead_name,
                "email": email,
                "phone_number": phone,
                "company_name": company_name,
                "city": city,
                "state": state,
                "country": country,
                "remarks": f"Source: Meta Lead Ads\n{remarks_str}".strip(),
                "leads_from": "Meta Lead Ads",
                "status": "Lead"
            })
            lead_doc.insert(ignore_permissions=True)
            log.created_lead = lead_doc.name
            logger.info(f"New Lead {lead_doc.name} successfully created.")

        log.status = "Success"
        log.error_message = ""

    except Exception as e:
        logger.error(f"Error processing Meta Lead Log {log_name}: {str(e)}")
        log.status = "Failed"
        log.error_message = frappe.get_traceback() or str(e)

    finally:
        log.save(ignore_permissions=True)
        frappe.db.commit()
