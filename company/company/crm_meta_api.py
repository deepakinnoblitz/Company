# -*- coding: utf-8 -*-
# Copyright (c) 2026, Deepak and contributors
# For license information, please see license.txt

import frappe
import json
import hashlib
import hmac
import requests
from datetime import datetime
from frappe import _

# Set logger
def get_logger():
    return frappe.logger("crm_meta_api")

def _plain_response(body, status=200):
    frappe.response["type"] = "download"
    frappe.response["content_type"] = "text/plain"
    frappe.response["display_content_as"] = "inline"
    frappe.response["filename"] = "response.txt"
    frappe.response["filecontent"] = str(body)
    frappe.response["http_status_code"] = status
    return

@frappe.whitelist(allow_guest=True)
def webhook():
    """
    Unified Meta (Facebook Lead Ads) Webhook Endpoint.
    GET: Handles Webhook Verification.
    POST: Processes Lead Gen Webhook payloads asynchronously.
    """
    logger = get_logger()
    req = frappe.request
    
    # 1. GET Request: Verify Token challenge handshake
    if req.method == "GET":
        mode = frappe.request.args.get("hub.mode")
        token = frappe.request.args.get("hub.verify_token")
        challenge = frappe.request.args.get("hub.challenge")
        
        if mode == "subscribe" and token:
            # Check verify token across active configured Meta Developer Apps
            apps = frappe.get_all("CRM Meta App", filters={"is_active": 1}, fields=["name", "verify_token"])
            for app in apps:
                # Decrypt/retrieve password verify token
                app_doc = frappe.get_doc("CRM Meta App", app.name)
                saved_token = app_doc.get_password("verify_token")
                if saved_token == token:
                    logger.info(f"Webhook verified successfully for App: {app.name}")
                    return _plain_response(challenge, 200)
            
            logger.warning(f"Verification failed: invalid verify token '{token}'")
            return _plain_response("Verification Failed", 403)
            
        return _plain_response("Invalid Parameters", 400)

    # 2. POST Request: Receive Lead Ad Payload
    elif req.method == "POST":
        start_time = datetime.now()
        payload_bytes = req.get_data()
        payload_str = payload_bytes.decode("utf-8") if payload_bytes else ""
        
        # Extract X-Hub-Signature-256 signature from headers
        signature = req.headers.get("X-Hub-Signature-256")
        
        # Save raw Webhook Log immediately
        headers_dict = dict(req.headers)
        headers_str = json.dumps(headers_dict, indent=2)
        
        log_doc = frappe.get_doc({
            "doctype": "CRM Meta Webhook Log",
            "headers": headers_str,
            "payload": payload_str,
            "http_status": 200,
            "status": "Unverified"
        })
        log_doc.insert(ignore_permissions=True)
        frappe.db.commit()
        
        try:
            if not payload_str:
                raise ValueError("Empty request payload received")
            
            data = json.loads(payload_str)
            
            # Loop through entries to find form_id and app_id
            form_id = None
            for entry in data.get("entry", []):
                for change in entry.get("changes", []):
                    val = change.get("value", {})
                    if val.get("form_id"):
                        form_id = val.get("form_id")
                        break
            
            # Check signature if app signature validation is enabled
            app_name = None
            if form_id:
                app_name = frappe.db.get_value(
                    "CRM Meta Page",
                    {"name": frappe.db.get_value("CRM Meta Form", {"form_id": form_id}, "meta_page")},
                    "meta_app"
                )
                
            if not app_name:
                # Fallback to default app
                app_name = frappe.db.get_value("CRM Meta App", {"is_default": 1, "is_active": 1}, "name")
                
            if app_name:
                app_doc = frappe.get_doc("CRM Meta App", app_name)
                if app_doc.signature_validation:
                    secret = app_doc.get_password("app_secret")
                    if signature and secret:
                        # Validate signature
                        expected = hmac.new(
                            secret.encode("utf-8"),
                            payload_bytes,
                            hashlib.sha256
                        ).hexdigest()
                        
                        sig_hash = signature[7:] if signature.startswith("sha256=") else signature
                        if not hmac.compare_digest(expected, sig_hash):
                            log_doc.status = "Failed"
                            log_doc.response = "Invalid payload signature"
                            log_doc.http_status = 401
                            log_doc.save(ignore_permissions=True)
                            frappe.db.commit()
                            return _plain_response("Invalid signature", 401)
                    else:
                        log_doc.status = "Failed"
                        log_doc.response = "Signature validation enabled but App Secret or Signature header is missing"
                        log_doc.http_status = 401
                        log_doc.save(ignore_permissions=True)
                        frappe.db.commit()
                        return _plain_response("Invalid signature", 401)
            
            log_doc.status = "Verified"
            log_doc.save(ignore_permissions=True)
            frappe.db.commit()
            
            # Enqueue parsing payload in background worker queue to avoid HTTP timeouts
            frappe.enqueue(
                "company.company.crm_meta_api.enqueue_webhook_lead_processing",
                queue="default",
                payload_data=data,
                webhook_log_name=log_doc.name
            )
            
            # Return HTTP 200 immediately
            log_doc.response = "Webhook payload enqueued successfully"
            log_doc.execution_time = (datetime.now() - start_time).total_seconds()
            log_doc.save(ignore_permissions=True)
            frappe.db.commit()
            return _plain_response("Success", 200)
            
        except Exception as e:
            logger.error(f"Error handling webhook: {str(e)}")
            log_doc.status = "Failed"
            log_doc.response = str(e)
            log_doc.http_status = 400
            log_doc.execution_time = (datetime.now() - start_time).total_seconds()
            log_doc.save(ignore_permissions=True)
            frappe.db.commit()
            return _plain_response(str(e), 400)

    return _plain_response("Method Not Allowed", status=405)


def enqueue_webhook_lead_processing(payload_data, webhook_log_name):
    """
    Extracts individual leads from incoming payload data, creates CRM Meta Lead
    and enqueues background worker job to retrieve Meta Lead details and save to Lead.
    """
    # Always run as Administrator - webhook is unauthenticated so session user is Guest
    frappe.set_user("Administrator")
    logger = get_logger()
    try:
        entries = payload_data.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                val = change.get("value", {})
                lead_id = val.get("leadgen_id")
                form_id = val.get("form_id")
                
                if not lead_id or not form_id:
                    continue
                
                # Check if CRM Meta Lead record already exists
                if frappe.db.exists("CRM Meta Lead", lead_id):
                    logger.info(f"Meta Lead ID {lead_id} already exists. Skipping import.")
                    continue
                
                # Find associated Page and App using Form ID (filter by form_id field, not document name)
                form_name = frappe.db.get_value("CRM Meta Form", {"form_id": form_id}, "name")
                page_name = frappe.db.get_value("CRM Meta Form", {"form_id": form_id}, "meta_page") if form_name else None
                app_name = frappe.db.get_value("CRM Meta Page", page_name, "meta_app") if page_name else None
                
                # Initialize Raw Lead audit record
                lead_audit = frappe.get_doc({
                    "doctype": "CRM Meta Lead",
                    "meta_lead_id": lead_id,
                    "meta_app": app_name,
                    "meta_page": page_name,
                    "meta_form": form_name,  # Link field needs document name, not numeric form_id
                    "webhook_payload": json.dumps(payload_data, indent=2),
                    "received_time": datetime.now(),
                    "processing_status": "Pending"
                })
                lead_audit.insert(ignore_permissions=True)
                
                # Create queue job tracker record
                queue_doc = frappe.get_doc({
                    "doctype": "CRM Meta Queue",
                    "meta_lead": lead_audit.name,
                    "status": "Queued",
                    "attempts": 0
                })
                queue_doc.insert(ignore_permissions=True)
                frappe.db.commit()
                
                # Enqueue processing pipeline
                job = frappe.enqueue(
                    "company.company.crm_meta_api.process_meta_lead_job",
                    queue="default",
                    meta_lead_name=lead_audit.name,
                    queue_job_name=queue_doc.name
                )
                
                # Save Job ID
                queue_doc.job_id = job.id
                queue_doc.save(ignore_permissions=True)
                frappe.db.commit()
                
    except Exception as e:
        logger.error(f"Error enqueuing webhook entries: {str(e)}")


def process_meta_lead_job(meta_lead_name, queue_job_name):
    """
    Background worker task to fetch lead details using Page Access Token,
    runs duplicate checking, maps fields, and creates a CRM Lead.
    """
    # Always run as Administrator - webhook is unauthenticated so session user is Guest
    frappe.set_user("Administrator")
    logger = get_logger()
    
    lead_audit = frappe.get_doc("CRM Meta Lead", meta_lead_name)
    queue_job = frappe.get_doc("CRM Meta Queue", queue_job_name)
    
    queue_job.started = datetime.now()
    queue_job.status = "Processing"
    queue_job.attempts += 1
    queue_job.save(ignore_permissions=True)
    frappe.db.commit()
    
    try:
        if not lead_audit.meta_form:
            raise ValueError(f"No Meta Form linked to Lead ID {lead_audit.meta_lead_id}")
            
        form_doc = frappe.get_doc("CRM Meta Form", lead_audit.meta_form)
        page_doc = frappe.get_doc("CRM Meta Page", form_doc.meta_page)
        
        access_token = page_doc.page_access_token
        if not access_token:
            raise ValueError(f"Page Access Token is not configured for Page ID: {page_doc.page_id}")
            
        # Fetch lead fields from Meta Graph API
        url = f"https://graph.facebook.com/v23.0/{lead_audit.meta_lead_id}"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        logger.info(f"Fetching Lead ID {lead_audit.meta_lead_id} from Meta Graph API...")
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            raise Exception(f"Facebook Graph API responded with status {response.status_code}: {response.text}")
            
        lead_data = response.json()
        lead_audit.lead_json = json.dumps(lead_data, indent=2)
        
        # Save Campaign/Ad metadata
        lead_audit.campaign_name = lead_data.get("campaign_name")
        lead_audit.ad_set_name = lead_data.get("ad_set_name")
        lead_audit.ad_name = lead_data.get("ad_name")
        
        # Parse fields from API response
        field_data = {}
        for entry in lead_data.get("field_data", []):
            name = entry.get("name")
            values = entry.get("values", [])
            if name and values:
                field_data[name] = values[0]
                
        # Load form field mappings
        default_dict = {}
        mapping_dict = {}
        for mapping in form_doc.field_mappings:
            if mapping.meta_field:
                mapping_dict[mapping.meta_field] = {
                    "crm_field": mapping.crm_field,
                    "transform": mapping.transform_function
                }
            if mapping.default_value:
                default_dict[mapping.crm_field] = mapping.default_value
                
        # Transform and populate values
        extracted_data = {}
        custom_questions = []
        
        for name, val in field_data.items():
            val = "" if val is None else str(val).strip()
            
            # Remove HTML XSS tags from value
            val = val.replace("<", "").replace(">", "").strip()
            
            if name in mapping_dict:
                mapping_info = mapping_dict[name]
                crm_field = mapping_info["crm_field"]
                transform = mapping_info["transform"]
                
                # Apply transforms
                if transform == "Title Case":
                    val = val.title()
                elif transform == "Upper Case":
                    val = val.upper()
                elif transform == "Lower Case":
                    val = val.lower()
                elif transform == "Clean Phone":
                    val = "".join(filter(str.isdigit, val))
                    if not val.startswith("+"):
                        val = "+" + val
                        
                extracted_data[crm_field] = val
            else:
                # Default matching heuristics for common fields
                if name in ("full_name", "first_name", "last_name", "name") and "lead_name" not in extracted_data:
                    extracted_data["lead_name"] = val
                elif name in ("email", "e-mail") and "email" not in extracted_data:
                    extracted_data["email"] = val
                elif name in ("phone", "phone_number") and "phone_number" not in extracted_data:
                    extracted_data["phone_number"] = val
                else:
                    custom_questions.append(f"{name}: {val}")
                    
        # Apply defaults
        for crm_fld, def_val in default_dict.items():
            if not extracted_data.get(crm_fld):
                extracted_data[crm_fld] = def_val
                
        # Format name fallback
        lead_name = extracted_data.get("lead_name")
        if not lead_name:
            lead_name = f"Meta Lead {lead_audit.meta_lead_id}"
        extracted_data["lead_name"] = lead_name
        
        email = extracted_data.get("email")
        phone = extracted_data.get("phone_number")
        remarks_str = "\n".join(custom_questions) if custom_questions else ""
        
        # DUPLICATE RULES ENGINE CHECK
        duplicate_lead = None
        
        # Rule 1: Check by meta_lead_id audit logs
        existing_imported = frappe.db.get_value("CRM Meta Lead", {"meta_lead_id": lead_audit.meta_lead_id, "processing_status": "Success"}, "created_lead")
        if existing_imported:
            duplicate_lead = existing_imported
            
        # Rule 2: Check by case-insensitive Email
        if not duplicate_lead and email:
            clean_email = email.lower().strip()
            duplicate_lead = frappe.db.get_value("Lead", {"email": clean_email}, "name")
            
        # Rule 3: Check by Phone Number (matching last 10 digits)
        if not duplicate_lead and phone:
            clean_phone = "".join(filter(str.isdigit, phone))
            if len(clean_phone) >= 10:
                last_10_digits = clean_phone[-10:]
                
                # Check parent field
                duplicate_lead = frappe.db.sql("""
                    SELECT name FROM `tabLead`
                    WHERE RIGHT(REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', ''), 10) = %s
                    LIMIT 1
                """, (last_10_digits,), as_dict=False)
                
                if duplicate_lead:
                    duplicate_lead = duplicate_lead[0][0]
                else:
                    # Check child table
                    duplicate_lead = frappe.db.sql("""
                        SELECT lp.parent FROM `tabLead Phone` lp
                        WHERE RIGHT(REPLACE(REPLACE(REPLACE(lp.phone, ' ', ''), '-', ''), '+', ''), 10) = %s
                        LIMIT 1
                    """, (last_10_digits,), as_dict=False)
                    if duplicate_lead:
                        duplicate_lead = duplicate_lead[0][0]
                        
        if duplicate_lead:
            # Raise exception to fail processing and log duplicate
            lead_audit.processing_status = "Duplicate"
            raise Exception(f"Duplicate Lead found: Lead already exists with same email or phone: {duplicate_lead}")
            
        # Validate phone formatting fallback
        is_phone_valid = False
        if phone:
            try:
                frappe.utils.validate_phone_number_with_country_code(phone, "phone_number")
                is_phone_valid = True
            except Exception:
                is_phone_valid = False
                
        if not phone or not is_phone_valid:
            phone = "+919999999999"
            extracted_data["phone_number"] = phone
            
        # Validate Country link
        country = extracted_data.get("country")
        if country and not frappe.db.exists("Country", country):
            extracted_data["country"] = None
            
        # Create Lead DocType
        lead_fields = {
            "doctype": "Lead",
            "leads_from": form_doc.lead_source or "Meta Lead Ads",
            "leads_type": form_doc.lead_type or "Incoming",
            "status": "Not Converted",
            "remarks": f"Source: Meta Lead Ads (Form ID: {form_doc.form_id})\n{remarks_str}".strip()
        }
        
        for fld, val in extracted_data.items():
            if fld not in ("phone_numbers", "emails", "phone_number") and val:
                lead_fields[fld] = val
                
        lead_doc = frappe.get_doc(lead_fields)
        
        if phone:
            lead_doc.append("phone_numbers", {"phone": phone})
        if email:
            lead_doc.append("emails", {"email": email})
            
        lead_doc.insert(ignore_permissions=True)
        
        lead_audit.created_lead = lead_doc.name
        lead_audit.processing_status = "Success"
        lead_audit.error_message = ""
        lead_audit.processed_time = datetime.now()
        
        queue_job.status = "Completed"
        queue_job.completed = datetime.now()
        queue_job.last_error = ""
        
        logger.info(f"Successfully processed Meta Lead {lead_audit.meta_lead_id} -> Lead: {lead_doc.name}")
        
    except Exception as e:
        logger.error(f"Error processing Meta Lead: {str(e)}")
        
        if lead_audit.processing_status != "Duplicate":
            lead_audit.processing_status = "Failed"
            
        lead_audit.error_message = str(e)
        lead_audit.processed_time = datetime.now()
        
        queue_job.status = "Failed"
        queue_job.completed = datetime.now()
        queue_job.last_error = str(e)
        
    finally:
        lead_audit.save(ignore_permissions=True)
        queue_job.save(ignore_permissions=True)
        frappe.db.commit()
